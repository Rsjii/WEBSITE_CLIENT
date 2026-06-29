import { Link } from 'react-router-dom'

// Premium split layout for all auth screens: brand showcase on the left,
// form card on the right. Collapses to a single column on mobile.
export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <div className="auth__bg" aria-hidden />

      {/* Brand showcase */}
      <aside className="auth__brand">
        <Link to="/" className="auth__logo">
          <img src="/logo.png" alt="AuraTrade" className="auth__logo-img" />
          <span className="auth__logo-tag">Elite Trading Platform</span>
        </Link>

        <div className="auth__pitch">
          <h2 className="auth__pitch-title">
            Where Wealth<br />Moves.
          </h2>
          <p className="auth__pitch-sub">
            Join serious traders accessing Forex, Crypto, Stocks, Indices &amp; Commodities with
            institutional-grade execution.
          </p>
          <ul className="auth__points">
            <li>Managed strategies from $100</li>
            <li>Segregated tier-1 bank accounts</li>
            <li>Instant crypto funding, zero fees</li>
          </ul>
        </div>

        <div className="auth__chart" aria-hidden>
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} style={{ '--h': `${20 + Math.abs(Math.sin(i * 0.7)) * 70}%`, '--d': `${i * 0.05}s` }} />
          ))}
        </div>
      </aside>

      {/* Form */}
      <main className="auth__panel">
        <div className="auth__card">
          <Link to="/" className="auth__home">← Back to site</Link>
          {eyebrow && <span className="auth__eyebrow">{eyebrow}</span>}
          <h1 className="auth__title">{title}</h1>
          {subtitle && <p className="auth__subtitle">{subtitle}</p>}
          {children}
          {footer && <div className="auth__footer">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
