import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { IconArrowLeft, IconArrowRight, IconCheck } from '../components/icons'
import {
  btnGhostLg,
  btnGhostSm,
  btnPrimaryLg,
  cardLink,
  countPill,
  shell,
  surfaceCard,
} from '../components/ui'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import { plural } from '../lib/plural'
import { useFlashcardDeck } from '../lib/queries'
import type { FlashcardDeck, SavedFlashcard } from '../api'

/** Set by the deck page's shuffle switch. Absent means saved order. */
export const SHUFFLE_PARAM = 'shuffle'

/** One is drawn at the end of every run, so finishing twice reads differently. */
const CLOSING_NOTES = [
  'Every card you turned over is a memory you just made easier to find.',
  'That is real study time banked. Future you is going to be grateful.',
  'Steady practice beats a panicked night before. You showed up today.',
  'Recall gets easier each time you ask it of yourself. That was practice well spent.',
  'You took the slower, better route to actually knowing this. Well done.',
  'Short sessions compound. This one counted.',
]

function drawClosingNote(): string {
  return CLOSING_NOTES[Math.floor(Math.random() * CLOSING_NOTES.length)]
}

/**
 * Confirms the end of a run. Modal, so it owns focus, the Escape key, and the
 * page's scrolling for as long as it is open.
 */
