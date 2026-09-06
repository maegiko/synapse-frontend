import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  api,
  type ChangePasswordRequest,
  type EmailChangeResponse,
  type UpdateUserDetailsRequest,
  type UserDetails,
} from '../api'
import { AppHeader } from '../components/AppHeader'
import { AuthDivider, GoogleSignInButton } from '../components/GoogleSignInButton'
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
  btnDangerGhostSm,
  btnGhostSm,
  btnPrimaryDisabled,
  btnPrimarySm,
  cardLink,
  shell,
  successAlert,
} from '../components/ui'
import { useAuth } from '../auth/useAuth'
import {
  isStatus,
  retryAfterSeconds,
  toEmailSendMessage,
  toFormMessage,
  toReasonMessage,
} from '../lib/apiErrors'
import { googleLinkMessage } from '../lib/googleErrors'
import { googleSignInEnabled } from '../lib/googleIdentity'
import { useProductAnalytics } from '../lib/productAnalytics'
import { useCooldown } from '../lib/useCooldown'
import { DASHBOARD_BACK } from '../lib/backTrail'
import { formatCalendarDate, formatDateTime } from '../lib/formatDate'
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
  validateTimeZone,
} from '../lib/validation'

function Bar() {
  return (
    <span
      className="inline-block h-5 w-12 animate-pulse rounded-full bg-surface-alt align-middle"
      aria-hidden="true"
    />
  )
}

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
  timeZone?: string
}

