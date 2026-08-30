import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AppHeader } from '../components/AppHeader'
import { BackLink } from '../components/BackLink'
import { FileDropzone } from '../components/FileDropzone'
import { FormAlert } from '../components/FormAlert'
import { GenerationStatus } from '../components/GenerationStatus'
import { useStreakCelebration } from '../components/StreakCelebrationContext'
import { IconSpinner } from '../components/icons'
import { btnSubmit, cardLink, creationAside, creationLayout, shell, surfaceCard } from '../components/ui'
import { api } from '../api'
import { isStatus, toFormMessage } from '../lib/apiErrors'
import { DASHBOARD_BACK, useTrailNavigate } from '../lib/backTrail'
import { MAX_FILE_BYTES, formatFileSize, validateNoteFile, withDeclaredType } from '../lib/noteFiles'
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
  'The file needs real text.'
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
  // This page replaces itself with the note it produces, so the note inherits
  // the trail and its back link names wherever the visitor started.
  const navigate = useTrailNavigate()
  const { recordQualifyingAction } = useStreakCelebration()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [step, setStep] = useState(0)

  const generate = useMutation({
    mutationFn: (chosen: File) =>
      recordQualifyingAction(() => api.notes.summarise(withDeclaredType(chosen))),
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

  function handleSelect(chosen: File) {
    generate.reset()
    setFile(chosen)
    setFileError('')
  }

  function handleReject(reason: string) {
    generate.reset()
    setFile(null)
    setFileError(reason)
  }

  function handleClear() {
    generate.reset()
    setFile(null)
    setFileError('')
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
        <BackLink fallback={DASHBOARD_BACK} className={cardLink} />

        <h1 className="mt-5 text-3xl">Summarise a note</h1>
        <p className="mt-3 max-w-[58ch] text-base text-text-muted">
          Upload one file and Synapse reads it, then gives you back an overview, the key points, the
          concepts explained, and the terms worth remembering.
        </p>

        <div className={creationLayout}>
          <form className={`${surfaceCard} p-6 sm:p-8`} onSubmit={handleSubmit} noValidate>
            <div className="grid gap-5">
              {alertMessage && <FormAlert message={alertMessage} />}

              {isGenerating && (
                <GenerationStatus
                  label={GENERATION_STEPS[step].label}
                  hint="This usually takes under a minute. Keep this tab open."
                />
              )}

              <FileDropzone
                file={file}
                inputRef={inputRef}
                disabled={isGenerating}
                onSelect={handleSelect}
                onReject={handleReject}
                onClear={handleClear}
              />

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

          <aside className={creationAside}>
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
