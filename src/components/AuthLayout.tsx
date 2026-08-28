import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import synapseLogo from '../assets/synapse_logo.png'
import { authCard } from './ui'

interface AuthLayoutProps {
  title: string
  subtitle: string
  asideTitle: string
  asideBullets: string[]
  children: ReactNode
  footer: ReactNode
}

/** Split page used by both auth routes: the pitch on the left, form on the right. */
export function AuthLayout({
  title,
  subtitle,
  asideTitle,
  asideBullets,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
      <main className="flex flex-col px-6 py-8 sm:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 self-start font-display text-lg font-medium text-text no-underline lg:hidden"
        >
          <img src={synapseLogo} alt="" width="44" height="44" />
          <span>Synapse</span>
        </Link>

        <div className="mx-auto flex w-full max-w-115 flex-1 flex-col justify-center py-12">
          <h1 className="mb-2.5 text-2xl">{title}</h1>
          <p className="mb-7 text-base text-text-muted">{subtitle}</p>

          <div className={authCard}>{children}</div>

          <p className="mt-6 text-center text-sm text-text-muted">{footer}</p>
        </div>
      </main>

      <aside className="hidden bg-accent-solid px-12 py-8 text-on-accent lg:order-first lg:flex lg:flex-col">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 self-start font-display text-lg font-medium text-on-accent no-underline"
        >
          <img src={synapseLogo} alt="" width="44" height="44" />
          <span>Synapse</span>
        </Link>

        <div className="flex flex-1 items-center py-12">
          <div className="max-w-[38ch]">
            <h2 className="text-2xl text-on-accent">{asideTitle}</h2>
            <ul className="mt-8 grid gap-5 p-0">
              {asideBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-base">
                  <span className="mt-0.5 inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-on-accent text-accent-strong">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  )
}
