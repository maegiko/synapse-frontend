import { useQueries, useQuery } from '@tanstack/react-query'
import { api, type UserDetails } from '../api'

export const queryKeys = {
  userDetails: ['user-details'] as const,
  streak: ['streak'] as const,
  notes: ['notes'] as const,
  note: (noteId: string) => ['notes', noteId] as const,
  flashcardDecks: ['flashcard-decks'] as const,
  flashcardDeck: (deckId: string) => ['flashcard-decks', deckId] as const,
  reviewQueue: ['flashcard-decks', 'review-queue'] as const,
  quizzes: ['quizzes'] as const,
  quiz: (quizId: string) => ['quizzes', quizId] as const,
  quizScores: (quizId: string) => ['quizzes', quizId, 'scores'] as const,
}

/**
 * The profile source of truth. JWT display claims go stale after an edit, so
 * this is fetched rather than decoded. `fallback` is what auth state already
 * holds, shown while the request runs; `0` marks it stale so it always refetches.
 */
export function useUserDetails(fallback?: UserDetails | null) {
  return useQuery({
    queryKey: queryKeys.userDetails,
    queryFn: api.user.getDetails,
    initialData: fallback ?? undefined,
    initialDataUpdatedAt: 0,
  })
}

export function useStreak() {
  return useQuery({ queryKey: queryKeys.streak, queryFn: api.user.getStreak })
}

export function useNotes() {
  return useQuery({ queryKey: queryKeys.notes, queryFn: api.notes.list })
}

/** One note's full summary. Seeded by the generation flow, so it rarely refetches. */
export function useNote(noteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.note(noteId ?? ''),
    queryFn: () => api.notes.get(noteId ?? ''),
    enabled: Boolean(noteId),
  })
}

export function useFlashcardDecks() {
  return useQuery({ queryKey: queryKeys.flashcardDecks, queryFn: api.flashcards.list })
}

/** One saved deck with its cards, in the backend's saved position order. */
export function useFlashcardDeck(deckId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.flashcardDeck(deckId ?? ''),
    queryFn: () => api.flashcards.get(deckId ?? ''),
    enabled: Boolean(deckId),
  })
}

/**
 * The decks due for review, in the backend's order: oldest due date first, and
 * that order is the recommendation, so it is never re-sorted here.
 */
export function useReviewQueue() {
  return useQuery({ queryKey: queryKeys.reviewQueue, queryFn: api.flashcards.reviewQueue })
}

export function useQuizzes() {
  return useQuery({ queryKey: queryKeys.quizzes, queryFn: api.quiz.list })
}

/**
 * One saved quiz with its questions and answers, in saved position order.
 * Seeded by the generation flow, so a freshly generated quiz needs no refetch.
 */
export function useQuiz(quizId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.quiz(quizId ?? ''),
    queryFn: () => api.quiz.get(quizId ?? ''),
    enabled: Boolean(quizId),
  })
}

/** Past attempts, newest first. Only quizzes keep a history. */
export function useQuizScores(quizId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.quizScores(quizId ?? ''),
    queryFn: () => api.quiz.scores(quizId ?? ''),
    enabled: Boolean(quizId),
  })
}

/**
 * Attempt history for every quiz at once. The API has no cross-quiz score
 * endpoint, so profile analytics fan out over the quiz list. Each request shares
 * its cache entry with that quiz's own scores page, and one failure only costs
 * the attempts of the quiz it belongs to.
 */
export function useAllQuizScores(quizIds: string[] | undefined) {
  return useQueries({
    queries: (quizIds ?? []).map((quizId) => ({
      queryKey: queryKeys.quizScores(quizId),
      queryFn: () => api.quiz.scores(quizId),
    })),
    combine: (results) => ({
      scores: results.flatMap((result) => result.data ?? []),
      /** Quizzes with at least one saved attempt, for "across N quizzes". */
      quizzesAttempted: results.filter((result) => (result.data?.length ?? 0) > 0).length,
      isPending: results.some((result) => result.isPending),
      failedCount: results.filter((result) => result.isError).length,
      retryFailed: () => {
        for (const result of results) {
          if (result.isError) void result.refetch()
        }
      },
    }),
  })
}
