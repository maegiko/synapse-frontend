/**
 * Six hours, the longest either endpoint takes. Anything longer is clamped
 * rather than allowed to lose the run it belongs to on a 400.
 */
export const MAX_SESSION_DURATION_SECONDS = 21_600

/**
 * A measured session as the API accepts it. An untimed or unusable value answers
 * undefined, which leaves the property off so the run is saved with no duration.
 */
export function toDurationSeconds(seconds: number | null | undefined): number | undefined {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return undefined
  return Math.min(Math.max(Math.round(seconds), 0), MAX_SESSION_DURATION_SECONDS)
}
