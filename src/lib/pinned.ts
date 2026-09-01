/**
 * Pin state is the backend's ordering concern rather than the client's: the
 * note, deck, and quiz list endpoints, and each of a group's three content
 * lists, all arrive with pinned records first. Nothing here re-sorts a list
 * into a different order — these helpers only read the one it came in.
 */

/** Any record the API marks with a pin state. */
export interface Pinnable {
  pinned: boolean
}

/**
 * Pinned items first, everything else in the order it arrived. A defensive
 * fallback only: group content already comes back this way, so this is a stable
 * partition that leaves a correctly ordered list untouched — reference
 * included — and degrades an out-of-order one to the right shape instead of
 * imposing a second, contradictory sort.
 */
export function pinnedFirst<T extends Pinnable>(items: T[]): T[] {
  const pinned = items.filter((item) => item.pinned)
  if (pinned.length === 0 || pinned.length === items.length) return items
  return [...pinned, ...items.filter((item) => !item.pinned)]
}

/** What a paged list can currently say about its pinned records. */
export interface PinnedSlice<T> {
  /** The pinned records among the pages loaded so far. */
  items: T[]
  /**
   * True once every pinned record the query matches has been loaded. There is
   * no pinned-only parameter on the list endpoints, but the pinned-first order
   * means the pinned records are a prefix of the whole result: the moment an
   * unpinned one appears, nothing pinned can follow it, and running out of
   * pages settles it too. Until then the pinned set on screen is a partial one,
   * so no count is claimed from it.
   */
  isComplete: boolean
}

/**
 * The pinned prefix of a paged list, and whether it is all of it. `loaded` is
 * every record from the pages fetched so far, in the order the backend gave.
 */
export function pinnedSlice<T extends Pinnable>(
  loaded: T[],
  query: { isSuccess: boolean; hasNextPage: boolean },
): PinnedSlice<T> {
  return {
    items: loaded.filter((item) => item.pinned),
    isComplete:
      query.isSuccess && (loaded.some((item) => !item.pinned) || !query.hasNextPage),
  }
}
