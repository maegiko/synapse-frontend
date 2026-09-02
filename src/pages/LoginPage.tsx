import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { TextField } from '../components/TextField'
import { VerificationPending } from '../components/VerificationPending'
import { btnSubmit } from '../components/ui'
import { useAuth } from '../auth/useAuth'
import { isStatus, isUnverifiedAccount, toFormMessage } from '../lib/apiErrors'
import { useProductAnalytics } from '../lib/productAnalytics'
import { validateEmail, validatePassword } from '../lib/validation'

const ASIDE_BULLETS = [
  'Your notes, summaries, decks and quizzes are exactly where you left them.',
  'Your review progress and quiz scores are saved automatically.',
  'Your library stays organised, so you can get straight back to studying.',
]

export function LoginPage() {
  const { login } = useAuth()
  const capture = useProductAnalytics()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  /** Normalized the way the backend normalizes it, so a resend finds the account. */
  const [unverifiedEmail, setUnverifiedEmail] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const errors = {
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
    }
    setFieldErrors(errors)
    setFormError('')
    if (errors.email || errors.password) return

    setSubmitting(true)
    try {
      await login(email, password)
      capture('login_succeeded')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (isUnverifiedAccount(error)) {
        setPassword('')
        setUnverifiedEmail(email.trim().toLowerCase())
        setSubmitting(false)
        return
      }
      setFormError(
        isStatus(error, 401) || isStatus(error, 400)
          ? 'Invalid email or password.'
          : toFormMessage(error),
      )
      setSubmitting(false)
    }
  }

  const unverified = Boolean(unverifiedEmail)

  return (
    <AuthLayout
      title={unverified ? 'Confirm your email first' : 'Log in to Synapse'}
      subtitle={
        unverified
          ? 'Your account exists, but it still needs its address confirmed.'
          : 'Sign in and get back to what you were studying.'
      }
      asideTitle="Your study material is waiting."
      asideBullets={ASIDE_BULLETS}
      footer={
        unverified ? (
          <button
            type="button"
            className="cursor-pointer font-bold text-accent-foreground hover:underline"
            onClick={() => setUnverifiedEmail('')}
          >
            Back to log in
          </button>
        ) : (
          <>
            New here?{' '}
            <Link to="/register" className="font-bold text-accent-foreground no-underline hover:underline">
              Create an account
            </Link>
          </>
        )
      }
    >
      {unverified ? (
        <VerificationPending
          email={unverifiedEmail}
          description="We sent a verification link when the account was created, to"
        />
      ) : (
      <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
        {formError && <FormAlert message={formError} />}

        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@university.edu"
          value={email}
          error={fieldErrors.email}
          disabled={submitting}
          onChange={(event) => setEmail(event.target.value)}
        />

        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          error={fieldErrors.password}
          disabled={submitting}
          onChange={(event) => setPassword(event.target.value)}
        />

        <p className="-mt-2 text-sm">
          <Link
            to="/forgot-password"
            className="font-bold text-accent-foreground no-underline hover:underline"
          >
            Forgot your password?
          </Link>
        </p>

        <button type="submit" className={btnSubmit} disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      )}
    </AuthLayout>
  )
}
