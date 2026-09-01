import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { AppLink } from '../components/AppLink'
import { BackLink } from '../components/BackLink'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FormAlert } from '../components/FormAlert'
import { GroupContentPickerDialog } from '../components/GroupContentPickerDialog'
import { GroupFormDialog } from '../components/GroupFormDialog'
import { PinnedIndicator } from '../components/PinnedIndicator'
import {
  IconArrowRight,
  IconDeck,
  IconNote,
  IconPencil,
  IconPlus,
  IconQuiz,
  IconRemoveFromGroup,
  IconSpinner,
  IconTrash,
} from '../components/icons'
import {
  btnDangerGhostSm,
  btnGhostSm,
  btnPrimarySm,
  cardLink,
  countPill,
  shell,
  surfaceCard,
} from '../components/ui'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import { useDeleteGroup, useRemoveFromGroup, useUpdateGroup } from '../lib/groupMutations'
import { formatRelative } from '../lib/formatDate'
import { pinnedFirst } from '../lib/pinned'
import { plural } from '../lib/plural'
import { useGroup, useUserTimeZone } from '../lib/queries'
import type { GroupContentKind, StudyGroupContentItem, StudyGroupDetail } from '../api'

/** The groups page is where a deleted group's visitor is sent, and the fallback. */
const GROUPS_BACK = { to: '/groups', label: 'your groups' }

const DELETE_TITLE = 'Delete this group?'
const DELETE_BODY =
  'The group is removed, but nothing inside it is. Its notes, decks, and quizzes stay in your library and simply become ungrouped.'

const placeholderPanel =
  'rounded-md border border-dashed border-border bg-surface-alt px-6 py-7 text-center text-sm text-text-muted'

function GroupSkeleton() {
  return (
    <div className="grid gap-6" aria-hidden="true">
      <span className="block h-8 w-64 max-w-full animate-pulse rounded-full bg-surface-alt" />
      <span className="block h-4 w-96 max-w-full animate-pulse rounded-full bg-surface-alt" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((row) => (
          <span key={row} className="block h-24 animate-pulse rounded-md bg-surface-alt" />
        ))}
      </div>
    </div>
  )
}

/**
 * One row of group content. Items are uniform across the three kinds — `id` and
 * `title`, decks included — so the link path is the only thing that varies.
 *
 * The card holds two separate targets: opening the resource, and taking it out
 * of this group. A button cannot sit inside an anchor, so the link covers the
 * card through a stretched overlay and the remove button is lifted above it —
 * the whole card still opens the resource, and each control keeps its own
 * accessible name.
 *
 * The pinned mark sits between the two: a static indicator under the stretched
 * link, so the only things that can be clicked here are still the resource and
 * the remove button.
 */
