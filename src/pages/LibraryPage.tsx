import { useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { AppLink } from '../components/AppLink'
import { BackLink } from '../components/BackLink'
import { LibraryCard } from '../components/LibraryCard'
import { DifficultyStars } from '../components/DifficultyStars'
import { IconArrowRight, IconDeck, IconNote, IconQuiz } from '../components/icons'
import { btnGhostSm, btnPrimaryLg, cardLink, fieldInput, shell, surfaceCard } from '../components/ui'
import { toFormMessage } from '../lib/apiErrors'
import { DASHBOARD_BACK } from '../lib/backTrail'
import { formatRelative } from '../lib/formatDate'
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

const KINDS: { value: Kind; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'notes', label: 'Notes' },
  { value: 'decks', label: 'Decks' },
  { value: 'quizzes', label: 'Quizzes' },
]

function isKind(value: string | null): value is Kind {
  return value !== null && KINDS.some((kind) => kind.value === value)
}

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

interface SectionProps {
  title: string
  /** The paged query behind this section, so one place handles all of its states. */
  query: Pick<
    UseInfiniteQueryResult,
    'isPending' | 'isError' | 'error' | 'refetch' | 'hasNextPage' | 'isFetchingNextPage' | 'fetchNextPage'
  >
  /** Everything the current search matched, not just the pages loaded so far. */
  total: number | undefined
  shown: number
  /** True when a search is active, which is what tells an empty section apart from an empty library. */
  isSearching: boolean
  emptyMessage: string
  children: ReactNode
}

function Section({ title, query, total, shown, isSearching, emptyMessage, children }: SectionProps) {
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
        <div className={`${surfaceCard} grid justify-items-start gap-2.5 p-6`}>
          <p className="text-sm text-text-muted">
            We could not load these. {toFormMessage(query.error)}
          </p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="text-sm font-bold text-accent-solid hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Nothing saved and nothing matched read differently, so they say different things. */}
      {isSettled && total === 0 && (
        <p className={placeholderPanel}>
          {isSearching ? 'Nothing here matches your search.' : emptyMessage}
        </p>
      )}

      {shown > 0 && <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{children}</div>}

      {/* Paged by hand rather than on scroll, so nothing loads that was not asked for. */}
      {isSettled && query.hasNextPage && (
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
    </section>
  )
}

export function LibraryPage() {
  // The filter lives in the URL, so it survives a refresh and the back button,
  // and the dashboard can link straight to one kind.
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const kindParam = searchParams.get('type')
  const kind: Kind = isKind(kindParam) ? kindParam : 'all'

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

  const visibleNotes = notes.data?.pages.flatMap((page) => page.notes ?? []) ?? []
  const visibleDecks = decks.data?.pages.flatMap((page) => page.flashcardDecks ?? []) ?? []
  const visibleQuizzes = quizzes.data?.pages.flatMap((page) => page.quizzes ?? []) ?? []

  // Every page of a query carries the same totals, so the first one answers for all.
  const noteTotal = notes.data?.pages[0]?.totalElements
  const deckTotal = decks.data?.pages[0]?.totalElements
  const quizTotal = quizzes.data?.pages[0]?.totalElements

  const allLoaded = notes.isSuccess && decks.isSuccess && quizzes.isSuccess
  // Only an unsearched, empty result means the library itself is empty; a search
  // that matched nothing is answered inside each section instead.
  const isLibraryEmpty =
    allLoaded && !isSearching && noteTotal === 0 && deckTotal === 0 && quizTotal === 0

  let summary = 'Everything you have made, in one place.'
  if (allLoaded && !isSearching && !isLibraryEmpty) {
    summary = `${plural(noteTotal ?? 0, 'note')}, ${plural(deckTotal ?? 0, 'deck')}, and ${plural(
      quizTotal ?? 0,
      'quiz',
      'quizzes',
    )}.`
  }

  function selectKind(next: Kind) {
    // `replace`, so flicking through filters does not stack up history entries.
    // The location state is carried over by hand: `setSearchParams` drops it
    // otherwise, and with it the trail this page's own back link is read from.
    setSearchParams(next === 'all' ? {} : { type: next }, {
      replace: true,
      state: location.state,
    })
  }

  // While a search is running these are match counts rather than library totals,
  // which is what the tabs should say when the sections below are filtered.
  const counts: Record<Kind, number | undefined> = {
    all: allLoaded ? (noteTotal ?? 0) + (deckTotal ?? 0) + (quizTotal ?? 0) : undefined,
    notes: noteTotal,
    decks: deckTotal,
    quizzes: quizTotal,
  }

  const showNotes = kind === 'all' || kind === 'notes'
  const showDecks = kind === 'all' || kind === 'decks'
  const showQuizzes = kind === 'all' || kind === 'quizzes'

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
                      onClick={() => selectKind(option.value)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3.5 py-2 text-sm font-bold transition-colors duration-150 ${
                        active
                          ? 'cursor-default bg-surface text-accent-strong shadow-sm'
                          : 'cursor-pointer text-text-muted hover:text-text'
                      }`}
                    >
                      {option.label}
                      {count !== undefined && (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-normal text-accent-solid tabular-nums">
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {showNotes && (
              <Section
                title="Notes"
                query={notes}
                total={noteTotal}
                shown={visibleNotes.length}
                isSearching={isSearching}
                emptyMessage="Your summarised notes will show up here."
              >
                {visibleNotes.map((note) => (
                  <LibraryCard
                    key={note.id}
                    to={`/notes/${note.id}`}
                    icon={<IconNote />}
                    title={note.title}
                    preview={note.overview}
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
                title="Flashcard decks"
                query={decks}
                total={deckTotal}
                shown={visibleDecks.length}
                isSearching={isSearching}
                emptyMessage="Decks you generate from a note will show up here."
              >
                {visibleDecks.map((deck) => (
                  <LibraryCard
                    key={deck.deckId}
                    icon={<IconDeck />}
                    title={deck.title}
                    to={`/flashcards/${deck.deckId}`}
                    // `title` on a saved flashcard is the question, not a heading.
                    preview={deck.flashcards[0]?.title}
                    facts={[plural(deck.flashcards.length, 'card')]}
                  />
                ))}
              </Section>
            )}

            {showQuizzes && (
              <Section
                title="Quizzes"
                query={quizzes}
                total={quizTotal}
                shown={visibleQuizzes.length}
                isSearching={isSearching}
                emptyMessage="Quizzes you generate from a note will show up here."
              >
                {visibleQuizzes.map((quiz) => (
                  <LibraryCard
                    key={quiz.id}
                    icon={<IconQuiz />}
                    title={quiz.title}
                    to={`/quiz/${quiz.id}`}
                    preview={quiz.description}
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
      </main>
    </>
  )
}
