import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { Panel, StatCard, Badge } from '../ui'

export default function Overview() {
  const { user } = useAuth()
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.currency || 'USD' })
  const balance = user?.balance ?? 0
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = (user?.name || 'Trader').split(' ')[0]

  return (
    <div className="grid-stack">
      <div className="dash-hello">
        <div>
          <h2>{greet}, {firstName}.</h2>
          <p>Here’s a snapshot of your managed portfolio.</p>
        </div>
        <Link to="/dashboard/deposit" className="auth-btn auth-btn--inline">Deposit funds</Link>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Balance" value={fmt.format(balance)} sub="Across all strategies" accent="#D4AF37" />
        <StatCard label="Invested" value={fmt.format(balance)} sub="Allocated capital" />
        <StatCard label="Total P&L" value="+$0.00" sub="+0.00% all time" trend="up" />
        <StatCard label="Account Status" value="Active" sub="Verified" accent="#6fcf97" />
      </div>

      <div className="two-col">
        <Panel title="Managed Strategy" action={<Badge>AuraTrade Managed</Badge>}>
          <p className="panel__lead">
            Your capital is allocated to AuraTrade’s managed execution desk. Deposit a minimum of{' '}
            <strong>$100</strong> to activate your strategy — our managers handle the rest.
          </p>
          <div className="meter">
            <div className="meter__bar"><span style={{ width: balance > 0 ? '100%' : '0%' }} /></div>
            <div className="meter__legend">
              <span>Cash {fmt.format(0)}</span>
              <span>Managed {fmt.format(balance)}</span>
            </div>
          </div>
          {balance <= 0 && (
            <Link to="/dashboard/deposit" className="auth-btn auth-btn--inline" style={{ marginTop: '1.2rem' }}>
              Make your first deposit
            </Link>
          )}
        </Panel>

        <Panel title="Quick Actions">
          <div className="quick">
            <Link to="/dashboard/deposit" className="quick__item"><span>＋</span> Deposit</Link>
            <Link to="/dashboard/withdraw" className="quick__item"><span>↑</span> Withdraw</Link>
            <Link to="/dashboard/markets" className="quick__item"><span>≈</span> Markets</Link>
            <Link to="/dashboard/settings" className="quick__item"><span>⚙</span> Settings</Link>
          </div>
        </Panel>
      </div>
    </div>
  )
}
