import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Dialog } from './Dialog'
import { FormAlert } from './FormAlert'
import { MoveConfirmation } from './MoveConfirmation'
import { PickerError, PickerSkeleton, pickerPanel } from './PickerStates'
import { IconCheck, IconDeck, IconNote, IconQuiz } from './icons'
import { btnGhostSm, fieldInput } from './ui'
import { toFormMessage } from '../lib/apiErrors'
import { useAddToGroup } from '../lib/groupMutations'
import { useFlashcardDecks, useGroups, useNotes, useQuizzes } from '../lib/queries'
import type { GroupContentKind } from '../api'

/**
 * One row in the picker, normalised across the three resource kinds. Decks
 * identify themselves with `deckId` while notes and quizzes use `id`, so every
 * kind is mapped explicitly rather than sharing a resource type.
 */
interface PickerItem {
  id: string
  title: string
  /** The group it is in today; non-null makes adding it here a move. */
  groupId: string | null
  /** Second line: enough to tell two similarly named resources apart. */
  preview?: string | null
}

const TABS: { kind: GroupContentKind; label: string }[] = [
  { kind: 'notes', label: 'Notes' },
  { kind: 'decks', label: 'Decks' },
  { kind: 'quizzes', label: 'Quizzes' },
]

const TAB_ICONS: Record<GroupContentKind, typeof IconNote> = {
  notes: IconNote,
  decks: IconDeck,
  quizzes: IconQuiz,
}

const EMPTY_MESSAGES: Record<GroupContentKind, string> = {
  notes: 'You have not summarised a note yet.',
  decks: 'You have not generated a flashcard deck yet.',
  quizzes: 'You have not generated a quiz yet.',
}

interface GroupContentPickerDialogProps {
  groupId: string
  groupName: string
  onClose: () => void
}

/**
 * Puts existing notes, decks, and quizzes into one group. Each kind is a tab
 * over its own list query, so a list that fails to load costs only its own tab
 * and the rest of the dialog keeps working.
 *
 * Anything already in another group is shown with that group's name and is
 * confirmed as a move, since a resource can only be in one group at a time.
 */
export function GroupContentPickerDialog({
  groupId,
  groupName,
  onClose,
}: GroupContentPickerDialogProps) {
  const notes = useNotes()
  const decks = useFlashcardDecks()
  const quizzes = useQuizzes()
  const groups = useGroups()
  const addToGroup = useAddToGroup()

  const [kind, setKind] = useState<GroupContentKind>('notes')
  const [search, setSearch] = useState('')
  const [pendingMove, setPendingMove] = useState<PickerItem | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  // Explicit per-kind mapping: `deckId` becomes `id` here, and only here.
  const items: Record<GroupContentKind, PickerItem[]> = {
    notes: (notes.data ?? []).map((note) => ({
      id: note.id,
      title: note.title,
      groupId: note.groupId,
      preview: note.overview,
    })),
    decks: (decks.data ?? []).map((deck) => ({
      id: deck.deckId,
      title: deck.title,
      groupId: deck.groupId,
      // `title` on a saved flashcard is the question, not a heading.
      preview: deck.flashcards[0]?.title,
    })),
    quizzes: (quizzes.data ?? []).map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      groupId: quiz.groupId,
      preview: quiz.description,
    })),
  }

  const queries: Record<GroupContentKind, UseQueryResult<unknown>> = {
    notes,
    decks,
    quizzes,
  }
  const query = queries[kind]
  const all = items[kind]
  const term = search.trim().toLowerCase()
  const visible = all.filter(
    (item) =>
      !term ||
      item.title.toLowerCase().includes(term) ||
      item.preview?.toLowerCase().includes(term),
  )

  /** Group names, so a row can say where a resource is rather than show an ID. */
  const groupNames = new Map((groups.data ?? []).map((group) => [group.id, group.name]))

  function add(item: PickerItem) {
    setErrorMessage('')
    addToGroup.mutate(
      { groupId, kind, resourceId: item.id, fromGroupId: item.groupId },
      {
        onSuccess: () => setPendingMove(null),
        onError: (error) => setErrorMessage(toFormMessage(error)),
      },
    )
  }

  function choose(item: PickerItem) {
    setErrorMessage('')
    if (item.groupId && item.groupId !== groupId) {
      setPendingMove(item)
      return
    }
    add(item)
  }

  if (pendingMove) {
    const fromName = pendingMove.groupId
      ? (groupNames.get(pendingMove.groupId) ?? 'its current group')
      : 'its current group'
    return (
      <Dialog title="Move to this group?" onClose={onClose}>
        <MoveConfirmation
          detail={`Move ‘${pendingMove.title}’ from ${fromName} to ${groupName}? It can only be in one group, so it leaves ${fromName}.`}
          isPending={addToGroup.isPending}
          errorMessage={errorMessage}
          onConfirm={() => add(pendingMove)}
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
      title="Add to this group"
      description={`Pick what belongs in ${groupName}. Nothing is copied, a resource lives in one group at a time.`}
      size="lg"
      onClose={onClose}
    >
      <div className="mt-6 grid min-h-0 gap-4">
        {errorMessage && <FormAlert message={errorMessage} />}

        <div
          className="inline-flex flex-wrap gap-1 self-start rounded-sm border border-border bg-surface-alt p-1"
          role="group"
          aria-label="Filter by type"
        >
          {TABS.map((tab) => {
            const active = kind === tab.kind
            return (
              <button
                key={tab.kind}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setKind(tab.kind)
                  setErrorMessage('')
                }}
                className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3.5 py-2 text-sm font-bold transition-colors duration-150 ${
                  active
                    ? 'cursor-default bg-surface text-accent-strong shadow-sm'
                    : 'cursor-pointer text-text-muted hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <input
          type="search"
          className={fieldInput}
          placeholder="Search your library"
          aria-label="Search your library"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="min-h-0 overflow-y-auto">
          {query.isPending && <PickerSkeleton rows={4} />}

          {query.isError && <PickerError error={query.error} onRetry={() => void query.refetch()} />}

          {query.isSuccess && all.length === 0 && <p className={pickerPanel}>{EMPTY_MESSAGES[kind]}</p>}

          {query.isSuccess && all.length > 0 && visible.length === 0 && (
            <p className={pickerPanel}>Nothing here matches your search.</p>
          )}

          {visible.length > 0 && (
            <ul className="grid list-none gap-2">
              {visible.map((item) => {
                const Icon = TAB_ICONS[kind]
                const isHere = item.groupId === groupId
                const elsewhere = item.groupId && !isHere ? groupNames.get(item.groupId) : null
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => choose(item)}
                      disabled={isHere || addToGroup.isPending}
                      className={`flex w-full items-center gap-3 rounded-sm border px-3.5 py-3 text-left transition-colors duration-150 ${
                        isHere
                          ? 'cursor-default border-accent-solid/40 bg-accent-soft/50'
                          : 'cursor-pointer border-border bg-surface hover:border-accent-solid hover:bg-surface-alt/60 disabled:cursor-not-allowed disabled:opacity-60'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0 text-accent-solid" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-text">
                          {item.title}
                        </span>
                        {elsewhere && (
                          <span className="block truncate text-xs text-text-muted">
                            Currently in {elsewhere}
                          </span>
                        )}
                      </span>
                      {isHere && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-accent-strong">
                          <IconCheck className="h-3.5 w-3.5" />
                          Already here
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
          <button type="button" className={btnGhostSm} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Dialog>
  )
}
