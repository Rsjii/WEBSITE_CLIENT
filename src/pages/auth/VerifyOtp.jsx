import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../../components/auth/AuthShell'
import OtpInput from '../../components/auth/OtpInput'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function VerifyOtp() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { email, devMode, linking } = location.state || {}

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resent, setResent] = useState(false)
  const tick = useRef(null)

  useEffect(() => {
    if (cooldown <= 0) return
    tick.current = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(tick.current)
  }, [cooldown])

  // No email in navigation state → user landed here directly.
  if (!email) return <Navigate to="/signup" replace />

  const submit = async (e) => {
    e?.preventDefault()
    if (code.length < 6) return setError('Enter the 6-digit code.')
    setError('')
    setBusy(true)
    try {
      const { user } = await api.verifyOtp({ email, code })
      setUser(user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      if (err.code === 'NO_PENDING' || err.code === 'EXPIRED') setCode('')
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (cooldown > 0) return
    setError('')
    setResent(false)
    try {
      const res = await api.resendOtp({ email })
      setResent(true)
      setCooldown(60)
      if (res.devMode) {
        /* dev: code is in the server console */
      }
    } catch (err) {
      setError(err.message)
      if (err.data?.retryAfter) setCooldown(err.data.retryAfter)
    }
  }

  return (
    <AuthShell
      eyebrow={linking ? 'Link your account' : 'Verify email'}
      title="Enter your code"
      subtitle={
        <>
          We sent a 6-digit code to <strong style={{ color: '#e9e2cc' }}>{email}</strong>.
        </>
      }
      footer={
        <>
          Wrong email? <Link to="/signup">Start over</Link>
        </>
      }
    >
      {devMode && (
        <div className="auth-alert auth-alert--info">
          Dev mode: no email provider configured — your code is printed in the <strong>server console</strong>.
        </div>
      )}
      {error && <div className="auth-alert auth-alert--err">{error}</div>}
      {resent && !error && <div className="auth-alert auth-alert--ok">A new code is on its way.</div>}

      <form onSubmit={submit}>
        <OtpInput value={code} onChange={setCode} disabled={busy} />
        <button type="submit" className="auth-btn" disabled={busy || code.length < 6}>
          {busy ? 'Verifying…' : 'Verify & continue'}
        </button>
      </form>

      <div className="auth-resend">
        Didn’t get it?{' '}
        <button type="button" className="auth-link-btn" onClick={resend} disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </AuthShell>
  )
}
