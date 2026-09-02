import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { AppHeader } from '../components/AppHeader'
import { BackLink } from '../components/BackLink'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useStreakCelebration } from '../components/StreakCelebrationContext'
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
import { formatCalendarDate } from '../lib/formatDate'
import { plural } from '../lib/plural'
import { queryKeys, useFlashcardDeck } from '../lib/queries'
import { queryClient } from '../lib/queryClient'
import { useSessionTimer } from '../lib/useSessionTimer'
import { DASHBOARD_BACK, useBackLink } from '../lib/backTrail'
import type { BackTarget } from '../lib/backTrail'
import { newSeed, shuffled, SHUFFLE_PARAM } from '../lib/shuffle'
import { api } from '../api'
import type { FlashcardDeck, ReviewDeckResponse, ReviewRating, UserDetails } from '../api'

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
 * The backend needs a rating to reschedule the deck, so a finished run ends by
 * asking for one. The wording describes the run that just happened; what each
 * answer does to the schedule is the backend's arithmetic, not ours to predict.
 */
const RATINGS: {
  value: ReviewRating
  label: string
  hint: string
  tone: string
  labelTone: string
}[] = [
  {
    value: 'AGAIN',
    label: 'Rough',
    hint: 'Hardly any of it stuck',
    tone: 'border-error-solid/25 bg-error-soft/60 hover:border-error-solid/60 hover:bg-error-soft',
    labelTone: 'text-error-solid',
  },
  {
    value: 'HARD',
    label: 'Hard',
    hint: 'I had to work for the answers',
    tone:
      'border-warning-solid/25 bg-warning-soft/60 hover:border-warning-solid/60 hover:bg-warning-soft',
    labelTone: 'text-warning-solid',
  },
  {
    value: 'GOOD',
    label: 'Good',
    hint: 'I recalled most of them',
    tone:
      'border-accent-solid/25 bg-accent-soft/60 hover:border-accent-solid/60 hover:bg-accent-soft',
    labelTone: 'text-accent-strong',
  },
  {
    value: 'EASY',
    label: 'Easy',
    hint: 'They came straight back to me',
    tone:
      'border-success-solid/25 bg-success-soft/60 hover:border-success-solid/60 hover:bg-success-soft',
    labelTone: 'text-success-solid',
  },
]

type Phase = 'playing' | 'rating' | 'summary'

/** A held-up exit: where it was headed, and the trail state that goes with it. */
type PendingExit = { to: string; state?: Record<string, BackTarget[]> }

const LEAVE_TITLE = 'Leave this deck?'
const LEAVE_BODY =
  'The deck is still in progress. Your place in this session will be lost and the session will not count toward your streak.'
/** The cards are done, but an unrated run is still an unrecorded one. */
const LEAVE_UNRATED_BODY =
  'This session has not been saved yet. Leaving without rating it means it will not count toward your streak, and the deck keeps its current review date.'

function PlaySkeleton() {
  return (
    <div className="grid gap-6" aria-hidden="true">
      <span className="block h-4 w-40 animate-pulse rounded-full bg-surface-alt" />
      <span className="block h-80 w-full animate-pulse rounded-lg bg-surface-alt" />
    </div>
  )
}

