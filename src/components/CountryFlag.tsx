import { useState } from 'react'

interface CountryFlagProps {
  /** ISO 3166-1 alpha-2 code, or null when the time zone maps to no country. */
  code: string | null
  className?: string
  fallbackClassName?: string
}

/**
 * The country flag for a time zone, requested as one SVG from our own public
 * assets rather than through an all-flags stylesheet or a third party. Falls back
 * to a neutral glyph for UTC, an unbundled code, or a failed request.
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
