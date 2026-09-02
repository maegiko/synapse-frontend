import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Every route starts at the top. The browser's own restoration is switched off
 * first, since it would run after this and win. Keyed on pathname only, so
 * in-page anchors and search-param changes keep their position.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
