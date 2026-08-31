import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query'
import { api, type UserDetails } from '../api'

export const queryKeys = {
  userDetails: ['user-details'] as const,
  streak: ['streak'] as const,
  notes: ['notes'] as const,
  notesSearch: (query: string) => ['notes', 'search', query] as const,
  note: (noteId: string) => ['notes', noteId] as const,
  flashcardDecks: ['flashcard-decks'] as const,
  flashcardDecksSearch: (query: string) => ['flashcard-decks', 'search', query] as const,
  flashcardDeck: (deckId: string) => ['flashcard-decks', deckId] as const,
  reviewQueue: ['flashcard-decks', 'review-queue'] as const,
  quizzes: ['quizzes'] as const,
  quizzesSearch: (query: string) => ['quizzes', 'search', query] as const,
  quiz: (quizId: string) => ['quizzes', quizId] as const,
  quizScores: (quizId: string) => ['quizzes', quizId, 'scores'] as const,
  groups: ['groups'] as const,
  groupsSearch: (query: string) => ['groups', 'search', query] as const,
  group: (groupId: string) => ['groups', groupId] as const,
}

/**
 * What the four searchable list screens share. A screen holds one page at a
 * time and appends the next on demand, so the term belongs in the key: a new
 * term is a different query rather than a later answer to the current one, and
 * a slow reply to an abandoned term can never land on top of the live one.
 *
 * `staleTime: 0` overrides the shared 30 second window on purpose. These are the
 * indexes a user returns to straight after creating or deleting something on
 * another screen, and the list they come back to has to be the current one.
 */
const SEARCH_LIST_OPTIONS: { initialPageParam: number; staleTime: number } = {
  initialPageParam: 0,
  staleTime: 0,
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

/** Every note at once, for the counts, recents, and pickers built over the whole set. */
export function useNotes() {
  return useQuery({ queryKey: queryKeys.notes, queryFn: api.notes.listAll })
}

/** The library's notes section: one page per request, filtered by a title search. */
export function useNotesSearch(query: string) {
  return useInfiniteQuery({
    ...SEARCH_LIST_OPTIONS,
    queryKey: queryKeys.notesSearch(query),
    queryFn: ({ pageParam }) => api.notes.list({ query, page: pageParam }),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  })
}

/** One note's full summary. Seeded by the generation flow, so it rarely refetches. */
export function useNote(noteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.note(noteId ?? ''),
    queryFn: () => api.notes.get(noteId ?? ''),
    enabled: Boolean(noteId),
  })
}

/** Every deck at once, for the counts, recents, and pickers built over the whole set. */
export function useFlashcardDecks() {
  return useQuery({ queryKey: queryKeys.flashcardDecks, queryFn: api.flashcards.listAll })
}

/** The library's decks section: one page per request, filtered by a deck title search. */
export function useFlashcardDecksSearch(query: string) {
  return useInfiniteQuery({
    ...SEARCH_LIST_OPTIONS,
    queryKey: queryKeys.flashcardDecksSearch(query),
    queryFn: ({ pageParam }) => api.flashcards.list({ query, page: pageParam }),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  })
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

/** Every quiz at once, for the counts, recents, and analytics built over the whole set. */
export function useQuizzes() {
  return useQuery({ queryKey: queryKeys.quizzes, queryFn: api.quiz.listAll })
}

/** The library's quizzes section: one page per request, filtered by a title search. */
export function useQuizzesSearch(query: string) {
  return useInfiniteQuery({
    ...SEARCH_LIST_OPTIONS,
    queryKey: queryKeys.quizzesSearch(query),
    queryFn: ({ pageParam }) => api.quiz.list({ query, page: pageParam }),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  })
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

/**
 * Every study group, newest first, with the content counts the folder cards
 * read from. The contents themselves come from `useGroup`.
 */
export function useGroups() {
  return useQuery({ queryKey: queryKeys.groups, queryFn: api.groups.listAll })
}

/** The groups page's own grid: one page per request, filtered by a group name search. */
export function useGroupsSearch(query: string) {
  return useInfiniteQuery({
    ...SEARCH_LIST_OPTIONS,
    queryKey: queryKeys.groupsSearch(query),
    queryFn: ({ pageParam }) => api.groups.list({ query, page: pageParam }),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  })
}

/**
 * One group with its notes, decks, and quizzes. Content items carry `id` and
 * `title` for all three kinds — decks included — so they are their own type
 * rather than a `FlashcardDeck`.
 */
export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.group(groupId ?? ''),
    queryFn: () => api.groups.get(groupId ?? ''),
    enabled: Boolean(groupId),
  })
}
