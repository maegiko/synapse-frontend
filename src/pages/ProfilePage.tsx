import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, type UpdateUserDetailsRequest, type UserDetails } from '../api'
import { AppHeader } from '../components/AppHeader'
import { Avatar } from '../components/Avatar'
import { FormAlert } from '../components/FormAlert'
import { TextField } from '../components/TextField'
import { IconArrowLeft, IconArrowRight, IconCheck } from '../components/icons'
import streakFlame from '../assets/streak_flame.png'
import streakFlameMuted from '../assets/streak_flame_muted.png'
import {
  btnGhostSm,
  btnPrimaryDisabled,
  btnPrimarySm,
  cardLink,
  shell,
  successAlert,
  surfaceCard,
} from '../components/ui'
import { useAuth } from '../auth/useAuth'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import { formatCalendarDate, formatDate } from '../lib/formatDate'
import { plural } from '../lib/plural'
import { queryClient } from '../lib/queryClient'
import {
  queryKeys,
  useAllQuizScores,
  useFlashcardDecks,
  useNotes,
  useQuizzes,
  useStreak,
  useUserDetails,
} from '../lib/queries'
import { validateEmail, validateFullName } from '../lib/validation'

const tile = 'rounded-sm border border-border bg-surface-alt px-4 py-3.5'
const tileLabel = 'text-xs font-bold text-text-muted'
const tileValue = 'mt-1 flex items-center gap-2 text-xl font-medium text-text tabular-nums'
const tileDetail = 'mt-0.5 text-xs text-text-muted'

interface StatTileProps {
  label: string
  value: string
  detail?: string
  /** Small decorative mark shown beside the value. */
  icon?: ReactNode
  isPending?: boolean
  isError?: boolean
  onRetry?: () => void
}

/** One number, with its own loading and failure states so a stat can fail alone. */
function StatTile({ label, value, detail, icon, isPending, isError, onRetry }: StatTileProps) {
  if (isPending) {
    return (
      <div className={tile} aria-hidden="true">
        <span className="block h-3 w-20 animate-pulse rounded-full bg-border" />
        <span className="mt-2.5 block h-5 w-14 animate-pulse rounded-full bg-border" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={tile}>
        <p className={tileLabel}>{label}</p>
        <p className="mt-1 text-sm text-text-muted">Unavailable</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 text-xs font-bold text-accent-solid hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={tile}>
      <p className={tileLabel}>{label}</p>
      <p className={tileValue}>
        {icon}
        {value}
      </p>
      {detail && <p className={tileDetail}>{detail}</p>}
    </div>
  )
}

function StatPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`${surfaceCard} overflow-hidden`}>
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-medium">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

interface FieldErrors {
  fullName?: string
  email?: string
}

/**
 * Account details plus a read-only view of how the study is going. Every number
 * here is derived from data the backend already exposes; there is no analytics
 * endpoint.
 */
