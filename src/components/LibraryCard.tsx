import type { ReactNode } from 'react'
import { AppLink } from './AppLink'
import { IconArrowRight } from './icons'
import { PinnedIndicator } from './PinnedIndicator'
import { iconChip, surfaceCard } from './ui'

interface LibraryCardProps {
  icon: ReactNode
  title: string
  /** Only set for types that have a detail page; the card is static without it. */
  to?: string
  /** Second line: a note's overview, a deck's first question, a quiz's blurb. */
  preview?: string | null
  /** Compact facts, each shown as a pill (a count string, or e.g. difficulty stars). */
  facts: ReactNode[]
  /** Only shown for resources the API timestamps. */
  timestamp?: string
  /** Pinned items are marked; unpinned ones show nothing rather than a blank slot. */
  pinned?: boolean
}

/** One item in the library grid. Linked only where a detail view exists. */
export function LibraryCard({
  icon,
  title,
  to,
  preview,
  facts,
  timestamp,
  pinned = false,
}: LibraryCardProps) {
  const content = (
    <>
      <div className="flex items-start gap-3.5">
        <span className={`${iconChip} shrink-0`} aria-hidden="true">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-bold text-text ${
              to ? 'transition-colors group-hover:text-accent-foreground' : ''
            }`}
          >
            {title}
          </p>
          {timestamp && <p className="mt-1 text-xs text-text-muted tabular-nums">{timestamp}</p>}
        </div>
        {/* Gold and static, beside the accent arrow that slides on hover: the
            two read as different things at a glance. */}
        {pinned && <PinnedIndicator className="mt-3 shrink-0" />}
        {to && (
          <IconArrowRight className="mt-3 h-4 w-4 shrink-0 text-accent-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
        )}
      </div>

      {preview && <p className="mt-3 line-clamp-3 text-xs text-text-muted">{preview}</p>}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        {facts.map((fact, i) => (
          <span
            key={i}
            className="inline-flex h-6.5 items-center rounded-full bg-surface-alt px-2 text-xs text-text-muted tabular-nums"
          >
            {fact}
          </span>
        ))}
      </div>
    </>
  )

  if (!to) {
    return <div className={`${surfaceCard} flex min-w-0 flex-col p-5`}>{content}</div>
  }

  return (
    <AppLink
      to={to}
      className={`${surfaceCard} group flex min-w-0 flex-col p-5 no-underline transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-0.5 hover:border-accent-solid hover:shadow-md`}
    >
      {content}
    </AppLink>
  )
}
