import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AppHeader } from './AppHeader'
import { AppLink } from './AppLink'
import { BackLink } from './BackLink'
import { FormAlert } from './FormAlert'
import { GenerationStatus } from './GenerationStatus'
import { IconArrowRight, IconCheck, IconNote, IconSpinner } from './icons'
import {
  btnPrimaryLg,
  btnSubmit,
  cardLink,
  creationAside,
  creationLayout,
  countPill,
  fieldInput,
  iconChip,
  shell,
  surfaceCard,
} from './ui'
import type { NoteSummary } from '../api'
import { isStatus, toFormMessage, toReasonMessage } from '../lib/apiErrors'
import { DASHBOARD_BACK, useTrailNavigate } from '../lib/backTrail'
import { plural } from '../lib/plural'
import { useNotes } from '../lib/queries'

export interface GenerationStep {
  afterMs: number
  label: string
}

interface GenerateFromNoteProps {
  heading: string
  intro: string
  noun: string
  submitLabel: string
  busyLabel: string
  steps: GenerationStep[]
  tips: string[]
  /** Generates, invalidates the list it added to, and returns where to go next. */
  onGenerate: (note: NoteSummary) => Promise<string>
}

const SEARCH_THRESHOLD = 5

/** Matches the `pb-20` under the card, so it keeps that gap above the fold. */
const PAGE_BOTTOM_GAP = 80
const LIST_MIN_HEIGHT = 192
const LIST_MAX_HEIGHT = 500
/** Below this the aside stacks under the card, so fitting the card is pointless. */
const TWO_COLUMN = '(min-width: 64rem)'

