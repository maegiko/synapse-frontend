import type { ReactNode } from 'react'
import { AppLink } from './AppLink'
import { countPill } from './ui'

interface RecentsItemProps {
  icon: ReactNode
  title: string
  to?: string
  preview?: string | null
  metadata: string[]
  quietMeta?: boolean
  timestamp?: string
  compact?: boolean
}

export function RecentsItem({
  icon,
  title,
  to,
  preview,
  metadata,
  quietMeta = false,
  timestamp,
  compact = false,
}: RecentsItemProps) {
  const content = (
    <>
      <span className="mt-0.5 inline-flex shrink-0 text-accent-foreground" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`recents-title truncate text-sm font-medium text-text ${
            to ? 'transition-colors group-hover:text-accent-foreground' : ''
          }`}
        >
          {title}
        </p>
        {preview && <p className="mt-1 line-clamp-2 text-xs text-text-muted">{preview}</p>}
        {quietMeta ? (
          metadata.length > 0 && (
            <p className="mt-1 truncate text-xs text-text-muted tabular-nums">
              {metadata.join(' · ')}
            </p>
          )
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {metadata.map((item) => (
              <span key={item} className={countPill}>
                {item}
              </span>
            ))}
            {timestamp && (
              <span className="ml-auto shrink-0 text-xs text-text-muted tabular-nums">
                {timestamp}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  )

  return (
    <li
      className={`min-w-0 ${
        compact
          ? 'border-b border-border/85 pb-4 last:border-b-0 last:pb-0 sm:border-r sm:border-b-0 sm:px-5 sm:pb-0 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0'
          : 'border-b border-border/85 pb-4 last:border-b-0 last:pb-0'
      }`}
    >
      {to ? (
        <AppLink
          to={to}
          className="group -mx-2.5 -my-1.5 flex min-w-0 gap-3 rounded-md px-2.5 py-1.5 no-underline transition-colors hover:bg-surface-alt/60"
        >
          {content}
        </AppLink>
      ) : (
        <div className="flex min-w-0 gap-3">{content}</div>
      )}
    </li>
  )
}
