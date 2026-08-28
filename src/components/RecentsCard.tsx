import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconArrowRight } from './icons'
import { cardLink, countPill, surfaceCard } from './ui'

interface RecentsCardProps {
  title: string
  count: number | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  emptyMessage: string
  children: ReactNode
  /** True once the request succeeded and returned nothing. */
  isEmpty: boolean
  viewAllTo: string
  viewAllLabel: string
}

function Skeleton() {
  return (
    <div className="grid gap-5" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-3">
          <span className="h-8 w-8 shrink-0 animate-pulse rounded-sm bg-surface-alt" />
          <div className="grid flex-1 gap-2">
            <span className="block h-3.5 w-2/3 animate-pulse rounded-full bg-surface-alt" />
            <span className="block h-3 w-full animate-pulse rounded-full bg-surface-alt" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Quick view of one resource: header with a count, the newest few, a way in. */
export function RecentsCard({
  title,
  count,
  isLoading,
  isError,
  onRetry,
  emptyMessage,
  isEmpty,
  children,
  viewAllTo,
  viewAllLabel,
}: RecentsCardProps) {
  return (
    <section className={`${surfaceCard} flex flex-col`}>
      <div className="flex items-center gap-3 border-b border-border px-5.5 py-4">
        <h3 className="mr-auto text-sm font-medium">{title}</h3>
        {count !== undefined && <span className={countPill}>{count}</span>}
      </div>

      <div className="flex-1 px-5.5 py-5">
        {isLoading && <Skeleton />}

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

        {!isLoading && !isError && !isEmpty && <ul className="grid gap-4 p-0">{children}</ul>}
      </div>

      <div className="mt-auto px-5.5 pb-5">
        <Link to={viewAllTo} className={cardLink}>
          {viewAllLabel}
          <IconArrowRight />
        </Link>
      </div>
    </section>
  )
}
