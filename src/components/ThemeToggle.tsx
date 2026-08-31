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

/** A persisted global theme switch. The icon names the theme it will switch to. */
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
      className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border bg-surface text-text-muted transition-colors duration-150 hover:border-accent-solid hover:bg-surface-alt hover:text-accent-foreground"
      aria-label={label}
      title={label}
    >
      {isDark ? <IconSun className="h-4.5 w-4.5" /> : <IconMoon className="h-4.5 w-4.5" />}
    </button>
  )
}
