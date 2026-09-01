import { useCallback, useEffect, useState } from 'react'

/**
 * Seconds left before an action a rate limit has closed can be tried again.
 *
 * The backend answers `429` with an integer `Retry-After` in seconds; this
 * counts that down once a second so the control can stay disabled and say when
 * it will work rather than inviting an attempt that is certain to fail.
 * Returns `0` whenever nothing is pending.
 */
export function useCooldown(): { remaining: number; start: (seconds: number | null) => void } {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setTimeout(() => setRemaining((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])

  // A missing or nonsensical header leaves the control usable rather than
  // stuck: the next attempt simply answers 429 again.
  const start = useCallback((seconds: number | null) => {
    setRemaining(seconds && seconds > 0 ? Math.ceil(seconds) : 0)
  }, [])

  return { remaining, start }
}
