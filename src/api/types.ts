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

/** No token and no cookie: registration ends in a check-your-email state. */
export interface RegisterResponse {
  email: string
  message: string
}

/** The raw token from the `token` query parameter of an emailed link. */
export interface VerifyEmailRequest {
  token: string
}

/** Answers 204 for every address, so there is nothing to branch on. */
export interface ForgotPasswordRequest {
  email: string
}

/** The backend has no confirmation field; the two are matched in the form. */
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

/**
 * One endpoint confirms both kinds of link, so `kind` is what the caller branches
 * on. Never infer it from local auth state: somebody signed into one account can
 * open a registration link for another.
 */
export type VerifyEmailResponse = VerifiedRegistration | VerifiedEmailChange

/** The account is now signed in, replacing whatever session the browser held. */
export interface VerifiedRegistration {
  kind: 'REGISTRATION'
  fullName: string
  email: string
  accessToken: string
}

/** No token and no cookie; any existing session carries on untouched. */
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

/** The account keeps its old address until the link to `pendingEmail` is opened. */
export interface EmailChangeResponse {
  pendingEmail: string
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
  /** Absent from the login and register responses; only /details sends it. */
  totalFlashcardsReviewed?: number
  /** Absent from the login and register responses; only /details sends it. */
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
 * `totalStudySeconds` sums only submitted durations, so it is time recorded
 * rather than elapsed. `lifetimeCardsReviewed` is a running total deletions never
 * reduce, normally larger than the window's `cardsReviewed`.
 */
export interface AnalyticsOverview {
  totalStudySeconds: number
  activeDays: number
  inactiveDays: number
  averageSecondsPerActiveDay: number
  cardsReviewed: number
  lifetimeCardsReviewed: number
  deckReviewSessions: number
  quizAttempts: number
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

/** An unreviewed deck is in none of the three, so these need not sum to the total. */
export interface AnalyticsMastery {
  struggling: number
  learning: number
  strong: number
}

/** The due and mastery figures describe the library now, so they ignore `period`. */
export interface AnalyticsFlashcards {
  cardsReviewed: number
  reviewSessions: number
  perDay: AnalyticsFlashcardDay[]
  ratings: AnalyticsRatingCounts
  /** A 0-1 ratio, not a percentage. Null when the window has no reviews. */
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

/** `totalQuestions` is snapshotted at save time, so `percentage` survives an edit. */
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

/** `scoreHistory` is oldest first, the opposite order to the score list route. */
export interface AnalyticsQuizzes {
  attempts: number
  distinctQuizzesAttempted: number
  perDay: AnalyticsQuizDay[]
  averagePercentage: number | null
  bestPercentage: number | null
  averageDurationSeconds: number | null
  scoreHistory: AnalyticsScoreHistoryItem[]
  /** Mean percentage-point change across quizzes attempted twice or more. */
  improvement: number | null
}

/** The streak figures count every qualifying activity, so they can exceed `period.days`. */
export interface AnalyticsConsistency {
  currentStreak: number
  longestStreak: number
  activeDays: number
  inactiveDays: number
  averageSessionsPerActiveDay: number
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
 * Counts are 0 when nothing happened, but rates and averages with nothing to
 * average are null: a retention rate of zero and no reviews are not the same.
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
 * At least one property must be present. The email address is not one of them,
 * so a name or time zone save never depends on an email send succeeding.
 */
export type UpdateUserDetailsRequest =
  | { fullName: string; timeZone?: string }
  | { fullName?: string; timeZone: string }

/** `totalElements` counts everything the search matched, not the page. */
export interface PageMetadata {
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

/**
 * `query` is a partial, case-insensitive match. `page` is zero-based; `size`
 * defaults to 20 and must be 1 to 100.
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
  groupId: PublicId | null
  pinned: boolean
}

export interface NoteListResponse extends PageMetadata {
  notes: NoteSummary[]
}

/**
 * At least one property must be present. A body carrying only `pinned` is valid,
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
  groupId: PublicId | null
  pinned: boolean
}

export interface FlashcardListResponse extends PageMetadata {
  flashcardDecks: FlashcardDeck[]
}

/** Ordered easiest-to-recall last; the backend owns what each one does to the schedule. */
export type ReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

/**
 * `durationSeconds` is optional: an untimed run is saved with no duration rather
 * than a guessed one, and still counts as a session and an active day.
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
 * At least one property must be present. A body carrying only `pinned` is valid,
 * so a rename that leaves it off never disturbs the pin state.
 */
export interface UpdateDeckRequest {
  title?: string
  pinned?: boolean
}

/** At least one property must be present, and non-blank when supplied. */
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
  difficulty: number | null
  createdAt: LocalDateTimeString
  groupId: PublicId | null
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
  difficulty: number | null
  createdAt: LocalDateTimeString
  groupId: PublicId | null
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
 * At least one property must be present. A blank `description` clears it back to
 * null. Difficulty is set through its own endpoint, not here.
 */
export type UpdateQuizRequest =
  | { title: string; description?: string | null; pinned?: boolean }
  | { title?: string; description: string | null; pinned?: boolean }
  | { title?: string; description?: string | null; pinned: boolean }

/**
 * A supplied `answers` is the complete replacement set: the old answers are
 * discarded and every answer id changes, so the quiz must be refetched. A new
 * `questionType` needs a matching set, four or two, with exactly one correct.
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
 * follows the same rules as a deck review's.
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
  totalQuestions: number
  createdAt: LocalDateTimeString
}

export interface QuizScoreListResponse {
  scores: QuizScore[]
}

/**
 * A folder holding notes, decks and quizzes at once. Membership is
 * single-valued, so adding a resource that belongs elsewhere moves it.
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
 * `id` and `title` for all three kinds, decks included despite being `deckId` in
 * their own endpoints, so a resource type cannot be reused here.
 */
export interface StudyGroupContentItem {
  id: PublicId
  title: string
  createdAt: LocalDateTimeString
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
  description?: string | null
}

/** At least one property must be present; only supplied values change. */
export type UpdateGroupRequest =
  | { name: string; description?: string | null }
  | { name?: string | null; description: string }

/** The three kinds of content a group can hold, as used in membership routes. */
export type GroupContentKind = 'notes' | 'decks' | 'quizzes'
