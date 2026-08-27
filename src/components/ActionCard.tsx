import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconArrowRight } from './icons'
import { iconChip, surfaceCard } from './ui'

interface ActionCardProps {
  to: string
  icon: ReactNode
  /** Decorative artwork, bled off the card's bottom-right corner. */
  art: ReactNode
  title: string
  body: string
  cta: string
  /** Flashcards and quizzes are generated from a note, so they need one first. */
  blockedReason?: string
}

export function ActionCard({ to, icon, art, title, body, cta, blockedReason }: ActionCardProps) {
  const inner = (
    <>
      <span
        className="pointer-events-none absolute top-1/2 -right-8 block w-32 -translate-y-1/2 opacity-90 md:hidden lg:block xl:w-38"
        aria-hidden="true"
      >
        {art}
      </span>
      <span className={`${iconChip} relative`}>{icon}</span>
      <h3 className="relative mt-4 mb-2 font-body text-base font-bold">{title}</h3>
      <p className="relative max-w-[22ch] text-sm text-text-muted">{body}</p>
    </>
  )

  if (blockedReason) {
    return (
      <div
        className={`${surfaceCard} relative flex flex-col overflow-hidden p-6 opacity-60`}
        aria-disabled="true"
      >
        {inner}
        <p className="relative mt-auto pt-4 text-xs font-bold text-text-muted">{blockedReason}</p>
      </div>
    )
  }

  return (
    <Link
      to={to}
      className={`${surfaceCard} group relative flex flex-col overflow-hidden p-6 no-underline transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-0.5 hover:border-accent-solid hover:shadow-md`}
    >
      {inner}
      <span className="relative mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-accent-solid transition-transform duration-150 group-hover:translate-x-0.5">
        {cta}
        <IconArrowRight />
      </span>
    </Link>
  )
}
