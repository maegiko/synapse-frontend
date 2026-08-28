import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { AppHeader } from '../components/AppHeader'
import { FormAlert } from '../components/FormAlert'
import { IconArrowRight, IconNote, IconSpinner, IconUpload } from '../components/icons'
import { btnGhostSm, btnSubmit, cardLink, iconChip, shell, surfaceCard } from '../components/ui'
import { api } from '../api'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import {
  FILE_ACCEPT,
  MAX_FILE_BYTES,
  formatFileSize,
  validateNoteFile,
  withDeclaredType,
} from '../lib/noteFiles'
import { queryClient } from '../lib/queryClient'
import { queryKeys } from '../lib/queries'

/**
 * Generation is one synchronous request with nothing to report on, so the wait
 * is narrated instead: each step is what the backend is plausibly doing by then.
 */
const GENERATION_STEPS = [
  { afterMs: 0, label: 'Uploading your file…' },
  { afterMs: 4_000, label: 'Reading the text…' },
  { afterMs: 12_000, label: 'Writing your summary…' },
  { afterMs: 40_000, label: 'Still working. Longer notes take longer…' },
]

const PREPARE_TIPS = [
  'PDF, DOCX, TXT, and Markdown, up to 10 MB.',
  'The file needs real text. A scan or a photo of a page has nothing to read.'
]

const OUTPUT_TIPS = [
  'A short overview of the whole note.',
  'The key points, pulled out one by one.',
  'Each important concept, explained.',
  'The terms worth remembering.',
]

/** Errors here are about one uploaded file, so they say more than the defaults. */
function messageForFailure(error: unknown): string {
  if (isStatus(error, 400)) {
    return 'We could not read that file. It may be empty, password protected, or a scan with no text in it. Try a different file.'
  }
  if (isStatus(error, 413)) {
    return `That file is over the ${formatFileSize(MAX_FILE_BYTES)} upload limit.`
  }
  if (isStatus(error, 502)) {
    return 'The AI service could not summarise this note just now. Your file was not saved, so you can try again.'
  }
  return toFormMessage(error)
}

export function NewNotePage() {
  const navigate = useNavigate()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  // Drag events fire for every child, so nested enters/leaves are counted.
  const dragDepth = useRef(0)

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState(0)

  const generate = useMutation({
    mutationFn: (chosen: File) => api.notes.summarise(withDeclaredType(chosen)),
    onSuccess: (note) => {
      // The response is the complete summary, so the detail view can render
      // immediately instead of refetching what we already hold.
      queryClient.setQueryData(queryKeys.note(note.id), note)
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes, exact: true })
      navigate(`/notes/${note.id}`, { replace: true })
    },
  })

  const isGenerating = generate.isPending

  // The step only advances while a request is in flight; it is reset on submit.
  useEffect(() => {
    if (!isGenerating) return
    const timers = GENERATION_STEPS.slice(1).map((generationStep, index) =>
      setTimeout(() => setStep(index + 1), generationStep.afterMs),
    )
    return () => timers.forEach(clearTimeout)
  }, [isGenerating])

  function chooseFile(chosen: File | undefined) {
    if (!chosen) return
    generate.reset()

    const problem = validateNoteFile(chosen)
    if (problem) {
      setFile(null)
      setFileError(problem)
      return
    }
    setFile(chosen)
    setFileError('')
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0])
    // Reset, so picking the same file again still fires a change event.
    event.target.value = ''
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (isGenerating) return
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
    if (isGenerating) return
    chooseFile(event.dataTransfer.files?.[0])
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Guards a second submit while the first request is still running.
    if (isGenerating) return

    if (!file) {
      setFileError('Choose a file to summarise first.')
      inputRef.current?.focus()
      return
    }
    const problem = validateNoteFile(file)
    if (problem) {
      setFileError(problem)
      return
    }
    setStep(0)
    generate.mutate(file)
  }

  const alertMessage = fileError || (generate.isError ? messageForFailure(generate.error) : '')

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        <Link to="/dashboard" className={cardLink}>
          Back to dashboard
          <IconArrowRight />
        </Link>

        <h1 className="mt-5 text-2xl">Summarise a note</h1>
        <p className="mt-3 max-w-[58ch] text-base text-text-muted">
          Upload one file and Synapse reads it, then gives you back an overview, the key points, the
          concepts explained, and the terms worth remembering.
        </p>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]">
          <form className={`${surfaceCard} p-6 sm:p-8`} onSubmit={handleSubmit} noValidate>
            <div className="grid gap-5">
              {alertMessage && <FormAlert message={alertMessage} />}

              <input
                ref={inputRef}
                id={inputId}
                type="file"
                name="file"
                accept={FILE_ACCEPT}
                className="sr-only"
                disabled={isGenerating}
                onChange={handleInputChange}
              />

              {file ? (
                <div className="flex items-start gap-3.5 rounded-md border border-border bg-surface-alt p-4">
                  <span className={`${iconChip} shrink-0`} aria-hidden="true">
                    <IconNote />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text">{file.name}</p>
                    <p className="mt-1 text-xs text-text-muted tabular-nums">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  {!isGenerating && (
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      <label className={`${btnGhostSm} cursor-pointer`} htmlFor={inputId}>
                        Replace
                      </label>
                      <button
                        type="button"
                        className="px-2 text-sm font-bold text-text-muted hover:text-error-solid"
                        onClick={() => {
                          setFile(null)
                          setFileError('')
                          generate.reset()
                        }}
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
                    <span className="text-base font-bold text-text">
                      Drop a file here, or browse
                    </span>
                    <span className="text-sm text-text-muted">
                      PDF, DOCX, TXT, or Markdown · up to {formatFileSize(MAX_FILE_BYTES)}
                    </span>
                  </label>
                </div>
              )}

              {isGenerating && (
                <div
                  className="flex items-center gap-3.5 rounded-md border border-accent-soft bg-accent-soft px-4 py-3.5"
                  role="status"
                  aria-live="polite"
                >
                  <IconSpinner className="h-5.5 w-5.5 shrink-0 text-accent-strong" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-accent-strong">
                      {GENERATION_STEPS[step].label}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      This usually takes under a minute. Keep this tab open.
                    </p>
                  </div>
                </div>
              )}

              <button type="submit" className={btnSubmit} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <IconSpinner className="h-4.5 w-4.5" />
                    Generating summary…
                  </>
                ) : (
                  'Generate summary'
                )}
              </button>
            </div>
          </form>

          <aside className={`${surfaceCard} p-6`}>
            <h2 className="text-sm font-medium">Before you upload</h2>
            <ul className="mt-3.5 grid gap-2.5 p-0">
              {PREPARE_TIPS.map((tip) => (
                <li key={tip} className="list-none text-sm text-text-muted">
                  {tip}
                </li>
              ))}
            </ul>

            <h2 className="mt-7 text-sm font-medium">What you get back</h2>
            <ul className="mt-3.5 grid gap-2.5 p-0">
              {OUTPUT_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 text-sm text-text-muted">
                  <span
                    className="mt-1.75 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-solid"
                    aria-hidden="true"
                  />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </>
  )
}
