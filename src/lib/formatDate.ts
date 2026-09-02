import { DEFAULT_TIME_ZONE } from './timeZone'

/**
 * Backend timestamps are ISO local date-times with no offset, and always name a
 * UTC instant. `new Date` alone would read one as browser-local.
 */
function toInstant(value: string): Date {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
  return new Date(hasZone ? value : `${value}Z`)
}

/**
 * The account's saved zone, and UTC until the profile loads. Never the browser's:
 * the calendar is the one they chose, wherever they are sitting.
 */
function displayZone(timeZone: string | undefined): string {
  return timeZone || DEFAULT_TIME_ZONE
}

/** A backend timestamp as a date, in the user's saved time zone. */
export function formatDate(value: string | null | undefined, timeZone?: string): string {
  if (!value) return ''
  const date = toInstant(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: displayZone(timeZone),
  })
}

/** Relative age, falling back to the absolute date after a week. */
export function formatRelative(value: string | null | undefined, timeZone?: string): string {
  if (!value) return ''
  const date = toInstant(value)
  if (Number.isNaN(date.getTime())) return ''

  const minutes = Math.round((Date.now() - date.getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`

  return formatDate(value, timeZone)
}

/** In the user's saved zone, so two attempts a minute apart never look a day apart. */
export function formatDateTime(value: string | null | undefined, timeZone?: string): string {
  if (!value) return ''
  const date = toInstant(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: displayZone(timeZone),
  })
}

/**
 * Formatted as it stands. These are not instants: the backend already decided
 * them in the user's zone, so converting would shift the day they mean.
 */
export function formatCalendarDate(value: string | null | undefined): string {
  const date = calendarDateAsUtc(value)
  if (!date) return ''
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** A short day-and-month label, for a chart axis whose window states the year. */
export function formatCalendarDateShort(value: string | null | undefined): string {
  const date = calendarDateAsUtc(value)
  if (!date) return ''
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/** Just the month of a backend calendar date, for grouping a run of them. */
export function formatCalendarMonth(value: string | null | undefined): string {
  const date = calendarDateAsUtc(value)
  if (!date) return ''
  return date.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })
}

/** Read off the date as written, so weeks line up with the user's own calendar. */
export function calendarWeekday(value: string | null | undefined): number | null {
  const date = calendarDateAsUtc(value)
  return date ? date.getUTCDay() : null
}

/** A `YYYY-MM-DD` calendar date pinned to UTC midnight, or null if unusable. */
function calendarDateAsUtc(value: string | null | undefined): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * 0 is today and -2 is two days ago; null when there is no usable date. Today is
 * taken in the user's saved zone, the calendar the backend scheduled in.
 */
export function calendarDaysFromToday(
  value: string | null | undefined,
  timeZone?: string,
): number | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return Math.round((Date.UTC(year, month - 1, day) - todayIn(timeZone)) / 86_400_000)
}

/** Today's date in a zone, as the same UTC-midnight number the dates above use. */
function todayIn(timeZone: string | undefined): number {
  try {
    // `en-CA` renders as YYYY-MM-DD, so this splits without parsing any names.
    const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
      timeZone: displayZone(timeZone),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date())
      .split('-')
      .map(Number)

    return Date.UTC(year, month - 1, day)
  } catch {
    const now = new Date()
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  }
}