function ContentCard({
  item,
  to,
  icon,
  groupId,
  groupName,
  kind,
  onError,
}: {
  item: StudyGroupContentItem
  to: string
  icon: ReactNode
  groupId: string
  /** Carried into the trail so the resource offers "Back to <group>". */
  groupName: string
  kind: GroupContentKind
  /** Failures are reported to the page, which announces them in one place. */
  onError: (message: string) => void
}) {
  const removeFromGroup = useRemoveFromGroup()
  const timeZone = useUserTimeZone()

  return (
    <div
      className={`${surfaceCard} group relative flex min-w-0 items-center gap-3 p-4 transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-0.5 hover:border-accent-solid hover:shadow-md`}
    >
      <span className="shrink-0 text-accent-foreground" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <AppLink
          to={to}
          trailLabel={groupName}
          className="block truncate text-sm font-bold text-text no-underline transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-accent-foreground"
        >
          {item.title}
        </AppLink>
        <span className="block truncate text-xs text-text-muted tabular-nums">
          Created {formatRelative(item.createdAt, timeZone)}
        </span>
      </span>
      {item.pinned && <PinnedIndicator className="shrink-0" />}
      <IconArrowRight
        className="h-4 w-4 shrink-0 text-accent-foreground transition-transform duration-150 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
      <button
        type="button"
        // Above the stretched link, so this is a click on the button alone.
        className="relative z-10 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm border border-transparent p-1.5 text-text-muted transition-colors duration-150 hover:border-border hover:bg-surface-alt hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={`Remove ${item.title} from ${groupName}`}
        title={`Remove from ${groupName}. This does not delete it.`}
        disabled={removeFromGroup.isPending}
        onClick={() => {
          onError('')
          removeFromGroup.mutate(
            { groupId, kind, resourceId: item.id },
            { onError: (error) => onError(toFormMessage(error)) },
          )
        }}
      >
        {removeFromGroup.isPending ? (
          <IconSpinner className="h-4 w-4 animate-spin" />
        ) : (
          <IconRemoveFromGroup className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}

function ContentSection({
  title,
  items,
  emptyMessage,
  icon,
  hrefFor,
  groupId,
  groupName,
  kind,
  onError,
}: {
  title: string
  items: StudyGroupContentItem[]
  emptyMessage: string
  icon: ReactNode
  hrefFor: (item: StudyGroupContentItem) => string
  groupId: string
  groupName: string
  kind: GroupContentKind
  onError: (message: string) => void
}) {
  return (
    <section className="mt-12 first:mt-10">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-xl">{title}</h2>
        <span className={countPill}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className={placeholderPanel}>{emptyMessage}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {/* The backend already leads each list with its pinned items; this is
              only a stable fallback, so a correctly ordered list is untouched. */}
          {pinnedFirst(items).map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              to={hrefFor(item)}
              icon={icon}
              groupId={groupId}
              groupName={groupName}
              kind={kind}
              onError={onError}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function GroupContent({ group }: { group: StudyGroupDetail }) {
  // A plain navigate: a group that has just been deleted must not be left on
  // the trail as somewhere the groups page can offer to go back to.
  const navigate = useNavigate()
  const updateGroup = useUpdateGroup(group.id)
  const deleteGroup = useDeleteGroup()
  const timeZone = useUserTimeZone()

  const [isEditing, setIsEditing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [editError, setEditError] = useState('')
  const [actionError, setActionError] = useState('')

  return (
    <>
      <h1 className="text-3xl">{group.name}</h1>
      {group.description && (
        <p className="mt-3 max-w-[72ch] text-base text-text-muted">{group.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={countPill}>{plural(group.notes.length, 'note')}</span>
        <span className={countPill}>{plural(group.decks.length, 'deck')}</span>
        <span className={countPill}>{plural(group.quizzes.length, 'quiz', 'quizzes')}</span>
        <span className={countPill}>Created {formatRelative(group.createdAt, timeZone)}</span>
      </div>

      {/* Filling the group on the left; managing the group itself on the right. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <button
          type="button"
          className={btnPrimarySm}
          onClick={() => {
            setActionError('')
            setIsAdding(true)
          }}
        >
          <IconPlus />
          Add content
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={btnGhostSm}
            onClick={() => {
              setEditError('')
              setIsEditing(true)
            }}
          >
            <IconPencil />
            Edit group
          </button>
          <button
            type="button"
            className={btnDangerGhostSm}
            onClick={() => {
              setActionError('')
              setIsConfirmingDelete(true)
            }}
            disabled={deleteGroup.isPending}
          >
            <IconTrash />
            Delete group
          </button>
        </div>
      </div>

      {actionError && (
        <div className="mt-6 max-w-150">
          <FormAlert message={actionError} />
        </div>
      )}

      <ContentSection
        title="Notes"
        items={group.notes}
        icon={<IconNote className="h-4.5 w-4.5" />}
        hrefFor={(item) => `/notes/${item.id}`}
        emptyMessage="No notes in this group yet."
        groupId={group.id}
        groupName={group.name}
        kind="notes"
        onError={setActionError}
      />
      <ContentSection
        title="Flashcard decks"
        items={group.decks}
        icon={<IconDeck className="h-4.5 w-4.5" />}
        // Group content items use `id` even for decks, which are `deckId` in
        // the flashcard endpoints; the deck page's route takes the deck ID.
        hrefFor={(item) => `/flashcards/${item.id}`}
        emptyMessage="No flashcard decks in this group yet."
        groupId={group.id}
        groupName={group.name}
        kind="decks"
        onError={setActionError}
      />
      <ContentSection
        title="Quizzes"
        items={group.quizzes}
        icon={<IconQuiz className="h-4.5 w-4.5" />}
        hrefFor={(item) => `/quiz/${item.id}`}
        emptyMessage="No quizzes in this group yet."
        groupId={group.id}
        groupName={group.name}
        kind="quizzes"
        onError={setActionError}
      />

      {isEditing && (
        <GroupFormDialog
          title="Edit group"
          description="Change the name, the description, or both."
          submitLabel="Save changes"
          pendingLabel="Saving…"
          initialValues={{ name: group.name, description: group.description ?? '' }}
          isPending={updateGroup.isPending}
          errorMessage={editError}
          onSubmit={({ name, description }) => {
            setEditError('')
            // Both fields are sent: the form shows both, and a blank
            // description is a deliberate instruction to clear it.
            updateGroup.mutate(
              { name, description },
              {
                onSuccess: () => setIsEditing(false),
                onError: (error) => setEditError(toFormMessage(error)),
              },
            )
          }}
          onClose={() => setIsEditing(false)}
        />
      )}

      {isAdding && (
        <GroupContentPickerDialog
          groupId={group.id}
          groupName={group.name}
          onClose={() => setIsAdding(false)}
        />
      )}

      {isConfirmingDelete && (
        <ConfirmDialog
          title={DELETE_TITLE}
          body={DELETE_BODY}
          confirmLabel="Delete group"
          cancelLabel="Keep it"
          tone="danger"
          onConfirm={() => {
            setIsConfirmingDelete(false)
            deleteGroup.mutate(group.id, {
              onSuccess: () => navigate('/groups', { replace: true }),
              onError: (error) =>
                setActionError(
                  isStatus(error, 404)
                    ? 'That group has already been deleted.'
                    : `We could not delete this group. ${toFormMessage(error)}`,
                ),
            })
          }}
          onCancel={() => setIsConfirmingDelete(false)}
        />
      )}
    </>
  )
}

/** One study group: what it holds, and the actions that change it. */
export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const group = useGroup(groupId)

  const isMissing = isStatus(group.error, 404)

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        <BackLink fallback={GROUPS_BACK} className={cardLink} />

        <div className="mt-5">
          {group.isPending && <GroupSkeleton />}

          {group.isError && (
            <div className={`${surfaceCard} max-w-150 p-8`}>
              <h1 className="text-3xl">
                {isMissing ? 'We could not find that group' : 'We could not load that group'}
              </h1>
              <p className="mt-3 text-base text-text-muted">
                {isMissing
                  ? 'It may have been deleted, or it belongs to another account. Anything that was in it is still in your library.'
                  : toFormMessage(group.error)}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {!isMissing && (
                  <button type="button" className={btnGhostSm} onClick={() => void group.refetch()}>
                    Try again
                  </button>
                )}
                <AppLink to="/groups" className={cardLink}>
                  Your groups
                  <IconArrowRight />
                </AppLink>
              </div>
            </div>
          )}

          {group.isSuccess && <GroupContent group={group.data} />}
        </div>
      </main>
    </>
  )
}
