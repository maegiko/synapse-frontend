/** What the backend falls back to, and what this module falls back to as well. */
export const DEFAULT_TIME_ZONE = 'UTC'

/**
 * The device's own IANA time zone, for seeding a new account at registration.
 *
 * <p>Read from the browser's own locale settings — no location permission is asked
 * for and no address lookup is made. Falls back to UTC on anything that cannot
 * answer, which matches what the backend does with a missing value.</p>
 */
export function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE
  } catch {
    return DEFAULT_TIME_ZONE
  }
}

/**
 * Every IANA zone this browser knows, for the profile's time zone picker.
 *
 * `Intl.supportedValuesOf` is not in every engine, so the fallback is the two
 * zones that are certainly meaningful: the device's own, and UTC.
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

/**
 * Widens the list so a zone the account already has is always selectable, even
 * when this browser's own list has never heard of it.
 */
export function timeZoneOptions(current: string | undefined): string[] {
  const zones = supportedTimeZones()
  if (!current || zones.includes(current)) return zones
  return [current, ...zones]
}
