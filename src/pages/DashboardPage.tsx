import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ActionCard } from '../components/ActionCard'
import { RecentsCard } from '../components/RecentsCard'
import { RecentsItem } from '../components/RecentsItem'
import { IconArrowRight, IconDeck, IconNote, IconQuiz } from '../components/icons'
import dashboardHero from '../assets/dashboard_hero.png'
import deckSplash from '../assets/deck_splash.png'
import noteSplash from '../assets/note_splash.png'
import quizSplash from '../assets/quiz_splash.png'
import { btnPrimaryMd, shell, viewAllPill } from '../components/ui'
import { useAuth } from '../auth/useAuth'
import { useFlashcardDecks, useNotes, useQuizzes } from '../lib/queries'
import { formatRelative } from '../lib/formatDate'

const RECENT_LIMIT = 3
const ROW_ICON = 'h-4 w-4'

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

export function DashboardPage() {
  const { user } = useAuth()
  const notes = useNotes()
  const decks = useFlashcardDecks()
  const quizzes = useQuizzes()

  const firstName = user?.fullName.trim().split(' ')[0] ?? 'there'

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

      <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(115deg,var(--color-accent-soft)_0%,var(--color-background)_46%,var(--color-accent-soft)_100%)]">
        <div className={`${shell} relative py-14 lg:py-16`}>
          {/* Anchored to the content column so it lines up with the header. The
              artwork carries transparent padding of its own (~21% vertically,
              ~7.5% on the right), so it is oversized and pulled right to make the
              *visible* art sit flush; the band clips only the empty margin. */}
          <img
            src={dashboardHero}
            alt=""
            className="pointer-events-none absolute top-1/2 -right-3 hidden h-[112%] w-auto -translate-y-1/2 lg:block"
          />
          <div className="relative max-w-[54ch]">
            <h1 className="text-2xl">Welcome back, {firstName}.</h1>
            <p className="mt-3 text-base text-text-muted">{summary}</p>
            <Link to={hero.to} className={`${btnPrimaryMd} mt-7`}>
              {hero.label}
              <IconArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <main className={`${shell} pb-20`}>
        <h2 className="mt-12 mb-5 text-lg">Start something new</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ActionCard
            to="/notes/new"
            art={<img src={noteSplash} alt="" />}
            title="Summarize a note"
            body="Upload a PDF, DOCX, TXT, or Markdown file (up to 10 MB) and get an overview, key points, and terms."
            cta="Upload a file"
          />
          <ActionCard
            to="/flashcards/new"
            art={<img src={deckSplash} alt="" />}
            title="Generate a deck"
            body="Turn one of your notes into a flashcard deck, built from its concepts and key points."
            cta="Pick a note"
            blockedReason={needsFirstNote ? 'Summarize a note first' : undefined}
          />
          <ActionCard
            to="/quiz/new"
            art={<img src={quizSplash} alt="" className="translate-x-2" />}
            title="Generate a quiz"
            body="Turn one of your notes into a 10-question quiz, then save a score for every attempt."
            cta="Pick a note"
            blockedReason={needsFirstNote ? 'Summarize a note first' : undefined}
          />
        </div>

        <div className="mt-14 mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg">Your library</h2>
          <Link to="/library" className={viewAllPill}>
            View all
            <IconArrowRight />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <RecentsCard
            title="Recent notes"
            count={notes.data?.length}
            isLoading={notes.isPending}
            isError={notes.isError}
            onRetry={() => void notes.refetch()}
            isEmpty={notes.data?.length === 0}
            emptyMessage="Your summarized notes will show up here."
            viewAllTo="/notes"
            viewAllLabel="View all notes"
          >
            {notes.data?.slice(0, RECENT_LIMIT).map((note) => (
              <RecentsItem
                key={note.id}
                icon={<IconNote className={ROW_ICON} />}
                title={note.title}
                preview={note.overview}
                meta={`${plural(note.keypoints.length, 'key point')} · ${plural(
                  note.importantTerms.length,
                  'term',
                )}`}
              />
            ))}
          </RecentsCard>

          <RecentsCard
            title="Recent decks"
            count={decks.data?.length}
            isLoading={decks.isPending}
            isError={decks.isError}
            onRetry={() => void decks.refetch()}
            isEmpty={decks.data?.length === 0}
            emptyMessage="Decks you generate from a note will show up here."
            viewAllTo="/flashcards"
            viewAllLabel="View all decks"
          >
            {decks.data?.slice(0, RECENT_LIMIT).map((deck) => (
              <RecentsItem
                key={deck.deckId}
                icon={<IconDeck className={ROW_ICON} />}
                title={deck.title}
                // `title` on a saved flashcard is the question, not a heading.
                preview={deck.flashcards[0]?.title}
                meta={plural(deck.flashcards.length, 'card')}
              />
            ))}
          </RecentsCard>

          <RecentsCard
            title="Recent quizzes"
            count={quizzes.data?.length}
            isLoading={quizzes.isPending}
            isError={quizzes.isError}
            onRetry={() => void quizzes.refetch()}
            isEmpty={quizzes.data?.length === 0}
            emptyMessage="Quizzes you generate from a note will show up here."
            viewAllTo="/quiz"
            viewAllLabel="View all quizzes"
          >
            {quizzes.data?.slice(0, RECENT_LIMIT).map((quiz) => (
              <RecentsItem
                key={quiz.id}
                icon={<IconQuiz className={ROW_ICON} />}
                title={quiz.title}
                preview={quiz.description}
                meta={[
                  plural(quiz.questions.length, 'question'),
                  quiz.difficulty === null ? 'No difficulty set' : `Difficulty ${quiz.difficulty}/5`,
                ].join(' · ')}
                // Quizzes are the only listed resource the API timestamps.
                timestamp={formatRelative(quiz.createdAt)}
              />
            ))}
          </RecentsCard>
        </div>
      </main>
    </>
  )
}
