import { useState } from 'react'
import { IconStar } from './icons'

const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5]

interface StarRatingProps {
  value: number
  onChange: (next: number) => void
  disabled: boolean
  className?: string
}

export function StarRating({
  value,
  onChange,
  disabled,
  className = 'justify-center',
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const shown = hovered || value

  return (
    <div
      className={`flex gap-1.5 ${className}`}
      role="group"
      aria-label="Difficulty, from 1 to 5 stars"
      onMouseLeave={() => setHovered(0)}
    >
      {DIFFICULTY_LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          disabled={disabled}
          onClick={() => onChange(level)}
          onMouseEnter={() => setHovered(level)}
          onFocus={() => setHovered(level)}
          onBlur={() => setHovered(0)}
          aria-pressed={value === level}
          aria-label={`${level} out of 5`}
          className={`rounded-sm p-1 transition-transform duration-150 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60 ${
            level <= shown ? 'text-accent-foreground' : 'text-border'
          }`}
        >
          <IconStar className="h-9 w-9" filled={level <= shown} />
        </button>
      ))}
    </div>
  )
}
