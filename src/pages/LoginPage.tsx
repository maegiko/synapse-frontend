import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { TextField } from '../components/TextField'
import { btnSubmit } from '../components/ui'
import { useAuth } from '../auth/useAuth'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import { validateEmail, validatePassword } from '../lib/validation'

const ASIDE_BULLETS = [
  'Your notes, summaries, decks, and quizzes are exactly where you left them.',
  'Every quiz attempt is saved, so you can see what is actually sticking.',
  'Nothing is shared with anyone else. You only ever see your own material.',
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      navigate(redirectTo, { replace: true })
    } catch (error) {
      // Unknown email and wrong password intentionally look the same.
      setFormError(
        isStatus(error, 401) ? 'Invalid email or password.' : toFormMessage(error),
      )
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Log in to Synapse"
      subtitle="Pick up where you left off, with every note and deck still in place."
      asideTitle="Your study material is waiting."
      asideBullets={ASIDE_BULLETS}
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-bold text-accent-foreground no-underline hover:underline">
            Create an account
          </Link>
        </>
      }
    >
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

        <button type="submit" className={btnSubmit} disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  )
}
