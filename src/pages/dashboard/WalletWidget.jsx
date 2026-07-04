import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

// Top-right crypto wallet quick-view: cash balance + default deposit address.
export default function WalletWidget() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open || data) return
    api.walletOverview().then(setData).catch(() => {})
  }, [open, data])

  const address = data?.wallets?.usdt

  const copy = () => {
    if (!address) return
    navigator.clipboard?.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="wallet-widget">
      <button
        type="button"
        className="wallet-widget__btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Crypto wallet"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7a2 2 0 012-2h13a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          <path d="M16 12h.01M3 9h18" />
        </svg>
      </button>

      {open && (
        <>
          <div className="wallet-widget__scrim" onClick={() => setOpen(false)} />
          <div className="wallet-widget__panel">
            <span className="wallet-widget__label">Wallet balance</span>
            <strong className="wallet-widget__balance">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: data?.currency || 'USD' }).format(data?.walletBalance ?? 0)}
            </strong>

            <div className="wallet-widget__addr">
              <span>USDT deposit address</span>
              {address ? (
                <button type="button" className="wallet-widget__copy" onClick={copy}>
                  <code>{address.slice(0, 8)}…{address.slice(-6)}</code>
                  <em>{copied ? 'Copied' : 'Copy'}</em>
                </button>
              ) : (
                <span className="wallet-widget__muted">Set up in Funds tab</span>
              )}
            </div>

            <Link to="/dashboard/funds" className="auth-btn auth-btn--inline" onClick={() => setOpen(false)}>
              Manage funds
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
