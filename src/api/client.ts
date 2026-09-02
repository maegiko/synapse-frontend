import { API_BASE_URL, API_PATHS } from './config'
import { getAccessToken, setAccessToken } from './tokenStore'
import { NETWORK_ERROR_STATUS, standardErrorMessage } from '../lib/errorMessages'
import type { ApiErrorBody, RefreshResponse } from './types'

export { NETWORK_ERROR_STATUS }

export class ApiError extends Error {
  readonly status: number
  readonly retryAfterSeconds: number | null
  /**
   * What the backend said, never shown. Its wording is not a contract and it
   * names server-side fields, so `message` carries the app's own copy instead.
   */
  readonly serverMessage: string | null

  constructor(
    status: number,
    retryAfterSeconds: number | null = null,
    serverMessage: string | null = null,
  ) {
    super(standardErrorMessage(status, retryAfterSeconds))
    this.name = 'ApiError'
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
    this.serverMessage = serverMessage
  }
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  json?: unknown
  /** Content-Type is left unset so the browser adds the multipart boundary. */
  formData?: FormData
  /** Attach the bearer token, and refresh-and-retry once on 401. */
  authenticated?: boolean
  /** Required for every /api/auth call so the refresh cookie is sent. */
  withRefreshCookie?: boolean
  signal?: AbortSignal
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null
  const seconds = Number.parseInt(header, 10)
  return Number.isFinite(seconds) ? seconds : null
}

/** Tolerates an empty body or a non-domain error shape, per the API contract. */
async function toApiError(response: Response): Promise<ApiError> {
  let serverMessage: string | null = null
  try {
    const body = (await response.json()) as Partial<ApiErrorBody> | null
    if (body && typeof body.message === 'string') serverMessage = body.message
  } catch {
    // Spring Security can answer 401 with no body at all.
  }
  return new ApiError(
    response.status,
    parseRetryAfter(response.headers.get('Retry-After')),
    serverMessage,
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
  let body: BodyInit | undefined

  if (config.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(config.json)
  } else if (config.formData) {
    body = config.formData
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
    throw new ApiError(NETWORK_ERROR_STATUS)
  }
}

let refreshInFlight: Promise<string> | null = null

/** Refresh tokens rotate on every use, so only one refresh may be in flight. */
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
