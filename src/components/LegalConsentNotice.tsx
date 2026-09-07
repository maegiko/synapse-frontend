import { Link } from 'react-router-dom'

interface LegalConsentNoticeProps {
  /**
   * Register only. An age floor that is published in the terms but never claimed
   * by anybody is not much of a floor: this is the point where someone asserts
   * they meet it, which is the difference between a rule and a record of it.
   */
  confirmAge?: boolean
}

/**
 * The clickwrap notice shown on the log in and register forms.
 *
 * <p>Sits directly above the button that submits the form, so it is next to the
 * action it describes rather than stranded at the bottom of the page. "Continuing"
 * is deliberate: it covers the password button below it and the Google button
 * below that, both of which can create or enter an account.</p>
 *
 * <p>Kept to one line at the card's full width. It still wraps on a narrow
 * phone, which is why the links are short enough to survive the break.</p>
 */
export function LegalConsentNotice({ confirmAge = false }: LegalConsentNoticeProps) {
  return (
    <p className="text-xs text-pretty text-text-muted">
      By continuing, you {confirmAge ? <>confirm you are 13 or older and </> : null}agree to the{' '}
      <Link to="/terms" className="font-semibold text-accent-foreground">
        terms
      </Link>{' '}
      and{' '}
      <Link to="/privacy" className="font-semibold text-accent-foreground">
        privacy policy
      </Link>
      .
    </p>
  )
}
