import { Link } from 'react-router-dom'
import type { ComponentProps } from 'react'
import { useTrailState } from '../lib/backTrail'

interface AppLinkProps extends Omit<ComponentProps<typeof Link>, 'state'> {
  /**
   * What the destination's back link should call *this* page, when the route
   * alone cannot say it — a group detail page passes the group's name, so the
   * next page offers "Back to Biology" rather than "Back to the group".
   */
  trailLabel?: string
}

/**
 * A `Link` that records where it was clicked from, so the destination's
 * "Back to …" link names the page the visitor actually came from rather than a
 * hard-coded guess. Every link that moves between pages should be one of these.
 *
 * A back link is the exception: it rewinds the trail rather than adding to it,
 * which is `BackLink`'s job.
 */
export function AppLink({ trailLabel, ...props }: AppLinkProps) {
  const state = useTrailState(trailLabel)
  return <Link {...props} state={state} />
}
