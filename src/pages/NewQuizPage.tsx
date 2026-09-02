import { GenerateFromNote } from '../components/GenerateFromNote'
import type { GenerationStep } from '../components/GenerateFromNote'
import { useStreakCelebration } from '../components/StreakCelebrationContext'
import { api } from '../api'
import { queryClient } from '../lib/queryClient'
import { queryKeys } from '../lib/queries'
import { useProductAnalytics } from '../lib/productAnalytics'

const STEPS: GenerationStep[] = [
  { afterMs: 0, label: 'Reading your note…' },
  { afterMs: 8_000, label: 'Writing ten questions…' },
  { afterMs: 30_000, label: 'Still working. Writing good answers takes a moment…' },
]

const TIPS = [
  'Every quiz is ten questions, written from one note: multiple choice and true or false.',
  'Only summarised notes can be used, so summarise a file first if yours is missing.',
  'New quizzes have no difficulty yet. You set that when you run one.',
]

export function NewQuizPage() {
  const { recordQualifyingAction } = useStreakCelebration()
  const capture = useProductAnalytics()

  return (
    <GenerateFromNote
      heading="Generate a quiz"
      intro="Pick one of your notes and Synapse writes ten questions from it."
      noun="quiz"
      submitLabel="Generate quiz"
      busyLabel="Generating quiz…"
      steps={STEPS}
      tips={TIPS}
      onGenerate={async (note) => {
        const quiz = await recordQualifyingAction(() => api.quiz.generate(note.id))
        capture('quiz_generated')
        // The generation response is the whole quiz, so the detail view can
        // render it without a refetch.
        queryClient.setQueryData(queryKeys.quiz(quiz.id), quiz)
        void queryClient.invalidateQueries({ queryKey: queryKeys.quizzes, exact: true })
        return `/quiz/${quiz.id}`
      }}
    />
  )
}
