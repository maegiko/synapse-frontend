import { apiRequest } from './client'
import { API_PATHS } from './config'
import type { StreakResponse, UpdateUserDetailsRequest, UserDetails } from './types'

/** The source of truth for profile data; JWT display claims go stale. */
export function getDetails(): Promise<UserDetails> {
  return apiRequest<UserDetails>(API_PATHS.user.details, { authenticated: true })
}

/**
 * Partial: only the supplied properties change, and at least one must be present.
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

/** Current and longest study streaks, counted in calendar days of the user's saved time zone. */
export function getStreak(): Promise<StreakResponse> {
  return apiRequest<StreakResponse>(API_PATHS.user.streak, { authenticated: true })
}
