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

/** Membership lives on the resource, so a change touches it and its list. */
const RESOURCE_KEYS: Record<
  GroupContentKind,
  { list: readonly string[]; detail: (id: string) => readonly string[] }
> = {
  notes: { list: queryKeys.notes, detail: queryKeys.note },
  decks: { list: queryKeys.flashcardDecks, detail: queryKeys.flashcardDeck },
  quizzes: { list: queryKeys.quizzes, detail: queryKeys.quiz },
}

/** Siblings sharing a key prefix but carrying no `groupId`, so never stale. */
function carriesGroupId(queryKey: readonly unknown[]): boolean {
  if (queryKey[0] === 'flashcard-decks') return queryKey[1] !== 'review-queue'
  if (queryKey[0] === 'quizzes') return queryKey[2] !== 'scores'
  return true
}

/**
 * One resource's membership changed, so the counts on every group card move and
 * both ends of the change gain or lose an item. `groupIds` is the target and, for
 * a move, the group it left; nulls and duplicates are ignored.
 */
function invalidateMembership(
  kind: GroupContentKind,
  resourceId: PublicId,
  groupIds: (PublicId | null | undefined)[],
): void {
  const keys = RESOURCE_KEYS[kind]
  void queryClient.invalidateQueries({ queryKey: queryKeys.groups, exact: true })
  for (const groupId of new Set(groupIds.filter((id): id is PublicId => Boolean(id)))) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) })
  }
  void queryClient.invalidateQueries({ queryKey: keys.detail(resourceId) })
  void queryClient.invalidateQueries({ queryKey: keys.list, exact: true })
}

/**
 * Deleting a group leaves its contents in place but ungrouped, so every cached
 * `groupId` is stale, not just the ones on screen.
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
  /** The group it is in today, which a move leaves and so must refresh too. */
  fromGroupId?: PublicId | null
}

/** Adds a resource, or moves it: membership is single-valued, so there is no move call. */
export function useAddToGroup() {
  return useMutation({
    mutationFn: ({ groupId, kind, resourceId }: MembershipVariables) =>
      api.groups.addContent(groupId, kind, resourceId),
    onSuccess: (_result, { groupId, kind, resourceId, fromGroupId }) => {
      invalidateMembership(kind, resourceId, [groupId, fromGroupId])
    },
  })
}

/** Clears the group. The resource itself is never deleted here. */
export function useRemoveFromGroup() {
  return useMutation({
    mutationFn: ({ groupId, kind, resourceId }: MembershipVariables) =>
      api.groups.removeContent(groupId, kind, resourceId),
    onSuccess: (_result, { groupId, kind, resourceId }) => {
      invalidateMembership(kind, resourceId, [groupId])
    },
  })
}
