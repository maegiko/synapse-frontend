import { apiRequest } from './client'
import { API_PATHS } from './config'
import type { FlashcardDeck, FlashcardListResponse } from './types'

/** Newest first, unpaginated, with every card of every deck included. */
export async function list(): Promise<FlashcardDeck[]> {
  const { flashcardDecks } = await apiRequest<FlashcardListResponse>(API_PATHS.flashcards.list, {
    authenticated: true,
  })
  return flashcardDecks ?? []
}
