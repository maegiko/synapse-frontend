/**
 * The single place the backend location and every endpoint path is declared.
 * Point the app at another environment by setting VITE_API_BASE_URL; nothing
 * else in the codebase should ever hard-code a URL.
 */

const DEFAULT_API_BASE_URL = 'http://localhost:8080'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/+$/, '')

export const API_PATHS = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    password: '/api/auth/password',
  },
  user: {
    details: '/api/user/details',
    streak: '/api/user/streak',
  },
  notes: {
    list: '/api/notes/list',
    summarise: '/api/notes/summarise',
    detail: (noteId: string) => `/api/notes/${encodeURIComponent(noteId)}`,
  },
  flashcards: {
    list: '/api/flashcards/list',
    generate: '/api/flashcards/generate',
    detail: (deckId: string) => `/api/flashcards/${encodeURIComponent(deckId)}`,
    /** The decks due today. A fixed path, so it never collides with a deck ID. */
    reviewQueue: '/api/flashcards/review',
    review: (deckId: string) => `/api/flashcards/${encodeURIComponent(deckId)}/review`,
    card: (deckId: string, cardId: string) =>
      `/api/flashcards/${encodeURIComponent(deckId)}/cards/${encodeURIComponent(cardId)}`,
  },
  groups: {
    create: '/api/groups',
    list: '/api/groups/list',
    /** Also the PATCH and DELETE target for one group. */
    detail: (groupId: string) => `/api/groups/${encodeURIComponent(groupId)}`,
    /**
     * Membership. `PUT` adds or moves, `DELETE` clears; both answer 204. The
     * path segment is the content kind exactly as the backend names it.
     */
    content: (groupId: string, kind: 'notes' | 'decks' | 'quizzes', resourceId: string) =>
      `/api/groups/${encodeURIComponent(groupId)}/${kind}/${encodeURIComponent(resourceId)}`,
  },
  quiz: {
    list: '/api/quiz/list',
    generate: '/api/quiz/generate',
    detail: (quizId: string) => `/api/quiz/${encodeURIComponent(quizId)}`,
    questions: (quizId: string) => `/api/quiz/${encodeURIComponent(quizId)}/questions`,
    question: (quizId: string, questionId: string) =>
      `/api/quiz/${encodeURIComponent(quizId)}/questions/${encodeURIComponent(questionId)}`,
    difficulty: (quizId: string) => `/api/quiz/${encodeURIComponent(quizId)}/difficulty`,
    score: (quizId: string) => `/api/quiz/${encodeURIComponent(quizId)}/score`,
    scores: (quizId: string) => `/api/quiz/${encodeURIComponent(quizId)}/score/list`,
  },
} as const
