import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { AppHeader } from '../components/AppHeader'
import { AppLink } from '../components/AppLink'
import { BackLink } from '../components/BackLink'
import { FormAlert } from '../components/FormAlert'
import { GenerationStatus } from '../components/GenerationStatus'
import { GroupMembershipControl } from '../components/GroupMembershipControl'
import { NoteEditDialog } from '../components/NoteEditDialog'
import { PinToggle } from '../components/PinToggle'
import { useStreakCelebration } from '../components/StreakCelebrationContext'
import {
  IconArrowRight,
  IconDeck,
  IconPencil,
  IconQuiz,
  IconSpinner,
  IconTrash,
} from '../components/icons'
import {
  btnDangerGhostSm,
  btnDangerSm,
  btnGhostSm,
  btnPrimaryDisabled,
  btnPrimarySm,
  cardLink,
  countPill,
  shell,
  surfaceCard,
} from '../components/ui'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import { DASHBOARD_BACK, useTrailNavigate } from '../lib/backTrail'
import { usePinNote } from '../lib/pinMutations'
import { queryClient } from '../lib/queryClient'
import { queryKeys, useNote } from '../lib/queries'
import { api } from '../api'
import type { NoteSummary, UpdateNoteRequest } from '../api'

const ICON = 'h-4 w-4'

/** Narration for the one long synchronous generation call, per resource type. */
const STEPS = {
  deck: [
    'Reading your note…',
    'Writing flashcards…',
    'Still working. Bigger notes make bigger decks…',
  ],
  quiz: [
    'Reading your note…',
    'Writing ten questions…',
    'Still working. Writing good answers takes a moment…',
  ],
} as const

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/** Failures of a generate call started from this note. */
function messageForGenerateFailure(error: unknown, noun: 'deck' | 'quiz'): string {
  if (isStatus(error, 404)) {
    return 'This note no longer exists. It may have just been deleted.'
  }
  if (isStatus(error, 400)) {
    return `We could not build a ${noun} from this note.`
  }
  if (isStatus(error, 502)) {
    return `The AI service could not build a ${noun} just now. Nothing was saved, so you can try again in a moment.`
  }
  return toFormMessage(error)
}

