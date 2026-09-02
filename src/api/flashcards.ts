import { apiRequest } from './client'
import { API_PATHS, MAX_LIST_PAGE_SIZE, listPath } from './config'
import { toDurationSeconds } from './duration'
import type {
  AddFlashcardRequest,
  AddFlashcardResponse,
  FlashcardDeck,
  FlashcardGenerateResponse,
  FlashcardListResponse,
  ListParams,
  PublicId,
  ReviewDeckRequest,
  ReviewDeckResponse,
  ReviewQueueDeck,
  ReviewQueueResponse,
  ReviewRating,
  UpdateDeckRequest,
  UpdateFlashcardRequest,
} from './types'

/** `query` searches deck titles, not card text. */
export async function list(params: ListParams = {}): Promise<FlashcardListResponse> {
  return apiRequest<FlashcardListResponse>(listPath(API_PATHS.flashcards.list, params), {
    authenticated: true,
  })
}

/** Every deck, by walking the pages. */
export async function listAll(): Promise<FlashcardDeck[]> {
  const all: FlashcardDeck[] = []
  for (let page = 0; ; page++) {
    const body = await list({ page, size: MAX_LIST_PAGE_SIZE })
    all.push(...(body.flashcardDecks ?? []))
    if (!body.hasNext) return all
  }
}

/** Synchronous AI call, so it belongs behind a loading state. */
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

/** The response names the question `question`; the saved deck calls it `title`. */
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

/** Returns the whole updated deck. Its review schedule and history are untouched. */
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

/** Only the supplied fields change. */
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

/** Removes the deck and every card in it. */
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
 * Decks due today or earlier, oldest first. Metadata only, so a chosen deck's
 * cards still need `get`. An empty deck can appear here but cannot be reviewed.
 */
export async function reviewQueue(): Promise<ReviewQueueDeck[]> {
  const { decks } = await apiRequest<ReviewQueueResponse>(API_PATHS.flashcards.reviewQueue, {
    authenticated: true,
  })
  return decks ?? []
}

/**
 * Records a finished session and reschedules the deck from the rating. Not
 * repeatable: every call moves the due date again and adds to the lifetime
 * total, so send it once per run and never as a blind retry.
 */
export async function review(
  deckId: PublicId,
  rating: ReviewRating,
  durationSeconds?: number | null,
): Promise<ReviewDeckResponse> {
  const body: ReviewDeckRequest = { rating }
  const duration = toDurationSeconds(durationSeconds)
  if (duration !== undefined) body.durationSeconds = duration

  return apiRequest<ReviewDeckResponse>(API_PATHS.flashcards.review(deckId), {
    method: 'POST',
    json: body,
    authenticated: true,
  })
}
