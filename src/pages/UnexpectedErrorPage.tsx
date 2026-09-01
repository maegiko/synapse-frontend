import { ErrorPageShell } from '../components/ErrorPageShell'
import { IconAlert } from '../components/icons'
import { btnGhostLg, btnPrimaryLg } from '../components/ui'

/**
 * What {@link AppErrorBoundary} shows in place of the app after a rendering
 * failure. Whatever broke is unknown from here, so this page assumes nothing
 * is working: no router, no auth, no query cache. Both ways out leave the
 * current React tree behind entirely, a full reload and a native link, so
 * neither depends on the code that just failed.
 *
 * The visitor is told what happened and what to do, never how it broke. The
 * details go to the console in development, which is where they are useful.
 */
export function UnexpectedErrorPage() {
  return (
    <ErrorPageShell
      announce
      icon={<IconAlert className="h-6 w-6" />}
      title="Synapse hit an unexpected problem"
      description="Something went wrong while showing this page. Reloading usually clears it, and your saved notes, decks and quizzes are safe."
    >
      <button type="button" className={btnPrimaryLg} onClick={() => window.location.reload()}>
        Reload page
      </button>
      <a href="/" className={btnGhostLg}>
        Back to home
      </a>
    </ErrorPageShell>
  )
}
