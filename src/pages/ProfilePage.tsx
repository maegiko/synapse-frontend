import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  api,
  type ChangePasswordRequest,
  type UpdateUserDetailsRequest,
  type UserDetails,
} from '../api'
import { AppHeader } from '../components/AppHeader'
import { AppLink } from '../components/AppLink'
import { BackLink } from '../components/BackLink'
import { Avatar } from '../components/Avatar'
import { CountryFlag } from '../components/CountryFlag'
import { FormAlert } from '../components/FormAlert'
import { SelectField } from '../components/SelectField'
import { TextField } from '../components/TextField'
import {
  IconArrowRight,
  IconCard,
  IconChart,
  IconCheck,
  IconDeck,
  IconNote,
  IconPlay,
  IconQuiz,
  IconStar,
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
import { DASHBOARD_BACK } from '../lib/backTrail'
import { formatCalendarDate } from '../lib/formatDate'
import {
  formatImprovement,
  formatPercentage,
  formatRatioAsPercentage,
  NO_DATA_LABEL,
} from '../lib/analytics'
import { timeZoneOptions } from '../lib/timeZone'
import { timeZoneLocation } from '../lib/timeZoneLocation'
import { plural } from '../lib/plural'
import { queryClient } from '../lib/queryClient'
import {
  queryKeys,
  useAnalytics,
  useFlashcardDecks,
  useNotes,
  useQuizzes,
  useUserTimeZone,
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
  icon,
  hint,
  className = '',
  children,
}: {
  label: string
  icon?: ReactNode
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <dt className="flex items-center gap-2 text-xs font-bold text-text-muted">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </dt>
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
    <AppLink
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
    </AppLink>
  )
}

interface FieldErrors {
  fullName?: string
  email?: string
}

