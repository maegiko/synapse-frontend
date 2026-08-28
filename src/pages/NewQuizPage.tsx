import { GenerateFromNote } from '../components/GenerateFromNote'
import type { GenerationStep } from '../components/GenerateFromNote'
import { api } from '../api'
import { queryClient } from '../lib/queryClient'
import { queryKeys } from '../lib/queries'

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
  return (
    <GenerateFromNote
      heading="Generate a quiz"
      intro="Pick one of your notes and Synapse writes ten questions from it."
      noun="quiz"
      submitLabel="Generate quiz"
      busyLabel="Generating quiz…"
      successHeading="Your quiz is ready"
      steps={STEPS}
      tips={TIPS}
      onGenerate={async (note) => {
        const quiz = await api.quiz.generate(note.id)
        void queryClient.invalidateQueries({ queryKey: queryKeys.quizzes, exact: true })
        const count = quiz.questions.length
        return {
          message: `${count} ${count === 1 ? 'question' : 'questions'} generated from “${note.title}”.`,
          to: `/quiz/${quiz.id}`,
          linkLabel: 'Open the quiz',
        }
      }}
    />
  )
}
