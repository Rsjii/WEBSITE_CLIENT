import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Panel, StatCard, Badge, Empty } from '../ui'
import { api } from '../../../lib/api'

function maskEmail(email) {
  if (!email) return ''
  const [user, domain] = email.split('@')
  if (!domain) return email
  const visible = user.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`
}

export default function Referrals() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState('')

  const load = () =>
    api
      .referralsOverview()
      .then((d) => {
        setData(d)
        setError('')
      })
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!data?.referralLink) return
    let cancelled = false
    QRCode.toDataURL(data.referralLink, { margin: 1, width: 176, color: { dark: '#050504', light: '#f2ead2' } })
      .then((url) => !cancelled && setQr(url))
      .catch(() => !cancelled && setQr(''))
    return () => {
      cancelled = true
    }
  }, [data?.referralLink])

  if (error && !data) {
    return (
      <div className="grid-stack">
        <Panel><Empty icon="!" title="Couldn't load referrals" hint={error} /></Panel>
      </div>
    )
  }
  if (!data) return null

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="grid-stack">
      <div className="stat-grid">
        <StatCard label="Total Referrals" value={data.totals.referredCount} />
        <StatCard label="Total Earned" value={fmt.format(data.totals.totalEarned)} accent="#D4AF37" trend="up" />
        <StatCard label="Commission Rate" value={`${data.commissionPercent}%`} sub="Per account opened" />
        <StatCard
          label="Referred By"
          value={data.referredBy ? data.referredBy.name || data.referredBy.code : '—'}
          sub={data.referredBy ? data.referredBy.code : 'Not referred'}
        />
      </div>

      <Panel title="Your Referral Code">
        <p className="panel__lead">
          Share your code or link — every time someone you refer opens a trading account, you earn{' '}
          <strong>{data.commissionPercent}%</strong> of what they pay, credited straight to your wallet.
        </p>
        <div className="funds-wallet-box">
          {qr && <img src={qr} alt="Referral link QR code" className="funds-qr" />}
          <div className="funds-wallet-box__addr" style={{ flex: 1 }}>
            <span>Referral code</span>
            <button type="button" className="wallet-widget__copy" onClick={() => copy(data.referralCode, 'code')}>
              <code>{data.referralCode}</code>
              <em>{copied === 'code' ? 'Copied' : 'Copy'}</em>
            </button>
            <span style={{ marginTop: '0.6rem' }}>Referral link</span>
            <button type="button" className="wallet-widget__copy" onClick={() => copy(data.referralLink, 'link')}>
              <code>{data.referralLink}</code>
              <em>{copied === 'link' ? 'Copied' : 'Copy'}</em>
            </button>
          </div>
        </div>
      </Panel>

      {!data.referredBy && <ApplyCodePanel onApplied={load} />}

      <Panel title="People You Referred" action={<Badge tone="muted">{data.referrals.length} total</Badge>}>
        {data.referrals.length === 0 ? (
          <Empty icon="◈" title="No referrals yet" hint="Share your code or link above to start earning commissions." />
        ) : (
          <table className="table">
            <thead>
              <tr><th>Trader</th><th>Joined</th><th>Accounts Opened</th><th>Earned</th></tr>
            </thead>
            <tbody>
              {data.referrals.map((r) => (
                <tr key={r.id}>
                  <td>{r.name || maskEmail(r.email)}</td>
                  <td>{new Date(r.joinedAt).toLocaleDateString()}</td>
                  <td>{r.accountsOpened}</td>
                  <td className="td-up">{fmt.format(r.earned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {data.earnings.length > 0 && (
        <Panel title="Recent Commission Earnings">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>From</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {data.earnings.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.createdAt).toLocaleString()}</td>
                  <td>{e.referredName || maskEmail(e.referredEmail)}</td>
                  <td className="td-up">+{fmt.format(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  )
}

function ApplyCodePanel({ onApplied }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.applyReferralCode({ code: code.trim().toUpperCase() })
      setDone(true)
      await onApplied()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) return null

  return (
    <Panel title="Have a Referral Code?">
      {error && <div className="auth-alert auth-alert--err">{error}</div>}
      <form onSubmit={submit} className="dep-form" style={{ flexDirection: 'row', alignItems: 'flex-end', gap: '0.8rem', flexWrap: 'wrap' }}>
        <label className="field" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
          <span className="field__label">Referral code</span>
          <div className="field__box">
            <input
              className="field__input"
              placeholder="e.g. AB3D9F2K"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          </div>
        </label>
        <button type="submit" className="auth-btn auth-btn--inline" disabled={busy || !code.trim()}>
          {busy ? 'Applying…' : 'Apply code'}
        </button>
      </form>
    </Panel>
  )
}
