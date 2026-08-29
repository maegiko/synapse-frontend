import { useId } from 'react'

type PlaybackMode = 'saved' | 'shuffle'

const MODES: { value: PlaybackMode; label: string }[] = [
  { value: 'saved', label: 'Saved order' },
  { value: 'shuffle', label: 'Shuffle' },
]

/**
 * Compact two-segment control for how a deck's run is dealt. Kept quieter than
 * the Play button: a muted track with a soft-lavender selected segment.
 */
export function PlaybackModeControl({
  value,
  onChange,
}: {
  value: PlaybackMode
  onChange: (mode: PlaybackMode) => void
}) {
  const name = useId()
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-1.5 p-0 text-xs font-bold text-text-muted">Playback mode</legend>
      <div className="flex w-56 rounded-sm border border-border bg-surface-alt p-1">
        {MODES.map((mode) => {
          const active = value === mode.value
          return (
            <label
              key={mode.value}
              className={`flex h-8 flex-1 cursor-pointer items-center justify-center rounded-[5px] px-2 text-sm font-bold whitespace-nowrap transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-solid ${
                active ? 'bg-accent-soft text-accent-strong' : 'text-text-muted hover:text-text'
              }`}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                value={mode.value}
                checked={active}
                onChange={() => onChange(mode.value)}
              />
              {mode.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
