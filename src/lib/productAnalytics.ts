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
  /**
   * Google sign-in is counted apart from the password events above, so those two
   * keep meaning what they meant before Google existed and stay comparable across
   * the change.
   *
   * `google_signup_submitted` is intent, not outcome: it means somebody used
   * Google from the register page. One endpoint creates, links, claims and signs
   * in, and it answers identically for all four on purpose, so the frontend
   * cannot know which happened and must not imply that it does.
   */
  | 'google_login_succeeded'
  | 'google_signup_submitted'
  | 'google_linked'
  | 'google_unlinked'
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
