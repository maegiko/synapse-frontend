import { createContext } from 'react'
import type { AuthResponse, UserDetails } from '../api'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

/**
 * Registration is deliberately absent: `POST /api/auth/register` returns no
 * token and no refresh cookie, so it establishes no session and belongs to the
 * page that calls it rather than to auth state.
 */
export interface AuthContextValue {
  status: AuthStatus
  user: UserDetails | null
  login: (email: string, password: string) => Promise<void>
  /**
   * Takes up a session the backend has just issued, for the one case that does
   * not go through {@link login}: confirming a registration link, which signs
   * the account in without a password. Any cached data belonging to a previous
   * session is dropped, because the refresh cookie has just been replaced and
   * the account on screen may not be the one that was signed in before.
   */
  adoptSession: (session: AuthResponse) => void
  logout: () => Promise<void>
  /** Applied after a profile edit, so the header stops showing the old email. */
  setUserDetails: (details: UserDetails) => void
  /**
   * Re-reads the profile from the backend. Needed after a confirmed email
   * change: the access token keeps the old `email` claim until it is refreshed,
   * so `GET /api/user/details` is the only current answer.
   */
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
