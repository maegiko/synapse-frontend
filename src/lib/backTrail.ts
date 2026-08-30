import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { NavigateOptions } from 'react-router-dom'

/**
 * One page on the trail behind the visitor: where it is, and the noun phrase a
 * "Back to …" link uses to name it.
 */
export interface BackTarget {
  to: string
  label: string
}

/** The fallback for every page that hangs off the dashboard by default. */
export const DASHBOARD_BACK: BackTarget = { to: '/dashboard', label: 'dashboard' }

/**
 * How many steps of the trail are carried. A trail only ever needs the next
 * rung up, but keeping a few means a deep run of back links keeps unwinding the
 * real route rather than dropping to a fallback after the first hop. The cap
 * stops a long session from carrying an ever-growing history object.
 */
const MAX_TRAIL = 6

/** The key the trail travels under in react-router's location state. */
const TRAIL_KEY = 'backTrail'

/**
 * How each route names itself when it is the page someone came *from*.
 *
 * Returning null means the route is never a back destination:
 *   - the creation pages replace themselves with the thing they created, so
 *     they are gone by the time a back link could point at one;
 *   - a play session is left, not returned to;
 *   - the signed-out pages are behind the auth boundary.
 * A null route passes the inherited trail straight through, which is what makes
 * "generate a deck from the dashboard" land on a deck whose back link still
 * says dashboard.
 */
function describeRoute(pathname: string, search: string): BackTarget | null {
  // A trailing slash is the same page, and would otherwise read as a new one.
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  if (path === '/dashboard') return { to: path, label: 'dashboard' }
  if (path === '/profile') return { to: path, label: 'your profile' }

  if (path === '/groups') return { to: path, label: 'your groups' }

  if (path === '/library') {
    // The library is one page per type as far as the visitor is concerned, so
    // the filter is part of both the destination and its name.
    const type = new URLSearchParams(search).get('type')
    if (type === 'notes') return { to: '/library?type=notes', label: 'your notes' }
    if (type === 'decks') return { to: '/library?type=decks', label: 'your decks' }
    if (type === 'quizzes') return { to: '/library?type=quizzes', label: 'your quizzes' }
    return { to: '/library', label: 'your library' }
  }

  // The creation routes sit under the same shapes as the detail routes below,
  // and are never a back destination: each replaces itself with what it made.
  if (path === '/notes/new' || path === '/flashcards/new' || path === '/quiz/new') return null

  // Detail routes. Their query strings are view state — a shuffle flag, say —
  // rather than identity, so only the path is kept.
  if (/^\/notes\/[^/]+$/.test(path)) return { to: path, label: 'the note' }
  if (/^\/flashcards\/[^/]+$/.test(path)) return { to: path, label: 'deck overview' }
  if (/^\/quiz\/[^/]+$/.test(path)) return { to: path, label: 'quiz overview' }
  if (/^\/quiz\/[^/]+\/scores$/.test(path)) return { to: path, label: 'attempt history' }
  // A group names itself: the pages it leads to override this with the group's
  // own name, so "the group" is only the fallback before that name is known.
  if (/^\/groups\/[^/]+$/.test(path)) return { to: path, label: 'the group' }

  return null
}

/**
 * The trail arrives as history state, which anyone can hand-edit and which
 * outlives a deploy, so it is read defensively rather than trusted.
 */
function readTrail(state: unknown): BackTarget[] {
  const raw = (state as Record<string, unknown> | null)?.[TRAIL_KEY]
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (entry): entry is BackTarget =>
        typeof entry?.to === 'string' && typeof entry?.label === 'string',
    )
    .slice(-MAX_TRAIL)
}

/**
 * Revisiting a page that is already on the trail unwinds to it instead of
 * stacking another copy, so bouncing between two pages cannot grow the trail
 * or make a back link point at the page it was just clicked on.
 */
function pushTrail(trail: BackTarget[], here: BackTarget): BackTarget[] {
  const seen = trail.findIndex((entry) => entry.to === here.to)
  const base = seen === -1 ? trail : trail.slice(0, seen)
  return [...base, here].slice(-MAX_TRAIL)
}

/** The trail behind the current page, oldest first. */
export function useBackTrail(): BackTarget[] {
  return readTrail(useLocation().state)
}

/**
 * The location state to attach to any link leading *away* from this page: the
 * trail so far, with this page on the end. Every forward navigation carries it,
 * which is the whole mechanism — a page's back link is simply the last rung.
 */
export function useTrailState(labelOverride?: string): Record<string, BackTarget[]> {
  const location = useLocation()
  const trail = readTrail(location.state)
  const route = describeRoute(location.pathname, location.search)
  // A page that knows its own name — a group's, say — supplies it, so the back
  // link reads "Back to Biology" instead of the route's generic label.
  const here = route && labelOverride ? { ...route, label: labelOverride } : route
  return { [TRAIL_KEY]: here ? pushTrail(trail, here) : trail }
}

export interface ResolvedBackLink extends BackTarget {
  /** The trail minus the rung being stepped onto, so the destination knows its own way back. */
  state: Record<string, BackTarget[]>
}

/**
 * Where this page's "Back to …" link goes: the page that actually led here, or
 * `fallback` for a visit that started here (a bookmark, a fresh tab, a reload).
 */
export function useBackLink(fallback: BackTarget): ResolvedBackLink {
  const { state } = useLocation()
  // Memoised on the two things that can actually change it, so the result is
  // stable enough to be an effect dependency — the exit guards on the play
  // pages listen for the browser's Back button and must not reinstall that
  // listener on every render.
  return useMemo(() => {
    const trail = readTrail(state)
    const previous = trail[trail.length - 1]
    if (!previous) {
      return { to: fallback.to, label: fallback.label, state: { [TRAIL_KEY]: [] } }
    }
    return { ...previous, state: { [TRAIL_KEY]: trail.slice(0, -1) } }
  }, [state, fallback.to, fallback.label])
}

/**
 * `useNavigate`, with the trail attached — the programmatic twin of `AppLink`,
 * for the redirects that follow a mutation.
 */
export function useTrailNavigate() {
  const navigate = useNavigate()
  const state = useTrailState()
  return (to: string, options?: NavigateOptions) => navigate(to, { ...options, state })
}
