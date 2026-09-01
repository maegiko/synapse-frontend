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
  /**
   * The normalized address the backend named, when the caller knows it. Left
   * out on the verification page, which only knows that a link did not work:
   * the panel then asks for the address before it can send anything.
   */
  email?: string
  /** What happened just before this panel appeared. One sentence. */
  description: string
}

/**
 * The check-your-email state: the end of registration, a login refused because
 * the address has never been confirmed, and a verification link that had
 * already expired. A registration link only lasts an hour, so arriving here
 * from a stale link is an ordinary outcome rather than a failure.
 *
 * The resend response is deliberately identical for an unknown address, an
 * already verified one, and a genuinely pending one, so the confirmation here
 * is worded neutrally: it must never imply whether an account exists. Nothing
 * is lost when a send fails, including the address it was about.
 */
export function VerificationPending({ email, description }: VerificationPendingProps) {
  const [typedEmail, setTypedEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const cooldown = useCooldown()

  // This panel replaces the form the visitor had just submitted, so focus moves
  // to it: otherwise the keyboard is left on a control that no longer exists,
  // and a screen reader is left reading the page it has already left.
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
      // A 429 says how long to wait; anything else can be retried at once.
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
