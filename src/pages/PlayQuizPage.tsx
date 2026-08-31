import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { AppHeader } from '../components/AppHeader'
import { BackLink } from '../components/BackLink'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { IconArrowRight, IconCheck } from '../components/icons'
import { StarRating } from '../components/StarRating'
import { useStreakCelebration } from '../components/StreakCelebrationContext'
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
import { queryKeys, useQuiz } from '../lib/queries'
import { queryClient } from '../lib/queryClient'
import { useSessionTimer } from '../lib/useSessionTimer'
import { DASHBOARD_BACK, useBackLink } from '../lib/backTrail'
import type { BackTarget } from '../lib/backTrail'
import { newSeed, shuffled, SHUFFLE_PARAM } from '../lib/shuffle'
import { api } from '../api'
import type { Quiz, QuizQuestion } from '../api'

/** Each band stays encouraging without claiming a result that the score contradicts. */
const CLOSING_NOTES = {
  perfect: [
    'A perfect run. You knew every answer and backed it up under pressure.',
    'Every question, exactly right. That consistency is paying off.',
    'Full marks. Clear recall from start to finish. Brilliant work.',
    'Nothing slipped past you this time. That is mastery in motion.',
  ],
  strong: [
    'That was a strong run. A quick look at the few misses will make it even sharper.',
    'You have a firm grip on this material. The last details are within reach.',
    'Excellent recall. Review the small gaps and you will be hard to catch next time.',
    'Most of this is already sticking. One focused pass can close the rest.',
  ],
  developing: [
    'You have built a solid base. The questions you missed point straight to the next win.',
    'Good progress. There is plenty here you already know, and a clear path forward.',
    'This attempt moved you forward. Review the gaps, then come back stronger.',
    'You are getting there. Each revisit will make these answers easier to reach.',
  ],
  starting: [
    'This was a useful first pass. Every missed question now guides what to study next.',
    'Starting is progress. Review a few key ideas and watch the next score climb.',
    'You did the brave part, testing what you know. Now you have a clear place to begin.',
    'One honest attempt gives you more direction than another passive read. Keep going.',
  ],
} as const

function drawClosingNote(score: number, total: number): string {
  const percent = (score / Math.max(total, 1)) * 100
  const notes =
    percent === 100
      ? CLOSING_NOTES.perfect
      : percent >= 80
        ? CLOSING_NOTES.strong
        : percent >= 50
          ? CLOSING_NOTES.developing
          : CLOSING_NOTES.starting
  return notes[Math.floor(Math.random() * notes.length)]
}

const LEAVE_TITLE = 'Leave this quiz?'
const LEAVE_BODY =
  'The quiz is still in progress. Your answers so far will be lost and no score will be saved.'

type Phase = 'playing' | 'rating' | 'summary'

/** What one finished attempt sends: the score, and how long it took. */
interface SavedAttempt {
  score: number
  durationSeconds: number
}

function PlaySkeleton() {
  return (
    <div className="mx-auto grid max-w-200 gap-6" aria-hidden="true">
      <span className="block h-4 w-40 animate-pulse rounded-full bg-surface-alt" />
      <span className="block h-96 w-full animate-pulse rounded-lg bg-surface-alt" />
    </div>
  )
}

/** A held-up exit: where it was headed, and the trail state that goes with it. */
type PendingExit = { to: string; state?: Record<string, BackTarget[]> }

interface QuestionCardProps {
  question: QuizQuestion
  position: number
  total: number
  isShuffled: boolean
  /** Advances the run. `wasCorrect` feeds the running score. */
  onAnswered: (wasCorrect: boolean) => void
  isLastQuestion: boolean
  /** Where the back link lands for anyone who opened the run directly. */
  quizBack: BackTarget
  /** Returns false to hold the visitor here until they confirm leaving. */
  guardLeaving: (to: string, state?: PendingExit['state']) => boolean
}

