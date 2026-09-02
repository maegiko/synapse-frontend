import { GenerateFromNote } from '../components/GenerateFromNote'
import type { GenerationStep } from '../components/GenerateFromNote'
import { useStreakCelebration } from '../components/StreakCelebrationContext'
import { api } from '../api'
import { queryClient } from '../lib/queryClient'
import { queryKeys } from '../lib/queries'
import { useProductAnalytics } from '../lib/productAnalytics'

const STEPS: GenerationStep[] = [
  { afterMs: 0, label: 'Reading your note…' },
  { afterMs: 8_000, label: 'Writing flashcards…' },
  { afterMs: 30_000, label: 'Still working. Bigger notes make bigger decks…' },
]

const TIPS = [
  'A deck is built from one note: its concepts first, then cards the AI writes.',
  'Only summarised notes can be used, so summarise a file first if yours is missing.',
  'The number of cards depends on the note, so decks are not all the same size.',
]

export function NewDeckPage() {
  const { recordQualifyingAction } = useStreakCelebration()
  const capture = useProductAnalytics()

  return (
    <GenerateFromNote
      heading="Generate a flashcard deck"
      intro="Pick one of your notes and Synapse turns its concepts and key points into a deck."
      noun="deck"
      submitLabel="Generate deck"
      busyLabel="Generating deck…"
      steps={STEPS}
      tips={TIPS}
      onGenerate={async (note) => {
        const deck = await recordQualifyingAction(() => api.flashcards.generate(note.id))
        capture('flashcard_deck_generated')
        void queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDecks, exact: true })
        return `/flashcards/${deck.deckId}`
      }}
    />
  )
}
