import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { TextField } from '../components/TextField'
import { VerificationPending } from '../components/VerificationPending'
import { btnSubmit } from '../components/ui'
import { isStatus, toEmailSendMessage } from '../lib/apiErrors'
import { useProductAnalytics } from '../lib/productAnalytics'
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
  const capture = useProductAnalytics()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  /**
   * The address the backend says it wrote to, which is also what marks the
   * registration finished. It is the normalized form, so the resend action
   * asks about exactly the account that was created.
   */
  const [registeredEmail, setRegisteredEmail] = useState('')
  /**
   * The account was created but its verification email did not go out (a 502).
   * Nothing is lost: the resend action is the way out, so this lands on the same
   * screen with wording that does not claim an email was sent.
   */
  const [sendFailed, setSendFailed] = useState(false)

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
      // 202, not a session: the account exists but cannot log in until the
      // emailed link is confirmed, so nothing here signs anybody in.
      const created = await api.auth.register({ fullName, email, password })
      // The password has done its work and is never needed again on this page.
      setPassword('')
      setConfirmPassword('')
      setRegisteredEmail(created.email)
      capture('registration_submitted')
    } catch (error) {
      // A 409 means the address is already on a *verified* account. A pending
      // unverified registration answers the ordinary 202 with a fresh link, so
      // this never says "already exists" for one of those.
      if (isStatus(error, 409)) {
        setFieldErrors({ email: 'An account with this email already exists.' })
        setSubmitting(false)
        return
      }
      // 502: the account exists, only the email failed. The address is
      // normalized the way the backend normalizes it, so the resend action on
      // the next screen asks about the account that was just created.
      if (isStatus(error, 502)) {
        setPassword('')
        setConfirmPassword('')
        setSendFailed(true)
        setRegisteredEmail(email.trim().toLowerCase())
        setSubmitting(false)
        return
      }
      setFormError(toEmailSendMessage(error))
      setSubmitting(false)
    }
  }

  const done = Boolean(registeredEmail)

  return (
    <AuthLayout
      title={
        done
          ? sendFailed
            ? 'Send your verification link'
            : 'Check your email'
          : 'Create your account'
      }
      subtitle={
        done
          ? sendFailed
            ? 'Your account is created. The verification email did not go out, so send it again.'
            : 'Your account is created. One click confirms it is your address.'
          : 'Upload your first note and turn it into a summary, a deck, or a quiz in the same sitting.'
      }
      asideTitle="From upload to quiz score, in one sitting."
      asideBullets={ASIDE_BULLETS}
      footer={
        done ? (
          <>
            Already confirmed?{' '}
            <Link to="/login" className="font-bold text-accent-foreground no-underline hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-accent-foreground no-underline hover:underline">
              Log in
            </Link>
          </>
        )
      }
    >
      {done ? (
        <VerificationPending
          email={registeredEmail}
          description={
            sendFailed
              ? 'We could not send the verification link just now. It needs to go to'
              : 'We have sent a verification link to'
          }
        />
      ) : (
      <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
        {formError && <FormAlert message={formError} />}

        <TextField
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Alex Taylor"
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
      )}
    </AuthLayout>
  )
}
