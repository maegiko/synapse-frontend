import { apiRequest } from './client'
import { API_PATHS } from './config'
import type { NoteListResponse, NoteSummary } from './types'

/**
 * Newest first, unpaginated, and every note arrives with its full summary
 * content. Only the envelope is unwrapped; field names are left alone.
 */
export async function list(): Promise<NoteSummary[]> {
  const { notes } = await apiRequest<NoteListResponse>(API_PATHS.notes.list, {
    authenticated: true,
  })
  return notes ?? []
}
