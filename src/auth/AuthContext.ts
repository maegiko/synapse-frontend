import { createContext } from 'react'
import type { AuthResponse, UserDetails } from '../api'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

/**
 * Registration is deliberately absent: it returns no token and no cookie, so it
 * establishes no session and belongs to the page that calls it.
 */
export interface AuthContextValue {
  status: AuthStatus
  user: UserDetails | null
  login: (email: string, password: string) => Promise<void>
  /**
   * Exchanges a Google credential for a session. Deliberately not called
   * `register`: the backend decides whether it creates an account, links one, or
   * signs an existing one in, and answers identically for all three.
   */
  continueWithGoogle: (credential: string) => Promise<void>
  adoptSession: (session: AuthResponse) => void
  logout: () => Promise<void>
  /**
   * Drops the session locally, with no call to the backend. For the one case
   * where {@link logout} cannot be used: the account has just been deleted, so
   * there is nothing left to revoke and no account for the token to reach.
   */
  endSession: () => void
  setUserDetails: (details: UserDetails) => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
