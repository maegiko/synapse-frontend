import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  api,
  refreshAccessToken,
  setAccessToken,
  subscribeToAccessToken,
  type UserDetails,
} from '../api'
import { clearQueryCache } from '../lib/queryClient'
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<UserDetails | null>(null)

  // Boot: one refresh attempt against the cookie, then load the profile.
  // A 401 simply means "signed out"; it is never retried.
  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        await refreshAccessToken()
        const details = await api.user.getDetails()
        if (cancelled) return
        setUser(details)
        setStatus('authenticated')
      } catch {
        if (cancelled) return
        setUser(null)
        setStatus('anonymous')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // A refresh that fails mid-request clears the token; follow it in React state.
  useEffect(
    () =>
      subscribeToAccessToken((token) => {
        if (token === null) {
          setUser(null)
          setStatus('anonymous')
          clearQueryCache()
        }
      }),
    [],
  )

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, fullName, email: userEmail } = await api.auth.login({ email, password })
    setAccessToken(accessToken)
    setUser({ fullName, email: userEmail })
    setStatus('authenticated')
  }, [])

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const {
      accessToken,
      fullName: userFullName,
      email: userEmail,
    } = await api.auth.register({ fullName, email, password })
    setAccessToken(accessToken)
    setUser({ fullName: userFullName, email: userEmail })
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } finally {
      setAccessToken(null)
      setUser(null)
      setStatus('anonymous')
      clearQueryCache()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
