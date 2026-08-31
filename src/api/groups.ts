import { apiRequest } from './client'
import { API_PATHS, MAX_LIST_PAGE_SIZE, listPath } from './config'
import type {
  CreateGroupRequest,
  GroupContentKind,
  ListParams,
  PublicId,
  StudyGroup,
  StudyGroupDetail,
  StudyGroupListItem,
  StudyGroupListResponse,
  UpdateGroupRequest,
} from './types'

/**
 * One page of groups, newest first. Rows carry content counts, not the content.
 * `query` searches group names, not descriptions.
 */
export async function list(params: ListParams = {}): Promise<StudyGroupListResponse> {
  return apiRequest<StudyGroupListResponse>(listPath(API_PATHS.groups.list, params), {
    authenticated: true,
  })
}

/**
 * Every group, by walking the pages. For the pickers and dashboard panels that
 * need the whole set rather than a paged list of it.
 */
export async function listAll(): Promise<StudyGroupListItem[]> {
  const all: StudyGroupListItem[] = []
  for (let page = 0; ; page++) {
    const body = await list({ page, size: MAX_LIST_PAGE_SIZE })
    all.push(...(body.groups ?? []))
    if (!body.hasNext) return all
  }
}

/**
 * One group with lightweight lists of everything it holds. Content items use
 * `id` and `title` for all three kinds — decks included, despite being `deckId`
 * everywhere else — so callers must map rather than reuse a resource type.
 */
export async function get(groupId: PublicId): Promise<StudyGroupDetail> {
  return apiRequest<StudyGroupDetail>(API_PATHS.groups.detail(groupId), { authenticated: true })
}

/** New groups are always empty; content is added through the membership routes. */
export async function create(body: CreateGroupRequest): Promise<StudyGroup> {
  return apiRequest<StudyGroup>(API_PATHS.groups.create, {
    method: 'POST',
    json: body,
    authenticated: true,
  })
}

/** Partial, like the profile route: only the supplied properties change. */
export async function update(groupId: PublicId, body: UpdateGroupRequest): Promise<StudyGroup> {
  return apiRequest<StudyGroup>(API_PATHS.groups.detail(groupId), {
    method: 'PATCH',
    json: body,
    authenticated: true,
  })
}

/**
 * Deletes the group only. Its notes, decks, and quizzes are untouched and
 * become ungrouped, so every cached `groupId` for them is now stale.
 * Answers 204, so there is nothing to read.
 */
export async function remove(groupId: PublicId): Promise<void> {
  await apiRequest<void>(API_PATHS.groups.detail(groupId), {
    method: 'DELETE',
    authenticated: true,
  })
}

/**
 * Puts one resource in this group. Membership is single-valued, so a resource
 * already in another group is *moved*, never copied, and repeating the call is
 * safe. Answers 204, so there is nothing to read.
 */
export async function addContent(
  groupId: PublicId,
  kind: GroupContentKind,
  resourceId: PublicId,
): Promise<void> {
  await apiRequest<void>(API_PATHS.groups.content(groupId, kind, resourceId), {
    method: 'PUT',
    authenticated: true,
  })
}

/**
 * Clears the resource's group. **Never deletes the note, deck, or quiz** — this
 * is not part of any delete flow. The resource must currently be in this group;
 * removing it from one it is not in answers 404 rather than passing silently.
 * Answers 204, so there is nothing to read.
 */
export async function removeContent(
  groupId: PublicId,
  kind: GroupContentKind,
  resourceId: PublicId,
): Promise<void> {
  await apiRequest<void>(API_PATHS.groups.content(groupId, kind, resourceId), {
    method: 'DELETE',
    authenticated: true,
  })
}
