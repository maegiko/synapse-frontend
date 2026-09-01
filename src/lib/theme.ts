/**
 * The theme is a browser-local preference. Nothing in the API stores it, so
 * every rule here reads and writes the localStorage of the device in front of
 * us, and the applied theme is `data-theme` on `<html>`.
 *
 * The bootstrap script in index.html sets that attribute before the first
 * paint; it repeats the default and the storage key on purpose, because it has
 * to run before any module loads. Keep the two in step.
 */

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'synapse-theme'

/** What a browser with no saved choice gets, whatever its OS prefers. */
export const DEFAULT_THEME: Theme = 'light'

/**
 * Stamped once the one-time move to dark has been decided for this browser,
 * either way. See {@link migrateExistingUserToDark}.
 */
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

/** Paints `theme` now, without saving it. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLOR[theme])
  for (const listener of listeners) listener(theme)
}

/** Paints `theme` and remembers it as this browser's choice. */
export function setTheme(theme: Theme): void {
  applyTheme(theme)
  storeTheme(theme)
}

/**
 * Follows the applied theme, including the change another tab makes: the
 * preference is shared storage, so every open tab moves together.
 */
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
    // Nothing can be remembered here, and a migration that cannot be recorded
    // would fire again on every load. Treat it as already handled.
    return true
  }
}

function settleMigration(): void {
  try {
    localStorage.setItem(DARK_MIGRATION_KEY, 'done')
  } catch {
    // Handled above: without storage the migration never starts.
  }
}

/**
 * Moves an account that predates the light default over to dark, once per
 * browser.
 *
 * There is no server-side preference to migrate, so "predates" is read from the
 * session: a refresh cookie restored on boot, or a password login. Both mean an
 * account that existed before this visit. Registering is deliberately not one
 * of them — see {@link skipDarkMigration}.
 */
export function migrateExistingUserToDark(): void {
  if (migrationSettled()) return
  settleMigration()
  setTheme('dark')
}

/**
 * Settles the same one-time decision the other way, for a browser that has just
 * created an account: a new account keeps the light default, and signing in
 * again later must not mistake it for an old one.
 */
export function skipDarkMigration(): void {
  if (migrationSettled()) return
  settleMigration()
}
