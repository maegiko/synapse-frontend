import type { ReactNode } from 'react'
import { PostHogProvider } from '@posthog/react'
import { productAnalyticsConfig } from '../lib/productAnalytics'

/**
 * Configured through Vite environment variables, so local development sends
 * nothing. Only named events are recorded: autocapture, session replay, exception
 * capture and person profiles stay off so study material is never collected.
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
        capture_dead_clicks: false,
        capture_heatmaps: false,
        disable_session_recording: true,
        disable_external_dependency_loading: true,
        person_profiles: 'never',
      }}
    >
      {children}
    </PostHogProvider>
  )
}
