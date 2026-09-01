import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

/** Shown for the one refresh call the app makes on boot. */
export function AuthBootScreen() {
  return (
    <div className="grid min-h-screen place-items-center" role="status" aria-live="polite">
      <p className="text-sm font-semibold text-text-muted">Loading Synapse…</p>
    </div>
  )
}

/** Signed-in only. Remembers where the visitor was headed. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <AuthBootScreen />
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

/** Signed-out only: the landing page and both auth forms. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'loading') return <AuthBootScreen />
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
