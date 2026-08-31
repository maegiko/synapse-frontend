import { apiRequest } from './client'
import { API_PATHS } from './config'
import { setAccessToken } from './tokenStore'
import { detectTimeZone } from '../lib/timeZone'
import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
} from './types'

/**
 * DTO validation runs before the backend trims the email, so trim it here or a
 * padded address can fail @Email validation.
 *
 * The account's time zone is seeded from the device unless the caller names one.
 * It is only a starting point: from here on the saved value is what counts, and
 * it changes only when the user changes it in their profile.
 */
export function register(payload: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(API_PATHS.auth.register, {
    method: 'POST',
    withRefreshCookie: true,
    json: {
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      password: payload.password,
      timeZone: payload.timeZone ?? detectTimeZone(),
    },
  })
}

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(API_PATHS.auth.login, {
    method: 'POST',
    withRefreshCookie: true,
    json: { email: payload.email.trim(), password: payload.password },
  })
}

/** Idempotent, and the caller must clear local state whatever the outcome. */
export async function logout(): Promise<void> {
  try {
    await apiRequest<void>(API_PATHS.auth.logout, {
      method: 'POST',
      withRefreshCookie: true,
    })
  } finally {
    setAccessToken(null)
  }
}

/** Revokes every session, so the caller must sign out locally and route to login. */
export function changePassword(payload: ChangePasswordRequest): Promise<void> {
  return apiRequest<void>(API_PATHS.auth.password, {
    method: 'PUT',
    authenticated: true,
    withRefreshCookie: true,
    json: payload,
  })
}
