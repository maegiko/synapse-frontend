import { apiRequest } from './client'
import { API_PATHS } from './config'
import { setAccessToken } from './tokenStore'
import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
} from './types'

/**
 * DTO validation runs before the backend trims the email, so trim it here or a
 * padded address can fail @Email validation.
 */
export function register(payload: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(API_PATHS.auth.register, {
    method: 'POST',
    withRefreshCookie: true,
    json: {
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      password: payload.password,
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
