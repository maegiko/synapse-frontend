import { useState } from 'react'
import { AppLink } from './AppLink'
import { GroupCard } from './GroupCard'
import { GroupFormDialog } from './GroupFormDialog'
import { IconArrowRight, IconGroup, IconPlus } from './icons'
import { btnGhostSm, btnPrimarySm, cardLink } from './ui'
import { toFormMessage } from '../lib/apiErrors'
import { useTrailNavigate } from '../lib/backTrail'
import { useCreateGroup } from '../lib/groupMutations'
import { useGroups } from '../lib/queries'
import { plural } from '../lib/plural'

/** The newest few; the rest are one click away on the groups page. */
const DASHBOARD_LIMIT = 3

/**
 * The streak and review-queue cards' shape, so every compact state under the
 * dashboard's hero reads as one family of rows.
 */
const COMPACT_CARD =
  'mt-14 rounded-md border border-border bg-surface px-4 py-3 shadow-sm sm:px-6 sm:py-4'

/**
 * The dashboard's study-group section. Groups organise content that already
 * exists, so this is not another "Start something new" card: with no groups it
 * collapses to a single onboarding row rather than an empty rail.
 */
export function DashboardGroups() {
  const groups = useGroups()
  const createGroup = useCreateGroup()
  const navigate = useTrailNavigate()

  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  function openCreate() {
    setCreateError('')
    setIsCreating(true)
  }

  const dialog = isCreating && (
    <GroupFormDialog
      title="New study group"
      description="Name it now. You can add notes, decks, and quizzes as soon as it exists."
      submitLabel="Create group"
      pendingLabel="Creating…"
      isPending={createGroup.isPending}
      errorMessage={createError}
      onSubmit={({ name, description }) => {
        setCreateError('')
        createGroup.mutate(
          { name, description: description || null },
          {
            // A new group is empty, so its own page — where Add content is the
            // obvious next step — is the right place to land.
            onSuccess: (group) => navigate(`/groups/${group.id}`),
            onError: (error) => setCreateError(toFormMessage(error)),
          },
        )
      }}
      onClose={() => setIsCreating(false)}
    />
  )

  if (groups.isPending) {
    return (
      <section className={`${COMPACT_CARD} flex items-center gap-4`} aria-label="Loading study groups">
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-sm bg-surface-alt sm:h-11 sm:w-11" />
        <div className="grid flex-1 gap-2">
          <span className="h-4 w-32 animate-pulse rounded-full bg-surface-alt" />
          <span className="h-3 w-64 max-w-full animate-pulse rounded-full bg-surface-alt" />
        </div>
      </section>
    )
  }

  if (groups.isError) {
    return (
      <section className={`${COMPACT_CARD} app-content-in flex items-center gap-3`}>
        <div className="min-w-0 flex-1">
          <h2 className="text-base">Your study groups are unavailable</h2>
          <p className="mt-1 truncate text-xs text-text-muted">
            Everything else on your dashboard still works.
          </p>
        </div>
        <button
          type="button"
          className={`${btnGhostSm} shrink-0`}
          onClick={() => void groups.refetch()}
        >
          Try again
        </button>
      </section>
    )
  }

  if (groups.data.length === 0) {
    return (
      <>
        <section
          className={`${COMPACT_CARD} app-content-in flex flex-wrap items-center gap-3 sm:gap-5`}
          aria-labelledby="groups-heading"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent-strong sm:h-11 sm:w-11">
            <IconGroup className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="groups-heading" className="text-base sm:text-lg">
              Group your study material
            </h2>
            <p className="mt-0.5 text-xs text-text-muted sm:mt-1">
              A study group keeps one subject's notes, decks, and quizzes together in one place.
            </p>
          </div>
          <button type="button" className={`${btnPrimarySm} shrink-0`} onClick={openCreate}>
            <IconPlus />
            Create your first group
          </button>
        </section>
        {dialog}
      </>
    )
  }

  return (
    <>
      <section className="app-content-in mt-14" aria-labelledby="groups-heading">
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 id="groups-heading" className="text-xl">
            Study groups
          </h2>
          <p className="whitespace-nowrap text-sm text-text-muted tabular-nums">
            {plural(groups.data.length, 'group')}
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <AppLink to="/groups" className={cardLink}>
              View all
              <IconArrowRight />
            </AppLink>
            <button type="button" className={btnGhostSm} onClick={openCreate}>
              <IconPlus />
              New group
            </button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.data.slice(0, DASHBOARD_LIMIT).map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </section>
      {dialog}
    </>
  )
}
