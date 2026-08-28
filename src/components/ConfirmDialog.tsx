import { useEffect, useId, useRef } from 'react'
import { btnDangerSm, btnGhostLg, btnPrimaryLg, surfaceCard } from './ui'

interface ConfirmDialogProps {
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  /** `danger` for a confirmation that discards something. */
  tone?: 'accent' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal confirmation. For as long as it is open it owns focus, the Escape key,
 * and the page's scrolling, so nothing behind it can be reached by accident.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = 'accent',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    confirmRef.current?.focus()

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
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }
      // Focus stays inside the dialog while it is open.
      if (event.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>('button')
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
  }, [onCancel])

  return (
    <div
      className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center bg-text/45 p-6 backdrop-blur-[2px]"
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        className={`${surfaceCard} dialog-panel w-full max-w-120 p-6 shadow-md sm:p-8`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-xl">
          {title}
        </h2>
        <p className="mt-2.5 max-w-[46ch] text-base text-text-muted">{body}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            ref={confirmRef}
            className={tone === 'danger' ? `${btnDangerSm} px-6 py-3.5 text-base` : btnPrimaryLg}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button type="button" className={btnGhostLg} onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
