import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AppLink } from '../components/AppLink'
import { ErrorPageShell } from '../components/ErrorPageShell'
import { IconCheck } from '../components/icons'
import { btnGhostLg, btnPrimaryLg } from '../components/ui'

const TITLE = 'Account deleted - Synapse'

/** Set by the profile page when the deletion actually returned. */
export interface AccountDeletedState {
  deleted?: boolean
}

/**
 * Where a deleted account ends up. Reached only by being sent here: the session
 * is already gone by the time this renders, so there is nothing left to read and
 * nothing to confirm against.
 *
 * <p>Anyone arriving at the address directly goes to the landing page instead.
 * The alternative is telling a signed-out visitor that an account they may still
 * have has been deleted.</p>
 */
export function AccountDeletedPage() {
  const location = useLocation()
  const state = location.state as AccountDeletedState | null

  useEffect(() => {
    const previous = document.title
    document.title = TITLE
    return () => {
      document.title = previous
    }
  }, [])

  if (!state?.deleted) return <Navigate to="/" replace />

  return (
    <ErrorPageShell
      icon={<IconCheck className="h-6 w-6" />}
      title="Your account has been deleted"
      description="Your notes, decks, quizzes, scores, groups and streak history are gone, and every device is signed out. You should also get an email confirming it."
    >
      <AppLink to="/" className={btnPrimaryLg}>
        Back to home
      </AppLink>
      <AppLink to="/register" className={btnGhostLg}>
        Create a new account
      </AppLink>
    </ErrorPageShell>
  )
}
