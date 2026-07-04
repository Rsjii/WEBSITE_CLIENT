import { useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { useAuth } from '../../../context/AuthContext'
import { Panel, Badge } from '../ui'
import OtpInput from '../../../components/auth/OtpInput'
import { api } from '../../../lib/api'

export default function Settings() {
  const { user, logout, refresh } = useAuth()
  const providers = user?.providers || []

  return (
    <div className="grid-stack">
      <Panel title="Profile">
        <dl className="kv">
          <div><dt>Name</dt><dd>{user?.name || '—'}</dd></div>
          <div><dt>Email</dt><dd>{user?.email} {user?.emailVerified && <Badge tone="green">Verified</Badge>}</dd></div>
          <div><dt>Member since</dt><dd>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</dd></div>
        </dl>
      </Panel>

      <Panel title="Sign-in methods">
        <div className="providers">
          <div className="provider">
            <span>Email &amp; Password</span>
            {providers.includes('password') ? <Badge tone="green">Enabled</Badge> : (
              <Link to="/forgot-password" className="auth-link-sm">Set a password</Link>
            )}
          </div>
          <div className="provider">
            <span>Google</span>
            {providers.includes('google') ? <Badge tone="green">Linked</Badge> : <Badge tone="muted">Not linked</Badge>}
          </div>
        </div>
      </Panel>

      <TwoFactorPanel user={user} refresh={refresh} />

      <Panel title="Security">
        <div className="providers">
          <div className="provider">
            <span>Password</span>
            <Link to="/forgot-password" className="auth-link-sm">Change password</Link>
          </div>
          <div className="provider">
            <span>Session</span>
            <button className="auth-link-sm auth-link-btn" onClick={logout}>Sign out</button>
          </div>
        </div>
      </Panel>
    </div>
  )
}

function TwoFactorPanel({ user, refresh }) {
  const [setup, setSetup] = useState(null) // { secret, otpauthUrl, qr }
  const [mode, setMode] = useState(null) // null | 'enable' | 'disable'
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const startEnable = async () => {
    setError('')
    setBusy(true)
    try {
      const res = await api.twoFactorSetup()
      const qr = await QRCode.toDataURL(res.otpauthUrl, { margin: 1, width: 180 })
      setSetup({ ...res, qr })
      setMode('enable')
      setCode('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const cancel = () => {
    setMode(null)
    setSetup(null)
    setCode('')
    setError('')
  }

  const confirmEnable = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.twoFactorEnable({ code })
      cancel()
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const confirmDisable = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.twoFactorDisable({ code })
      cancel()
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel
      title="Two-Factor Authentication"
      action={<Badge tone={user?.twoFactorEnabled ? 'green' : 'muted'}>{user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</Badge>}
    >
      <p className="panel__lead">
        Add an extra layer of security. Once enabled, you'll need a 6-digit code from an authenticator app
        (Google Authenticator, Authy, etc.) every time you sign in.
      </p>
      {error && <div className="auth-alert auth-alert--err">{error}</div>}

      {!mode && (
        user?.twoFactorEnabled ? (
          <button type="button" className="auth-link-sm auth-link-btn" onClick={() => { setMode('disable'); setCode(''); setError('') }}>
            Disable 2FA
          </button>
        ) : (
          <button type="button" className="auth-btn auth-btn--inline" onClick={startEnable} disabled={busy}>
            {busy ? 'Preparing…' : 'Enable 2FA'}
          </button>
        )
      )}

      {mode === 'enable' && setup && (
        <form onSubmit={confirmEnable} className="dep-form" style={{ marginTop: '1.2rem' }}>
          <div className="twofa-setup">
            {setup.qr && <img src={setup.qr} alt="2FA QR code" className="twofa-qr" />}
            <div className="twofa-secret">
              <span className="field__label">Can't scan? Enter manually</span>
              <code>{setup.secret}</code>
            </div>
          </div>
          <label className="field">
            <span className="field__label">Enter the 6-digit code from your app</span>
            <OtpInput value={code} onChange={setCode} disabled={busy} />
          </label>
          <div className="quick" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button type="submit" className="auth-btn" disabled={busy || code.length < 6}>Confirm &amp; enable</button>
            <button type="button" className="auth-link-sm auth-link-btn" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      {mode === 'disable' && (
        <form onSubmit={confirmDisable} className="dep-form" style={{ marginTop: '1.2rem' }}>
          <label className="field">
            <span className="field__label">Enter your current 6-digit code to confirm</span>
            <OtpInput value={code} onChange={setCode} disabled={busy} />
          </label>
          <div className="quick" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button type="submit" className="auth-btn" disabled={busy || code.length < 6}>Confirm &amp; disable</button>
            <button type="button" className="auth-link-sm auth-link-btn" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}
    </Panel>
  )
}
