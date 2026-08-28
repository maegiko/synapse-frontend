import type { ReactNode } from 'react'

interface RecentsItemProps {
  icon: ReactNode
  title: string
  /** Optional second line, e.g. a note overview or the first card's question. */
  preview?: string | null
  /** Compact facts displayed separately from the descriptive preview. */
  metadata: string[]
  /** Only shown for resources the API timestamps. */
  timestamp?: string
}

/** One row in a quick-view card. Read-only until the detail screens exist. */
export function RecentsItem({ icon, title, preview, metadata, timestamp }: RecentsItemProps) {
  return (
    <li className="flex gap-3 border-b border-dashed border-border pb-4 last:border-b-0 last:pb-0">
      <span
        className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent-strong"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text">{title}</p>
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
    </li>
  )
}
