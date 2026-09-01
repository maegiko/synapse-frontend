import { useEffect, useState } from 'react'
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
    a: 'PDF, DOCX, TXT or Markdown, up to 10 MB per file. Scanned images and legacy .doc files aren’t supported yet.',
  },
  {
    q: 'Does Synapse replace reading the material?',
    a: 'No. Synapse turns the material you’ve read into summaries, flashcards and quizzes for revision.',
  },
  {
    q: "Can I edit what Synapse generates?",
    a: "Yes. You can edit generated flashcards and quizzes after they’re created, so you can correct, refine or tailor them to how you want to study."
  },
  {
    q: "How accurate is the generated material?",
    a: "Synapse generates from your uploaded material, but AI can still make mistakes. You can edit anything it generates and important details should be checked against your original notes."
  },
  {
    q: 'Why does generating something take a few seconds?',
    a: 'Summaries, decks and quizzes are generated on demand by an AI model, so they take a little longer than a normal page load',
  },
]

/** How much of a block has to be in view before it enters. */
const REVEAL_THRESHOLD = 0.12

/**
 * The share of the viewport its bottom edge is raised by for the reveal, so a
 * block enters once it is properly in view rather than the moment it peeks in.
 */
const REVEAL_BOTTOM_BIAS = 0.08

