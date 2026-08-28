import { apiRequest } from './client'
import { API_PATHS } from './config'
import type {
  CreatedQuestion,
  CreateQuestionRequest,
  PublicId,
  Quiz,
  QuizListItem,
  QuizListResponse,
  QuizScore,
  QuizScoreListResponse,
} from './types'

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

/** A quiz that is missing or belongs to another account answers 404. */
export async function get(quizId: PublicId): Promise<Quiz> {
  return apiRequest<Quiz>(API_PATHS.quiz.detail(quizId), { authenticated: true })
}

/** Also removes the quiz's questions, answers, and saved score history. */
export async function remove(quizId: PublicId): Promise<void> {
  await apiRequest<void>(API_PATHS.quiz.detail(quizId), {
    method: 'DELETE',
    authenticated: true,
  })
}

/**
 * Appends one hand-written question. The backend enforces four answers for
 * multiple choice, two for boolean, and exactly one correct answer either way.
 */
export async function addQuestion(
  quizId: PublicId,
  question: CreateQuestionRequest,
): Promise<CreatedQuestion> {
  return apiRequest<CreatedQuestion>(API_PATHS.quiz.questions(quizId), {
    method: 'POST',
    json: question,
    authenticated: true,
  })
}

/** Saved scores keep their own `totalQuestions` snapshot, so they are unaffected. */
export async function removeQuestion(quizId: PublicId, questionId: PublicId): Promise<void> {
  await apiRequest<void>(API_PATHS.quiz.question(quizId, questionId), {
    method: 'DELETE',
    authenticated: true,
  })
}

/** 1 through 5. There is no endpoint for clearing difficulty back to null. */
export async function setDifficulty(quizId: PublicId, difficulty: number): Promise<void> {
  await apiRequest<void>(API_PATHS.quiz.difficulty(quizId), {
    method: 'PUT',
    json: { difficulty },
    authenticated: true,
  })
}

/**
 * Records one attempt. `totalQuestions` is snapshotted server-side, so the
 * saved row stays meaningful even if the quiz is edited afterwards.
 */
export async function saveScore(quizId: PublicId, score: number): Promise<QuizScore> {
  return apiRequest<QuizScore>(API_PATHS.quiz.score(quizId), {
    method: 'POST',
    json: { score },
    authenticated: true,
  })
}

/** Newest first, unpaginated. */
export async function scores(quizId: PublicId): Promise<QuizScore[]> {
  const { scores: saved } = await apiRequest<QuizScoreListResponse>(
    API_PATHS.quiz.scores(quizId),
    { authenticated: true },
  )
  return saved ?? []
}
