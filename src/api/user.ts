import { apiRequest } from './client'
import { analyticsPath, API_PATHS } from './config'
import type {
  AnalyticsPeriodDays,
  AnalyticsResponse,
  EmailChangeResponse,
  StreakResponse,
  UpdateUserDetailsRequest,
  UserDetails,
} from './types'

/** The source of truth for profile data; JWT display claims go stale. */
export function getDetails(): Promise<UserDetails> {
  return apiRequest<UserDetails>(API_PATHS.user.details, { authenticated: true })
}

/**
 * Partial: only the supplied properties change, and at least one must be present.
 * The email address is not one of them; it moves only through
 * {@link requestEmailChange}.
 *
 * A new `timeZone` moves every later calendar-day boundary — streak days, deck due
 * dates — but never rewrites days already recorded or timestamps already stored,
 * so date-sensitive caches need refreshing rather than rebuilding.
 */
export function updateDetails(payload: UpdateUserDetailsRequest): Promise<UserDetails> {
  return apiRequest<UserDetails>(API_PATHS.user.details, {
    method: 'PATCH',
    authenticated: true,
    json: payload,
  })
}

/**
 * Asks for the account's email address to be moved to `email`. Nothing changes
 * yet: the backend emails a single-use confirmation link to the proposed
 * address, and the account keeps the address it has until that link is
 * confirmed through `POST /api/auth/email/verify`.
 *
 * Answers the pending state on `202`, and `null` on the `204` that means the
 * normalized address is already this account's own. A newer request replaces
 * any earlier pending one, and an abandoned request simply expires, so there is
 * nothing to cancel.
 */
export async function requestEmailChange(email: string): Promise<EmailChangeResponse | null> {
  const pending = await apiRequest<EmailChangeResponse | undefined>(API_PATHS.user.emailChange, {
    method: 'POST',
    authenticated: true,
    json: { email: email.trim() },
  })
  return pending ?? null
}

/** Current and longest study streaks, counted in calendar days of the user's saved time zone. */
export function getStreak(): Promise<StreakResponse> {
  return apiRequest<StreakResponse>(API_PATHS.user.streak, { authenticated: true })
}

/**
 * How the study is going over a window of whole calendar days ending on the
 * user's today, counted in the account's saved time zone. The window moves at
 * local midnight, and a submitted review or score changes it, so this is
 * refetched after both rather than cached indefinitely.
 */
export function getAnalytics(period: AnalyticsPeriodDays): Promise<AnalyticsResponse> {
  return apiRequest<AnalyticsResponse>(analyticsPath(period), { authenticated: true })
}
