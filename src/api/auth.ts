import { apiRequest } from './client'
import { API_PATHS } from './config'
import { setAccessToken } from './tokenStore'
import { detectTimeZone } from '../lib/timeZone'
import type {
  AuthResponse,
  ChangePasswordRequest,
  GoogleNonceResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  VerifyEmailResponse,
} from './types'

/**
 * Creates an unverified account and emails it a verification link. Answers 202
 * with no session, so the caller shows a check-your-email state.
 *
 * The email is trimmed here because DTO validation runs before the backend
 * trims it, and a padded address fails @Email.
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
 * Confirms an emailed link. `kind` says whether it was a registration, which
 * also signs the user in and sets the refresh cookie, or an email change, which
 * mints nothing. Every unusable token answers the same 400.
 */
export function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  return apiRequest<VerifyEmailResponse>(API_PATHS.auth.verifyEmail, {
    method: 'POST',
    withRefreshCookie: true,
    json: { token },
  })
}

/**
 * Sends a fresh registration link. Answers 204 for unknown, already verified and
 * pending addresses alike, so the caller must not imply an account exists.
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

/**
 * Starts one Google sign-in attempt. The returned nonce goes to Google Identity
 * Services, and the same value is set as a cookie that must be sent back with the
 * credential, so a fresh one is needed for every attempt including a retry.
 */
export function googleNonce(): Promise<GoogleNonceResponse> {
  return apiRequest<GoogleNonceResponse>(API_PATHS.auth.googleNonce, {
    method: 'POST',
    withRefreshCookie: true,
  })
}

/**
 * Exchanges a Google credential for the ordinary Synapse session, answering the
 * same shape login does.
 *
 * There is no separate Google registration call: the backend decides whether this
 * creates an account, links one, or signs an existing one in, and the caller
 * cannot tell which happened. The nonce travels in its cookie, which is why this
 * needs credentials.
 */
export function googleLogin(credential: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(API_PATHS.auth.google, {
    method: 'POST',
    withRefreshCookie: true,
    json: { credential, timeZone: detectTimeZone() },
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

/**
 * Asks for a password-reset link. Answers 204 whatever was typed, and a 429
 * counts unknown addresses too, so both need the same generic confirmation.
 */
export function forgotPassword(email: string): Promise<void> {
  return apiRequest<void>(API_PATHS.auth.forgotPassword, {
    method: 'POST',
    json: { email: email.trim() },
  })
}

/**
 * Sets a new password from an emailed link. Signs nobody in, but revokes every
 * refresh token for the account and clears this caller's refresh cookie.
 */
export function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  return apiRequest<void>(API_PATHS.auth.resetPassword, {
    method: 'POST',
    withRefreshCookie: true,
    json: payload,
  })
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
