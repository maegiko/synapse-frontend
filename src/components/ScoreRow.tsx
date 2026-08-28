import { countPill } from './ui'
import type { QuizScore } from '../api'

/** One saved attempt. `when` differs by context: relative in a tile, exact in a list. */
export function ScoreRow({ score, when }: { score: QuizScore; when: string }) {
  const percent = Math.round((score.score / Math.max(score.totalQuestions, 1)) * 100)

  return (
    <li className="flex items-center gap-3 border-b border-dashed border-border pb-3.5 last:border-b-0 last:pb-0">
      {/* `totalQuestions` is that attempt's own snapshot, not today's count. */}
      <span className="text-sm font-bold text-text tabular-nums">
        {score.score} / {score.totalQuestions}
      </span>
      <span className={countPill}>{percent}%</span>
      <span className="ml-auto shrink-0 text-xs text-text-muted tabular-nums">{when}</span>
    </li>
  )
}
