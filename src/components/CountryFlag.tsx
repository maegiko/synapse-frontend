import { useState } from 'react'

interface CountryFlagProps {
  /** ISO 3166-1 alpha-2 code, or null when the time zone maps to no country. */
  code: string | null
  /** Classes for the rendered flag image (sizing, radius, ring). */
  className?: string
  /** Classes for the UTC / unknown fallback glyph. */
  fallbackClassName?: string
}

/**
 * The country flag for a time zone. The browser requests the active country's
 * SVG directly from our own public assets, so there is no all-flags stylesheet,
 * loader map, JavaScript wrapper chunk, or third-party request.
 *
 * Falls back to a neutral glyph for UTC, for any code without a bundled flag,
 * and when an image request fails. Decorative — the surrounding element carries
 * the accessible label.
 */
export function CountryFlag({
  code,
  className = '',
  fallbackClassName = 'inline-flex h-[1em] w-[1.5em] items-center justify-center leading-none',
}: CountryFlagProps) {
  const [failedCode, setFailedCode] = useState<string | null>(null)

  if (!code || failedCode === code) {
    return (
      <span className={fallbackClassName} aria-hidden="true">
        ◉
      </span>
    )
  }

  return (
    <img
      src={`${import.meta.env.BASE_URL}flags/${code}.svg`}
      alt=""
      aria-hidden="true"
      className={className}
      onError={() => setFailedCode(code)}
    />
  )
}
