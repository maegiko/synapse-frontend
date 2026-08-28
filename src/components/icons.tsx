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

export function IconChart({ className = 'h-5.5 w-5.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M4 19V9M11 19V5M18 19v-6" strokeLinecap="round" />
      <path d="M4 19h16" strokeLinecap="round" />
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
