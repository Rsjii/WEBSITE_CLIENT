import { useRef } from 'react'

// Segmented 6-box code input with paste, backspace and arrow support.
export default function OtpInput({ value = '', onChange, length = 6, disabled }) {
  const refs = useRef([])
  const chars = Array.from({ length }, (_, i) => value[i] || '')

  const set = (i, c) => {
    const arr = [...chars]
    arr[i] = c
    onChange(arr.join('').slice(0, length))
  }

  const onInput = (i, e) => {
    const digits = e.target.value.replace(/\D/g, '')
    if (!digits) return set(i, '')
    set(i, digits[digits.length - 1])
    if (i < length - 1) refs.current[i + 1]?.focus()
  }

  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !chars[i] && i > 0) {
      refs.current[i - 1]?.focus()
      set(i - 1, '')
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }

  const onPaste = (e) => {
    const txt = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length)
    if (!txt) return
    e.preventDefault()
    onChange(txt)
    refs.current[Math.min(txt.length, length - 1)]?.focus()
  }

  return (
    <div className="otp" onPaste={onPaste}>
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className="otp__box"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={c}
          disabled={disabled}
          onChange={(e) => onInput(i, e)}
          onKeyDown={(e) => onKey(i, e)}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}
