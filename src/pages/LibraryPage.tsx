import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { AppLink } from '../components/AppLink'
import { BackLink } from '../components/BackLink'
import { LibraryCard } from '../components/LibraryCard'
import { DifficultyStars } from '../components/DifficultyStars'
import { IconArrowRight, IconDeck, IconNote, IconPin, IconQuiz } from '../components/icons'
import { btnGhostSm, btnPrimaryLg, cardLink, fieldInput, shell, surfaceCard } from '../components/ui'
import { toFormMessage } from '../lib/apiErrors'
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
/** The three content types, i.e. every kind but the "everything" view. */
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

/** The slice of an infinite query's state these helpers and sections read. */
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
 * Completes the pinned view of one paged section.
 *
 * The list endpoints have no pinned-only parameter, but they do order pinned
 * records first and keep that order across pages, so the pinned records are a
 * prefix of the page sequence. Pulling pages until an unpinned record appears —
 * or until the pages run out — therefore reaches every pinned record without
 * walking the whole library.
 *
 * It cannot loop: each fetch either closes the prefix, exhausts `hasNextPage`,
 * or fails, and all three switch `needsMore` off. Nothing is fetched at all
 * while the filter is inactive, while a fetch is already in flight, or for a
 * content type the current type filter is hiding.
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
  /** The paged query behind this section, so one place handles all of its states. */
  query: PagedQuery
  /**
   * How many records this section has in total: the search's `totalElements`
   * normally, and the pinned count once the pinned prefix is fully loaded.
   * `undefined` while that is still unknown, so no inaccurate count is shown.
   */
  total: number | undefined
  shown: number
  /** Already resolved for the active search and pinned filters. */
  emptyMessage: string
  /** Hidden in the pinned view: a further page can only hold unpinned records. */
  showLoadMore: boolean
  /** True while the pinned view is pulling the rest of the pinned prefix itself. */
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
      {/* No count here — the filter tabs above already carry it. */}
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
            We could not load these. {toFormMessage(query.error)}
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

      {/* Nothing saved and nothing matched read differently, so they say different things. */}
      {isSettled && total === 0 && (
        <p className={`${placeholderPanel} app-content-in`}>{emptyMessage}</p>
      )}

      {shown > 0 && (
        <div className="app-content-in grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
      )}

      {/* Paged by hand rather than on scroll, so nothing loads that was not asked for. */}
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

      {/* The pinned view pages itself, so it reports rather than asks. */}
      {isSettled && !showLoadMore && isAutoLoading && (
        <p className="mt-6 text-center text-sm text-text-muted" role="status">
          Loading the rest of your pinned items…
        </p>
      )}
    </section>
  )
}

export function LibraryPage() {
  // The filters live in the URL, so they survive a refresh and the back button,
  // and the dashboard can link straight to one kind.
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const kindParam = searchParams.get('type')
  const kind: Kind = isKind(kindParam) ? kindParam : 'all'
  const pinnedOnly = searchParams.get(PINNED_PARAM) === PINNED_VALUE

  // Searching and paging are the backend's job now. The debounced term is what
  // the three queries are keyed on, so typing settles into one request per kind
  // and a new term starts from page 0 with a fresh list rather than appending.
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

  // The pinned prefix of each section, and whether all of it has been reached.
  const notePins = pinnedSlice(loadedNotes, notes)
  const deckPins = pinnedSlice(loadedDecks, decks)
  const quizPins = pinnedSlice(loadedQuizzes, quizzes)

  const showNotes = kind === 'all' || kind === 'notes'
  const showDecks = kind === 'all' || kind === 'decks'
  const showQuizzes = kind === 'all' || kind === 'quizzes'

  // Only the sections actually on screen are completed, so switching to one
  // type never pulls extra pages for the two it hides.
  useCompletePinnedPages(pinnedOnly && showNotes, notePins.isComplete, notes)
  useCompletePinnedPages(pinnedOnly && showDecks, deckPins.isComplete, decks)
  useCompletePinnedPages(pinnedOnly && showQuizzes, quizPins.isComplete, quizzes)

  const visibleNotes = pinnedOnly ? notePins.items : loadedNotes
  const visibleDecks = pinnedOnly ? deckPins.items : loadedDecks
  const visibleQuizzes = pinnedOnly ? quizPins.items : loadedQuizzes

  // Every page of a query carries the same totals, so the first one answers for all.
  const noteTotal = notes.data?.pages[0]?.totalElements
  const deckTotal = decks.data?.pages[0]?.totalElements
  const quizTotal = quizzes.data?.pages[0]?.totalElements

  const allLoaded = notes.isSuccess && decks.isSuccess && quizzes.isSuccess
  // Only an unsearched, empty result means the library itself is empty; a search
  // that matched nothing is answered inside each section instead.
  const isLibraryEmpty =
    allLoaded && !isSearching && noteTotal === 0 && deckTotal === 0 && quizTotal === 0

  // In the pinned view a section can only be counted once its pinned prefix is
  // complete; until then it has no number rather than a misleading one.
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

    // `replace`, so flicking through filters does not stack up history entries.
    // The location state is carried over by hand: `setSearchParams` drops it
    // otherwise, and with it the trail this page's own back link is read from.
    setSearchParams(params, { replace: true, state: location.state })
  }

  // While a search is running these are match counts rather than library totals,
  // which is what the tabs should say when the sections below are filtered.
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

  // One panel rather than three near-identical ones when the pinned view, over
  // whichever types are on screen, has settled on nothing at all.
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

              {/* Its own control, not a fifth tab: pinning narrows whichever
                  type is selected rather than replacing the selection. */}
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
                          plural(note.keypoints.length, 'key point'),
                          plural(note.concepts.length, 'concept'),
                          plural(note.importantTerms.length, 'term'),
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
                        facts={[plural(deck.flashcards.length, 'card')]}
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
                          plural(quiz.questions.length, 'question'),
                          quiz.difficulty === null ? (
                            'No difficulty set'
                          ) : (
                            <DifficultyStars value={quiz.difficulty} />
                          ),
                        ]}
                        // Quizzes are the only listed resource the API timestamps.
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
