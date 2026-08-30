import { useMutation } from '@tanstack/react-query'
import { api } from '../api'
import type {
  CreateGroupRequest,
  GroupContentKind,
  PublicId,
  StudyGroup,
  StudyGroupDetail,
  UpdateGroupRequest,
} from '../api'
import { queryKeys } from './queries'
import { queryClient } from './queryClient'

/**
 * Where each content kind's cached state lives. Group membership is stored on
 * the resource itself (`groupId`), so a membership change invalidates both the
 * resource's own query and the list it appears in.
 */
const RESOURCE_KEYS: Record<
  GroupContentKind,
  { list: readonly string[]; detail: (id: string) => readonly string[] }
> = {
  notes: { list: queryKeys.notes, detail: queryKeys.note },
  decks: { list: queryKeys.flashcardDecks, detail: queryKeys.flashcardDeck },
  quizzes: { list: queryKeys.quizzes, detail: queryKeys.quiz },
}

/**
 * Sibling caches that share a resource's key prefix but carry no `groupId`, so
 * a group change never makes them stale: the review queue under
 * `['flashcard-decks', …]` and score history under `['quizzes', id, 'scores']`.
 */
function carriesGroupId(queryKey: readonly unknown[]): boolean {
  if (queryKey[0] === 'flashcard-decks') return queryKey[1] !== 'review-queue'
  if (queryKey[0] === 'quizzes') return queryKey[2] !== 'scores'
  return true
}

/**
 * One resource's membership changed. The counts on every group card move, the
 * groups at both ends of the change gain or lose an item, and the resource's
 * own `groupId` is now stale in its detail and list queries.
 *
 * `groupIds` is the target and, for a move, the group it came from; nulls and
 * duplicates are ignored so callers can pass `[groupId, fromGroupId]` directly.
 */
function invalidateMembership(
  kind: GroupContentKind,
  resourceId: PublicId,
  groupIds: (PublicId | null | undefined)[],
): void {
  const keys = RESOURCE_KEYS[kind]
  // Counts live on the list rows, so the list is refreshed for any change.
  void queryClient.invalidateQueries({ queryKey: queryKeys.groups, exact: true })
  for (const groupId of new Set(groupIds.filter((id): id is PublicId => Boolean(id)))) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) })
  }
  void queryClient.invalidateQueries({ queryKey: keys.detail(resourceId) })
  void queryClient.invalidateQueries({ queryKey: keys.list, exact: true })
}

/**
 * Deleting a group leaves every note, deck, and quiz it held in place but
 * ungrouped, so each one's cached `groupId` is stale — not just the ones on
 * screen. Sibling caches without a `groupId` are left alone.
 */
function invalidateAllGroupedResources(): void {
  for (const { list } of Object.values(RESOURCE_KEYS)) {
    void queryClient.invalidateQueries({
      queryKey: list,
      predicate: (query) => carriesGroupId(query.queryKey),
    })
  }
}

export function useCreateGroup() {
  return useMutation({
    mutationFn: (body: CreateGroupRequest) => api.groups.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups, exact: true })
    },
  })
}

export function useUpdateGroup(groupId: PublicId) {
  return useMutation({
    mutationFn: (body: UpdateGroupRequest) => api.groups.update(groupId, body),
    onSuccess: (group: StudyGroup) => {
      // The response is the confirmed new name and description, so the open
      // detail page can show them at once rather than after the refetch lands.
      queryClient.setQueryData<StudyGroupDetail>(
        queryKeys.group(groupId),
        (current) =>
          current && { ...current, name: group.name, description: group.description },
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups, exact: true })
      void queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) })
    },
  })
}

export function useDeleteGroup() {
  return useMutation({
    mutationFn: (groupId: PublicId) => api.groups.remove(groupId),
    onSuccess: (_result, groupId) => {
      // The group is gone rather than stale, so its entry is dropped outright.
      queryClient.removeQueries({ queryKey: queryKeys.group(groupId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups, exact: true })
      invalidateAllGroupedResources()
    },
  })
}

export interface MembershipVariables {
  groupId: PublicId
  kind: GroupContentKind
  resourceId: PublicId
  /**
   * The group the resource is in today, when it is in one. Adding it elsewhere
   * moves it, so that group loses an item and needs refreshing too.
   */
  fromGroupId?: PublicId | null
}

/**
 * Adds a resource to a group — or moves it, if it already belongs to another
 * one. Membership is single-valued, so there is no separate move call.
 */
export function useAddToGroup() {
  return useMutation({
    mutationFn: ({ groupId, kind, resourceId }: MembershipVariables) =>
      api.groups.addContent(groupId, kind, resourceId),
    onSuccess: (_result, { groupId, kind, resourceId, fromGroupId }) => {
      invalidateMembership(kind, resourceId, [groupId, fromGroupId])
    },
  })
}

/**
 * Clears a resource's group. The note, deck, or quiz itself is never deleted —
 * this is not part of any delete flow.
 */
export function useRemoveFromGroup() {
  return useMutation({
    mutationFn: ({ groupId, kind, resourceId }: MembershipVariables) =>
      api.groups.removeContent(groupId, kind, resourceId),
    onSuccess: (_result, { groupId, kind, resourceId }) => {
      invalidateMembership(kind, resourceId, [groupId])
    },
  })
}
