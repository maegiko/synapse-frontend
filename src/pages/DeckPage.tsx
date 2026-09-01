import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { AppHeader } from '../components/AppHeader'
import { AppLink } from '../components/AppLink'
import { BackLink } from '../components/BackLink'
import { CardEditDialog } from '../components/CardEditDialog'
import { DeckEditDialog } from '../components/DeckEditDialog'
import { FormAlert } from '../components/FormAlert'
import { GroupMembershipControl } from '../components/GroupMembershipControl'
import { PinToggle } from '../components/PinToggle'
import {
  IconArrowRight,
  IconPencil,
  IconPlay,
  IconPlus,
  IconSpinner,
  IconTrash,
  IconX,
} from '../components/icons'
import {
  btnDangerGhostSm,
  btnDangerSm,
  btnGhostSm,
  btnPrimaryDisabled,
  btnPrimarySm,
  countPill,
  cardLink,
  fieldError,
  fieldInput,
  fieldInputInvalid,
  fieldLabel,
  shell,
  surfaceCard,
} from '../components/ui'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import { DASHBOARD_BACK } from '../lib/backTrail'
import { usePinDeck } from '../lib/pinMutations'
import { plural } from '../lib/plural'
import { useFlashcardDeck, queryKeys } from '../lib/queries'
import { PlaybackModeControl } from '../components/PlaybackModeControl'
import { SHUFFLE_PARAM } from '../lib/shuffle'
import { queryClient } from '../lib/queryClient'
import { api } from '../api'
import type {
  FlashcardDeck,
  ReviewQueueDeck,
  SavedFlashcard,
  UpdateDeckRequest,
  UpdateFlashcardRequest,
} from '../api'

const placeholderPanel =
  'rounded-md border border-dashed border-border bg-surface-alt px-6 py-7 text-center text-sm text-text-muted'

/** An empty deck is the one case where playing is not possible. */
const PLAY_EMPTY_REASON = 'Add a card before you can play this deck.'