export function LandingPage() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.landing-reveal')
    const reveal = (element: Element) => element.classList.add('landing-reveal-visible')

    if (!('IntersectionObserver' in window)) {
      elements.forEach(reveal)
      return
    }

    const onIntersect = (entries: IntersectionObserverEntry[], self: IntersectionObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        reveal(entry.target)
        self.unobserve(entry.target)
      })
    }

    const observer = new IntersectionObserver(onIntersect, {
      threshold: REVEAL_THRESHOLD,
      rootMargin: `0px 0px -${REVEAL_BOTTOM_BIAS * 100}% 0px`,
    })

    // Raising the edge needs room below the block to raise it into, and the
    // last block on the page has none: the footer sits inside the raised edge
    // even at full scroll, so the biased observer never fires for it and it
    // would stay at opacity 0 for good. Blocks in that position watch the true
    // viewport edge instead.
    const tailObserver = new IntersectionObserver(onIntersect, { threshold: REVEAL_THRESHOLD })
    const lowestScrollTop = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    )
    const biasedEdge = window.innerHeight * (1 - REVEAL_BOTTOM_BIAS)

    /** Whether scrolling to the end of the page can bring `rect` far enough in. */
    const biasedObserverCanFire = (rect: DOMRect) => {
      const top = rect.top + window.scrollY - lowestScrollTop
      const shown = Math.min(top + rect.height, biasedEdge) - Math.max(top, 0)
      return shown >= rect.height * REVEAL_THRESHOLD
    }

    // Do not make the first screen depend on an asynchronous observer callback:
    // it should enter as soon as the page mounts, including in slower browsers.
    const initialBoundary = window.innerHeight
    elements.forEach((element) => {
      const rect = element.getBoundingClientRect()
      if (rect.top <= initialBoundary) reveal(element)
      else if (biasedObserverCanFire(rect)) observer.observe(element)
      else tailObserver.observe(element)
    })
    return () => {
      observer.disconnect()
      tailObserver.disconnect()
    }
  }, [])

  return (
    <>
      <a
        className="sr-only focus:not-sr-only fixed left-4 top-4 z-50 rounded-lg bg-accent-solid px-4 py-2.5 text-on-accent"
        href="#main"
      >
        Skip to content
      </a>

      <header className="landing-header-enter sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-280 items-center gap-2 px-3 py-4 sm:gap-7 sm:px-6">
          <Link to="/" className="brand mr-auto inline-flex items-center gap-2.5 font-display text-lg font-medium text-text no-underline">
            <img
              src={synapseLogo}
              alt=""
              width="48"
              height="48"
              decoding="async"
              className="brand-mark h-10 w-10 sm:h-12 sm:w-12"
            />
            <span className="hidden translate-y-0.5 sm:inline">Synapse</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-semibold" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="landing-nav-link text-text-muted no-underline hover:text-text">
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
              <h1 className="landing-reveal mb-5.5 text-3xl md:text-4xl leading-[1.08]">
                Turn your <em className="mr-[0.08em]">notes</em> into summaries, flashcards and
                quizzes.
              </h1>
              <p className="landing-reveal landing-delay-1 mb-8.5 max-w-[46ch] text-lg text-text-muted">
                Synapse makes studying easier by turning your lecture slides, course notes and PDFs into clear summaries, flashcard decks and quizzes.
              </p>
              <div className="landing-reveal landing-delay-2 flex flex-wrap gap-3.5">
                <Link to="/register" className={btnPrimaryLg}>
                  Start studying free
                </Link>
                <a href="#how-it-works" className={btnGhostLg}>
                  See it in action
                </a>
              </div>
            </div>

            <div className="landing-reveal landing-reveal-side landing-preview-delay" aria-hidden="true">
              <AppPreviewMock />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-22 bg-surface border-y border-border">
          <div className={shell}>
            <h2 className="landing-reveal max-w-[32ch] text-2xl">From upload to quiz score, four steps</h2>
            <p className="landing-reveal landing-delay-1 mt-3 max-w-[56ch] text-base text-text-muted">
              Your library is built from your uploads. Nothing is public or shared.
            </p>
            <ol className="landing-stagger mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 list-none p-0">
              {STEPS.map((step) => (
                <li key={step.title} className="landing-reveal">
                  <div className="h-full rounded-md border border-border bg-background p-6">
                    <span className="landing-step-icon mb-4 inline-flex h-10.5 w-10.5 items-center justify-center rounded-sm bg-accent-soft text-accent-strong">
                      {step.icon}
                    </span>
                    <h3 className="landing-step-title mb-2 text-base font-medium">{step.title}</h3>
                    <p className="text-sm text-text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-22">
          <div className={shell}>
            <h2 className="landing-reveal max-w-[32ch] text-2xl">What comes out the other side</h2>
            <p className="landing-reveal landing-delay-1 mt-3 max-w-[56ch] text-base text-text-muted">
              No abstract promises. Here’s what Synapse actually gives you to study with.
            </p>
            <div className="landing-stagger mt-11 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              <div className="landing-reveal h-full">
                <SummaryMock />
              </div>
              <div className="landing-reveal h-full">
                <FlashcardDeckMock />
              </div>
              <div className="landing-reveal h-full">
                <QuizMock />
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-20 bg-surface border-y border-border">
          <div className={shell}>
            <h2 className="landing-reveal max-w-[32ch] text-2xl">Questions worth answering upfront</h2>
            <dl className="landing-stagger mt-9 grid gap-6">
              {FAQS.map((item) => (
                <div className="landing-reveal border-b border-border pb-5.5" key={item.q}>
                  <dt className="mb-2 text-base font-bold">{item.q}</dt>
                  <dd className="m-0 max-w-[68ch] text-sm text-text-muted">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="pt-22 pb-24">
          <div className={shell}>
            <div className="landing-reveal landing-reveal-scale relative grid justify-items-center gap-7 overflow-hidden rounded-lg bg-accent-solid px-10 py-14 text-center text-on-accent">
              <CtaDecorations />
              <h2 className="relative z-10 max-w-[34ch] text-2xl text-on-accent">
                Turn your notes into study material you’ll actually remember.
              </h2>
              <Link to="/register" className={`relative z-10 ${btnPrimaryLgInverted}`}>
                Create your first quiz
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-7">
        <div className={`${shell} landing-reveal flex flex-wrap items-center justify-between gap-4`}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-base text-text-muted no-underline"
            >
              <img
                src={synapseLogo}
                alt=""
                width="34"
                height="34"
                loading="lazy"
                decoding="async"
              />
              <span className="leading-none">Synapse</span>
            </Link>
            <p className="text-xs leading-none text-text-muted">Built by Kenneth Koon</p>
          </div>
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

/** A grid of evenly spaced dots, used as a decorative texture on the CTA. */
function dotGrid(x: number, y: number, cols: number, rows: number, gap: number) {
  return Array.from({ length: cols * rows }, (_, i) => (
    <circle key={i} cx={x + (i % cols) * gap} cy={y + Math.floor(i / cols) * gap} r={1.6} />
  ))
}

/**
 * Faint geometric line-art bleeding off the CTA panel: flowcharts, a node graph,
 * a plotted curve, a card stack — the shapes Synapse turns notes into. Purely
 * decorative, drawn in the panel's own foreground colour at low opacity, and
 * split into two edge-anchored SVGs so the centre stays clear at any width.
 */
function CtaDecorations() {
  return (
    <div aria-hidden="true" className="cta-decor pointer-events-none absolute inset-0">
      <svg
        viewBox="0 0 300 340"
        fill="none"
        preserveAspectRatio="xMinYMid slice"
        className="absolute inset-y-0 left-0 h-full w-auto"
      >
        <g stroke="currentColor" strokeWidth="1.4">
          <circle cx="14" cy="16" r="66" />
          {/* flowchart */}
          <rect x="150" y="18" width="26" height="26" />
          <path d="M163 62l-19 19 19 19 19-19-19-19z" />
          <rect x="196" y="68" width="26" height="26" />
          <rect x="150" y="120" width="26" height="26" />
          <path d="M163 44v18M182 81h14M163 100v20" strokeDasharray="3 4" />
          {/* plotted curve */}
          <path d="M44 214v92h92" />
          <path d="M40 222l4-10 4 10zM128 302l10 4-10 4z" fill="currentColor" stroke="none" />
          <path d="M54 300c20 2 44-10 60-70" />
          <path d="M62 250h-18M96 300v-42" strokeDasharray="3 4" />
          {/* dashed square + plus */}
          <rect x="150" y="238" width="42" height="42" strokeDasharray="5 5" />
          <path d="M214 300h16M222 292v16" />
        </g>
        <g fill="currentColor" stroke="none">
          {dotGrid(54, 34, 6, 5, 13)}
        </g>
      </svg>

      <svg
        viewBox="0 0 300 340"
        fill="none"
        preserveAspectRatio="xMaxYMid slice"
        className="absolute inset-y-0 right-0 h-full w-auto"
      >
        <g stroke="currentColor" strokeWidth="1.4">
          {/* node graph */}
          <path d="M96 58l40 26M136 84l42-26M136 84l18 46" />
          <circle cx="96" cy="58" r="10" />
          <circle cx="138" cy="84" r="12" />
          <circle cx="180" cy="56" r="8" />
          <circle cx="156" cy="132" r="9" />
          <circle cx="210" cy="94" r="6" />
          <circle cx="132" cy="30" r="5" />
          {/* card stack */}
          <rect x="176" y="196" width="56" height="74" rx="4" transform="rotate(7 204 233)" />
          <rect x="168" y="204" width="56" height="74" rx="4" transform="rotate(-3 196 241)" />
          <rect x="160" y="210" width="56" height="74" rx="4" />
          <circle cx="158" cy="300" r="7" />
          {/* dashed arc + plus */}
          <path d="M70 322C118 250 180 214 288 214" strokeDasharray="4 6" />
          <path d="M120 254h16M128 246v16" />
        </g>
        <g fill="currentColor" stroke="none">
          {dotGrid(150, 148, 5, 4, 13)}
        </g>
      </svg>
    </div>
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
      className="landing-app-preview-float mx-auto w-full max-w-120 overflow-hidden rounded-lg border border-border bg-background shadow-lg"
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
        <div className="landing-preview-hero rounded-md border border-accent-strong px-5 py-5">
          <p className="font-display text-lg text-on-accent">Ready to learn?</p>
          <p className="mt-1.5 text-sm text-on-hero-muted">
            You have 6 notes, 4 decks and 3 quizzes in your library.
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

/**
 * A compressed slice of the real note summary view (see NotePage): an overview
 * line, bulleted key points with the accent dot, and the important-term pills.
 * Same tokens and shapes the product uses, just fewer of each.
 */
function SummaryMock() {
  return (
    <div className="landing-interactive-card flex h-full flex-col gap-3.5 rounded-lg border border-border bg-surface p-5.5 shadow-sm">
      <p className="font-display text-xs font-bold uppercase tracking-wide text-accent-foreground">Summary</p>
      <div className="flex flex-1 flex-col gap-2.5 rounded-md bg-surface-alt p-4.5">
        <div>
          <p className="mb-1 font-display text-xs font-bold uppercase tracking-wide text-text-muted">Overview</p>
          <p className="text-xs leading-snug text-text">
            Models a system as a finite set of states, with events driving the transitions between them.
          </p>
        </div>
        <div>
          <p className="mb-1.5 font-display text-xs font-bold uppercase tracking-wide text-text-muted">Key points</p>
          <ul className="grid gap-1.5 p-0">
            {['Each state defines its valid transitions', 'Events, not elapsed time, drive them'].map((point) => (
              <li key={point} className="flex items-start gap-2 text-xs leading-snug text-text">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-solid" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <ul className="mt-auto flex flex-wrap gap-1.5 p-0">
          {['Transition', 'Guard condition', 'Final state'].map((term) => (
            <li
              key={term}
              className="list-none rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-strong"
            >
              {term}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-text-muted">Overview, key points, and terms from your note</p>
    </div>
  )
}

/**
 * The real hover/focus flashcard flip (see PlayDeckPage and index.css), with two
 * cards peeking out above it so it reads as a deck. Only the front card flips;
 * the cards behind it are decorative.
 */
function FlashcardDeckMock() {
  return (
    <div className="landing-interactive-card flex h-full flex-col gap-3.5 rounded-lg border border-border bg-surface p-5.5 shadow-sm">
      <p className="font-display text-xs font-bold uppercase tracking-wide text-accent-foreground">Flashcard deck</p>
      <div className="flex flex-1 items-center justify-center">
        <div className="relative h-48 w-full">
          <div
            aria-hidden="true"
            className="absolute inset-x-6 bottom-3 top-0 rounded-md border border-border bg-surface shadow-sm"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-3 bottom-1.5 top-3 rounded-md border border-border bg-surface shadow-sm"
          />
          <div className="flashcard flashcard--hover-flip absolute inset-x-0 bottom-0 top-6 cursor-pointer" tabIndex={0}>
            <div className="flashcard-face flashcard-face--front absolute inset-0 flex items-center justify-center rounded-md border border-border bg-surface-alt p-4.5 text-center font-semibold text-text shadow-sm transition-transform duration-500">
              <p>What does a state machine model?</p>
            </div>
            <div className="flashcard-face flashcard-face--back absolute inset-0 flex items-center justify-center rounded-md bg-accent-solid p-4.5 text-center font-semibold text-on-accent shadow-md transition-transform duration-500">
              <p>How a system moves between defined states in response to events.</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-text-muted">Hover or focus to flip</p>
    </div>
  )
}

const QUIZ_OPTIONS = [
  { value: 'true', label: 'True' },
  { value: 'false', label: 'False' },
] as const

/**
 * The realistic quiz-question preview. The answer is selectable so the card
 * responds to a click, but it grades nothing — it is only a preview.
 */
function QuizMock() {
  const [picked, setPicked] = useState<(typeof QUIZ_OPTIONS)[number]['value']>('true')

  return (
    <div className="landing-interactive-card flex h-full flex-col gap-3.5 rounded-lg border border-border bg-surface p-5.5 shadow-sm">
      <p className="font-display text-xs font-bold uppercase tracking-wide text-accent-foreground">Quiz - question 3 of 10</p>
      <div className="flex flex-1 flex-col justify-center gap-3.5 rounded-md bg-surface-alt p-4.5">
        <p className="text-sm font-bold">A sequence diagram represents interactions over time.</p>
        <ul className="grid gap-2 p-0 text-sm">
          {QUIZ_OPTIONS.map((option) => {
            const isPicked = picked === option.value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => setPicked(option.value)}
                  aria-pressed={isPicked}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-sm border px-3 py-2.25 text-left transition-colors duration-150 ${
                    isPicked
                      ? 'border-success-solid bg-success-soft font-bold text-success-solid'
                      : 'border-border bg-surface text-text hover:border-text-muted'
                  }`}
                >
                  <span
                    className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-xs ${
                      isPicked
                        ? 'border-success-solid bg-success-solid text-on-status'
                        : 'border-border'
                    }`}
                  >
                    {isPicked ? '✓' : ''}
                  </span>
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <p className="text-xs text-text-muted">Multiple choice or true/false, from your note</p>
    </div>
  )
}
