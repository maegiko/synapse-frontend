import { apiRequest } from './client'
import { API_PATHS } from './config'
import type {
  AddFlashcardRequest,
  AddFlashcardResponse,
  FlashcardDeck,
  FlashcardGenerateResponse,
  FlashcardListResponse,
  PublicId,
  ReviewDeckResponse,
  ReviewQueueDeck,
  ReviewQueueResponse,
  ReviewRating,
  UpdateDeckRequest,
  UpdateFlashcardRequest,
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

/**
 * Renames a deck. Returns the complete updated deck, cards included and in
 * position order. The deck's review schedule and history are untouched.
 */
export async function updateDeck(
  deckId: PublicId,
  body: UpdateDeckRequest,
): Promise<FlashcardDeck> {
  return apiRequest<FlashcardDeck>(API_PATHS.flashcards.detail(deckId), {
    method: 'PATCH',
    json: body,
    authenticated: true,
  })
}

/**
 * Edits one card's question and/or answer. Only the supplied fields change. The
 * response names the question `question`, while the saved deck names it `title`.
 */
export async function updateCard(
  deckId: PublicId,
  cardId: PublicId,
  body: UpdateFlashcardRequest,
): Promise<AddFlashcardResponse> {
  return apiRequest<AddFlashcardResponse>(API_PATHS.flashcards.card(deckId, cardId), {
    method: 'PATCH',
    json: body,
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

/**
 * The decks due today or earlier, oldest due date first. Metadata only: load a
 * chosen deck's cards with `get`. A deck with no cards can appear here but
 * cannot be reviewed.
 */
export async function reviewQueue(): Promise<ReviewQueueDeck[]> {
  const { decks } = await apiRequest<ReviewQueueResponse>(API_PATHS.flashcards.reviewQueue, {
    authenticated: true,
  })
  return decks ?? []
}

/**
 * Records a finished study session and reschedules the deck from the rating.
 * This is not repeatable: every call moves the due date again and adds to the
 * lifetime review total, so send it once per completed run and never as a blind
 * retry. It also feeds the streak. A deck with no cards answers 400.
 */
export async function review(
  deckId: PublicId,
  rating: ReviewRating,
): Promise<ReviewDeckResponse> {
  return apiRequest<ReviewDeckResponse>(API_PATHS.flashcards.review(deckId), {
    method: 'POST',
    json: { rating },
    authenticated: true,
  })
}
