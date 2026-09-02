/**
 * A browser-local preference: nothing in the API stores it, so this reads and
 * writes localStorage and applies `data-theme` to `<html>`.
 *
 * The bootstrap script in index.html sets that attribute before the first paint.
 * It repeats the default and the storage key because it runs before any module
 * loads, so keep the two in step.
 */

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'synapse-theme'

/** What a browser with no saved choice gets, whatever its OS prefers. */
export const DEFAULT_THEME: Theme = 'light'

/** Stamped once the move to dark has been decided for this browser, either way. */
const DARK_MIGRATION_KEY = 'synapse-theme-dark-migration'

/** The browser chrome behind the page; mirrors `--color-background` per theme. */
const THEME_COLOR: Record<Theme, string> = {
  light: '#faf9fc',
  dark: '#0c0911',
}

type ThemeListener = (theme: Theme) => void

const listeners = new Set<ThemeListener>()

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

/** The saved choice, or `null` when this browser has never made one. */
export function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(value) ? value : null
  } catch {
    return null
  }
}

function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The theme still applies for this visit when storage is unavailable.
  }
}

/** What is on screen: the bootstrap script's answer, then the saved one. */
export function currentTheme(): Theme {
  const applied = document.documentElement.dataset.theme
  return isTheme(applied) ? applied : (storedTheme() ?? DEFAULT_THEME)
}

/**
 * Repaints the browser chrome, which on iOS is the strip behind the notch. The
 * tag is replaced rather than edited: iOS Safari reads `theme-color` when the tag
 * is parsed and does not reliably notice a later `content` change.
 */
function paintBrowserChrome(theme: Theme): void {
  const replacement = document.createElement('meta')
  replacement.name = 'theme-color'
  replacement.content = THEME_COLOR[theme]

  document.querySelector('meta[name="theme-color"]')?.remove()
  document.head.append(replacement)
}

/** Paints `theme` now, without saving it. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  paintBrowserChrome(theme)
  for (const listener of listeners) listener(theme)
}

/** Paints `theme` and remembers it as this browser's choice. */
export function setTheme(theme: Theme): void {
  applyTheme(theme)
  storeTheme(theme)
}

/** The preference is shared storage, so every open tab moves together. */
export function subscribeToTheme(listener: ThemeListener): () => void {
  function onStorage(event: StorageEvent) {
    if (event.key !== THEME_STORAGE_KEY) return
    applyTheme(isTheme(event.newValue) ? event.newValue : DEFAULT_THEME)
  }

  listeners.add(listener)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function migrationSettled(): boolean {
  try {
    return localStorage.getItem(DARK_MIGRATION_KEY) !== null
  } catch {
    return true
  }
}

function settleMigration(): void {
  try {
    localStorage.setItem(DARK_MIGRATION_KEY, 'done')
  } catch {
    // Without storage the migration never starts, so there is nothing to record.
  }
}

/**
 * Moves an account that predates the light default over to dark, once per
 * browser. There is no server-side preference, so "predates" is read from the
 * session: a restored refresh cookie, or a password login. Registering is
 * deliberately not one of them, see {@link skipDarkMigration}.
 */
export function migrateExistingUserToDark(): void {
  if (migrationSettled()) return
  settleMigration()
  setTheme('dark')
}

/**
 * Settles the same decision for a browser that has just created an account, so
 * signing in again later does not mistake it for an old one.
 */
export function skipDarkMigration(): void {
  if (migrationSettled()) return
  settleMigration()
}
