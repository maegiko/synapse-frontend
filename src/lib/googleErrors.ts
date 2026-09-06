import { ApiError } from '../api'
import { toFormMessage } from './apiErrors'

/**
 * The one place a failed Google call is turned into a sentence.
 *
 * The backend answers every unverifiable credential with one generic 401 that
 * names no cause, so there is nothing to diagnose from it and nothing worth
 * showing the user beyond "try again". The two statuses that do mean something
 * specific — an address Google does not own, and an identity already spoken for —
 * are the ones worth their own wording, because each has a different way out.
 */
export function googleSignInMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return toFormMessage(error)

  switch (error.status) {
    case 400:
      return 'Google does not confirm ownership of that email address, so it cannot create a Synapse account. Sign up with your email instead, then link Google from your profile.'
    case 401:
      return 'That Google sign-in could not be completed. Try again.'
    case 409:
      return 'That email address already belongs to an account linked to a different Google Account. Log in with your password instead.'
    case 502:
      return 'Google could not be reached just now. Try again in a moment.'
    default:
      return toFormMessage(error)
  }
}

/**
 * Linking is authenticated and has already checked the password, so its failures
 * differ from a sign-in's.
 *
 * The backend has two 409s here — the Google Account belongs to somebody else, or
 * this account already has a different one — but only the first is reachable,
 * because linking is offered exclusively when nothing is linked yet. Telling them
 * apart would mean reading the backend's wording, which this app does in one
 * place only.
 */
export function googleLinkMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return toFormMessage(error)

  switch (error.status) {
    case 409:
      return 'That Google Account is already linked to a different Synapse account.'
    case 502:
      return 'Google could not be reached just now. Try again in a moment.'
    default:
      return toFormMessage(error)
  }
}
