import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Dialog } from './Dialog'
import { FormAlert } from './FormAlert'
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
import type { QuestionType, QuizQuestion, UpdateQuestionRequest } from '../api'
import {
  ANSWER_MAX_LENGTH,
  QUESTION_MAX_LENGTH,
  validateAnswerText,
  validateQuestionText,
} from '../lib/validation'

/** The backend requires four answers for multiple choice and two for boolean. */
const CHOICE_COUNT = 4
const BOOLEAN_ANSWERS = ['True', 'False']

const TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Multiple choice',
  BOOLEAN: 'True or False',
}

function initialChoices(question: QuizQuestion): string[] {
  const slots = Array<string>(CHOICE_COUNT).fill('')
  if (question.questionType === 'MULTIPLE_CHOICE') {
    question.answers.forEach((answer, index) => {
      if (index < CHOICE_COUNT) slots[index] = answer.text
    })
  }
  return slots
}

function initialCorrectIndex(question: QuizQuestion): number {
  const found = question.answers.findIndex((answer) => answer.correct)
  return found >= 0 ? found : 0
}

interface QuestionEditDialogProps {
  question: QuizQuestion
  isPending: boolean
  errorMessage?: string
  onSubmit: (body: UpdateQuestionRequest) => void
  onClose: () => void
}

/**
 * The answer form follows the type, and the whole answer set is always sent as
 * one replacement, so the quiz never sees a half-updated question.
 */
