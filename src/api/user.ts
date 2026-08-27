import { apiRequest } from './client'
import { API_PATHS } from './config'
import type { UpdateUserDetailsRequest, UserDetails } from './types'

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
