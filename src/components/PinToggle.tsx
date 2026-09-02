import { IconPin, IconSpinner } from './icons'
import { btnGhostSm, pinnedTone } from './ui'

interface PinToggleProps {
  pinned: boolean
  noun: string
  /** True while this control's own request is in flight. */
  isPending: boolean
  /** True while something else on the page is busy. */
  disabled?: boolean
  onToggle: (pinned: boolean) => void
}

/**
 * One button in two states, so the label always names what the next press does.
 * Its spinner is the icon's size, so the cluster around it does not move.
 */
export function PinToggle({ pinned, noun, isPending, disabled = false, onToggle }: PinToggleProps) {
  const label = pinned ? 'Unpin' : 'Pin'

  return (
    <button
      type="button"
      className={`${btnGhostSm} disabled:cursor-not-allowed disabled:opacity-60`}
      aria-label={`${label} this ${noun}`}
      title={
        pinned
          ? `Unpin this ${noun}. It stops leading your library.`
          : `Pin this ${noun} so it leads your library.`
      }
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
