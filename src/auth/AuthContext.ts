import { createContext } from 'react'
import type { UserDetails } from '../api'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  user: UserDetails | null
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Applied after a profile edit, so the header stops showing the old email. */
  setUserDetails: (details: UserDetails) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
