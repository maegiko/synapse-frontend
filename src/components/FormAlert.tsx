import { formAlert } from './ui'

/** Form-level failure message, announced to screen readers when it appears. */
export function FormAlert({ message }: { message: string }) {
  return (
    <p className={formAlert} role="alert">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        className="mt-0.5 h-4.5 w-4.5 shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5M12 16.4v.1" strokeLinecap="round" />
      </svg>
      <span>{message}</span>
    </p>
  )
}
