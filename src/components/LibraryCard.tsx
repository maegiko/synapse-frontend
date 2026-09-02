import type { ReactNode } from 'react'
import { AppLink } from './AppLink'
import { DetailMetadata } from './DetailMetadata'
import type { DetailMetadataItem } from './DetailMetadata'
import { IconArrowRight, IconClock } from './icons'
import { PinnedIndicator } from './PinnedIndicator'
import { iconChip, surfaceCard } from './ui'

interface LibraryCardProps {
  icon: ReactNode
  title: string
  to?: string
  preview?: string | null
  facts: DetailMetadataItem[]
  timestamp?: string
  pinned?: boolean
}

export function LibraryCard({
  icon,
  title,
  to,
  preview,
  facts,
  timestamp,
  pinned = false,
}: LibraryCardProps) {
  const metadata = timestamp
    ? [
        ...facts,
        {
          key: 'timestamp',
          icon: <IconClock />,
          content: timestamp,
        },
      ]
    : facts

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
        </div>
        {pinned && <PinnedIndicator className="mt-3 shrink-0" />}
        {to && (
          <IconArrowRight className="mt-3 h-4 w-4 shrink-0 text-accent-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
        )}
      </div>

      {preview && <p className="mt-3 line-clamp-3 text-xs text-text-muted">{preview}</p>}

      <DetailMetadata
        className="mt-auto pt-4"
        items={metadata}
        label={`${title} details`}
        compact
        nowrap
      />
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
