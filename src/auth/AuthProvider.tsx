import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  api,
  refreshAccessToken,
  setAccessToken,
  subscribeToAccessToken,
  type AuthResponse,
  type UserDetails,
} from '../api'
import { queryKeys } from '../lib/queries'
import { clearQueryCache, queryClient } from '../lib/queryClient'
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

  const adoptSession = useCallback(({ accessToken, fullName, email }: AuthResponse) => {
    // Whatever was cached belonged to the session this one replaces. Confirming
    // a registration link can even swap accounts, so nothing is kept.
    clearQueryCache()
    setAccessToken(accessToken)
    setUser({ fullName, email })
    setStatus('authenticated')
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      adoptSession(await api.auth.login({ email, password }))
    },
    [adoptSession],
  )

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

  // The access token still carries the old `name`/`email` claims after a
  // profile edit, so React state is updated from the PATCH response instead.
  const setUserDetails = useCallback((details: UserDetails) => setUser(details), [])

  // Same quirk, without a response to read it from: a confirmed email change
  // happens on a page of its own, so the profile is fetched again afterwards.
  const refreshUser = useCallback(async () => {
    const details = await api.user.getDetails()
    setUser(details)
    queryClient.setQueryData(queryKeys.userDetails, details)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, adoptSession, logout, setUserDetails, refreshUser }),
    [status, user, login, adoptSession, logout, setUserDetails, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
