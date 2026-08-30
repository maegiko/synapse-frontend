import { useEffect, useId, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { surfaceCard } from './ui'

/** Everything a keyboard can land on inside a panel, in document order. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface DialogProps {
  title: string
  /** Supporting line under the title, announced with it. */
  description?: ReactNode
  /** `lg` for the pickers, which hold a scrolling list of results. */
  size?: 'sm' | 'lg'
  /**
   * Focused when the dialog opens. Defaults to the first focusable element,
   * which is the right answer for a form; the confirmations point it at their
   * confirm button instead.
   */
  initialFocusRef?: RefObject<HTMLElement | null>
  onClose: () => void
  children: ReactNode
}

/**
 * The modal shell every dialog in the app is built on. For as long as it is
 * open it owns focus, the Escape key, and the page's scrolling, so nothing
 * behind it can be reached by accident.
 */
export function Dialog({
  title,
  description,
  size = 'sm',
  initialFocusRef,
  onClose,
  children,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const target =
      initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    target?.focus()

    // Locking the page also removes its scrollbar, which would shift everything
    // sideways as the dialog opens; the freed width is padded back on.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const restore = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    }
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      document.body.style.overflow = restore.overflow
      document.body.style.paddingRight = restore.paddingRight
      previouslyFocused?.focus?.()
    }
    // Focusing once, on open: a later ref change must not steal focus back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      // Focus stays inside the dialog while it is open. The list is read at
      // press time, so a panel whose contents change stays trapped correctly.
      if (event.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center bg-text/45 p-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className={`${surfaceCard} dialog-panel flex max-h-full w-full min-h-0 flex-col p-6 shadow-md sm:p-8 ${
          size === 'lg' ? 'max-w-160' : 'max-w-120 overflow-y-auto'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-xl">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-2.5 max-w-[46ch] text-base text-text-muted">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}
