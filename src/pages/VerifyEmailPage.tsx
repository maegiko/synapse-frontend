import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { VerificationPending } from '../components/VerificationPending'
import { IconCheck } from '../components/icons'
import { btnPrimaryLg, successAlert } from '../components/ui'
import { useAuth } from '../auth/useAuth'
import { isStatus, toFormMessage } from '../lib/apiErrors'

const ASIDE_BULLETS = [
  'Confirming your address is the last step of signing up.',
  'It is also how a new address is confirmed when you change the one on your account.',
  'Links are single use, and a newer link always replaces an older one.',
]

/** What the one request to the backend has told us so far. */
type Outcome = 'checking' | 'confirmed' | 'unusable' | 'failed'

/**
 * The page every verification link in an email points at, for a new account and
 * for a confirmed email change alike. It reads the `token` query parameter,
 * posts it once, and reports what came back.
 *
 * Public on purpose: whoever opens the link out of their inbox is normally
 * signed out, and the call itself takes no bearer token. Registration
 * verification signs the new account in; email-change verification does not.
 *
 * The token is used for exactly one thing. It is not logged, not stored, not
 * put in application state, and it is dropped from the address bar as soon as
 * the request has it, so a shared or bookmarked URL carries nothing.
 */
export function VerifyEmailPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { status, adoptSession, refreshUser } = useAuth()

  // A visit with no token in the URL has nothing to check and never calls the
  // backend: it is decided here, in the first render, rather than in an effect.
  const [outcome, setOutcome] = useState<Outcome>(
    searchParams.get('token') ? 'checking' : 'unusable',
  )
  const [failureMessage, setFailureMessage] = useState('')
  /** The address a confirmed email change moved the account onto. */
  const [confirmedEmail, setConfirmedEmail] = useState('')

  /**
   * Only ever used to choose a *recovery* route after an unusable link, which
   * is the one thing the backend cannot tell us: a `400` does not say which
   * kind of link it was, and being signed in is the only signal that it was
   * probably an email change. A successful confirmation never consults this;
   * that branches on the response's `kind`.
   */
  const signedIn = status === 'authenticated'

  // One request per visit. A verification link is opened by mail-client
  // previews and second clicks, and development Strict Mode mounts the page
  // twice, so the guard is a ref: it survives a re-render, a re-mount, and the
  // URL rewrite below, none of which are a new attempt.
  const requested = useRef(false)

  useEffect(() => {
    if (requested.current) return
    // Auth state settles on one refresh call at boot, and that call writes the
    // same access token and refresh cookie a registration link is about to
    // replace. Letting it finish first keeps the two out of each other's way,
    // so the session this page issues is the one that survives.
    if (status === 'loading') return

    const token = searchParams.get('token')
    if (!token) {
      requested.current = true
      return
    }
    requested.current = true

    const wasSignedIn = status === 'authenticated'
    // Set when the page leaves for the app, so the cleanup below does not touch
    // a URL this page no longer owns.
    let leaving = false

    void (async () => {
      try {
        const confirmed = await api.auth.verifyEmail(token)

        if (confirmed.kind === 'REGISTRATION') {
          // The confirmation is the sign-in: this answer carries an access
          // token and the call has already set the refresh cookie, so the new
          // account is signed in here and goes straight into the app without
          // ever typing the password a second time.
          adoptSession(confirmed)
          setOutcome('confirmed')
          // `replace`, so this history entry and the token in it are gone: back
          // never returns to a spent link.
          leaving = true
          navigate('/dashboard', { replace: true })
          return
        }

        // An email change instead: no session was issued, and any existing one
        // carries on. Only the profile is stale, and only for whoever is signed
        // in here. The confirmation itself has already succeeded, so a failure
        // to re-read the profile is not this page's news to report.
        if (wasSignedIn) await refreshUser().catch(() => {})
        setConfirmedEmail(confirmed.email)
        setOutcome('confirmed')
      } catch (error) {
        // Unknown, expired, replaced, and already used all answer the same 400,
        // including a second open of a link that already worked.
        if (isStatus(error, 400)) {
          setOutcome('unusable')
          return
        }
        // A 409 means somebody else claimed the address before this link was
        // opened; the account keeps the one it has.
        setFailureMessage(
          isStatus(error, 409)
            ? 'That address now belongs to another account, so your account keeps the address it has.'
            : toFormMessage(error),
        )
        setOutcome('failed')
      } finally {
        // The token has been used and must not sit in the address bar, the
        // history entry, or anything the page is later shared or reloaded from.
        if (!leaving) setSearchParams({}, { replace: true })
      }
    })()
  }, [searchParams, setSearchParams, status, adoptSession, navigate, refreshUser])

  return (
    <AuthLayout
      title={TITLES[outcome]}
      subtitle={SUBTITLES[outcome]}
      asideTitle="One click, and your address is confirmed."
      asideBullets={ASIDE_BULLETS}
      footer={
        signedIn ? (
          <Link to="/dashboard" className="font-bold text-accent-foreground no-underline hover:underline">
            Back to your dashboard
          </Link>
        ) : (
          <>
            Need an account?{' '}
            <Link to="/register" className="font-bold text-accent-foreground no-underline hover:underline">
              Create one
            </Link>
          </>
        )
      }
    >
      <div className="grid gap-5" aria-live="polite" aria-busy={outcome === 'checking'}>
        {outcome === 'checking' && (
          <p className="text-sm font-semibold text-text-muted">Confirming your email address…</p>
        )}

        {/*
          Only an email change ever rests here: confirming a registration link
          signs the account in and leaves for the dashboard.
        */}
        {outcome === 'confirmed' && (
          <>
            <p className={successAlert}>
              <IconCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              <span>
                {confirmedEmail
                  ? `Your account now uses ${confirmedEmail}.`
                  : 'Your email address is confirmed.'}
              </span>
            </p>
            <Link to={signedIn ? '/profile' : '/login'} className={`${btnPrimaryLg} w-full`}>
              {signedIn ? 'Back to your profile' : 'Log in'}
            </Link>
          </>
        )}

        {outcome === 'unusable' &&
          (signedIn ? (
            // Signed in, so this was most likely an email-change link. The
            // account keeps the address it has, and a fresh request starts from
            // the profile rather than from a resend.
            <>
              <p className="text-sm text-text-muted">
                This link cannot be used. It may have expired, it may already have been used, or a
                newer request may have replaced it. Your account still uses the address it had, so
                you can ask for the change again.
              </p>
              <Link to="/profile" className={`${btnPrimaryLg} w-full`}>
                Back to your profile
              </Link>
            </>
          ) : (
            // A registration link lasts an hour, so a stale one is an ordinary
            // thing to arrive with. The way out is a new link, asked for here.
            <>
              <VerificationPending description="Tell us the address it was sent to and we will send a new one." />
              <p className="text-center text-sm text-text-muted">
                Already confirmed?{' '}
                <Link
                  to="/login"
                  className="font-bold text-accent-foreground no-underline hover:underline"
                >
                  Log in
                </Link>
              </p>
            </>
          ))}

        {outcome === 'failed' && (
          <>
            <FormAlert message={failureMessage} />
            <Link to={signedIn ? '/profile' : '/login'} className={`${btnPrimaryLg} w-full`}>
              {signedIn ? 'Back to your profile' : 'Go to log in'}
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  )
}

const TITLES: Record<Outcome, string> = {
  checking: 'Confirming your email',
  confirmed: 'Email confirmed',
  unusable: 'This link cannot be used',
  failed: 'We could not confirm that',
}

const SUBTITLES: Record<Outcome, string> = {
  checking: 'This only takes a moment.',
  confirmed: 'That is everything. Your address is confirmed.',
  unusable:
    'Verification links are single use, and a link for a new account expires an hour after it is sent.',
  failed: 'Nothing about your account has changed.',
}
