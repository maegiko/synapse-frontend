import { toReasonMessage } from '../lib/apiErrors'

export const pickerPanel =
  'rounded-md border border-dashed border-border bg-surface-alt px-5 py-6 text-center text-sm text-text-muted app-content-in'

export function PickerSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, row) => (
        <span key={row} className="block h-11 w-full animate-pulse rounded-sm bg-surface-alt" />
      ))}
    </div>
  )
}

/**
 * One list inside a picker failed. It is reported in place so the rest of the
 * dialog — the other tabs, the search box, Cancel — stays usable.
 */
export function PickerError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className={`${pickerPanel} grid justify-items-center gap-2`} role="alert">
      <p>We could not load these. {toReasonMessage(error)}</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-sm font-bold text-accent-foreground hover:underline"
      >
        Try again
      </button>
    </div>
  )
}
