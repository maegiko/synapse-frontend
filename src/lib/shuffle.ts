/** mulberry32: a seeded generator, so one seed always deals the same order. */
function randomFrom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Fisher-Yates on a copy, so the query cache's array is never reordered. The
 * shuffle is seeded rather than free: `useMemo` may drop its cache at any time,
 * and a re-shuffle mid-run would repeat items and skip others.
 */
export function shuffled<T>(items: T[], seed: number): T[] {
  const random = randomFrom(seed)
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** A fresh seed, for the start of a run or a replay. */
export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 32)
}
