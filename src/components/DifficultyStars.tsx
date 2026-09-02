import { IconStar } from './icons'

const LEVELS = [1, 2, 3, 4, 5]

export function DifficultyStars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Difficulty ${value} out of 5`}>
      {LEVELS.map((level) => (
        <IconStar
          key={level}
          className={`h-3 w-3 ${level <= value ? 'text-text-muted/60' : 'text-border'}`}
          filled={level <= value}
        />
      ))}
    </span>
  )
}