function Player({ deck, isShuffled }: { deck: FlashcardDeck; isShuffled: boolean }) {
  const navigate = useNavigate()
  const { recordQualifyingAction } = useStreakCelebration()
  // The page only mounts this once it knows the deck holds cards, so no fallback
  // array is built here — a fresh one each render would defeat the memo below.
  const cards = deck.flashcards

  // Starts when the run does and pauses while the tab is hidden, so what is
  // reported is time actually spent on the cards.
  const elapsedSeconds = useSessionTimer()
  /**
   * The run's length, frozen the moment the last card was finished. The review
   * is sent from the rating screen, and how long someone spends choosing a
   * rating is not study time.
   */
  const sessionSeconds = useRef<number | null>(null)

  const [seed, setSeed] = useState(newSeed)
  const [index, setIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [phase, setPhase] = useState<Phase>('playing')
  const [closingNote, setClosingNote] = useState(drawClosingNote)
  /** The recorded review for this visit, kept so a replay does not send another. */
  const [reviewResult, setReviewResult] = useState<ReviewDeckResponse | null>(null)
  const [isRepeatRun, setIsRepeatRun] = useState(false)

  /** Where a confirmed exit goes. Null means no exit is pending. */
  const [pendingExit, setPendingExit] = useState<PendingExit | null>(null)
  // Read by the popstate listener, which must not close over stale state.
  const isGuarding = useRef(true)

  // A new seed on replay deals a fresh order rather than the same one again.
  const order = useMemo(
    () => (isShuffled ? shuffled(cards, seed) : cards),
    [cards, isShuffled, seed],
  )

  const card = order[index]
  const isFirst = index === 0
  const isLast = index >= order.length - 1
  const deckHref = `/flashcards/${deck.deckId}`
  /** The deck this run belongs to, for anyone who opened the run directly. */
  const deckBack = useMemo(() => ({ to: deckHref, label: 'deck overview' }), [deckHref])
  // Every way out of a guarded run — the back link, the browser's Back button,
  // the exit dialog — has to agree on one destination, so they all read the
  // same resolved back link.
  const back = useBackLink(deckBack)

  // The last card ends the run by asking how it went, rather than ending it
  // underneath someone who only meant to keep paging: the rating screen still
  // offers a way back into the deck.
  const goNext = useCallback(() => {
    if (isLast) {
      setClosingNote(drawClosingNote())
      // A replay within the same visit is not sent again. The review endpoint
      // is not repeatable: a second call would push the due date out again and
      // count every card a second time.
      if (reviewResult) {
        isGuarding.current = false
        setIsRepeatRun(true)
        setPhase('summary')
        return
      }
      sessionSeconds.current = elapsedSeconds()
      setPhase('rating')
      return
    }
    setIndex((current) => current + 1)
    setIsRevealed(false)
  }, [elapsedSeconds, isLast, reviewResult])

  // Stepping back re-hides the answer, so a revisited card is asked again
  // rather than handed straight over.
  const goBack = useCallback(() => {
    if (isFirst) return
    setIndex((current) => current - 1)
    setIsRevealed(false)
  }, [isFirst])

  // Reaching the end and rating the run is what records it, both for the deck's
  // schedule and for the streak. It is a one-shot call, so a failure holds the
  // rating screen open to be retried rather than being swallowed.
  const review = useMutation({
    // One call per completed run, carrying the length frozen for that run. A
    // rejected review saves nothing at all, so retrying it re-sends the same
    // measured length rather than a second, longer session.
    mutationFn: (rating: ReviewRating) =>
      recordQualifyingAction(() =>
        api.flashcards.review(deck.deckId, rating, sessionSeconds.current ?? elapsedSeconds()),
      ),
    onSuccess: (result) => {
      // The run is recorded, so nothing is left to lose and the guard comes off.
      isGuarding.current = false
      setReviewResult(result)
      // The deck has left the review queue until its new due date.
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviewQueue })
      // Every analytics window now has one more session, and this run's cards
      // and duration, in it.
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics })
      // The response carries the user's new lifetime total, so the cached
      // profile is corrected from it instead of being fetched again.
      queryClient.setQueryData<UserDetails>(
        queryKeys.userDetails,
        (current) =>
          current && { ...current, totalFlashcardsReviewed: result.totalFlashcardsReviewed },
      )
      setPhase('summary')
    },
  })

  function restart() {
    // Only an unrecorded run has anything left to lose.
    isGuarding.current = reviewResult === null
    setSeed(newSeed())
    setIndex(0)
    setIsRevealed(false)
    setPhase('playing')
  }

  // Browser Back. One sentinel entry is pushed for the run, so the first Back
  // lands here instead of leaving. Pushing it is a mount-only job; the listener
  // is separate because it has to see the current back target.
  useEffect(() => {
    window.history.pushState({ deckGuard: true }, '')
  }, [])

  useEffect(() => {
    function onPopState() {
      if (!isGuarding.current) return
      // The sentinel that was just consumed is put straight back, and the
      // dialog asks rather than letting the run end silently.
      window.history.pushState({ deckGuard: true }, '')
      setPendingExit(back)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [back])

  // Reloading or closing the tab. The browser supplies its own wording here.
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!isGuarding.current) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  /** Returns false to hold the visitor here until they confirm. */
  const guardLeaving = useCallback((to: string, state?: PendingExit['state']) => {
    if (!isGuarding.current) return true
    setPendingExit({ to, state })
    return false
  }, [])

  function confirmExit() {
    isGuarding.current = false
    const destination = pendingExit ?? back
    setPendingExit(null)
    navigate(destination.to, { replace: true, state: destination.state })
  }

  // Space flips and the arrows step through the deck, so a run can be played
  // one-handed. Keys typed into a control belong to that control, so those are
  // left alone.
  useEffect(() => {
    // Only the cards themselves answer to the keyboard.
    if (phase !== 'playing') return
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
  }, [goBack, goNext, phase])

  // The rating screen still guards the exit, so this dialog belongs to both the
  // unfinished screens.
  const leaveDialog = pendingExit !== null && (
    <ConfirmDialog
      title={LEAVE_TITLE}
      body={phase === 'rating' ? LEAVE_UNRATED_BODY : LEAVE_BODY}
      confirmLabel="Leave deck"
      cancelLabel="Keep going"
      tone="danger"
      onConfirm={confirmExit}
      onCancel={() => setPendingExit(null)}
    />
  )

  if (phase === 'rating') {
    return (
      <>
        <AppHeader onLeave={() => guardLeaving('/dashboard')} />
        <main className={`${shell} pt-10 pb-20`}>
          <section className={`${surfaceCard} mx-auto max-w-160 p-8 text-center sm:p-10`}>
            <h1 className="text-3xl">How did that go?</h1>
            <p className="mx-auto mt-3 max-w-[46ch] text-base text-text-muted">
              You reached the end of all {plural(order.length, 'card')}. Your answer records the
              session and decides when “{deck.title}” comes back for review.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {RATINGS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-sm border px-5 py-4 transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-55 ${option.tone}`}
                  onClick={() => review.mutate(option.value)}
                  disabled={review.isPending}
                >
                  <span className={`text-base font-bold ${option.labelTone}`}>{option.label}</span>
                  <span className="text-sm text-text-muted">{option.hint}</span>
                </button>
              ))}
            </div>

            <p className="mt-4 h-5 text-sm font-bold text-text-muted" aria-live="polite">
              {review.isPending ? 'Saving your session…' : ''}
            </p>

            {review.isError && (
              <p
                className="mx-auto max-w-[46ch] text-sm font-bold text-error-solid"
                role="alert"
              >
                Your session could not be saved. {toFormMessage(review.error)}
              </p>
            )}

            <div className="mt-6">
              <button
                type="button"
                className={btnGhostLg}
                onClick={() => {
                  // A failed attempt is not carried back onto the next screen.
                  review.reset()
                  setPhase('playing')
                }}
                disabled={review.isPending}
              >
                <IconArrowLeft />
                Keep reviewing
              </button>
            </div>
          </section>
        </main>

        {leaveDialog}
      </>
    )
  }

  if (phase === 'summary') {
    return (
      <>
        <AppHeader onLeave={() => guardLeaving('/dashboard')} />
        <main className={`${shell} pt-10 pb-20`}>
          <section className={`${surfaceCard} mx-auto max-w-160 p-8 text-center sm:p-10`}>
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success-solid"
              aria-hidden="true"
            >
              <IconCheck className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-3xl">Deck complete</h1>
            <p className="mx-auto mt-3 max-w-[46ch] text-base text-text-muted">
              You worked through all {plural(order.length, 'card')} in “{deck.title}”.
              {isShuffled ? ' Replay to deal them in a new order.' : ''}
            </p>

            {reviewResult && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className={countPill}>You rated it {reviewResult.rating.toLowerCase()}</span>
                <span className={countPill}>
                  Back on {formatCalendarDate(reviewResult.nextReviewDate)}
                </span>
              </div>
            )}

            <p className="mx-auto mt-6 max-w-[44ch] rounded-md bg-accent-soft px-5 py-4 text-sm font-bold text-accent-strong">
              {closingNote}
            </p>

            {isRepeatRun && (
              <p className="mx-auto mt-4 max-w-[46ch] text-sm text-text-muted">
                Extra runs are not scheduled again, so this one kept the review you already saved.
              </p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" className={btnPrimaryLg} onClick={restart}>
                Play again
              </button>
              <BackLink fallback={deckBack} className={btnGhostLg} showIcon={false} />
            </div>
          </section>
        </main>
      </>
    )
  }

  const progress = Math.round(((index + 1) / order.length) * 100)

  return (
    <>
      <AppHeader onLeave={() => guardLeaving('/dashboard')} />
      <main className={`${shell} app-content-in pt-10 pb-20`}>
        <div className="mx-auto max-w-200">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-bold text-text tabular-nums">
              Card {index + 1} of {order.length}
            </p>
            {isShuffled && <span className={countPill}>Shuffled</span>}
            <BackLink
              fallback={deckBack}
              className={`${cardLink} ml-auto`}
              onLeave={guardLeaving}
            />
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
              <p className="min-w-0 max-w-[36ch] text-xl font-semibold text-balance text-text sm:text-2xl">
                {card.title}
              </p>
            </div>
            <div
              className="flashcard-face flashcard-face--back absolute inset-0 flex items-center justify-center rounded-lg bg-accent-solid p-8 text-center shadow-md transition-transform duration-500 sm:p-10"
              aria-hidden={!isRevealed}
            >
              <p className="min-w-0 max-w-[40ch] text-lg font-semibold text-balance text-on-accent sm:text-xl">
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
        </div>
      </main>

      {leaveDialog}
    </>
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

  if (deck.isSuccess && !isEmpty) {
    return <Player deck={deck.data} isShuffled={isShuffled} />
  }

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        {deck.isPending && <PlaySkeleton />}

        {deck.isError && (
          <div className={`${surfaceCard} app-content-in max-w-150 p-8`}>
            <h1 className="text-3xl">
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
              <BackLink fallback={DASHBOARD_BACK} className={cardLink} />
            </div>
          </div>
        )}

        {isEmpty && (
          <div className={`${surfaceCard} app-content-in max-w-150 p-8`}>
            <h1 className="text-3xl">There is nothing to play yet</h1>
            <p className="mt-3 text-base text-text-muted">
              “{deck.data.title}” has no cards. Add one and it will be waiting here.
            </p>
            <BackLink
              fallback={{ to: `/flashcards/${deck.data.deckId}`, label: 'deck overview' }}
              className={`${cardLink} mt-6`}
            />
          </div>
        )}
      </main>
    </>
  )
}
