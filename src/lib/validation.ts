/**
 * The backend's input rules, mirrored so an invalid value never costs a request.
 * FRONTEND_API.md section 2 states each limit once for the whole API, so a single
 * constant per value is correct everywhere and no form may hardcode its own.
 *
 * Text is trimmed before it is measured. Passwords are the exception and are
 * never trimmed, since surrounding whitespace is part of the secret.
 */

export const EMAIL_MAX_LENGTH = 254
export const EMAIL_LOCAL_MAX_LENGTH = 64

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 64
/** The password hash the backend uses cannot take more than this many bytes. */
export const PASSWORD_MAX_BYTES = 72

export const FULL_NAME_MIN_LENGTH = 2
export const FULL_NAME_MAX_LENGTH = 100

export const TIME_ZONE_MAX_LENGTH = 64

/** Verification and password-reset tokens, as they arrive in a link. */
export const EMAILED_TOKEN_MAX_LENGTH = 255

/** Note, deck and quiz titles, and group names. */
export const TITLE_MAX_LENGTH = 200
/** Quiz and group descriptions. */
export const DESCRIPTION_MAX_LENGTH = 500
export const NOTE_OVERVIEW_MAX_LENGTH = 5000
/** Both sides of a flashcard. */
export const FLASHCARD_SIDE_MAX_LENGTH = 1000
export const QUESTION_MAX_LENGTH = 1000
export const ANSWER_MAX_LENGTH = 500

/** The `?query=` parameter every list endpoint takes. */
export const SEARCH_QUERY_MAX_LENGTH = 100
export const MIN_PAGE_SIZE = 1
export const MAX_PAGE_SIZE = 100

export const MIN_DIFFICULTY = 1
export const MAX_DIFFICULTY = 5

/**
 * A deliverable address: a dot-atom local part, then dot-separated labels that do
 * not start or end with a hyphen, ending in an alphabetic TLD of at least two.
 * ASCII only, matching the backend, so `ada@café.fr` is rejected here as well.
 */
const EMAIL_LOCAL_PATTERN = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/
const EMAIL_DOMAIN_PATTERN = /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/

/**
 * Letters in any script, not `A-Z`: "José Müller", "Ngô Đình" and "陳大文" are all
 * valid names that an ASCII-only pattern would lock out. Both apostrophe forms
 * are accepted, because phone keyboards produce the curly one.
 */
