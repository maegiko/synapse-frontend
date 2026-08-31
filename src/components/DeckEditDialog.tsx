import { useState } from 'react'
import type { FormEvent } from 'react'
import { Dialog } from './Dialog'
import { FormAlert } from './FormAlert'
import { TextField } from './TextField'
import { IconSpinner } from './icons'
import { btnGhostLg, btnPrimaryDisabled, btnPrimaryLg } from './ui'
import type { UpdateDeckRequest } from '../api'

interface DeckEditDialogProps {
  /** The deck's current name, shown prefilled. */
  initialTitle: string
  isPending: boolean
  errorMessage?: string
  onSubmit: (body: UpdateDeckRequest) => void
  onClose: () => void
}

/**
 * Renames a deck. The only editable field a deck has, so this is a single input;
 * the submit stays disabled until the name is a non-blank change.
 */
export function DeckEditDialog({
  initialTitle,
  isPending,
  errorMessage,
  onSubmit,
  onClose,
}: DeckEditDialogProps) {
  const [title, setTitle] = useState(initialTitle)
  const [fieldErrorMessage, setFieldErrorMessage] = useState<string>()

  const trimmed = title.trim()
  const hasChanges = trimmed !== initialTitle
  // Matches the profile form: the submit only lights up once the name is a
  // non-empty change.
  const canSubmit = hasChanges && trimmed !== ''

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending || !canSubmit) return

    if (!trimmed) {
      setFieldErrorMessage('Give this deck a name.')
      return
    }
    onSubmit({ title: trimmed })
  }

  return (
    <Dialog
      title="Rename deck"
      description="Give this deck a clearer name. Its cards and review schedule are untouched."
      onClose={onClose}
    >
      <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
        {errorMessage && <FormAlert message={errorMessage} />}

        <TextField
          label="Deck name"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={fieldErrorMessage}
          disabled={isPending}
          autoComplete="off"
        />

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className={`${btnPrimaryLg} ${btnPrimaryDisabled}`}
            disabled={isPending || !canSubmit}
          >
            {isPending && <IconSpinner className="h-4.5 w-4.5" />}
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" className={btnGhostLg} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          {!canSubmit && !isPending && (
            <span className="text-xs text-text-muted">
              {trimmed === '' ? 'Enter a name to save.' : 'Change the name to save.'}
            </span>
          )}
        </div>
      </form>
    </Dialog>
  )
}
