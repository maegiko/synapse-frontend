import { useState } from 'react'
import type { FormEvent } from 'react'
import { Dialog } from './Dialog'
import { FormAlert } from './FormAlert'
import { TextField } from './TextField'
import { IconSpinner } from './icons'
import { btnGhostLg, btnPrimaryDisabled, btnPrimaryLg, fieldHint, fieldInput, fieldLabel } from './ui'
import type { UpdateQuizRequest } from '../api'

interface QuizEditDialogProps {
  /** The quiz's current title and description ('' when it has none). */
  initialValues: { title: string; description: string }
  isPending: boolean
  errorMessage?: string
  onSubmit: (body: UpdateQuizRequest) => void
  onClose: () => void
}

/**
 * Edits a quiz's title and description. Difficulty has its own control and is
 * left alone here. A blank description is a deliberate instruction to clear it;
 * only the fields the user changed are sent.
 */
export function QuizEditDialog({
  initialValues,
  isPending,
  errorMessage,
  onSubmit,
  onClose,
}: QuizEditDialogProps) {
  const [title, setTitle] = useState(initialValues.title)
  const [description, setDescription] = useState(initialValues.description)
  const [titleError, setTitleError] = useState<string>()

  const trimmedTitle = title.trim()
  const trimmedDescription = description.trim()
  const titleChanged = trimmedTitle !== initialValues.title
  const descriptionChanged = trimmedDescription !== initialValues.description
  const hasChanges = titleChanged || descriptionChanged
  // Matches the profile form: the submit only lights up once there is a valid
  // change to send. A blank description is allowed (it clears the field).
  const canSubmit = hasChanges && trimmedTitle !== ''

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending || !canSubmit) return

    if (!trimmedTitle) {
      setTitleError('Give this quiz a title.')
      return
    }

    onSubmit({
      ...(titleChanged ? { title: trimmedTitle } : {}),
      // A blank description clears it; the backend maps '' back to null.
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
          error={titleError}
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
            disabled={isPending}
            aria-describedby="quiz-description-hint"
            className={`${fieldInput} resize-y`}
            placeholder="What this quiz covers"
          />
          <p className={fieldHint} id="quiz-description-hint">
            Leave this empty to clear it.
          </p>
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
