/**
 * Request/response shapes mirroring FRONTEND_API.md section 4.
 * Property names match the backend JSON exactly; do not normalize them here.
 */

export type PublicId = string
export type LocalDateTimeString = string
export type LocalDateString = string

export interface ApiErrorBody {
  message: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  /**
   * IANA identifier the account's calendar days are counted in. Optional: the
   * backend falls back to `UTC` when it is absent or blank.
   */
  timeZone?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/**
 * What `POST /api/auth/register` answers with now. There is no token and no
 * refresh cookie: the account exists but cannot log in until the emailed link
 * is confirmed, so registration ends in a check-your-email state.
 */
export interface RegisterResponse {
  /** The normalized address the verification link was sent to. */
  email: string
  /** The backend's own instruction to check that inbox. */
  message: string
}

/** The raw token from the `token` query parameter of an emailed link. */
export interface VerifyEmailRequest {
  token: string
}

/**
 * `POST /api/auth/password/forgot`. It answers `204` for every address it is
 * given — unknown, unverified, live, and even one its email provider could not
 * be reached for — so there is no response body and nothing to branch on.
 */
export interface ForgotPasswordRequest {
  email: string
}

/**
 * `POST /api/auth/password/reset`. It answers `204`, mints no token and signs
 * nobody in. The backend has no confirmation field: the two typed passwords are
 * compared in the form.
 */
export interface ResetPasswordRequest {
  /** The raw token from the reset link's `token` query parameter. */
  token: string
  /** 8-64 characters, the same rule as registration and a password change. */
  newPassword: string
}

/**
 * The `200` body of `POST /api/auth/email/verify`. One endpoint confirms both
 * kinds of link and only one of them mints a session, so `kind` is what the
 * caller branches on. Never guess the kind from local auth state: somebody
 * signed into one account can open a registration link for another.
 */
export type VerifyEmailResponse = VerifiedRegistration | VerifiedEmailChange

/**
 * A registration link: the address is confirmed and the account is now signed
 * in. The refresh cookie was set by this call, replacing whatever session the
 * browser held before it.
 */
export interface VerifiedRegistration {
  kind: 'REGISTRATION'
  fullName: string
  email: string
  accessToken: string
}

/**
 * An email-change link: the account now uses `email`. No token and no cookie,
 * and any existing session carries on untouched.
 */
export interface VerifiedEmailChange {
  kind: 'EMAIL_CHANGE'
  email: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface ChangeEmailRequest {
  email: string
}

/**
 * The `202` body of `POST /api/user/email-change`. The account still uses its
 * old address: nothing changes until the link sent to `pendingEmail` is
 * confirmed. A `204` instead means the address was already the current one.
 */
export interface EmailChangeResponse {
  pendingEmail: string
  /** When the pending request lapses. UTC, like every other timestamp. */
  expiresAt: LocalDateTimeString
}

export interface AuthResponse {
  fullName: string
  email: string
  accessToken: string
}

export interface RefreshResponse {
  accessToken: string
}

export interface UserDetails {
  fullName: string
  email: string
  /**
   * Lifetime cards reviewed. `/api/user/details` always sends it, but the login
   * and register responses do not, so state seeded from those lacks it until the
   * profile is fetched. A deck review answers with the updated total.
   */
  totalFlashcardsReviewed?: number
  /**
   * The account's IANA time zone. Every calendar day the backend decides — streak
   * days, deck due dates — is counted in it, and every stored timestamp is read
   * back in it. Like `totalFlashcardsReviewed`, only `/api/user/details` sends it,
   * so state seeded from login or register lacks it until the profile is fetched.
   */
  timeZone?: string
}

export interface StreakResponse {
  currentStreak: number
  longestStreak: number
  activeToday: boolean
  lastActiveDate: LocalDateString | null
}

/** The only windows `GET /api/user/analytics` accepts; anything else is a 400. */
export type AnalyticsPeriodDays = 7 | 30 | 90 | 365

/** `from`/`to` are inclusive local dates, and `to` is always the user's today. */
export interface AnalyticsPeriod {
  days: AnalyticsPeriodDays
  from: LocalDateString
  to: LocalDateString
}

/**
 * The window's headline figures. `totalStudySeconds` sums only the durations
 * that were actually submitted, so it is study time *recorded* rather than time
 * elapsed, and `lifetimeCardsReviewed` is the running total deletions never
 * reduce — normally larger than the window's `cardsReviewed`.
 */
export interface AnalyticsOverview {
  totalStudySeconds: number
  activeDays: number
  inactiveDays: number
  /** Whole seconds, rounded, and `0` when there are no active days. */
  averageSecondsPerActiveDay: number
  cardsReviewed: number
  lifetimeCardsReviewed: number
  deckReviewSessions: number
  quizAttempts: number
  /** 0–100 over the window's attempts, or null when there were none. */
  averageQuizPercentage: number | null
}

/** Only the days that had a review; `dailyActivity` is the gap-filled series. */
export interface AnalyticsFlashcardDay {
  date: LocalDateString
  cardsReviewed: number
  reviewSessions: number
}

/** The window's reviews counted by the rating they were given. */
export interface AnalyticsRatingCounts {
  again: number
  hard: number
  good: number
  easy: number
}

/** Exactly seven entries starting at today, with the quiet days filled in. */
export interface AnalyticsDueForecastDay {
  date: LocalDateString
  deckCount: number
}

/**
 * Decks bucketed by their latest rating and current interval. A deck that has
 * never been reviewed is in none of the three, so these need not sum to the
 * deck count.
 */
export interface AnalyticsMastery {
  struggling: number
  learning: number
  strong: number
}

/**
 * `overdueDecks`, `dueTodayDecks`, `dueForecast`, and `mastery` describe the
 * library as it stands now rather than the window, so they do not move with
 * `period`.
 */
export interface AnalyticsFlashcards {
  cardsReviewed: number
  reviewSessions: number
  perDay: AnalyticsFlashcardDay[]
  ratings: AnalyticsRatingCounts
  /** A 0–1 ratio, not a percentage. Null when the window has no reviews. */
  retentionRate: number | null
  overdueDecks: number
  dueTodayDecks: number
  dueForecast: AnalyticsDueForecastDay[]
  mastery: AnalyticsMastery
}

/** Only the days that had an attempt; `dailyActivity` is the gap-filled series. */
export interface AnalyticsQuizDay {
  date: LocalDateString
  attempts: number
}

/**
 * One saved attempt inside the window. `totalQuestions` is the snapshot taken
 * when the score was saved, so `percentage` stays meaningful after an edit, and
 * `durationSeconds` is null for an attempt whose client did not time itself.
 */
export interface AnalyticsScoreHistoryItem {
  id: PublicId
  quizId: PublicId
  quizTitle: string
  score: number
  totalQuestions: number
  percentage: number
  durationSeconds: number | null
  createdAt: LocalDateTimeString
}

/**
 * `scoreHistory` is every attempt in the window, **oldest first** — the opposite
 * order to `GET /api/quiz/{quizId}/score/list`.
 */
export interface AnalyticsQuizzes {
  attempts: number
  distinctQuizzesAttempted: number
  perDay: AnalyticsQuizDay[]
  /** 0–100. Null when nothing scoreable was attempted. */
  averagePercentage: number | null
  bestPercentage: number | null
  /** Averaged over the attempts that reported a duration only. */
  averageDurationSeconds: number | null
  scoreHistory: AnalyticsScoreHistoryItem[]
  /**
   * Mean of `latest - first` percentage points across the quizzes attempted at
   * least twice in the window; positive is improvement. Null when no quiz was.
   */
  improvement: number | null
}

/**
 * `currentStreak` and `longestStreak` are the streak endpoint's own figures.
 * They count every qualifying activity, generation included, so they are not
 * limited to the window and can exceed `period.days`.
 */
export interface AnalyticsConsistency {
  currentStreak: number
  longestStreak: number
  activeDays: number
  inactiveDays: number
  /** A deck review and a quiz attempt each count as one session. */
  averageSessionsPerActiveDay: number
  /** Longest run of days inside the window with neither a review nor an attempt. */
  longestInactivityGap: number
}

/** One entry for every day of the window, oldest first, empty days included. */
export interface AnalyticsDailyActivity {
  date: LocalDateString
  studySeconds: number
  cardsReviewed: number
  deckReviews: number
  quizAttempts: number
}

/**
 * Counts and totals are `0` when nothing happened, but rates and averages with
 * nothing to average are `null` rather than `0` — a retention rate of zero and
 * no reviews at all are not the same thing. Render those as a no-data state.
 */
export interface AnalyticsResponse {
  period: AnalyticsPeriod
  overview: AnalyticsOverview
  flashcards: AnalyticsFlashcards
  quizzes: AnalyticsQuizzes
  consistency: AnalyticsConsistency
  /** Length always equals `period.days`, so a chart needs no gap filling. */
  dailyActivity: AnalyticsDailyActivity[]
}

/**
 * At least one property must be present. The email address is deliberately not
 * here: it moves only through `POST /api/user/email-change`, so a name or time
 * zone save can never depend on an email send succeeding.
 */
export type UpdateUserDetailsRequest =
  | { fullName: string; timeZone?: string }
  | { fullName?: string; timeZone: string }

/**
 * Every list endpoint answers one page. `page` and `size` echo the request,
 * `totalElements` counts everything the search matched rather than the page,
 * and `hasNext` is what a "Load more" control reads.
 */
export interface PageMetadata {
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

/**
 * The optional parameters every list endpoint takes. `query` is a partial,
 * case-insensitive match, trimmed server-side, and a blank one is no search.
 * `page` is zero-based and defaults to 0; `size` defaults to 20 and must be
 * 1 to 100.
 */
export interface ListParams {
  query?: string
  page?: number
  size?: number
}

export interface ConceptSummary {
  name: string
  explanation: string
}

export interface NoteSummary {
  id: PublicId
  title: string
  overview: string
  keypoints: string[]
  concepts: ConceptSummary[]
  importantTerms: string[]
  /** The study group holding this note, or null while it is ungrouped. */
  groupId: PublicId | null
  /** Pinned notes sort before unpinned ones in list responses. New notes are false. */
  pinned: boolean
}

export interface NoteListResponse extends PageMetadata {
  notes: NoteSummary[]
}

/**
 * At least one property must be present and non-null; only supplied values
 * change. The structured keypoints, concepts, and terms cannot be edited.
 * `pinned` pins or unpins the note, and a body carrying only `pinned` is valid,
 * so an edit that leaves it off never disturbs the pin state.
 */
export type UpdateNoteRequest =
  | { title: string; overview?: string; pinned?: boolean }
  | { title?: string; overview: string; pinned?: boolean }
  | { title?: string; overview?: string; pinned: boolean }

/** Generation responses carry no card IDs; fetch the deck when IDs are needed. */
export interface GeneratedFlashcard {
  title: string
  answer: string
}

export interface FlashcardGenerateResponse {
  deckId: PublicId
  /** Always false for a freshly generated deck. */
  pinned: boolean
  flashcards: GeneratedFlashcard[]
}

/** `title` is the flashcard *question*, both here and in generation responses. */
export interface SavedFlashcard {
  id: PublicId
  title: string
  answer: string
}

export interface FlashcardDeck {
  deckId: PublicId
  title: string
  flashcards: SavedFlashcard[]
  /** The study group holding this deck, or null while it is ungrouped. */
  groupId: PublicId | null
  /** Pinned decks sort before unpinned ones in list responses. New decks are false. */
  pinned: boolean
}

export interface FlashcardListResponse extends PageMetadata {
  flashcardDecks: FlashcardDeck[]
}

/** Ordered easiest-to-recall last; the backend owns what each one does to the schedule. */
export type ReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

/**
 * `rating` is required. `durationSeconds` is optional: omit it, or send null,
 * when the session was not timed — the review is saved with no duration rather
 * than a guessed one, and still counts as a session and an active day. It must
 * be a whole number of seconds within the API's allowed range.
 */
export interface ReviewDeckRequest {
  rating: ReviewRating
  durationSeconds?: number | null
}

/** The deck's new schedule, plus the user's updated lifetime review total. */
export interface ReviewDeckResponse {
  deckId: PublicId
  rating: ReviewRating
  intervalDays: number
  nextReviewDate: LocalDateString
  /** The cards the deck held at review time; the whole deck counts as one review. */
  cardsReviewed: number
  totalFlashcardsReviewed: number
}

/** Queue entries carry deck metadata only; the cards come from `flashcards.get`. */
export interface ReviewQueueDeck {
  deckId: PublicId
  title: string
  cardCount: number
  nextReviewDate: LocalDateString
  intervalDays: number
  reviewCount: number
  lastReviewedAt: LocalDateTimeString | null
  /** The most recent recall grade, or null until the deck has been reviewed. */
  lastRating: ReviewRating | null
}

export interface ReviewQueueResponse {
  decks: ReviewQueueDeck[]
}

export interface AddFlashcardRequest {
  question: string
  answer: string
}

/**
 * At least one property must be present; only supplied values change. A blank
 * `title` is rejected, and a body carrying only `pinned` is valid, so a rename
 * that leaves `pinned` off never disturbs the pin state.
 */
export interface UpdateDeckRequest {
  title?: string
  pinned?: boolean
}

/**
 * At least one property must be present and non-null; only supplied values
 * change. Both are trimmed and must be non-blank when supplied.
 */
export type UpdateFlashcardRequest =
  | { question: string; answer?: string }
  | { question?: string; answer: string }

/** Manual creation answers with `question`, unlike list and generation responses. */
export interface AddFlashcardResponse {
  id: PublicId
  question: string
  answer: string
  createdAt: LocalDateTimeString
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'BOOLEAN'

export interface QuizAnswer {
  id: PublicId
  text: string
  /** The backend discloses correctness; hide it until the UX should reveal it. */
  correct: boolean
  createdAt: LocalDateTimeString
}

export interface QuizQuestion {
  id: PublicId
  text: string
  questionType: QuestionType
  answers: QuizAnswer[]
  createdAt: LocalDateTimeString
}

export interface Quiz {
  id: PublicId
  title: string
  description: string | null
  questions: QuizQuestion[]
  /** 1 through 5, or null until it is set. Generated quizzes start null. */
  difficulty: number | null
  createdAt: LocalDateTimeString
  /** The study group holding this quiz, or null while it is ungrouped. */
  groupId: PublicId | null
  /** Pinned quizzes sort before unpinned ones in list responses. New quizzes are false. */
  pinned: boolean
}

/** List items carry question previews only: no answers and no questionType. */
export interface QuizQuestionPreview {
  id: PublicId
  text: string
  createdAt: LocalDateTimeString
}

export interface QuizListItem {
  id: PublicId
  title: string
  description: string | null
  questions: QuizQuestionPreview[]
  /** 1 through 5, or null until it is set. */
  difficulty: number | null
  createdAt: LocalDateTimeString
  /** The study group holding this quiz, or null while it is ungrouped. */
  groupId: PublicId | null
  /** Pinned quizzes sort before unpinned ones in list responses. */
  pinned: boolean
}

export interface QuizListResponse extends PageMetadata {
  quizzes: QuizListItem[]
}

/** Creation uses `answer`/`isCorrect`; a later quiz fetch calls them `text`/`correct`. */
export interface CreateQuestionAnswerRequest {
  answer: string
  isCorrect: boolean
}

export interface CreateQuestionRequest {
  question: string
  questionType: QuestionType
  answers: CreateQuestionAnswerRequest[]
}

/**
 * At least one property must be present and non-null; only supplied values
 * change. `title` is trimmed and must be non-blank; a blank `description` clears
 * it back to null. Difficulty is set through its own endpoint, not here.
 */
export type UpdateQuizRequest =
  | { title: string; description?: string | null; pinned?: boolean }
  | { title?: string; description: string | null; pinned?: boolean }
  | { title?: string; description?: string | null; pinned: boolean }

/**
 * At least one property must be present and non-null; only supplied values
 * change. When `answers` is present it is the complete replacement set: the old
 * answers are discarded and every answer ID changes, so the question or quiz
 * must be refetched afterwards. Changing `questionType` requires a matching
 * `answers` set (four for multiple choice, two for boolean), with exactly one
 * marked correct.
 */
export interface UpdateQuestionRequest {
  question?: string
  questionType?: QuestionType
  answers?: CreateQuestionAnswerRequest[]
}

/** Manual creation uses a different field vocabulary from later quiz fetches. */
export interface CreatedAnswer {
  id: PublicId
  answer: string
  isCorrect: boolean
}

export interface CreatedQuestion {
  id: PublicId
  question: string
  questionType: QuestionType
  answers: CreatedAnswer[]
  createdAt: LocalDateTimeString
}

/**
 * `score` cannot exceed the quiz's current question count. `durationSeconds`
 * follows the same rules as a deck review's: optional, whole seconds, and
 * within the API's allowed range. An untimed attempt still counts as an
 * attempt; it just contributes no study time.
 */
export interface SaveScoreRequest {
  score: number
  durationSeconds?: number | null
}

/** The only resource whose identifier is named `publicId` rather than `id`. */
export interface QuizScore {
  publicId: PublicId
  quizId: PublicId
  score: number
  /** Snapshot taken when the attempt was saved; use it as that attempt's denominator. */
  totalQuestions: number
  createdAt: LocalDateTimeString
}

export interface QuizScoreListResponse {
  scores: QuizScore[]
}

/**
 * A study group is a user-owned folder holding notes, decks, and quizzes at
 * once. Membership is single-valued: a resource is in zero or one group, so
 * adding one that already belongs elsewhere moves it rather than copying it.
 */
export interface StudyGroup {
  id: PublicId
  name: string
  description: string | null
  createdAt: LocalDateTimeString
}

/** List rows carry counts only; the contents come from the single-group route. */
export interface StudyGroupListItem {
  id: PublicId
  name: string
  description: string | null
  noteCount: number
  deckCount: number
  quizCount: number
  createdAt: LocalDateTimeString
}

export interface StudyGroupListResponse extends PageMetadata {
  groups: StudyGroupListItem[]
}

/**
 * Group content items are uniform: `id` and `title` for all three kinds,
 * including decks, which are `deckId` in their own endpoints. Do not reuse a
 * resource type here — map explicitly.
 */
export interface StudyGroupContentItem {
  id: PublicId
  title: string
  createdAt: LocalDateTimeString
  /** Pinned items sort before unpinned ones within each of the group's lists. */
  pinned: boolean
}

export interface StudyGroupDetail {
  id: PublicId
  name: string
  description: string | null
  notes: StudyGroupContentItem[]
  decks: StudyGroupContentItem[]
  quizzes: StudyGroupContentItem[]
  createdAt: LocalDateTimeString
}

export interface CreateGroupRequest {
  name: string
  /** Omitted, null, or blank all store null. */
  description?: string | null
}

/** At least one property must be present; only supplied values change. */
export type UpdateGroupRequest =
  | { name: string; description?: string | null }
  | { name?: string | null; description: string }

/** The three kinds of content a group can hold, as used in membership routes. */
export type GroupContentKind = 'notes' | 'decks' | 'quizzes'
