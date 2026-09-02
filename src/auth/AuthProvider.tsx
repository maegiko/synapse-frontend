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
import { migrateExistingUserToDark, skipDarkMigration } from '../lib/theme'
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<UserDetails | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        await refreshAccessToken()
        const details = await api.user.getDetails()
        if (cancelled) return
        setUser(details)
        setStatus('authenticated')
        migrateExistingUserToDark()
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

  const adopt = useCallback(({ accessToken, fullName, email }: AuthResponse) => {
    clearQueryCache()
    setAccessToken(accessToken)
    setUser({ fullName, email })
    setStatus('authenticated')
  }, [])

  const adoptSession = useCallback(
    (session: AuthResponse) => {
      adopt(session)
      skipDarkMigration()
    },
    [adopt],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      adopt(await api.auth.login({ email, password }))
      migrateExistingUserToDark()
    },
    [adopt],
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

  const setUserDetails = useCallback((details: UserDetails) => setUser(details), [])

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
