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
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  isUsableEmailedToken,
  validatePassword,
} from '../lib/validation'

const ASIDE_BULLETS = [
  'Pick something you have not used on this account before.',
  'Setting a new password signs every other device out.',
  'Reset links work once, and expire 30 minutes after they are sent.',
]

type Outcome = 'form' | 'unusable' | 'done'

/**
 * Public on purpose: whoever opens the link is normally signed out, and a
 * signed-in visitor is not bounced away either, since the reset applies to the
 * account the token belongs to rather than the one this browser holds.
 *
 * The token is a credential. It is read once into memory, sent in exactly one
 * request, and never logged, stored, rendered, or left in the address bar.
 */
export function ResetPasswordPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { status, logout } = useAuth()

  const [token] = useState(() => searchParams.get('token') ?? '')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<Outcome>(
    isUsableEmailedToken(token) ? 'form' : 'unusable',
  )

  useEffect(() => {
    if (searchParams.has('token')) setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (outcome !== 'form') panel.current?.focus()
  }, [outcome])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

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
      if (status === 'authenticated') void logout().catch(() => {})
      setPassword('')
      setConfirmPassword('')
      setOutcome('done')
    } catch (error) {
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
