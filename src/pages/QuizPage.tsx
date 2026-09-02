import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { AppHeader } from '../components/AppHeader'
import { AppLink } from '../components/AppLink'
import { BackLink } from '../components/BackLink'
import { DetailMetadata } from '../components/DetailMetadata'
import { ScoreRow } from '../components/ScoreRow'
import { PlaybackModeControl } from '../components/PlaybackModeControl'
import { DifficultyStars } from '../components/DifficultyStars'
import { StarRating } from '../components/StarRating'
import { FormAlert } from '../components/FormAlert'
import { GroupMembershipControl } from '../components/GroupMembershipControl'
import { PinToggle } from '../components/PinToggle'
import { QuestionEditDialog } from '../components/QuestionEditDialog'
import { QuizEditDialog } from '../components/QuizEditDialog'
import {
  IconArrowRight,
  IconChart,
  IconCheck,
  IconClock,
  IconPencil,
  IconPlay,
  IconPlus,
  IconQuiz,
  IconSpinner,
  IconTrash,
  IconX,
} from '../components/icons'
import {
  btnDangerGhostSm,
  btnDangerSm,
  btnGhostSm,
  btnPrimaryDisabled,
  btnPrimarySm,
  cardLink,
  countPill,
  fieldError,
  fieldInput,
  fieldInputInvalid,
  fieldLabel,
  shell,
  successAlert,
  surfaceCard,
} from '../components/ui'
import { isStatus, toReasonMessage } from '../lib/apiErrors'
import {
  ANSWER_MAX_LENGTH,
  QUESTION_MAX_LENGTH,
  validateAnswerText,
  validateQuestionText,
} from '../lib/validation'
import { DASHBOARD_BACK } from '../lib/backTrail'
import { formatRelative } from '../lib/formatDate'
import { usePinQuiz } from '../lib/pinMutations'
import { plural } from '../lib/plural'
import { queryKeys, useQuiz, useQuizScores, useUserTimeZone } from '../lib/queries'
import { queryClient } from '../lib/queryClient'
import { SHUFFLE_PARAM } from '../lib/shuffle'
import { api } from '../api'
import type {
  QuestionType,
  Quiz,
  QuizQuestion,
  UpdateQuestionRequest,
  UpdateQuizRequest,
} from '../api'

const placeholderPanel =
  'rounded-md border border-dashed border-border bg-surface-alt px-6 py-7 text-center text-sm text-text-muted'

const RECENT_SCORE_LIMIT = 3

const PLAY_EMPTY_REASON = 'Add a question before you can play this quiz.'

/** The backend requires four answers for multiple choice and two for boolean. */
const CHOICE_COUNT = 4
const BOOLEAN_ANSWERS = ['True', 'False']

const TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Multiple choice',
  BOOLEAN: 'True or False',
}

function QuizSkeleton() {
  return (
    <div className="grid gap-6" aria-hidden="true">
      <div className="grid gap-3">
        <span className="block h-8 w-2/3 animate-pulse rounded-sm bg-surface-alt" />
        <span className="block h-4 w-40 animate-pulse rounded-full bg-surface-alt" />
      </div>
      <div className={`${surfaceCard} grid gap-3 p-6`}>
        {[0, 1, 2].map((row) => (
          <span key={row} className="block h-3.5 w-full animate-pulse rounded-full bg-surface-alt" />
        ))}
      </div>
    </div>
  )
}

interface QuestionRowProps {
  question: QuizQuestion
  position: number
  isConfirming: boolean
  isDeleting: boolean
  disabled: boolean
  onAskEdit: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}

