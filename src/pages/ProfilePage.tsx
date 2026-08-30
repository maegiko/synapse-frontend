import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  api,
  type ChangePasswordRequest,
  type UpdateUserDetailsRequest,
  type UserDetails,
} from '../api'
import { AppHeader } from '../components/AppHeader'
import { Avatar } from '../components/Avatar'
import { FormAlert } from '../components/FormAlert'
import { TextField } from '../components/TextField'
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconDeck,
  IconNote,
  IconQuiz,
} from '../components/icons'
import streakFlame from '../assets/streak_flame.webp'
import streakFlameMuted from '../assets/streak_flame_muted.webp'
import {
  btnGhostSm,
  btnPrimaryDisabled,
  btnPrimarySm,
  cardLink,
  shell,
  successAlert,
} from '../components/ui'
import { useAuth } from '../auth/useAuth'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import { calendarDaysFromToday, formatCalendarDate, formatDate } from '../lib/formatDate'
import { plural } from '../lib/plural'
import { queryClient } from '../lib/queryClient'
import {
  queryKeys,
  useAllQuizScores,
  useFlashcardDecks,
  useNotes,
  useQuizzes,
  useReviewQueue,
  useStreak,
  useUserDetails,
} from '../lib/queries'
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validateFullName,
  validatePassword,
} from '../lib/validation'

/** Placeholder that lets a single figure keep loading while its neighbours resolve. */
function Bar() {
  return (
    <span
      className="inline-block h-5 w-12 animate-pulse rounded-full bg-surface-alt align-middle"
      aria-hidden="true"
    />
  )
}

/** A number rendered by typography alone — no card, no border, no tint. */
function Figure({
  label,
  hint,
  className = '',
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-bold text-text-muted">{label}</dt>
      <dd className="mt-1.5 flex items-center gap-1.5 text-lg font-medium text-text tabular-nums">
        {children}
      </dd>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  )
}

