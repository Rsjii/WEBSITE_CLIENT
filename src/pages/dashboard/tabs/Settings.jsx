import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { Panel, Badge } from '../ui'

export default function Settings() {
  const { user, logout } = useAuth()
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
