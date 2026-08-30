import { FormAlert } from './FormAlert'
import { IconSpinner } from './icons'
import { btnGhostLg, btnPrimaryDisabled, btnPrimaryLg } from './ui'

interface MoveConfirmationProps {
  /** The full question, e.g. "Move ‘Cell Biology’ from Biology to Exam prep?". */
  detail: string
  isPending: boolean
  errorMessage?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * The confirmation step for a move between groups, shown in place of the
 * picker's list rather than as a second modal over it — one dialog on screen
 * keeps Escape and the focus trap unambiguous.
 *
 * A move is confirmed because content belongs to exactly one group: adding it
 * here silently takes it out of wherever it is now.
 */
export function MoveConfirmation({
  detail,
  isPending,
  errorMessage,
  onConfirm,
  onCancel,
}: MoveConfirmationProps) {
  return (
    <div className="mt-6 grid gap-5">
      {errorMessage && <FormAlert message={errorMessage} />}
      <p className="max-w-[52ch] text-sm text-text-muted">{detail}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={`${btnPrimaryLg} ${btnPrimaryDisabled}`}
          onClick={onConfirm}
          disabled={isPending}
        >
          {isPending && <IconSpinner className="h-4.5 w-4.5 animate-spin" />}
          {isPending ? 'Moving…' : 'Move it'}
        </button>
        <button type="button" className={btnGhostLg} onClick={onCancel} disabled={isPending}>
          Cancel
        </button>
      </div>
    </div>
  )
}