export function QuestionEditDialog({
  question,
  isPending,
  errorMessage,
  onSubmit,
  onClose,
}: QuestionEditDialogProps) {
  const questionId = useId()

  const originalType = question.questionType
  const originalText = question.text
  const originalChoices = initialChoices(question)
  const originalCorrectIndex = initialCorrectIndex(question)

  const [questionText, setQuestionText] = useState(originalText)
  const [questionType, setQuestionType] = useState<QuestionType>(originalType)
  const [choices, setChoices] = useState<string[]>(originalChoices)
  const [correctIndex, setCorrectIndex] = useState(originalCorrectIndex)
  const [fieldErrors, setFieldErrors] = useState<{ question?: string; answers?: string }>({})

  const trimmedQuestion = questionText.trim()
  const typeChanged = questionType !== originalType
  const questionChanged = trimmedQuestion !== originalText
  const answersChanged =
    typeChanged ||
    correctIndex !== originalCorrectIndex ||
    (questionType === 'MULTIPLE_CHOICE' &&
      choices.some((choice, index) => choice.trim() !== originalChoices[index]))
  const hasChanges = questionChanged || typeChanged || answersChanged
  const answersFilled =
    questionType === 'BOOLEAN' || choices.every((choice) => choice.trim() !== '')
  const canSubmit = hasChanges && trimmedQuestion !== '' && answersFilled

  function changeType(next: QuestionType) {
    setQuestionType(next)
    setCorrectIndex(0)
    setFieldErrors({})
  }

  function buildAnswers() {
    return questionType === 'BOOLEAN'
      ? BOOLEAN_ANSWERS.map((answer, index) => ({ answer, isCorrect: index === correctIndex }))
      : choices.map((answer, index) => ({
          answer: answer.trim(),
          isCorrect: index === correctIndex,
        }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending || !canSubmit) return

    const nextErrors: { question?: string; answers?: string } = {
      question: validateQuestionText(questionText) ?? undefined,
      answers:
        questionType === 'MULTIPLE_CHOICE'
          ? (choices.map(validateAnswerText).find(Boolean) ?? undefined)
          : undefined,
    }
    setFieldErrors(nextErrors)
    if (nextErrors.question || nextErrors.answers) return

    const sendAnswers = typeChanged || answersChanged
    onSubmit({
      ...(questionChanged ? { question: trimmedQuestion } : {}),
      ...(typeChanged ? { questionType } : {}),
      ...(sendAnswers ? { answers: buildAnswers() } : {}),
    })
  }

  return (
    <Dialog
      title="Edit question"
      description="Change the wording, the answer type, or the answers. Answers are replaced as a set."
      onClose={onClose}
    >
      <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
        {errorMessage && <FormAlert message={errorMessage} />}

        <div>
          <label className={fieldLabel} htmlFor={questionId}>
            Question
          </label>
          <textarea
            id={questionId}
            value={questionText}
            onChange={(event) => setQuestionText(event.target.value)}
            rows={2}
            maxLength={QUESTION_MAX_LENGTH}
            disabled={isPending}
            aria-invalid={fieldErrors.question ? true : undefined}
            aria-describedby={fieldErrors.question ? `${questionId}-error` : undefined}
            className={`${fieldInput} resize-y ${fieldErrors.question ? fieldInputInvalid : ''}`}
          />
          {fieldErrors.question && (
            <p className={fieldError} id={`${questionId}-error`}>
              {fieldErrors.question}
            </p>
          )}
        </div>

        <fieldset className="m-0 border-0 p-0">
          <legend className={fieldLabel}>Answer type</legend>
          <div className="flex flex-wrap gap-2.5">
            {(Object.keys(TYPE_LABELS) as QuestionType[]).map((type) => (
              <label
                key={type}
                className={`relative cursor-pointer rounded-sm border px-4 py-2 text-sm font-bold transition-colors duration-150 ${
                  questionType === type
                    ? 'border-accent-solid bg-accent-soft text-accent-strong'
                    : 'border-border bg-surface text-text-muted hover:border-accent-solid'
                }`}
              >
                <input
                  type="radio"
                  name="editQuestionType"
                  className="sr-only"
                  checked={questionType === type}
                  onChange={() => changeType(type)}
                  disabled={isPending}
                />
                {TYPE_LABELS[type]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="m-0 border-0 p-0">
          <legend className={fieldLabel}>
            Answers{' '}
            <span className="font-normal text-text-muted">(choose the one that is correct)</span>
          </legend>
          <div className="grid gap-2.5">
            {questionType === 'BOOLEAN'
              ? BOOLEAN_ANSWERS.map((answer, index) => (
                  <label
                    key={answer}
                    className="flex cursor-pointer items-center gap-3 rounded-sm border border-border bg-surface px-3.5 py-2.75 text-base text-text"
                  >
                    <input
                      type="radio"
                      name="editCorrectAnswer"
                      className="h-4 w-4 shrink-0 accent-accent-solid"
                      checked={correctIndex === index}
                      onChange={() => setCorrectIndex(index)}
                      disabled={isPending}
                    />
                    {answer}
                  </label>
                ))
              : choices.map((choice, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="editCorrectAnswer"
                      className="h-4 w-4 shrink-0 accent-accent-solid"
                      checked={correctIndex === index}
                      onChange={() => setCorrectIndex(index)}
                      disabled={isPending}
                      aria-label={`Answer ${index + 1} is the correct one`}
                    />
                    <input
                      value={choice}
                      onChange={(event) => {
                        const next = event.target.value
                        setChoices((current) =>
                          current.map((item, position) => (position === index ? next : item)),
                        )
                      }}
                      placeholder={`Answer ${index + 1}`}
                      maxLength={ANSWER_MAX_LENGTH}
                      disabled={isPending}
                      aria-label={`Answer ${index + 1}`}
                      className={`${fieldInput} ${
                        fieldErrors.answers &&
                        (!choice.trim() || choice.trim().length > ANSWER_MAX_LENGTH)
                          ? fieldInputInvalid
                          : ''
                      }`}
                    />
                  </div>
                ))}
          </div>
          {fieldErrors.answers && <p className={fieldError}>{fieldErrors.answers}</p>}
        </fieldset>

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
                ? 'Fill in the question and every answer to save.'
                : 'Make a change to save.'}
            </span>
          )}
        </div>
      </form>
    </Dialog>
  )
}
