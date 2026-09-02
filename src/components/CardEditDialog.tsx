import { useId, useState } from 'react'
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
import type { UpdateFlashcardRequest } from '../api'
import { FLASHCARD_SIDE_MAX_LENGTH, validateFlashcardSide } from '../lib/validation'

interface CardEditDialogProps {
  initialValues: { question: string; answer: string }
  isPending: boolean
  errorMessage?: string
  onSubmit: (body: UpdateFlashcardRequest) => void
  onClose: () => void
}

export function CardEditDialog({
  initialValues,
  isPending,
  errorMessage,
  onSubmit,
  onClose,
}: CardEditDialogProps) {
  const answerId = useId()
  const [question, setQuestion] = useState(initialValues.question)
  const [answer, setAnswer] = useState(initialValues.answer)
  const [fieldErrors, setFieldErrors] = useState<{ question?: string; answer?: string }>({})

  const trimmedQuestion = question.trim()
  const trimmedAnswer = answer.trim()
  const questionChanged = trimmedQuestion !== initialValues.question
  const answerChanged = trimmedAnswer !== initialValues.answer
  const hasChanges = questionChanged || answerChanged
  const canSubmit = hasChanges && trimmedQuestion !== '' && trimmedAnswer !== ''

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending || !canSubmit) return

    const nextErrors: { question?: string; answer?: string } = {
      question: validateFlashcardSide(question, 'question') ?? undefined,
      answer: validateFlashcardSide(answer, 'answer') ?? undefined,
    }
    setFieldErrors(nextErrors)
    if (nextErrors.question || nextErrors.answer) return

    onSubmit({
      ...(questionChanged ? { question: trimmedQuestion } : {}),
      ...(answerChanged ? { answer: trimmedAnswer } : {}),
    } as UpdateFlashcardRequest)
  }

  return (
    <Dialog title="Edit card" onClose={onClose}>
      <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
        {errorMessage && <FormAlert message={errorMessage} />}

        <TextField
          label="Question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          error={fieldErrors.question}
          maxLength={FLASHCARD_SIDE_MAX_LENGTH}
          disabled={isPending}
          autoComplete="off"
        />

        <div>
          <label className={fieldLabel} htmlFor={answerId}>
            Answer
          </label>
          <textarea
            id={answerId}
            rows={3}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            maxLength={FLASHCARD_SIDE_MAX_LENGTH}
            disabled={isPending}
            aria-invalid={fieldErrors.answer ? true : undefined}
            aria-describedby={fieldErrors.answer ? `${answerId}-error` : undefined}
            className={`${fieldInput} resize-y ${fieldErrors.answer ? fieldInputInvalid : ''}`}
          />
          {fieldErrors.answer && (
            <p className={fieldError} id={`${answerId}-error`}>
              {fieldErrors.answer}
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
                ? 'Fill in the question and answer to save.'
                : 'Change the question or answer to save.'}
            </span>
          )}
        </div>
      </form>
    </Dialog>
  )
}
