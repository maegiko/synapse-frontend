/**
 * Decorative artwork, drawn inline so it inherits the palette, scales cleanly,
 * and costs no extra requests. All of it is aria-hidden.
 */

interface ArtProps {
  className?: string
}

/** A note being filed: paper with a folder in front of it. */
export function ArtNote({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 190 170" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="art-note-folder" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ddd6fe" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="art-note-back" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>

      <path
        d="M18 58h56l10 14h88v72a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8V58Z"
        fill="url(#art-note-back)"
      />

      <g transform="rotate(-7 95 74)">
        <rect x="52" y="16" width="88" height="106" rx="8" fill="#ffffff" />
        <rect
          x="52"
          y="16"
          width="88"
          height="106"
          rx="8"
          stroke="#ddd6fe"
          strokeWidth="1.5"
        />
        <g stroke="#c4b5fd" strokeWidth="5" strokeLinecap="round">
          <path d="M68 42h56M68 60h56M68 78h38M68 96h46" />
        </g>
      </g>

      <path
        d="M12 92h166l-12 60a8 8 0 0 1-8 6H32a8 8 0 0 1-8-6L12 92Z"
        fill="url(#art-note-folder)"
      />
    </svg>
  )
}

/** A fanned stack of flashcards. */
export function ArtDeck({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 190 170" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="art-deck-back" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="art-deck-mid" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>

      <rect
        x="26"
        y="40"
        width="128"
        height="86"
        rx="12"
        fill="url(#art-deck-back)"
        transform="rotate(-13 90 83)"
      />
      <rect
        x="34"
        y="44"
        width="128"
        height="86"
        rx="12"
        fill="url(#art-deck-mid)"
        transform="rotate(-6 98 87)"
      />
      <g transform="rotate(2 104 92)">
        <rect x="40" y="48" width="128" height="86" rx="12" fill="#ffffff" />
        <rect x="40" y="48" width="128" height="86" rx="12" stroke="#ddd6fe" strokeWidth="1.5" />
        <circle cx="62" cy="70" r="9" fill="#ede9fe" />
        <g stroke="#c4b5fd" strokeWidth="5.5" strokeLinecap="round">
          <path d="M82 70h64M60 96h86M60 114h52" />
        </g>
      </g>
    </svg>
  )
}

/** A quiz sheet with answered questions. */
export function ArtQuiz({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 190 170" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="art-quiz-head" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      <g transform="rotate(-5 96 86)">
        <rect x="34" y="14" width="124" height="142" rx="14" fill="#ede9fe" />
        <rect x="42" y="22" width="124" height="142" rx="14" fill="#ffffff" />
        <rect x="42" y="22" width="124" height="142" rx="14" stroke="#ddd6fe" strokeWidth="1.5" />
        <path d="M42 36a14 14 0 0 1 14-14h96a14 14 0 0 1 14 14v10H42V36Z" fill="url(#art-quiz-head)" />

        {[0, 1, 2].map((row) => (
          <g key={row} transform={`translate(0 ${row * 34})`}>
            <rect x="58" y="66" width="20" height="20" rx="6" fill="#7c3aed" />
            <path
              d="m63 76 3.6 3.6L73 72.6"
              stroke="#ffffff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="88" y="72" width={row === 1 ? 44 : 62} height="8" rx="4" fill="#ddd6fe" />
          </g>
        ))}
      </g>
    </svg>
  )
}