export function ProfilePage() {
  const { user, setUserDetails } = useAuth()
  const details = useUserDetails(user)
  const streak = useStreak()
  const notes = useNotes()
  const decks = useFlashcardDecks()
  const quizzes = useQuizzes()
  const attempts = useAllQuizScores(quizzes.data?.map((quiz) => quiz.id))

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const profile = details.data

  function startEditing() {
    if (!profile) return
    setFullName(profile.fullName)
    setEmail(profile.email)
    setFieldErrors({})
    setFormError('')
    setSavedMessage('')
    setEditing(true)
  }

  function stopEditing() {
    setEditing(false)
    setFieldErrors({})
    setFormError('')
  }

  const save = useMutation({
    mutationFn: (payload: UpdateUserDetailsRequest) => api.user.updateDetails(payload),
    onSuccess: (updated: UserDetails) => {
      // The PATCH response is the normalized truth: a trimmed name, a lowercased
      // email. Nothing else is refetched, since no other view shows these.
      queryClient.setQueryData(queryKeys.userDetails, updated)
      setUserDetails(updated)
      setEditing(false)
      setFieldErrors({})
      setFormError('')
      setSavedMessage('Your details have been saved.')
    },
    onError: (error) => {
      if (isStatus(error, 409)) {
        setFieldErrors({ email: 'Another account already uses that email address.' })
        setFormError('')
        return
      }
      setFieldErrors({})
      setFormError(toFormMessage(error))
    },
  })

  // Compared against the saved values so an unchanged form cannot be submitted:
  // the API rejects a PATCH with no properties in it.
  const trimmedName = fullName.trim()
  const normalizedEmail = email.trim().toLowerCase()
  const nameChanged = Boolean(profile) && trimmedName !== profile?.fullName
  const emailChanged = Boolean(profile) && normalizedEmail !== profile?.email.toLowerCase()
  const hasChanges = nameChanged || emailChanged

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (save.isPending || !profile || !hasChanges) return

    const errors: FieldErrors = {
      fullName: nameChanged ? (validateFullName(fullName) ?? undefined) : undefined,
      email: emailChanged ? (validateEmail(email) ?? undefined) : undefined,
    }
    setFieldErrors(errors)
    setFormError('')
    if (Object.values(errors).some(Boolean)) return

    // Only changed properties are sent; the backend leaves the rest alone.
    const payload = {
      ...(nameChanged ? { fullName: trimmedName } : {}),
      ...(emailChanged ? { email: normalizedEmail } : {}),
    } as UpdateUserDetailsRequest

    save.mutate(payload)
  }

  const cardTotal = decks.data?.reduce((sum, deck) => sum + deck.flashcards.length, 0) ?? 0
  const questionTotal = quizzes.data?.reduce((sum, quiz) => sum + quiz.questions.length, 0) ?? 0

  // Each attempt was scored against its own question count, so percentages are
  // averaged rather than the raw scores.
  const percentages = attempts.scores.map(
    (score) => (score.score / Math.max(score.totalQuestions, 1)) * 100,
  )
  const averagePercent = percentages.length
    ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length
    : 0
  const bestPercent = percentages.length ? Math.max(...percentages) : 0
  const lastAttemptAt = attempts.scores.reduce<string | null>(
    (latest, score) => (latest === null || score.createdAt > latest ? score.createdAt : latest),
    null,
  )

  const quizzesPending = quizzes.isPending || attempts.isPending
  const hasAttempts = !quizzesPending && !quizzes.isError && attempts.scores.length > 0

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        <Link to="/dashboard" className={cardLink}>
          <IconArrowLeft />
          Back to your dashboard
        </Link>

        <div className="mt-5 max-w-200">
          <h1 className="text-3xl">Your profile</h1>
          <p className="mt-3 max-w-[60ch] text-base text-text-muted">
            Your account details and how your studying is going so far.
          </p>
        </div>

        <div className="mt-6 grid gap-6">
          {/* Only the first row is two columns. Everything below spans the full
              width, so the compact account card leaves no dead space beneath it. */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] lg:items-start">
            <div className="grid gap-6">
              {savedMessage && !editing && (
                <p className={successAlert} role="status">
                  <IconCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                  <span>{savedMessage}</span>
                </p>
              )}

              <section className={`${surfaceCard} overflow-hidden`}>
                <div className="border-b border-border px-6 py-4">
                  <h2 className="text-base font-medium">Account details</h2>
                </div>

                <div className="px-6 py-6">
                  {/* A stale copy from auth state is shown while this refetches, so a
                      failed refresh still leaves something readable on the page. */}
                  {details.isError && (
                    <div className={profile ? 'mb-5' : ''}>
                      <FormAlert
                        message={
                          profile
                            ? `These details may be out of date. ${toFormMessage(details.error)}`
                            : `We could not load your details. ${toFormMessage(details.error)}`
                        }
                      />
                      <button
                        type="button"
                        className={`${btnGhostSm} mt-3`}
                        onClick={() => void details.refetch()}
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {!profile && details.isPending && (
                    <div className="flex items-center gap-4" aria-hidden="true">
                      <span className="h-14 w-14 shrink-0 animate-pulse rounded-sm bg-surface-alt" />
                      <div className="grid flex-1 gap-2.5">
                        <span className="block h-4 w-40 animate-pulse rounded-full bg-surface-alt" />
                        <span className="block h-3 w-56 max-w-full animate-pulse rounded-full bg-surface-alt" />
                      </div>
                    </div>
                  )}

                  {profile && !editing && (
                    <>
                      <div className="flex items-center gap-4">
                        <Avatar fullName={profile.fullName} size="lg" />
                        <div className="min-w-0">
                          <p className="truncate text-lg font-medium">{profile.fullName}</p>
                          <p className="truncate text-sm text-text-muted">{profile.email}</p>
                        </div>
                      </div>
                      {/* Sits under the identity block rather than in the card header,
                          so the compact card reads as finished next to the streak. */}
                      <div className="mt-5 flex justify-end">
                        <button type="button" className={btnGhostSm} onClick={startEditing}>
                          Edit details
                        </button>
                      </div>
                    </>
                  )}

                  {profile && editing && (
                    <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
                      {formError && <FormAlert message={formError} />}

                      <TextField
                        label="Full name"
                        name="fullName"
                        autoComplete="name"
                        value={fullName}
                        error={fieldErrors.fullName}
                        disabled={save.isPending}
                        onChange={(event) => setFullName(event.target.value)}
                      />

                      <TextField
                        label="Email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        hint="Changing this changes the address you log in with."
                        value={email}
                        error={fieldErrors.email}
                        disabled={save.isPending}
                        onChange={(event) => setEmail(event.target.value)}
                      />

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          className={`${btnPrimarySm} ${btnPrimaryDisabled}`}
                          disabled={save.isPending || !hasChanges}
                        >
                          {save.isPending ? 'Saving…' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          className={btnGhostSm}
                          onClick={stopEditing}
                          disabled={save.isPending}
                        >
                          Cancel
                        </button>
                        {!hasChanges && !save.isPending && (
                          <span className="text-xs text-text-muted">
                            Change your name or email to save.
                          </span>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              </section>
            </div>

            <StatPanel title="Study streak">
              {streak.isError || (!streak.isPending && !streak.data) ? (
                <div className="grid justify-items-start gap-2.5">
                  <p className="text-sm text-text-muted">
                    We could not load your streak. {toFormMessage(streak.error)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void streak.refetch()}
                    className="text-sm font-bold text-accent-solid hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatTile
                    label="Current streak"
                    value={streak.data ? plural(streak.data.currentStreak, 'day') : ''}
                    icon={
                      <img
                        src={streak.data?.activeToday ? streakFlame : streakFlameMuted}
                        alt=""
                        className="h-5 w-5 shrink-0 object-contain"
                      />
                    }
                    detail={
                      streak.data?.activeToday
                        ? 'You have already studied today.'
                        : 'Nothing counted today yet.'
                    }
                    isPending={streak.isPending}
                  />
                  <StatTile
                    label="Longest streak"
                    value={streak.data ? plural(streak.data.longestStreak, 'day') : ''}
                    detail="Your best run so far."
                    isPending={streak.isPending}
                  />
                  <StatTile
                    label="Last active"
                    value={
                      streak.data?.lastActiveDate
                        ? formatCalendarDate(streak.data.lastActiveDate)
                        : 'Never'
                    }
                    detail="Your most recent study day."
                    isPending={streak.isPending}
                  />
                </div>
              )}
            </StatPanel>
          </div>

          <StatPanel title="Library">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile
                label="Notes"
                value={String(notes.data?.length ?? 0)}
                detail="Summarised so far."
                isPending={notes.isPending}
                isError={notes.isError}
                onRetry={() => void notes.refetch()}
              />
              <StatTile
                label="Decks"
                value={String(decks.data?.length ?? 0)}
                detail={`${plural(cardTotal, 'flashcard')} in total.`}
                isPending={decks.isPending}
                isError={decks.isError}
                onRetry={() => void decks.refetch()}
              />
              <StatTile
                label="Quizzes"
                value={String(quizzes.data?.length ?? 0)}
                detail={`${plural(questionTotal, 'question')} in total.`}
                isPending={quizzes.isPending}
                isError={quizzes.isError}
                onRetry={() => void quizzes.refetch()}
              />
            </div>
            <Link to="/library" className={`${cardLink} mt-4`}>
              Browse your library
              <IconArrowRight />
            </Link>
          </StatPanel>

          <StatPanel title="Quiz performance">
            {/* Attempt history is per quiz, so a failure here is partial: the
                numbers still hold for every quiz that did answer. */}
            {attempts.failedCount > 0 && (
              <div className="mb-4 grid justify-items-start gap-2.5">
                <p className="text-sm text-text-muted">
                  {plural(attempts.failedCount, 'quiz', 'quizzes')} could not be included, so
                  these numbers are incomplete.
                </p>
                <button
                  type="button"
                  onClick={attempts.retryFailed}
                  className="text-sm font-bold text-accent-solid hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {quizzes.isError ? (
              <div className="grid justify-items-start gap-2.5">
                <p className="text-sm text-text-muted">
                  We could not load your quizzes. {toFormMessage(quizzes.error)}
                </p>
                <button
                  type="button"
                  onClick={() => void quizzes.refetch()}
                  className="text-sm font-bold text-accent-solid hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : !quizzesPending && !hasAttempts ? (
              <p className="rounded-md border border-dashed border-border bg-surface-alt px-6 py-7 text-center text-sm text-text-muted">
                {quizzes.data?.length
                  ? 'You have not saved a quiz attempt yet. Every run you save shows up here.'
                  : 'Generate a quiz from a note, and every attempt you save shows up here.'}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile
                  label="Attempts saved"
                  value={String(attempts.scores.length)}
                  detail={`Across ${plural(attempts.quizzesAttempted, 'quiz', 'quizzes')}.`}
                  isPending={quizzesPending}
                />
                <StatTile
                  label="Average score"
                  value={`${Math.round(averagePercent)}%`}
                  detail="Mean of every attempt."
                  isPending={quizzesPending}
                />
                <StatTile
                  label="Best score"
                  value={`${Math.round(bestPercent)}%`}
                  detail="Your strongest run."
                  isPending={quizzesPending}
                />
                <StatTile
                  label="Last attempt"
                  value={formatDate(lastAttemptAt) || '—'}
                  detail="Most recent saved run."
                  isPending={quizzesPending}
                />
              </div>
            )}
          </StatPanel>
        </div>
      </main>
    </>
  )
}
