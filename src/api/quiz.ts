import { apiRequest } from './client'
import { API_PATHS, MAX_LIST_PAGE_SIZE, listPath } from './config'
import { toDurationSeconds } from './duration'
import type {
  CreatedQuestion,
  CreateQuestionRequest,
  ListParams,
  PublicId,
  Quiz,
  QuizListItem,
  QuizListResponse,
  QuizScore,
  QuizScoreListResponse,
  SaveScoreRequest,
  UpdateQuestionRequest,
  UpdateQuizRequest,
} from './types'

/**
 * One page of quizzes, newest first. Items carry question previews, not
 * answers. `query` searches quiz titles, not descriptions or question text.
 */
export async function list(params: ListParams = {}): Promise<QuizListResponse> {
  return apiRequest<QuizListResponse>(listPath(API_PATHS.quiz.list, params), {
    authenticated: true,
  })
}

/**
 * Every quiz, by walking the pages. For the screens that count or pick across
 * the whole library rather than showing a paged list of it.
 */
export async function listAll(): Promise<QuizListItem[]> {
  const all: QuizListItem[] = []
  for (let page = 0; ; page++) {
    const body = await list({ page, size: MAX_LIST_PAGE_SIZE })
    all.push(...(body.quizzes ?? []))
    if (!body.hasNext) return all
  }
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

/**
 * Edits the quiz title and/or description. A blank description clears it back to
 * null. This does not touch difficulty. Returns the complete updated quiz, with
 * its questions and answers in position order.
 */
export async function update(quizId: PublicId, body: UpdateQuizRequest): Promise<Quiz> {
  return apiRequest<Quiz>(API_PATHS.quiz.detail(quizId), {
    method: 'PATCH',
    json: body,
    authenticated: true,
  })
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

/**
 * Edits a question's text, type, and/or answers. A supplied `answers` array is
 * the complete replacement set: the old answers are discarded and answer IDs
 * change, so the quiz is refetched afterwards. The response uses the creation
 * vocabulary (`question`, `answer`, `isCorrect`), not a quiz fetch's.
 */
export async function updateQuestion(
  quizId: PublicId,
  questionId: PublicId,
  body: UpdateQuestionRequest,
): Promise<CreatedQuestion> {
  return apiRequest<CreatedQuestion>(API_PATHS.quiz.question(quizId, questionId), {
    method: 'PATCH',
    json: body,
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
 *
 * `durationSeconds` is how long the attempt took, with the same optional
 * behaviour as a deck review's: an untimed attempt still counts as an attempt
 * and simply contributes no study time.
 */
export async function saveScore(
  quizId: PublicId,
  score: number,
  durationSeconds?: number | null,
): Promise<QuizScore> {
  const body: SaveScoreRequest = { score }
  const duration = toDurationSeconds(durationSeconds)
  if (duration !== undefined) body.durationSeconds = duration

  return apiRequest<QuizScore>(API_PATHS.quiz.score(quizId), {
    method: 'POST',
    json: body,
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
