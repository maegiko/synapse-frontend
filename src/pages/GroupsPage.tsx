import { useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { BackLink } from '../components/BackLink'
import { GroupCard } from '../components/GroupCard'
import { GroupFormDialog } from '../components/GroupFormDialog'
import { IconPlus } from '../components/icons'
import { btnGhostSm, btnPrimarySm, cardLink, fieldInput, shell, surfaceCard } from '../components/ui'
import { toFormMessage } from '../lib/apiErrors'
import { DASHBOARD_BACK, useTrailNavigate } from '../lib/backTrail'
import { useCreateGroup } from '../lib/groupMutations'
import { useGroups } from '../lib/queries'
import { plural } from '../lib/plural'

/** Reads as a gap waiting to be filled, matching the library's empty panels. */
const placeholderPanel =
  'rounded-md border border-dashed border-border bg-surface-alt px-6 py-10 text-center text-sm text-text-muted'

function GroupSkeleton() {
  return (
    <div className={`${surfaceCard} p-5`} aria-hidden="true">
      <div className="flex gap-3.5">
        <span className="h-10.5 w-10.5 shrink-0 animate-pulse rounded-sm bg-surface-alt" />
        <span className="mt-1 block h-3.5 w-1/2 animate-pulse rounded-full bg-surface-alt" />
      </div>
      <span className="mt-4 block h-3 w-full animate-pulse rounded-full bg-surface-alt" />
      <span className="mt-2 block h-3 w-2/3 animate-pulse rounded-full bg-surface-alt" />
    </div>
  )
}

/**
 * Every study group as a folder grid. Groups are a layer over the library
 * rather than a fourth kind of content, so they live here instead of joining
 * the library's Everything / Notes / Decks / Quizzes filter.
 */
export function GroupsPage() {
  const groups = useGroups()
  const createGroup = useCreateGroup()
  const navigate = useTrailNavigate()

  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const term = search.trim().toLowerCase()
  const visible = (groups.data ?? []).filter(
    (group) =>
      !term ||
      group.name.toLowerCase().includes(term) ||
      group.description?.toLowerCase().includes(term),
  )
  const isEmpty = groups.isSuccess && groups.data.length === 0

  function openCreate() {
    setCreateError('')
    setIsCreating(true)
  }

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        <BackLink fallback={DASHBOARD_BACK} className={cardLink} />

        <div className="mt-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div>
            <h1 className="text-3xl">Study groups</h1>
            <p className="mt-3 max-w-[58ch] text-base text-text-muted">
              A group keeps related notes, decks, and quizzes together. Everything stays in your
              library, a group just makes it easier to find related content.
            </p>
          </div>
          <button type="button" className={`${btnPrimarySm} shrink-0`} onClick={openCreate}>
            <IconPlus />
            New group
          </button>
        </div>

        {isEmpty ? (
          <div className={`${surfaceCard} mt-10 px-6 py-14 text-center`}>
            <h2 className="text-xl">No groups yet</h2>
            <p className="mx-auto mt-2.5 max-w-[46ch] text-base text-text-muted">
              Group a subject's notes, decks, and quizzes together so you can find them in one
              place. Nothing is copied or moved out of your library.
            </p>
            <button type="button" className={`${btnPrimarySm} mt-7`} onClick={openCreate}>
              <IconPlus />
              Create your first group
            </button>
          </div>
        ) : (
          <>
            {groups.isSuccess && groups.data.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <input
                  type="search"
                  className={`${fieldInput} max-w-100 flex-1`}
                  placeholder="Search your groups"
                  aria-label="Search your groups"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <p className="text-sm text-text-muted tabular-nums">
                  {plural(groups.data.length, 'group')}
                </p>
              </div>
            )}

            <div className="mt-8">
              {groups.isPending && (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2].map((row) => (
                    <GroupSkeleton key={row} />
                  ))}
                </div>
              )}

              {groups.isError && (
                <div className={`${surfaceCard} grid justify-items-start gap-2.5 p-6`}>
                  <p className="text-sm text-text-muted">
                    We could not load your groups. {toFormMessage(groups.error)}
                  </p>
                  <button
                    type="button"
                    className={btnGhostSm}
                    onClick={() => void groups.refetch()}
                  >
                    Try again
                  </button>
                </div>
              )}

              {groups.isSuccess && groups.data.length > 0 && visible.length === 0 && (
                <p className={placeholderPanel}>No groups match your search.</p>
              )}

              {visible.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {isCreating && (
        <GroupFormDialog
          title="New study group"
          description="Name it now; you can add notes, decks, and quizzes as soon as it exists."
          submitLabel="Create group"
          pendingLabel="Creating…"
          isPending={createGroup.isPending}
          errorMessage={createError}
          onSubmit={({ name, description }) => {
            setCreateError('')
            createGroup.mutate(
              { name, description: description || null },
              {
                // A new group is empty, so its own page — where Add content is
                // the obvious next step — is the right place to land.
                onSuccess: (group) => navigate(`/groups/${group.id}`),
                onError: (error) => setCreateError(toFormMessage(error)),
              },
            )
          }}
          onClose={() => setIsCreating(false)}
        />
      )}
    </>
  )
}
