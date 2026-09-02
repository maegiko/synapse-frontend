import { AppLink } from './AppLink'
import { IconArrowRight, IconGroup } from './icons'
import { countPill, iconChip, surfaceCard } from './ui'
import { plural } from '../lib/plural'
import type { StudyGroupListItem } from '../api'

export function GroupCard({ group }: { group: StudyGroupListItem }) {
  const isEmpty = group.noteCount + group.deckCount + group.quizCount === 0

  return (
    <AppLink
      to={`/groups/${group.id}`}
      className={`${surfaceCard} group flex min-w-0 flex-col p-5 no-underline transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-0.5 hover:border-accent-solid hover:shadow-md`}
    >
      <div className="flex items-start gap-3.5">
        <span className={`${iconChip} shrink-0`} aria-hidden="true">
          <IconGroup />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-text transition-colors group-hover:text-accent-foreground">
            {group.name}
          </p>
        </div>
        <IconArrowRight className="mt-3 h-4 w-4 shrink-0 text-accent-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
      </div>

      {group.description && (
        <p className="mt-3 line-clamp-2 text-xs text-text-muted">{group.description}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        {isEmpty ? (
          <span className={countPill}>Nothing in here yet</span>
        ) : (
          [
            plural(group.noteCount, 'note'),
            plural(group.deckCount, 'deck'),
            plural(group.quizCount, 'quiz', 'quizzes'),
          ].map((fact) => (
            <span key={fact} className={countPill}>
              {fact}
            </span>
          ))
        )}
      </div>
    </AppLink>
  )
}
