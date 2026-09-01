import { apiRequest } from './client'
import { API_PATHS } from './config'
import { setAccessToken } from './tokenStore'
import { detectTimeZone } from '../lib/timeZone'
import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailResponse,
} from './types'

/**
 * Creates an unverified account and emails it a verification link. It answers
 * `202` with the address it wrote to, and no token or cookie: the caller must
 * show a check-your-email state rather than signing anybody in.
 *
 * DTO validation runs before the backend trims the email, so trim it here or a
 * padded address can fail @Email validation.
 *
 * The account's time zone is seeded from the device unless the caller names one.
 * It is only a starting point: from here on the saved value is what counts, and
 * it changes only when the user changes it in their profile.
 */
export function register(payload: RegisterRequest): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>(API_PATHS.auth.register, {
    method: 'POST',
    json: {
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      password: payload.password,
      timeZone: payload.timeZone ?? detectTimeZone(),
    },
  })
}

/**
 * Confirms an emailed link, for both a new registration and an email change.
 * The answer's `kind` says which it was, and it is the only thing the caller
 * may branch on.
 *
 * A registration link is also the sign-in: it answers with an access token and
 * sets the refresh cookie, which is why this call needs the cookie flag even
 * though it sends no bearer token. An email-change link mints nothing.
 *
 * Every unusable token — unknown, expired, replaced, already used — answers the
 * same `400`, so the caller cannot and should not tell those apart. The token
 * belongs in this request and nowhere else: never log it, store it, or leave it
 * in the address bar.
 */
export function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  return apiRequest<VerifyEmailResponse>(API_PATHS.auth.verifyEmail, {
    method: 'POST',
    withRefreshCookie: true,
    json: { token },
  })
}

/**
 * Sends a fresh registration link. It answers `204` for an unknown address, an
 * already verified one, and a genuinely pending one alike, so the caller must
 * say something neutral: this response cannot reveal whether an account exists.
 */
export function resendVerification(email: string): Promise<void> {
  return apiRequest<void>(API_PATHS.auth.resendVerification, {
    method: 'POST',
    json: { email: email.trim() },
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
