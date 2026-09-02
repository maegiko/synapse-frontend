import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AppLink } from './AppLink'
import synapseLogo from '../assets/synapse_logo.webp'
import { useAuth } from '../auth/useAuth'
import { Avatar } from './Avatar'
import { ThemeToggle } from './ThemeToggle'
import { IconChart, IconGroup, IconHome, IconLibrary, IconMenu, IconSpinner, IconX } from './icons'
import { btnGhostSm, shell } from './ui'

const navSections = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconHome },
  { to: '/library', label: 'Library', Icon: IconLibrary },
  { to: '/groups', label: 'Groups', Icon: IconGroup },
  { to: '/analytics', label: 'Analytics', Icon: IconChart },
]

const MENU_ROW =
  'flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm font-medium no-underline transition-colors duration-150'

interface AppHeaderProps {
  /** Return false to cancel, which is how a play session holds someone here. */
  onLeave?: () => boolean
}

export function AppHeader({ onLeave }: AppHeaderProps = {}) {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const menuId = useId()
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const [openedOn, setOpenedOn] = useState<string | null>(null)
  const menuOpen = openedOn === location.pathname

  function closeMenu() {
    setOpenedOn(null)
  }

  useEffect(() => {
    if (!menuOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      closeMenu()
      triggerRef.current?.focus()
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      closeMenu()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [menuOpen])

  async function handleLogout() {
    if (onLeave && !onLeave()) return
    closeMenu()
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  function guardNavigation(event: { preventDefault: () => void }) {
    if (onLeave && !onLeave()) {
      event.preventDefault()
      return
    }
    closeMenu()
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
      <div className={`${shell} flex items-center gap-3 py-4 sm:gap-7`}>
        <Link
          to="/dashboard"
          onClick={guardNavigation}
          className="brand mr-auto inline-flex items-center gap-2.5 font-display text-lg font-medium text-text no-underline"
        >
          <img
            src={synapseLogo}
            alt=""
            width="48"
            height="48"
            decoding="async"
            className="brand-mark h-10 w-10 shrink-0 sm:h-12 sm:w-12"
          />
          <span className="hidden translate-y-0.5 sm:inline">Synapse</span>
        </Link>
        {user && (
          <nav aria-label="Sections" className="hidden items-center gap-0.5 sm:flex">
            {navSections.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={guardNavigation}
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
              onClick={guardNavigation}
              className="hidden no-underline sm:inline-flex"
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
        <button
          type="button"
          className={`${btnGhostSm} whitespace-nowrap`}
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label={loggingOut ? 'Logging out…' : undefined}
        >
          {loggingOut ? (
            <>
              <IconSpinner className="h-4 w-4 sm:hidden" />
              <span className="max-sm:hidden">Logging out…</span>
            </>
          ) : (
            'Log out'
          )}
        </button>

        {user && (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpenedOn(menuOpen ? null : location.pathname)}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Close menu' : 'Menu'}
            title={menuOpen ? 'Close menu' : 'Menu'}
            className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-colors duration-150 sm:hidden ${
              menuOpen
                ? 'border-accent-solid bg-accent-soft text-accent-strong'
                : 'border-control-border bg-control text-control-text hover:bg-control-hover'
            }`}
          >
            {menuOpen ? <IconX className="h-4.5 w-4.5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        )}
      </div>

      {user && menuOpen && (
        <div
          ref={menuRef}
          id={menuId}
          className="app-content-in absolute right-6 z-30 w-60 rounded-md border border-border bg-surface p-1.5 shadow-md sm:hidden"
        >
          <AppLink
            to="/profile"
            onClick={guardNavigation}
            className={`${MENU_ROW} text-text hover:bg-surface-alt`}
          >
            <Avatar fullName={user.fullName} />
            <span className="min-w-0 flex-1 truncate">{user.fullName}</span>
          </AppLink>

          <div className="my-1.5 border-t border-border" />

          <nav aria-label="Sections" className="grid gap-0.5">
            {navSections.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={guardNavigation}
                className={({ isActive }) =>
                  `${MENU_ROW} ${
                    isActive
                      ? 'bg-accent-soft text-accent-strong'
                      : 'text-text hover:bg-surface-alt'
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

        </div>
      )}
    </header>
  )
}
