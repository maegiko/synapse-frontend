import { useEffect, useState } from 'react'

/** Long enough that a request follows a pause in typing, short enough to feel live. */
const DEFAULT_DELAY_MS = 300

/**
 * Trails a fast-changing value, in practice a search box, so the query behind it
 * only moves once typing pauses. Each new value restarts the wait, so a burst of
 * keystrokes settles into one request.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = DEFAULT_DELAY_MS): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
