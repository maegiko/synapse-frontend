import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { AnalyticsDailyActivity } from '../api'
import { formatStudyDuration } from '../lib/analytics'
import {
  calendarWeekday,
  formatCalendarDate,
  formatCalendarDateShort,
  formatCalendarMonth,
} from '../lib/formatDate'
import { plural } from '../lib/plural'

/** Past this, a column per day is too thin to aim at, so weeks are drawn instead. */
const MAX_BAR_DAYS = 31

const WEEKDAY_ROWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** Only alternate rows are labelled; seven labels would crowd the gutter. */
const LABELLED_WEEKDAYS = [1, 3, 5]

function hasActivity(day: AnalyticsDailyActivity): boolean {
  return day.deckReviews > 0 || day.quizAttempts > 0 || day.cardsReviewed > 0
}

function describeDay(day: AnalyticsDailyActivity): string {
  if (!hasActivity(day)) return 'No activity'
  return [
    ...(day.studySeconds > 0 ? [`${formatStudyDuration(day.studySeconds)} studied`] : []),
    `${plural(day.cardsReviewed, 'card')} reviewed`,
    plural(day.deckReviews, 'deck review'),
    plural(day.quizAttempts, 'quiz attempt'),
  ].join(', ')
}

/**
 * 0 for a day with nothing on it, then 1 to 4 by study time against the window's
 * busiest day. A studied day always reaches 1, even with no duration recorded.
 */
function intensity(day: AnalyticsDailyActivity, busiestSeconds: number): number {
  if (!hasActivity(day)) return 0
  const share = day.studySeconds / Math.max(busiestSeconds, 1)
  if (share > 0.66) return 4
  if (share > 0.33) return 3
  if (share > 0) return 2
  return 1
}

const FILLS = [
  'bg-surface-alt',
  'bg-accent-solid/25',
  'bg-accent-solid/45',
  'bg-accent-solid/70',
  'bg-accent-solid',
]

interface DayButtonProps {
  ref: (element: HTMLButtonElement | null) => void
  type: 'button'
  tabIndex: number
  'aria-pressed': boolean
  'aria-label': string
  title: string
  onClick: () => void
}

interface ActivityChartProps {
  days: AnalyticsDailyActivity[]
  periodDescription: string
}

/**
 * The window's `dailyActivity`, drawn with CSS boxes. Every day is a real
 * control: reachable by arrow key, named with its own figures, and selectable to
 * spell them out underneath. Height and shade both mean study time.
 */
export function ActivityChart({ days, periodDescription }: ActivityChartProps) {
  const asGrid = days.length > MAX_BAR_DAYS

  const busiestSeconds = useMemo(
    () => days.reduce((most, day) => Math.max(most, day.studySeconds), 0),
    [days],
  )

  const defaultIndex = Math.max(days.length - 1, 0)

  const [selected, setSelected] = useState(defaultIndex)

  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const shouldFocus = useRef(false)

  useEffect(() => {
    if (!shouldFocus.current) return
    shouldFocus.current = false
    buttons.current[selected]?.focus()
  }, [selected])

  function move(to: number) {
    const next = Math.min(Math.max(to, 0), days.length - 1)
    if (next === selected) return
    shouldFocus.current = true
    setSelected(next)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = asGrid ? 7 : 1
    if (event.key === 'ArrowRight') move(selected + step)
    else if (event.key === 'ArrowLeft') move(selected - step)
    else if (event.key === 'ArrowDown') move(selected + (asGrid ? 1 : step))
    else if (event.key === 'ArrowUp') move(selected - (asGrid ? 1 : step))
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(days.length - 1)
    else return
    event.preventDefault()
  }

  const totals = useMemo(
    () =>
      days.reduce(
        (sum, day) => ({
          studySeconds: sum.studySeconds + day.studySeconds,
          cardsReviewed: sum.cardsReviewed + day.cardsReviewed,
          deckReviews: sum.deckReviews + day.deckReviews,
          quizAttempts: sum.quizAttempts + day.quizAttempts,
          activeDays: sum.activeDays + (hasActivity(day) ? 1 : 0),
        }),
        { studySeconds: 0, cardsReviewed: 0, deckReviews: 0, quizAttempts: 0, activeDays: 0 },
      ),
    [days],
  )

  const day = days[selected]

  const summary =
    totals.activeDays === 0
      ? `Nothing was recorded in ${periodDescription}.`
      : `Over ${periodDescription} you studied on ${plural(totals.activeDays, 'day')} ` +
        `for ${formatStudyDuration(totals.studySeconds)}, across ` +
        `${plural(totals.deckReviews, 'deck review')} and ` +
        `${plural(totals.quizAttempts, 'quiz attempt')}, ` +
        `with ${plural(totals.cardsReviewed, 'card')} reviewed.`

  const dayProps = (index: number): DayButtonProps => ({
    ref: (element: HTMLButtonElement | null) => {
      buttons.current[index] = element
    },
    type: 'button' as const,
    tabIndex: index === selected ? 0 : -1,
    'aria-pressed': index === selected,
    'aria-label': `${formatCalendarDate(days[index].date)}. ${describeDay(days[index])}`,
    title: `${formatCalendarDate(days[index].date)}. ${describeDay(days[index])}`,
    onClick: () => setSelected(index),
  })

  if (days.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Day-by-day activity is not available for this period.
      </p>
    )
  }

  return (
    <div>
      <p className="sr-only">{summary}</p>

      <div
        role="group"
        aria-label="Daily study activity. Use the arrow keys to move between days."
        onKeyDown={onKeyDown}
      >
        {asGrid ? (
          <WeekGrid days={days} selected={selected} busiestSeconds={busiestSeconds} dayProps={dayProps} />
        ) : (
          <DayBars days={days} selected={selected} busiestSeconds={busiestSeconds} dayProps={dayProps} />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-muted">
        <span className="flex items-center gap-2">
          <span className={`h-3 w-3 shrink-0 rounded-[3px] ${FILLS[0]}`} aria-hidden="true" />
          No activity
        </span>
        <span className="flex items-center gap-1.5">
          Less
          {FILLS.slice(1).map((fill) => (
            <span key={fill} className={`h-3 w-3 shrink-0 rounded-[3px] ${fill}`} aria-hidden="true" />
          ))}
          More study time
        </span>
      </div>

      {day && (
        <div className="mt-5 rounded-md border border-border bg-surface-alt/70 px-4 py-3.5 sm:px-5">
          <p className="text-sm font-bold text-text">{formatCalendarDate(day.date)}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
            <DayFigure label="Study time" value={formatStudyDuration(day.studySeconds)} />
            <DayFigure label="Cards reviewed" value={String(day.cardsReviewed)} />
            <DayFigure label="Deck review sessions" value={String(day.deckReviews)} />
            <DayFigure label="Quiz attempts" value={String(day.quizAttempts)} />
          </dl>
        </div>
      )}
    </div>
  )
}

function DayFigure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold text-text tabular-nums">{value}</dd>
    </div>
  )
}

