import { apiRequest } from './client'
import { API_PATHS } from './config'
import type { PublicId, Quiz, QuizListItem, QuizListResponse } from './types'

/** Newest first, unpaginated. Items carry question previews, not answers. */
export async function list(): Promise<QuizListItem[]> {
  const { quizzes } = await apiRequest<QuizListResponse>(API_PATHS.quiz.list, {
    authenticated: true,
  })
  return quizzes ?? []
}

/**
 * Synchronous AI call, so it belongs behind a loading state. Every generated
 * quiz has exactly ten questions and starts with no difficulty set.
 */
export async function generate(noteId: PublicId): Promise<Quiz> {
  return apiRequest<Quiz>(API_PATHS.quiz.generate, {
    method: 'POST',
    json: { noteId },
    authenticated: true,
  })
}
