import { useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { AppLink } from '../components/AppLink'
import { ErrorPageShell } from '../components/ErrorPageShell'
import { AuthBootScreen } from '../components/RouteGuards'
import { IconCircleDashed } from '../components/icons'
import { btnGhostLg, btnPrimaryLg } from '../components/ui'

const TITLE = 'Page not found - Synapse'

/**
 * An address that matches no route. A page that exists but has no content behind
 * it is a different thing, and keeps its own not-found state on its own page.
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
