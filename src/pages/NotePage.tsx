import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { IconArrowLeft, IconArrowRight } from '../components/icons'
import { btnGhostSm, cardLink, countPill, shell, surfaceCard } from '../components/ui'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import { useNote } from '../lib/queries'
import type { NoteSummary } from '../api'

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
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

function NoteContent({ note }: { note: NoteSummary }) {
  return (
    <>
      <h1 className="text-3xl">{note.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={countPill}>{plural(note.keypoints.length, 'key point')}</span>
        <span className={countPill}>{plural(note.concepts.length, 'concept')}</span>
        <span className={countPill}>{plural(note.importantTerms.length, 'term')}</span>
      </div>

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
        <Link to="/dashboard" className={cardLink}>
          <IconArrowLeft />
          Back to dashboard
        </Link>

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
                <Link to="/notes/new" className={cardLink}>
                  Summarise a note
                  <IconArrowRight />
                </Link>
              </div>
            </div>
          )}

          {note.isSuccess && <NoteContent note={note.data} />}
        </div>
      </main>
    </>
  )
}
