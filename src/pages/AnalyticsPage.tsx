import { useState } from 'react'
import type { ReactNode } from 'react'
import type {
  AnalyticsPeriodDays,
  AnalyticsResponse,
  AnalyticsScoreHistoryItem,
} from '../api'
import { ActivityChart } from '../components/ActivityChart'
import { AppHeader } from '../components/AppHeader'
import { AppLink } from '../components/AppLink'
import { BackLink } from '../components/BackLink'
import { FormAlert } from '../components/FormAlert'
import { PeriodSelector } from '../components/PeriodSelector'
import {
  IconArrowRight,
  IconCard,
  IconChart,
  IconCheck,
  IconCircleDashed,
  IconClock,
  IconDeck,
  IconFlame,
  IconPlay,
  IconQuiz,
  IconStar,
} from '../components/icons'
import { btnGhostSm, cardLink, shell, surfaceCard } from '../components/ui'
import {
  DEFAULT_ANALYTICS_PERIOD,
  formatAverage,
  formatImprovement,
  formatOptionalDuration,
  formatPercentage,
  formatRatioAsPercentage,
  formatStudyDuration,
  NO_DATA_LABEL,
  periodDescription,
} from '../lib/analytics'
import { toFormMessage } from '../lib/apiErrors'
import { DASHBOARD_BACK } from '../lib/backTrail'
import {
  calendarWeekday,
  formatCalendarDate,
  formatCalendarDateShort,
  formatDateTime,
} from '../lib/formatDate'
import { plural } from '../lib/plural'
import { useAnalytics, useUserTimeZone } from '../lib/queries'

/** How many attempts the recent-attempts list shows before it stops. */
const RECENT_ATTEMPT_LIMIT = 8

/** Short weekday names for the due forecast, indexed the way `calendarWeekday` is. */
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** A figure told by typography alone, matching the profile page's treatment. */
function Metric({
  label,
  value,
  hint,
  icon,
  large = false,
}: {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
  /** The overview's four figures, set a step up so they carry the page. */
  large?: boolean
}) {
  // A rate or an average with nothing behind it says so in words, so it is set
  // as a sentence rather than as a number that happens to be very long.
  const isNoData = value === NO_DATA_LABEL

  return (
    <div>
      <dt className="flex items-center gap-2 text-xs font-bold text-text-muted">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </dt>
      <dd
        className={
          isNoData
            ? 'mt-1.5 text-sm text-text-muted'
            : `mt-1.5 font-medium text-text tabular-nums ${large ? 'text-2xl' : 'text-lg'}`
        }
      >
        {value}
      </dd>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  )
}

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string
  title: string
  /** Left out where the section's own content already introduces itself. */
  intro?: string
  children: ReactNode
}) {
  return (
    <section className={`${surfaceCard} mt-8 p-6 sm:p-8`} aria-labelledby={id}>
      <h2 id={id} className="text-xl">
        {title}
      </h2>
      {intro && <p className="mt-1.5 max-w-[70ch] text-sm text-text-muted">{intro}</p>}
      {children}
    </section>
  )
}

interface DistributionItem {
  label: string
  count: number
  /** The semantic tint this bucket already carries elsewhere in the app. */
  fill: string
  text: string
}

/**
 * A set of buckets over one total: a proportional bar, and the same figures as
 * a list underneath so the split is readable without reading the bar. The
 * colours are the ones a rating already wears in the review queue and the deck
 * player, so a rating means the same thing wherever it appears.
 */
