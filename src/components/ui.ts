/** Shared class names, so pages stay visually identical to the landing page. */

export const shell = 'mx-auto w-full max-w-280 px-6'

/**
 * The note / deck / quiz creation pages: a primary task card beside a supporting
 * aside. The aside carries no surface of its own, so it reads as guidance rather
 * than a second card competing with the task area, and its column is a little
 * narrower to keep the task area dominant.
 */
export const creationLayout =
  'mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] lg:gap-10'
/** Sits the aside's first heading level with the task card's first field. */
export const creationAside = 'lg:pt-8'

export const btnBase =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm font-bold no-underline border border-transparent transition-[transform,box-shadow,background-color] duration-150 ease-out'
export const btnPrimarySm = `${btnBase} bg-accent-solid text-on-accent shadow-sm px-4.5 py-2.25 text-sm hover:bg-accent-hover hover:shadow-md hover:-translate-y-px`
export const btnPrimaryLg = `${btnBase} bg-accent-solid text-on-accent shadow-sm px-6 py-3.5 text-base hover:bg-accent-hover hover:shadow-md hover:-translate-y-px`
export const btnPrimaryLgInverted = `${btnBase} bg-on-accent text-accent-on-light shadow-sm px-6 py-3.5 text-base hover:bg-inverted-hover`
export const btnGhostSm = `${btnBase} border-control-border bg-control text-control-text px-4.5 py-2.25 text-sm hover:bg-control-hover`
export const btnGhostLg = `${btnBase} border-control-border bg-control text-control-text px-6 py-3.25 text-base hover:bg-control-hover`

/** Greys an accent button out, for a request in flight or an action not yet built. */
export const btnPrimaryDisabled =
  'disabled:cursor-not-allowed disabled:bg-accent-soft disabled:text-accent-strong disabled:shadow-none disabled:translate-y-0'

/** Full-width submit button that greys out while a request is in flight. */
export const btnSubmit = `${btnPrimaryLg} w-full ${btnPrimaryDisabled}`

/** Destructive actions: quiet in a toolbar, solid only on the confirm step. */
export const btnDangerSm = `${btnBase} bg-error-solid text-on-status shadow-sm px-4.5 py-2.25 text-sm hover:bg-error-solid hover:shadow-md hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:translate-y-0`
export const btnDangerGhostSm = `${btnBase} border-error-solid/30 bg-error-soft text-error-solid px-4.5 py-2.25 text-sm hover:border-error-solid/55 hover:bg-error-solid/10 disabled:cursor-not-allowed disabled:opacity-60`

export const fieldLabel = 'mb-1.5 block text-sm font-bold text-text'
export const fieldInput =
  'w-full rounded-sm border border-border bg-surface px-3.5 py-2.75 text-base text-text transition-colors duration-150 placeholder:text-text-muted hover:border-accent-solid disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-text-muted'
export const fieldInputInvalid = 'border-error-solid bg-error-soft hover:border-error-solid'
export const fieldHint = 'mt-1.5 text-xs text-text-muted'
export const fieldError = 'mt-1.5 text-xs font-bold text-error-solid'

export const formAlert =
  'flex items-start gap-2.5 rounded-sm border border-error-solid bg-error-soft px-4 py-3 text-sm font-semibold text-error-solid'

export const successAlert =
  'flex items-start gap-2.5 rounded-sm border border-success-solid bg-success-soft px-4 py-3 text-sm font-semibold text-success-solid'

export const authCard = 'rounded-lg border border-border bg-surface p-8 shadow-md sm:p-9'

export const surfaceCard = 'rounded-md border border-border bg-surface shadow-sm'
export const iconChip =
  'inline-flex h-10.5 w-10.5 items-center justify-center rounded-sm bg-accent-soft text-accent-strong'
/**
 * A metadata chip. Fixed height and vertically centred, so a pill holding
 * difficulty stars (or any non-text content) lines up with its text neighbours.
 */
export const countPill =
  'inline-flex h-6.5 items-center rounded-full bg-surface-alt px-2.5 text-xs font-bold text-text-muted tabular-nums'

export const btnPrimaryMdInverted = `${btnBase} bg-on-accent text-accent-on-light shadow-sm px-5.5 py-3 text-base hover:bg-inverted-hover hover:shadow-md hover:-translate-y-px`
export const cardLink =
  'inline-flex items-center gap-1.5 text-sm font-bold text-accent-foreground no-underline hover:underline'

/**
 * The pinned state's one colour, shared by the card indicator and the detail
 * pages' pin control. Gold rather than the accent purple, so a pin never reads
 * as the link affordance beside it, and `warning-solid` specifically because it
 * is the ramp step that stays legible on `surface` and `control` in both themes.
 */
export const pinnedTone = 'text-warning-solid'
