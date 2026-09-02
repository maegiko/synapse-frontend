import { useCallback, useEffect, useRef, useState } from 'react'
import { AppLink } from './AppLink'
import { IconArrowLeft, IconArrowRight, IconCheck, IconDeck } from './icons'
import { btnGhostSm, btnPrimarySm, cardLink } from './ui'
import { calendarDaysFromToday, formatCalendarDate } from '../lib/formatDate'
import { plural } from '../lib/plural'
import { useUserTimeZone } from '../lib/queries'
import type { ReviewQueueDeck, ReviewRating } from '../api'

const RATING_BADGES: Record<ReviewRating, { label: string; className: string }> = {
  AGAIN: { label: 'ROUGH', className: 'bg-error-soft text-error-solid' },
  HARD: { label: 'HARD', className: 'bg-warning-soft text-warning-solid' },
  GOOD: { label: 'GOOD', className: 'bg-accent-soft text-accent-strong' },
  EASY: { label: 'EASY', className: 'bg-success-soft text-success-solid' },
}

/** The streak card's shape, so the two compact rows under the hero match. */
const COMPACT_CARD =
  'mt-6 rounded-md border border-border bg-surface px-4 py-3 shadow-sm sm:px-6 sm:py-4'

/**
 * One card's width as a share of the rail: one across on a phone, less 2rem so a
 * sliver of the next always shows, two on a tablet and three above that.
 */
const RAIL_ITEM =
  'min-w-0 shrink-0 basis-[calc(100%-2rem)] snap-start md:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]'

/** Absorbs the fractional `scrollLeft` browsers report at the ends. */
const EDGE_EPS = 2

const NAV_CIRCLE =
  'grid shrink-0 place-items-center rounded-full border border-border bg-surface text-accent-foreground shadow-sm transition-colors duration-150 ease-out hover:border-accent-solid/55 hover:bg-surface-alt/60 hover:text-accent-strong'

/**
 * Side controls appear only from 1200px, where the centred column finally leaves
 * room beside a card for a chevron. An absolute overlay, never layout, so showing
 * one cannot move the rail.
 */
const RAIL_NAV_SIDE =
  `${NAV_CIRCLE} absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 min-[1200px]:grid min-[1440px]:h-9 min-[1440px]:w-9`

/** `left` / `right` offset ramp lives in index.css (needs a `vw`-based clamp). */
const RAIL_NAV_SIDE_LEFT = 'rail-nav-left'
const RAIL_NAV_SIDE_RIGHT = 'rail-nav-right'

/**
 * Below-rail controls under 1200px, pinned to the rail's own ends. The
 * unavailable direction is disabled rather than removed, so neither button moves.
 */
const RAIL_NAV_BELOW =
  `${NAV_CIRCLE} h-9 w-9 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none`

/** Whether the rail can still scroll each way, so a chevron only shows when it can. */
function useRailOverflow(itemCount: number) {
  const railRef = useRef<HTMLUListElement>(null)
  const [overflow, setOverflow] = useState({ left: false, right: false })

  const sync = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setOverflow({
      left: el.scrollLeft > EDGE_EPS,
      right: el.scrollLeft < max - EDGE_EPS,
    })
  }, [])

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', sync)
      observer.disconnect()
    }
  }, [sync, itemCount])

  const scrollToStep = useCallback((direction: 1 | -1) => {
    const el = railRef.current
    if (!el) return
    const items = Array.from(el.children) as HTMLElement[]
    if (items.length === 0) return

    const railLeft = el.getBoundingClientRect().left
    const anchor = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0

    let currentIndex = 0
    let closest = Infinity
    items.forEach((item, index) => {
      const distance = Math.abs(item.getBoundingClientRect().left - railLeft - anchor)
      if (distance < closest) {
        closest = distance
        currentIndex = index
      }
    })

    const nextIndex = Math.min(Math.max(currentIndex + direction, 0), items.length - 1)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    items[nextIndex].scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      inline: 'start',
      block: 'nearest',
    })
  }, [])

  return { railRef, overflow, scrollToStep }
}

/**
 * The backend schedules in whole calendar days, so nothing here ticks. A future
 * date is defensive: the queue only carries decks already due.
 */
function dueLabel(nextReviewDate: string, timeZone: string): string {
  const days = calendarDaysFromToday(nextReviewDate, timeZone)
  if (days === null) return 'Due now'
  if (days > 0) return `Due ${formatCalendarDate(nextReviewDate)}`
  if (days === 0) return 'Due today'
  if (days === -1) return '1 day overdue'
  return `${-days} days overdue`
}

/**
 * One deck in the rail. The surface is inert, so only Review starts a session.
 * The first card is the next recommended review and is marked as such.
 */
