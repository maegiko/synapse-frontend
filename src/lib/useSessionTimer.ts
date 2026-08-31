import { useCallback, useEffect, useRef } from 'react'

/**
 * How long the visitor has actually spent on a study session, in whole seconds.
 *
 * <p>Measured with `performance.now()`, which is monotonic: a clock correction
 * or a daylight-saving jump mid-session cannot make a run appear to take
 * minutes longer, or to have finished before it started, the way two wall-clock
 * timestamps could.</p>
 *
 * <p>The clock is paused whenever the page is hidden, so a tab left open in the
 * background overnight does not report a nine-hour deck review. It starts on
 * mount and runs until the component unmounts; the session's owner decides when
 * to read it, and reading it never stops it.</p>
 */
export function useSessionTimer(): () => number {
  // Written from event handlers between renders, so it is a ref rather than
  // state: nothing on screen depends on it, and re-rendering the player once a
  // second to advance a number nobody sees would be waste.
  const timer = useRef({
    /** Visible milliseconds banked before the current visible stretch. */
    accumulatedMs: 0,
    /** When the current visible stretch began, or null while hidden. */
    startedAt: null as number | null,
  })

  useEffect(() => {
    // Started here rather than in the ref's initial value: reading the clock is
    // not something a render may do, and the sub-millisecond gap between the
    // first render and this effect is not worth counting.
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
