import { useEffect } from 'react'
import { matchPath, useLocation } from 'react-router-dom'

const PROTECTED_TITLES = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/profile', label: 'Profile' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/library', label: 'Library' },
  { path: '/groups', label: 'Groups' },
  { path: '/groups/:groupId', label: 'Group' },
  { path: '/notes/new', label: 'New Note' },
  { path: '/notes/:noteId', label: 'Note' },
  { path: '/flashcards/new', label: 'New Deck' },
  { path: '/flashcards/:deckId/play', label: 'Review' },
  { path: '/flashcards/:deckId', label: 'Deck' },
  { path: '/quiz/new', label: 'New Quiz' },
  { path: '/quiz/:quizId/scores', label: 'Scores' },
  { path: '/quiz/:quizId/play', label: 'Quiz' },
  { path: '/quiz/:quizId', label: 'Quiz' },
  // These legacy addresses immediately redirect into the filtered library.
  { path: '/notes', label: 'Library' },
  { path: '/flashcards', label: 'Library' },
  { path: '/quiz', label: 'Library' },
] as const

/** Gives every protected route a short, stable browser and history title. */
export function ProtectedPageTitle() {
  const { pathname } = useLocation()
  const page = PROTECTED_TITLES.find(({ path }) => matchPath({ path, end: true }, pathname))

  useEffect(() => {
    if (!page) return
    const previous = document.title
    document.title = `Synapse | ${page.label}`
    return () => {
      document.title = previous
    }
  }, [page])

  return null
}
