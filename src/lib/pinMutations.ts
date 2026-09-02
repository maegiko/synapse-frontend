import { useMutation } from '@tanstack/react-query'
import { api } from '../api'
import type { FlashcardDeck, NoteSummary, PublicId, Quiz } from '../api'
import { queryKeys } from './queries'
import { queryClient } from './queryClient'

/**
 * Pinning goes through the resource's ordinary update endpoint with `pinned` as
 * the only field, leaving every other field alone; the edit dialogs mirror that
 * by never sending `pinned`.
 *
 * No optimistic update on purpose: the PATCH answers with the complete record,
 * so a failure simply leaves the old state on screen with nothing to roll back.
 */

/** Where one kind's pin state is cached. */
interface PinCaches {
  detail: readonly unknown[]
  list: readonly unknown[]
  searches: readonly unknown[]
}

/**
 * A pin moves the record within every list that carries it, so the lists are
 * invalidated rather than patched: their order is the backend's to give.
 */
function refreshAfterPin<T>(keys: PinCaches, updated: T, groupId: PublicId | null): void {
  queryClient.setQueryData<T>(keys.detail, updated)
  void queryClient.invalidateQueries({ queryKey: keys.list, exact: true })
  void queryClient.invalidateQueries({ queryKey: keys.searches })
  if (groupId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) })
  }
}

export function usePinNote(noteId: PublicId) {
  return useMutation({
    mutationFn: (pinned: boolean) => api.notes.update(noteId, { pinned }),
    onSuccess: (updated: NoteSummary) =>
      refreshAfterPin(
        {
          detail: queryKeys.note(noteId),
          list: queryKeys.notes,
          searches: queryKeys.notesSearches,
        },
        updated,
        updated.groupId,
      ),
  })
}

export function usePinDeck(deckId: PublicId) {
  return useMutation({
    mutationFn: (pinned: boolean) => api.flashcards.updateDeck(deckId, { pinned }),
    onSuccess: (updated: FlashcardDeck) =>
      refreshAfterPin(
        {
          detail: queryKeys.flashcardDeck(deckId),
          list: queryKeys.flashcardDecks,
          searches: queryKeys.flashcardDecksSearches,
        },
        updated,
        updated.groupId,
      ),
  })
}

export function usePinQuiz(quizId: PublicId) {
  return useMutation({
    mutationFn: (pinned: boolean) => api.quiz.update(quizId, { pinned }),
    onSuccess: (updated: Quiz) =>
      refreshAfterPin(
        {
          detail: queryKeys.quiz(quizId),
          list: queryKeys.quizzes,
          searches: queryKeys.quizzesSearches,
        },
        updated,
        updated.groupId,
      ),
  })
}
