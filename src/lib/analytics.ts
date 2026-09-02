import type { AnalyticsPeriodDays } from '../api'

/** The endpoint never clamps to the nearest one, so offer exactly these. */
export const ANALYTICS_PERIODS: readonly AnalyticsPeriodDays[] = [7, 30, 90, 365]

export const DEFAULT_ANALYTICS_PERIOD: AnalyticsPeriodDays = 30

/** The compact label a period control shows, e.g. `30d`. */
export function periodLabel(period: AnalyticsPeriodDays): string {
  return period === 365 ? '1y' : `${period}d`
}

/** How the same period reads in a sentence or a screen-reader label. */
export function periodDescription(period: AnalyticsPeriodDays): string {
  return period === 365 ? 'the last 365 days' : `the last ${period} days`
}

/**
 * What a rate or an average says with nothing to average. The API sends null
 * rather than 0 for this, so it is never rendered as a zero.
 */
export const NO_DATA_LABEL = 'No data yet'

/** Drops a trailing `.0` so a whole number does not read as a measurement. */
function trimDecimal(value: number, maxDecimals = 1): string {
  return String(Number(value.toFixed(maxDecimals)))
}

/** Seconds below a minute, so a short session is not flattened to "0m". */
export function formatStudyDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds))
  if (whole < 60) return `${whole}s`

  const minutes = Math.round(whole / 60)
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`
}

/** A nullable duration: the no-data state rather than a zero it did not mean. */
export function formatOptionalDuration(seconds: number | null): string {
  return seconds === null ? NO_DATA_LABEL : formatStudyDuration(seconds)
}

/** A 0–100 percentage the API already scaled. */
export function formatPercentage(value: number | null): string {
  return value === null ? NO_DATA_LABEL : `${trimDecimal(value)}%`
}

/** A 0–1 ratio — retention is sent as one — shown as a whole percentage. */
export function formatRatioAsPercentage(ratio: number | null): string {
  return ratio === null ? NO_DATA_LABEL : `${Math.round(ratio * 100)}%`
}

/** A difference between percentages, so percentage points, carrying its sign. */
export function formatImprovement(points: number | null): string {
  if (points === null) return NO_DATA_LABEL
  const rounded = Number(points.toFixed(1))
  return `${rounded > 0 ? '+' : ''}${trimDecimal(rounded)} pts`
}

/** An average that is a plain count rather than a percentage or a duration. */
export function formatAverage(value: number): string {
  return trimDecimal(value)
}
