import { IconPin, IconSpinner } from './icons'
import { btnGhostSm, pinnedTone } from './ui'

interface PinToggleProps {
  pinned: boolean
  /** What is being pinned, for the accessible name: `note`, `deck`, or `quiz`. */
  noun: string
  /** True while this control's own request is in flight. */
  isPending: boolean
  /** True while something else on the page is busy. */
  disabled?: boolean
  onToggle: (pinned: boolean) => void
}

/**
 * The pin control on a resource's own page. One button in two states: `Pin`
 * with an outlined pin, `Unpin` with the filled gold one, so the label always
 * names what the next press does rather than only reporting the state.
 *
 * Never icon-only, and the spinner it swaps in while a request is running is
 * the same size as the icon, so the cluster around it does not move.
 */
export function PinToggle({ pinned, noun, isPending, disabled = false, onToggle }: PinToggleProps) {
  const label = pinned ? 'Unpin' : 'Pin'

  return (
    <button
      type="button"
      className={`${btnGhostSm} disabled:cursor-not-allowed disabled:opacity-60`}
      // Starts with the visible word, so what is read matches what is shown.
      aria-label={`${label} this ${noun}`}
      title={
        pinned
          ? `Unpin this ${noun}. It stops leading your library.`
          : `Pin this ${noun} so it leads your library.`
      }
      // Pending disables the button, so a second press cannot repeat the request.
      disabled={disabled || isPending}
      onClick={() => onToggle(!pinned)}
    >
      {isPending ? (
        <IconSpinner className="h-4 w-4" />
      ) : (
        <IconPin className={`h-4 w-4 ${pinned ? pinnedTone : ''}`} filled={pinned} />
      )}
      {label}
    </button>
  )
}
