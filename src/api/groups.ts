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

/** Rows carry content counts, not the content. `query` searches names only. */
export async function list(params: ListParams = {}): Promise<StudyGroupListResponse> {
  return apiRequest<StudyGroupListResponse>(listPath(API_PATHS.groups.list, params), {
    authenticated: true,
  })
}

/** Every group, by walking the pages. */
export async function listAll(): Promise<StudyGroupListItem[]> {
  const all: StudyGroupListItem[] = []
  for (let page = 0; ; page++) {
    const body = await list({ page, size: MAX_LIST_PAGE_SIZE })
    all.push(...(body.groups ?? []))
    if (!body.hasNext) return all
  }
}

/**
 * Content items use `id` and `title` for all three kinds, decks included despite
 * being `deckId` everywhere else, so callers must map rather than reuse a type.
 */
export async function get(groupId: PublicId): Promise<StudyGroupDetail> {
  return apiRequest<StudyGroupDetail>(API_PATHS.groups.detail(groupId), { authenticated: true })
}

export async function create(body: CreateGroupRequest): Promise<StudyGroup> {
  return apiRequest<StudyGroup>(API_PATHS.groups.create, {
    method: 'POST',
    json: body,
    authenticated: true,
  })
}

/** Only the supplied properties change. */
export async function update(groupId: PublicId, body: UpdateGroupRequest): Promise<StudyGroup> {
  return apiRequest<StudyGroup>(API_PATHS.groups.detail(groupId), {
    method: 'PATCH',
    json: body,
    authenticated: true,
  })
}

/**
 * Deletes the group only. Its contents survive and become ungrouped, so every
 * cached `groupId` for them is now stale.
 */
export async function remove(groupId: PublicId): Promise<void> {
  await apiRequest<void>(API_PATHS.groups.detail(groupId), {
    method: 'DELETE',
    authenticated: true,
  })
}

/**
 * Membership is single-valued, so a resource already in another group is moved
 * rather than copied. Repeating the call is safe.
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
 * Clears the resource's group, never deleting the resource itself. It must
 * currently be in this group; removing it from one it is not in answers 404.
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
