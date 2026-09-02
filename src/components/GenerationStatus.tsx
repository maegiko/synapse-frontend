import { IconSpinner } from './icons'

/** The AI endpoints are one long synchronous call, so the wait is narrated. */
export function GenerationStatus({ label, hint }: { label: string; hint: string }) {
  return (
    <div
      className="flex items-center gap-3.5 rounded-md border border-accent-soft bg-accent-soft px-4 py-3.5"
      role="status"
      aria-live="polite"
    >
      <IconSpinner className="h-5.5 w-5.5 shrink-0 text-accent-strong" />
      <div className="min-w-0">
        <p className="text-sm font-bold text-accent-strong">{label}</p>
        <p className="mt-0.5 text-xs text-text-muted">{hint}</p>
      </div>
    </div>
  )
}
