/** What the backend falls back to, and what this module falls back to as well. */
export const DEFAULT_TIME_ZONE = 'UTC'

/**
 * The device's own IANA zone, for seeding a new account. Read from the browser's
 * locale settings, so no location permission is asked for. Falls back to UTC,
 * which is what the backend does with a missing value.
 */
export function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE
  } catch {
    return DEFAULT_TIME_ZONE
  }
}

/**
 * Every IANA zone this browser knows. `Intl.supportedValuesOf` is not in every
 * engine, so the fallback is the device's own zone and UTC.
 */
export function supportedTimeZones(): string[] {
  try {
    const zones = Intl.supportedValuesOf('timeZone')
    return zones.includes(DEFAULT_TIME_ZONE) ? zones : [DEFAULT_TIME_ZONE, ...zones]
  } catch {
    const detected = detectTimeZone()
    return detected === DEFAULT_TIME_ZONE ? [DEFAULT_TIME_ZONE] : [DEFAULT_TIME_ZONE, detected]
  }
}

/** Widens the list so a zone this browser has never heard of is still selectable. */
export function timeZoneOptions(current: string | undefined): string[] {
  const zones = supportedTimeZones()
  if (!current || zones.includes(current)) return zones
  return [current, ...zones]
}
