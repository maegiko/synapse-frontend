/**
 * Google Identity Services, loaded on demand.
 *
 * The script is fetched the first time a Google button is rendered rather than
 * from `index.html`, so a visitor who never signs in with Google never pays for
 * it, and a deployment with no client ID never loads it at all.
 *
 * Only the small part of the GIS surface this app uses is typed here. The real
 * library is much larger; adding to this as needed is preferable to pulling in a
 * dependency for one script tag.
 */

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

/**
 * Whether "Continue with Google" should be offered at all. A build with no client
 * ID hides it, rather than showing a button that can only ever fail: the backend
 * rejects every credential when its own client ID is unset, and the two are meant
 * to be configured together.
 */
export const googleSignInEnabled = Boolean(googleClientId)

export interface GoogleCredentialResponse {
  credential: string
}

export type GoogleButtonTheme = 'outline' | 'filled_blue' | 'filled_black'

export interface GoogleButtonOptions {
  type?: 'standard' | 'icon'
  theme?: GoogleButtonTheme
  size?: 'small' | 'medium' | 'large'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
}

export interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize(config: {
        client_id: string
        callback: (response: GoogleCredentialResponse) => void
        nonce?: string
        auto_select?: boolean
        cancel_on_tap_outside?: boolean
        use_fedcm_for_prompt?: boolean
      }): void
      renderButton(parent: HTMLElement, options: GoogleButtonOptions): void
      /** Forgets the last account, so a second attempt is not auto-selected. */
      disableAutoSelect(): void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityApi
  }
}

let loader: Promise<GoogleIdentityApi> | null = null

/**
 * Loads the GIS script once and resolves with its global.
 *
 * The promise is cached so several buttons on one page share a single load, but a
 * failed load clears it, so a visitor who was offline for a moment can retry
 * instead of being stuck with a rejected promise for the rest of the session.
 */
export function loadGoogleIdentity(): Promise<GoogleIdentityApi> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)

  loader ??= new Promise<GoogleIdentityApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id) resolve(window.google)
      else reject(new Error('Google Identity Services loaded without its API'))
    }
    script.onerror = () => reject(new Error('Google Identity Services could not be loaded'))
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    loader = null
    throw error
  })

  return loader
}