interface PasswordErrors {
  currentPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

type Panel = 'summary' | 'details' | 'email' | 'password' | 'google'

type PerfTab = 'flashcards' | 'quizzes'
const PERF_TABS: { id: PerfTab; label: string; icon: ReactNode }[] = [
  { id: 'flashcards', label: 'Flashcards', icon: <IconDeck className="h-4 w-4" /> },
  { id: 'quizzes', label: 'Quizzes', icon: <IconQuiz className="h-4 w-4" /> },
]

/** The window the profile's compact snapshot reports on. The full page can widen it. */
const SNAPSHOT_PERIOD = 30

/**
 * Account details plus a read-only view of how the study is going. The library
 * counts come from the list endpoints; the performance snapshot is aggregated
 * server-side by `GET /api/user/analytics`.
 */
export function ProfilePage() {
  const { user, setUserDetails, logout, refreshUser } = useAuth()
  const capture = useProductAnalytics()
  const details = useUserDetails(user)
  const streak = useStreak()
  const notes = useNotes()
  const decks = useFlashcardDecks()
  const quizzes = useQuizzes()
  const analytics = useAnalytics(SNAPSHOT_PERIOD)

  const [panel, setPanel] = useState<Panel>('summary')
  const [perfTab, setPerfTab] = useState<PerfTab>('flashcards')
  const [fullName, setFullName] = useState('')
  const [timeZoneField, setTimeZoneField] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const [newEmail, setNewEmail] = useState('')
  const [emailFieldError, setEmailFieldError] = useState('')
  const [emailFormError, setEmailFormError] = useState('')
  /**
   * The address a confirmation link has gone to, or null. Only ever pending: the
   * account keeps its current address until that link is opened.
   */
  const [pendingChange, setPendingChange] = useState<EmailChangeResponse | null>(null)
  const [emailUnchanged, setEmailUnchanged] = useState(false)
  const emailCooldown = useCooldown()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})
  const [passwordFormError, setPasswordFormError] = useState('')

  const profile = details.data
  const timeZone = useUserTimeZone()
  const location = timeZoneLocation(timeZone)

  const [googlePassword, setGooglePassword] = useState('')
  const [googlePasswordError, setGooglePasswordError] = useState('')
  const [googleFormError, setGoogleFormError] = useState('')
  const [googleMessage, setGoogleMessage] = useState('')

  function startManagingGoogle() {
    setGooglePassword('')
    setGooglePasswordError('')
    setGoogleFormError('')
    setGoogleMessage('')
    setSavedMessage('')
    setPanel('google')
  }

  function startEditing() {
    if (!profile) return
    setFullName(profile.fullName)
    setTimeZoneField(timeZone)
    setFieldErrors({})
    setFormError('')
    setSavedMessage('')
    setPanel('details')
  }

  function startChangingEmail() {
    setNewEmail('')
    setEmailFieldError('')
    setEmailFormError('')
    setPendingChange(null)
    setEmailUnchanged(false)
    setSavedMessage('')
    setPanel('email')
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
    setEmailFieldError('')
    setEmailFormError('')
    setPasswordErrors({})
    setPasswordFormError('')
    setGooglePasswordError('')
    setGoogleFormError('')
  }

  const save = useMutation({
    mutationFn: (payload: UpdateUserDetailsRequest) => api.user.updateDetails(payload),
    onSuccess: (updated: UserDetails) => {
      queryClient.setQueryData(queryKeys.userDetails, updated)
      setUserDetails(updated)

      if (timeZoneChanged) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.streak })
        void queryClient.invalidateQueries({ queryKey: queryKeys.reviewQueue })
        void queryClient.invalidateQueries({ queryKey: queryKeys.analytics })
      }
      setPanel('summary')
      setFieldErrors({})
      setFormError('')
      setSavedMessage('Your details have been saved.')
    },
    onError: (error) => {
      setFieldErrors({})
      setFormError(toFormMessage(error))
    },
  })

  const changeEmail = useMutation({
    mutationFn: (address: string) => api.user.requestEmailChange(address),
    onSuccess: (pending: EmailChangeResponse | null) => {
      setEmailFieldError('')
      setEmailFormError('')
      setPendingChange(pending)
      setEmailUnchanged(pending === null)
    },
    onError: (error) => {
      emailCooldown.start(retryAfterSeconds(error))
      if (isStatus(error, 409)) {
        setEmailFieldError('Another account already uses that email address.')
        setEmailFormError('')
        return
      }
      if (isStatus(error, 400)) {
        setEmailFieldError('Enter a valid email address.')
        setEmailFormError('')
        return
      }
      setEmailFieldError('')
      setEmailFormError(toEmailSendMessage(error))
    },
  })

  const changePassword = useMutation({
    mutationFn: (payload: ChangePasswordRequest) => api.auth.changePassword(payload),
    onSuccess: () => {
      void logout()
    },
    onError: (error) => {
      // Here a 401 is a wrong current password, not an expired access token.
      if (isStatus(error, 401)) {
        setPasswordErrors({ currentPassword: 'That password is not correct.' })
        setPasswordFormError('')
        return
      }
      setPasswordErrors({})
      setPasswordFormError(toFormMessage(error))
    },
  })

  const linkGoogle = useMutation({
    mutationFn: (credential: string) =>
      api.user.linkGoogle({ credential, currentPassword: googlePassword }),
    onSuccess: async () => {
      setGooglePassword('')
      setGoogleMessage('Google is now linked. You can sign in either way from now on.')
      capture('google_linked')
      await refreshUser()
    },
    onError: (error) => {
      // Here a 401 is a wrong password or an unusable credential, not an expired token.
      if (isStatus(error, 401)) {
        setGooglePasswordError('That password is not correct, or the Google sign-in failed.')
        setGoogleFormError('')
        return
      }
      setGooglePasswordError('')
      setGoogleFormError(googleLinkMessage(error))
    },
  })

  const unlinkGoogle = useMutation({
    mutationFn: () => api.user.unlinkGoogle({ currentPassword: googlePassword }),
    // Unlinking revokes every refresh token, so this session is already finished:
    // a session obtained through a Google Account that has since been compromised
    // must not outlive the link. Same handling as a password change.
    onSuccess: () => {
      setGooglePassword('')
      // Captured before the sign-out, which unmounts this page.
      capture('google_unlinked')
      void logout()
    },
    onError: (error) => {
      if (isStatus(error, 401)) {
        setGooglePasswordError('That password is not correct.')
        setGoogleFormError('')
        return
      }
      setGooglePasswordError('')
      setGoogleFormError(googleLinkMessage(error))
    },
  })

  /**
   * A Google-only account has no current password to check, so the change form
   * cannot serve it. The forgotten-password flow can: the account is verified, so
   * it is sent a link like any other.
   */
  const sendPasswordSetup = useMutation({
    mutationFn: (email: string) => api.auth.forgotPassword(email),
    onError: (error) => setPasswordFormError(toFormMessage(error)),
  })

  const googleBusy = linkGoogle.isPending || unlinkGoogle.isPending

  function handleGoogleCredential(credential: string) {
    if (!googlePassword) {
      setGooglePasswordError('Enter your current password first.')
      return Promise.resolve()
    }
    setGooglePasswordError('')
    setGoogleFormError('')
    setGoogleMessage('')
    return linkGoogle.mutateAsync(credential).catch(() => undefined)
  }

  function handleUnlinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (googleBusy) return

    if (!googlePassword) {
      setGooglePasswordError('Enter your current password.')
      return
    }
    setGooglePasswordError('')
    setGoogleFormError('')
    setGoogleMessage('')
    unlinkGoogle.mutate()
  }

  const trimmedName = fullName.trim()
  const nameChanged = Boolean(profile) && trimmedName !== profile?.fullName
  const timeZoneChanged = Boolean(profile) && Boolean(timeZoneField) && timeZoneField !== timeZone
  const hasChanges = nameChanged || timeZoneChanged

  const passwordFilled =
    currentPassword.length > 0 && newPassword.length > 0 && confirmNewPassword.length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (save.isPending || !profile || !hasChanges) return

    const errors: FieldErrors = {
      fullName: nameChanged ? (validateFullName(fullName) ?? undefined) : undefined,
      timeZone: timeZoneChanged ? (validateTimeZone(timeZoneField) ?? undefined) : undefined,
    }
    setFieldErrors(errors)
    setFormError('')
    if (Object.values(errors).some(Boolean)) return

    const payload = {
      ...(nameChanged ? { fullName: trimmedName } : {}),
      ...(timeZoneChanged ? { timeZone: timeZoneField } : {}),
    } as UpdateUserDetailsRequest

    save.mutate(payload)
  }

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (changeEmail.isPending || emailCooldown.remaining > 0) return

    const invalid = validateEmail(newEmail)
    setEmailFieldError(invalid ?? '')
    setEmailFormError('')
    setPendingChange(null)
    setEmailUnchanged(false)
    if (invalid) return

    changeEmail.mutate(newEmail)
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

  function count(query: { isPending: boolean; isError: boolean }, value: number): ReactNode {
    if (query.isPending) return <Bar />
    if (query.isError) {
      return (
        <span className="text-base text-text-muted" aria-label="Not available">
          &ndash;
        </span>
      )
    }
    return value
  }

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

        <section
          className="mt-8 rounded-md border border-border bg-surface px-6 py-6 shadow-sm sm:px-8 sm:py-7"
        >
          {details.isError && (
            <div className={profile ? 'mb-6' : ''}>
              <FormAlert
                message={
                  profile
                    ? `These details may be out of date. ${toReasonMessage(details.error)}`
                    : `We could not load your details. ${toReasonMessage(details.error)}`
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
            <div className="app-content-in">
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
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnGhostSm} onClick={startEditing}>
                    Edit profile
                  </button>
                  <button type="button" className={btnGhostSm} onClick={startChangingEmail}>
                    Change email
                  </button>
                  <button type="button" className={btnGhostSm} onClick={startChangingPassword}>
                    {profile.hasPassword === false ? 'Set a password' : 'Change password'}
                  </button>
                  {googleSignInEnabled && (
                    <button type="button" className={btnGhostSm} onClick={startManagingGoogle}>
                      {profile.googleLinked ? 'Manage Google' : 'Link Google'}
                    </button>
                  )}
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
            </div>
          )}

          {profile && panel === 'details' && (
            <form className="app-content-in grid gap-5" onSubmit={handleSubmit} noValidate>
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

              <SelectField
                label="Time zone"
                name="timeZone"
                hint="Streak days, due dates, and every time shown are counted here. It stays put when you travel."
                value={timeZoneField}
                options={timeZoneOptions(timeZone)}
                error={fieldErrors.timeZone}
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
                    Change your name or time zone to save.
                  </span>
                )}
              </div>
            </form>
          )}

          {profile && panel === 'email' && (
            <div className="app-content-in grid gap-5">
              <div>
                <h2 className="text-base font-medium">Change your email address</h2>
                <p className="mt-1 text-sm text-text-muted">
                  We send a confirmation link to the new address. You keep logging in with{' '}
                  <span className="font-bold text-text">{profile.email}</span> until you open it.
                </p>
              </div>

              {pendingChange ? (
                <div className="grid gap-4" role="status">
                  <p className={successAlert}>
                    <IconCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                    <span>
                      Confirmation link sent to{' '}
                      <span className="wrap-break-word">{pendingChange.pendingEmail}</span>.
                    </span>
                  </p>
                  <p className="text-sm text-text-muted">
                    Open that link to finish the change. It expires on{' '}
                    {formatDateTime(pendingChange.expiresAt, timeZone)}, and asking again replaces
                    it with a newer one. Until then {profile.email} stays the address on your
                    account.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className={btnPrimarySm} onClick={closePanel}>
                      Done
                    </button>
                    <button
                      type="button"
                      className={btnGhostSm}
                      onClick={() => {
                        setPendingChange(null)
                        setNewEmail('')
                      }}
                    >
                      Use a different address
                    </button>
                  </div>
                </div>
              ) : (
                <form className="grid gap-5" onSubmit={handleEmailSubmit} noValidate>
                  {emailFormError && <FormAlert message={emailFormError} />}

                  {emailUnchanged && (
                    <p className={successAlert} role="status">
                      <IconCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                      <span>That is already the email address on your account.</span>
                    </p>
                  )}

                  <TextField
                    label="New email address"
                    type="email"
                    name="newEmail"
                    autoComplete="email"
                    placeholder="you@university.edu"
                    hint="Check that you can open mail sent to this address before you send the link."
                    value={newEmail}
                    error={emailFieldError || undefined}
                    disabled={changeEmail.isPending}
                    onChange={(event) => {
                      setNewEmail(event.target.value)
                      setEmailUnchanged(false)
                    }}
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className={`${btnPrimarySm} ${btnPrimaryDisabled}`}
                      disabled={
                        changeEmail.isPending || !newEmail.trim() || emailCooldown.remaining > 0
                      }
                    >
                      {changeEmail.isPending ? 'Sending…' : 'Send confirmation link'}
                    </button>
                    <button
                      type="button"
                      className={btnGhostSm}
                      onClick={closePanel}
                      disabled={changeEmail.isPending}
                    >
                      Cancel
                    </button>
                    <span className="text-xs text-text-muted" aria-live="polite">
                      {emailCooldown.remaining > 0
                        ? `You can try again in ${emailCooldown.remaining}s.`
                        : ''}
                    </span>
                  </div>
                </form>
              )}
            </div>
          )}

          {profile && panel === 'password' && profile.hasPassword === false && (
            <div className="app-content-in grid gap-5">
              <div>
                <h2 className="text-base font-medium">Set a password</h2>
                <p className="mt-1 text-sm text-text-muted">
                  This account signs in with Google and has never had a password. We can email a
                  link to <span className="font-semibold text-text">{profile.email}</span> that lets
                  you set one. Google stays linked, and afterwards either way signs you in.
                </p>
              </div>

              {passwordFormError && <FormAlert message={passwordFormError} />}

              {sendPasswordSetup.isSuccess ? (
                <div className="grid gap-4" role="status">
                  <p className={successAlert}>
                    <IconCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                    <span>
                      If that address has an account, a link is on its way. It expires in 30
                      minutes.
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className={btnPrimarySm} onClick={closePanel}>
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className={`${btnPrimarySm} ${btnPrimaryDisabled}`}
                    disabled={sendPasswordSetup.isPending}
                    onClick={() => {
                      setPasswordFormError('')
                      sendPasswordSetup.mutate(profile.email)
                    }}
                  >
                    {sendPasswordSetup.isPending ? 'Sending…' : 'Email me a link'}
                  </button>
                  <button type="button" className={btnGhostSm} onClick={closePanel}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {profile && panel === 'password' && profile.hasPassword !== false && (
            changePassword.isSuccess ? (
              <div className="app-content-in grid gap-2" role="status">
                <h2 className="text-base font-medium">Password changed</h2>
                <p className="text-sm text-text-muted">
                  Signing you out. Log in again with your new password.
                </p>
              </div>
            ) : (
              <form className="app-content-in grid gap-5" onSubmit={handlePasswordSubmit} noValidate>
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

          {profile && panel === 'google' && (
            <div className="app-content-in grid gap-5">
              <div>
                <h2 className="text-base font-medium">
                  {profile.googleLinked ? 'Google is linked' : 'Link your Google Account'}
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  {profile.googleLinked
                    ? 'You can sign in to this account with Google or with your password. Unlinking removes the Google option and signs you out on every device; your account and everything in it are untouched.'
                    : 'Link a Google Account and you can sign in either way. It does not have to use the same address as this account, and neither address is copied onto the other.'}
                </p>
              </div>

              {googleMessage && (
                <p className={successAlert} role="status">
                  {googleMessage}
                </p>
              )}
              {googleFormError && <FormAlert message={googleFormError} />}

              {googleMessage ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className={btnPrimarySm} onClick={closePanel}>
                    Done
                  </button>
                </div>
              ) : profile.googleLinked && !profile.hasPassword ? (
                <div className="grid gap-4">
                  <p className="text-sm text-text-muted">
                    Google is the only way into this account, so it cannot be unlinked yet. Set a
                    password first and the option appears here.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className={btnPrimarySm} onClick={startChangingPassword}>
                      Set a password
                    </button>
                    <button type="button" className={btnGhostSm} onClick={closePanel}>
                      Back to profile
                    </button>
                  </div>
                </div>
              ) : (
                <form className="grid gap-5" onSubmit={handleUnlinkSubmit} noValidate>
                  <TextField
                    label="Current password"
                    type="password"
                    name="currentPassword"
                    autoComplete="current-password"
                    hint={
                      profile.googleLinked
                        ? 'Unlinking signs you out everywhere, so you will need to log in again.'
                        : 'Confirms it is you before a second way into the account is added.'
                    }
                    value={googlePassword}
                    error={googlePasswordError}
                    disabled={googleBusy}
                    onChange={(event) => setGooglePassword(event.target.value)}
                  />

                  {profile.googleLinked ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        className={btnDangerGhostSm}
                        disabled={googleBusy || !googlePassword}
                      >
                        {unlinkGoogle.isPending ? 'Unlinking…' : 'Unlink Google'}
                      </button>
                      <button
                        type="button"
                        className={btnGhostSm}
                        onClick={closePanel}
                        disabled={googleBusy}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <AuthDivider label="then" />
                      <div className="max-w-100">
                        <GoogleSignInButton
                          onCredential={handleGoogleCredential}
                          label="Sign in with Google"
                          busy={googleBusy}
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          className={btnGhostSm}
                          onClick={closePanel}
                          disabled={googleBusy}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </div>
          )}
        </section>

        <section className="mt-12 border-t border-border/60 pt-8 lg:mx-12">
          <h2 className="text-base font-medium">Learning activity</h2>
          <p className="mt-1 text-sm text-text-muted">How consistent your studying has been.</p>

          {streakUnavailable ? (
            <div className="mt-5 grid justify-items-start gap-2.5">
              <p className="text-sm text-text-muted">
                We could not load your streak. {toReasonMessage(streak.error)}
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
                  We could not load your performance. {toReasonMessage(analytics.error)}
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
