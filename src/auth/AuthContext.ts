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
  adoptSession: (session: AuthResponse) => void
  logout: () => Promise<void>
  setUserDetails: (details: UserDetails) => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
