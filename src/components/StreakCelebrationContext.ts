import { createContext, useContext } from 'react'

export interface StreakCelebrationContextValue {
  recordQualifyingAction: <T>(action: () => Promise<T>) => Promise<T>
}

export const StreakCelebrationContext = createContext<StreakCelebrationContextValue | null>(null)

export function useStreakCelebration(): StreakCelebrationContextValue {
  const context = useContext(StreakCelebrationContext)
  if (!context) throw new Error('useStreakCelebration must be used inside StreakCelebrationProvider')
  return context
}
