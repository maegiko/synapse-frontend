import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ActionCard } from '../components/ActionCard'
import { RecentsCard } from '../components/RecentsCard'
import { RecentsItem } from '../components/RecentsItem'
import { ReviewQueue } from '../components/ReviewQueue'
import { StreakCard } from '../components/StreakCard'
import { IconArrowRight, IconDeck, IconNote, IconQuiz } from '../components/icons'
import { DifficultyStars } from '../components/DifficultyStars'
import dashboardHero from '../assets/dashboard_hero.webp'
import deckSplash from '../assets/deck_splash.webp'
import noteSplash from '../assets/note_splash.webp'
import quizSplash from '../assets/quiz_splash.webp'
import { btnPrimaryMdInverted, cardLink, shell } from '../components/ui'
import { useAuth } from '../auth/useAuth'
import { useFlashcardDecks, useNotes, useQuizzes, useReviewQueue, useStreak } from '../lib/queries'
import { formatRelative } from '../lib/formatDate'
import { plural } from '../lib/plural'

const RECENT_LIMIT = 3
// Quizzes are terser rows, so one more fits without unbalancing the column.
const RECENT_QUIZ_LIMIT = 4

/**
 * Hero heading: a fresh nudge to study each time the dashboard loads. Each one
 * looks forward to the day, feels encouraging, and names the user.
 * One is drawn at random per visit.
 */
const HERO_GREETINGS: ((name: string) => string)[] = [
  (name) => `Ready to learn, ${name}?`,
  (name) => `What are we learning today, ${name}?`,
  (name) => `Let's make it stick, ${name}.`,
  (name) => `Ready to get sharper, ${name}?`,
  (name) => `Let's build some momentum, ${name}.`,
  (name) => `Let's learn something today, ${name}.`,
  (name) => `Ready to dive in, ${name}?`,
  (name) => `Let's make some progress, ${name}.`,
  (name) => `Time to learn, ${name}.`,
  (name) => `Let's get into it, ${name}.`,
  (name) => `Ready to lock it in, ${name}?`,
  (name) => `Let's make today count, ${name}.`,
  (name) => `Something new today, ${name}?`,
  (name) => `Ready to get started, ${name}?`,
  (name) => `Let's sharpen up, ${name}.`,
  (name) => `Let's get learning, ${name}.`,
  (name) => `Ready for a study session, ${name}?`,
  (name) => `Let's put your brain to work, ${name}.`,
];

function drawGreeting(name: string): string {
  return HERO_GREETINGS[Math.floor(Math.random() * HERO_GREETINGS.length)](name)
}
// One icon treatment for every Library item: small, standalone, accent, no tile.
const ROW_ICON = 'h-4.5 w-4.5 shrink-0 text-accent-solid'
/** Row hairline is lighter than the section dividers; most of the separation is
 *  the generous vertical padding on the link, not the line. */
const FLAT_ROW =
  'group border-b border-border/85 transition-colors last:border-b-0 hover:bg-surface-alt/60'
const FLAT_ROW_LINK = 'block py-4 no-underline'

/** A recent note: document-shaped — title, overview, then quiet inline facts. */
function RecentNoteRow({
  to,
  title,
  description,
  meta,
}: {
  to: string
  title: string
  description?: string | null
  meta: string
}) {
  return (
    <li className={FLAT_ROW}>
      <Link to={to} className={FLAT_ROW_LINK}>
        <span className="flex min-w-0 items-center gap-3">
          <IconNote className={ROW_ICON} />
          <span className="recents-title min-w-0 flex-1 truncate text-sm font-medium text-text transition-colors group-hover:text-accent-solid">
            {title}
          </span>
        </span>
        {description && (
          <span className="mt-1 line-clamp-2 text-xs text-text-muted">{description}</span>
        )}
        <span className="mt-1.5 block text-xs text-text-muted tabular-nums">{meta}</span>
      </Link>
    </li>
  )
}

