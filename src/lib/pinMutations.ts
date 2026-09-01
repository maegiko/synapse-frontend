import { useMutation } from '@tanstack/react-query'
import { api } from '../api'
import type { FlashcardDeck, NoteSummary, PublicId, Quiz } from '../api'
import { queryKeys } from './queries'
import { queryClient } from './queryClient'

/**
 * Pinning a note, deck, or quiz goes through that resource's ordinary update
 * endpoint with `pinned` as the only field, which the API accepts and which
 * leaves every other field — title, overview, description — untouched. The
 * edit dialogs are the mirror of that: they never send `pinned`, so an edit
 * never disturbs the pin state either.
 *
 * There is no optimistic update on purpose. The PATCH answers with the complete
 * updated record, so the detail view is right the moment it lands, and a failed
 * request simply leaves the old state on screen — there is no half-applied
 * state to roll back, and the page reports the failure through its own alert.
 */

/** Where one kind's pin state is cached. */
interface PinCaches {
  /** The record's own query, replaced outright with the PATCH response. */
  detail: readonly unknown[]
  /** The whole-library query the counts, recents, and pickers read. */
  list: readonly unknown[]
  /** The prefix every paged library search for this kind shares. */
  searches: readonly unknown[]
}

/**
 * A pin changes where the record sits in every list that carries it, not just
 * whether it is marked, so the lists are invalidated rather than patched: their
 * order is the backend's answer to give. That covers the library's paged
 * sections under every search term, the whole-library query, and — when the
 * record is in a group — that group's own pinned-first content lists.
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
