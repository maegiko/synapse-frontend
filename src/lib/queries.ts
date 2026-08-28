import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export const queryKeys = {
  notes: ['notes'] as const,
  note: (noteId: string) => ['notes', noteId] as const,
  flashcardDecks: ['flashcard-decks'] as const,
  quizzes: ['quizzes'] as const,
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

export function useQuizzes() {
  return useQuery({ queryKey: queryKeys.quizzes, queryFn: api.quiz.list })
}
