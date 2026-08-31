import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { fieldError, fieldHint, fieldInput, fieldInputInvalid, fieldLabel } from './ui'

interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className' | 'children'> {
  label: string
  options: string[]
  error?: string | null
  hint?: string
}

/**
 * Labelled dropdown, built to the same shape as {@link TextField} so the two sit
 * together in a form. Options are plain strings because the only list it serves
 * — IANA time zone identifiers — is its own label.
 */
export function SelectField({ label, options, error, hint, ...selectProps }: SelectFieldProps) {
  const id = useId()

  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label className={fieldLabel} htmlFor={id}>
        {label}
      </label>
      <select
        {...selectProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${fieldInput} ${error ? fieldInputInvalid : ''}`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {hint && (
        <p className={fieldHint} id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className={fieldError} id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
}
