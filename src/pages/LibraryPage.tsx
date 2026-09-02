import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { AppLink } from '../components/AppLink'
import { BackLink } from '../components/BackLink'
import { LibraryCard } from '../components/LibraryCard'
import { DifficultyStars } from '../components/DifficultyStars'
import {
  IconArrowRight,
  IconCard,
  IconChart,
  IconCheck,
  IconDeck,
  IconNote,
  IconPin,
  IconQuiz,
  IconSummary,
} from '../components/icons'
import { btnGhostSm, btnPrimaryLg, cardLink, fieldInput, shell, surfaceCard } from '../components/ui'
import { toReasonMessage } from '../lib/apiErrors'
import { SEARCH_QUERY_MAX_LENGTH } from '../lib/validation'
import { DASHBOARD_BACK } from '../lib/backTrail'
import { formatRelative } from '../lib/formatDate'
import { pinnedSlice } from '../lib/pinned'
import { plural } from '../lib/plural'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import {
  useFlashcardDecksSearch,
  useNotesSearch,
  useQuizzesSearch,
  useUserTimeZone,
} from '../lib/queries'
import type { UseInfiniteQueryResult } from '@tanstack/react-query'

type Kind = 'all' | 'notes' | 'decks' | 'quizzes'
type ContentKind = Exclude<Kind, 'all'>

const KINDS: { value: Kind; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'notes', label: 'Notes' },
  { value: 'decks', label: 'Decks' },
  { value: 'quizzes', label: 'Quizzes' },
]

/** Pinning is a status, not a fourth type, so it rides beside `type` in the URL. */
const PINNED_PARAM = 'pinned'
const PINNED_VALUE = '1'

function isKind(value: string | null): value is Kind {
  return value !== null && KINDS.some((kind) => kind.value === value)
}

const EMPTY_MESSAGES: Record<ContentKind, string> = {
  notes: 'Your summarised notes will show up here.',
  decks: 'Decks you generate from a note will show up here.',
  quizzes: 'Quizzes you generate from a note will show up here.',
}

const PINNED_EMPTY_MESSAGES: Record<ContentKind, string> = {
  notes: "You haven't pinned any notes yet.",
  decks: "You haven't pinned any decks yet.",
  quizzes: "You haven't pinned any quizzes yet.",
}

const PINNED_EMPTY_HINT =
  'Open a note, deck, or quiz and choose Pin to keep it at the top of your library.'
const PINNED_SEARCH_EMPTY = 'None of your pinned items match your search.'

/** Reads as a gap waiting to be filled, rather than as a card with nothing in it. */
const placeholderPanel =
  'rounded-md border border-dashed border-border bg-surface-alt px-6 py-7 text-center text-sm text-text-muted'

function CardSkeleton() {
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

type PagedQuery = Pick<
  UseInfiniteQueryResult,
  | 'isPending'
  | 'isError'
  | 'error'
  | 'refetch'
  | 'isSuccess'
  | 'hasNextPage'
  | 'isFetchingNextPage'
  | 'isFetchNextPageError'
  | 'fetchNextPage'
>

/**
 * Completes the pinned view of one paged section. The list endpoints have no
 * pinned-only parameter, but they order pinned records first and keep that order
 * across pages, so pulling pages until an unpinned record appears reaches every
 * pinned one without walking the whole library.
 */
function useCompletePinnedPages(enabled: boolean, isComplete: boolean, query: PagedQuery): void {
  const { hasNextPage, isFetchingNextPage, isError, isFetchNextPageError, fetchNextPage } = query
  const needsMore =
    enabled &&
    !isComplete &&
    hasNextPage &&
    !isFetchingNextPage &&
    !isError &&
    !isFetchNextPageError

  useEffect(() => {
    if (needsMore) void fetchNextPage()
  }, [needsMore, fetchNextPage])
}

interface SectionProps {
  title: string
  query: PagedQuery
  /**
   * The search's `totalElements`, or the pinned count once that prefix is loaded.
   * Undefined while it is unknown, so no inaccurate count is shown.
   */
  total: number | undefined
  shown: number
  emptyMessage: string
  showLoadMore: boolean
  isAutoLoading: boolean
  children: ReactNode
}

function Section({
  title,
  query,
  total,
  shown,
  emptyMessage,
  showLoadMore,
  isAutoLoading,
  children,
}: SectionProps) {
  const isSettled = !query.isPending && !query.isError

  return (
    <section className="mt-12 first:mt-10">
      <h2 className="mb-5 text-xl">{title}</h2>

      {query.isPending && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((row) => (
            <CardSkeleton key={row} />
          ))}
        </div>
      )}

      {query.isError && (
        <div className={`${surfaceCard} app-content-in grid justify-items-start gap-2.5 p-6`}>
          <p className="text-sm text-text-muted">
            We could not load these. {toReasonMessage(query.error)}
          </p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="text-sm font-bold text-accent-foreground hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {isSettled && total === 0 && (
        <p className={`${placeholderPanel} app-content-in`}>{emptyMessage}</p>
      )}

      {shown > 0 && (
        <div className="app-content-in grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
      )}

      {isSettled && showLoadMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            className={`${btnGhostSm} disabled:cursor-not-allowed disabled:opacity-60`}
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {isSettled && !showLoadMore && isAutoLoading && (
        <p className="mt-6 text-center text-sm text-text-muted" role="status">
          Loading the rest of your pinned items…
        </p>
      )}
    </section>
  )
}

