import { useId } from 'react'
import type { AnalyticsPeriodDays } from '../api'
import { ANALYTICS_PERIODS, periodDescription, periodLabel } from '../lib/analytics'

interface PeriodSelectorProps {
  value: AnalyticsPeriodDays
  onChange: (period: AnalyticsPeriodDays) => void
}

/**
 * An `sr-only` radio group styled as a segmented control, so arrow-key movement
 * and a real checked state come from the browser rather than from ARIA.
 */
export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const name = useId()

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-1.5 p-0 text-xs font-bold text-text-muted">Period</legend>
      <div className="flex w-fit rounded-sm border border-border bg-surface-alt p-1">
        {ANALYTICS_PERIODS.map((period) => {
          const active = value === period
          return (
            <label
              key={period}
              className={`flex h-8 min-w-14 cursor-pointer items-center justify-center rounded-[5px] px-3 text-sm font-bold whitespace-nowrap transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-solid ${
                active ? 'bg-accent-soft text-accent-strong' : 'text-text-muted hover:text-text'
              }`}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                value={period}
                checked={active}
                aria-label={periodDescription(period)}
                onChange={() => onChange(period)}
              />
              {periodLabel(period)}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