function QueueCard({ deck, isNext }: { deck: ReviewQueueDeck; isNext: boolean }) {
  const timeZone = useUserTimeZone()
  const isEmpty = deck.cardCount === 0
  const to = isEmpty ? `/flashcards/${deck.deckId}` : `/flashcards/${deck.deckId}/play`
  const action = isEmpty ? 'Add cards' : isNext ? 'Review now' : 'Review'
  const daysFromToday = calendarDaysFromToday(deck.nextReviewDate, timeZone)
  const isOverdue = daysFromToday !== null && daysFromToday < 0
  const timing = isNext && daysFromToday === 0 ? 'Due now' : dueLabel(deck.nextReviewDate, timeZone)
  const lastRating = deck.lastRating ? RATING_BADGES[deck.lastRating] : null

  return (
    <li className={RAIL_ITEM}>
      <div
        className={`flex h-full flex-col overflow-hidden rounded-md border ${
          isNext ? 'border-accent-solid/40 bg-accent-soft/40' : 'border-border bg-surface'
        }`}
      >
        <div className="flex-1 p-4">
          <p
            className="rail-next-label mb-1.5 text-xs text-accent-strong"
            aria-hidden={isNext ? undefined : true}
          >
            {isNext ? 'Next up' : ' '}
          </p>

          <div className="flex min-w-0 items-start gap-3">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent-strong"
              aria-hidden="true"
            >
              <IconDeck className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p
                className="recents-title line-clamp-2 min-h-11 not-last:text-base leading-snug text-text"
                title={deck.title}
              >
                {deck.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-muted tabular-nums">
                  {plural(deck.cardCount, 'card')}
                </span>
                {lastRating && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${lastRating.className}`}
                  >
                    {lastRating.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`flex items-center justify-between gap-2 border-t px-4 py-2.5 ${
            isOverdue
              ? 'review-overdue-footer border-error-solid/25 bg-error-soft/60'
              : isNext
                ? 'border-accent-solid/20 bg-accent-soft/70'
                : 'border-border bg-surface-alt/50'
          }`}
        >
          <span
            className={`min-w-0 truncate text-xs tabular-nums ${
              isOverdue
                ? 'font-semibold text-error-solid'
                : isNext && daysFromToday === 0
                  ? 'rail-due-now text-accent-strong'
                  : 'text-text-muted'
            }`}
          >
            {timing}
          </span>
          <AppLink
            to={to}
            aria-label={`${action}: ${deck.title}`}
            className={`${btnPrimarySm} rail-review-btn shrink-0 gap-1.5 px-3 py-1.5 text-xs`}
          >
            {action}
            <IconArrowRight className="h-3.5 w-3.5" />
          </AppLink>
        </div>
      </div>
    </li>
  )
}

interface ReviewQueueProps {
  decks?: ReviewQueueDeck[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  hasDecks: boolean
}

/**
 * The spaced-repetition queue in the backend's order. It only takes the
 * dashboard's full width when something is actually due.
 */
export function ReviewQueue({ decks, isLoading, isError, onRetry, hasDecks }: ReviewQueueProps) {
  const due = decks ?? []
  const { railRef, overflow, scrollToStep } = useRailOverflow(due.length)

  if (isLoading) {
    return (
      <section className={`${COMPACT_CARD} flex items-center gap-4`} aria-label="Loading review queue">
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-sm bg-surface-alt sm:h-11 sm:w-11" />
        <div className="grid flex-1 gap-2">
          <span className="h-4 w-32 animate-pulse rounded-full bg-surface-alt" />
          <span className="h-3 w-64 max-w-full animate-pulse rounded-full bg-surface-alt" />
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className={`${COMPACT_CARD} app-content-in flex items-center gap-3`}>
        <div className="min-w-0 flex-1">
          <h2 className="text-base">Your review queue is unavailable</h2>
          <p className="mt-1 truncate text-xs text-text-muted">
            Everything else on your dashboard still works.
          </p>
        </div>
        <button type="button" className={`${btnGhostSm} shrink-0`} onClick={onRetry}>
          Try again
        </button>
      </section>
    )
  }

  if (due.length === 0) {
    if (!hasDecks) return null

    return (
      <section
        className={`${COMPACT_CARD} app-content-in flex items-center gap-3 sm:gap-5`}
        aria-labelledby="review-queue-heading"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-success-soft text-success-solid sm:h-11 sm:w-11">
          <IconCheck className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="review-queue-heading" className="truncate text-base sm:text-lg">
            You’re caught up
          </h2>
          <p className="mt-0.5 truncate text-xs text-text-muted sm:mt-1">
            No decks are due for review. The next one appears here on its review day.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="app-content-in mt-10" aria-labelledby="review-queue-heading">
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h2 id="review-queue-heading" className="text-xl">
          Review queue
        </h2>
        <p className="whitespace-nowrap text-sm text-text-muted tabular-nums">
          {plural(due.length, 'deck')} due
        </p>
        <AppLink to="/library?type=decks" className={`${cardLink} ml-auto shrink-0`}>
          All decks
          <IconArrowRight />
        </AppLink>
      </div>

      <div className="relative">
        <ul
          ref={railRef}
          className="scrollbar-none flex snap-x list-none gap-4 overflow-x-auto px-0.75 scroll-px-0.75"
        >
          {due.map((deck, position) => (
            <QueueCard key={deck.deckId} deck={deck} isNext={position === 0} />
          ))}
        </ul>

        {overflow.left && (
          <button
            type="button"
            aria-label="Previous review deck"
            onClick={() => scrollToStep(-1)}
            className={`${RAIL_NAV_SIDE} ${RAIL_NAV_SIDE_LEFT}`}
          >
            <IconArrowLeft className="h-4 w-4" />
          </button>
        )}
        {overflow.right && (
          <button
            type="button"
            aria-label="Next review deck"
            onClick={() => scrollToStep(1)}
            className={`${RAIL_NAV_SIDE} ${RAIL_NAV_SIDE_RIGHT}`}
          >
            <IconArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 flex justify-between min-[1200px]:hidden">
        <button
          type="button"
          aria-label="Previous review deck"
          disabled={!overflow.left}
          onClick={() => scrollToStep(-1)}
          className={RAIL_NAV_BELOW}
        >
          <IconArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next review deck"
          disabled={!overflow.right}
          onClick={() => scrollToStep(1)}
          className={RAIL_NAV_BELOW}
        >
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}
