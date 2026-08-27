import { useState } from 'react'
import { Link } from 'react-router-dom'
import heroMark from '../assets/hero.png'
import { useAuth } from '../auth/useAuth'
import { btnGhostSm, shell } from '../components/ui'

/** Placeholder shell for the signed-in experience; the real surfaces come later. */
export function DashboardPage() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const firstName = user?.fullName.trim().split(' ')[0] ?? 'there'

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className={`${shell} flex items-center gap-7 py-4`}>
          <Link
            to="/dashboard"
            className="mr-auto inline-flex items-center gap-2.5 font-display text-lg font-semibold text-text no-underline"
          >
            <img src={heroMark} alt="" className="rounded-md" width="28" height="28" />
            <span>Synapse</span>
          </Link>
          <span className="hidden text-sm font-semibold text-text-muted sm:inline">
            {user?.email}
          </span>
          <button type="button" className={btnGhostSm} onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </header>

      <main className={`${shell} py-20`}>
        <h1 className="text-2xl">Welcome back, {firstName}.</h1>
        <p className="mt-3 max-w-[56ch] text-base text-text-muted">
          Your dashboard is next. Notes, decks, quizzes, and score history will appear
          here once those screens are built.
        </p>
      </main>
    </>
  )
}
