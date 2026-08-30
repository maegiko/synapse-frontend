import { useState } from 'react'
import { AppLink } from './AppLink'
import { FormAlert } from './FormAlert'
import { GroupSelectDialog } from './GroupSelectDialog'
import { IconGroup, IconPlus, IconRemoveFromGroup, IconSpinner } from './icons'
import { toFormMessage } from '../lib/apiErrors'
import { useRemoveFromGroup } from '../lib/groupMutations'
import { useGroups } from '../lib/queries'
import type { GroupContentKind } from '../api'

/** Quiet, chip-sized actions, so group controls sit beside the metadata pills. */
const CHIP_ACTION =
  'inline-flex h-6.5 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-xs font-bold text-text-muted transition-colors duration-150 hover:border-accent-solid hover:text-accent-solid disabled:cursor-not-allowed disabled:opacity-60'

interface GroupMembershipControlProps {
  kind: GroupContentKind
  resourceId: string
  /** Named in the move confirmation, so it must be the resource's own title. */
  resourceTitle: string
  /** The resource's `groupId`: null while it is ungrouped. */
  groupId: string | null
}

/**
 * Group context for one note, deck, or quiz: which group holds it, and the one
 * move that changes that. Every resource page uses this rather than repeating
 * membership behaviour, so add, move, and remove work identically everywhere.
 *
 * Removing only clears membership. The note, deck, or quiz is never deleted
 * here — that is the page's own delete action, which is kept well away.
 */
export function GroupMembershipControl({
  kind,
  resourceId,
  resourceTitle,
  groupId,
}: GroupMembershipControlProps) {
  const groups = useGroups()
  const removeFromGroup = useRemoveFromGroup()
  const [isPicking, setIsPicking] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const group = groups.data?.find((candidate) => candidate.id === groupId)

  function remove() {
    if (!groupId) return
    setErrorMessage('')
    removeFromGroup.mutate(
      { groupId, kind, resourceId },
      { onError: (error) => setErrorMessage(toFormMessage(error)) },
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {groupId ? (
          <>
            <AppLink
              to={`/groups/${groupId}`}
              trailLabel={group?.name}
              className="inline-flex h-6.5 items-center gap-1.5 rounded-full bg-accent-soft px-2.5 text-xs font-bold text-accent-strong no-underline transition-colors duration-150 hover:bg-accent-soft/70 hover:underline"
            >
              <IconGroup className="h-3.5 w-3.5" />
              {group ? (
                group.name
              ) : groups.isPending ? (
                // The name is one request away; a shimmer keeps the row from
                // reflowing when it lands.
                <span
                  className="inline-block h-2.5 w-16 animate-pulse rounded-full bg-accent-strong/25"
                  aria-label="Loading group name"
                />
              ) : (
                'View group'
              )}
            </AppLink>
            <button
              type="button"
              className={CHIP_ACTION}
              onClick={() => setIsPicking(true)}
              disabled={removeFromGroup.isPending}
            >
              Move to group
            </button>
            <button
              type="button"
              className={CHIP_ACTION}
              onClick={remove}
              disabled={removeFromGroup.isPending}
            >
              {removeFromGroup.isPending ? (
                <IconSpinner className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <IconRemoveFromGroup className="h-3.5 w-3.5" />
              )}
              {removeFromGroup.isPending ? 'Removing…' : 'Remove from group'}
            </button>
          </>
        ) : (
          <button type="button" className={CHIP_ACTION} onClick={() => setIsPicking(true)}>
            <IconPlus className="h-3.5 w-3.5" />
            Add to group
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mt-3 max-w-150">
          <FormAlert message={errorMessage} />
        </div>
      )}

      {isPicking && (
        <GroupSelectDialog
          resourceTitle={resourceTitle}
          kind={kind}
          resourceId={resourceId}
          currentGroupId={groupId}
          onClose={() => setIsPicking(false)}
        />
      )}
    </>
  )
}
