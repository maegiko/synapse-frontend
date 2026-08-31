import { Link } from 'react-router-dom'
import synapseLogo from '../assets/synapse_logo.webp'
import {
  btnGhostLg,
  btnGhostSm,
  btnPrimaryLg,
  btnPrimaryLgInverted,
  btnPrimarySm,
  shell,
} from '../components/ui'
import { IconArrowRight, IconChart, IconDeck, IconSummary, IconUpload } from '../components/icons'
import { ThemeToggle } from '../components/ThemeToggle'

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
]

const STEPS = [
  {
    icon: <IconUpload />,
    title: 'Upload a note',
    body: 'A PDF, DOCX, TXT, or Markdown file, up to 10 MB. Lecture slides, a dense reading, your own notes.',
  },
  {
    icon: <IconSummary />,
    title: 'Get an AI summary',
    body: 'An overview, key points, core concepts, and important terms, pulled from that file, not the internet.',
  },
  {
    icon: <IconDeck />,
    title: 'Generate a deck or a quiz',
    body: 'Turn the note into a flashcard deck, or a 10-question quiz with a difficulty you set.',
  },
  {
    icon: <IconChart />,
    title: 'Track your scores',
    body: 'Every quiz attempt is saved, so you can see which topics are actually sticking.',
  },
]

const FAQS = [
  {
    q: 'What can I upload?',
    a: 'PDF, DOCX, TXT, or Markdown, up to 10 MB per file. Scanned images and legacy .doc files aren’t supported yet.',
  },
  {
    q: 'Is this going to do the reading for me?',
    a: 'No. Synapse only works from the file you upload, so it can’t summarize material you haven’t engaged with yet. Think of it as a faster way to organize and drill what you’ve already read, not a way to skip it.',
  },
  {
    q: 'Why does generating something take a few seconds?',
    a: 'Summaries, decks, and quizzes are produced by a real AI model at the moment you ask for them, not pre-written. That makes them specific to your file, but it also means each one takes longer than a normal click, closer to a search than a page load.',
  },
]

