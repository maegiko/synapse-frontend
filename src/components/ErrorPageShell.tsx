import type { ReactNode } from 'react'
import synapseLogo from '../assets/synapse_logo.webp'
import { iconChip, shell, surfaceCard } from './ui'

interface ErrorPageShellProps {
  /** The icon shown in the chip above the heading. */
  icon: ReactNode
  title: string
  description: string
  /** The recovery actions: the primary one first, so it is the first tab stop. */
  children: ReactNode
  /**
   * Announces the heading and its supporting text when the page appears, for
   * the unexpected-error fallback. The 404 leaves this off: it is a normal
   * navigation, and the routine page change needs no alert.
   */
  announce?: boolean
}

/**
 * The shared frame behind both error destinations: wordmark, one icon, one
 * heading, one line of explanation, and the recovery actions.
 *
 * Deliberately plain. It holds no hooks, no router links and no data, because
 * the unexpected-error fallback renders it after something else in the app has
 * already failed. The actions are passed in, so the page above can use a
 * router link or a native one as its own situation allows.
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

        <div className={`${surfaceCard} mt-6 px-6 py-9 text-center sm:px-10 sm:py-11`}>
          <div {...(announce ? { role: 'alert' } : {})}>
            <span className={`${iconChip} h-12 w-12`} aria-hidden="true">
              {icon}
            </span>
            <h1 className="mt-5 text-2xl text-balance sm:text-3xl">{title}</h1>
            <p className="mx-auto mt-3 max-w-[46ch] text-base text-pretty text-text-muted">{description}</p>
          </div>

          {/*
            No header sits above this page, so the primary action is the first
            tab stop on load. Nothing is focused programmatically: that would
            talk over the alert the fallback has just announced.
          */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
        </div>
      </div>
    </main>
  )
}