/** A recent quiz: activity-shaped — title, when it landed, then question count and difficulty. */
function RecentQuizRow({
  to,
  title,
  questionCount,
  difficulty,
  timestamp,
}: {
  to: string
  title: string
  questionCount: number
  difficulty: number | null
  timestamp: string
}) {
  return (
    <li className={FLAT_ROW}>
      <Link to={to} className={FLAT_ROW_LINK}>
        <span className="flex min-w-0 items-center gap-3">
          <IconQuiz className={ROW_ICON} />
          <span className="recents-title min-w-0 flex-1 truncate text-sm font-medium text-text transition-colors group-hover:text-accent-solid">
            {title}
          </span>
          {timestamp && (
            <span className="shrink-0 text-xs text-text-muted tabular-nums">{timestamp}</span>
          )}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted tabular-nums">
          {plural(questionCount, 'question')}
          {difficulty !== null && <DifficultyStars value={difficulty} />}
        </span>
      </Link>
    </li>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const notes = useNotes()
  const decks = useFlashcardDecks()
  const quizzes = useQuizzes()
  const streak = useStreak()
  const reviewQueue = useReviewQueue()

  const firstName = user?.fullName.trim().split(' ')[0] ?? 'there'
  // Drawn once per dashboard visit, so it does not reshuffle on every render.
  const [greeting] = useState(() => drawGreeting(firstName))

  // Decks and quizzes are both generated from an existing note.
  const needsFirstNote = notes.isSuccess && notes.data.length === 0

  const allLoaded = notes.isSuccess && decks.isSuccess && quizzes.isSuccess
  const isLibraryEmpty =
    allLoaded && notes.data.length === 0 && decks.data.length === 0 && quizzes.data.length === 0

  let summary = 'Here is everything you have built so far.'
  if (isLibraryEmpty) {
    summary =
      'Nothing here yet. Upload a note and Synapse turns it into a summary, a flashcard deck, or a quiz.'
  } else if (allLoaded) {
    summary = `You have ${plural(notes.data.length, 'note')}, ${plural(
      decks.data.length,
      'deck',
    )}, and ${plural(quizzes.data.length, 'quiz', 'quizzes')} in your library.`
  }

  const hero = needsFirstNote
    ? { to: '/notes/new', label: 'Upload your first note' }
    : { to: '/quiz/new', label: 'Continue learning' }

  return (
    <>
      <AppHeader />

      <section className={`${shell} dashboard-typography pt-6`}>
        <div className="relative overflow-hidden rounded-lg border border-accent-strong bg-[radial-gradient(circle_at_72%_22%,rgba(216,205,255,0.34)_0%,rgba(216,205,255,0)_36%),linear-gradient(115deg,#4c326f_0%,#704aa0_50%,#8c65bc_100%)] px-6 py-14 lg:px-12 lg:py-16">
          {/* The artwork carries transparent padding of its own (~21% vertically,
              ~7.5% on the right), so it is oversized and pulled right to make the
              visible art sit close to the panel edge. */}
          <img
            src={dashboardHero}
            alt=""
            width="960"
            height="640"
            decoding="async"
            className="pointer-events-none absolute top-1/2 -right-3 hidden h-[112%] w-auto -translate-y-1/2 drop-shadow-[0_18px_22px_rgba(15,5,30,0.45)] lg:block"
          />
          <div className="relative max-w-[54ch]">
            <h1 className="text-2xl text-on-accent">{greeting}</h1>
            <p className="mt-3 text-base text-accent-soft">{summary}</p>
            <Link to={hero.to} className={`${btnPrimaryMdInverted} mt-7`}>
              {hero.label}
              <IconArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <main className={`${shell} dashboard-typography pb-20`}>
        <StreakCard
          streak={streak.data}
          isLoading={streak.isPending}
          isError={streak.isError}
          onRetry={() => void streak.refetch()}
        />

        <ReviewQueue
          decks={reviewQueue.data}
          isLoading={reviewQueue.isPending}
          isError={reviewQueue.isError}
          onRetry={() => void reviewQueue.refetch()}
          // Unknown while the deck list loads, and the queue itself is the
          // stronger signal anyway: assume there are decks until told otherwise.
          hasDecks={decks.data ? decks.data.length > 0 : true}
        />

        <h2 className="mt-10 mb-5 text-xl">Start something new</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ActionCard
            to="/notes/new"
            art={
              <img
                src={noteSplash}
                alt=""
                width="384"
                height="384"
                loading="lazy"
                decoding="async"
              />
            }
            title="Summarise a note"
            body="Upload a PDF, DOCX, TXT or Markdown file (up to 10 MB) and get a concise summary of the important bits."
            cta="Upload a file"
          />
          <ActionCard
            to="/flashcards/new"
            art={
              <img
                src={deckSplash}
                alt=""
                width="384"
                height="384"
                loading="lazy"
                decoding="async"
              />
            }
            title="Generate a deck"
            body="Turn one of your notes into a flashcard deck, built from its concepts and key points."
            cta="Pick a note"
            blockedReason={needsFirstNote ? 'Summarise a note first' : undefined}
          />
          <ActionCard
            to="/quiz/new"
            art={
              <img
                src={quizSplash}
                alt=""
                width="384"
                height="384"
                loading="lazy"
                decoding="async"
                className="translate-x-2"
              />
            }
            title="Generate a quiz"
            body="Turn one of your notes into a 10-question quiz, then save a score for every attempt."
            cta="Pick a note"
            blockedReason={needsFirstNote ? 'Summarise a note first' : undefined}
          />
        </div>

        <div className="mt-14 mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl">Your library</h2>
          <Link to="/library" className={cardLink}>
            Browse library
            <IconArrowRight />
          </Link>
        </div>

        {/* One Library surface holding three sections: the deck strip, then
            notes and quizzes as two columns. No nested cards — a gently
            elevated frame with a subtle outer border and consistent 1px
            dividers between every section and entry. */}
        <div className="overflow-hidden rounded-md border border-border bg-surface shadow-sm">
          <RecentsCard
            title="Recent decks"
            isLoading={decks.isPending}
            isError={decks.isError}
            onRetry={() => void decks.refetch()}
            isEmpty={decks.data?.length === 0}
            emptyMessage="Decks you generate from a note will show up here."
            viewAllTo="/library?type=decks"
            viewAllLabel="View all decks"
            variant="strip"
            className="p-6"
          >
            {decks.data?.slice(0, RECENT_LIMIT).map((deck) => (
              <RecentsItem
                key={deck.deckId}
                icon={<IconDeck className={ROW_ICON} />}
                title={deck.title}
                to={`/flashcards/${deck.deckId}`}
                metadata={[plural(deck.flashcards.length, 'card')]}
                quietMeta
                compact
              />
            ))}
          </RecentsCard>

          <div className="grid grid-cols-1 border-t border-border/85 md:grid-cols-2">
            <RecentsCard
              title="Recent notes"
              isLoading={notes.isPending}
              isError={notes.isError}
              onRetry={() => void notes.refetch()}
              isEmpty={notes.data?.length === 0}
              emptyMessage="Your summarized notes will show up here."
              viewAllTo="/library?type=notes"
              viewAllLabel="View all notes"
              className="border-b border-border/85 p-6 md:border-r md:border-b-0"
            >
              {notes.data?.slice(0, RECENT_LIMIT).map((note) => (
                <RecentNoteRow
                  key={note.id}
                  to={`/notes/${note.id}`}
                  title={note.title}
                  description={note.overview}
                  meta={[
                    plural(note.keypoints.length, 'key point'),
                    plural(note.importantTerms.length, 'term'),
                  ].join(' · ')}
                />
              ))}
            </RecentsCard>

            <RecentsCard
              title="Recent quizzes"
              isLoading={quizzes.isPending}
              isError={quizzes.isError}
              onRetry={() => void quizzes.refetch()}
              isEmpty={quizzes.data?.length === 0}
              emptyMessage="Quizzes you generate from a note will show up here."
              viewAllTo="/library?type=quizzes"
              viewAllLabel="View all quizzes"
              className="p-6"
            >
              {quizzes.data?.slice(0, RECENT_QUIZ_LIMIT).map((quiz) => (
                <RecentQuizRow
                  key={quiz.id}
                  to={`/quiz/${quiz.id}`}
                  title={quiz.title}
                  questionCount={quiz.questions.length}
                  difficulty={quiz.difficulty}
                  // Quizzes are the only listed resource the API timestamps.
                  timestamp={formatRelative(quiz.createdAt)}
                />
              ))}
            </RecentsCard>
          </div>
        </div>
      </main>
    </>
  )
}
