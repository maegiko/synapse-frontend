import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Every route starts at the top. Browsers restore the previous offset on back
 * and forward, so that is switched off first: left on, it would run after this
 * and win. Keyed on pathname only, so in-page anchors and search-param changes
 * (the note filter) keep their position.
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
