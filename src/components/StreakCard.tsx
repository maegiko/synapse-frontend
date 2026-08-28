import { btnGhostSm } from './ui'
import type { StreakResponse } from '../api'
import streakFlame from '../assets/streak_flame.png'
import streakFlameMuted from '../assets/streak_flame_muted.png'

interface StreakCardProps {
  streak?: StreakResponse
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

/** Compact dashboard status for the user's study streak. */
export function StreakCard({ streak, isLoading, isError, onRetry }: StreakCardProps) {
  const cardClass =
    'mt-6 rounded-md border border-border bg-surface px-4 py-3 shadow-sm sm:px-6 sm:py-4'

  if (isLoading) {
    return (
      <section
        className={`${cardClass} flex items-center gap-4`}
        aria-label="Loading study streak"
      >
        <span className="h-11 w-11 shrink-0 animate-pulse rounded-sm bg-warning-soft" />
        <div className="grid flex-1 gap-2">
          <span className="h-4 w-32 animate-pulse rounded-full bg-surface-alt" />
          <span className="h-3 w-64 max-w-full animate-pulse rounded-full bg-surface-alt" />
        </div>
      </section>
    )
  }

  if (isError || !streak) {
    return (
      <section className={`${cardClass} flex items-center gap-3`}>
        <div className="min-w-0 flex-1">
          <h2 className="text-base">Your study streak is unavailable</h2>
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

  const hasStreak = streak.currentStreak > 0

  return (
    <section
      className={`${cardClass} grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 sm:grid-cols-[2.75rem_minmax(0,1fr)_auto] sm:gap-x-5`}
      aria-labelledby="streak-heading"
    >
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-sm sm:h-11 sm:w-11 ${
          streak.activeToday ? 'bg-warning-soft' : 'bg-surface-alt'
        }`}
      >
        <img
          src={streak.activeToday ? streakFlame : streakFlameMuted}
          alt=""
          className="h-6 w-6 object-contain sm:h-7 sm:w-7"
        />
      </span>

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <h2 id="streak-heading" className="min-w-0 truncate text-base sm:text-lg">
            {hasStreak ? `${streak.currentStreak}-day streak` : 'Start your streak'}
          </h2>
          <span
            className={
              streak.activeToday
                ? 'shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success-solid sm:px-2.5 sm:py-1'
                : 'shrink-0 rounded-full bg-surface-alt px-2 py-0.5 text-xs font-bold text-text-muted tabular-nums sm:px-2.5 sm:py-1'
            }
          >
            {streak.activeToday
              ? 'Great job!'
              : hasStreak
                ? 'Study today!'
                : 'Spark the flame!'}
          </span>
        </div>
        <p
          className="mt-0.5 truncate text-xs text-text-muted sm:mt-1"
          title="Generate something or finish a deck or quiz to keep your streak going."
        >
          Generate something or finish a deck or quiz to keep your streak going.
        </p>
      </div>

      <div className="border-l border-border pl-3 text-right sm:pl-5">
        <p className="hidden text-xs text-text-muted sm:block">Longest</p>
        <p className="text-xs font-bold whitespace-nowrap text-text tabular-nums sm:mt-0.5 sm:text-sm">
          <span className="sm:hidden">Best </span>
          {streak.longestStreak}
          <span className="sm:hidden">d</span>
          <span className="hidden sm:inline">
            {' '}
            {streak.longestStreak === 1 ? 'day' : 'days'}
          </span>
        </p>
      </div>
    </section>
  )
}
