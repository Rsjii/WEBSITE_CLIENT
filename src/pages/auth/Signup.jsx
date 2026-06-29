import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../../components/auth/AuthShell'
import { TextField, PasswordField } from '../../components/auth/Field'
import GoogleButton from '../../components/auth/GoogleButton'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function Signup() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [accept, setAccept] = useState(false)
  const [errors, setErrors] = useState({})
  const [topError, setTopError] = useState('')
  const [existsHint, setExistsHint] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const er = {}
    if (!form.name.trim()) er.name = 'Please enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) er.email = 'Enter a valid email address.'
    if (form.password.length < 8) er.password = 'At least 8 characters.'
    else if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password))
      er.password = 'Use a letter and a number.'
    if (form.confirm !== form.password) er.confirm = 'Passwords do not match.'
    return er
  }

  const submit = async (e) => {
    e.preventDefault()
    setTopError('')
    setExistsHint(false)
    const er = validate()
    if (!accept) er.accept = 'You must accept the Terms & Conditions.'
    setErrors(er)
    if (Object.keys(er).length) return

    setBusy(true)
    try {
      const res = await api.signup({
        name: form.name,
        email: form.email,
        password: form.password,
        acceptTerms: accept,
      })
      navigate('/verify', { state: { email: res.email, devMode: res.devMode, linking: res.linking } })
    } catch (err) {
      setTopError(err.message)
      if (err.code === 'EXISTS') setExistsHint(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Open an AuraTrade account in under a minute."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      {topError && (
        <div className={`auth-alert ${existsHint ? 'auth-alert--info' : 'auth-alert--err'}`}>
          {topError} {existsHint && <Link to="/login">Sign in →</Link>}
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <TextField
          label="Full name"
          autoComplete="name"
          placeholder="Jane Trader"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint={!errors.password ? 'At least 8 characters, with a letter and a number.' : undefined}
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />

        <label className={`auth-check${errors.accept ? ' auth-check--err' : ''}`}>
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
          <span className="auth-check__box" aria-hidden />
          <span className="auth-check__label">
            I agree to the <Link to="/terms">Terms &amp; Conditions</Link> and <Link to="/privacy">Privacy Policy</Link>.
          </span>
        </label>
        {errors.accept && <span className="auth-check__msg">{errors.accept}</span>}

        <button type="submit" className="auth-btn" disabled={busy}>
          {busy ? 'Sending code…' : 'Create account'}
        </button>
      </form>

      <div className="auth-divider"><span>or</span></div>
      <GoogleButton
        onSuccess={(user) => {
          setUser(user)
          navigate('/dashboard', { replace: true })
        }}
        onError={(e) => setTopError(e.message)}
      />
    </AuthShell>
  )
}