function QuestionCard({
  question,
  position,
  total,
  isShuffled,
  onAnswered,
  isLastQuestion,
  quizBack,
  guardLeaving,
}: QuestionCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const answers = question.answers ?? []
  const selected = answers.find((answer) => answer.id === selectedId)
  const wasCorrect = Boolean(selected?.correct)
  const progress = Math.round((position / total) * 100)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitted) {
      onAnswered(wasCorrect)
      return
    }
    // Answering is a deliberate act: a choice must be made, and Submit pressed.
    if (!selectedId) {
      setError('Choose an answer first.')
      return
    }
    setError('')
    setSubmitted(true)
  }

  return (
    <form className="mx-auto max-w-200" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-bold text-text tabular-nums">
          Question {position} of {total}
        </p>
        {isShuffled && <span className={countPill}>Shuffled</span>}
        <BackLink fallback={quizBack} className={`${cardLink} ml-auto`} onLeave={guardLeaving} />
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={position}
        aria-label="Questions answered"
      >
        <div
          className="h-full rounded-full bg-accent-solid transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={`${surfaceCard} mt-7 p-6 sm:p-8`}>
        <h1 className="max-w-[60ch] text-xl font-semibold text-text sm:text-2xl">{question.text}</h1>

        <fieldset className="m-0 mt-6 border-0 p-0" disabled={submitted}>
          <legend className="sr-only">Answers</legend>
          <div className="grid gap-3">
            {answers.map((answer) => {
              const isChosen = answer.id === selectedId
              // Correctness is disclosed only once the answer is committed.
              const showAsCorrect = submitted && answer.correct
              const showAsWrong = submitted && isChosen && !answer.correct

              return (
                <label
                  key={answer.id}
                  className={`relative flex cursor-pointer items-center gap-3.5 rounded-md border px-4.5 py-4 text-base transition-colors duration-150 ${
                    showAsCorrect
                      ? 'border-success-solid bg-success-soft font-bold text-success-solid'
                      : showAsWrong
                        ? 'border-error-solid bg-error-soft font-bold text-error-solid'
                        : isChosen
                          ? 'border-accent-solid bg-accent-soft font-bold text-accent-strong'
                          : 'border-border bg-surface text-text hover:border-accent-solid'
                  } ${submitted ? 'cursor-default' : ''}`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    className="sr-only"
                    checked={isChosen}
                    onChange={() => {
                      setSelectedId(answer.id)
                      setError('')
                    }}
                  />
                  <span
                    className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full border-2 ${
                      showAsCorrect
                        ? 'border-success-solid bg-success-solid text-on-status'
                        : showAsWrong
                          ? 'border-error-solid bg-error-solid text-on-status'
                          : isChosen
                            ? 'border-accent-solid bg-accent-solid text-on-accent'
                            : 'border-border'
                    }`}
                    aria-hidden="true"
                  >
                    {showAsCorrect && <IconCheck className="h-3.5 w-3.5" />}
                    {showAsWrong && <span className="text-xs leading-none font-bold">✕</span>}
                  </span>
                  <span className="max-w-[56ch]">{answer.text}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        {error && (
          <p className="mt-4 text-sm font-bold text-error-solid" role="alert">
            {error}
          </p>
        )}

        {submitted && (
          <p
            className={`mt-6 rounded-md px-4.5 py-3.5 text-sm font-bold ${
              wasCorrect
                ? 'bg-success-soft text-success-solid'
                : 'bg-error-soft text-error-solid'
            }`}
            role="status"
          >
            {wasCorrect ? 'Correct.' : 'Not this time. The right answer is marked above.'}
          </p>
        )}
      </div>

      <div className="mt-7 flex justify-center">
        <button type="submit" className={btnPrimaryLg}>
          {!submitted ? 'Submit answer' : isLastQuestion ? 'See results' : 'Next question'}
          {submitted && <IconArrowRight />}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-text-muted">
        {submitted
          ? 'Answers are locked in once submitted.'
          : 'Pick an answer, then submit it. You cannot come back to this question.'}
      </p>
    </form>
  )
}

function Runner({
  quiz,
  isShuffled,
  onRetake,
}: {
  quiz: Quiz
  isShuffled: boolean
  onRetake: () => void
}) {
  const navigate = useNavigate()
  const { recordQualifyingAction } = useStreakCelebration()
  const questions = quiz.questions

  // Starts when the attempt does and pauses while the tab is hidden, so what is
  // reported is time actually spent answering.
  const elapsedSeconds = useSessionTimer()

  const [seed] = useState(newSeed)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<Phase>('playing')
  // Seeded with the quiz's current difficulty, so the stars show where it stands.
  const [rating, setRating] = useState(quiz.difficulty ?? 0)
  /** Only what was rated in this attempt, which is what the summary may claim. */
  const [savedRating, setSavedRating] = useState<number | null>(null)
  const [closingNote, setClosingNote] = useState('')
  const [saveError, setSaveError] = useState('')

  /** Where a confirmed exit goes. Null means no exit is pending. */
  const [pendingExit, setPendingExit] = useState<PendingExit | null>(null)
  // Read by the popstate listener, which must not close over stale state.
  const isGuarding = useRef(true)

  const order = useMemo(() => {
    const asked = isShuffled ? shuffled(questions, seed) : questions
    return asked.map((question, position) => {
      // Generation puts the correct answer first on every multiple-choice
      // question, so leaving the saved order would let position alone give the
      // answer away. This runs on every attempt, whatever the shuffle toggle
      // says: that switch reorders questions, not the answers within them.
      // True/false is left alone — its correct answer already moves, and
      // scrambling it would only put "False" above "True".
      if (question.questionType === 'BOOLEAN') return question
      return { ...question, answers: shuffled(question.answers, seed + position + 1) }
    })
  }, [questions, isShuffled, seed])

  const quizHref = `/quiz/${quiz.id}`
  /** The quiz this attempt belongs to, for anyone who opened the run directly. */
  const quizBack = useMemo(() => ({ to: quizHref, label: 'quiz overview' }), [quizHref])
  // Every way out of a guarded run — the back link, the browser's Back button,
  // the exit dialog — has to agree on one destination, so they all read the
  // same resolved back link.
  const back = useBackLink(quizBack)

  const saveScore = useMutation({
    // The duration is measured once, when the last answer lands, and travels
    // with the score rather than being sent on its own.
    mutationFn: ({ score: finalScore, durationSeconds }: SavedAttempt) =>
      recordQualifyingAction(() => api.quiz.saveScore(quiz.id, finalScore, durationSeconds)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quizScores(quiz.id) })
      // Every analytics window now has this attempt, its score, and its length.
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics })
    },
    onError: (error) =>
      setSaveError(`Your score could not be saved. ${toFormMessage(error)}`),
  })

  const saveDifficulty = useMutation({
    mutationFn: (level: number) => api.quiz.setDifficulty(quiz.id, level),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quiz(quiz.id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.quizzes, exact: true })
    },
  })

  function handleAnswered(wasCorrect: boolean) {
    const nextScore = wasCorrect ? score + 1 : score
    setScore(nextScore)
    if (index < order.length - 1) {
      setIndex(index + 1)
      return
    }
    // The attempt ends here, not on the difficulty screen that follows, so the
    // timer is read now rather than when the request settles.
    const durationSeconds = elapsedSeconds()
    // The run is over, so nothing is left to lose and the guard comes off.
    isGuarding.current = false
    setClosingNote(drawClosingNote(nextScore, order.length))
    setPhase('rating')
    saveScore.mutate({ score: nextScore, durationSeconds })
  }

  function finishRating(level: number | null) {
    if (level !== null) {
      saveDifficulty.mutate(level)
      setSavedRating(level)
    }
    setPhase('summary')
  }

  // Browser Back. One sentinel entry is pushed for the run, so the first Back
  // lands here instead of leaving. Pushing it is a mount-only job; the listener
  // is separate because it has to see the current back target.
  useEffect(() => {
    window.history.pushState({ quizGuard: true }, '')
  }, [])

  useEffect(() => {
    function onPopState() {
      if (!isGuarding.current) return
      // The sentinel that was just consumed is put straight back, and the
      // dialog asks rather than letting the run end silently.
      window.history.pushState({ quizGuard: true }, '')
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

  const total = order.length
  const percent = Math.round((score / Math.max(total, 1)) * 100)

  return (
    <>
      <AppHeader onLeave={() => guardLeaving('/dashboard')} />

      <main className={`${shell} pt-10 pb-20`}>
        {phase === 'playing' && (
          <QuestionCard
            // Remounting per question resets the selection and the reveal.
            key={order[index].id}
            question={order[index]}
            position={index + 1}
            total={total}
            isShuffled={isShuffled}
            isLastQuestion={index === total - 1}
            onAnswered={handleAnswered}
            quizBack={quizBack}
            guardLeaving={guardLeaving}
          />
        )}

        {phase === 'rating' && (
          <section className={`${surfaceCard} mx-auto max-w-160 p-8 text-center sm:p-10`}>
            <h1 className="text-3xl">How hard was that?</h1>
            <p className="mx-auto mt-3 max-w-[42ch] text-base text-text-muted">
              Rating the quiz sets its difficulty, which shows on the quiz and in your library. You
              can skip this.
            </p>

            <div className="mt-7">
              <StarRating
                value={rating}
                onChange={setRating}
                disabled={saveDifficulty.isPending}
              />
              <p className="mt-3 h-5 text-sm font-bold text-text-muted tabular-nums">
                {rating > 0 ? `${rating} out of 5` : ''}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className={`${btnPrimaryLg} disabled:cursor-not-allowed disabled:bg-accent-soft disabled:text-accent-strong disabled:shadow-none`}
                onClick={() => finishRating(rating)}
                disabled={rating === 0 || saveDifficulty.isPending}
              >
                Save rating
              </button>
              <button
                type="button"
                className={btnGhostLg}
                onClick={() => finishRating(null)}
                disabled={saveDifficulty.isPending}
              >
                Skip
              </button>
            </div>
          </section>
        )}

        {phase === 'summary' && (
          <section className={`${surfaceCard} mx-auto max-w-160 p-8 text-center sm:p-10`}>
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success-solid"
              aria-hidden="true"
            >
              <IconCheck className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-3xl">Quiz complete</h1>

            <p className="mt-6 font-display text-5xl font-medium text-accent-foreground tabular-nums">
              {score}
              <span className="text-text-muted"> / {total}</span>
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className={countPill}>{percent}%</span>
              <span className={countPill}>
                {total - score === 0
                  ? 'Nothing to revisit'
                  : `${plural(total - score, 'question')} to revisit`}
              </span>
              {savedRating !== null && (
                <span className={countPill}>You rated it {savedRating}/5</span>
              )}
            </div>

            <p className="mx-auto mt-6 max-w-[44ch] rounded-md bg-accent-soft px-5 py-4 text-sm font-bold text-accent-strong">
              {closingNote}
            </p>

            {saveError && (
              <p className="mx-auto mt-4 max-w-[44ch] text-sm font-bold text-error-solid" role="alert">
                {saveError}
              </p>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <BackLink fallback={quizBack} className={btnPrimaryLg} showIcon={false} />
              <button type="button" className={btnGhostLg} onClick={onRetake}>
                Take it again
              </button>
            </div>
          </section>
        )}
      </main>

      {pendingExit !== null && (
        <ConfirmDialog
          title={LEAVE_TITLE}
          body={LEAVE_BODY}
          confirmLabel="Leave quiz"
          cancelLabel="Keep going"
          tone="danger"
          onConfirm={confirmExit}
          onCancel={() => setPendingExit(null)}
        />
      )}
    </>
  )
}

/** Taking one quiz, a question at a time. */
export function PlayQuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const [searchParams] = useSearchParams()
  const quiz = useQuiz(quizId)
  // Bumping this remounts the runner, which is what starts a clean attempt.
  const [attempt, setAttempt] = useState(0)

  const isShuffled = searchParams.get(SHUFFLE_PARAM) === '1'
  const isMissing = isStatus(quiz.error, 404)
  const isEmpty = quiz.isSuccess && (quiz.data.questions ?? []).length === 0

  if (quiz.isSuccess && !isEmpty) {
    return (
      <Runner
        key={`${quiz.data.id}-${attempt}`}
        quiz={quiz.data}
        isShuffled={isShuffled}
        onRetake={() => setAttempt((current) => current + 1)}
      />
    )
  }

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        {quiz.isPending && <PlaySkeleton />}

        {quiz.isError && (
          <div className={`${surfaceCard} max-w-150 p-8`}>
            <h1 className="text-3xl">
              {isMissing ? 'We could not find that quiz' : 'We could not load that quiz'}
            </h1>
            <p className="mt-3 text-base text-text-muted">
              {isMissing
                ? 'It may have been deleted, or it belongs to another account.'
                : toFormMessage(quiz.error)}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!isMissing && (
                <button type="button" className={btnGhostSm} onClick={() => void quiz.refetch()}>
                  Try again
                </button>
              )}
              <BackLink fallback={DASHBOARD_BACK} className={cardLink} />
            </div>
          </div>
        )}

        {isEmpty && (
          <div className={`${surfaceCard} max-w-150 p-8`}>
            <h1 className="text-3xl">There is nothing to answer yet</h1>
            <p className="mt-3 text-base text-text-muted">
              “{quiz.data.title}” has no questions. Add one and it will be waiting here.
            </p>
            <BackLink
              fallback={{ to: `/quiz/${quiz.data.id}`, label: 'quiz overview' }}
              className={`${cardLink} mt-6`}
            />
          </div>
        )}
      </main>
    </>
  )
}
