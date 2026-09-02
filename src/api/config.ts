import { MAX_PAGE_SIZE, clampPage, clampPageSize, clampSearchQuery } from '../lib/validation'
import type { AnalyticsPeriodDays, ListParams } from './types'

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
    forgotPassword: '/api/auth/password/forgot',
    resetPassword: '/api/auth/password/reset',
    verifyEmail: '/api/auth/email/verify',
    resendVerification: '/api/auth/email/resend',
  },
  user: {
    details: '/api/user/details',
    emailChange: '/api/user/email-change',
    streak: '/api/user/streak',
    analytics: '/api/user/analytics',
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
    /** A fixed path, so it never collides with a deck id. */
    reviewQueue: '/api/flashcards/review',
    review: (deckId: string) => `/api/flashcards/${encodeURIComponent(deckId)}/review`,
    card: (deckId: string, cardId: string) =>
      `/api/flashcards/${encodeURIComponent(deckId)}/cards/${encodeURIComponent(cardId)}`,
  },
  groups: {
    create: '/api/groups',
    list: '/api/groups/list',
    detail: (groupId: string) => `/api/groups/${encodeURIComponent(groupId)}`,
    /** PUT adds or moves, DELETE clears. */
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

/** The largest `size` a list endpoint accepts. */
export const MAX_LIST_PAGE_SIZE = MAX_PAGE_SIZE

/** `period` is always explicit, so the response window matches the one shown. */
export function analyticsPath(period: AnalyticsPeriodDays): string {
  return `${API_PATHS.user.analytics}?period=${period}`
}

/**
 * Adds the optional search and paging parameters to a list path. Omitted values
 * are left off so the backend applies its own defaults, and every supplied one
 * is clamped to the bounds the backend enforces rather than spent on a 400.
 */
export function listPath(path: string, { query, page, size }: ListParams): string {
  const params = new URLSearchParams()
  const term = query ? clampSearchQuery(query) : ''
  if (term) params.set('query', term)
  if (page !== undefined) params.set('page', String(clampPage(page)))
  if (size !== undefined) params.set('size', String(clampPageSize(size)))

  const search = params.toString()
  return search ? `${path}?${search}` : path
}
