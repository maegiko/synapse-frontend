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
import { isUsableEmailedToken } from '../lib/validation'
import { useProductAnalytics } from '../lib/productAnalytics'

const ASIDE_BULLETS = [
  'Confirming your address is the last step of signing up.',
  'It is also how a new address is confirmed when you change the one on your account.',
  'Links are single use, and a newer link always replaces an older one.',
]

type Outcome = 'checking' | 'confirmed' | 'unusable' | 'failed'

/**
 * Where every emailed verification link lands, for a new account and a confirmed
 * email change alike. Public on purpose: whoever opens it is normally signed out,
 * and the call takes no bearer token.
 */
export function VerifyEmailPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { status, adoptSession, refreshUser } = useAuth()
  const capture = useProductAnalytics()

  const [outcome, setOutcome] = useState<Outcome>(
    isUsableEmailedToken(searchParams.get('token') ?? '') ? 'checking' : 'unusable',
  )
  const [failureMessage, setFailureMessage] = useState('')
  const [confirmedEmail, setConfirmedEmail] = useState('')

  const signedIn = status === 'authenticated'

  const requested = useRef(false)

  useEffect(() => {
    if (requested.current) return
    if (status === 'loading') return

    const token = searchParams.get('token') ?? ''
    if (!isUsableEmailedToken(token)) {
      requested.current = true
      return
    }
    requested.current = true
    setSearchParams({}, { replace: true })

    const wasSignedIn = status === 'authenticated'
    void (async () => {
      try {
        const confirmed = await api.auth.verifyEmail(token)

        if (confirmed.kind === 'REGISTRATION') {
          adoptSession(confirmed)
          capture('email_verified')
          setOutcome('confirmed')
          navigate('/dashboard', { replace: true })
          return
        }

        if (wasSignedIn) await refreshUser().catch(() => {})
        setConfirmedEmail(confirmed.email)
        setOutcome('confirmed')
      } catch (error) {
        if (isStatus(error, 400)) {
          setOutcome('unusable')
          return
        }
        setFailureMessage(
          isStatus(error, 409)
            ? 'That address now belongs to another account, so your account keeps the address it has.'
            : toFormMessage(error),
        )
        setOutcome('failed')
      }
    })()
  }, [searchParams, setSearchParams, status, adoptSession, navigate, refreshUser, capture])

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
