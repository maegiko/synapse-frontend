import { ApiError } from '../api'

function rateLimitMessage(retryAfterSeconds: number | null): string {
  if (!retryAfterSeconds || retryAfterSeconds <= 0) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (retryAfterSeconds < 60) {
    return `Too many attempts. Try again in ${retryAfterSeconds} seconds.`
  }
  const minutes = Math.ceil(retryAfterSeconds / 60)
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
}

/** Turns any thrown value into one sentence a form can display. */
export function toFormMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return rateLimitMessage(error.retryAfterSeconds)
    return error.message
  }
  return 'Something went wrong. Please try again.'
}

export function isStatus(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status
}

/**
 * The one place a message is read rather than a status. Login answers `401` for
 * wrong credentials and for an account that has never confirmed its address
 * alike, and only the message tells the two apart (FRONTEND_API.md section 6).
 *
 * A wrong password on an unverified account still answers the generic message,
 * so this never reveals an account's state to somebody who does not know the
 * password. Nothing else may infer verification state.
 */
export function isUnverifiedAccount(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401 && /not verified/i.test(error.message)
}

/**
 * How long a `429` said to wait, in seconds, or null when the answer was not a
 * rate limit or carried no usable `Retry-After`.
 */
export function retryAfterSeconds(error: unknown): number | null {
  return error instanceof ApiError && error.status === 429 ? error.retryAfterSeconds : null
}

/**
 * The email provider failed. Nothing was saved or sent, so the wording is
 * "try again" rather than the generic 502 copy, which talks about the AI
 * service that answers with the same status elsewhere.
 */
export function toEmailSendMessage(error: unknown): string {
  if (isStatus(error, 502)) {
    return 'We could not send that email just now. Please try again in a moment.'
  }
  return toFormMessage(error)
}
