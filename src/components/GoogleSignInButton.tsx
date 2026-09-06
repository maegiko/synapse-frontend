import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { retryAfterSeconds } from '../lib/apiErrors'
import {
  googleClientId,
  googleSignInEnabled,
  loadGoogleIdentity,
  type GoogleCredentialResponse,
  type GoogleIdentityApi,
} from '../lib/googleIdentity'
import { IconGoogle } from './icons'
import { btnGhostLg } from './ui'

/** GIS refuses a width above this, and clamps its own rendering to it. */
const MAX_BUTTON_WIDTH = 400

type Phase = 'preparing' | 'ready' | 'unavailable'

interface GoogleSignInButtonProps {
  /**
   * Receives the credential Google returned, and reports any failure in its own
   * UI. Whether it resolves or rejects is not read: either way the attempt is
   * over and a replacement nonce is prepared, so callers are free to handle their
   * own errors and resolve normally.
   */
  onCredential: (credential: string) => Promise<void>
  /** `Continue with` on the auth pages; `Sign in with` when linking an account. */
  label?: string
  /** Blocks a second attempt while the caller is busy with the first. */
  busy?: boolean
}

/**
 * "Continue with Google", styled as one of this app's own buttons.
 *
 * Google's rendered button is the only reliable way to obtain an ID token from a
 * click, but it cannot be styled to match anything. So both exist: the visible
 * button below is ours and is purely decorative, and Google's real one is laid
 * over it at zero opacity, stretched to cover it exactly. Every click therefore
 * lands on Google's own button — nothing here synthesises a click or reaches
 * inside Google's DOM, so a change to their markup cannot silently break it.
 *
 * Google's branding terms allow a custom button provided it carries the
 * unmodified mark and the sanctioned wording, which is what {@link IconGoogle}
 * and `label` are for. Do not recolour either.
 */