/** Matches the note skeleton, so a cold load reads the same on either page. */
function DeckSkeleton() {
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

interface CardRowProps {
  card: SavedFlashcard
  position: number
  /** Card-level deletes are confirmed one at a time, so only one row opens. */
  isConfirming: boolean
  isDeleting: boolean
  disabled: boolean
  onAskEdit: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}

function CardRow({
  card,
  position,
  isConfirming,
  isDeleting,
  disabled,
  onAskEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: CardRowProps) {
  return (
    <li
      className={`border-b border-dashed border-border px-6 py-5 last:border-b-0 ${
        isDeleting ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Fixed width so a two-digit number never shifts the content column. */}
        <span className="mt-0.5 w-6 shrink-0 text-right text-xs font-bold text-text-muted tabular-nums">
          {position}
        </span>
        <div className="min-w-0 flex-1">
          {/*
           * Only the question side is shown. Answers stay hidden here so the
           * deck is not spoiled before it is studied; `title` is the question.
           */}
          <p className="max-w-[72ch] text-sm font-bold text-text">{card.title}</p>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <button
            type="button"
            className="rounded-sm border border-transparent p-2 text-text-muted transition-colors duration-150 hover:border-accent-solid hover:bg-accent-soft hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onAskEdit}
            disabled={disabled || isConfirming}
          >
            <IconPencil />
            <span className="sr-only">Edit card {position}</span>
          </button>
          <button
            type="button"
            className="relative rounded-sm border border-transparent p-2 text-text-muted transition-colors duration-150 hover:border-error-solid hover:bg-error-soft hover:text-error-solid disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onAskDelete}
            disabled={disabled || isConfirming}
          >
            <IconTrash />
            <span className="sr-only">Delete card {position}</span>
          </button>
        </div>
      </div>

      {isConfirming && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-sm border border-error-solid bg-error-soft px-4 py-3">
          <p className="mr-auto text-sm font-semibold text-error-solid">Delete this card?</p>
          <button
            type="button"
            className={btnDangerSm}
            onClick={onConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting && <IconSpinner className="h-4 w-4" />}
            {isDeleting ? 'Deleting…' : 'Delete card'}
          </button>
          <button
            type="button"
            className={btnGhostSm}
            onClick={onCancelDelete}
            disabled={isDeleting}
          >
            Keep it
          </button>
        </div>
      )}
    </li>
  )
}

function DeckContent({ deck }: { deck: FlashcardDeck }) {
  const navigate = useNavigate()
  const questionId = useId()
  const answerId = useId()
  const questionRef = useRef<HTMLInputElement>(null)

  const [isAdding, setIsAdding] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ question?: string; answer?: string }>({})
  const [justAdded, setJustAdded] = useState(false)
  const [actionError, setActionError] = useState('')
  const [confirmingCardId, setConfirmingCardId] = useState<string | null>(null)
  const [isConfirmingDeck, setIsConfirmingDeck] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isEditingDeck, setIsEditingDeck] = useState(false)
  const [deckEditError, setDeckEditError] = useState('')
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [cardEditError, setCardEditError] = useState('')

  const cards = deck.flashcards ?? []
  const editingCard = editingCardId ? cards.find((card) => card.id === editingCardId) : undefined

  /** Both mutations change the card count the dashboard and library show. */
  async function refreshDeck() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDeck(deck.deckId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDecks, exact: true })
  }

  const addCard = useMutation({
    mutationFn: () =>
      api.flashcards.addCard(deck.deckId, { question: question.trim(), answer: answer.trim() }),
    onSuccess: async () => {
      setQuestion('')
      setAnswer('')
      setJustAdded(true)
      await refreshDeck()
    },
    onError: (error) => setActionError(messageForCardFailure(error, 'add')),
  })

  const updateDeck = useMutation({
    mutationFn: (body: UpdateDeckRequest) => api.flashcards.updateDeck(deck.deckId, body),
    onSuccess: (updated) => {
      // The response is the whole updated deck, so the detail view is current at
      // once. The list feeds the library, dashboard, and any group; the review
      // queue shows the deck title too.
      queryClient.setQueryData(queryKeys.flashcardDeck(deck.deckId), updated)
      void queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDecks, exact: true })
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviewQueue, exact: true })
      if (updated.groupId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.group(updated.groupId) })
      }
      setIsEditingDeck(false)
    },
    onError: (error) => {
      setDeckEditError(
        isStatus(error, 404)
          ? 'This deck no longer exists. It may have just been deleted.'
          : `We could not rename this deck. ${toFormMessage(error)}`,
      )
    },
  })

  const updateCard = useMutation({
    mutationFn: (vars: { cardId: string; body: UpdateFlashcardRequest }) =>
      api.flashcards.updateCard(deck.deckId, vars.cardId, vars.body),
    onSuccess: async () => {
      setEditingCardId(null)
      // Refetching keeps the cards in the backend's saved position order and
      // maps its `question` field back to the deck's `title`.
      await refreshDeck()
    },
    onError: (error) => setCardEditError(messageForCardFailure(error, 'edit')),
  })

  const deleteCard = useMutation({
    mutationFn: (cardId: string) => api.flashcards.removeCard(deck.deckId, cardId),
    onSuccess: async () => {
      setConfirmingCardId(null)
      await refreshDeck()
    },
    onError: (error) => {
      setConfirmingCardId(null)
      setActionError(messageForCardFailure(error, 'delete'))
    },
  })

  const pinDeck = usePinDeck(deck.deckId)

  const deleteDeck = useMutation({
    mutationFn: () => api.flashcards.remove(deck.deckId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.flashcardDeck(deck.deckId) })

      // A successful delete is definitive, so remove the deck from the cached
      // queue before navigating. Invalidating alone would leave the stale row
      // visible while the background refetch settles.
      queryClient.setQueryData<ReviewQueueDeck[]>(queryKeys.reviewQueue, (current) =>
        current?.filter((queuedDeck) => queuedDeck.deckId !== deck.deckId),
      )

      void queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDecks, exact: true })
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviewQueue, exact: true })
      // Mastery, overdue totals, and the due forecast all describe the deck
      // library as it stands now.
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics })

      if (deck.groupId) {
        // The group survives, but its contents and list-card count both lose
        // this deck.
        void queryClient.invalidateQueries({ queryKey: queryKeys.group(deck.groupId) })
        void queryClient.invalidateQueries({ queryKey: queryKeys.groups, exact: true })
      }

      navigate('/library?type=decks', { replace: true })
    },
    onError: (error) => {
      setIsConfirmingDeck(false)
      setActionError(
        isStatus(error, 404)
          ? 'That deck has already been deleted.'
          : `We could not delete this deck. ${toFormMessage(error)}`,
      )
    },
  })

  const isBusy =
    addCard.isPending ||
    deleteCard.isPending ||
    deleteDeck.isPending ||
    updateDeck.isPending ||
    updateCard.isPending ||
    pinDeck.isPending

  // Matches the profile form: the submit only lights up once both fields hold
  // something to send.
  const canAddCard = question.trim() !== '' && answer.trim() !== ''

  // Cards are usually added in runs, so the form stays open and takes focus
  // back. It has to wait for the request to settle, since the input is disabled
  // until then and a disabled input cannot be focused.
  useEffect(() => {
    if (justAdded && !addCard.isPending) questionRef.current?.focus()
  }, [justAdded, addCard.isPending])

  function handleAddCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActionError('')
    setJustAdded(false)

    // The backend requires both fields nonblank, so whitespace is not enough.
    const nextErrors: { question?: string; answer?: string } = {}
    if (!question.trim()) nextErrors.question = 'Write the question for this card.'
    if (!answer.trim()) nextErrors.answer = 'Write the answer for this card.'
    setFieldErrors(nextErrors)
    if (nextErrors.question || nextErrors.answer) return

    addCard.mutate()
  }

  function toggleAddForm() {
    setActionError('')
    setJustAdded(false)
    setFieldErrors({})
    setIsAdding((open) => !open)
  }

  return (
    <>
      <h1 className="text-3xl">{deck.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={countPill}>{plural(cards.length, 'card')}</span>
      </div>

      <div className="mt-3">
        <GroupMembershipControl
          kind="decks"
          resourceId={deck.deckId}
          resourceTitle={deck.title}
          groupId={deck.groupId}
        />
      </div>

      {/* Playback mode and Play deck on the left; card management pushed to the
          right. Bottom-aligned so the "Playback mode" label sits above. */}
      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <PlaybackModeControl
            value={isShuffled ? 'shuffle' : 'saved'}
            onChange={(mode) => setIsShuffled(mode === 'shuffle')}
          />
          {cards.length > 0 ? (
            <AppLink
              to={`/flashcards/${deck.deckId}/play${isShuffled ? `?${SHUFFLE_PARAM}=1` : ''}`}
              className={btnPrimarySm}
            >
              <IconPlay />
              Play deck
            </AppLink>
          ) : (
            <button
              type="button"
              className={`${btnPrimarySm} ${btnPrimaryDisabled}`}
              disabled
              title={PLAY_EMPTY_REASON}
            >
              <IconPlay />
              Play deck
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            className={btnGhostSm}
            onClick={toggleAddForm}
            aria-expanded={isAdding}
          >
            {isAdding ? <IconX /> : <IconPlus />}
            {isAdding ? 'Close card form' : 'Add a card'}
          </button>
          <PinToggle
            pinned={deck.pinned}
            noun="deck"
            isPending={pinDeck.isPending}
            disabled={isBusy || isConfirmingDeck}
            onToggle={(next) => {
              setActionError('')
              pinDeck.mutate(next, {
                onError: (error) =>
                  setActionError(
                    isStatus(error, 404)
                      ? 'This deck no longer exists. It may have just been deleted.'
                      : `We could not ${next ? 'pin' : 'unpin'} this deck. ${toFormMessage(error)}`,
                  ),
              })
            }}
          />
          <button
            type="button"
            className={btnGhostSm}
            onClick={() => {
              setDeckEditError('')
              setIsEditingDeck(true)
            }}
            disabled={isBusy || isConfirmingDeck}
          >
            <IconPencil />
            Rename deck
          </button>
          <button
            type="button"
            className={btnDangerGhostSm}
            onClick={() => {
              setActionError('')
              setIsConfirmingDeck(true)
            }}
            disabled={isBusy || isConfirmingDeck}
          >
            <IconTrash />
            Delete deck
          </button>
        </div>
      </div>
      {cards.length === 0 && (
        <p className="mt-2.5 text-xs text-text-muted">{PLAY_EMPTY_REASON}</p>
      )}

      <div className="mt-6 grid gap-6">
        {actionError && <FormAlert message={actionError} />}

        {isConfirmingDeck && (
          <section className="rounded-md border border-error-solid bg-error-soft p-6">
            <h2 className="text-base font-medium text-error-solid">Delete this deck?</h2>
            <p className="mt-2 max-w-[60ch] text-sm text-text">
              “{deck.title}” and all {plural(cards.length, 'card')} in it will be removed. This
              cannot be undone, though the note it came from is untouched.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className={btnDangerSm}
                onClick={() => deleteDeck.mutate()}
                disabled={deleteDeck.isPending}
              >
                {deleteDeck.isPending && <IconSpinner className="h-4 w-4" />}
                {deleteDeck.isPending ? 'Deleting…' : 'Delete deck'}
              </button>
              <button
                type="button"
                className={btnGhostSm}
                onClick={() => setIsConfirmingDeck(false)}
                disabled={deleteDeck.isPending}
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        {isAdding && (
          <form className={`${surfaceCard} p-6`} onSubmit={handleAddCard} noValidate>
            <h2 className="text-base font-medium">Add a card</h2>
            <p className="mt-1.5 text-sm text-text-muted">
              New cards are appended to the end of the deck.
            </p>

            <div className="mt-5 grid gap-4">
              <div>
                <label className={fieldLabel} htmlFor={questionId}>
                  Question
                </label>
                <input
                  id={questionId}
                  ref={questionRef}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="What is a cell?"
                  disabled={addCard.isPending}
                  aria-invalid={fieldErrors.question ? true : undefined}
                  aria-describedby={fieldErrors.question ? `${questionId}-error` : undefined}
                  className={`${fieldInput} ${fieldErrors.question ? fieldInputInvalid : ''}`}
                />
                {fieldErrors.question && (
                  <p className={fieldError} id={`${questionId}-error`}>
                    {fieldErrors.question}
                  </p>
                )}
              </div>

              <div>
                <label className={fieldLabel} htmlFor={answerId}>
                  Answer
                </label>
                <textarea
                  id={answerId}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="The basic unit of life."
                  rows={3}
                  disabled={addCard.isPending}
                  aria-invalid={fieldErrors.answer ? true : undefined}
                  aria-describedby={fieldErrors.answer ? `${answerId}-error` : undefined}
                  className={`${fieldInput} resize-y ${fieldErrors.answer ? fieldInputInvalid : ''}`}
                />
                {fieldErrors.answer && (
                  <p className={fieldError} id={`${answerId}-error`}>
                    {fieldErrors.answer}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className={`${btnPrimarySm} ${btnPrimaryDisabled}`}
                disabled={addCard.isPending || !canAddCard}
              >
                {addCard.isPending && <IconSpinner className="h-4 w-4" />}
                {addCard.isPending ? 'Adding…' : 'Add card'}
              </button>
              <button
                type="button"
                className={btnGhostSm}
                onClick={toggleAddForm}
                disabled={addCard.isPending}
              >
                Done
              </button>
              <p className="text-sm font-bold text-success-solid" role="status" aria-live="polite">
                {justAdded && !addCard.isPending ? 'Card added.' : ''}
              </p>
              {!canAddCard && !addCard.isPending && (
                <span className="text-xs text-text-muted">Fill in both fields to add the card.</span>
              )}
            </div>
          </form>
        )}

        <section className={surfaceCard}>
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <h2 className="mr-auto text-base font-medium">Cards</h2>
            <span className={countPill}>{cards.length}</span>
          </div>

          {cards.length === 0 ? (
            <div className="px-6 py-5">
              <p className={placeholderPanel}>
                This deck has no cards left. Add one to start building it back up.
              </p>
            </div>
          ) : (
            <ol className="m-0 list-none p-0">
              {cards.map((card, index) => (
                <CardRow
                  key={card.id}
                  card={card}
                  position={index + 1}
                  isConfirming={confirmingCardId === card.id}
                  isDeleting={deleteCard.isPending && deleteCard.variables === card.id}
                  disabled={isBusy || isConfirmingDeck}
                  onAskEdit={() => {
                    setActionError('')
                    setCardEditError('')
                    setConfirmingCardId(null)
                    setEditingCardId(card.id)
                  }}
                  onAskDelete={() => {
                    setActionError('')
                    setConfirmingCardId(card.id)
                  }}
                  onCancelDelete={() => setConfirmingCardId(null)}
                  onConfirmDelete={() => deleteCard.mutate(card.id)}
                />
              ))}
            </ol>
          )}
        </section>
      </div>

      {isEditingDeck && (
        <DeckEditDialog
          initialTitle={deck.title}
          isPending={updateDeck.isPending}
          errorMessage={deckEditError}
          onSubmit={(body) => {
            setDeckEditError('')
            updateDeck.mutate(body)
          }}
          onClose={() => setIsEditingDeck(false)}
        />
      )}

      {editingCard && (
        <CardEditDialog
          initialValues={{ question: editingCard.title, answer: editingCard.answer }}
          isPending={updateCard.isPending}
          errorMessage={cardEditError}
          onSubmit={(body) => {
            setCardEditError('')
            updateCard.mutate({ cardId: editingCard.id, body })
          }}
          onClose={() => setEditingCardId(null)}
        />
      )}
    </>
  )
}

/** Card-level failures, which are all recoverable without leaving the page. */
function messageForCardFailure(error: unknown, action: 'add' | 'edit' | 'delete'): string {
  if (isStatus(error, 404)) {
    if (action === 'add') return 'This deck no longer exists, so the card was not saved.'
    if (action === 'edit') {
      return 'This deck or card no longer exists, so your changes were not saved.'
    }
    return 'That card has already been deleted.'
  }
  if (isStatus(error, 400)) {
    return 'A card needs both a question and an answer.'
  }
  if (action === 'add') return `We could not add that card. ${toFormMessage(error)}`
  if (action === 'edit') return `We could not save that card. ${toFormMessage(error)}`
  return `We could not delete that card. ${toFormMessage(error)}`
}

/** One saved deck: its cards, and every action that changes them. */
export function DeckPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const deck = useFlashcardDeck(deckId)

  const isMissing = isStatus(deck.error, 404)

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        <BackLink fallback={DASHBOARD_BACK} className={cardLink} />

        <div className="mt-5">
          {deck.isPending && <DeckSkeleton />}

          {deck.isError && (
            <div className={`${surfaceCard} app-content-in max-w-150 p-8`}>
              <h1 className="text-3xl">
                {isMissing ? 'We could not find that deck' : 'We could not load that deck'}
              </h1>
              <p className="mt-3 text-base text-text-muted">
                {isMissing
                  ? 'It may have been deleted, or it belongs to another account.'
                  : toFormMessage(deck.error)}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {!isMissing && (
                  <button type="button" className={btnGhostSm} onClick={() => void deck.refetch()}>
                    Try again
                  </button>
                )}
                <AppLink to="/flashcards/new" className={cardLink}>
                  Generate a deck
                  <IconArrowRight />
                </AppLink>
              </div>
            </div>
          )}

          {deck.isSuccess && (
            <div className="app-content-in">
              <DeckContent deck={deck.data} />
            </div>
          )}
        </div>
      </main>
    </>
  )
}
