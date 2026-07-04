import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../../components/auth/AuthShell'
import OtpInput from '../../components/auth/OtpInput'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

// Second step of login for accounts with 2FA enabled — lands here with a
// short-lived tempToken (issued after password/Google was already verified).
export default function TwoFactor() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { tempToken, dest } = location.state || {}

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!tempToken) return <Navigate to="/login" replace />

  const submit = async (e) => {
    e?.preventDefault()
    if (code.length < 6) return setError('Enter the 6-digit code.')
    setError('')
    setBusy(true)
    try {
      const { user } = await api.twoFactorVerifyLogin({ tempToken, code })
      setUser(user)
      navigate(dest || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      if (err.code === 'BAD_CHALLENGE') navigate('/login', { replace: true })
      else setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Two-factor authentication"
      title="Enter your code"
      subtitle="Open your authenticator app and enter the 6-digit code to finish signing in."
      footer={
        <>
          Not you? <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      {error && <div className="auth-alert auth-alert--err">{error}</div>}

      <form onSubmit={submit}>
        <OtpInput value={code} onChange={setCode} disabled={busy} />
        <button type="submit" className="auth-btn" disabled={busy || code.length < 6}>
          {busy ? 'Verifying…' : 'Verify & continue'}
        </button>
      </form>
    </AuthShell>
  )
}