export function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const kindParam = searchParams.get('type')
  const kind: Kind = isKind(kindParam) ? kindParam : 'all'
  const pinnedOnly = searchParams.get(PINNED_PARAM) === PINNED_VALUE

  const [search, setSearch] = useState('')
  const term = useDebouncedValue(search).trim()
  const isSearching = term.length > 0

  const timeZone = useUserTimeZone()
  const notes = useNotesSearch(term)
  const decks = useFlashcardDecksSearch(term)
  const quizzes = useQuizzesSearch(term)

  const loadedNotes = notes.data?.pages.flatMap((page) => page.notes ?? []) ?? []
  const loadedDecks = decks.data?.pages.flatMap((page) => page.flashcardDecks ?? []) ?? []
  const loadedQuizzes = quizzes.data?.pages.flatMap((page) => page.quizzes ?? []) ?? []

  const notePins = pinnedSlice(loadedNotes, notes)
  const deckPins = pinnedSlice(loadedDecks, decks)
  const quizPins = pinnedSlice(loadedQuizzes, quizzes)

  const showNotes = kind === 'all' || kind === 'notes'
  const showDecks = kind === 'all' || kind === 'decks'
  const showQuizzes = kind === 'all' || kind === 'quizzes'

  useCompletePinnedPages(pinnedOnly && showNotes, notePins.isComplete, notes)
  useCompletePinnedPages(pinnedOnly && showDecks, deckPins.isComplete, decks)
  useCompletePinnedPages(pinnedOnly && showQuizzes, quizPins.isComplete, quizzes)

  const visibleNotes = pinnedOnly ? notePins.items : loadedNotes
  const visibleDecks = pinnedOnly ? deckPins.items : loadedDecks
  const visibleQuizzes = pinnedOnly ? quizPins.items : loadedQuizzes

  const noteTotal = notes.data?.pages[0]?.totalElements
  const deckTotal = decks.data?.pages[0]?.totalElements
  const quizTotal = quizzes.data?.pages[0]?.totalElements

  const allLoaded = notes.isSuccess && decks.isSuccess && quizzes.isSuccess
  const isLibraryEmpty =
    allLoaded && !isSearching && noteTotal === 0 && deckTotal === 0 && quizTotal === 0

  function pinnedCount(slice: { items: unknown[]; isComplete: boolean }): number | undefined {
    return slice.isComplete ? slice.items.length : undefined
  }
  const noteCount = pinnedOnly ? pinnedCount(notePins) : noteTotal
  const deckCount = pinnedOnly ? pinnedCount(deckPins) : deckTotal
  const quizCount = pinnedOnly ? pinnedCount(quizPins) : quizTotal
  const everyCount =
    noteCount === undefined || deckCount === undefined || quizCount === undefined
      ? undefined
      : noteCount + deckCount + quizCount

  let summary = 'Everything you have made, in one place.'
  if (pinnedOnly) {
    summary = 'The notes, decks, and quizzes you have pinned.'
  } else if (allLoaded && !isSearching && !isLibraryEmpty) {
    summary = `${plural(noteTotal ?? 0, 'note')}, ${plural(deckTotal ?? 0, 'deck')}, and ${plural(
      quizTotal ?? 0,
      'quiz',
      'quizzes',
    )}.`
  }

  function setFilters(next: { kind?: Kind; pinned?: boolean }) {
    const nextKind = next.kind ?? kind
    const nextPinned = next.pinned ?? pinnedOnly
    const params: Record<string, string> = {}
    if (nextKind !== 'all') params.type = nextKind
    if (nextPinned) params[PINNED_PARAM] = PINNED_VALUE

    setSearchParams(params, { replace: true, state: location.state })
  }

  const counts: Record<Kind, number | undefined> = {
    all: pinnedOnly
      ? everyCount
      : allLoaded
        ? (noteTotal ?? 0) + (deckTotal ?? 0) + (quizTotal ?? 0)
        : undefined,
    notes: noteCount,
    decks: deckCount,
    quizzes: quizCount,
  }

  function emptyMessageFor(contentKind: ContentKind): string {
    if (isSearching) {
      return pinnedOnly ? PINNED_SEARCH_EMPTY : 'Nothing here matches your search.'
    }
    return pinnedOnly ? PINNED_EMPTY_MESSAGES[contentKind] : EMPTY_MESSAGES[contentKind]
  }

  const shownPinnedSlices = [
    showNotes ? notePins : null,
    showDecks ? deckPins : null,
    showQuizzes ? quizPins : null,
  ].filter((slice) => slice !== null)
  const isPinnedViewEmpty =
    pinnedOnly && shownPinnedSlices.every((slice) => slice.isComplete && slice.items.length === 0)

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        <BackLink fallback={DASHBOARD_BACK} className={cardLink} />

        <h1 className="mt-5 text-3xl">Your library</h1>
        <p className="mt-3 max-w-[58ch] text-base text-text-muted">{summary}</p>

        {isLibraryEmpty ? (
          <div className={`${surfaceCard} mt-10 px-6 py-14 text-center`}>
            <h2 className="text-xl">Nothing here yet</h2>
            <p className="mx-auto mt-2.5 max-w-[46ch] text-base text-text-muted">
              Summarise a note and it will show up here, along with any decks and quizzes you build
              from it.
            </p>
            <AppLink to="/notes/new" className={`${btnPrimaryLg} mt-7`}>
              Summarise your first note
              <IconArrowRight />
            </AppLink>
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <input
                type="search"
                className={`${fieldInput} max-w-100 flex-1`}
                placeholder="Search by title"
                aria-label="Search your library by title"
                maxLength={SEARCH_QUERY_MAX_LENGTH}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <div
                className="inline-flex flex-wrap gap-1 rounded-sm border border-border bg-surface-alt p-1"
                role="group"
                aria-label="Filter by type"
              >
                {KINDS.map((option) => {
                  const active = kind === option.value
                  const count = counts[option.value]
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilters({ kind: option.value })}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3.5 py-2 text-sm font-bold transition-colors duration-150 ${
                        active
                          ? 'cursor-default bg-surface text-accent-strong shadow-sm'
                          : 'cursor-pointer text-text-muted hover:text-text'
                      }`}
                    >
                      {option.label}
                      {count !== undefined && (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-normal text-accent-foreground tabular-nums">
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                aria-pressed={pinnedOnly}
                onClick={() => setFilters({ pinned: !pinnedOnly })}
                className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm border px-4.5 py-3 text-sm font-bold transition-colors duration-150 ${
                  pinnedOnly
                    ? 'border-warning-solid/40 bg-warning-soft text-warning-solid'
                    : 'border-border bg-surface-alt text-text-muted hover:text-text'
                }`}
              >
                <IconPin className="h-4 w-4" filled={pinnedOnly} />
                Pinned
              </button>
            </div>

            {isPinnedViewEmpty ? (
              <div className={`${placeholderPanel} mt-10`}>
                <p>
                  {isSearching
                    ? PINNED_SEARCH_EMPTY
                    : kind === 'all'
                      ? "You haven't pinned anything yet."
                      : PINNED_EMPTY_MESSAGES[kind]}
                </p>
                {!isSearching && <p className="mt-2">{PINNED_EMPTY_HINT}</p>}
              </div>
            ) : (
              <>
                {showNotes && (
                  <Section
                    key={`notes-${kind}-${pinnedOnly}`}
                    title="Notes"
                    query={notes}
                    total={noteCount}
                    shown={visibleNotes.length}
                    emptyMessage={emptyMessageFor('notes')}
                    showLoadMore={!pinnedOnly && notes.hasNextPage}
                    isAutoLoading={pinnedOnly && notes.isFetchingNextPage}
                  >
                    {visibleNotes.map((note) => (
                      <LibraryCard
                        key={note.id}
                        to={`/notes/${note.id}`}
                        icon={<IconNote />}
                        title={note.title}
                        preview={note.overview}
                        pinned={note.pinned}
                        facts={[
                          {
                            key: 'key-points',
                            icon: <IconCheck />,
                            content: plural(note.keypoints.length, 'key point'),
                          },
                          {
                            key: 'concepts',
                            icon: <IconSummary />,
                            content: plural(note.concepts.length, 'concept'),
                          },
                          {
                            key: 'terms',
                            icon: <IconNote />,
                            content: plural(note.importantTerms.length, 'term'),
                          },
                        ]}
                      />
                    ))}
                  </Section>
                )}

                {showDecks && (
                  <Section
                    key={`decks-${kind}-${pinnedOnly}`}
                    title="Flashcard decks"
                    query={decks}
                    total={deckCount}
                    shown={visibleDecks.length}
                    emptyMessage={emptyMessageFor('decks')}
                    showLoadMore={!pinnedOnly && decks.hasNextPage}
                    isAutoLoading={pinnedOnly && decks.isFetchingNextPage}
                  >
                    {visibleDecks.map((deck) => (
                      <LibraryCard
                        key={deck.deckId}
                        icon={<IconDeck />}
                        title={deck.title}
                        to={`/flashcards/${deck.deckId}`}
                        // `title` on a saved flashcard is the question, not a heading.
                        preview={deck.flashcards[0]?.title}
                        pinned={deck.pinned}
                        facts={[
                          {
                            key: 'cards',
                            icon: <IconCard />,
                            content: plural(deck.flashcards.length, 'card'),
                          },
                        ]}
                      />
                    ))}
                  </Section>
                )}

                {showQuizzes && (
                  <Section
                    key={`quizzes-${kind}-${pinnedOnly}`}
                    title="Quizzes"
                    query={quizzes}
                    total={quizCount}
                    shown={visibleQuizzes.length}
                    emptyMessage={emptyMessageFor('quizzes')}
                    showLoadMore={!pinnedOnly && quizzes.hasNextPage}
                    isAutoLoading={pinnedOnly && quizzes.isFetchingNextPage}
                  >
                    {visibleQuizzes.map((quiz) => (
                      <LibraryCard
                        key={quiz.id}
                        icon={<IconQuiz />}
                        title={quiz.title}
                        to={`/quiz/${quiz.id}`}
                        preview={quiz.description}
                        pinned={quiz.pinned}
                        facts={[
                          {
                            key: 'questions',
                            icon: <IconQuiz />,
                            content: plural(quiz.questions.length, 'question'),
                          },
                          {
                            key: 'difficulty',
                            icon: <IconChart />,
                            content:
                              quiz.difficulty === null ? (
                                'No difficulty set'
                              ) : (
                                <DifficultyStars value={quiz.difficulty} />
                              ),
                          },
                        ]}
                        timestamp={formatRelative(quiz.createdAt, timeZone)}
                      />
                    ))}
                  </Section>
                )}
              </>
            )}
          </>
        )}
      </main>
    </>
  )
}