function FinishDialog({
  cardCount,
  onConfirm,
  onCancel,
}: {
  cardCount: number
  onConfirm: () => void
  onCancel: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    confirmRef.current?.focus()

    // Locking the page also removes its scrollbar, which would shift everything
    // sideways as the dialog opens; the freed width is padded back on.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const restore = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    }
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      document.body.style.overflow = restore.overflow
      document.body.style.paddingRight = restore.paddingRight
      previouslyFocused?.focus?.()
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }
      // Focus stays inside the dialog while it is open.
      if (event.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>('button')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div
      className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center bg-text/45 p-6 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        className={`${surfaceCard} dialog-panel w-full max-w-120 p-6 shadow-md sm:p-8`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-xl">
          That was the last card
        </h2>
        <p className="mt-2.5 max-w-[46ch] text-base text-text-muted">
          You have reached the end of all {plural(cardCount, 'card')}. Finish the session, or go
          back and keep reviewing.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" ref={confirmRef} className={btnPrimaryLg} onClick={onConfirm}>
            Finish session
          </button>
          <button type="button" className={btnGhostLg} onClick={onCancel}>
            Keep reviewing
          </button>
        </div>
      </div>
    </div>
  )
}

/** mulberry32: a seeded generator, so one seed always deals the same order. */
function randomFrom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Fisher-Yates on a copy, so the query cache's array is never reordered. The
 * shuffle is seeded rather than free: `useMemo` may drop its cache at any time,
 * and a re-shuffle mid-run would repeat cards and skip others.
 */
function shuffled(cards: SavedFlashcard[], seed: number): SavedFlashcard[] {
  const random = randomFrom(seed)
  const copy = [...cards]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function PlaySkeleton() {
  return (
    <div className="grid gap-6" aria-hidden="true">
      <span className="block h-4 w-40 animate-pulse rounded-full bg-surface-alt" />
      <span className="block h-80 w-full animate-pulse rounded-lg bg-surface-alt" />
    </div>
  )
}

function Player({ deck, isShuffled }: { deck: FlashcardDeck; isShuffled: boolean }) {
  // The page only mounts this once it knows the deck holds cards, so no fallback
  // array is built here — a fresh one each render would defeat the memo below.
  const cards = deck.flashcards

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 32))
  const [index, setIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [closingNote, setClosingNote] = useState(drawClosingNote)

  // A new seed on replay deals a fresh order rather than the same one again.
  const order = useMemo(
    () => (isShuffled ? shuffled(cards, seed) : cards),
    [cards, isShuffled, seed],
  )

  const card = order[index]
  const isFirst = index === 0
  const isLast = index >= order.length - 1

  // The last card asks before ending the run, rather than ending it underneath
  // someone who only meant to keep paging.
  const goNext = useCallback(() => {
    if (isLast) {
      setIsConfirmingFinish(true)
      return
    }
    setIndex((current) => current + 1)
    setIsRevealed(false)
  }, [isLast])

  // Stepping back re-hides the answer, so a revisited card is asked again
  // rather than handed straight over.
  const goBack = useCallback(() => {
    if (isFirst) return
    setIndex((current) => current - 1)
    setIsRevealed(false)
  }, [isFirst])

  function finishSession() {
    setClosingNote(drawClosingNote())
    setIsConfirmingFinish(false)
    setIsFinished(true)
  }

  function restart() {
    setSeed(Math.floor(Math.random() * 2 ** 32))
    setIndex(0)
    setIsRevealed(false)
    setIsFinished(false)
  }

  // Space flips and the arrows step through the deck, so a run can be played
  // one-handed. Keys typed into a control belong to that control, so those are
  // left alone.
  useEffect(() => {
    // While the dialog is open it owns the keyboard.
    if (isFinished || isConfirmingFinish) return
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('button, a, input, textarea, select')) return
      if (event.key === ' ') {
        event.preventDefault()
        setIsRevealed((current) => !current)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goBack()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goBack, goNext, isConfirmingFinish, isFinished])

  if (isFinished) {
    return (
      <section className={`${surfaceCard} mx-auto max-w-160 p-8 text-center sm:p-10`}>
        <span
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success-solid"
          aria-hidden="true"
        >
          <IconCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl">Deck complete</h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-base text-text-muted">
          You worked through all {plural(order.length, 'card')} in “{deck.title}”.
          {isShuffled ? ' Replay to deal them in a new order.' : ''}
        </p>
        <p className="mx-auto mt-6 max-w-[44ch] rounded-md bg-accent-soft px-5 py-4 text-sm font-bold text-accent-strong">
          {closingNote}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className={btnPrimaryLg} onClick={restart}>
            Play again
          </button>
          <Link to={`/flashcards/${deck.deckId}`} className={btnGhostLg}>
            <IconArrowLeft />
            Back to the deck
          </Link>
        </div>
      </section>
    )
  }

  const progress = Math.round(((index + 1) / order.length) * 100)

  return (
    <div className="mx-auto max-w-200">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-bold text-text tabular-nums">
          Card {index + 1} of {order.length}
        </p>
        {isShuffled && <span className={countPill}>Shuffled</span>}
        <Link to={`/flashcards/${deck.deckId}`} className={`${cardLink} ml-auto`}>
          <IconArrowLeft />
          Back to the deck
        </Link>
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={order.length}
        aria-valuenow={index + 1}
        aria-label="Cards played"
      >
        <div
          className="h-full rounded-full bg-accent-solid transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className={`flashcard relative mt-7 h-80 sm:h-96 ${isRevealed ? 'flashcard--revealed' : ''}`}
        aria-live="polite"
      >
        {/* Only the face in view is exposed, so the hidden side is not read out. */}
        <div
          className="flashcard-face flashcard-face--front absolute inset-0 flex items-center justify-center rounded-lg border border-border bg-surface-alt p-8 text-center shadow-sm transition-transform duration-500 sm:p-10"
          aria-hidden={isRevealed}
        >
          <p className="max-w-[36ch] text-xl font-semibold text-balance text-text sm:text-2xl">
            {card.title}
          </p>
        </div>
        <div
          className="flashcard-face flashcard-face--back absolute inset-0 flex items-center justify-center rounded-lg bg-accent-solid p-8 text-center shadow-md transition-transform duration-500 sm:p-10"
          aria-hidden={!isRevealed}
        >
          <p className="max-w-[40ch] text-lg font-semibold text-balance text-on-accent sm:text-xl">
            {card.answer}
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          className={`${btnGhostLg} disabled:cursor-not-allowed disabled:opacity-45`}
          onClick={goBack}
          disabled={isFirst}
        >
          <IconArrowLeft />
          Previous
        </button>
        <button
          type="button"
          className={isRevealed ? btnGhostLg : btnPrimaryLg}
          onClick={() => setIsRevealed((current) => !current)}
        >
          {isRevealed ? 'Hide answer' : 'Show answer'}
        </button>
        <button
          type="button"
          className={isRevealed ? btnPrimaryLg : btnGhostLg}
          onClick={goNext}
        >
          {isLast ? 'Finish' : 'Next card'}
          <IconArrowRight />
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-text-muted">
        Space flips the card, ← and → step between cards.
      </p>

      {isConfirmingFinish && (
        <FinishDialog
          cardCount={order.length}
          onConfirm={finishSession}
          onCancel={() => setIsConfirmingFinish(false)}
        />
      )}
    </div>
  )
}

/** Studying one deck, a card at a time. */
export function PlayDeckPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const [searchParams] = useSearchParams()
  const deck = useFlashcardDeck(deckId)

  const isShuffled = searchParams.get(SHUFFLE_PARAM) === '1'
  const isMissing = isStatus(deck.error, 404)
  const isEmpty = deck.isSuccess && (deck.data.flashcards ?? []).length === 0

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        {deck.isPending && <PlaySkeleton />}

        {deck.isError && (
          <div className={`${surfaceCard} max-w-150 p-8`}>
            <h1 className="text-2xl">
              {isMissing ? 'We could not find that deck' : 'We could not load that deck'}
            </h1>
            <p className="mt-3 text-base text-text-muted">
              {isMissing
                ? 'It may have been deleted, or it belongs to another account.'
                : toFormMessage(deck.error)}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!isMissing && (
                <button type="button" className={btnGhostSm} onClick={() => void deck.refetch()}>
                  Try again
                </button>
              )}
              <Link to="/dashboard" className={cardLink}>
                <IconArrowLeft />
                Back to dashboard
              </Link>
            </div>
          </div>
        )}

        {isEmpty && (
          <div className={`${surfaceCard} max-w-150 p-8`}>
            <h1 className="text-2xl">There is nothing to play yet</h1>
            <p className="mt-3 text-base text-text-muted">
              “{deck.data.title}” has no cards. Add one and it will be waiting here.
            </p>
            <Link to={`/flashcards/${deck.data.deckId}`} className={`${cardLink} mt-6`}>
              <IconArrowLeft />
              Back to the deck
            </Link>
          </div>
        )}

        {deck.isSuccess && !isEmpty && <Player deck={deck.data} isShuffled={isShuffled} />}
      </main>
    </>
  )
}
