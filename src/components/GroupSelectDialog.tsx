import { useState } from 'react'
import { Dialog } from './Dialog'
import { FormAlert } from './FormAlert'
import { GroupFormDialog } from './GroupFormDialog'
import { MoveConfirmation } from './MoveConfirmation'
import { PickerError, PickerSkeleton, pickerPanel } from './PickerStates'
import { IconCheck, IconGroup, IconPlus } from './icons'
import { btnGhostSm, fieldInput } from './ui'
import { toFormMessage } from '../lib/apiErrors'
import { useAddToGroup, useCreateGroup } from '../lib/groupMutations'
import { useGroups } from '../lib/queries'
import { plural } from '../lib/plural'
import type { GroupContentKind, StudyGroupListItem } from '../api'

/** Search is only worth showing once the list is long enough to scan for. */
const SEARCH_THRESHOLD = 6

interface GroupSelectDialogProps {
  resourceTitle: string
  kind: GroupContentKind
  resourceId: string
  /** Its group today, or null. Non-null makes every choice a move. */
  currentGroupId: string | null
  onClose: () => void
}

function groupCounts(group: StudyGroupListItem): string {
  const total = group.noteCount + group.deckCount + group.quizCount
  return total === 0 ? 'Empty' : plural(total, 'item')
}

/**
 * Membership is single-valued, so this is a single choice. Picking a group while
 * the resource is in another one moves it, confirmed by name first.
 */
export function GroupSelectDialog({
  resourceTitle,
  kind,
  resourceId,
  currentGroupId,
  onClose,
}: GroupSelectDialogProps) {
  const groups = useGroups()
  const addToGroup = useAddToGroup()
  const createGroup = useCreateGroup()

  const [search, setSearch] = useState('')
  const [pendingMove, setPendingMove] = useState<StudyGroupListItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const term = search.trim().toLowerCase()
  const visible = (groups.data ?? []).filter(
    (group) =>
      !term ||
      group.name.toLowerCase().includes(term) ||
      group.description?.toLowerCase().includes(term),
  )
  const currentGroup = groups.data?.find((group) => group.id === currentGroupId)

  function fileInto(groupId: string) {
    setErrorMessage('')
    addToGroup.mutate(
      { groupId, kind, resourceId, fromGroupId: currentGroupId },
      {
        onSuccess: onClose,
        onError: (error) => setErrorMessage(toFormMessage(error)),
      },
    )
  }

  function choose(group: StudyGroupListItem) {
    setErrorMessage('')
    if (currentGroupId && currentGroupId !== group.id) {
      setPendingMove(group)
      return
    }
    fileInto(group.id)
  }

  if (isCreating) {
    return (
      <GroupFormDialog
        title="New study group"
        description={`Create a group and put ‘${resourceTitle}’ straight into it.`}
        submitLabel="Create and add"
        pendingLabel="Creating…"
        isPending={createGroup.isPending || addToGroup.isPending}
        errorMessage={errorMessage}
        onSubmit={({ name, description }) => {
          setErrorMessage('')
          createGroup.mutate(
            { name, description: description || null },
            {
              onSuccess: (group) => {
                setIsCreating(false)
                fileInto(group.id)
              },
              onError: (error) => setErrorMessage(toFormMessage(error)),
            },
          )
        }}
        onClose={onClose}
      />
    )
  }

  if (pendingMove) {
    return (
      <Dialog title="Move to another group?" onClose={onClose}>
        <MoveConfirmation
          detail={`Move ‘${resourceTitle}’ from ${currentGroup?.name ?? 'its current group'} to ${
            pendingMove.name
          }? It can only be in one group, so it leaves the first one.`}
          isPending={addToGroup.isPending}
          errorMessage={errorMessage}
          onConfirm={() => fileInto(pendingMove.id)}
          onCancel={() => {
            setErrorMessage('')
            setPendingMove(null)
          }}
        />
      </Dialog>
    )
  }

  return (
    <Dialog
      title={currentGroupId ? 'Move to a group' : 'Add to a group'}
      description={`Choose the one group ‘${resourceTitle}’ belongs in.`}
      size="lg"
      onClose={onClose}
    >
      <div className="mt-6 grid min-h-0 gap-4">
        {errorMessage && <FormAlert message={errorMessage} />}

        {groups.isSuccess && groups.data.length > SEARCH_THRESHOLD && (
          <input
            type="search"
            className={fieldInput}
            placeholder="Search your groups"
            aria-label="Search your groups"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        )}

        <div className="min-h-0 overflow-y-auto">
          {groups.isPending && <PickerSkeleton />}

          {groups.isError && (
            <PickerError error={groups.error} onRetry={() => void groups.refetch()} />
          )}

          {groups.isSuccess && groups.data.length === 0 && (
            <p className={pickerPanel}>
              You have no groups yet. Create one and this goes straight into it.
            </p>
          )}

          {groups.isSuccess && groups.data.length > 0 && visible.length === 0 && (
            <p className={pickerPanel}>No groups match your search.</p>
          )}

          {visible.length > 0 && (
            <ul className="app-content-in grid list-none gap-2">
              {visible.map((group) => {
                const isCurrent = group.id === currentGroupId
                return (
                  <li key={group.id}>
                    <button
                      type="button"
                      onClick={() => choose(group)}
                      disabled={isCurrent || addToGroup.isPending}
                      aria-current={isCurrent || undefined}
                      className={`flex w-full items-center gap-3 rounded-sm border px-3.5 py-3 text-left transition-colors duration-150 ${
                        isCurrent
                          ? 'cursor-default border-accent-solid/40 bg-accent-soft/50'
                          : 'cursor-pointer border-border bg-surface hover:border-accent-solid hover:bg-surface-alt/60 disabled:cursor-not-allowed disabled:opacity-60'
                      }`}
                    >
                      <IconGroup className="h-4.5 w-4.5 shrink-0 text-accent-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-text">
                          {group.name}
                        </span>
                        <span className="block truncate text-xs text-text-muted tabular-nums">
                          {group.description || groupCounts(group)}
                        </span>
                      </span>
                      {isCurrent && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-accent-strong">
                          <IconCheck className="h-3.5 w-3.5" />
                          Current group
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <button
            type="button"
            className={btnGhostSm}
            onClick={() => {
              setErrorMessage('')
              setIsCreating(true)
            }}
          >
            <IconPlus />
            New group
          </button>
          <button type="button" className={btnGhostSm} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Dialog>
  )
}
