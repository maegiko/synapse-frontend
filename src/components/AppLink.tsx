import { Link } from 'react-router-dom'
import type { ComponentProps } from 'react'
import { useTrailState } from '../lib/backTrail'

interface AppLinkProps extends Omit<ComponentProps<typeof Link>, 'state'> {
  /** What this page should be called, when the route alone cannot say it. */
  trailLabel?: string
}

/**
 * A `Link` that records where it was clicked from, so the destination's back link
 * names the page the visitor came from. `BackLink` is the exception: it rewinds
 * the trail rather than adding to it.
 */
export function AppLink({ trailLabel, ...props }: AppLinkProps) {
  const state = useTrailState(trailLabel)
  return <Link {...props} state={state} />
}
