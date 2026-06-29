// Small shared presentational helpers for dashboard tabs.

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <header className="panel__head">
          {title && <h2 className="panel__title">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function StatCard({ label, value, sub, accent, trend }) {
  return (
    <div className="stat" style={accent ? { '--accent': accent } : undefined}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      {sub && <span className={`stat__sub${trend ? ` stat__sub--${trend}` : ''}`}>{sub}</span>}
    </div>
  )
}

export function Badge({ children, tone = 'gold' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Empty({ icon = '◆', title, hint }) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <p className="empty__title">{title}</p>
      {hint && <p className="empty__hint">{hint}</p>}
    </div>
  )
}