interface PasswordErrors {
  currentPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

/** Which editor the profile card is showing. */
type Panel = 'summary' | 'details' | 'password'

/** Which set of numbers the Performance panel is showing. */
type PerfTab = 'flashcards' | 'quizzes'
const PERF_TABS: { id: PerfTab; label: string; icon: ReactNode }[] = [
  { id: 'flashcards', label: 'Flashcards', icon: <IconDeck className="h-4 w-4" /> },
  { id: 'quizzes', label: 'Quizzes', icon: <IconQuiz className="h-4 w-4" /> },
]

/** The window the profile's compact snapshot reports on. The full page can widen it. */
const SNAPSHOT_PERIOD = 30

/**
 * Account details plus a read-only view of how the study is going. The library
 * counts are derived from the list endpoints; the performance snapshot comes
 * straight from `GET /api/user/analytics`, which aggregates it server-side.
 */
export function ProfilePage() {
  const { user, setUserDetails, logout } = useAuth()
  const details = useUserDetails(user)
  const streak = useStreak()
  const notes = useNotes()
  const decks = useFlashcardDecks()
  const quizzes = useQuizzes()
  // One aggregate request for the whole Performance panel, rather than a score
  // history request per quiz.
  const analytics = useAnalytics(SNAPSHOT_PERIOD)

  const [panel, setPanel] = useState<Panel>('summary')
  const [perfTab, setPerfTab] = useState<PerfTab>('flashcards')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [timeZoneField, setTimeZoneField] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})
  const [passwordFormError, setPasswordFormError] = useState('')

  const profile = details.data
  const timeZone = useUserTimeZone()
  const location = timeZoneLocation(timeZone)

  function startEditing() {
    if (!profile) return
    setFullName(profile.fullName)
    setEmail(profile.email)
    setTimeZoneField(timeZone)
    setFieldErrors({})
    setFormError('')
    setSavedMessage('')
    setPanel('details')
  }

  function startChangingPassword() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
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
      // email, a canonical time zone.
      queryClient.setQueryData(queryKeys.userDetails, updated)
      setUserDetails(updated)

      // A new time zone moves the calendar the backend answers in, so anything
      // it dated is now stale: which day counts as today, and which decks are
      // due. The rows themselves are untouched, so this is a refresh rather
      // than a rebuild.
      if (timeZoneChanged) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.streak })
        void queryClient.invalidateQueries({ queryKey: queryKeys.reviewQueue })
        // Analytics windows are whole local days, so a new zone moves both ends
        // of every window and the day each session was grouped into.
        void queryClient.invalidateQueries({ queryKey: queryKeys.analytics })
      }
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
  // Guarded on a non-empty field: unlike the text inputs, an empty value here is
  // not a validation message but a 400, so it must never reach the payload.
  const timeZoneChanged = Boolean(profile) && Boolean(timeZoneField) && timeZoneField !== timeZone
  const hasChanges = nameChanged || emailChanged || timeZoneChanged

  // Like the details form's `hasChanges`: the submit stays disabled until there
  // is something to send.
  const passwordFilled =
    currentPassword.length > 0 && newPassword.length > 0 && confirmNewPassword.length > 0

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
      ...(timeZoneChanged ? { timeZone: timeZoneField } : {}),
    } as UpdateUserDetailsRequest

    save.mutate(payload)
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (changePassword.isPending) return

    const errors: PasswordErrors = {
      currentPassword: currentPassword ? undefined : 'Enter your current password.',
      newPassword: validatePassword(newPassword) ?? undefined,
      confirmNewPassword: !confirmNewPassword
        ? 'Confirm your new password.'
        : confirmNewPassword === newPassword
          ? undefined
          : 'The passwords do not match.',
    }
    setPasswordErrors(errors)
    setPasswordFormError('')
    if (Object.values(errors).some(Boolean)) return

    changePassword.mutate({ currentPassword, newPassword })
  }

  const cardTotal = decks.data?.reduce((sum, deck) => sum + deck.flashcards.length, 0) ?? 0

  const snapshot = analytics.data
  const streakUnavailable = streak.isError || (!streak.isPending && !streak.data)
  const flameSrc = streak.data?.activeToday ? streakFlame : streakFlameMuted

  /** A count for the summary strip: a bar while loading, an em dash on failure. */
  function count(query: { isPending: boolean; isError: boolean }, value: number): ReactNode {
    if (query.isPending) return <Bar />
    if (query.isError) return <span className="text-base text-text-muted">—</span>
    return value
  }

  /**
   * One analytics figure. A rate or an average the API sent as null says so in
   * words, at text size, rather than being flattened into a zero it never meant.
   */
  function stat(value: string): ReactNode {
    if (!snapshot) return <Bar />
    if (value === NO_DATA_LABEL) {
      return <span className="text-sm font-normal text-text-muted">{value}</span>
    }
    return value
  }

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        <BackLink fallback={DASHBOARD_BACK} className={cardLink} />

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
          className="mt-8 rounded-md border border-border bg-surface px-6 py-6 shadow-sm sm:px-8 sm:py-7"
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
                    <p
                      className="flex items-center gap-1.5 truncate text-xs text-text-muted"
                      aria-label={location.accessibleLabel}
                      title={timeZone}
                    >
                      <CountryFlag
                        code={location.countryCode}
                        className="h-[1em] w-[1.5em] shrink-0 rounded-[1px] shadow-[0_0_0_1px_rgba(255,255,255,0.14)]"
                      />
                      <span aria-hidden="true">•</span>
                      <span className="truncate" aria-hidden="true">
                        {location.city}
                      </span>
                    </p>
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

              <SelectField
                label="Time zone"
                name="timeZone"
                hint="Streak days, due dates, and every time shown are counted here. It stays put when you travel."
                value={timeZoneField}
                options={timeZoneOptions(timeZone)}
                disabled={save.isPending}
                onChange={(event) => setTimeZoneField(event.target.value)}
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
                    Change your name, email, or time zone to save.
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

                <TextField
                  label="Confirm new password"
                  type="password"
                  name="confirmNewPassword"
                  autoComplete="new-password"
                  value={confirmNewPassword}
                  error={passwordErrors.confirmNewPassword}
                  disabled={changePassword.isPending}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
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
                      Fill in all fields to continue.
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
                className="text-sm font-bold text-accent-foreground hover:underline"
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

            <AppLink to="/library" className={`${cardLink} mt-4`}>
              Browse your library
              <IconArrowRight />
            </AppLink>
          </section>

          <section className="border-t border-border pt-8 [&_dd]:text-accent-foreground lg:border-t-0 lg:border-l lg:border-border lg:pt-0 lg:pl-14">
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
                      className={`-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 pb-2 text-sm font-medium whitespace-nowrap transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-solid ${
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
                      <span aria-hidden="true">{tab.icon}</span>
                      {tab.label}
                    </label>
                  )
                })}
              </div>
            </fieldset>

            {analytics.isError ? (
              <div className="mt-5 grid justify-items-start gap-2.5">
                <p className="text-sm text-text-muted">
                  We could not load your performance. {toFormMessage(analytics.error)}
                </p>
                <button
                  type="button"
                  onClick={() => void analytics.refetch()}
                  className="text-sm font-bold text-accent-foreground hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : perfTab === 'flashcards' ? (
              <div className="mt-5">
                <p className="text-sm text-text-muted">
                  Your deck reviews over the last {SNAPSHOT_PERIOD} days.
                </p>

                <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6">
                  <Figure
                    label="Cards reviewed"
                    icon={<IconCard className="h-4 w-4" />}
                    hint="In this period."
                  >
                    {stat(String(snapshot?.flashcards.cardsReviewed ?? 0))}
                  </Figure>
                  <Figure
                    label="Review sessions"
                    icon={<IconDeck className="h-4 w-4" />}
                    hint="A whole deck counts as one."
                  >
                    {stat(String(snapshot?.flashcards.reviewSessions ?? 0))}
                  </Figure>
                  <Figure
                    label="Retention rate"
                    icon={<IconCheck className="h-4 w-4" />}
                    hint="Reviews you rated good or easy."
                  >
                    {stat(formatRatioAsPercentage(snapshot?.flashcards.retentionRate ?? null))}
                  </Figure>
                  <Figure
                    label="Strong decks"
                    icon={<IconStar className="h-4 w-4" />}
                    hint="Rated well and on a long interval."
                  >
                    {stat(String(snapshot?.flashcards.mastery.strong ?? 0))}
                  </Figure>
                </dl>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-sm text-text-muted">
                  Your quiz attempts over the last {SNAPSHOT_PERIOD} days.
                </p>

                {snapshot && snapshot.quizzes.attempts === 0 ? (
                  <p className="mt-5 max-w-[42ch] text-sm text-text-muted">
                    {quizzes.data?.length
                      ? 'You have not saved a quiz attempt in this period. Every run you save shows up here.'
                      : 'Generate a quiz from a note, and every attempt you save shows up here.'}
                  </p>
                ) : (
                  <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6">
                    <Figure
                      label="Attempts"
                      icon={<IconPlay className="h-4 w-4" />}
                      hint={
                        snapshot
                          ? `Across ${plural(
                              snapshot.quizzes.distinctQuizzesAttempted,
                              'quiz',
                              'quizzes',
                            )}.`
                          : undefined
                      }
                    >
                      {stat(String(snapshot?.quizzes.attempts ?? 0))}
                    </Figure>
                    <Figure
                      label="Average score"
                      icon={<IconChart className="h-4 w-4" />}
                      hint="Mean of this period's attempts."
                    >
                      {stat(formatPercentage(snapshot?.quizzes.averagePercentage ?? null))}
                    </Figure>
                    <Figure
                      label="Best score"
                      icon={<IconStar className="h-4 w-4" />}
                      hint="Your strongest run."
                    >
                      {stat(formatPercentage(snapshot?.quizzes.bestPercentage ?? null))}
                    </Figure>
                    <Figure
                      label="Improvement"
                      icon={<IconQuiz className="h-4 w-4" />}
                      hint="First to latest, for quizzes retaken."
                    >
                      {stat(formatImprovement(snapshot?.quizzes.improvement ?? null))}
                    </Figure>
                  </dl>
                )}
              </div>
            )}

            <AppLink to="/analytics" className={`${cardLink} mt-6`}>
              View detailed analytics
              <IconArrowRight />
            </AppLink>
          </section>
        </div>
      </main>
    </>
  )
}