function Distribution({
  items,
  emptyMessage,
  labelledBy,
}: {
  items: DistributionItem[]
  emptyMessage: string
  labelledBy: string
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  if (total === 0) {
    return <p className="mt-4 text-sm text-text-muted">{emptyMessage}</p>
  }

  return (
    <div className="mt-4">
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-surface-alt"
        aria-hidden="true"
      >
        {items.map((item) => (
          <span
            key={item.label}
            className={item.fill}
            style={{ width: `${(item.count / total) * 100}%` }}
          />
        ))}
      </div>

      <dl
        className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4"
        aria-labelledby={labelledBy}
      >
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline gap-2">
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.fill}`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className={`text-xs font-bold ${item.text}`}>{item.label}</dt>
              <dd className="text-sm font-medium text-text tabular-nums">
                {item.count}
                <span className="ml-1.5 text-xs font-normal text-text-muted">
                  {Math.round((item.count / total) * 100)}%
                </span>
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** One saved attempt, named and dated so unrelated quizzes stay distinguishable. */
function AttemptRow({ attempt, when }: { attempt: AnalyticsScoreHistoryItem; when: string }) {
  const percentage = Math.round(attempt.percentage)

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-dashed border-border py-3 last:border-b-0">
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
        {attempt.quizTitle}
      </span>
      <span className="shrink-0 text-sm font-bold text-text tabular-nums">
        {attempt.score} / {attempt.totalQuestions}
      </span>
      <span className="w-14 shrink-0 text-right text-sm text-accent-foreground tabular-nums">
        {percentage}%
      </span>
      <span className="w-40 shrink-0 text-right text-xs text-text-muted tabular-nums">{when}</span>
    </li>
  )
}

function PageSkeleton() {
  return (
    <div className="mt-8 grid gap-8" aria-hidden="true">
      {[0, 1, 2].map((block) => (
        <div key={block} className={`${surfaceCard} grid gap-4 p-6 sm:p-8`}>
          <span className="block h-5 w-48 animate-pulse rounded-full bg-surface-alt" />
          <span className="block h-3 w-72 max-w-full animate-pulse rounded-full bg-surface-alt" />
          <span className="block h-28 w-full animate-pulse rounded-md bg-surface-alt" />
        </div>
      ))}
    </div>
  )
}

/** Everything the endpoint reports for one window, for one signed-in account. */
export function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriodDays>(DEFAULT_ANALYTICS_PERIOD)
  const analytics = useAnalytics(period)
  const timeZone = useUserTimeZone()

  const data = analytics.data

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        <BackLink fallback={DASHBOARD_BACK} className={cardLink} />

        <h1 className="mt-5 text-3xl">Your progress</h1>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <PeriodSelector value={period} onChange={setPeriod} />
          {data && (
            <p className="text-xs text-text-muted tabular-nums" aria-live="polite">
              {analytics.isFetching
                ? 'Updating…'
                : `${formatCalendarDate(data.period.from)} – ${formatCalendarDate(
                    data.period.to,
                  )} · ${timeZone}`}
            </p>
          )}
        </div>

        {/* A failure that still has a previous window on screen is a warning
            rather than a wall: the figures below are simply no longer current. */}
        {analytics.isError && data && (
          <div className="mt-8">
            <FormAlert
              message={`These figures may be out of date. ${toFormMessage(analytics.error)}`}
            />
            <button
              type="button"
              className={`${btnGhostSm} mt-3`}
              onClick={() => void analytics.refetch()}
            >
              Try again
            </button>
          </div>
        )}

        {analytics.isError && !data && (
          <div className={`${surfaceCard} mt-8 max-w-150 p-8`}>
            <h2 className="text-xl">We could not load your progress</h2>
            <p className="mt-3 text-base text-text-muted">{toFormMessage(analytics.error)}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={btnGhostSm}
                onClick={() => void analytics.refetch()}
              >
                Try again
              </button>
              <AppLink to="/dashboard" className={cardLink}>
                Back to dashboard
                <IconArrowRight />
              </AppLink>
            </div>
          </div>
        )}

        {!data && analytics.isPending && <PageSkeleton />}

        {data && <AnalyticsSections data={data} timeZone={timeZone} />}
      </main>
    </>
  )
}

function AnalyticsSections({
  data,
  timeZone,
}: {
  data: AnalyticsResponse
  timeZone: string
}) {
  const { period, overview, flashcards, quizzes, consistency } = data
  const windowLabel = periodDescription(period.days)

  const nothingHappened =
    overview.activeDays === 0 && overview.cardsReviewed === 0 && quizzes.attempts === 0

  const recentAttempts = [...quizzes.scoreHistory]
    .reverse()
    .slice(0, RECENT_ATTEMPT_LIMIT)

  return (
    <>
      {nothingHappened && (
        <p className="mt-8 rounded-md border border-dashed border-border bg-surface-alt px-6 py-5 text-sm text-text-muted">
          Nothing recorded in {windowLabel}. Your review schedule below is still current.
        </p>
      )}

      <Section id="overview-heading" title="Overview">
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Metric
            label="Study time"
            icon={<IconClock className="h-4 w-4" />}
            value={formatStudyDuration(overview.totalStudySeconds)}
            large
          />
          <Metric
            label="Active days"
            icon={<IconCheck className="h-4 w-4" />}
            value={`${overview.activeDays} of ${period.days}`}
            large
          />
          <Metric
            label="Cards reviewed"
            icon={<IconCard className="h-4 w-4" />}
            value={overview.cardsReviewed.toLocaleString()}
            hint={`${overview.lifetimeCardsReviewed.toLocaleString()} all time`}
            large
          />
          <Metric
            label="Average quiz score"
            icon={<IconChart className="h-4 w-4" />}
            value={formatPercentage(overview.averageQuizPercentage)}
            large
          />
        </dl>
      </Section>

      {/* No intro: the chart opens with a sentence summarising the window, so a
          standfirst here would only say it twice. */}
      <Section id="activity-heading" title="Study activity">
        <div className="mt-6">
          {/* Keyed on the window: a new period is a new set of days, so the
              chart starts over rather than keeping a selection that pointed at
              a day the window no longer covers. */}
          <ActivityChart
            key={period.days}
            days={data.dailyActivity}
            periodDescription={windowLabel}
          />
        </div>
      </Section>

      <Section id="flashcards-heading" title="Flashcards">
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
          <Metric
            label="Cards reviewed"
            icon={<IconCard className="h-4 w-4" />}
            value={flashcards.cardsReviewed.toLocaleString()}
          />
          <Metric
            label="Review sessions"
            icon={<IconDeck className="h-4 w-4" />}
            value={String(flashcards.reviewSessions)}
            hint="One per deck"
          />
          <Metric
            label="Retention rate"
            icon={<IconCheck className="h-4 w-4" />}
            value={formatRatioAsPercentage(flashcards.retentionRate)}
            hint="Rated good or easy"
          />
        </dl>

        <h3 id="ratings-heading" className="mt-8 text-base font-medium">
          Rating distribution
        </h3>
        <Distribution
          labelledBy="ratings-heading"
          emptyMessage="You have not rated a review in this period."
          items={[
            {
              label: 'Rough',
              count: flashcards.ratings.again,
              fill: 'bg-error-solid',
              text: 'text-error-solid',
            },
            {
              label: 'Hard',
              count: flashcards.ratings.hard,
              fill: 'bg-warning-medium',
              text: 'text-warning-solid',
            },
            {
              label: 'Good',
              count: flashcards.ratings.good,
              fill: 'bg-accent-solid',
              text: 'text-accent-strong',
            },
            {
              label: 'Easy',
              count: flashcards.ratings.easy,
              fill: 'bg-success-solid',
              text: 'text-success-solid',
            },
          ]}
        />

        <h3 id="mastery-heading" className="mt-8 text-base font-medium">
          Deck mastery
        </h3>
        <p className="mt-1 text-xs text-text-muted">
          By latest rating. Unreviewed decks appear in none.
        </p>
        <Distribution
          labelledBy="mastery-heading"
          emptyMessage="None of your decks has been reviewed yet."
          items={[
            {
              label: 'Struggling',
              count: flashcards.mastery.struggling,
              fill: 'bg-error-solid',
              text: 'text-error-solid',
            },
            {
              label: 'Learning',
              count: flashcards.mastery.learning,
              fill: 'bg-warning-medium',
              text: 'text-warning-solid',
            },
            {
              label: 'Strong',
              count: flashcards.mastery.strong,
              fill: 'bg-success-solid',
              text: 'text-success-solid',
            },
          ]}
        />

        <h3 className="mt-8 text-base font-medium">Review schedule</h3>
        <p className="mt-1 text-xs text-text-muted">Today’s schedule. Unaffected by the period.</p>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
          <Metric
            label="Overdue decks"
            icon={<IconClock className="h-4 w-4" />}
            value={String(flashcards.overdueDecks)}
          />
          <Metric
            label="Due today"
            icon={<IconDeck className="h-4 w-4" />}
            value={String(flashcards.dueTodayDecks)}
          />
        </dl>

        <ol className="m-0 mt-6 grid list-none grid-cols-4 gap-2 p-0 sm:grid-cols-7">
          {flashcards.dueForecast.map((entry, index) => (
            <li
              key={entry.date}
              className={`rounded-sm border px-2 py-2.5 text-center ${
                entry.deckCount > 0
                  ? 'border-accent-solid/30 bg-accent-soft'
                  : 'border-border bg-surface-alt/60'
              }`}
            >
              <p className="text-xs text-text-muted">
                {index === 0 ? 'Today' : (WEEKDAY_NAMES[calendarWeekday(entry.date) ?? 0] ?? '')}
              </p>
              <p
                className={`mt-1 text-lg font-medium tabular-nums ${
                  entry.deckCount > 0 ? 'text-accent-strong' : 'text-text-muted'
                }`}
              >
                {entry.deckCount}
              </p>
              <p className="text-xs text-text-muted tabular-nums">
                {formatCalendarDateShort(entry.date)}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="quizzes-heading" title="Quizzes">
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          <Metric
            label="Attempts"
            icon={<IconPlay className="h-4 w-4" />}
            value={String(quizzes.attempts)}
            hint={`Across ${plural(quizzes.distinctQuizzesAttempted, 'quiz', 'quizzes')}`}
          />
          <Metric
            label="Average score"
            icon={<IconChart className="h-4 w-4" />}
            value={formatPercentage(quizzes.averagePercentage)}
          />
          <Metric
            label="Best score"
            icon={<IconStar className="h-4 w-4" />}
            value={formatPercentage(quizzes.bestPercentage)}
          />
          <Metric
            label="Average length"
            icon={<IconClock className="h-4 w-4" />}
            value={formatOptionalDuration(quizzes.averageDurationSeconds)}
          />
          <Metric
            label="Improvement"
            icon={<IconQuiz className="h-4 w-4" />}
            value={formatImprovement(quizzes.improvement)}
            hint="First to latest attempt"
          />
        </dl>

        <h3 className="mt-8 text-base font-medium">Recent attempts</h3>
        {recentAttempts.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No attempts in this period.</p>
        ) : (
          <>
            <ol className="m-0 mt-3 grid list-none p-0">
              {recentAttempts.map((attempt) => (
                <AttemptRow
                  key={attempt.id}
                  attempt={attempt}
                  when={formatDateTime(attempt.createdAt, timeZone)}
                />
              ))}
            </ol>
            {quizzes.scoreHistory.length > recentAttempts.length && (
              <p className="mt-3 text-xs text-text-muted">
                Showing {recentAttempts.length} of {quizzes.scoreHistory.length}
              </p>
            )}
          </>
        )}
      </Section>

      <Section
        id="consistency-heading"
        title="Consistency"
        intro="Streaks count every study action, so they run beyond this period."
      >
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
          <Metric
            label="Current streak"
            icon={<IconFlame className="h-4 w-4" />}
            value={plural(consistency.currentStreak, 'day')}
          />
          <Metric
            label="Longest streak"
            icon={<IconStar className="h-4 w-4" />}
            value={plural(consistency.longestStreak, 'day')}
          />
          <Metric
            label="Active days"
            icon={<IconCheck className="h-4 w-4" />}
            value={`${consistency.activeDays} of ${period.days}`}
          />
          <Metric
            label="Inactive days"
            icon={<IconCircleDashed className="h-4 w-4" />}
            value={`${consistency.inactiveDays} of ${period.days}`}
          />
          <Metric
            label="Sessions per active day"
            icon={<IconPlay className="h-4 w-4" />}
            value={formatAverage(consistency.averageSessionsPerActiveDay)}
          />
          <Metric
            label="Longest gap"
            icon={<IconClock className="h-4 w-4" />}
            value={plural(consistency.longestInactivityGap, 'day')}
          />
        </dl>
      </Section>
    </>
  )
}
