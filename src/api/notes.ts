import { apiRequest } from './client'
import { API_PATHS } from './config'
import type { NoteListResponse, NoteSummary, PublicId } from './types'

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

/** A note that is missing or belongs to another account answers 404. */
export async function get(noteId: PublicId): Promise<NoteSummary> {
  return apiRequest<NoteSummary>(API_PATHS.notes.detail(noteId), { authenticated: true })
}

/**
 * The only multipart endpoint. It extracts the text, calls the LLM
 * synchronously, and saves the note before answering, so it takes far longer
 * than ordinary requests: always call it behind a loading state.
 */
export async function summarise(file: File, signal?: AbortSignal): Promise<NoteSummary> {
  const formData = new FormData()
  // The part name must be exactly `file`.
  formData.append('file', file)

  return apiRequest<NoteSummary>(API_PATHS.notes.summarise, {
    method: 'POST',
    formData,
    authenticated: true,
    signal,
  })
}
