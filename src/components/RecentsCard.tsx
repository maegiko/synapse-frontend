import type { ReactNode } from 'react'
import { AppLink } from './AppLink'
import { IconArrowRight } from './icons'
import { cardLink } from './ui'

type RecentsVariant = 'strip' | 'flat'

interface RecentsCardProps {
  title: string
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  emptyMessage: string
  children: ReactNode
  /** True once the request succeeded and returned nothing. */
  isEmpty: boolean
  viewAllTo: string
  viewAllLabel: string
  /** `strip` is the compact three-across deck row; `flat` is a stacked list. */
  variant?: RecentsVariant
  className?: string
}

function Skeleton({ variant }: { variant: RecentsVariant }) {
  const isStrip = variant === 'strip'
  return (
    <div className={`grid gap-5 ${isStrip ? 'sm:grid-cols-3' : ''}`} aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-3">
          {isStrip && <span className="h-8 w-8 shrink-0 animate-pulse rounded-sm bg-surface-alt" />}
          <div className="grid flex-1 gap-2">
            <span className="block h-3.5 w-2/3 animate-pulse rounded-full bg-surface-alt" />
            <span className="block h-3 w-full animate-pulse rounded-full bg-surface-alt" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * One resource's recent items: a header, the newest few, and a way in. Rendered
 * without chrome of its own — the dashboard's Library surface is the frame, and
 * this is one section inside it.
 */
export function RecentsCard({
  title,
  isLoading,
  isError,
  onRetry,
  emptyMessage,
  isEmpty,
  children,
  viewAllTo,
  viewAllLabel,
  variant = 'flat',
  className = '',
}: RecentsCardProps) {
  const isStrip = variant === 'strip'

  return (
    <section className={`flex min-w-0 flex-col ${className}`}>
      <div className="flex items-center gap-3 pb-4">
        <h3 className="text-base font-medium">{title}</h3>
        <AppLink to={viewAllTo} className={`${cardLink} ml-auto`}>
          {viewAllLabel}
          <IconArrowRight />
        </AppLink>
      </div>

      <div className="min-w-0 flex-1">
        {isLoading && <Skeleton variant={variant} />}

        {isError && (
          <div className="grid justify-items-start gap-2.5">
            <p className="text-sm text-text-muted">We could not load these.</p>
            <button
              type="button"
              onClick={onRetry}
              className="text-sm font-bold text-accent-solid hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && isEmpty && (
          <p className="text-sm text-text-muted">{emptyMessage}</p>
        )}

        {!isLoading && !isError && !isEmpty && (
          <ul
            className={`grid min-w-0 p-0 ${
              // `pt-4` gives the strip the same header-to-first-item gap the flat
              // lists get from their rows' own top padding.
              isStrip ? 'gap-4 pt-4 sm:grid-cols-3 sm:gap-x-0' : 'gap-0'
            }`}
          >
            {children}
          </ul>
        )}
      </div>
    </section>
  )
}
