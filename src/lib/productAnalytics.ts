import { useCallback } from 'react'
import { usePostHog } from '@posthog/react'

const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
const apiHost = import.meta.env.VITE_POSTHOG_HOST

export const productAnalyticsConfig = {
  projectToken,
  apiHost,
  enabled: Boolean(projectToken && apiHost),
}

export type ProductAnalyticsEvent =
  | 'registration_submitted'
  | 'email_verified'
  | 'login_succeeded'
  | 'note_created'
  | 'flashcard_deck_generated'
  | 'quiz_generated'

/** Captures one deliberately named event, with no user or content properties. */
export function useProductAnalytics() {
  const posthog = usePostHog()

  return useCallback(
    (event: ProductAnalyticsEvent) => {
      if (productAnalyticsConfig.enabled) posthog.capture(event)
    },
    [posthog],
  )
}
