import { DEFAULT_TIME_ZONE } from './timeZone'

/**
 * Backend event timestamps are ISO local date-times with no offset, and the
 * instant they name is always UTC. Reading one with `new Date` alone would take
 * it as browser-local, so the zone is attached here before anything else.
 */
function toInstant(value: string): Date {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
  return new Date(hasZone ? value : `${value}Z`)
}

/**
 * The zone a timestamp is shown in: the account's saved one, and UTC while the
 * profile has not loaded. Never the browser's own — the user's calendar is the
 * one they chose in their profile, wherever they happen to be sitting.
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

/**
 * Relative age for recent items, falling back to the absolute date after a
 * week. Elapsed time is the same wherever you are, so only that fallback date
 * needs the user's zone.
 */
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

/**
 * Date and time together, for lists where several entries can share a day.
 * Shown in the user's saved zone, so two attempts a minute apart never look a
 * day apart because the reader has travelled.
 */
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
 * A backend calendar date (`YYYY-MM-DD`), formatted as it stands. These are not
 * instants: the backend already decided them in the user's own time zone, so
 * converting one into any zone would shift it off the day it means.
 */
export function formatCalendarDate(value: string | null | undefined): string {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return ''
  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Whole days from today to a backend calendar date (`YYYY-MM-DD`): `0` is today
 * and `-2` is two days ago. Null when there is no usable date.
 *
 * Today is taken in the user's saved zone, because that is the calendar the
 * backend scheduled the date in. Counting from the browser's day instead would
 * call a deck due tomorrow the moment the reader crossed a meridian.
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
    // An unusable zone should not break a due label; UTC is the safe reading.
    const now = new Date()
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  }
}