function NoteListSkeleton() {
  return (
    <div className="grid gap-3" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-3.5 rounded-md border border-border p-4">
          <span className="h-10.5 w-10.5 shrink-0 animate-pulse rounded-sm bg-surface-alt" />
          <div className="grid flex-1 gap-2">
            <span className="block h-3.5 w-1/2 animate-pulse rounded-full bg-surface-alt" />
            <span className="block h-3 w-full animate-pulse rounded-full bg-surface-alt" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Both AI generators work the same way: pick one saved note and generate from it.
 * Only the copy and the generate call differ.
 */
export function GenerateFromNote({
  heading,
  intro,
  noun,
  submitLabel,
  busyLabel,
  steps,
  tips,
  onGenerate,
}: GenerateFromNoteProps) {
  const navigate = useTrailNavigate()
  const notes = useNotes()
  const fieldsetRef = useRef<HTMLFieldSetElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [formError, setFormError] = useState('')
  const [step, setStep] = useState(0)

  const hasNoNotes = notes.isSuccess && notes.data.length === 0

  function messageForFailure(error: unknown): string {
    if (isStatus(error, 404)) {
      return 'That note no longer exists. Reload your notes and pick another one.'
    }
    if (isStatus(error, 400)) {
      return `We could not build a ${noun} from that note. Try another one.`
    }
    if (isStatus(error, 502)) {
      return `The AI service could not build a ${noun} just now. Nothing was saved, so you can try again in a moment.`
    }
    return toFormMessage(error)
  }

  const generate = useMutation({
    mutationFn: (note: NoteSummary) => onGenerate(note),
    onSuccess: (to) => navigate(to, { replace: true }),
    onError: (error) => {
      setFormError(messageForFailure(error))
      if (isStatus(error, 404)) void notes.refetch()
    },
  })

  const isBusy = generate.isPending

  useEffect(() => {
    if (!isBusy) return
    const timers = steps
      .slice(1)
      .map((current, index) => setTimeout(() => setStep(index + 1), current.afterMs))
    return () => timers.forEach(clearTimeout)
  }, [isBusy, steps])

  const filteredNotes = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term || !notes.data) return notes.data ?? []
    return notes.data.filter(
      (note) =>
        note.title.toLowerCase().includes(term) || note.overview.toLowerCase().includes(term),
    )
  }, [notes.data, search])

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return

    function fitToViewport() {
      const element = listRef.current
      const form = element?.closest('form')
      if (!element || !form) return

      if (!window.matchMedia(TWO_COLUMN).matches) {
        element.style.maxHeight = ''
        return
      }

      element.style.maxHeight = ''
      const listTop = element.getBoundingClientRect().top
      const below = form.getBoundingClientRect().bottom - element.getBoundingClientRect().bottom
      const available = window.innerHeight - listTop - below - PAGE_BOTTOM_GAP

      const target = Math.round(Math.min(LIST_MAX_HEIGHT, Math.max(LIST_MIN_HEIGHT, available)))
      element.style.maxHeight = `${target}px`

      const overshoot = document.documentElement.scrollHeight - window.innerHeight
      if (overshoot <= 0) return

      element.style.maxHeight = `${Math.max(LIST_MIN_HEIGHT, target - overshoot)}px`
      if (document.documentElement.scrollHeight > window.innerHeight) {
        element.style.maxHeight = `${target}px`
      }
    }

    fitToViewport()
    window.addEventListener('resize', fitToViewport)
    return () => window.removeEventListener('resize', fitToViewport)
  }, [filteredNotes.length, formError, isBusy])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isBusy) return
    setFormError('')

    const note = notes.data?.find((candidate) => candidate.id === selectedNoteId)
    if (!note) {
      setFormError('Choose one of your notes first.')
      fieldsetRef.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus()
      return
    }
    setStep(0)
    generate.mutate(note)
  }

  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-10 pb-20`}>
        <BackLink fallback={DASHBOARD_BACK} className={cardLink} />

        <h1 className="mt-5 text-3xl">{heading}</h1>
        <p className="mt-3 max-w-[58ch] text-base text-text-muted">{intro}</p>

        <div className={creationLayout}>
          <form className={`${surfaceCard} p-6 sm:p-8`} onSubmit={handleSubmit} noValidate>
            <div className="grid gap-5">
              {formError && <FormAlert message={formError} />}

              {isBusy && (
                <GenerationStatus
                  label={(steps[step] ?? steps[0]).label}
                  hint="This usually takes under a minute. Keep this tab open."
                />
              )}

              {notes.isPending && <NoteListSkeleton />}

              {notes.isError && (
                <div className="app-content-in grid justify-items-start gap-2.5 rounded-md border border-border bg-surface-alt p-5">
                  <p className="text-sm text-text-muted">
                    We could not load your notes. {toReasonMessage(notes.error)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void notes.refetch()}
                    className="text-sm font-bold text-accent-foreground hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {hasNoNotes && (
                <div className="app-content-in rounded-md border border-dashed border-border bg-surface-alt px-6 py-10 text-center">
                  <span className={`${iconChip} mx-auto`} aria-hidden="true">
                    <IconNote />
                  </span>
                  <p className="mt-3 text-base font-bold text-text">
                    You have not summarised a note yet
                  </p>
                  <p className="mx-auto mt-2 max-w-[42ch] text-sm text-text-muted">
                    Every {noun} is built from one of your notes. Summarise a file first and it will
                    show up here to pick from.
                  </p>
                  <AppLink to="/notes/new" className={`${btnPrimaryLg} mt-6`}>
                    Summarise your first note
                    <IconArrowRight />
                  </AppLink>
                </div>
              )}

              {notes.isSuccess && notes.data.length > 0 && (
                <fieldset ref={fieldsetRef} className="app-content-in m-0 min-w-0 border-0 p-0" disabled={isBusy}>
                  <legend className="sr-only">Choose a note</legend>

                  {notes.data.length > SEARCH_THRESHOLD && (
                    <input
                      type="search"
                      className={`${fieldInput} mb-4`}
                      placeholder="Search your notes"
                      value={search}
                      aria-label="Search your notes"
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  )}

                  {filteredNotes.length === 0 ? (
                    <p className="rounded-md border border-border bg-surface-alt px-4 py-6 text-center text-sm text-text-muted">
                      No note matches “{search.trim()}”.
                    </p>
                  ) : (
                    <ul ref={listRef} className="grid max-h-125 gap-3 overflow-y-auto p-0">
                      {filteredNotes.map((note) => {
                        const selected = note.id === selectedNoteId
                        return (
                          <li key={note.id} className="list-none">
                            <label
                              className={`relative flex cursor-pointer items-start gap-3.5 rounded-md border p-4 transition-colors duration-150 has-[input:focus-visible]:outline has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent-solid ${
                                selected
                                  ? 'border-accent-solid bg-accent-soft'
                                  : 'border-border bg-surface hover:border-accent-solid'
                              }`}
                            >
                              <input
                                type="radio"
                                name="note"
                                className="sr-only"
                                value={note.id}
                                checked={selected}
                                onChange={() => {
                                  setSelectedNoteId(note.id)
                                  setFormError('')
                                }}
                              />
                              <span className={`${iconChip} shrink-0`} aria-hidden="true">
                                <IconNote />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-text">
                                  {note.title}
                                </span>
                                <span className="mt-1 line-clamp-2 block text-xs text-text-muted">
                                  {note.overview}
                                </span>
                                <span className="mt-2 flex flex-wrap gap-1.5">
                                  {[
                                    plural(note.concepts.length, 'concept'),
                                    plural(note.keypoints.length, 'key point'),
                                  ].map((fact) => (
                                    <span key={fact} className={countPill}>
                                      {fact}
                                    </span>
                                  ))}
                                </span>
                              </span>
                              <span
                                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                  selected
                                    ? 'border-accent-solid bg-accent-solid text-on-accent'
                                    : 'border-border bg-surface text-transparent'
                                }`}
                                aria-hidden="true"
                              >
                                <IconCheck className="h-3 w-3" />
                              </span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </fieldset>
              )}

              {!hasNoNotes && (
                <button type="submit" className={btnSubmit} disabled={isBusy}>
                  {isBusy ? (
                    <>
                      <IconSpinner className="h-4.5 w-4.5" />
                      {busyLabel}
                    </>
                  ) : (
                    submitLabel
                  )}
                </button>
              )}
            </div>
          </form>

          <aside className={creationAside}>
            <h2 className="text-sm font-medium">How this works</h2>
            <ul className="mt-3.5 grid gap-2.5 p-0">
              {tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 text-sm text-text-muted">
                  <span
                    className="mt-1.75 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-solid"
                    aria-hidden="true"
                  />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-7 text-sm font-medium">Your notes</h2>
            <p className="mt-3.5 text-sm text-text-muted">
              {notes.isSuccess
                ? `${plural(notes.data.length, 'note')} to choose from.`
                : 'Loading your notes…'}
            </p>
            <AppLink to="/notes/new" className={`${cardLink} mt-3`}>
              Summarise another note
              <IconArrowRight />
            </AppLink>
          </aside>
        </div>
      </main>
    </>
  )
}
