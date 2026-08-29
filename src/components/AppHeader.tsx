import { useState } from 'react'
import { Link } from 'react-router-dom'
import synapseLogo from '../assets/synapse_logo.png'
import { useAuth } from '../auth/useAuth'
import { Avatar } from './Avatar'
import { btnGhostSm, shell } from './ui'

interface AppHeaderProps {
  /**
   * Called before the header navigates away. Return false to cancel, which is
   * how the quiz player holds someone on the page until they confirm.
   */
  onLeave?: () => boolean
}

/** Signed-in header, matching the landing page's header treatment. */
export function AppHeader({ onLeave }: AppHeaderProps = {}) {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    if (onLeave && !onLeave()) return
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
          onClick={(event) => {
            if (onLeave && !onLeave()) event.preventDefault()
          }}
          className="mr-auto inline-flex items-center gap-2.5 font-display text-lg font-medium text-text no-underline"
        >
          <img src={synapseLogo} alt="" width="48" height="48" />
          <span className="translate-y-0.5">Synapse</span>
        </Link>
        {user && (
          <Link
            to="/profile"
            onClick={(event) => {
              if (onLeave && !onLeave()) event.preventDefault()
            }}
            className="no-underline"
            aria-label="Your profile"
            title="Your profile"
          >
            <Avatar
              fullName={user.fullName}
              className="transition-colors duration-150 hover:bg-accent-solid hover:text-on-accent"
            />
          </Link>
        )}
        <button type="button" className={btnGhostSm} onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </header>
  )
}
