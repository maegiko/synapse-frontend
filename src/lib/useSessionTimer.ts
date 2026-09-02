import { useCallback, useEffect, useRef } from 'react'

/**
 * How long the visitor has actually spent on a study session, in whole seconds.
 * Measured with `performance.now()`, which is monotonic, so a clock correction
 * mid-session cannot make a run appear to finish before it started. The clock
 * pauses while the page is hidden.
 */
export function useSessionTimer(): () => number {
  const timer = useRef({
    accumulatedMs: 0,
    startedAt: null as number | null,
  })

  useEffect(() => {
    timer.current.startedAt ??= isVisible() ? performance.now() : null

    function onVisibilityChange() {
      const state = timer.current
      if (isVisible()) {
        state.startedAt ??= performance.now()
        return
      }
      if (state.startedAt !== null) {
        state.accumulatedMs += performance.now() - state.startedAt
        state.startedAt = null
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  return useCallback(() => {
    const state = timer.current
    const openStretch = state.startedAt === null ? 0 : performance.now() - state.startedAt
    return Math.max(0, Math.round((state.accumulatedMs + openStretch) / 1000))
  }, [])
}

/** `document.visibilityState` is unavailable in some non-browser environments. */
function isVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden'
}
