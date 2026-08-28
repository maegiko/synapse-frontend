/** Whether a run is dealt at random. Sent to a player as a query parameter. */
export const SHUFFLE_PARAM = 'shuffle'

export function ShuffleSwitch({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={onToggle}
      className={`inline-flex items-center gap-2.5 rounded-sm py-1 text-sm font-bold transition-colors duration-150 ${
        isOn ? 'text-text' : 'text-text-muted hover:text-text'
      }`}
    >
      <span
        className={`inline-flex h-5.5 w-10 shrink-0 items-center rounded-full border transition-colors duration-150 ${
          isOn ? 'border-accent-solid bg-accent-solid' : 'border-border bg-surface-alt'
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-surface shadow-sm transition-transform duration-150 ease-out ${
            isOn ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
      Shuffle
    </button>
  )
}
