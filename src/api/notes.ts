import { apiRequest } from './client'
import { API_PATHS } from './config'
import type { NoteListResponse, NoteSummary, PublicId, UpdateNoteRequest } from './types'

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
 * Edits the note title and/or overview. Only the supplied fields change; the
 * structured keypoints, concepts, and terms stay as they were. Returns the
 * complete updated summary.
 */
export async function update(noteId: PublicId, body: UpdateNoteRequest): Promise<NoteSummary> {
  return apiRequest<NoteSummary>(API_PATHS.notes.detail(noteId), {
    method: 'PATCH',
    json: body,
    authenticated: true,
  })
}

/**
 * Deletes the note and its summary. Answers 204, so there is nothing to read.
 * Decks and quizzes generated from it stay; only their link to the note is lost.
 */
export async function remove(noteId: PublicId): Promise<void> {
  await apiRequest<void>(API_PATHS.notes.detail(noteId), {
    method: 'DELETE',
    authenticated: true,
  })
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