function QuestionRow({
  question,
  position,
  isConfirming,
  isDeleting,
  disabled,
  onAskEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: QuestionRowProps) {
  const answers = question.answers ?? []
  // Generated questions are not validated for exactly one correct answer.
  const correctCount = answers.filter((answer) => answer.correct).length

  return (
    <li
      className={`border-b border-dashed border-border px-6 py-5 last:border-b-0 ${
        isDeleting ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="mt-0.5 w-6 shrink-0 text-right text-xs font-bold text-text-muted tabular-nums">
          {position}
        </span>
        <div className="min-w-0 flex-1">
          <p className="max-w-[72ch] text-sm font-bold text-text">{question.text}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={countPill}>{TYPE_LABELS[question.questionType]}</span>
            <span className={countPill}>{plural(answers.length, 'answer')}</span>
            {correctCount !== 1 && (
              <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning-solid">
                {correctCount === 0 ? 'No correct answer marked' : `${correctCount} marked correct`}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <button
            type="button"
            className="rounded-sm border border-transparent p-2 text-text-muted transition-colors duration-150 hover:border-accent-solid hover:bg-accent-soft hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onAskEdit}
            disabled={disabled || isConfirming}
          >
            <IconPencil />
            <span className="sr-only">Edit question {position}</span>
          </button>
          <button
            type="button"
            className="relative rounded-sm border border-transparent p-2 text-text-muted transition-colors duration-150 hover:border-error-solid hover:bg-error-soft hover:text-error-solid disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onAskDelete}
            disabled={disabled || isConfirming}
          >
            <IconTrash />
            <span className="sr-only">Delete question {position}</span>
          </button>
        </div>
      </div>

      {isConfirming && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-sm border border-error-solid bg-error-soft px-4 py-3">
          <p className="mr-auto text-sm font-semibold text-error-solid">
            Delete this question and its answers?
          </p>
          <button
            type="button"
            className={btnDangerSm}
            onClick={onConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting && <IconSpinner className="h-4 w-4" />}
            {isDeleting ? 'Deleting…' : 'Delete question'}
          </button>
          <button type="button" className={btnGhostSm} onClick={onCancelDelete} disabled={isDeleting}>
            Keep it
          </button>
        </div>
      )}
    </li>
  )
}

function ScoreHistory({ quizId }: { quizId: string }) {
  const scores = useQuizScores(quizId)
  const timeZone = useUserTimeZone()

  return (
    <section className={surfaceCard}>
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <h2 className="mr-auto text-base font-medium">Past attempts</h2>
        {scores.isSuccess && <span className={countPill}>{scores.data.length}</span>}
        {scores.isSuccess && scores.data.length > RECENT_SCORE_LIMIT && (
          <AppLink to={`/quiz/${quizId}/scores`} className={cardLink}>
            View all
            <IconArrowRight />
          </AppLink>
        )}
      </div>
      <div className="px-6 py-5">
        {scores.isPending && (
          <div className="grid gap-3" aria-hidden="true">
            {[0, 1].map((row) => (
              <span
                key={row}
                className="block h-3.5 w-full animate-pulse rounded-full bg-surface-alt"
              />
            ))}
          </div>
        )}

        {scores.isError && (
          <div className="grid justify-items-start gap-2.5">
            <p className="text-sm text-text-muted">
              We could not load your attempts. {toReasonMessage(scores.error)}
            </p>
            <button type="button" className={btnGhostSm} onClick={() => void scores.refetch()}>
              Try again
            </button>
          </div>
        )}

        {scores.isSuccess &&
          (scores.data.length === 0 ? (
            <p className={placeholderPanel}>Scores you save will show up here.</p>
          ) : (
            <ol className="m-0 grid list-none gap-3.5 p-0">
              {scores.data.slice(0, RECENT_SCORE_LIMIT).map((score) => (
                <ScoreRow
                  key={score.publicId}
                  score={score}
                  when={formatRelative(score.createdAt, timeZone)}
                />
              ))}
            </ol>
          ))}
      </div>
    </section>
  )
}

function QuizContent({ quiz }: { quiz: Quiz }) {
  const navigate = useNavigate()
  const questionId = useId()
  const timeZone = useUserTimeZone()
  const questionRef = useRef<HTMLTextAreaElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const [isAdding, setIsAdding] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState<QuestionType>('MULTIPLE_CHOICE')
  const [choices, setChoices] = useState<string[]>(() => Array<string>(CHOICE_COUNT).fill(''))
  const [correctIndex, setCorrectIndex] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<{ question?: string; answers?: string }>({})
  const [justAdded, setJustAdded] = useState(false)
  const [justPinned, setJustPinned] = useState(false)
  const [actionError, setActionError] = useState('')
  const [confirmingQuestionId, setConfirmingQuestionId] = useState<string | null>(null)
  const [isConfirmingQuiz, setIsConfirmingQuiz] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isEditingQuiz, setIsEditingQuiz] = useState(false)
  const [quizEditError, setQuizEditError] = useState('')
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [questionEditError, setQuestionEditError] = useState('')

  const questions = quiz.questions ?? []
  const editingQuestion = editingQuestionId
    ? questions.find((question) => question.id === editingQuestionId)
    : undefined

  async function refreshQuiz() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.quiz(quiz.id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.quizzes, exact: true })
  }

  const addQuestion = useMutation({
    mutationFn: () => {
      const answers =
        questionType === 'BOOLEAN'
          ? BOOLEAN_ANSWERS.map((answer, index) => ({ answer, isCorrect: index === correctIndex }))
          : choices.map((answer, index) => ({
              answer: answer.trim(),
              isCorrect: index === correctIndex,
            }))
      return api.quiz.addQuestion(quiz.id, {
        question: questionText.trim(),
        questionType,
        answers,
      })
    },
    onSuccess: async () => {
      setQuestionText('')
      setChoices(Array<string>(CHOICE_COUNT).fill(''))
      setCorrectIndex(0)
      setJustAdded(true)
      setIsAdding(false)
      await refreshQuiz()
    },
    onError: (error) => setActionError(messageForQuestionFailure(error, 'add')),
  })

  const updateQuiz = useMutation({
    mutationFn: (body: UpdateQuizRequest) => api.quiz.update(quiz.id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.quiz(quiz.id), updated)
      void queryClient.invalidateQueries({ queryKey: queryKeys.quizzes, exact: true })
      if (updated.groupId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.group(updated.groupId) })
      }
      setIsEditingQuiz(false)
    },
    onError: (error) => {
      setQuizEditError(
        isStatus(error, 404)
          ? 'This quiz no longer exists. It may have just been deleted.'
          : `We could not save your changes. ${toReasonMessage(error)}`,
      )
    },
  })

  const updateQuestion = useMutation({
    mutationFn: (vars: { questionId: string; body: UpdateQuestionRequest }) =>
      api.quiz.updateQuestion(quiz.id, vars.questionId, vars.body),
    onSuccess: async () => {
      await refreshQuiz()
      setEditingQuestionId(null)
    },
    onError: (error) => setQuestionEditError(messageForQuestionFailure(error, 'edit')),
  })

  const deleteQuestion = useMutation({
    mutationFn: (id: string) => api.quiz.removeQuestion(quiz.id, id),
    onSuccess: async () => {
      setConfirmingQuestionId(null)
      await refreshQuiz()
    },
    onError: (error) => {
      setConfirmingQuestionId(null)
      setActionError(messageForQuestionFailure(error, 'delete'))
    },
  })

  const setDifficulty = useMutation({
    mutationFn: (level: number) => api.quiz.setDifficulty(quiz.id, level),
    onSuccess: () => refreshQuiz(),
    onError: (error) =>
      setActionError(`We could not set the difficulty. ${toReasonMessage(error)}`),
  })

  const pinQuiz = usePinQuiz(quiz.id)

  const deleteQuiz = useMutation({
    mutationFn: () => api.quiz.remove(quiz.id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.quiz(quiz.id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.quizzes, exact: true })
      navigate('/library?type=quizzes', { replace: true })
    },
    onError: (error) => {
      setIsConfirmingQuiz(false)
      setActionError(
        isStatus(error, 404)
          ? 'That quiz has already been deleted.'
          : `We could not delete this quiz. ${toReasonMessage(error)}`,
      )
    },
  })

  const isBusy =
    addQuestion.isPending ||
    deleteQuestion.isPending ||
    setDifficulty.isPending ||
    deleteQuiz.isPending ||
    updateQuiz.isPending ||
    updateQuestion.isPending ||
    pinQuiz.isPending

  const canAddQuestion =
    questionText.trim() !== '' &&
    (questionType === 'BOOLEAN' || choices.every((choice) => choice.trim() !== ''))

  useEffect(() => {
    if (isAdding) questionRef.current?.focus()
  }, [isAdding])

  useEffect(() => {
    if (justAdded && !addQuestion.isPending) addButtonRef.current?.focus()
  }, [justAdded, addQuestion.isPending])

  function clearActionFeedback() {
    setActionError('')
    setJustAdded(false)
    setJustPinned(false)
  }

  function handleAddQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearActionFeedback()

    const nextErrors: { question?: string; answers?: string } = {
      question: validateQuestionText(questionText) ?? undefined,
      answers:
        questionType === 'MULTIPLE_CHOICE'
          ? (choices.map(validateAnswerText).find(Boolean) ?? undefined)
          : undefined,
    }
    setFieldErrors(nextErrors)
    if (nextErrors.question || nextErrors.answers) return

    addQuestion.mutate()
  }

  function toggleAddForm() {
    clearActionFeedback()
    setFieldErrors({})
    setIsAdding((open) => !open)
  }

  function changeType(next: QuestionType) {
    setQuestionType(next)
    setCorrectIndex(0)
    setFieldErrors({})
  }

  return (
    <>
      <h1 className="text-3xl">{quiz.title}</h1>
      {quiz.description && (
        <p className="mt-3 max-w-[72ch] text-base text-text-muted">{quiz.description}</p>
      )}
      <DetailMetadata
        className={quiz.description ? 'mt-5' : 'mt-3'}
        items={[
          {
            key: 'questions',
            icon: <IconQuiz />,
            content: plural(questions.length, 'question'),
          },
          {
            key: 'difficulty',
            icon: <IconChart />,
            content:
              quiz.difficulty === null ? (
                'No difficulty set'
              ) : (
                <DifficultyStars value={quiz.difficulty} />
              ),
          },
          {
            key: 'created',
            icon: <IconClock />,
            content: formatRelative(quiz.createdAt, timeZone),
          },
        ]}
      />

      <div className="mt-3">
        <GroupMembershipControl
          kind="quizzes"
          resourceId={quiz.id}
          resourceTitle={quiz.title}
          groupId={quiz.groupId}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <PlaybackModeControl
            value={isShuffled ? 'shuffle' : 'saved'}
            onChange={(mode) => setIsShuffled(mode === 'shuffle')}
          />
          {questions.length > 0 ? (
            <AppLink
              to={`/quiz/${quiz.id}/play${isShuffled ? `?${SHUFFLE_PARAM}=1` : ''}`}
              className={btnPrimarySm}
            >
              <IconPlay />
              Play quiz
            </AppLink>
          ) : (
            <button
              type="button"
              className={`${btnPrimarySm} ${btnPrimaryDisabled}`}
              disabled
              title={PLAY_EMPTY_REASON}
            >
              <IconPlay />
              Play quiz
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <button
            ref={addButtonRef}
            type="button"
            className={btnGhostSm}
            onClick={toggleAddForm}
            aria-expanded={isAdding}
          >
            {isAdding ? <IconX /> : <IconPlus />}
            {isAdding ? 'Close question form' : 'Add a question'}
          </button>
          <PinToggle
            pinned={quiz.pinned}
            noun="quiz"
            isPending={pinQuiz.isPending}
            disabled={isBusy || isConfirmingQuiz}
            onToggle={(next) => {
              clearActionFeedback()
              pinQuiz.mutate(next, {
                onSuccess: () => setJustPinned(next),
                onError: (error) =>
                  setActionError(
                    isStatus(error, 404)
                      ? 'This quiz no longer exists. It may have just been deleted.'
                      : `We could not ${next ? 'pin' : 'unpin'} this quiz. ${toReasonMessage(error)}`,
                  ),
              })
            }}
          />
          <button
            type="button"
            className={btnGhostSm}
            onClick={() => {
              setQuizEditError('')
              setIsEditingQuiz(true)
            }}
            disabled={isBusy || isConfirmingQuiz}
          >
            <IconPencil />
            Edit quiz
          </button>
          <button
            type="button"
            className={btnDangerGhostSm}
            onClick={() => {
              clearActionFeedback()
              setIsConfirmingQuiz(true)
            }}
            disabled={isBusy || isConfirmingQuiz}
          >
            <IconTrash />
            Delete quiz
          </button>
        </div>
      </div>
      {questions.length === 0 && (
        <p className="mt-2.5 text-xs text-text-muted">{PLAY_EMPTY_REASON}</p>
      )}

      <div className="mt-6 grid gap-6">
        {actionError && <FormAlert message={actionError} />}

        {justAdded && !addQuestion.isPending && (
          <p className={successAlert} role="status">
            <IconCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>Question added. It is at the end of the quiz.</span>
          </p>
        )}

        {justPinned && (
          <p className={successAlert} role="status">
            <IconCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>Pinned. It now shows first in your library.</span>
          </p>
        )}

        {isConfirmingQuiz && (
          <section className="rounded-md border border-error-solid bg-error-soft p-6">
            <h2 className="text-base font-medium text-error-solid">Delete this quiz?</h2>
            <p className="mt-2 max-w-[60ch] text-sm text-text">
              “{quiz.title}”, all {plural(questions.length, 'question')}, and every saved score for
              it will be removed. This cannot be undone, though the note it came from is untouched.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className={btnDangerSm}
                onClick={() => deleteQuiz.mutate()}
                disabled={deleteQuiz.isPending}
              >
                {deleteQuiz.isPending && <IconSpinner className="h-4 w-4" />}
                {deleteQuiz.isPending ? 'Deleting…' : 'Delete quiz'}
              </button>
              <button
                type="button"
                className={btnGhostSm}
                onClick={() => setIsConfirmingQuiz(false)}
                disabled={deleteQuiz.isPending}
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        {isAdding && (
          <form className={`${surfaceCard} p-6`} onSubmit={handleAddQuestion} noValidate>
            <h2 className="text-base font-medium">Add a question</h2>
            <p className="mt-1.5 text-sm text-text-muted">
              New questions are appended to the end of the quiz.
            </p>

            <div className="mt-5 grid gap-5">
              <div>
                <label className={fieldLabel} htmlFor={questionId}>
                  Question
                </label>
                <textarea
                  id={questionId}
                  ref={questionRef}
                  value={questionText}
                  onChange={(event) => setQuestionText(event.target.value)}
                  placeholder="What does a lifeline represent?"
                  rows={2}
                  maxLength={QUESTION_MAX_LENGTH}
                  disabled={addQuestion.isPending}
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
                        name="questionType"
                        className="sr-only"
                        checked={questionType === type}
                        onChange={() => changeType(type)}
                        disabled={addQuestion.isPending}
                      />
                      {TYPE_LABELS[type]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="m-0 border-0 p-0">
                <legend className={fieldLabel}>
                  Answers{' '}
                  <span className="font-normal text-text-muted">
                    (choose the one that is correct)
                  </span>
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
                            name="correctAnswer"
                            className="h-4 w-4 shrink-0 accent-accent-solid"
                            checked={correctIndex === index}
                            onChange={() => setCorrectIndex(index)}
                            disabled={addQuestion.isPending}
                          />
                          {answer}
                        </label>
                      ))
                    : choices.map((choice, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="correctAnswer"
                            className="h-4 w-4 shrink-0 accent-accent-solid"
                            checked={correctIndex === index}
                            onChange={() => setCorrectIndex(index)}
                            disabled={addQuestion.isPending}
                            aria-label={`Answer ${index + 1} is the correct one`}
                          />
                          <input
                            value={choice}
                            onChange={(event) => {
                              const next = event.target.value
                              setChoices((current) =>
                                current.map((item, position) =>
                                  position === index ? next : item,
                                ),
                              )
                            }}
                            placeholder={`Answer ${index + 1}`}
                            maxLength={ANSWER_MAX_LENGTH}
                            disabled={addQuestion.isPending}
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
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className={`${btnPrimarySm} ${btnPrimaryDisabled}`}
                disabled={addQuestion.isPending || !canAddQuestion}
              >
                {addQuestion.isPending && <IconSpinner className="h-4 w-4" />}
                {addQuestion.isPending ? 'Adding…' : 'Add question'}
              </button>
              <button
                type="button"
                className={btnGhostSm}
                onClick={toggleAddForm}
                disabled={addQuestion.isPending}
              >
                Done
              </button>
              {!canAddQuestion && !addQuestion.isPending && (
                <span className="text-xs text-text-muted">
                  Fill in the question and every answer to add it.
                </span>
              )}
            </div>
          </form>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={surfaceCard}>
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
              <h2 className="mr-auto text-base font-medium">Difficulty</h2>
              {setDifficulty.isPending && (
                <IconSpinner className="h-4 w-4 text-accent-strong" />
              )}
            </div>
            <div className="px-6 py-5">
              <StarRating
                value={quiz.difficulty ?? 0}
                className="justify-start"
                disabled={isBusy || isConfirmingQuiz}
                onChange={(level) => {
                  if (level === quiz.difficulty) return
                  clearActionFeedback()
                  setDifficulty.mutate(level)
                }}
              />
              <p className="mt-3.5 text-xs text-text-muted">
                {quiz.difficulty === null
                  ? 'Generated quizzes start with no difficulty. Once set, it can be changed but not cleared.'
                  : 'Difficulty can be changed at any time, but it cannot be cleared again.'}
              </p>
            </div>
          </section>

          <ScoreHistory quizId={quiz.id} />
        </div>

        <section className={surfaceCard}>
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <h2 className="mr-auto text-base font-medium">Questions</h2>
            <span className={countPill}>{questions.length}</span>
          </div>

          {questions.length === 0 ? (
            <div className="px-6 py-5">
              <p className={placeholderPanel}>
                This quiz has no questions left. Add one to start building it back up.
              </p>
            </div>
          ) : (
            <ol className="m-0 list-none p-0">
              {questions.map((question, index) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  position={index + 1}
                  isConfirming={confirmingQuestionId === question.id}
                  isDeleting={deleteQuestion.isPending && deleteQuestion.variables === question.id}
                  disabled={isBusy || isConfirmingQuiz}
                  onAskEdit={() => {
                    clearActionFeedback()
                    setQuestionEditError('')
                    setConfirmingQuestionId(null)
                    setEditingQuestionId(question.id)
                  }}
                  onAskDelete={() => {
                    clearActionFeedback()
                    setConfirmingQuestionId(question.id)
                  }}
                  onCancelDelete={() => setConfirmingQuestionId(null)}
                  onConfirmDelete={() => deleteQuestion.mutate(question.id)}
                />
              ))}
            </ol>
          )}
        </section>
      </div>

      {isEditingQuiz && (
        <QuizEditDialog
          initialValues={{ title: quiz.title, description: quiz.description ?? '' }}
          isPending={updateQuiz.isPending}
          errorMessage={quizEditError}
          onSubmit={(body) => {
            setQuizEditError('')
            updateQuiz.mutate(body)
          }}
          onClose={() => setIsEditingQuiz(false)}
        />
      )}

      {editingQuestion && (
        <QuestionEditDialog
          question={editingQuestion}
          isPending={updateQuestion.isPending}
          errorMessage={questionEditError}
          onSubmit={(body) => {
            setQuestionEditError('')
            updateQuestion.mutate({ questionId: editingQuestion.id, body })
          }}
          onClose={() => setEditingQuestionId(null)}
        />
      )}
    </>
  )
}

function messageForQuestionFailure(error: unknown, action: 'add' | 'edit' | 'delete'): string {
  if (isStatus(error, 404)) {
    if (action === 'add') return 'This quiz no longer exists, so the question was not saved.'
    if (action === 'edit') {
      return 'This quiz or question no longer exists, so your changes were not saved.'
    }
    return 'That question has already been deleted.'
  }
  if (isStatus(error, 400)) {
    return 'That question was rejected. Check that every answer is filled in and exactly one is marked correct.'
  }
  if (action === 'add') return `We could not add that question. ${toReasonMessage(error)}`
  if (action === 'edit') return `We could not save that question. ${toReasonMessage(error)}`
  return `We could not delete that question. ${toReasonMessage(error)}`
}

export function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const quiz = useQuiz(quizId)

  const isMissing = isStatus(quiz.error, 404)

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        <BackLink fallback={DASHBOARD_BACK} className={cardLink} />

        <div className="mt-5">
          {quiz.isPending && <QuizSkeleton />}

          {quiz.isError && (
            <div className={`${surfaceCard} app-content-in max-w-150 p-8`}>
              <h1 className="text-3xl">
                {isMissing ? 'We could not find that quiz' : 'We could not load that quiz'}
              </h1>
              <p className="mt-3 text-base text-text-muted">
                {isMissing
                  ? 'It may have been deleted, or it belongs to another account.'
                  : toReasonMessage(quiz.error)}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {!isMissing && (
                  <button type="button" className={btnGhostSm} onClick={() => void quiz.refetch()}>
                    Try again
                  </button>
                )}
                <AppLink to="/quiz/new" className={cardLink}>
                  Generate a quiz
                  <IconArrowRight />
                </AppLink>
              </div>
            </div>
          )}

          {quiz.isSuccess && (
            <div className="app-content-in">
              <QuizContent quiz={quiz.data} />
            </div>
          )}
        </div>
      </main>
    </>
  )
}
