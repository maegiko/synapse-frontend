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
