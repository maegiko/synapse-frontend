import { apiRequest } from './client'
import { API_PATHS, MAX_LIST_PAGE_SIZE, listPath } from './config'
import type {
  ListParams,
  NoteListResponse,
  NoteSummary,
  PublicId,
  UpdateNoteRequest,
} from './types'

/**
 * One page of notes, newest first, each with its full summary content. `query`
 * searches note titles. The whole envelope is returned because the paging
 * metadata beside `notes` is the point of it; field names are left alone.
 */
export async function list(params: ListParams = {}): Promise<NoteListResponse> {
  return apiRequest<NoteListResponse>(listPath(API_PATHS.notes.list, params), {
    authenticated: true,
  })
}

/**
 * Every note, by walking the pages. For the screens that count or pick across
 * the whole library rather than showing a paged list of it.
 */
export async function listAll(): Promise<NoteSummary[]> {
  const all: NoteSummary[] = []
  for (let page = 0; ; page++) {
    const body = await list({ page, size: MAX_LIST_PAGE_SIZE })
    all.push(...(body.notes ?? []))
    if (!body.hasNext) return all
  }
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
