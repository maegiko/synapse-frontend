import { useState } from 'react'
import type { FormEvent } from 'react'
import { Dialog } from './Dialog'
import { FormAlert } from './FormAlert'
import { TextField } from './TextField'
import { IconSpinner } from './icons'
import { btnGhostLg, btnPrimaryDisabled, btnPrimaryLg } from './ui'
import type { UpdateDeckRequest } from '../api'
import { TITLE_MAX_LENGTH, validateTitle } from '../lib/validation'

interface DeckEditDialogProps {
  initialTitle: string
  isPending: boolean
  errorMessage?: string
  onSubmit: (body: UpdateDeckRequest) => void
  onClose: () => void
}

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
  const canSubmit = hasChanges && trimmed !== ''

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending || !canSubmit) return

    const invalid = validateTitle(title, 'deck', 'name')
    setFieldErrorMessage(invalid ?? undefined)
    if (invalid) return

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
          maxLength={TITLE_MAX_LENGTH}
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
