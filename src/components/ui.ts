/** Shared class names, so pages stay visually identical to the landing page. */

export const shell = 'mx-auto w-full max-w-280 px-6'

export const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-sm font-bold no-underline border border-transparent transition-[transform,box-shadow,background-color] duration-150 ease-out'
export const btnPrimarySm = `${btnBase} bg-accent-solid text-on-accent shadow-sm px-4.5 py-2.25 text-sm hover:bg-accent-strong hover:shadow-md hover:-translate-y-px`
export const btnPrimaryLg = `${btnBase} bg-accent-solid text-on-accent shadow-sm px-6 py-3.5 text-base hover:bg-accent-strong hover:shadow-md hover:-translate-y-px`
export const btnPrimaryLgInverted = `${btnBase} bg-on-accent text-accent-strong shadow-sm px-6 py-3.5 text-base hover:bg-surface-alt`
export const btnGhostSm = `${btnBase} border-stone-300 bg-stone-200 text-stone-800 px-4.5 py-2.25 text-sm hover:bg-stone-300`
export const btnGhostLg = `${btnBase} border-stone-300 bg-stone-200 text-stone-800 px-6 py-3.25 text-base hover:bg-stone-300`

/** Greys an accent button out, for a request in flight or an action not yet built. */
export const btnPrimaryDisabled =
  'disabled:cursor-not-allowed disabled:bg-accent-soft disabled:text-accent-strong disabled:shadow-none disabled:translate-y-0'

/** Full-width submit button that greys out while a request is in flight. */
export const btnSubmit = `${btnPrimaryLg} w-full ${btnPrimaryDisabled}`

/** Destructive actions: quiet in a toolbar, solid only on the confirm step. */
export const btnDangerSm = `${btnBase} bg-error-solid text-on-accent shadow-sm px-4.5 py-2.25 text-sm hover:bg-error-solid hover:shadow-md hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:translate-y-0`
export const btnDangerGhostSm = `${btnBase} border-border bg-surface text-error-solid px-4.5 py-2.25 text-sm hover:border-error-solid hover:bg-error-soft disabled:cursor-not-allowed disabled:opacity-60`

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
export const countPill =
  'rounded-full bg-surface-alt px-2.5 py-1 text-xs font-bold text-text-muted tabular-nums'
export const metaText = 'text-xs text-text-muted'

export const btnPrimaryMdInverted = `${btnBase} bg-on-accent text-accent-strong shadow-sm px-5.5 py-3 text-base hover:bg-surface-alt hover:shadow-md hover:-translate-y-px`
export const viewAllButton =
  'inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-4 py-2 text-sm font-bold text-accent-solid no-underline shadow-sm transition-[box-shadow,border-color] duration-150 hover:border-accent-solid hover:shadow-md'
export const cardLink =
  'inline-flex items-center gap-1.5 text-sm font-bold text-accent-solid no-underline hover:underline'
