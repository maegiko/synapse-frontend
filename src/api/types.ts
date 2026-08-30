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
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
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
}

export interface StreakResponse {
  currentStreak: number
  longestStreak: number
  activeToday: boolean
  lastActiveDate: LocalDateString | null
}

export type UpdateUserDetailsRequest =
  | { fullName: string; email?: string }
  | { fullName?: string; email: string }

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
}

export interface NoteListResponse {
  notes: NoteSummary[]
}

/** Generation responses carry no card IDs; fetch the deck when IDs are needed. */
export interface GeneratedFlashcard {
  title: string
  answer: string
}

export interface FlashcardGenerateResponse {
  deckId: PublicId
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
}

export interface FlashcardListResponse {
  flashcardDecks: FlashcardDeck[]
}

/** Ordered easiest-to-recall last; the backend owns what each one does to the schedule. */
export type ReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

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
}

export interface QuizListResponse {
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

export interface StudyGroupListResponse {
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
