import { useSyncExternalStore } from 'react'
import { currentTheme, setTheme, subscribeToTheme } from '../lib/theme'
import { IconMoon, IconSun } from './icons'

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, currentTheme)

  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      className="inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border border-border bg-surface-alt p-0.75 shadow-sm transition-colors duration-200 hover:border-accent-solid sm:h-9 sm:w-16 sm:p-1"
      title={label}
    >
      <span
        className={`inline-flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-accent-solid text-on-accent shadow-sm transition-transform duration-200 ease-out sm:h-7 sm:w-7 ${
          isDark ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0'
        }`}
        aria-hidden="true"
      >
        {isDark ? (
          <IconMoon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        ) : (
          <IconSun className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        )}
      </span>
    </button>
  )
}
