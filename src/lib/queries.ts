import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export const queryKeys = {
  streak: ['streak'] as const,
  notes: ['notes'] as const,
  note: (noteId: string) => ['notes', noteId] as const,
  flashcardDecks: ['flashcard-decks'] as const,
  flashcardDeck: (deckId: string) => ['flashcard-decks', deckId] as const,
  quizzes: ['quizzes'] as const,
  quiz: (quizId: string) => ['quizzes', quizId] as const,
  quizScores: (quizId: string) => ['quizzes', quizId, 'scores'] as const,
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

export function useQuizzes() {
  return useQuery({ queryKey: queryKeys.quizzes, queryFn: api.quiz.list })
}

/** One saved quiz with its questions and answers, in saved position order. */
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
