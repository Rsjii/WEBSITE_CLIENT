import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthShell from '../../components/auth/AuthShell'
import { PasswordField } from '../../components/auth/Field'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function ResetPassword() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [topError, setTopError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!token) {
    return (
      <AuthShell eyebrow="Account recovery" title="Invalid link" subtitle="This reset link is missing or malformed.">
        <div className="auth-alert auth-alert--err">
          Please request a new reset link from the <Link to="/forgot-password">forgot password</Link> page.
        </div>
      </AuthShell>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (password.length < 8) er.password = 'At least 8 characters.'
    else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) er.password = 'Use a letter and a number.'
    if (confirm !== password) er.confirm = 'Passwords do not match.'
    setErrors(er)
    setTopError('')
    if (Object.keys(er).length) return

    setBusy(true)
    try {
      const { user } = await api.reset({ token, password })
      setUser(user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setTopError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Set a new password"
      subtitle="Choose a strong password you haven’t used before."
      footer={
        <>
          Changed your mind? <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      {topError && (
        <div className="auth-alert auth-alert--err">
          {topError} <Link to="/forgot-password">Request a new link →</Link>
        </div>
      )}
      <form onSubmit={submit} noValidate>
        <PasswordField
          label="New password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <button type="submit" className="auth-btn" disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthShell>
  )
}