const FULL_NAME_PATTERN = /^\p{L}[\p{L}\p{M} '’-]*\p{L}$/u

/** How the backend normalizes an address before it validates or stores it. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function validateEmail(value: string): string | null {
  const normalized = normalizeEmail(value)
  if (!normalized) return 'Enter your email address.'
  if (normalized.length > EMAIL_MAX_LENGTH) {
    return `Your email address must be ${EMAIL_MAX_LENGTH} characters or fewer.`
  }

  const at = normalized.indexOf('@')
  if (at <= 0 || at !== normalized.lastIndexOf('@') || at === normalized.length - 1) {
    return 'Enter a valid email address.'
  }
  const local = normalized.slice(0, at)
  const domain = normalized.slice(at + 1)
  if (local.length > EMAIL_LOCAL_MAX_LENGTH) return 'Enter a valid email address.'
  if (!EMAIL_LOCAL_PATTERN.test(local)) return 'Enter a valid email address.'
  if (!EMAIL_DOMAIN_PATTERN.test(domain)) return 'Enter a valid email address.'
  return null
}

export function validateFullName(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Enter your full name.'
  if (trimmed.length < FULL_NAME_MIN_LENGTH) {
    return `Your name must be at least ${FULL_NAME_MIN_LENGTH} characters.`
  }
  if (trimmed.length > FULL_NAME_MAX_LENGTH) {
    return `Your name must be ${FULL_NAME_MAX_LENGTH} characters or fewer.`
  }
  if (!FULL_NAME_PATTERN.test(trimmed)) {
    return 'Your name can only use letters, spaces, hyphens and apostrophes.'
  }
  return null
}

/** UTF-8 bytes, which is what the 72 byte limit actually counts. */
function byteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

export function validatePassword(value: string): string | null {
  // Not trimmed: whitespace around a password is part of the secret.
  if (!value) return 'Enter a password.'
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Your password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Your password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`
  }
  if (byteLength(value) > PASSWORD_MAX_BYTES) {
    return 'Your password uses too many accented or non-Latin characters. Try a shorter one.'
  }
  return null
}

export function validateTimeZone(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Choose a time zone.'
  if (trimmed.length > TIME_ZONE_MAX_LENGTH) return 'Choose a time zone from the list.'
  return null
}

/** `subject` names the thing; `noun` is the word this screen uses for the field. */
export function validateTitle(value: string, subject: string, noun = 'title'): string | null {
  const trimmed = value.trim()
  if (!trimmed) return `Give this ${subject} a ${noun}.`
  if (trimmed.length > TITLE_MAX_LENGTH) {
    return `The ${noun} must be ${TITLE_MAX_LENGTH} characters or fewer.`
  }
  return null
}

/** Optional, and the one field where blank is meaningful: it clears the value. */
export function validateDescription(value: string): string | null {
  if (value.trim().length > DESCRIPTION_MAX_LENGTH) {
    return `The description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`
  }
  return null
}

export function validateNoteOverview(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Write an overview for this note.'
  if (trimmed.length > NOTE_OVERVIEW_MAX_LENGTH) {
    return `The overview must be ${NOTE_OVERVIEW_MAX_LENGTH} characters or fewer.`
  }
  return null
}

/** One side of a flashcard. Both sides share the same bound. */
export function validateFlashcardSide(value: string, side: 'question' | 'answer'): string | null {
  const trimmed = value.trim()
  if (!trimmed) return `Write the ${side} for this card.`
  if (trimmed.length > FLASHCARD_SIDE_MAX_LENGTH) {
    return `The ${side} must be ${FLASHCARD_SIDE_MAX_LENGTH} characters or fewer.`
  }
  return null
}

/** The text of a quiz question. */
export function validateQuestionText(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Write the question.'
  if (trimmed.length > QUESTION_MAX_LENGTH) {
    return `The question must be ${QUESTION_MAX_LENGTH} characters or fewer.`
  }
  return null
}

/** Boolean questions send a fixed True/False pair, so they never reach this. */
export function validateAnswerText(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Fill in every answer.'
  if (trimmed.length > ANSWER_MAX_LENGTH) {
    return `Answers must be ${ANSWER_MAX_LENGTH} characters or fewer.`
  }
  return null
}

/** Anything longer than the backend accepts is refused there, so do not send it. */
export function isUsableEmailedToken(token: string): boolean {
  return token.length > 0 && token.length <= EMAILED_TOKEN_MAX_LENGTH
}

/** Trims a search term to what `?query=` accepts, so an overlong one still runs. */
export function clampSearchQuery(value: string): string {
  return value.trim().slice(0, SEARCH_QUERY_MAX_LENGTH)
}

/** A list `page`, floored at the first page. */
export function clampPage(page: number): number {
  return Number.isFinite(page) ? Math.max(0, Math.trunc(page)) : 0
}

/** A list `size`, held inside the range the backend accepts. */
export function clampPageSize(size: number): number {
  if (!Number.isFinite(size)) return MAX_PAGE_SIZE
  return Math.min(Math.max(Math.trunc(size), MIN_PAGE_SIZE), MAX_PAGE_SIZE)
}

/** A quiz difficulty, held inside 1 to 5. */
export function clampDifficulty(difficulty: number): number {
  if (!Number.isFinite(difficulty)) return MIN_DIFFICULTY
  return Math.min(Math.max(Math.round(difficulty), MIN_DIFFICULTY), MAX_DIFFICULTY)
}
