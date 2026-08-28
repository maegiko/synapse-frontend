import { GenerateFromNote } from '../components/GenerateFromNote'
import type { GenerationStep } from '../components/GenerateFromNote'
import { api } from '../api'
import { queryClient } from '../lib/queryClient'
import { queryKeys } from '../lib/queries'

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
  return (
    <GenerateFromNote
      heading="Generate a flashcard deck"
      intro="Pick one of your notes and Synapse turns its concepts and key points into a deck."
      noun="deck"
      submitLabel="Generate deck"
      busyLabel="Generating deck…"
      successHeading="Your deck is ready"
      steps={STEPS}
      tips={TIPS}
      onGenerate={async (note) => {
        const deck = await api.flashcards.generate(note.id)
        void queryClient.invalidateQueries({ queryKey: queryKeys.flashcardDecks, exact: true })
        void queryClient.invalidateQueries({ queryKey: queryKeys.streak })
        const count = deck.flashcards.length
        return {
          // The backend copies the deck title from the source note.
          message: `${count} ${count === 1 ? 'card' : 'cards'} generated from “${note.title}”.`,
          to: `/flashcards/${deck.deckId}`,
          linkLabel: 'Open the deck',
        }
      }}
    />
  )
}
