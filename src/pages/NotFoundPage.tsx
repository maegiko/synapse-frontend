import { useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { AppLink } from '../components/AppLink'
import { ErrorPageShell } from '../components/ErrorPageShell'
import { AuthBootScreen } from '../components/RouteGuards'
import { IconCircleDashed } from '../components/icons'
import { btnGhostLg, btnPrimaryLg } from '../components/ui'

const TITLE = 'Page not found - Synapse'

/**
 * The destination for an address that matches no route at all.
 *
 * A page that exists but has no content behind it is a different thing: a
 * deleted note, a deck on another account. Those keep their own not-found
 * state on their own page, which can say what is missing and offer to make a
 * new one. This page only knows that the address itself leads nowhere, so it
 * says exactly that and points back at somewhere real. It never redirects on
 * its own: the visitor decides where to go next, and the address stays put so
 * a mistyped link is still visible and fixable.
 */
export function NotFoundPage() {
  const { status } = useAuth()

  useEffect(() => {
    const previous = document.title
    document.title = TITLE
    return () => {
      document.title = previous
    }
  }, [])

  // The recovery actions depend on who is asking, so wait out the one boot
  // refresh rather than offering a signed-out route to a signed-in visitor.
  if (status === 'loading') return <AuthBootScreen />

  const signedIn = status === 'authenticated'

  return (
    <ErrorPageShell
      icon={<IconCircleDashed className="h-6 w-6" />}
      title="We could not find that page"
      description="The address may have a typo in it, or the page may have moved. Nothing you have saved is affected."
    >
      {signedIn ? (
        <>
          <AppLink to="/dashboard" className={btnPrimaryLg}>
            Back to dashboard
          </AppLink>
          <AppLink to="/library" className={btnGhostLg}>
            Go to your library
          </AppLink>
        </>
      ) : (
        <>
          <AppLink to="/" className={btnPrimaryLg}>
            Back to home
          </AppLink>
          <AppLink to="/login" className={btnGhostLg}>
            Log in
          </AppLink>
        </>
      )}
    </ErrorPageShell>
  )
}
