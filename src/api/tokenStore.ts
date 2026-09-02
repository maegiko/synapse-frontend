/**
 * The access token lives in memory only. A reload deliberately loses it; the
 * HttpOnly refresh cookie is what restores the session on boot.
 */

type AccessTokenListener = (token: string | null) => void

let accessToken: string | null = null
const listeners = new Set<AccessTokenListener>()

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
  for (const listener of listeners) listener(token)
}

/** Lets auth state react when a failed refresh clears the token mid-request. */
export function subscribeToAccessToken(listener: AccessTokenListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
