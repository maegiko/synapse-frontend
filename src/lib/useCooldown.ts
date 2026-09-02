import { useCallback, useEffect, useState } from 'react'

/**
 * Seconds left before an action a rate limit closed can be tried again, counted
 * down from the `429`'s `Retry-After` so a control can say when it will work.
 * Returns 0 whenever nothing is pending.
 */
export function useCooldown(): { remaining: number; start: (seconds: number | null) => void } {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setTimeout(() => setRemaining((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])

  const start = useCallback((seconds: number | null) => {
    setRemaining(seconds && seconds > 0 ? Math.ceil(seconds) : 0)
  }, [])

  return { remaining, start }
}
