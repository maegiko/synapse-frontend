import { useEffect, useState } from 'react'
import { IconMoon, IconSun } from './icons'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'synapse-theme'

function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark'
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(value) ? value : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function currentTheme(): Theme {
  const applied = document.documentElement.dataset.theme
  return isTheme(applied) ? applied : (storedTheme() ?? systemTheme())
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

/** A persisted global theme switch, styled as the same compact pill in every header. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== THEME_STORAGE_KEY) return
      const next = isTheme(event.newValue) ? event.newValue : systemTheme()
      applyTheme(next)
      setTheme(next)
    }

    const preference = window.matchMedia('(prefers-color-scheme: dark)')
    function onSystemChange(event: MediaQueryListEvent) {
      if (storedTheme()) return
      const next = event.matches ? 'dark' : 'light'
      applyTheme(next)
      setTheme(next)
    }

    window.addEventListener('storage', onStorage)
    preference.addEventListener('change', onSystemChange)
    return () => {
      window.removeEventListener('storage', onStorage)
      preference.removeEventListener('change', onSystemChange)
    }
  }, [])

  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  function toggle() {
    const next: Theme = isDark ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // The visual preference still applies for this visit when storage is unavailable.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
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
