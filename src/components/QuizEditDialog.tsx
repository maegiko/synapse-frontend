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
import type { UpdateQuizRequest } from '../api'
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  validateDescription,
  validateTitle,
} from '../lib/validation'

interface QuizEditDialogProps {
  initialValues: { title: string; description: string }
  isPending: boolean
  errorMessage?: string
  onSubmit: (body: UpdateQuizRequest) => void
  onClose: () => void
}

/** A blank description clears it. Difficulty has its own control. */
export function QuizEditDialog({
  initialValues,
  isPending,
  errorMessage,
  onSubmit,
  onClose,
}: QuizEditDialogProps) {
  const [title, setTitle] = useState(initialValues.title)
  const [description, setDescription] = useState(initialValues.description)
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; description?: string }>({})

  const trimmedTitle = title.trim()
  const trimmedDescription = description.trim()
  const titleChanged = trimmedTitle !== initialValues.title
  const descriptionChanged = trimmedDescription !== initialValues.description
  const hasChanges = titleChanged || descriptionChanged
  const canSubmit = hasChanges && trimmedTitle !== ''

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending || !canSubmit) return

    const nextErrors = {
      title: validateTitle(title, 'quiz') ?? undefined,
      description: validateDescription(description) ?? undefined,
    }
    setFieldErrors(nextErrors)
    if (nextErrors.title || nextErrors.description) return

    onSubmit({
      ...(titleChanged ? { title: trimmedTitle } : {}),
      ...(descriptionChanged
        ? { description: trimmedDescription === '' ? null : trimmedDescription }
        : {}),
    } as UpdateQuizRequest)
  }

  return (
    <Dialog
      title="Edit quiz"
      description="Change the title, the description, or both."
      onClose={onClose}
    >
      <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
        {errorMessage && <FormAlert message={errorMessage} />}

        <TextField
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={fieldErrors.title}
          maxLength={TITLE_MAX_LENGTH}
          disabled={isPending}
          autoComplete="off"
        />

        <div>
          <label className={fieldLabel} htmlFor="quiz-description">
            Description <span className="font-normal text-text-muted">(optional)</span>
          </label>
          <textarea
            id="quiz-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={DESCRIPTION_MAX_LENGTH}
            disabled={isPending}
            aria-invalid={fieldErrors.description ? true : undefined}
            aria-describedby={
              fieldErrors.description ? 'quiz-description-error' : 'quiz-description-hint'
            }
            className={`${fieldInput} resize-y ${fieldErrors.description ? fieldInputInvalid : ''}`}
            placeholder="What this quiz covers"
          />
          {fieldErrors.description ? (
            <p className={fieldError} id="quiz-description-error">
              {fieldErrors.description}
            </p>
          ) : (
            <p className={fieldHint} id="quiz-description-hint">
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
            {isPending && <IconSpinner className="h-4.5 w-4.5" />}
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" className={btnGhostLg} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          {!canSubmit && !isPending && (
            <span className="text-xs text-text-muted">
              {trimmedTitle === ''
                ? 'Enter a title to save.'
                : 'Change the title or description to save.'}
            </span>
          )}
        </div>
      </form>
    </Dialog>
  )
}
