import { Link } from 'react-router-dom'
import synapseLogo from '../assets/synapse_logo.png'
import {
  btnGhostLg,
  btnGhostSm,
  btnPrimaryLg,
  btnPrimaryLgInverted,
  btnPrimarySm,
  shell,
} from '../components/ui'
import { IconChart, IconDeck, IconSummary, IconUpload } from '../components/icons'

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
        <div className={`${shell} flex items-center gap-7 py-4`}>
          <Link to="/" className="mr-auto inline-flex items-center gap-2.5 font-display text-lg font-semibold text-text no-underline">
            <img src={synapseLogo} alt="" width="44" height="44" />
            <span>Synapse</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-semibold" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-text-muted no-underline hover:text-text">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className={btnGhostSm}>
              Log in
            </Link>
            <Link to="/register" className={btnPrimarySm}>
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="pt-18 pb-24">
          <div className={`${shell} grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-14 items-center`}>
            <div>
              <h1 className="mb-5.5 text-3xl md:text-4xl leading-[1.08]">
                Turn your notes into a summary, deck, and quiz.
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
                  See how it works
                </a>
              </div>
            </div>

            <div aria-hidden="true">
              <SummaryCardMock />
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
                  <h3 className="mb-2 font-body text-base font-bold">{step.title}</h3>
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
            <img src={synapseLogo} alt="" width="34" height="34" />
            <span>Synapse</span>
          </Link>
          <div className="flex gap-5 text-sm font-semibold">
            <Link to="/login" className="text-text-muted no-underline hover:text-accent-solid">
              Log in
            </Link>
            <Link to="/register" className="text-text-muted no-underline hover:text-accent-solid">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}

function SummaryCardMock() {
  return (
    <div
      className="mx-auto max-w-110 overflow-hidden rounded-lg border border-border bg-surface shadow-lg rotate-[1.2deg]"
      role="img"
      aria-label="Example of an AI-generated note summary"
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-alt px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="h-2 w-2 rounded-full bg-green-400" />
        <span className="ml-2 text-xs font-semibold text-text-muted">behavioural-modelling.pdf</span>
      </div>
      <div className="px-6 pt-5 pb-6">
        <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-accent-solid">Overview</p>
        <p className="text-sm leading-relaxed text-text">
          Behavioural models simplify real systems into rules that predict how
          actors respond to change.
        </p>
        <p className="mb-1.5 mt-4 text-xs font-extrabold uppercase tracking-wide text-accent-solid">Key points</p>
        <ul className="grid gap-1 pl-4.5 text-sm text-text">
          <li>Models trade accuracy for tractability.</li>
          <li>State transitions capture behaviour over time.</li>
        </ul>
        <p className="mb-1.5 mt-4 text-xs font-extrabold uppercase tracking-wide text-accent-solid">Terms</p>
        <div className="flex flex-wrap gap-2">
          {['state machine', 'invariant', 'transition'].map((term) => (
            <span key={term} className="rounded-full bg-accent-soft px-2.5 py-1.5 text-xs font-bold text-accent-strong">
              {term}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function FlashcardMock() {
  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-border bg-surface p-5.5 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-wide text-accent-solid">Flashcard deck</p>
      <div className="flashcard relative h-42 cursor-pointer" tabIndex={0}>
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
      <p className="text-xs font-extrabold uppercase tracking-wide text-accent-solid">Quiz - question 3 of 10</p>
      <div className="flex h-42 flex-col justify-center gap-3.5 rounded-md bg-surface-alt p-4.5">
        <p className="text-sm font-bold">A sequence diagram represents interactions over time.</p>
        <ul className="grid gap-2 p-0 text-sm">
          <li className="flex items-center gap-2.5 rounded-sm border border-success-solid bg-success-soft px-3 py-2.25 font-bold text-success-solid">
            <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border border-success-solid bg-success-solid text-xs text-on-accent">
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
      <p className="text-xs font-extrabold uppercase tracking-wide text-accent-solid">Score history</p>
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
