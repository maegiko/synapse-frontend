/**
 * Pin state is the backend's ordering concern: every list endpoint arrives with
 * pinned records first. Nothing here re-sorts a list, only reads the order given.
 */

/** Any record the API marks with a pin state. */
export interface Pinnable {
  pinned: boolean
}

/**
 * A defensive fallback only. Group content already arrives this way, so this is a
 * stable partition that leaves a correct list untouched, reference included.
 */
export function pinnedFirst<T extends Pinnable>(items: T[]): T[] {
  const pinned = items.filter((item) => item.pinned)
  if (pinned.length === 0 || pinned.length === items.length) return items
  return [...pinned, ...items.filter((item) => !item.pinned)]
}

/** What a paged list can currently say about its pinned records. */
export interface PinnedSlice<T> {
  items: T[]
  /**
   * True once every pinned record has been loaded. There is no pinned-only
   * parameter, but the pinned-first order makes them a prefix: the first unpinned
   * record settles it, and so does running out of pages.
   */
  isComplete: boolean
}

/** `loaded` is every record from the pages fetched so far, in the backend's order. */
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
