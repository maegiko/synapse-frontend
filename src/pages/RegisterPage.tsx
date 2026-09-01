import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { TextField } from '../components/TextField'
import { btnSubmit } from '../components/ui'
import { useAuth } from '../auth/useAuth'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validateFullName,
  validatePassword,
} from '../lib/validation'

const ASIDE_BULLETS = [
  'Upload a PDF, DOCX, TXT or Markdown note up to 10 MB.',
  'Get a summary, a flashcard deck or a 10-question quiz from it.',
  'Keep everything in one place, with your quiz scores saved so you can track what’s sticking.',
]

interface FieldErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const errors: FieldErrors = {
      fullName: validateFullName(fullName) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirmPassword: password !== confirmPassword ? 'Both passwords must match.' : undefined,
    }
    setFieldErrors(errors)
    setFormError('')
    if (Object.values(errors).some(Boolean)) return

    setSubmitting(true)
    try {
      await register(fullName, email, password)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      if (isStatus(error, 409)) {
        setFieldErrors({ email: 'An account with this email already exists.' })
      } else {
        setFormError(toFormMessage(error))
      }
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Upload your first note and turn it into a summary, a deck, or a quiz in the same sitting."
      asideTitle="From upload to quiz score, in one sitting."
      asideBullets={ASIDE_BULLETS}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-accent-foreground no-underline hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
        {formError && <FormAlert message={formError} />}

        <TextField
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={fullName}
          error={fieldErrors.fullName}
          disabled={submitting}
          onChange={(event) => setFullName(event.target.value)}
        />

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint={`Between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`}
          value={password}
          error={fieldErrors.password}
          disabled={submitting}
          onChange={(event) => setPassword(event.target.value)}
        />

        <TextField
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          error={fieldErrors.confirmPassword}
          disabled={submitting}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <button type="submit" className={btnSubmit} disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
