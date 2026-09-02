import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { FormAlert } from '../components/FormAlert'
import { TextField } from '../components/TextField'
import { IconCheck } from '../components/icons'
import { btnGhostLg, btnSubmit, successAlert } from '../components/ui'
import { isStatus, retryAfterSeconds, toFormMessage } from '../lib/apiErrors'
import { useCooldown } from '../lib/useCooldown'
import { validateEmail } from '../lib/validation'

const ASIDE_BULLETS = [
  'A reset link goes out to the address on your account.',
  'The link works once, and only for 30 minutes after it is sent.',
  'Asking again replaces the previous link, so use the newest email.',
]

/**
 * The one sentence this page may say. Unknown, unverified, live and failed-send
 * all answer 204, and a 429 counts unknown addresses too, so anything more
 * specific would leak whether an account exists.
 */
const GENERIC_CONFIRMATION = 'If an account exists for that address, we sent a password-reset link.'

/**
 * Public rather than guest-only: the reset page it leads to is public too, and
 * somebody with a stale link needs to get back here whatever session the browser
 * happens to be holding.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [requested, setRequested] = useState(false)
  const cooldown = useCooldown()

  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (requested) panel.current?.focus()
  }, [requested])

  const blocked = sending || cooldown.remaining > 0

  async function send(address: string) {
    if (blocked) return
    setSending(true)
    setFormError('')
    try {
      await api.auth.forgotPassword(address)
      setRequested(true)
    } catch (error) {
      if (isStatus(error, 400)) {
        setRequested(false)
        setFieldError('Enter a valid email address.')
        return
      }
      if (isStatus(error, 429)) {
        cooldown.start(retryAfterSeconds(error))
        setRequested(true)
        return
      }
      setFormError(toFormMessage(error))
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const invalid = validateEmail(email)
    setFieldError(invalid ?? '')
    if (invalid) return
    void send(email)
  }

  return (
    <AuthLayout
      title={requested ? 'Check your email' : 'Forgot your password?'}
      subtitle={
        requested
          ? 'That is everything we can do from here.'
          : 'Tell us the address on your account and we will send a link to set a new password.'
      }
      asideTitle="Getting back in takes one link."
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
      {requested ? (
        <div ref={panel} tabIndex={-1} className="grid gap-5 focus:outline-none">
          <p className={successAlert} role="status">
            <IconCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>{GENERIC_CONFIRMATION}</span>
          </p>

          <p className="text-sm text-text-muted">
            It can take a minute to arrive, and it is worth checking your spam folder. The link
            expires 30 minutes after it is sent, and asking again replaces it.
          </p>

          {formError && <FormAlert message={formError} />}

          <div>
            <button
              type="button"
              className={`${btnGhostLg} w-full disabled:cursor-not-allowed disabled:opacity-60`}
              onClick={() => void send(email)}
              disabled={blocked}
            >
              {sending ? 'Sending…' : 'Send it again'}
            </button>
            <p className="mt-2 min-h-4.5 text-center text-xs text-text-muted" aria-live="polite">
              {cooldown.remaining > 0 ? `You can ask for another link in ${cooldown.remaining}s.` : ''}
            </p>
          </div>
        </div>
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
            error={fieldError || undefined}
            disabled={sending}
            onChange={(event) => setEmail(event.target.value)}
          />

          <button type="submit" className={btnSubmit} disabled={sending}>
            {sending ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
