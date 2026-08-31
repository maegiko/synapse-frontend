import { useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { AppLink } from '../components/AppLink'
import { BackLink } from '../components/BackLink'
import { IconArrowRight } from '../components/icons'
import { ScoreRow } from '../components/ScoreRow'
import { btnGhostSm, cardLink, countPill, shell, surfaceCard } from '../components/ui'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import type { BackTarget } from '../lib/backTrail'
import { formatDateTime } from '../lib/formatDate'
import { plural } from '../lib/plural'
import { useQuiz, useQuizScores, useUserTimeZone } from '../lib/queries'

const placeholderPanel =
  'rounded-md border border-dashed border-border bg-surface-alt px-6 py-7 text-center text-sm text-text-muted'

function ScoresSkeleton() {
  return (
    <div className={`${surfaceCard} grid gap-3.5 p-6`} aria-hidden="true">
      {[0, 1, 2, 3].map((row) => (
        <span key={row} className="block h-3.5 w-full animate-pulse rounded-full bg-surface-alt" />
      ))}
    </div>
  )
}

/** Every saved attempt at one quiz, newest first. */
export function QuizScoresPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const quiz = useQuiz(quizId)
  const scores = useQuizScores(quizId)
  const timeZone = useUserTimeZone()

  const isMissing = isStatus(quiz.error, 404) || isStatus(scores.error, 404)
  /** The quiz these attempts belong to, for anyone who opened this page directly. */
  const quizBack: BackTarget = { to: `/quiz/${quizId}`, label: 'quiz overview' }

  // Each attempt scores against its own question count, so a plain average of
  // the raw scores would be meaningless; the percentages are averaged instead.
  const best = scores.data?.length
    ? Math.max(...scores.data.map((s) => (s.score / Math.max(s.totalQuestions, 1)) * 100))
    : 0
  const average = scores.data?.length
    ? scores.data.reduce((sum, s) => sum + (s.score / Math.max(s.totalQuestions, 1)) * 100, 0) /
      scores.data.length
    : 0

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        <BackLink fallback={quizBack} className={cardLink} />

        <div className="mt-5 max-w-200">
          <h1 className="text-3xl">Attempt history</h1>
          {quiz.isSuccess && (
            <p className="mt-3 max-w-[60ch] text-base text-text-muted">
              Every run you have saved for “{quiz.data.title}”, newest first.
            </p>
          )}

          {scores.isSuccess && scores.data.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={countPill}>{plural(scores.data.length, 'attempt')}</span>
              <span className={countPill}>Best {Math.round(best)}%</span>
              <span className={countPill}>Average {Math.round(average)}%</span>
            </div>
          )}

          <div className="mt-8">
            {scores.isPending && <ScoresSkeleton />}

            {scores.isError && (
              <div className={`${surfaceCard} max-w-150 p-8`}>
                <h2 className="text-xl">
                  {isMissing
                    ? 'We could not find that quiz'
                    : 'We could not load your attempts'}
                </h2>
                <p className="mt-3 text-base text-text-muted">
                  {isMissing
                    ? 'It may have been deleted, or it belongs to another account.'
                    : toFormMessage(scores.error)}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {!isMissing && (
                    <button
                      type="button"
                      className={btnGhostSm}
                      onClick={() => void scores.refetch()}
                    >
                      Try again
                    </button>
                  )}
                  <AppLink to="/library?type=quizzes" className={cardLink}>
                    Your quizzes
                    <IconArrowRight />
                  </AppLink>
                </div>
              </div>
            )}

            {scores.isSuccess &&
              (scores.data.length === 0 ? (
                <div className={`${surfaceCard} p-6`}>
                  <p className={placeholderPanel}>
                    You have not saved an attempt at this quiz yet.
                  </p>
                </div>
              ) : (
                <section className={surfaceCard}>
                  <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                    <h2 className="mr-auto text-base font-medium">All attempts</h2>
                    <span className={countPill}>{scores.data.length}</span>
                  </div>
                  <div className="px-6 py-5">
                    <ol className="m-0 grid list-none gap-3.5 p-0">
                      {scores.data.map((score) => (
                        <ScoreRow
                          key={score.publicId}
                          score={score}
                          when={formatDateTime(score.createdAt, timeZone)}
                        />
                      ))}
                    </ol>
                  </div>
                </section>
              ))}
          </div>
        </div>
      </main>
    </>
  )
}
