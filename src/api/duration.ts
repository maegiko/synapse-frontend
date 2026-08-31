/**
 * Session durations, as `POST /api/flashcards/{deckId}/review` and
 * `POST /api/quiz/{quizId}/score` accept them.
 */

/**
 * Six hours, the longest duration either endpoint takes. A larger value is a
 * `400` that saves nothing at all, so an overlong session is clamped to it
 * rather than being allowed to lose the run it belongs to.
 */
export const MAX_SESSION_DURATION_SECONDS = 21_600

/**
 * A measured session as the API will accept it: a whole number of seconds
 * inside the allowed range. Anything unusable — an untimed session, a value
 * that is not a finite number — answers `undefined`, which leaves the property
 * off the request entirely so the review or score is saved with no duration.
 */
export function toDurationSeconds(seconds: number | null | undefined): number | undefined {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return undefined
  return Math.min(Math.max(Math.round(seconds), 0), MAX_SESSION_DURATION_SECONDS)
}
