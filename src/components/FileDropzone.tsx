import { useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, RefObject } from 'react'
import { IconNote, IconUpload } from './icons'
import { btnGhostSm, iconChip } from './ui'
import { FILE_ACCEPT, MAX_FILE_BYTES, formatFileSize, validateNoteFile } from '../lib/noteFiles'

interface FileDropzoneProps {
  file: File | null
  /** Locked while a request is in flight; Replace and Remove are hidden too. */
  disabled?: boolean
  /** Lets the page move focus here when it submits with nothing chosen. */
  inputRef?: RefObject<HTMLInputElement | null>
  onSelect: (file: File) => void
  /** Called with the one-sentence reason a dropped or picked file was refused. */
  onReject: (reason: string) => void
  onClear: () => void
}

/** Drag-and-drop or browse for one note file, validated before it is handed up. */
export function FileDropzone({
  file,
  disabled = false,
  inputRef,
  onSelect,
  onReject,
  onClear,
}: FileDropzoneProps) {
  const inputId = useId()
  const ownRef = useRef<HTMLInputElement>(null)
  // Drag events fire for every child, so nested enters/leaves are counted.
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)

  function chooseFile(chosen: File | undefined) {
    if (!chosen) return
    const problem = validateNoteFile(chosen)
    if (problem) {
      onReject(problem)
      return
    }
    onSelect(chosen)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0])
    // Reset, so picking the same file again still fires a change event.
    event.target.value = ''
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (disabled) return
    dragDepth.current += 1
    setDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    dragDepth.current -= 1
    if (dragDepth.current <= 0) setDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    if (disabled) return
    chooseFile(event.dataTransfer.files?.[0])
  }

  return (
    // `relative` keeps the sr-only input's absolute position scoped here rather
    // than to the page, which would extend the document's scroll area.
    <div className="relative">
      <input
        ref={inputRef ?? ownRef}
        id={inputId}
        type="file"
        name="file"
        accept={FILE_ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={handleInputChange}
      />

      {file ? (
        <div className="flex items-start gap-3.5 rounded-md border border-border bg-surface-alt p-4">
          <span className={`${iconChip} shrink-0`} aria-hidden="true">
            <IconNote />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-text">{file.name}</p>
            <p className="mt-1 text-xs text-text-muted tabular-nums">{formatFileSize(file.size)}</p>
          </div>
          {!disabled && (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <label className={`${btnGhostSm} cursor-pointer`} htmlFor={inputId}>
                Replace
              </label>
              <button
                type="button"
                className="px-2 text-sm font-bold text-text-muted hover:text-error-solid"
                onClick={onClear}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label
            htmlFor={inputId}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 border-dashed px-6 py-12 text-center transition-colors duration-150 has-[input:focus-visible]:outline has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent-solid ${
              dragging
                ? 'border-accent-solid bg-accent-soft'
                : 'border-border bg-surface-alt hover:border-accent-solid'
            }`}
          >
            <span className={iconChip} aria-hidden="true">
              <IconUpload />
            </span>
            <span className="text-base font-bold text-text">Drop a file here, or browse</span>
            <span className="text-sm text-text-muted">
              PDF, DOCX, TXT, or Markdown · up to {formatFileSize(MAX_FILE_BYTES)}
            </span>
          </label>
        </div>
      )}
    </div>
  )
}
