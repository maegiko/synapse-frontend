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
  fieldInput,
  fieldInputInvalid,
  fieldLabel,
} from './ui'
import type { UpdateNoteRequest } from '../api'

interface NoteEditDialogProps {
  /** The note's current title and overview, shown prefilled. */
  initialValues: { title: string; overview: string }
  isPending: boolean
  /** Backend failure for the last attempt, shown above the fields. */
  errorMessage?: string
  onSubmit: (body: UpdateNoteRequest) => void
  onClose: () => void
}

/**
 * Edits a note's title and overview. Both are prefilled with the current values,
 * only the fields the user actually changed are sent, and the submit stays
 * disabled until there is a valid change to save.
 */
export function NoteEditDialog({
  initialValues,
  isPending,
  errorMessage,
  onSubmit,
  onClose,
}: NoteEditDialogProps) {
  const [title, setTitle] = useState(initialValues.title)
  const [overview, setOverview] = useState(initialValues.overview)
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; overview?: string }>({})

  const trimmedTitle = title.trim()
  const trimmedOverview = overview.trim()
  const titleChanged = trimmedTitle !== initialValues.title
  const overviewChanged = trimmedOverview !== initialValues.overview
  const hasChanges = titleChanged || overviewChanged
  // Matches the profile form: the submit only lights up once there is a valid,
  // non-empty change to send.
  const canSubmit = hasChanges && trimmedTitle !== '' && trimmedOverview !== ''

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // A second submit while the first is in flight would send a duplicate PATCH.
    if (isPending || !canSubmit) return

    const nextErrors: { title?: string; overview?: string } = {}
    if (!trimmedTitle) nextErrors.title = 'Give this note a title.'
    if (!trimmedOverview) nextErrors.overview = 'Write an overview for this note.'
    setFieldErrors(nextErrors)
    if (nextErrors.title || nextErrors.overview) return

    // Only changed fields are sent; the backend leaves the rest alone.
    onSubmit({
      ...(titleChanged ? { title: trimmedTitle } : {}),
      ...(overviewChanged ? { overview: trimmedOverview } : {}),
    } as UpdateNoteRequest)
  }

  return (
    <Dialog
      title="Edit note"
      description="Change the title, the overview, or both. The key points, concepts, and terms cannot be edited here."
      onClose={onClose}
    >
      <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
        {errorMessage && <FormAlert message={errorMessage} />}

        <TextField
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={fieldErrors.title}
          disabled={isPending}
          autoComplete="off"
        />

        <div>
          <label className={fieldLabel} htmlFor="note-overview">
            Overview
          </label>
          <textarea
            id="note-overview"
            rows={5}
            value={overview}
            onChange={(event) => setOverview(event.target.value)}
            disabled={isPending}
            aria-invalid={fieldErrors.overview ? true : undefined}
            aria-describedby={fieldErrors.overview ? 'note-overview-error' : undefined}
            className={`${fieldInput} resize-y ${fieldErrors.overview ? fieldInputInvalid : ''}`}
          />
          {fieldErrors.overview && (
            <p className={fieldError} id="note-overview-error">
              {fieldErrors.overview}
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
              {hasChanges
                ? 'Fill in the title and overview to save.'
                : 'Change the title or overview to save.'}
            </span>
          )}
        </div>
      </form>
    </Dialog>
  )
}
