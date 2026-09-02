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
