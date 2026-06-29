import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../../components/auth/AuthShell'
import { TextField } from '../../components/auth/Field'
import { api } from '../../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      // Backend always returns ok (no account enumeration).
      await api.forgot({ email })
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset password"
      subtitle="Enter your email and we’ll send you a secure reset link."
      footer={
        <>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      {sent ? (
        <div className="auth-alert auth-alert--ok">
          If an account exists for <strong>{email}</strong>, a reset link is on its way. The link expires in 30 minutes.
          <br />
          <span style={{ opacity: 0.75 }}>
            (Dev mode without an email provider prints the link to the server console.)
          </span>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="auth-btn" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
