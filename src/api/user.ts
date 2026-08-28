import { apiRequest } from './client'
import { API_PATHS } from './config'
import type { StreakResponse, UpdateUserDetailsRequest, UserDetails } from './types'

/** The source of truth for profile data; JWT display claims go stale. */
export function getDetails(): Promise<UserDetails> {
  return apiRequest<UserDetails>(API_PATHS.user.details, { authenticated: true })
}

export function updateDetails(payload: UpdateUserDetailsRequest): Promise<UserDetails> {
  return apiRequest<UserDetails>(API_PATHS.user.details, {
    method: 'PATCH',
    authenticated: true,
    json: payload,
  })
}

/** Current and longest study streaks, calculated from qualifying UTC activity days. */
export function getStreak(): Promise<StreakResponse> {
  return apiRequest<StreakResponse>(API_PATHS.user.streak, { authenticated: true })
}