export function GoogleSignInButton({
  onCredential,
  label = 'Continue with Google',
  busy = false,
}: GoogleSignInButtonProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const identityRef = useRef<GoogleIdentityApi | null>(null)

  const [phase, setPhase] = useState<Phase>('preparing')
  const [attempt, setAttempt] = useState(0)
  const [width, setWidth] = useState(0)
  /** Set once a nonce has been fetched and GIS initialised with it. */
  const [armed, setArmed] = useState(false)
  /** Stretches Google's shorter button over the full height of ours. */
  const [scaleY, setScaleY] = useState(1)
  /** Seconds until the nonce limit resets, when that is why we gave up. */
  const [cooldown, setCooldown] = useState<number | null>(null)

  /**
   * The latest callback, so re-rendering the button never re-runs the arming
   * effect. GIS holds the callback it was initialised with, and re-initialising
   * would spend another nonce.
   */
  const onCredentialRef = useRef(onCredential)
  const busyRef = useRef(busy)
  useEffect(() => {
    onCredentialRef.current = onCredential
    busyRef.current = busy
  }, [onCredential, busy])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const measure = (value: number) => setWidth(Math.min(Math.round(value), MAX_BUTTON_WIDTH))

    // Measured once up front, so a browser without ResizeObserver still gets a
    // button rather than waiting for a resize that never comes.
    measure(wrapper.offsetWidth)
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(([entry]) => measure(entry.contentRect.width))
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  /**
   * Loads GIS, takes one nonce, and arms the library with it.
   *
   * Depends on nothing but {@link attempt}, and that is the point: a nonce is
   * rate limited per client address, so it must be spent on a real sign-in
   * attempt and never on a re-render. Resizing the window re-renders the button
   * from the effect below without coming back here.
   */
  useEffect(() => {
    if (!googleSignInEnabled) return

    let cancelled = false

    void (async () => {
      setPhase('preparing')
      setArmed(false)
      setCooldown(null)
      try {
        const [identity, { nonce }] = await Promise.all([
          loadGoogleIdentity(),
          api.auth.googleNonce(),
        ])
        if (cancelled) return

        identity.accounts.id.initialize({
          client_id: googleClientId,
          nonce,
          auto_select: false,
          callback: (response: GoogleCredentialResponse) => {
            if (busyRef.current) return
            void onCredentialRef.current(response.credential).finally(() => {
              // Any completed attempt spends the nonce, because the backend
              // consumes it before it judges the credential. Re-arm on both
              // outcomes: waiting for a rejection does not work, since callers
              // report failures in their own UI and resolve anyway, and it would
              // leave a dead nonce in place that fails every later click.
              //
              // A success normally unmounts this first — the page navigates, or
              // the panel switches to the unlinked state — so the replacement is
              // rarely fetched at all.
              setAttempt((value) => value + 1)
            })
          },
        })
        identity.accounts.id.disableAutoSelect()

        identityRef.current = identity
        setArmed(true)
      } catch (error) {
        if (cancelled) return
        setCooldown(retryAfterSeconds(error))
        setPhase('unavailable')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [attempt])

  /** Draws the button, and redraws it at a new width without spending a nonce. */
  useEffect(() => {
    const identity = identityRef.current
    const host = hostRef.current
    if (!armed || !identity || !host || width === 0) return

    // GIS appends, so a redraw would otherwise stack a second button underneath.
    host.replaceChildren()
    identity.accounts.id.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width,
    })

    // Google draws a shorter button than ours. Because the overlay is invisible,
    // stretching it costs nothing and removes the dead strip that would otherwise
    // sit above and below its hit area. If the measurement fails the button still
    // works; only its extreme edges stop responding.
    const rendered = host.firstElementChild
    const renderedHeight = rendered instanceof HTMLElement ? rendered.offsetHeight : 0
    const targetHeight = wrapperRef.current?.offsetHeight ?? 0
    setScaleY(renderedHeight > 0 && targetHeight > 0 ? targetHeight / renderedHeight : 1)

    setPhase('ready')
  }, [armed, width])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  if (!googleSignInEnabled) return null

  if (phase === 'unavailable') {
    return (
      <div className="grid justify-items-start gap-1.5">
        <p className="text-sm text-text-muted">
          {cooldown === null
            ? 'Google sign-in is not available right now.'
            : `Too many Google sign-in attempts from here. Try again in ${describeCooldown(cooldown)}.`}
        </p>
        {cooldown === null && (
          <button
            type="button"
            className="cursor-pointer text-sm font-bold text-accent-foreground hover:underline"
            onClick={retry}
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  const unready = phase !== 'ready'

  return (
    <div ref={wrapperRef} className="group relative">
      {/*
        Ours, and decorative only: the click it appears to take is taken by
        Google's button above it, so this is hidden from assistive technology and
        is not focusable. It wears the focus ring on that button's behalf, since
        the real one is invisible and would otherwise show a keyboard user
        nothing.
      */}
      <div
        aria-hidden="true"
        className={`${btnGhostLg} w-full outline-accent-solid group-focus-within:outline-[2.5px] group-focus-within:outline-offset-2 ${
          unready || busy ? 'opacity-60' : ''
        }`}
      >
        <IconGoogle className="h-5 w-5" />
        <span>{label}</span>
      </div>

      {/*
        Google's real button. Invisible, but present, focusable and clickable, so
        keyboard and pointer users alike activate Google's own control rather than
        anything this app synthesises.
      */}
      <div
        ref={hostRef}
        className={`absolute inset-0 origin-top-left overflow-hidden opacity-0 ${
          busy ? 'pointer-events-none' : ''
        }`}
        style={phase === 'ready' ? { transform: `scaleY(${scaleY})` } : undefined}
      />
    </div>
  )
}

/** Rounded up to the minute, because a countdown to the second reads as urgent. */
function describeCooldown(seconds: number): string {
  if (seconds <= 60) return 'a minute'
  return `${Math.ceil(seconds / 60)} minutes`
}

/** The rule above the Google button, separating it from the password form. */
export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-bold uppercase tracking-wide text-text-muted">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
