import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api'
import { FormAlert } from './FormAlert'
import { TextField } from './TextField'
import { IconCheck } from './icons'
import { btnGhostLg, successAlert } from './ui'
import { retryAfterSeconds, toEmailSendMessage } from '../lib/apiErrors'
import { useCooldown } from '../lib/useCooldown'
import { validateEmail } from '../lib/validation'

interface VerificationPendingProps {
  /** Left out on the verification page, which must ask for the address first. */
  email?: string
  description: string
}

/**
 * The check-your-email state, after registering, after a login refused for an
 * unconfirmed address, and after a stale link. The resend answer is identical for
 * unknown, verified and pending addresses, so the copy stays neutral.
 */
export function VerificationPending({ email, description }: VerificationPendingProps) {
  const [typedEmail, setTypedEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const cooldown = useCooldown()

  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    panel.current?.focus()
  }, [])

  const blocked = sending || cooldown.remaining > 0

  async function resend(address: string) {
    if (blocked) return
    setSending(true)
    setSent(false)
    setError('')
    try {
      await api.auth.resendVerification(address)
      setSent(true)
    } catch (caught) {
      cooldown.start(retryAfterSeconds(caught))
      setError(toEmailSendMessage(caught))
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const invalid = validateEmail(typedEmail)
    setFieldError(invalid ?? '')
    if (invalid) return
    void resend(typedEmail)
  }

  const button = (
    <div>
      <button
        type={email ? 'button' : 'submit'}
        className={`${btnGhostLg} w-full disabled:cursor-not-allowed disabled:opacity-60`}
        onClick={email ? () => void resend(email) : undefined}
        disabled={blocked}
      >
        {sending ? 'Sending…' : email ? 'Resend the email' : 'Send a new link'}
      </button>
      <p className="mt-2 min-h-4.5 text-center text-xs text-text-muted" aria-live="polite">
        {cooldown.remaining > 0 ? `You can ask for another link in ${cooldown.remaining}s.` : ''}
      </p>
    </div>
  )

  const feedback = (
    <>
      {error && <FormAlert message={error} />}
      {sent && !error && (
        <p className={successAlert} role="status">
          <IconCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          <span>If that address still needs verifying, we have sent a new link.</span>
        </p>
      )}
    </>
  )

  return (
    <div ref={panel} tabIndex={-1} className="grid gap-5 focus:outline-none">
      <div>
        <p className="text-sm text-text-muted">{description}</p>
        {email && <p className="mt-2 text-base font-bold break-words">{email}</p>}
        <p className="mt-2 text-sm text-text-muted">
          It can take a minute to arrive, and it is worth checking your spam folder. Opening the
          link signs you in on whichever device you open it on.
        </p>
      </div>

      {email ? (
        <>
          {feedback}
          {button}
        </>
      ) : (
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          {feedback}
          <TextField
            label="Your email address"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@university.edu"
            value={typedEmail}
            error={fieldError || undefined}
            disabled={sending}
            onChange={(event) => setTypedEmail(event.target.value)}
          />
          {button}
        </form>
      )}
    </div>
  )
}
