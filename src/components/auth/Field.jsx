import { useState } from 'react'

function EyeIcon({ off }) {
  return off ? (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.8" strokeLinecap="round" />
      <path d="M9.4 5.2A9.5 9.5 0 0112 5c5 0 9 4.5 9 7-.4 1-1.2 2.2-2.4 3.3M6.1 6.2C3.8 7.6 2.4 9.7 2 12c.7 1.7 3.6 6 10 6 1 0 1.9-.1 2.7-.3" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function TextField({ label, error, hint, ...props }) {
  return (
    <label className={`field${error ? ' field--err' : ''}`}>
      <span className="field__label">{label}</span>
      <div className="field__box">
        <input className="field__input" {...props} />
      </div>
      {error ? <span className="field__msg">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  )
}

export function PasswordField({ label, error, hint, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <label className={`field${error ? ' field--err' : ''}`}>
      <span className="field__label">{label}</span>
      <div className="field__box">
        <input className="field__input" type={show ? 'text' : 'password'} {...props} />
        <button
          type="button"
          className="field__eye"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          <EyeIcon off={show} />
        </button>
      </div>
      {error ? <span className="field__msg">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  )
}
