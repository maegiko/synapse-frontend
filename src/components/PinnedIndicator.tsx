import { IconPin } from './icons'
import { pinnedTone } from './ui'

interface PinnedIndicatorProps {
  /** Placement inside the card's header row; the tone and size are fixed. */
  className?: string
}

/**
 * Marks a listed note, deck, or quiz as pinned.
 *
 * Deliberately a status and not a control: these cards are already links end to
 * end, so a nested button here would be unreachable inside the anchor and would
 * compete with the card's own target. Pinning is done from the detail page.
 *
 * The pin shape carries the meaning on screen and the `sr-only` label carries
 * it to assistive technology, so the gold is never the only signal.
 */
export function PinnedIndicator({ className = '' }: PinnedIndicatorProps) {
  return (
    <span className={`inline-flex ${pinnedTone} ${className}`} title="Pinned">
      <IconPin className="h-4 w-4" filled />
      <span className="sr-only">Pinned</span>
    </span>
  )
}
