import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api, type AnalyticsPeriodDays, type UserDetails } from '../api'
import { DEFAULT_TIME_ZONE } from './timeZone'

export const queryKeys = {
  userDetails: ['user-details'] as const,
  streak: ['streak'] as const,
  analytics: ['analytics'] as const,
  analyticsPeriod: (period: AnalyticsPeriodDays) => ['analytics', period] as const,
  notes: ['notes'] as const,
  notesSearches: ['notes', 'search'] as const,
  notesSearch: (query: string) => ['notes', 'search', query] as const,
  note: (noteId: string) => ['notes', noteId] as const,
  flashcardDecks: ['flashcard-decks'] as const,
  flashcardDecksSearches: ['flashcard-decks', 'search'] as const,
  flashcardDecksSearch: (query: string) => ['flashcard-decks', 'search', query] as const,
  flashcardDeck: (deckId: string) => ['flashcard-decks', deckId] as const,
  reviewQueue: ['flashcard-decks', 'review-queue'] as const,
  quizzes: ['quizzes'] as const,
  quizzesSearches: ['quizzes', 'search'] as const,
  quizzesSearch: (query: string) => ['quizzes', 'search', query] as const,
  quiz: (quizId: string) => ['quizzes', quizId] as const,
  quizScores: (quizId: string) => ['quizzes', quizId, 'scores'] as const,
  groups: ['groups'] as const,
  groupsSearch: (query: string) => ['groups', 'search', query] as const,
  group: (groupId: string) => ['groups', groupId] as const,
}

/**
 * What the four searchable list screens share. The term belongs in the key, so a
 * new term is a different query and a slow reply to an abandoned one can never
 * land on the live list. `staleTime: 0` overrides the shared 30 second window:
 * these are the indexes a user returns to right after creating something.
 */
const SEARCH_LIST_OPTIONS: { initialPageParam: number; staleTime: number } = {
  initialPageParam: 0,
  staleTime: 0,
}

/**
 * The profile source of truth; JWT display claims go stale after an edit.
 * `fallback` is what auth state already holds, shown while the request runs.
 */
export function useUserDetails(fallback?: UserDetails | null) {
  return useQuery({
    queryKey: queryKeys.userDetails,
    queryFn: api.user.getDetails,
    initialData: fallback ?? undefined,
    initialDataUpdatedAt: 0,
  })
}

/**
 * Falls back to UTC while the profile loads. Deliberately the saved zone rather
 * than the browser's: a user who travels keeps their own calendar.
 */
export function useUserTimeZone(): string {
  return useUserDetails().data?.timeZone ?? DEFAULT_TIME_ZONE
}

export function useStreak() {
  return useQuery({ queryKey: queryKeys.streak, queryFn: api.user.getStreak })
}

/** The previous window stays on screen while the next loads, so it redraws rather than empties. */
export function useAnalytics(period: AnalyticsPeriodDays) {
  return useQuery({
    queryKey: queryKeys.analyticsPeriod(period),
    queryFn: () => api.user.getAnalytics(period),
    placeholderData: keepPreviousData,
  })
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

/** The backend's order is the recommendation, so it is never re-sorted here. */
export function useReviewQueue() {
  return useQuery({ queryKey: queryKeys.reviewQueue, queryFn: api.flashcards.reviewQueue })
}

/** Every quiz at once, for the counts, recents, and pickers built over the whole set. */
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

/** Seeded by the generation flow, so a fresh quiz needs no refetch. */
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

/** Counts only; the contents come from `useGroup`. */
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

/** Content items carry `id` and `title` for all three kinds, decks included. */
export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.group(groupId ?? ''),
    queryFn: () => api.groups.get(groupId ?? ''),
    enabled: Boolean(groupId),
  })
}
