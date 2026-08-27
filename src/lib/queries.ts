import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export const queryKeys = {
  notes: ['notes'] as const,
  flashcardDecks: ['flashcard-decks'] as const,
  quizzes: ['quizzes'] as const,
}

export function useNotes() {
  return useQuery({ queryKey: queryKeys.notes, queryFn: api.notes.list })
}

export function useFlashcardDecks() {
  return useQuery({ queryKey: queryKeys.flashcardDecks, queryFn: api.flashcards.list })
}

export function useQuizzes() {
  return useQuery({ queryKey: queryKeys.quizzes, queryFn: api.quiz.list })
}
