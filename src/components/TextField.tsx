import { useId, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { fieldError, fieldHint, fieldInput, fieldInputInvalid, fieldLabel } from './ui'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  label: string
  error?: string | null
  hint?: string
}

export function TextField({ label, error, hint, type = 'text', ...inputProps }: TextFieldProps) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label className={fieldLabel} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${fieldInput} ${isPassword ? 'pr-16' : ''} ${error ? fieldInputInvalid : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            className="absolute inset-y-0 right-0 px-3.5 text-xs font-bold text-text-muted hover:text-accent-foreground"
            aria-pressed={revealed}
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
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
