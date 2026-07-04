import { Suspense, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BrandLoader from '../../components/BrandLoader'
import WalletWidget from './WalletWidget'

const I = {
  overview: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  portfolio: 'M3 3v18h18M7 14l3-3 3 3 5-6',
  markets: 'M4 19V5m4 14V9m4 10V7m4 12v-6m4 6V11',
  funds: 'M3 7a2 2 0 012-2h13a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM16 12h.01M3 9h18',
  referrals: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7.3 7.3 0 00-2-1.2l-.4-2.6H9.5l-.4 2.6a7.3 7.3 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2l.4 2.6h5l.4-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
}

const NAV = [
  { to: '/dashboard', end: true, label: 'Overview', icon: I.overview },
  { to: '/dashboard/portfolio', label: 'Portfolio', icon: I.portfolio },
  { to: '/dashboard/markets', label: 'Markets', icon: I.markets },
  { to: '/dashboard/funds', label: 'Funds', icon: I.funds },
  { to: '/dashboard/referrals', label: 'Referrals', icon: I.referrals },
  { to: '/dashboard/settings', label: 'Settings', icon: I.settings },
]

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const current = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))) || NAV[0]
  const initials = (user?.name || user?.email || 'A').trim().charAt(0).toUpperCase()
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.currency || 'USD' })

  return (
    <div className={`dash${open ? ' dash--open' : ''}`}>
      <div className="dash__scrim" onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <aside className="dash__side">
        <div className="dash__brand">
          AURATRADE
          <span>Elite Trading</span>
        </div>
        <nav className="dash__nav">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `dash__link${isActive ? ' is-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon d={n.icon} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="dash__user">
          <div className="dash__avatar">{user?.avatar ? <img src={user.avatar} alt="" /> : initials}</div>
          <div className="dash__user-meta">
            <strong>{user?.name || 'Trader'}</strong>
            <span>{user?.email}</span>
          </div>
          <button className="dash__logout" onClick={logout} title="Sign out" aria-label="Sign out">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="dash__main">
        <header className="dash__topbar">
          <button className="dash__burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
          <h1 className="dash__title">{current.label}</h1>
          <div className="dash__topbar-right">
            <div className="dash__balance">
              <span>Balance</span>
              <strong>{fmt.format(user?.balance ?? 0)}</strong>
            </div>
            <WalletWidget />
            <div className="dash__avatar dash__avatar--sm">{user?.avatar ? <img src={user.avatar} alt="" /> : initials}</div>
          </div>
        </header>

        <main className="dash__content">
          <Suspense fallback={<BrandLoader label="Loading section" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
