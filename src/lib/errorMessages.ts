/**
 * Every sentence the app shows when a request fails.
 *
 * The backend's own message names fields the way the server models them
 * ("fullName: must not be blank"), and the contract says not to build on its
 * wording, so none of it reaches the screen. {@link standardErrorMessage} stands
 * on its own; {@link standardErrorReason} follows the caller's own sentence.
 */

/** Status used for failures that never reached the backend (offline, CORS, DNS). */
export const NETWORK_ERROR_STATUS = 0

/** "in 30 seconds" or "in 2 minutes", or null when the wait is unknown. */
function waitPhrase(retryAfterSeconds: number | null): string | null {
  if (!retryAfterSeconds || retryAfterSeconds <= 0) return null
  if (retryAfterSeconds < 60) return `in ${retryAfterSeconds} seconds`
  const minutes = Math.ceil(retryAfterSeconds / 60)
  return `in ${minutes} minute${minutes === 1 ? '' : 's'}`
}

function rateLimitMessage(retryAfterSeconds: number | null): string {
  const wait = waitPhrase(retryAfterSeconds)
  return wait ? `Too many attempts. Try again ${wait}.` : 'Too many attempts. Wait a moment and try again.'
}

function rateLimitReason(retryAfterSeconds: number | null): string {
  const wait = waitPhrase(retryAfterSeconds)
  return wait ? `Try again ${wait}.` : 'Wait a moment and try again.'
}

const MESSAGES: Record<number, string> = {
  [NETWORK_ERROR_STATUS]: 'We could not reach the server. Check your connection and try again.',
  400: 'Some of the details you entered are not valid. Check them and try again.',
  401: 'Your session has expired. Log in again to carry on.',
  403: 'You do not have access to this.',
  404: 'We could not find what you were looking for. It may have been deleted.',
  409: 'That conflicts with something that already exists.',
  413: 'That file is too large to upload.',
}

const REASONS: Record<number, string> = {
  [NETWORK_ERROR_STATUS]: 'Check your connection and try again.',
  400: 'Check the details you entered and try again.',
  401: 'Log in again to carry on.',
  403: 'You do not have access to it.',
  404: 'It may have been deleted.',
  409: 'It conflicts with something that already exists.',
  413: 'The file is too large to upload.',
}

const SERVER_MESSAGE = 'The service is unavailable right now. Try again in a moment.'
const SERVER_REASON = 'Try again in a moment.'

/** What a failure with no HTTP status of its own reads as. */
export const FALLBACK_MESSAGE = 'Something went wrong. Try again in a moment.'
export const FALLBACK_REASON = 'Try again in a moment.'

/** One self-contained sentence describing a failed request. */
export function standardErrorMessage(status: number, retryAfterSeconds: number | null = null): string {
  if (status === 429) return rateLimitMessage(retryAfterSeconds)
  if (status >= 500) return SERVER_MESSAGE
  return MESSAGES[status] ?? FALLBACK_MESSAGE
}

/** The follow-on sentence, after the caller has already named what failed. */
export function standardErrorReason(status: number, retryAfterSeconds: number | null = null): string {
  if (status === 429) return rateLimitReason(retryAfterSeconds)
  if (status >= 500) return SERVER_REASON
  return REASONS[status] ?? FALLBACK_REASON
}
