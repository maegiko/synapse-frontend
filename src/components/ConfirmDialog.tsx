import { useRef } from 'react'
import { Dialog } from './Dialog'
import { btnDangerSm, btnGhostLg, btnPrimaryLg } from './ui'

interface ConfirmDialogProps {
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  tone?: 'accent' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/** Focus opens on the confirm button, so a yes/no question is a single key. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = 'accent',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog title={title} description={body} initialFocusRef={confirmRef} onClose={onCancel}>
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
    </Dialog>
  )
}
