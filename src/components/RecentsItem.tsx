import type { ReactNode } from 'react'

interface RecentsItemProps {
  icon: ReactNode
  title: string
  /** Optional second line, e.g. a note overview or the first card's question. */
  preview?: string | null
  meta: string
  /** Only shown for resources the API timestamps. */
  timestamp?: string
}

/** One row in a quick-view card. Read-only until the detail screens exist. */
export function RecentsItem({ icon, title, preview, meta, timestamp }: RecentsItemProps) {
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
        <div className="mt-1.5 flex items-baseline justify-between gap-3 text-xs text-text-muted">
          <span className="truncate">{meta}</span>
          {timestamp && <span className="shrink-0">{timestamp}</span>}
        </div>
      </div>
    </li>
  )
}