interface LayoutProps {
  days: AnalyticsDailyActivity[]
  selected: number
  busiestSeconds: number
  dayProps: (index: number) => DayButtonProps
}

const CELL_GAP = 3

function DayBars({ days, selected, busiestSeconds, dayProps }: LayoutProps) {
  const labelEvery = days.length <= 10 ? 1 : Math.ceil(days.length / 6)

  return (
    <div className="overflow-x-auto pb-1">
      <div style={{ minWidth: days.length * 10 }}>
        <div
          className="flex h-40 items-end border-b border-border sm:h-48"
          style={{ gap: CELL_GAP }}
        >
          {days.map((day, index) => {
            const level = intensity(day, busiestSeconds)
            const share = Math.round((day.studySeconds / Math.max(busiestSeconds, 1)) * 100)

            return (
              <button
                key={day.date}
                {...dayProps(index)}
                className={`flex h-full flex-1 cursor-pointer items-end rounded-t-[3px] transition-colors ${
                  index === selected ? 'bg-accent-soft/70' : 'hover:bg-surface-alt'
                }`}
              >
                <span
                  className={`block w-full rounded-t-[3px] ${level === 0 ? 'bg-border' : FILLS[level]}`}
                  style={level === 0 ? { height: 2 } : { height: `${Math.max(8, share)}%` }}
                />
              </button>
            )
          })}
        </div>

        <div className="flex" style={{ gap: CELL_GAP }} aria-hidden="true">
          {days.map((day, index) => (
            <span
              key={day.date}
              className="min-w-0 flex-1 pt-2 text-center text-xs whitespace-nowrap text-text-muted tabular-nums"
            >
              {index % labelEvery === 0 ? formatCalendarDateShort(day.date) : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * A cell per day laid out in weeks. Cells are a fixed size rather than a share of
 * the width, so a year never collapses into slivers; the chart scrolls instead.
 */
function WeekGrid({ days, selected, busiestSeconds, dayProps }: LayoutProps) {
  const startWeekday = calendarWeekday(days[0]?.date) ?? 0
  const weeks = Math.ceil((startWeekday + days.length) / 7)
  const cell = Math.max(11, Math.min(22, Math.floor(780 / Math.max(weeks, 1))))

  const monthLabels = useMemo(() => {
    const labels = new Map<number, string>()
    let previous = ''
    days.forEach((day, index) => {
      const month = day.date.slice(0, 7)
      if (month === previous) return
      previous = month
      const column = Math.floor((startWeekday + index) / 7)
      if (!labels.has(column)) labels.set(column, formatCalendarMonth(day.date))
    })
    return labels
  }, [days, startWeekday])

  const columns = {
    gridTemplateColumns: `repeat(${weeks}, ${cell}px)`,
    gap: CELL_GAP,
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex w-fit gap-2 pr-1">
        <div
          className="grid shrink-0 justify-items-end pt-5 text-[0.625rem] text-text-muted"
          style={{ gridTemplateRows: `repeat(7, ${cell}px)`, gap: CELL_GAP }}
          aria-hidden="true"
        >
          {WEEKDAY_ROWS.map((label, row) => (
            <span key={label} className="flex items-center leading-none">
              {LABELLED_WEEKDAYS.includes(row) ? label : ''}
            </span>
          ))}
        </div>

        <div>
          <div
            className="grid text-[0.625rem] text-text-muted"
            style={columns}
            aria-hidden="true"
          >
            {Array.from({ length: weeks }, (_, column) => (
              <span key={column} className="h-5 leading-5 whitespace-nowrap">
                {monthLabels.get(column) ?? ''}
              </span>
            ))}
          </div>

          <div className="grid" style={{ ...columns, gridAutoRows: `${cell}px` }}>
            {days.map((day, index) => {
              const offset = startWeekday + index
              return (
                <button
                  key={day.date}
                  {...dayProps(index)}
                  style={{
                    gridColumn: Math.floor(offset / 7) + 1,
                    gridRow: (offset % 7) + 1,
                  }}
                  className={`h-full w-full cursor-pointer rounded-[3px] ${
                    FILLS[intensity(day, busiestSeconds)]
                  } ${index === selected ? 'outline-2 outline-offset-1 outline-accent-strong' : ''}`}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
