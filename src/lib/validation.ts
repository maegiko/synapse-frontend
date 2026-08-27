/** Mirrors the backend validation rules in FRONTEND_API.md section 6. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 64

export function validateFullName(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Enter your full name.'
  if (trimmed.length < 2) return 'Your name must be at least 2 characters.'
  if (trimmed.length > 100) return 'Your name must be 100 characters or fewer.'
  return null
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Enter your email address.'
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address.'
  if (trimmed.length > 255) return 'That email address is too long.'
  return null
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Enter a password.'
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Your password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Your password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`
  }
  return null
}
