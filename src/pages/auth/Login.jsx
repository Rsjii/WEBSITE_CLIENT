import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../../components/auth/AuthShell'
import { TextField, PasswordField } from '../../components/auth/Field'
import GoogleButton from '../../components/auth/GoogleButton'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function Login() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const dest = location.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [useGoogleHint, setUseGoogleHint] = useState(false)
  const [busy, setBusy] = useState(false)

  const finish = (data) => {
    if (data.twoFactorRequired) {
      navigate('/two-factor', { state: { tempToken: data.tempToken, dest } })
      return
    }
    setUser(data.user)
    navigate(dest, { replace: true })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setUseGoogleHint(false)
    setBusy(true)
    try {
      const data = await api.login({ email, password })
      finish(data)
    } catch (err) {
      setError(err.message)
      if (err.code === 'USE_GOOGLE') setUseGoogleHint(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Access your AuraTrade dashboard and managed portfolio."
      footer={
        <>
          New to AuraTrade? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      {error && <div className={`auth-alert ${useGoogleHint ? 'auth-alert--info' : 'auth-alert--err'}`}>{error}</div>}

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
        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="auth-row-end">
          <Link to="/forgot-password" className="auth-link-sm">Forgot password?</Link>
        </div>
        <button type="submit" className="auth-btn" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="auth-divider"><span>or</span></div>
      <GoogleButton onSuccess={finish} onError={(e) => setError(e.message)} />
    </AuthShell>
  )
}