export function LandingPage() {
  return (
    <>
      <a
        className="sr-only focus:not-sr-only fixed left-4 top-4 z-50 rounded-lg bg-accent-solid px-4 py-2.5 text-on-accent"
        href="#main"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-280 items-center gap-2 px-3 py-4 sm:gap-7 sm:px-6">
          <Link to="/" className="mr-auto inline-flex items-center gap-2.5 font-display text-lg font-medium text-text no-underline">
            <img
              src={synapseLogo}
              alt=""
              width="48"
              height="48"
              decoding="async"
              className="h-10 w-10 sm:h-12 sm:w-12"
            />
            <span className="hidden translate-y-0.5 sm:inline">Synapse</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-semibold" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-text-muted no-underline hover:text-text">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className={btnGhostSm}>
              Log in
            </Link>
            <Link to="/register" className={btnPrimarySm}>
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="landing-page">
        <section className="pt-18 pb-24">
          <div className={`${shell} grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-14 items-center`}>
            <div>
              <h1 className="mb-5.5 text-3xl md:text-4xl leading-[1.08]">
                Turn your <em className="mr-[0.08em]">notes</em> into summaries, flashcards and
                quizzes.
              </h1>
              <p className="mb-8.5 max-w-[46ch] text-lg text-text-muted">
                Synapse turns your own lecture slides and course PDFs into study
                material in the same sitting you read them, so revision starts the
                same day, not the week before the exam.
              </p>
              <div className="flex flex-wrap gap-3.5">
                <Link to="/register" className={btnPrimaryLg}>
                  Start studying free
                </Link>
                <a href="#how-it-works" className={btnGhostLg}>
                  See it in action
                </a>
              </div>
            </div>

            <div aria-hidden="true">
              <AppPreviewMock />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-22 bg-surface border-y border-border">
          <div className={shell}>
            <h2 className="max-w-[32ch] text-2xl">From upload to quiz score, four steps</h2>
            <p className="mt-3 max-w-[56ch] text-base text-text-muted">
              Nothing here happens until you upload something. There’s no library to
              browse and no content that isn’t yours.
            </p>
            <ol className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 list-none p-0">
              {STEPS.map((step) => (
                <li key={step.title} className="rounded-md border border-border bg-background p-6">
                  <span className="mb-4 inline-flex h-10.5 w-10.5 items-center justify-center rounded-sm bg-accent-soft text-accent-strong">
                    {step.icon}
                  </span>
                  <h3 className="landing-step-title mb-2 text-base font-medium">{step.title}</h3>
                  <p className="text-sm text-text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-22">
          <div className={shell}>
            <h2 className="max-w-[32ch] text-2xl">What comes out the other side</h2>
            <p className="mt-3 max-w-[56ch] text-base text-text-muted">
              Synapse hasn’t launched yet, so instead of quotes from other students,
              here’s the actual material it produces.
            </p>
            <div className="mt-11 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <FlashcardMock />
              <QuizMock />
              <ScoreMock />
            </div>
          </div>
        </section>

        <section className="py-20 bg-surface border-y border-border">
          <div className={`${shell} grid grid-cols-1 md:grid-cols-2 gap-6`}>
            <div className="rounded-md border border-border bg-background p-6.5">
              <h3 className="mb-2.5 text-lg">You still do the reading</h3>
              <p className="text-sm text-text-muted">
                Synapse only ever works from the file you upload. It can’t summarize a
                chapter you haven’t given it, and there’s no shared library of other
                people’s notes to lean on instead. It’s a faster way to organize and
                test what you’ve already read, not a substitute for reading it.
              </p>
            </div>
            <div className="rounded-md border border-border bg-background p-6.5">
              <h3 className="mb-2.5 text-lg">Generating takes a moment</h3>
              <p className="text-sm text-text-muted">
                Every summary, deck, and quiz is produced by a real AI model at request
                time, so it’s specific to your file rather than a stock answer. That
                also means it takes a few seconds, more like a search than a page load.
                We show a loading state so you’re never left wondering if it worked.
              </p>
            </div>
          </div>
        </section>

        <section id="faq" className="py-20">
          <div className={shell}>
            <h2 className="max-w-[32ch] text-2xl">Questions worth answering upfront</h2>
            <dl className="mt-9 grid gap-6">
              {FAQS.map((item) => (
                <div className="border-b border-border pb-5.5" key={item.q}>
                  <dt className="mb-2 text-base font-bold">{item.q}</dt>
                  <dd className="m-0 max-w-[68ch] text-sm text-text-muted">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="pt-22 pb-24">
          <div className={shell}>
            <div className="grid justify-items-center gap-7 rounded-lg bg-accent-solid px-10 py-14 text-center text-on-accent">
              <h2 className="max-w-[34ch] text-2xl text-on-accent">
                Next reading you open, turn it into a quiz before you close the tab.
              </h2>
              <Link to="/register" className={btnPrimaryLgInverted}>
                Start studying free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-7">
        <div className={`${shell} flex flex-wrap items-center justify-between gap-4`}>
          <Link to="/" className="inline-flex items-center gap-2.5 text-base text-text-muted no-underline">
            <img
              src={synapseLogo}
              alt=""
              width="34"
              height="34"
              loading="lazy"
              decoding="async"
            />
            <span>Synapse</span>
          </Link>
          <div className="flex gap-5 text-sm font-semibold">
            <Link to="/login" className="text-text-muted no-underline hover:text-accent-foreground">
              Log in
            </Link>
            <Link to="/register" className="text-text-muted no-underline hover:text-accent-foreground">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}

/**
 * A slice of the real signed-in app, not a generic document card: the Synapse
 * chrome, the violet gradient dashboard hero, and the spaced-repetition review
 * queue with its next-up deck. Built from the same tokens and patterns the
 * product uses (see DashboardPage and ReviewQueue), so the landing page shows
 * what the app actually looks like.
 */
function AppPreviewMock() {
  return (
    <div
      className="mx-auto w-full max-w-120 overflow-hidden rounded-lg border border-border bg-background shadow-lg rotate-[1.2deg]"
      role="img"
      aria-label="A preview of the Synapse dashboard"
    >
      {/* App header */}
      <div className="flex items-center gap-2.5 border-b border-border bg-surface px-5 py-3.5">
        <img src={synapseLogo} alt="" width="34" height="34" decoding="async" />
        <span className="translate-y-0.5 font-display text-lg font-medium text-text">Synapse</span>
        <span className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-strong">
          KK
        </span>
      </div>

      <div className="p-5">
        {/* Dashboard hero — the app's signature violet gradient panel */}
        <div className="rounded-md border border-accent-strong bg-[radial-gradient(circle_at_75%_20%,rgba(216,205,255,0.32)_0%,rgba(216,205,255,0)_40%),linear-gradient(115deg,#4c326f_0%,#704aa0_50%,#8c65bc_100%)] px-5 py-5">
          <p className="font-display text-lg text-on-accent">Ready to learn?</p>
          <p className="mt-1.5 text-sm text-on-hero-muted">
            You have 6 notes, 4 decks, and 3 quizzes in your library.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-on-accent px-3.5 py-2 text-sm font-bold text-accent-on-light">
            Continue learning
            <IconArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* Review queue */}
        <div className="mt-5">
          <div className="mb-2.5 flex items-baseline gap-2">
            <span className="font-display text-base font-medium text-text">Review queue</span>
            <span className="text-sm text-text-muted">2 decks due</span>
          </div>

          <div className="flex items-stretch gap-3.5 overflow-hidden">
            {/* Next-up deck — accent-tinted, with the timing + Review footer */}
            <div className="flex shrink-0 basis-[70%] flex-col overflow-hidden rounded-md border border-accent-solid/40 bg-accent-soft/40">
              <div className="flex-1 p-3.5">
                <p className="rail-next-label mb-1.5 text-xs text-accent-strong">Next up</p>
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent-strong">
                    <IconDeck className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">Virtual Memory</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-text-muted">12 cards</span>
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent-strong">
                        GOOD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-accent-solid/20 bg-accent-soft/70 px-3.5 py-2.5">
                <span className="text-xs font-semibold text-accent-strong">Due today</span>
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent-medium px-3 py-1.5 text-xs font-bold text-on-accent">
                  Review
                  <IconArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            {/* The next card in the rail, half in view — same cue the real queue gives */}
            <div className="flex shrink-0 basis-[42%] flex-col rounded-md border border-border bg-surface p-3.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-accent-soft text-accent-strong">
                <IconDeck className="h-4.5 w-4.5" />
              </span>
              <p className="mt-2 truncate text-sm font-medium text-text">TLB Refill</p>
              <p className="mt-1 text-xs text-text-muted">8 cards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FlashcardMock() {
  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-border bg-surface p-5.5 shadow-sm">
      <p className="font-display text-xs font-bold uppercase tracking-wide text-accent-foreground">Flashcard deck</p>
      <div className="flashcard flashcard--hover-flip relative h-42 cursor-pointer" tabIndex={0}>
        <div className="flashcard-face flashcard-face--front absolute inset-0 flex items-center justify-center rounded-md border border-border bg-surface-alt p-4.5 text-center font-semibold text-text transition-transform duration-500">
          <p>What does a state machine model?</p>
        </div>
        <div className="flashcard-face flashcard-face--back absolute inset-0 flex items-center justify-center rounded-md bg-accent-solid p-4.5 text-center font-semibold text-on-accent transition-transform duration-500">
          <p>How a system moves between defined states in response to events.</p>
        </div>
      </div>
      <p className="text-xs text-text-muted">Hover or focus to flip</p>
    </div>
  )
}

function QuizMock() {
  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-border bg-surface p-5.5 shadow-sm">
      <p className="font-display text-xs font-bold uppercase tracking-wide text-accent-foreground">Quiz - question 3 of 10</p>
      <div className="flex h-42 flex-col justify-center gap-3.5 rounded-md bg-surface-alt p-4.5">
        <p className="text-sm font-bold">A sequence diagram represents interactions over time.</p>
        <ul className="grid gap-2 p-0 text-sm">
          <li className="flex items-center gap-2.5 rounded-sm border border-success-solid bg-success-soft px-3 py-2.25 font-bold text-success-solid">
            <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border border-success-solid bg-success-solid text-xs text-on-status">
              ✓
            </span>
            True
          </li>
          <li className="flex items-center gap-2.5 rounded-sm border border-border bg-surface px-3 py-2.25">
            <span className="h-4.5 w-4.5 shrink-0 rounded-full border border-border" />
            False
          </li>
        </ul>
      </div>
      <p className="text-xs text-text-muted">Multiple choice or true/false, generated from your note</p>
    </div>
  )
}

function ScoreMock() {
  const rows = [
    { label: 'Behavioural Modelling', score: 8 },
    { label: 'Cell Biology – Ch. 4', score: 6 },
    { label: 'Macro: Fiscal Policy', score: 9 },
  ]
  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-border bg-surface p-5.5 shadow-sm">
      <p className="font-display text-xs font-bold uppercase tracking-wide text-accent-foreground">Score history</p>
      <ul className="flex h-42 flex-col justify-center gap-4 p-0">
        {rows.map((row) => (
          <li key={row.label} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2.5 text-xs">
            <span className="truncate font-semibold text-text-muted">{row.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-surface-alt">
              <span className="block h-full rounded-full bg-accent-solid" style={{ width: `${row.score * 10}%` }} />
            </span>
            <span className="font-bold text-text">{row.score}/10</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-muted">Every attempt is saved automatically</p>
    </div>
  )
}