/** Matches the recents-card skeleton, so a cold load reads the same everywhere. */
function NoteSkeleton() {
  return (
    <div className="grid gap-6" aria-hidden="true">
      <div className="grid gap-3">
        <span className="block h-8 w-2/3 animate-pulse rounded-sm bg-surface-alt" />
        <span className="block h-4 w-40 animate-pulse rounded-full bg-surface-alt" />
      </div>
      <div className={`${surfaceCard} grid gap-3 p-6`}>
        {[0, 1, 2].map((row) => (
          <span key={row} className="block h-3.5 w-full animate-pulse rounded-full bg-surface-alt" />
        ))}
      </div>
    </div>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children: ReactNode
}) {
  return (
    <section className={surfaceCard}>
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <h2 className="mr-auto text-base font-medium">{title}</h2>
        {count !== undefined && <span className={countPill}>{count}</span>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

type Confirming = 'deck' | 'quiz' | 'delete' | null

function NoteContent({ note }: { note: NoteSummary }) {
  const navigate = useNavigate()
  // A deck or quiz generated here was reached *from* this note, so it carries
  // the note on its trail. Deletion uses the plain navigate below: a note that
  // no longer exists is not somewhere to offer a way back to.
  const generatedNavigate = useTrailNavigate()
  const { recordQualifyingAction } = useStreakCelebration()

  const [confirming, setConfirming] = useState<Confirming>(null)
  const [actionError, setActionError] = useState('')
  const [step, setStep] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState('')

  const makeDeck = useMutation({
    mutationFn: () => recordQualifyingAction(() => api.flashcards.generate(note.id)),
    onSuccess: (deck) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDecks, exact: true })
      // The generation response has no card IDs, so the deck page fetches the
      // saved deck itself; we only hand it the destination.
      generatedNavigate(`/flashcards/${deck.deckId}`, { replace: true })
    },
    onError: (error) => {
      setConfirming(null)
      setActionError(messageForGenerateFailure(error, 'deck'))
    },
  })

  const makeQuiz = useMutation({
    mutationFn: () => recordQualifyingAction(() => api.quiz.generate(note.id)),
    onSuccess: (quiz) => {
      // The generate response is the whole quiz, so the detail view needs no refetch.
      queryClient.setQueryData(queryKeys.quiz(quiz.id), quiz)
      void queryClient.invalidateQueries({ queryKey: queryKeys.quizzes, exact: true })
      generatedNavigate(`/quiz/${quiz.id}`, { replace: true })
    },
    onError: (error) => {
      setConfirming(null)
      setActionError(messageForGenerateFailure(error, 'quiz'))
    },
  })

  const updateNote = useMutation({
    mutationFn: (body: UpdateNoteRequest) => api.notes.update(note.id, body),
    onSuccess: (updated) => {
      // The PATCH response is the complete updated summary, so the detail view
      // updates at once; the list feeds the library, dashboard, and any group.
      queryClient.setQueryData(queryKeys.note(note.id), updated)
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes, exact: true })
      if (updated.groupId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.group(updated.groupId) })
      }
      setIsEditing(false)
    },
    onError: (error) => {
      setEditError(
        isStatus(error, 404)
          ? 'This note no longer exists. It may have just been deleted.'
          : `We could not save your changes. ${toFormMessage(error)}`,
      )
    },
  })

  const pinNote = usePinNote(note.id)

  const deleteNote = useMutation({
    mutationFn: () => api.notes.remove(note.id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.note(note.id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes, exact: true })
      navigate('/library?type=notes', { replace: true })
    },
    onError: (error) => {
      setConfirming(null)
      setActionError(
        isStatus(error, 404)
          ? 'That note has already been deleted.'
          : `We could not delete this note. ${toFormMessage(error)}`,
      )
    },
  })

  const generatingNoun = makeDeck.isPending ? 'deck' : makeQuiz.isPending ? 'quiz' : null
  const isBusy =
    generatingNoun !== null || deleteNote.isPending || updateNote.isPending || pinNote.isPending

  // The narration step only advances while a generate call is in flight; it is
  // reset when a run is started (below), like the other generate flows.
  useEffect(() => {
    if (!generatingNoun) return
    const timers = [
      window.setTimeout(() => setStep(1), 8_000),
      window.setTimeout(() => setStep(2), 30_000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [generatingNoun])

  function ask(next: Exclude<Confirming, null>) {
    setActionError('')
    setConfirming(next)
  }

  function startMakeDeck() {
    setStep(0)
    makeDeck.mutate()
  }

  function startMakeQuiz() {
    setStep(0)
    makeQuiz.mutate()
  }

  const showFeedback = Boolean(actionError) || generatingNoun !== null || confirming !== null

  return (
    <>
      <h1 className="text-3xl">{note.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={countPill}>{plural(note.keypoints.length, 'key point')}</span>
        <span className={countPill}>{plural(note.concepts.length, 'concept')}</span>
        <span className={countPill}>{plural(note.importantTerms.length, 'term')}</span>
      </div>

      <div className="mt-3">
        <GroupMembershipControl
          kind="notes"
          resourceId={note.id}
          resourceTitle={note.title}
          groupId={note.groupId}
        />
      </div>

      {/* Turn this note into study material on the left; remove it on the right. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={`${btnPrimarySm} ${btnPrimaryDisabled}`}
            onClick={() => ask('deck')}
            disabled={isBusy || confirming !== null}
          >
            <IconDeck className={ICON} />
            Make deck
          </button>
          <button
            type="button"
            className={`${btnPrimarySm} ${btnPrimaryDisabled}`}
            onClick={() => ask('quiz')}
            disabled={isBusy || confirming !== null}
          >
            <IconQuiz className={ICON} />
            Make quiz
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PinToggle
            pinned={note.pinned}
            noun="note"
            isPending={pinNote.isPending}
            disabled={isBusy || confirming !== null}
            onToggle={(next) => {
              setActionError('')
              pinNote.mutate(next, {
                onError: (error) =>
                  setActionError(
                    isStatus(error, 404)
                      ? 'This note no longer exists. It may have just been deleted.'
                      : `We could not ${next ? 'pin' : 'unpin'} this note. ${toFormMessage(error)}`,
                  ),
              })
            }}
          />
          <button
            type="button"
            className={btnGhostSm}
            onClick={() => {
              setActionError('')
              setEditError('')
              setIsEditing(true)
            }}
            disabled={isBusy || confirming !== null}
          >
            <IconPencil />
            Edit note
          </button>
          <button
            type="button"
            className={btnDangerGhostSm}
            onClick={() => ask('delete')}
            disabled={isBusy || confirming !== null}
          >
            <IconTrash />
            Delete note
          </button>
        </div>
      </div>

      {showFeedback && (
        <div className="mt-6 grid gap-6">
          {actionError && <FormAlert message={actionError} />}

          {generatingNoun && (
            <GenerationStatus
              label={STEPS[generatingNoun][step] ?? STEPS[generatingNoun][0]}
              hint="This usually takes under a minute. Keep this tab open."
            />
          )}

          {confirming === 'deck' && !makeDeck.isPending && (
            <section className={`${surfaceCard} p-6`}>
              <h2 className="text-base font-medium">Generate a flashcard deck from this note?</h2>
              <p className="mt-2 max-w-[60ch] text-sm text-text-muted">
                Synapse turns this note's concepts and key points into a deck. It takes about a
                minute.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className={btnPrimarySm} onClick={startMakeDeck}>
                  Generate deck
                </button>
                <button type="button" className={btnGhostSm} onClick={() => setConfirming(null)}>
                  Cancel
                </button>
              </div>
            </section>
          )}

          {confirming === 'quiz' && !makeQuiz.isPending && (
            <section className={`${surfaceCard} p-6`}>
              <h2 className="text-base font-medium">Generate a quiz from this note?</h2>
              <p className="mt-2 max-w-[60ch] text-sm text-text-muted">
                Synapse writes a ten-question quiz from this note. It takes about a minute.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className={btnPrimarySm} onClick={startMakeQuiz}>
                  Generate quiz
                </button>
                <button type="button" className={btnGhostSm} onClick={() => setConfirming(null)}>
                  Cancel
                </button>
              </div>
            </section>
          )}

          {confirming === 'delete' && (
            <section className="rounded-md border border-error-solid bg-error-soft p-6">
              <h2 className="text-base font-medium text-error-solid">Delete this note?</h2>
              <p className="mt-2 max-w-[60ch] text-sm text-text">
                “{note.title}” and its summary will be removed. This cannot be undone. Decks and
                quizzes you already made from it are kept.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className={btnDangerSm}
                  onClick={() => deleteNote.mutate()}
                  disabled={deleteNote.isPending}
                >
                  {deleteNote.isPending && <IconSpinner className="h-4 w-4" />}
                  {deleteNote.isPending ? 'Deleting…' : 'Delete note'}
                </button>
                <button
                  type="button"
                  className={btnGhostSm}
                  onClick={() => setConfirming(null)}
                  disabled={deleteNote.isPending}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6">
        <Section title="Overview">
          <p className="max-w-[72ch] text-base text-text">{note.overview}</p>
        </Section>

        {note.keypoints.length > 0 && (
          <Section title="Key points" count={note.keypoints.length}>
            <ul className="grid gap-3.5 p-0">
              {note.keypoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-text">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-solid"
                    aria-hidden="true"
                  />
                  <span className="max-w-[72ch]">{point}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {note.concepts.length > 0 && (
          <Section title="Concepts" count={note.concepts.length}>
            <dl className="m-0 grid gap-5">
              {note.concepts.map((concept) => (
                <div
                  key={concept.name}
                  className="border-b border-dashed border-border pb-5 last:border-b-0 last:pb-0"
                >
                  <dt className="text-sm font-bold text-text">{concept.name}</dt>
                  <dd className="m-0 mt-1.5 max-w-[72ch] text-sm text-text-muted">
                    {concept.explanation}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {note.importantTerms.length > 0 && (
          <Section title="Important terms" count={note.importantTerms.length}>
            <ul className="flex flex-wrap gap-2 p-0">
              {note.importantTerms.map((term) => (
                <li
                  key={term}
                  className="list-none rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent-strong"
                >
                  {term}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      {isEditing && (
        <NoteEditDialog
          initialValues={{ title: note.title, overview: note.overview }}
          isPending={updateNote.isPending}
          errorMessage={editError}
          onSubmit={(body) => {
            setEditError('')
            updateNote.mutate(body)
          }}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  )
}

/** One saved note summary. Where a finished generation lands. */
export function NotePage() {
  const { noteId } = useParams<{ noteId: string }>()
  const note = useNote(noteId)

  const isMissing = isStatus(note.error, 404)

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        <BackLink fallback={DASHBOARD_BACK} className={cardLink} />

        <div className="mt-5">
          {note.isPending && <NoteSkeleton />}

          {note.isError && (
            <div className={`${surfaceCard} max-w-150 p-8`}>
              <h1 className="text-3xl">{isMissing ? 'We could not find that note' : 'We could not load that note'}</h1>
              <p className="mt-3 text-base text-text-muted">
                {isMissing
                  ? 'It may have been deleted, or it belongs to another account.'
                  : toFormMessage(note.error)}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {!isMissing && (
                  <button type="button" className={btnGhostSm} onClick={() => void note.refetch()}>
                    Try again
                  </button>
                )}
                <AppLink to="/notes/new" className={cardLink}>
                  Summarise a note
                  <IconArrowRight />
                </AppLink>
              </div>
            </div>
          )}

          {note.isSuccess && <NoteContent note={note.data} />}
        </div>
      </main>
    </>
  )
}
