import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { NavigateOptions } from 'react-router-dom'

export interface BackTarget {
  to: string
  label: string
}

/** The fallback for every page that hangs off the dashboard by default. */
export const DASHBOARD_BACK: BackTarget = { to: '/dashboard', label: 'dashboard' }

/**
 * How many steps are carried. One rung is all a back link needs, but a few means
 * a deep run keeps unwinding the real route instead of falling back.
 */
const MAX_TRAIL = 6

/** The key the trail travels under in react-router's location state. */
const TRAIL_KEY = 'backTrail'

/**
 * How each route names itself when it is the page someone came from. Null means
 * the route is never a back destination, and passes the inherited trail through:
 * the creation pages replace themselves, a play session is left rather than
 * returned to, and the signed-out pages are behind the auth boundary.
 */
function describeRoute(pathname: string, search: string): BackTarget | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  if (path === '/dashboard') return { to: path, label: 'dashboard' }
  if (path === '/profile') return { to: path, label: 'your profile' }
  if (path === '/analytics') return { to: path, label: 'your progress' }

  if (path === '/groups') return { to: path, label: 'your groups' }

  if (path === '/library') {
    const type = new URLSearchParams(search).get('type')
    if (type === 'notes') return { to: '/library?type=notes', label: 'your notes' }
    if (type === 'decks') return { to: '/library?type=decks', label: 'your decks' }
    if (type === 'quizzes') return { to: '/library?type=quizzes', label: 'your quizzes' }
    return { to: '/library', label: 'your library' }
  }

  if (path === '/notes/new' || path === '/flashcards/new' || path === '/quiz/new') return null

  if (/^\/notes\/[^/]+$/.test(path)) return { to: path, label: 'the note' }
  if (/^\/flashcards\/[^/]+$/.test(path)) return { to: path, label: 'deck overview' }
  if (/^\/quiz\/[^/]+$/.test(path)) return { to: path, label: 'quiz overview' }
  if (/^\/quiz\/[^/]+\/scores$/.test(path)) return { to: path, label: 'attempt history' }
  if (/^\/groups\/[^/]+$/.test(path)) return { to: path, label: 'the group' }

  return null
}

/** History state is hand-editable and outlives a deploy, so it is not trusted. */
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
 * Revisiting a page already on the trail unwinds to it rather than stacking a
 * copy, so bouncing between two pages cannot grow it.
 */
function pushTrail(trail: BackTarget[], here: BackTarget): BackTarget[] {
  const seen = trail.findIndex((entry) => entry.to === here.to)
  const base = seen === -1 ? trail : trail.slice(0, seen)
  return [...base, here].slice(-MAX_TRAIL)
}

/**
 * Whether a rung points at the page already on screen. Search is part of the
 * identity, so the Notes and Decks library filters still lead back to one
 * another; a hash is view state and is not.
 */
function pointsAtCurrentPage(target: BackTarget, pathname: string, search: string): boolean {
  try {
    const destination = new URL(target.to, 'https://synapse.local')
    const currentPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
    const destinationPath =
      destination.pathname.length > 1
        ? destination.pathname.replace(/\/+$/, '')
        : destination.pathname
    return destinationPath === currentPath && destination.search === search
  } catch {
    return false
  }
}

/** The trail behind the current page, oldest first. */
export function useBackTrail(): BackTarget[] {
  return readTrail(useLocation().state)
}

/** The trail so far with this page on the end, for any link leading away. */
export function useTrailState(labelOverride?: string): Record<string, BackTarget[]> {
  const location = useLocation()
  const trail = readTrail(location.state)
  const route = describeRoute(location.pathname, location.search)
  const here = route && labelOverride ? { ...route, label: labelOverride } : route
  return { [TRAIL_KEY]: here ? pushTrail(trail, here) : trail }
}

export interface ResolvedBackLink extends BackTarget {
  state: Record<string, BackTarget[]>
}

/** The page that actually led here, or `fallback` for a visit that started here. */
export function useBackLink(fallback: BackTarget): ResolvedBackLink {
  const { pathname, search, state } = useLocation()
  return useMemo(() => {
    const trail = readTrail(state)
    let previousIndex = trail.length - 1
    while (
      previousIndex >= 0 &&
      pointsAtCurrentPage(trail[previousIndex], pathname, search)
    ) {
      previousIndex -= 1
    }

    const previous = trail[previousIndex]
    if (!previous) {
      return { to: fallback.to, label: fallback.label, state: { [TRAIL_KEY]: [] } }
    }
    return { ...previous, state: { [TRAIL_KEY]: trail.slice(0, previousIndex) } }
  }, [pathname, search, state, fallback.to, fallback.label])
}

/** `useNavigate` with the trail attached, for redirects that follow a mutation. */
export function useTrailNavigate() {
  const navigate = useNavigate()
  const state = useTrailState()
  return (to: string, options?: NavigateOptions) => navigate(to, { ...options, state })
}
