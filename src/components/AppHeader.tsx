import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AppLink } from './AppLink'
import synapseLogo from '../assets/synapse_logo.webp'
import { useAuth } from '../auth/useAuth'
import { Avatar } from './Avatar'
import { ThemeToggle } from './ThemeToggle'
import { IconChart, IconGroup, IconHome, IconLibrary } from './icons'
import { btnGhostSm, shell } from './ui'

/** The main sections a signed-in visitor jumps between from any page. */
const navSections = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconHome },
  { to: '/library', label: 'Library', Icon: IconLibrary },
  { to: '/groups', label: 'Groups', Icon: IconGroup },
  { to: '/analytics', label: 'Analytics', Icon: IconChart },
]

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
      <div className={`${shell} flex items-center gap-3 py-4 sm:gap-7`}>
        <Link
          to="/dashboard"
          onClick={(event) => {
            if (onLeave && !onLeave()) event.preventDefault()
          }}
          className="mr-auto inline-flex items-center gap-2.5 font-display text-lg font-medium text-text no-underline"
        >
          <img
            src={synapseLogo}
            alt=""
            width="48"
            height="48"
            decoding="async"
            className="h-10 w-10 sm:h-12 sm:w-12"
          />
          <span className="hidden translate-y-0.5 sm:inline">Synapse</span>
        </Link>
        {user && (
          <nav aria-label="Sections" className="flex items-center gap-0.5">
            {navSections.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={(event) => {
                  if (onLeave && !onLeave()) event.preventDefault()
                }}
                title={label}
                aria-label={label}
                className={({ isActive }) =>
                  `inline-flex h-8 w-8 items-center justify-center rounded-sm no-underline transition-colors duration-150 ${
                    isActive
                      ? 'bg-accent-soft text-accent-strong'
                      : 'text-text-muted hover:bg-surface-alt hover:text-text'
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5" />
              </NavLink>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user && (
            <AppLink
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
            </AppLink>
          )}
        </div>
        <button type="button" className={btnGhostSm} onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </header>
  )
}
