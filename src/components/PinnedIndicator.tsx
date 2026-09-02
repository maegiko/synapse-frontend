import { IconPin } from './icons'
import { pinnedTone } from './ui'

interface PinnedIndicatorProps {
  className?: string
}

/**
 * A status, not a control: these cards are links end to end, so a nested button
 * would be unreachable. Pinning is done from the detail page.
 */
export function PinnedIndicator({ className = '' }: PinnedIndicatorProps) {
  return (
    <span className={`inline-flex ${pinnedTone} ${className}`} title="Pinned">
      <IconPin className="h-4 w-4" filled />
      <span className="sr-only">Pinned</span>
    </span>
  )
}
