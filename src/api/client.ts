import { API_BASE_URL, API_PATHS } from './config'
import { getAccessToken, setAccessToken } from './tokenStore'
import type { ApiErrorBody, RefreshResponse } from './types'

/** Status used for failures that never reached the backend (offline, CORS, DNS). */
export const NETWORK_ERROR_STATUS = 0

export class ApiError extends Error {
  readonly status: number
  readonly retryAfterSeconds: number | null

  constructor(status: number, message: string, retryAfterSeconds: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Serialized as a JSON body with the matching Content-Type. */
  json?: unknown
  /** Attach the bearer access token, and refresh-and-retry once on 401. */
  authenticated?: boolean
  /** Required for every /api/auth call so the refresh cookie is sent and stored. */
  withRefreshCookie?: boolean
  signal?: AbortSignal
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Some of the details you entered are not valid.',
  401: 'Your session has expired. Please log in again.',
  404: 'We could not find what you were looking for.',
  409: 'That already belongs to another account.',
  429: 'Too many attempts. Please wait a moment and try again.',
  502: 'The AI service is unavailable right now. Please try again.',
}

function messageForStatus(status: number): string {
  return DEFAULT_MESSAGES[status] ?? 'Something went wrong. Please try again.'
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null
  const seconds = Number.parseInt(header, 10)
  return Number.isFinite(seconds) ? seconds : null
}

/** Tolerates an empty body or a non-domain error shape, per the API contract. */
async function toApiError(response: Response): Promise<ApiError> {
  let message = ''
  try {
    const body = (await response.json()) as Partial<ApiErrorBody> | null
    if (body && typeof body.message === 'string') message = body.message
  } catch {
    // Spring Security can answer 401 with no body at all.
  }
  return new ApiError(
    response.status,
    message || messageForStatus(response.status),
    parseRetryAfter(response.headers.get('Retry-After')),
  )
}

async function parseBody<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return undefined as T
  }
  const text = await response.text()
  return (text ? (JSON.parse(text) as T) : (undefined as T))
}

async function send(path: string, config: RequestConfig): Promise<Response> {
  const headers = new Headers()
  let body: string | undefined

  if (config.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(config.json)
  }
  if (config.authenticated) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method: config.method ?? 'GET',
      headers,
      body,
      credentials: config.withRefreshCookie ? 'include' : 'same-origin',
      signal: config.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(
      NETWORK_ERROR_STATUS,
      'We could not reach the server. Check your connection and try again.',
    )
  }
}

let refreshInFlight: Promise<string> | null = null

/**
 * One shared refresh at a time. Refresh tokens rotate on every use, so two
 * concurrent calls would make one of them fail.
 */
export function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= (async () => {
    try {
      const response = await send(API_PATHS.auth.refresh, {
        method: 'POST',
        withRefreshCookie: true,
      })
      if (!response.ok) throw await toApiError(response)
      const { accessToken } = await parseBody<RefreshResponse>(response)
      setAccessToken(accessToken)
      return accessToken
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

export async function apiRequest<T>(path: string, config: RequestConfig = {}): Promise<T> {
  let response = await send(path, config)

  // At most one refresh-and-retry per request, and never for the refresh call
  // itself (it is not `authenticated`), so this cannot recurse.
  if (response.status === 401 && config.authenticated) {
    try {
      await refreshAccessToken()
    } catch {
      setAccessToken(null)
      throw await toApiError(response)
    }
    response = await send(path, config)
  }

  if (!response.ok) throw await toApiError(response)
  return parseBody<T>(response)
}
