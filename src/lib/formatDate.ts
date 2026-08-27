/**
 * `createdAt` is an ISO local date-time with no offset, so it is a display
 * value only. Never treat it as an instant with a known timezone.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Relative age for recent items, falling back to the absolute date after a
 * week. `createdAt` carries no offset, so this reads it as browser-local time;
 * a server in another timezone will skew the very newest labels.
 */
export function formatRelative(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const minutes = Math.round((Date.now() - date.getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`

  return formatDate(value)
}
