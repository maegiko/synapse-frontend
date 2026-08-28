import { apiRequest } from './client'
import { API_PATHS } from './config'
import type {
  AddFlashcardRequest,
  AddFlashcardResponse,
  FlashcardDeck,
  FlashcardGenerateResponse,
  FlashcardListResponse,
  PublicId,
} from './types'

/** Newest first, unpaginated, with every card of every deck included. */
export async function list(): Promise<FlashcardDeck[]> {
  const { flashcardDecks } = await apiRequest<FlashcardListResponse>(API_PATHS.flashcards.list, {
    authenticated: true,
  })
  return flashcardDecks ?? []
}

/**
 * Synchronous AI call, so it belongs behind a loading state. The deck title is
 * copied from the source note, and the card count varies from note to note.
 */
export async function generate(noteId: PublicId): Promise<FlashcardGenerateResponse> {
  return apiRequest<FlashcardGenerateResponse>(API_PATHS.flashcards.generate, {
    method: 'POST',
    json: { noteId },
    authenticated: true,
  })
}

/** A deck that is missing or belongs to another account answers 404. */
export async function get(deckId: PublicId): Promise<FlashcardDeck> {
  return apiRequest<FlashcardDeck>(API_PATHS.flashcards.detail(deckId), { authenticated: true })
}

/**
 * Appends one hand-written card. The response names the question `question`,
 * while the saved deck names the same field `title`.
 */
export async function addCard(
  deckId: PublicId,
  card: AddFlashcardRequest,
): Promise<AddFlashcardResponse> {
  return apiRequest<AddFlashcardResponse>(API_PATHS.flashcards.detail(deckId), {
    method: 'POST',
    json: card,
    authenticated: true,
  })
}

/** Removes the deck and every card in it. Answers 204, so there is nothing to read. */
export async function remove(deckId: PublicId): Promise<void> {
  await apiRequest<void>(API_PATHS.flashcards.detail(deckId), {
    method: 'DELETE',
    authenticated: true,
  })
}

export async function removeCard(deckId: PublicId, cardId: PublicId): Promise<void> {
  await apiRequest<void>(API_PATHS.flashcards.card(deckId, cardId), {
    method: 'DELETE',
    authenticated: true,
  })
}
