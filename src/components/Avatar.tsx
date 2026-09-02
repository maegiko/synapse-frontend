/** First and last initial, which is all the API gives us: there is no avatar endpoint. */
function initialsOf(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const letters = words.length === 1 ? [words[0]] : [words[0], words[words.length - 1]]
  return letters.map((word) => word[0]?.toUpperCase() ?? '').join('')
}

interface AvatarProps {
  fullName: string
  size?: 'sm' | 'lg'
  className?: string
}

export function Avatar({ fullName, size = 'sm', className = '' }: AvatarProps) {
  const sizing = size === 'lg' ? 'h-14 w-14 text-lg' : 'h-9 w-9 text-sm'
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-sm bg-accent-soft font-bold text-accent-strong ${sizing} ${className}`}
    >
      {initialsOf(fullName)}
    </span>
  )
}
