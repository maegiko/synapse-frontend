import { apiRequest } from './client'
import { API_PATHS } from './config'
import type { QuizListItem, QuizListResponse } from './types'

/** Newest first, unpaginated. Items carry question previews, not answers. */
export async function list(): Promise<QuizListItem[]> {
  const { quizzes } = await apiRequest<QuizListResponse>(API_PATHS.quiz.list, {
    authenticated: true,
  })
  return quizzes ?? []
}
