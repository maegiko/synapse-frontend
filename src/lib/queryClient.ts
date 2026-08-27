import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // 4xx answers are decisions, not blips. The HTTP client already
      // refresh-and-retries a 401 once on its own.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
        return failureCount < 2
      },
    },
  },
})

/** Drop every cached response. Called on logout and on a dead session. */
export function clearQueryCache(): void {
  queryClient.clear()
}
