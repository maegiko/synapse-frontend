import { ApiError } from '../api'
import {
  FALLBACK_MESSAGE,
  FALLBACK_REASON,
  standardErrorMessage,
  standardErrorReason,
} from './errorMessages'

/**
 * Turns any thrown value into one sentence a form can display. The backend's own
 * message is never part of it.
 */
export function toFormMessage(error: unknown): string {
  if (error instanceof ApiError) return standardErrorMessage(error.status, error.retryAfterSeconds)
  return FALLBACK_MESSAGE
}

/** The same failure after a caller's own "We could not X." sentence. */
export function toReasonMessage(error: unknown): string {
  if (error instanceof ApiError) return standardErrorReason(error.status, error.retryAfterSeconds)
  return FALLBACK_REASON
}

export function isStatus(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status
}

/**
 * The one place a backend message is read, and it is read rather than shown.
 * Login answers 401 for bad credentials and for an unconfirmed address alike, and
 * the contract names this as the single decision allowed to branch on wording.
 */
export function isUnverifiedAccount(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 401 &&
    /not verified/i.test(error.serverMessage ?? '')
  )
}

/** Null when the answer was not a rate limit or carried no usable `Retry-After`. */
export function retryAfterSeconds(error: unknown): number | null {
  return error instanceof ApiError && error.status === 429 ? error.retryAfterSeconds : null
}

/** Nothing was saved or sent, so this is worded apart from the AI service's 502. */
export function toEmailSendMessage(error: unknown): string {
  if (isStatus(error, 502)) {
    return 'We could not send that email just now. Try again in a moment.'
  }
  return toFormMessage(error)
}
