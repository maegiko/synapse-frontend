import { Link } from 'react-router-dom'
import type { MouseEvent } from 'react'
import { IconArrowLeft } from './icons'
import { useBackLink } from '../lib/backTrail'
import type { BackTarget } from '../lib/backTrail'

interface BackLinkProps {
  /**
   * Where to go when nothing led here — a bookmark, a pasted URL, a reload
   * after the history state was dropped.
   */
  fallback: BackTarget
  className?: string
  /** Left out where the surrounding treatment is a button rather than a quiet link. */
  showIcon?: boolean
  /**
   * Called with the resolved destination before leaving. Return false to hold
   * the visitor here, which is how a play session asks to confirm first. The
   * trail state comes along so a confirmed exit can navigate to exactly what
   * this link would have.
   */
  onLeave?: (to: string, state: Record<string, BackTarget[]>) => boolean
}

/**
 * The one "Back to …" control. Its destination and its wording both come from
 * the trail the visitor left behind, so playing a deck from the review queue
 * offers "Back to dashboard" while the same deck opened from the library
 * offers "Back to your decks".
 */
export function BackLink({ fallback, className, showIcon = true, onLeave }: BackLinkProps) {
  const back = useBackLink(fallback)

  return (
    <Link
      to={back.to}
      state={back.state}
      className={className}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (onLeave && !onLeave(back.to, back.state)) event.preventDefault()
      }}
    >
      {showIcon && <IconArrowLeft />}
      Back to {back.label}
    </Link>
  )
}