/** One library resource as a content row rather than a stat card. */
function LibraryRow({
  to,
  icon,
  label,
  value,
  detail,
}: {
  to: string
  icon: ReactNode
  label: string
  value: ReactNode
  detail?: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 py-3.5 no-underline transition-colors hover:bg-surface-alt/60"
    >
      <span className="flex flex-1 items-center gap-2.5 text-sm font-medium text-text">
        <span className="text-text-muted" aria-hidden="true">
          {icon}
        </span>
        {label}
      </span>
      <span className="flex items-baseline gap-1.5 text-xs text-text-muted">
        <span className="text-base font-medium text-text tabular-nums">{value}</span>
        {detail}
      </span>
      <IconArrowRight className="h-3.5 w-3.5 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

interface FieldErrors {
  fullName?: string
  email?: string
}

interface PasswordErrors {
  currentPassword?: string
  newPassword?: string
}

/** Which editor the profile card is showing. */
type Panel = 'summary' | 'details' | 'password'

/** Which set of numbers the Performance panel is showing. */
type PerfTab = 'flashcards' | 'quizzes'
const PERF_TABS: { id: PerfTab; label: string }[] = [
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quizzes', label: 'Quizzes' },
]

/** How overdue the queue's oldest deck is, phrased for a single stat cell. */
function dueAgeLabel(date: string): string {
  const days = calendarDaysFromToday(date)
  if (days === null) return '—'
  if (days >= 0) return 'Today'
  if (days === -1) return 'Yesterday'
  return `${-days} days ago`
}

/**
 * Account details plus a read-only view of how the study is going. Every number
 * here is derived from data the backend already exposes; there is no analytics
 * endpoint.
 */
export function ProfilePage() {
  const { user, setUserDetails, logout } = useAuth()
  const details = useUserDetails(user)
  const streak = useStreak()
  const notes = useNotes()
  const decks = useFlashcardDecks()
  const quizzes = useQuizzes()
  const attempts = useAllQuizScores(quizzes.data?.map((quiz) => quiz.id))
  const reviewQueue = useReviewQueue()

  const [panel, setPanel] = useState<Panel>('summary')
  const [perfTab, setPerfTab] = useState<PerfTab>('flashcards')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})
  const [passwordFormError, setPasswordFormError] = useState('')

  const profile = details.data

  function startEditing() {
    if (!profile) return
    setFullName(profile.fullName)
    setEmail(profile.email)
    setFieldErrors({})
    setFormError('')
    setSavedMessage('')
    setPanel('details')
  }

  function startChangingPassword() {
    setCurrentPassword('')
    setNewPassword('')
    setPasswordErrors({})
    setPasswordFormError('')
    setSavedMessage('')
    setPanel('password')
  }

  function closePanel() {
    setPanel('summary')
    setFieldErrors({})
    setFormError('')
    setPasswordErrors({})
    setPasswordFormError('')
  }

  const save = useMutation({
    mutationFn: (payload: UpdateUserDetailsRequest) => api.user.updateDetails(payload),
    onSuccess: (updated: UserDetails) => {
      // The PATCH response is the normalized truth: a trimmed name, a lowercased
      // email. Nothing else is refetched, since no other view shows these.
      queryClient.setQueryData(queryKeys.userDetails, updated)
      setUserDetails(updated)
      setPanel('summary')
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

  const changePassword = useMutation({
    mutationFn: (payload: ChangePasswordRequest) => api.auth.changePassword(payload),
    onSuccess: () => {
      // The backend has revoked every session for the account, so local auth is
      // now stale. Clearing it lets the route guard send us to the login page.
      void logout()
    },
    onError: (error) => {
      // For this endpoint a 401 is a wrong current password, not an expired
      // access token — the request helper already retried that case.
      if (isStatus(error, 401)) {
        setPasswordErrors({ currentPassword: 'That password is not correct.' })
        setPasswordFormError('')
        return
      }
      setPasswordErrors({})
      setPasswordFormError(toFormMessage(error))
    },
  })

  // Compared against the saved values so an unchanged form cannot be submitted:
  // the API rejects a PATCH with no properties in it.
  const trimmedName = fullName.trim()
  const normalizedEmail = email.trim().toLowerCase()
  const nameChanged = Boolean(profile) && trimmedName !== profile?.fullName
  const emailChanged = Boolean(profile) && normalizedEmail !== profile?.email.toLowerCase()
  const hasChanges = nameChanged || emailChanged

  // Like the details form's `hasChanges`: the submit stays disabled until there
  // is something to send.
  const passwordFilled = currentPassword.length > 0 && newPassword.length > 0

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

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (changePassword.isPending) return

    const errors: PasswordErrors = {
      currentPassword: currentPassword ? undefined : 'Enter your current password.',
      newPassword: validatePassword(newPassword) ?? undefined,
    }
    setPasswordErrors(errors)
    setPasswordFormError('')
    if (Object.values(errors).some(Boolean)) return

    changePassword.mutate({ currentPassword, newPassword })
  }

  const cardTotal = decks.data?.reduce((sum, deck) => sum + deck.flashcards.length, 0) ?? 0

  // Spaced-repetition figures. The only lifetime flashcard number the backend
  // keeps is `totalFlashcardsReviewed`; everything else is derived from the
  // current review queue (`GET /api/flashcards/review`), which lists only the
  // decks due today or earlier, oldest due date first.
  const reviewsCompleted = details.data?.totalFlashcardsReviewed ?? 0
  // Auth state seeded from login/register has no review total until details load.
  const reviewsLoading = details.isPending || details.data?.totalFlashcardsReviewed === undefined
  const dueDeckCount = reviewQueue.data?.length ?? 0
  const dueCardCount = reviewQueue.data?.reduce((sum, deck) => sum + deck.cardCount, 0) ?? 0
  const oldestDue = reviewQueue.data?.[0]?.nextReviewDate ?? null

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

  const streakUnavailable = streak.isError || (!streak.isPending && !streak.data)
  const flameSrc = streak.data?.activeToday ? streakFlame : streakFlameMuted

  /** A count for the summary strip: a bar while loading, an em dash on failure. */
  function count(query: { isPending: boolean; isError: boolean }, value: number): ReactNode {
    if (query.isPending) return <Bar />
    if (query.isError) return <span className="text-base text-text-muted">—</span>
    return value
  }

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

        {savedMessage && panel === 'summary' && (
          <p className={`${successAlert} mt-8`} role="status">
            <IconCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>{savedMessage}</span>
          </p>
        )}

        {/* Profile summary — the anchor of the page. Identity, the edit action,
            and a strip of the numbers worth seeing at a glance. */}
        {/* The shared surfaceCard classes minus its shadow-sm, so the card can
            carry a slightly deeper drop shadow as the page's anchor. */}
        <section
          className="mt-8 rounded-md border border-border bg-surface px-6 py-6 shadow-[0_4px_18px_rgba(30,20,60,0.05)] sm:px-8 sm:py-7"
        >
          {details.isError && (
            <div className={profile ? 'mb-6' : ''}>
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

          {profile && panel === 'summary' && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                  <Avatar fullName={profile.fullName} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-xl font-medium">{profile.fullName}</p>
                    <p className="truncate text-sm text-text-muted">{profile.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" className={btnGhostSm} onClick={startEditing}>
                    Edit profile
                  </button>
                  <button type="button" className={btnGhostSm} onClick={startChangingPassword}>
                    Change password
                  </button>
                </div>
              </div>

              <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-border pt-6 sm:mt-8 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-border">
                <div className="sm:px-6 sm:first:pl-0 sm:last:pr-0">
                  <dt className="text-xs font-bold text-text-muted">Notes</dt>
                  <dd className="mt-1.5 flex items-center gap-1.5 text-lg font-medium text-text tabular-nums">
                    {count(notes, notes.data?.length ?? 0)}
                  </dd>
                </div>
                <div className="sm:px-6 sm:first:pl-0 sm:last:pr-0">
                  <dt className="text-xs font-bold text-text-muted">Decks</dt>
                  <dd className="mt-1.5 flex items-center gap-1.5 text-lg font-medium text-text tabular-nums">
                    {count(decks, decks.data?.length ?? 0)}
                  </dd>
                </div>
                <div className="sm:px-6 sm:first:pl-0 sm:last:pr-0">
                  <dt className="text-xs font-bold text-text-muted">Flashcards</dt>
                  <dd className="mt-1.5 flex items-center gap-1.5 text-lg font-medium text-text tabular-nums">
                    {count(decks, cardTotal)}
                  </dd>
                </div>
                <div className="sm:px-6 sm:first:pl-0 sm:last:pr-0">
                  <dt className="text-xs font-bold text-text-muted">Quizzes</dt>
                  <dd className="mt-1.5 flex items-center gap-1.5 text-lg font-medium text-text tabular-nums">
                    {count(quizzes, quizzes.data?.length ?? 0)}
                  </dd>
                </div>
              </dl>
            </>
          )}

          {profile && panel === 'details' && (
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
                  onClick={closePanel}
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

          {profile && panel === 'password' && (
            changePassword.isSuccess ? (
              <div className="grid gap-2" role="status">
                <h2 className="text-base font-medium">Password changed</h2>
                <p className="text-sm text-text-muted">
                  Signing you out. Log in again with your new password.
                </p>
              </div>
            ) : (
              <form className="grid gap-5" onSubmit={handlePasswordSubmit} noValidate>
                <div>
                  <h2 className="text-base font-medium">Change your password</h2>
                  <p className="mt-1 text-sm text-text-muted">
                    This signs you out on every device, so you will need to log in again with the
                    new password.
                  </p>
                </div>

                {passwordFormError && <FormAlert message={passwordFormError} />}

                <TextField
                  label="Current password"
                  type="password"
                  name="currentPassword"
                  autoComplete="current-password"
                  value={currentPassword}
                  error={passwordErrors.currentPassword}
                  disabled={changePassword.isPending}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />

                <TextField
                  label="New password"
                  type="password"
                  name="newPassword"
                  autoComplete="new-password"
                  hint={`Between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`}
                  value={newPassword}
                  error={passwordErrors.newPassword}
                  disabled={changePassword.isPending}
                  onChange={(event) => setNewPassword(event.target.value)}
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className={`${btnPrimarySm} ${btnPrimaryDisabled}`}
                    disabled={changePassword.isPending || !passwordFilled}
                  >
                    {changePassword.isPending ? 'Saving…' : 'Change password'}
                  </button>
                  <button
                    type="button"
                    className={btnGhostSm}
                    onClick={closePanel}
                    disabled={changePassword.isPending}
                  >
                    Cancel
                  </button>
                  {!passwordFilled && !changePassword.isPending && (
                    <span className="text-xs text-text-muted">
                      Fill in both fields to continue.
                    </span>
                  )}
                </div>
              </form>
            )
          )}
        </section>

        {/* Learning activity — the streak, told with columns and a divider
            rather than three tinted boxes. Everything below the profile card is
            inset on desktop so the card stays the dominant full-width anchor. */}
        <section className="mt-12 border-t border-border/60 pt-8 lg:mx-12">
          <h2 className="text-base font-medium">Learning activity</h2>
          <p className="mt-1 text-sm text-text-muted">How consistent your studying has been.</p>

          {streakUnavailable ? (
            <div className="mt-5 grid justify-items-start gap-2.5">
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
            <dl className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-y-0 sm:divide-x sm:divide-border">
              <Figure
                label="Current streak"
                className="sm:px-6 sm:first:pl-0 sm:last:pr-0"
                hint={
                  streak.data?.activeToday
                    ? 'You have already studied today.'
                    : 'Nothing counted today yet.'
                }
              >
                {streak.isPending ? (
                  <Bar />
                ) : (
                  <>
                    <img
                      src={flameSrc}
                      alt=""
                      width="128"
                      height="128"
                      decoding="async"
                      className="h-5 w-5 shrink-0 object-contain"
                    />
                    {plural(streak.data?.currentStreak ?? 0, 'day')}
                  </>
                )}
              </Figure>
              <Figure
                label="Longest streak"
                className="sm:px-6 sm:first:pl-0 sm:last:pr-0"
                hint="Your best run so far."
              >
                {streak.isPending ? <Bar /> : plural(streak.data?.longestStreak ?? 0, 'day')}
              </Figure>
              <Figure
                label="Last active"
                className="sm:px-6 sm:first:pl-0 sm:last:pr-0"
                hint="Your most recent study day."
              >
                {streak.isPending ? (
                  <Bar />
                ) : streak.data?.lastActiveDate ? (
                  formatCalendarDate(streak.data.lastActiveDate)
                ) : (
                  'Never'
                )}
              </Figure>
            </dl>
          )}
        </section>

        {/* Library and quiz performance: content on the left, analytics on the
            right. They sit side by side where there is room, and stack cleanly
            where there is not. */}
        <div className="mt-12 grid grid-cols-1 gap-y-10 border-t border-border pt-8 lg:mx-12 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-0">
          <section>
            <h2 className="text-base font-medium">Library</h2>
            <p className="mt-1 text-sm text-text-muted">Everything you have generated so far.</p>

            <div className="mt-5 divide-y divide-border border-t border-border">
              <LibraryRow
                to="/library?type=notes"
                icon={<IconNote className="h-4 w-4" />}
                label="Notes"
                value={count(notes, notes.data?.length ?? 0)}
                detail={notes.isPending || notes.isError ? undefined : 'summarised'}
              />
              <LibraryRow
                to="/library?type=decks"
                icon={<IconDeck className="h-4 w-4" />}
                label="Decks"
                value={count(decks, decks.data?.length ?? 0)}
                detail={decks.isPending || decks.isError ? undefined : 'decks'}
              />
              <LibraryRow
                to="/library?type=quizzes"
                icon={<IconQuiz className="h-4 w-4" />}
                label="Quizzes"
                value={count(quizzes, quizzes.data?.length ?? 0)}
                detail={quizzes.isPending || quizzes.isError ? undefined : 'quizzes'}
              />
            </div>

            <Link to="/library" className={`${cardLink} mt-4`}>
              Browse your library
              <IconArrowRight />
            </Link>
          </section>

          <section className="border-t border-border pt-8 lg:border-t-0 lg:border-l lg:border-border lg:pt-0 lg:pl-14">
            <h2 className="text-base font-medium">Performance</h2>

            {/* An `sr-only` radio group styled as underline tabs — the same
                pattern as PlaybackModeControl, so arrow-key navigation and the
                single tab stop come for free. */}
            <fieldset className="m-0 mt-3 border-0 p-0">
              <legend className="sr-only">Which performance metrics to show</legend>
              <div className="flex gap-5 border-b border-border">
                {PERF_TABS.map((tab) => {
                  const active = perfTab === tab.id
                  return (
                    <label
                      key={tab.id}
                      className={`-mb-px cursor-pointer border-b-2 pb-2 text-sm font-medium whitespace-nowrap transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-solid ${
                        active
                          ? 'border-accent-solid text-text'
                          : 'border-transparent text-text-muted hover:text-text'
                      }`}
                    >
                      <input
                        type="radio"
                        name="perf-tab"
                        className="sr-only"
                        value={tab.id}
                        checked={active}
                        onChange={() => setPerfTab(tab.id)}
                      />
                      {tab.label}
                    </label>
                  )
                })}
              </div>
            </fieldset>

            {perfTab === 'flashcards' ? (
              <div className="mt-5">
                <p className="text-sm text-text-muted">How your review schedule is going.</p>

                {reviewQueue.isError && (
                  <div className="mt-4 grid justify-items-start gap-2.5">
                    <p className="text-sm text-text-muted">
                      Your review queue did not load, so the due figures are unavailable.{' '}
                      {toFormMessage(reviewQueue.error)}
                    </p>
                    <button
                      type="button"
                      onClick={() => void reviewQueue.refetch()}
                      className="text-sm font-bold text-accent-solid hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6">
                  <Figure label="Reviews completed" hint="Cards reviewed all-time.">
                    {count({ isPending: reviewsLoading, isError: details.isError }, reviewsCompleted)}
                  </Figure>
                  <Figure label="Decks due" hint="Ready to review now.">
                    {count(reviewQueue, dueDeckCount)}
                  </Figure>
                  <Figure label="Cards due" hint="Waiting in your queue.">
                    {count(reviewQueue, dueCardCount)}
                  </Figure>
                  <Figure label="Oldest due" hint="Oldest in your queue.">
                    {reviewQueue.isPending ? (
                      <Bar />
                    ) : reviewQueue.isError ? (
                      <span className="text-base text-text-muted">—</span>
                    ) : oldestDue ? (
                      dueAgeLabel(oldestDue)
                    ) : (
                      'Up to date'
                    )}
                  </Figure>
                </dl>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-sm text-text-muted">Across every attempt you have saved.</p>

                {/* Attempt history is per quiz, so a failure here is partial: the
                    numbers still hold for every quiz that did answer. */}
                {attempts.failedCount > 0 && (
                  <div className="mt-4 grid justify-items-start gap-2.5">
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
                  <div className="mt-5 grid justify-items-start gap-2.5">
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
                  <p className="mt-5 max-w-[42ch] text-sm text-text-muted">
                    {quizzes.data?.length
                      ? 'You have not saved a quiz attempt yet. Every run you save shows up here.'
                      : 'Generate a quiz from a note, and every attempt you save shows up here.'}
                  </p>
                ) : (
                  <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6">
                    <Figure
                      label="Attempts"
                      hint={`Across ${plural(attempts.quizzesAttempted, 'quiz', 'quizzes')}.`}
                    >
                      {quizzesPending ? <Bar /> : String(attempts.scores.length)}
                    </Figure>
                    <Figure label="Average score" hint="Mean of every attempt.">
                      {quizzesPending ? <Bar /> : `${Math.round(averagePercent)}%`}
                    </Figure>
                    <Figure label="Best score" hint="Your strongest run.">
                      {quizzesPending ? <Bar /> : `${Math.round(bestPercent)}%`}
                    </Figure>
                    <Figure label="Last attempt" hint="Most recent saved run.">
                      {quizzesPending ? <Bar /> : formatDate(lastAttemptAt) || '—'}
                    </Figure>
                  </dl>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
