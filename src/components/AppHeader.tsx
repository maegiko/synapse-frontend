import { useState } from 'react'
import { Link } from 'react-router-dom'
import synapseLogo from '../assets/synapse_logo.png'
import { useAuth } from '../auth/useAuth'
import { btnGhostSm, shell } from './ui'

/** Signed-in header, matching the landing page's header treatment. */
export function AppHeader() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
      <div className={`${shell} flex items-center gap-7 py-4`}>
        <Link
          to="/dashboard"
          className="mr-auto inline-flex items-center gap-2.5 font-display text-lg font-medium text-text no-underline"
        >
          <img src={synapseLogo} alt="" width="48" height="48" />
          <span className="translate-y-0.5">Synapse</span>
        </Link>
        <span className="hidden text-sm font-semibold text-text-muted sm:inline">{user?.email}</span>
        <button type="button" className={btnGhostSm} onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </header>
  )
}
