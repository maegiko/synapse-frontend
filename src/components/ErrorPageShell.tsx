import type { ReactNode } from 'react'
import synapseLogo from '../assets/synapse_logo.webp'
import { iconChip, shell, surfaceCard } from './ui'

interface ErrorPageShellProps {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
  /** For the unexpected-error fallback. The 404 is a normal navigation and leaves it off. */
  announce?: boolean
}

/**
 * The shared frame behind both error destinations. Deliberately plain: no hooks,
 * no router links and no data, because the unexpected-error fallback renders it
 * after something else has already failed.
 */
export function ErrorPageShell({
  icon,
  title,
  description,
  children,
  announce = false,
}: ErrorPageShellProps) {
  return (
    <main className={`${shell} grid min-h-screen place-items-center py-14`}>
      <div className="w-full max-w-140">
        <div className="flex items-center justify-center gap-2.5 font-display text-lg font-medium text-text">
          <img
            src={synapseLogo}
            alt=""
            width="48"
            height="48"
            decoding="async"
            className="h-10 w-10 sm:h-11 sm:w-11"
          />
          <span className="translate-y-0.5">Synapse</span>
        </div>

        <div className={`${surfaceCard} app-card-in mt-6 px-6 py-9 text-center sm:px-10 sm:py-11`}>
          <div {...(announce ? { role: 'alert' } : {})}>
            <span className={`${iconChip} h-12 w-12`} aria-hidden="true">
              {icon}
            </span>
            <h1 className="mt-5 text-2xl text-balance sm:text-3xl">{title}</h1>
            <p className="mx-auto mt-3 max-w-[46ch] text-base text-pretty text-text-muted">{description}</p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
        </div>
      </div>
    </main>
  )
}
