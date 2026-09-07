import { apiRequest } from './client'
import { analyticsPath, API_PATHS } from './config'
import type {
  AnalyticsPeriodDays,
  AnalyticsResponse,
  DeleteAccountRequest,
  EmailChangeResponse,
  LinkGoogleRequest,
  UnlinkGoogleRequest,
  StreakResponse,
  UpdateUserDetailsRequest,
  UserDetails,
} from './types'

/** The source of truth for profile data; JWT display claims go stale. */
export function getDetails(): Promise<UserDetails> {
  return apiRequest<UserDetails>(API_PATHS.user.details, { authenticated: true })
}

/**
 * Only the supplied properties change, and at least one must be present. The
 * email address is not one of them: it moves through {@link requestEmailChange}.
 *
 * A new `timeZone` moves every later calendar-day boundary without rewriting
 * days already recorded, so date-sensitive caches need refreshing, not rebuilding.
 */
export function updateDetails(payload: UpdateUserDetailsRequest): Promise<UserDetails> {
  return apiRequest<UserDetails>(API_PATHS.user.details, {
    method: 'PATCH',
    authenticated: true,
    json: payload,
  })
}

/**
 * Nothing changes yet: a single-use link goes to the proposed address and the
 * account keeps the one it has until that link is confirmed. Answers the pending
 * state on 202, or null on the 204 meaning the address is already this account's.
 */
export async function requestEmailChange(email: string): Promise<EmailChangeResponse | null> {
  const pending = await apiRequest<EmailChangeResponse | undefined>(API_PATHS.user.emailChange, {
    method: 'POST',
    authenticated: true,
    json: { email: email.trim() },
  })
  return pending ?? null
}

/**
 * Attaches a Google Account to the signed-in account, so it can afterwards sign
 * in either way. This is how a Google address that is not the Synapse address
 * gets linked; "Continue with Google" deliberately will not guess at that.
 *
 * Needs the nonce cookie as well as the bearer token, and the two addresses do
 * not have to match. Presenting the already-linked account changes nothing.
 */
export function linkGoogle(payload: LinkGoogleRequest): Promise<void> {
  return apiRequest<void>(API_PATHS.user.googleLink, {
    method: 'POST',
    authenticated: true,
    withRefreshCookie: true,
    json: payload,
  })
}

/**
 * Removes the Google identity. The account, its content and its other sessions
 * are untouched. An account with no password is refused with 409, because
 * unlinking would leave it with no way in.
 */
export function unlinkGoogle(payload: UnlinkGoogleRequest): Promise<void> {
  return apiRequest<void>(API_PATHS.user.googleLink, {
    method: 'DELETE',
    authenticated: true,
    json: payload,
  })
}

/**
 * Destroys the account and everything the database cascades from it: notes,
 * decks, cards, review history, quizzes, scores, groups, streak days and every
 * refresh token on every device. Nothing is archived and there is no undo, so the
 * caller owns the job of making this deliberate before it is reached.
 *
 * Needs the refresh cookie: the response clears it, and the credential path sends
 * the `googleNonce` cookie with it. On success there is no account left for the
 * access token to reach, so discard the session at once rather than calling
 * logout. A 404 means a retry arrived after the account was already gone.
 */
export function deleteAccount(payload: DeleteAccountRequest): Promise<void> {
  return apiRequest<void>(API_PATHS.user.account, {
    method: 'DELETE',
    authenticated: true,
    withRefreshCookie: true,
    json: payload,
  })
}

/** Counted in calendar days of the user's saved time zone. */
export function getStreak(): Promise<StreakResponse> {
  return apiRequest<StreakResponse>(API_PATHS.user.streak, { authenticated: true })
}

/**
 * A window of whole calendar days ending on the user's today. It moves at local
 * midnight and every review or score changes it, so it is refetched, not cached.
 */
export function getAnalytics(period: AnalyticsPeriodDays): Promise<AnalyticsResponse> {
  return apiRequest<AnalyticsResponse>(analyticsPath(period), { authenticated: true })
}
