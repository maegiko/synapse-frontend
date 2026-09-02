import type { ReactNode } from 'react'

export interface DetailMetadataItem {
  key: string
  icon: ReactNode
  content: ReactNode
}

interface DetailMetadataProps {
  items: DetailMetadataItem[]
  className?: string
  label?: string
  compact?: boolean
  nowrap?: boolean
}

/** Icon-led metadata used directly below titles on resource detail pages. */
export function DetailMetadata({
  items,
  className = '',
  label = 'Details',
  compact = false,
  nowrap = false,
}: DetailMetadataProps) {
  return (
    <ul
      className={`m-0 flex list-none items-center p-0 text-text-muted tabular-nums ${
        nowrap ? 'flex-nowrap' : 'flex-wrap gap-y-2'
      } ${compact ? 'text-[0.75rem]' : 'text-xs'} ${className}`}
      aria-label={label}
    >
      {items.map((item, index) => (
        <li
          key={item.key}
          className={`flex min-h-5 items-center whitespace-nowrap leading-none ${
            compact ? 'gap-1.5' : 'gap-2'
          } ${
            index === 0
              ? ''
              : compact
                ? 'ml-2 border-l border-border pl-2'
                : 'ml-2.5 border-l border-border pl-2.5 sm:ml-3 sm:pl-3'
          }`}
        >
          <span
            className={`shrink-0 text-accent-foreground ${
              compact
                ? '[&>svg]:h-3.5 [&>svg]:w-3.5'
                : '[&>svg]:h-4 [&>svg]:w-4'
            }`}
          >
            {item.icon}
          </span>
          <span>{item.content}</span>
        </li>
      ))}
    </ul>
  )
}
