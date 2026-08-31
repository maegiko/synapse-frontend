/** Shared line icons. Stroke-based, 24x24 viewBox, sized by the caller. */

interface IconProps {
  className?: string
}

export function IconUpload({ className = 'h-5.5 w-5.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M12 16V4M12 4 7 9M12 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconSummary({ className = 'h-5.5 w-5.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M12 3.5 13.6 8l4.4 1.6-4.4 1.6L12 15.7 10.4 11.2 6 9.6l4.4-1.6L12 3.5Z" strokeLinejoin="round" />
      <path d="M19 15.5v3M17.5 17h3" strokeLinecap="round" />
    </svg>
  )
}

export function IconDeck({ className = 'h-5.5 w-5.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <rect x="6" y="7" width="13" height="9" rx="1.6" />
      <path d="M4 10v6a2 2 0 0 0 2 2h9" strokeLinecap="round" />
    </svg>
  )
}

/** One flashcard, distinct from the stacked-card deck icon. */
export function IconCard({ className = 'h-5.5 w-5.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="13" rx="2" />
      <path d="M8 10h8M8 14h5" strokeLinecap="round" />
    </svg>
  )
}

export function IconChart({ className = 'h-5.5 w-5.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M4 19V9M11 19V5M18 19v-6" strokeLinecap="round" />
      <path d="M4 19h16" strokeLinecap="round" />
    </svg>
  )
}

export function IconClock({ className = 'h-5.5 w-5.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconQuiz({ className = 'h-5.5 w-5.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H16l3 3v11.5A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-13Z" strokeLinejoin="round" />
      <path d="m9 12.5 2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconCheck({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={className} aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Indeterminate progress ring. Decorative, so pair it with a text status. */
export function IconSpinner({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`animate-spin ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
    </svg>
  )
}

export function IconArrowLeft({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M19 12H6M11 6.5 5.5 12 11 17.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconArrowRight({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M5 12h13M13 6.5 18.5 12 13 17.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconNote({ className = 'h-5.5 w-5.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3H14l4 4v12.5A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5v-15Z" strokeLinejoin="round" />
      <path d="M13.5 3v4.5H18M9 12h6M9 15.5h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconPlay({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M7.5 5.2v13.6L19 12 7.5 5.2Z" strokeLinejoin="round" />
    </svg>
  )
}

export function IconPlus({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M12 5.5v13M5.5 12h13" strokeLinecap="round" />
    </svg>
  )
}

export function IconX({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}

export function IconTrash({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden="true">
      <path d="M4.5 7h15M9.5 7V5.6A1.6 1.6 0 0 1 11.1 4h1.8a1.6 1.6 0 0 1 1.6 1.6V7" strokeLinecap="round" />
      <path d="m6.7 7 .8 12.1a1.6 1.6 0 0 0 1.6 1.4h5.8a1.6 1.6 0 0 0 1.6-1.4L17.3 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.4 10.8v6M13.6 10.8v6" strokeLinecap="round" />
    </svg>
  )
}

/** A study group: a folder, since a group is a folder over existing content. */
export function IconGroup({ className = 'h-5.5 w-5.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M3.5 7.4A1.9 1.9 0 0 1 5.4 5.5h3.3l1.9 2.3h8A1.9 1.9 0 0 1 20.5 9.7v7.1a1.9 1.9 0 0 1-1.9 1.9H5.4a1.9 1.9 0 0 1-1.9-1.9V7.4Z" strokeLinejoin="round" />
    </svg>
  )
}

export function IconPencil({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="m15.4 5.4 3.2 3.2M4.5 19.5l.7-3.6L16 5.1a1.6 1.6 0 0 1 2.3 0l1.6 1.6a1.6 1.6 0 0 1 0 2.3L9.1 18.8l-4.6.7Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Leaving a group: an item stepping out of a container. */
export function IconRemoveFromGroup({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M13.5 4.5h4.6a1.9 1.9 0 0 1 1.9 1.9v11.2a1.9 1.9 0 0 1-1.9 1.9h-4.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 12H3.5M6.6 8.9 3.5 12l3.1 3.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** A study streak, matching the flame the streak card and profile already use. */
export function IconFlame({ className = 'h-5.5 w-5.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M12 3.5c.5 2.4 2 3.6 3.2 4.9A6.3 6.3 0 0 1 17.2 13a5.2 5.2 0 0 1-10.4 0c0-1.7.6-3 1.6-4.2.3.9.9 1.5 1.6 1.8-.4-2.6.3-5 2-7.1Z" strokeLinejoin="round" />
    </svg>
  )
}

/** Nothing recorded: a broken outline, the visual opposite of {@link IconCheck}. */
export function IconCircleDashed({ className = 'h-5.5 w-5.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" strokeDasharray="3 3.4" strokeLinecap="round" />
    </svg>
  )
}

/** Whole stars only, so this is either filled or outlined — never partial. */
export function IconStar({ className = 'h-7 w-7', filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9L12 3.6Z" strokeLinejoin="round" />
    </svg>
  )
}
