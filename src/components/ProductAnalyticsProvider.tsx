import type { ReactNode } from 'react'
import { PostHogProvider } from '@posthog/react'
import { productAnalyticsConfig } from '../lib/productAnalytics'

/**
 * Product analytics is production-configured through Vite environment
 * variables. Local development works without them and sends nothing.
 *
 * Synapse records only explicitly named events. Autocapture, session replay,
 * exception capture, and person profiles stay off so form values and study
 * material are never collected accidentally.
 */
export function ProductAnalyticsProvider({ children }: { children: ReactNode }) {
  if (!productAnalyticsConfig.enabled) return children

  return (
    <PostHogProvider
      apiKey={productAnalyticsConfig.projectToken}
      options={{
        api_host: productAnalyticsConfig.apiHost,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_exceptions: false,
        disable_session_recording: true,
        person_profiles: 'never',
      }}
    >
      {children}
    </PostHogProvider>
  )
}
