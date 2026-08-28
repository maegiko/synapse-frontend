import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface RecentsItemProps {
  icon: ReactNode
  title: string
  /** When provided, the whole row navigates to the resource detail page. */
  to?: string
  /** Optional second line, e.g. a note overview or the first card's question. */
  preview?: string | null
  /** Compact facts displayed separately from the descriptive preview. */
  metadata: string[]
  /** Only shown for resources the API timestamps. */
  timestamp?: string
  /** Removes the stacked-row treatment when items share a horizontal strip. */
  compact?: boolean
}

/** One row in a quick-view card, optionally linked when its detail screen exists. */
export function RecentsItem({
  icon,
  title,
  to,
  preview,
  metadata,
  timestamp,
  compact = false,
}: RecentsItemProps) {
  const content = (
    <>
      <span
        className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent-strong"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-bold text-text ${
            to ? 'transition-colors group-hover:text-accent-solid' : ''
          }`}
        >
          {title}
        </p>
        {preview && <p className="mt-1 line-clamp-2 text-xs text-text-muted">{preview}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {metadata.map((item) => (
            <span
              key={item}
              className="rounded-full bg-surface-alt px-2 py-1 text-xs text-text-muted tabular-nums"
            >
              {item}
            </span>
          ))}
          {timestamp && (
            <span className="ml-auto shrink-0 text-xs text-text-muted tabular-nums">
              {timestamp}
            </span>
          )}
        </div>
      </div>
    </>
  )

  return (
    <li
      className={`min-w-0 ${
        compact
          ? 'border-b border-dashed border-border pb-4 last:border-b-0 last:pb-0 sm:border-r sm:border-b-0 sm:pr-4 sm:pb-0 sm:last:border-r-0 sm:last:pr-0'
          : 'border-b border-dashed border-border pb-4 last:border-b-0 last:pb-0'
      }`}
    >
      {to ? (
        <Link
          to={to}
          className="group -mx-2 -my-1 flex min-w-0 gap-3 rounded-sm px-2 py-1 no-underline transition-colors hover:bg-surface-alt"
        >
          {content}
        </Link>
      ) : (
        <div className="flex min-w-0 gap-3">{content}</div>
      )}
    </li>
  )
}
