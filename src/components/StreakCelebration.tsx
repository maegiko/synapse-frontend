import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api'
import type { StreakResponse } from '../api'
import streakFlame from '../assets/streak_flame.webp'
import streakFlameMuted from '../assets/streak_flame_muted.webp'
import { queryKeys } from '../lib/queries'
import { queryClient } from '../lib/queryClient'
import { btnPrimaryLg, surfaceCard } from './ui'
import { StreakCelebrationContext } from './StreakCelebrationContext'

interface Celebration {
  from: number
  to: number
}

function StreakCelebrationModal({
  celebration,
  onClose,
}: {
  celebration: Celebration
  onClose: () => void
}) {
  const [dayCount, setDayCount] = useState(celebration.from)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const countTimer = window.setTimeout(() => setDayCount(celebration.to), 650)
    buttonRef.current?.focus()

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const restore = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    }
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'Tab') {
        // This dialog has one control, so Tab and Shift+Tab both stay on it.
        event.preventDefault()
        buttonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.clearTimeout(countTimer)
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = restore.overflow
      document.body.style.paddingRight = restore.paddingRight
      previouslyFocused?.focus?.()
    }
  }, [celebration.to, onClose])

  return (
    <div className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center bg-text/45 p-6 backdrop-blur-[2px]">
      <section
        className={`${surfaceCard} dialog-panel w-full max-w-120 p-7 text-center shadow-md sm:p-9`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="streak-flame-celebration relative mx-auto h-28 w-28" aria-hidden="true">
          <span className="absolute inset-0 rounded-full bg-warning-soft" />
          <img
            src={streakFlameMuted}
            alt=""
            width="128"
            height="128"
            decoding="async"
            className="streak-flame-celebration__muted absolute inset-4 h-20 w-20 object-contain"
          />
          <img
            src={streakFlame}
            alt=""
            width="128"
            height="128"
            decoding="async"
            className="streak-flame-celebration__lit absolute inset-4 h-20 w-20 object-contain"
          />
        </div>

        <h2 id={titleId} className="mt-5 text-2xl">
          Streak continued!
        </h2>
        <p className="mt-2.5 text-base text-text-muted">You showed up and kept the flame alive.</p>

        <p
          className="mt-6 font-display text-4xl font-medium text-warning-solid tabular-nums"
          aria-live="polite"
        >
          <span key={dayCount} className="streak-day-count inline-block">
            {dayCount}
          </span>
          <span className="ml-2 text-xl text-text">{dayCount === 1 ? 'day' : 'days'}</span>
        </p>

        <button ref={buttonRef} type="button" className={`${btnPrimaryLg} mt-7`} onClick={onClose}>
          Keep going
        </button>
      </section>
    </div>
  )
}

/** Owns streak detection so celebrations survive navigation after an action. */
export function StreakCelebrationProvider({ children }: { children: ReactNode }) {
  const [celebration, setCelebration] = useState<Celebration | null>(null)

  const recordQualifyingAction = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    let before: StreakResponse | null = null
    try {
      before = await api.user.getStreak()
      queryClient.setQueryData(queryKeys.streak, before)
    } catch {
      // Streak status must never prevent the action itself.
    }

    const result = await action()

    try {
      const after = await api.user.getStreak()
      queryClient.setQueryData(queryKeys.streak, after)
      if (before && !before.activeToday && after.activeToday) {
        setCelebration({ from: before.currentStreak, to: after.currentStreak })
      }
    } catch {
      void queryClient.invalidateQueries({ queryKey: queryKeys.streak })
    }

    return result
  }, [])

  return (
    <StreakCelebrationContext.Provider value={{ recordQualifyingAction }}>
      {children}
      {celebration && (
        <StreakCelebrationModal celebration={celebration} onClose={() => setCelebration(null)} />
      )}
    </StreakCelebrationContext.Provider>
  )
}
