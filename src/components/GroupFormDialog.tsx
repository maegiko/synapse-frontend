import { useState } from 'react'
import type { FormEvent } from 'react'
import { Dialog } from './Dialog'
import { FormAlert } from './FormAlert'
import { TextField } from './TextField'
import { IconSpinner } from './icons'
import {
  btnGhostLg,
  btnPrimaryDisabled,
  btnPrimaryLg,
  fieldError,
  fieldHint,
  fieldInput,
  fieldInputInvalid,
  fieldLabel,
} from './ui'
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  validateDescription,
  validateTitle,
} from '../lib/validation'

export interface GroupFormValues {
  name: string
  /** Already trimmed. Blank clears the description back to null. */
  description: string
}

interface GroupFormDialogProps {
  title: string
  description?: string
  submitLabel: string
  pendingLabel: string
  initialValues?: GroupFormValues
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: GroupFormValues) => void
  onClose: () => void
}

export function GroupFormDialog({
  title,
  description,
  submitLabel,
  pendingLabel,
  initialValues,
  isPending,
  errorMessage,
  onSubmit,
  onClose,
}: GroupFormDialogProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [groupDescription, setGroupDescription] = useState(initialValues?.description ?? '')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({})

  const trimmedName = name.trim()
  const trimmedDescription = groupDescription.trim()
  const hasChanges =
    !initialValues ||
    trimmedName !== initialValues.name ||
    trimmedDescription !== initialValues.description
  const canSubmit = trimmedName !== '' && hasChanges

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending || !canSubmit) return

    const nextErrors: { name?: string; description?: string } = {
      name: validateTitle(name, 'group', 'name') ?? undefined,
      description: validateDescription(groupDescription) ?? undefined,
    }
    setFieldErrors(nextErrors)
    if (nextErrors.name || nextErrors.description) return

    onSubmit({ name: trimmedName, description: trimmedDescription })
  }

  return (
    <Dialog title={title} description={description} onClose={onClose}>
      <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
        {errorMessage && <FormAlert message={errorMessage} />}

        <TextField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
          maxLength={TITLE_MAX_LENGTH}
          disabled={isPending}
          autoComplete="off"
          placeholder="Biology"
        />

        <div>
          <label className={fieldLabel} htmlFor="group-description">
            Description <span className="font-normal text-text-muted">(optional)</span>
          </label>
          <textarea
            id="group-description"
            rows={3}
            value={groupDescription}
            onChange={(event) => setGroupDescription(event.target.value)}
            maxLength={DESCRIPTION_MAX_LENGTH}
            disabled={isPending}
            aria-invalid={fieldErrors.description ? true : undefined}
            aria-describedby={
              fieldErrors.description ? 'group-description-error' : 'group-description-hint'
            }
            className={`${fieldInput} resize-y ${fieldErrors.description ? fieldInputInvalid : ''}`}
            placeholder="What this group is for"
          />
          {fieldErrors.description ? (
            <p className={fieldError} id="group-description-error">
              {fieldErrors.description}
            </p>
          ) : (
            <p className={fieldHint} id="group-description-hint">
              Leave this empty to clear it.
            </p>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className={`${btnPrimaryLg} ${btnPrimaryDisabled}`}
            disabled={isPending || !canSubmit}
          >
            {isPending && <IconSpinner className="h-4.5 w-4.5 animate-spin" />}
            {isPending ? pendingLabel : submitLabel}
          </button>
          <button type="button" className={btnGhostLg} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          {!canSubmit && !isPending && (
            <span className="text-xs text-text-muted">
              {trimmedName === ''
                ? 'Give this group a name.'
                : 'Change the name or description to save.'}
            </span>
          )}
        </div>
      </form>
    </Dialog>
  )
}
