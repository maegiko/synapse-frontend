import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { TextField } from '../components/TextField'
import { IconCheck } from '../components/icons'
import { btnPrimaryLg, btnSubmit, successAlert } from '../components/ui'
import { useAuth } from '../auth/useAuth'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, validatePassword } from '../lib/validation'

const ASIDE_BULLETS = [
  'Pick something you have not used on this account before.',
  'Setting a new password signs every other device out.',
  'Reset links work once, and expire 30 minutes after they are sent.',
]

/** What the page is doing, in the order a visit moves through it. */
type Outcome = 'form' | 'unusable' | 'done'

/**
 * The page every password-reset link points at. It reads the `token` query
 * parameter, collects a new password, and posts the two together.
 *
 * Public on purpose: whoever opens the link has forgotten their password and is
 * normally signed out. A signed-in visitor is not bounced to the dashboard
 * either — the reset applies to the account the *token* belongs to, which need
 * not be the one this browser is signed into.
 *
 * The token is a credential: anyone holding this URL can take the account over
 * until it is used or expires. It is read once into memory, sent in exactly one
 * request, and never logged, stored, rendered, or left in the address bar.
 */
export function ResetPasswordPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { status, logout } = useAuth()

  // Captured on the first render, before the effect below strips it from the
  // URL. Component state and nothing else: not localStorage, not a cookie, not
  // anything an analytics or error report could pick up.
  const [token] = useState(() => searchParams.get('token') ?? '')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // A visit with no token has nothing to send and never calls the backend: it
  // is decided here, in the first render, rather than in an effect.
  const [outcome, setOutcome] = useState<Outcome>(token ? 'form' : 'unusable')

  // Out of the address bar as soon as the page has it, so the token does not
  // sit in history, survive a bookmark or a shared URL, or leak through a
  // Referer header. Nothing is submitted on load: the user has to type a
  // password first, which is also what stops a mail scanner's prefetch from
  // consuming the link.
  useEffect(() => {
    if (searchParams.has('token')) setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  // The panel that replaces the form once the reset is done or the link is
  // spent, focused so the keyboard is not left on a control that has gone.
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (outcome !== 'form') panel.current?.focus()
  }, [outcome])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    // The backend has no confirmation field, so the match is checked here. A
    // validation 400 does not consume the token, but catching the rules before
    // sending is what keeps a mistyped password from looking like a dead link.
    const errors = {
      password: validatePassword(password) ?? undefined,
      confirmPassword: !confirmPassword
        ? 'Confirm your new password.'
        : confirmPassword === password
          ? undefined
          : 'The passwords do not match.',
    }
    setFieldErrors(errors)
    setFormError('')
    if (errors.password || errors.confirmPassword) return

    setSubmitting(true)
    try {
      await api.auth.resetPassword({ token, newPassword: password })
      // Nothing comes back to sign anybody in, and the response has just
      // cleared this browser's refresh cookie, so a session held here is over
      // whichever account it belonged to. Drop it locally rather than leave the
      // header showing a session the next refresh will fail.
      if (status === 'authenticated') void logout().catch(() => {})
      setPassword('')
      setConfirmPassword('')
      setOutcome('done')
    } catch (error) {
      // Unknown, expired, superseded by a newer request, and already used all
      // answer the same 400 on purpose; the backend does not say which, so this
      // shows one "cannot be used" state and a way to ask for a fresh link.
      if (isStatus(error, 400)) {
        setOutcome('unusable')
        return
      }
      setFormError(toFormMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title={TITLES[outcome]}
      subtitle={SUBTITLES[outcome]}
      asideTitle="One link, and you are back in."
      asideBullets={ASIDE_BULLETS}
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-bold text-accent-foreground no-underline hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {outcome === 'form' ? (
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          {formError && <FormAlert message={formError} />}

          <TextField
            label="New password"
            type="password"
            name="newPassword"
            autoComplete="new-password"
            hint={`Between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`}
            value={password}
            error={fieldErrors.password}
            disabled={submitting}
            onChange={(event) => setPassword(event.target.value)}
          />

          <TextField
            label="Confirm new password"
            type="password"
            name="confirmNewPassword"
            autoComplete="new-password"
            value={confirmPassword}
            error={fieldErrors.confirmPassword}
            disabled={submitting}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          <button type="submit" className={btnSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Set new password'}
          </button>
        </form>
      ) : (
        <div ref={panel} tabIndex={-1} className="grid gap-5 focus:outline-none">
          {outcome === 'done' ? (
            <>
              <p className={successAlert} role="status">
                <IconCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                <span>Your password is set. Log in with it to carry on.</span>
              </p>
              <p className="text-sm text-text-muted">
                Every device that was signed into this account has been signed out, so you will need
                the new password on each of them.
              </p>
              <Link to="/login" className={`${btnPrimaryLg} w-full`}>
                Log in
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-text-muted">
                This link cannot be used. It may have expired, it may already have been used, or a
                newer request may have replaced it. Your password has not changed, and asking again
                sends a fresh link.
              </p>
              <Link to="/forgot-password" className={`${btnPrimaryLg} w-full`}>
                Send a new link
              </Link>
            </>
          )}
        </div>
      )}
    </AuthLayout>
  )
}

const TITLES: Record<Outcome, string> = {
  form: 'Set a new password',
  unusable: 'This link cannot be used',
  done: 'Password updated',
}

const SUBTITLES: Record<Outcome, string> = {
  form: 'Choose the password you will log in with from now on.',
  unusable: 'Reset links are single use, and they expire 30 minutes after they are sent.',
  done: 'That is everything. Your new password is ready to use.',
}
