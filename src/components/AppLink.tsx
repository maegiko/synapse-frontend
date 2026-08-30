import { Link } from 'react-router-dom'
import type { ComponentProps } from 'react'
import { useTrailState } from '../lib/backTrail'

type AppLinkProps = Omit<ComponentProps<typeof Link>, 'state'>

/**
 * A `Link` that records where it was clicked from, so the destination's
 * "Back to …" link names the page the visitor actually came from rather than a
 * hard-coded guess. Every link that moves between pages should be one of these.
 *
 * A back link is the exception: it rewinds the trail rather than adding to it,
 * which is `BackLink`'s job.
 */
export function AppLink(props: AppLinkProps) {
  const state = useTrailState()
  return <Link {...props} state={state} />
}
