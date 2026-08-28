import { apiRequest } from './client'
import { API_PATHS } from './config'
import type {
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
