import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Panel, StatCard, Badge, Empty } from '../ui'
import { api } from '../../../lib/api'

const CRYPTO_METHODS = [
  { id: 'usdt', name: 'USDT', net: 'TRC-20 / BEP-20', icon: '₮' },
  { id: 'btc', name: 'Bitcoin', net: 'BTC Network', icon: '₿' },
  { id: 'eth', name: 'Ethereum', net: 'ERC-20', icon: 'Ξ' },
]
const ALL_METHODS = [...CRYPTO_METHODS, { id: 'wire', name: 'Bank Wire', net: 'SWIFT / SEPA', icon: '⬚' }]

const VIEWS = [
  { id: 'overview', label: 'Overview' },
  { id: 'deposit', label: 'Deposit' },
  { id: 'withdraw', label: 'Withdraw' },
  { id: 'history', label: 'History' },
]

function StatusBadge({ status }) {
  const tone = status === 'approved' ? 'green' : status === 'rejected' ? 'muted' : 'gold'
  return <Badge tone={tone}>{status}</Badge>
}

export default function Funds() {
  const [view, setView] = useState('overview')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () =>
    api
      .walletOverview()
      .then((d) => {
        setData(d)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading && !data) return null
  if (error && !data)
    return (
      <div className="grid-stack">
        <Panel><Empty icon="!" title="Couldn't load your funds" hint={error} /></Panel>
      </div>
    )

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency || 'USD' })
  const accounts = data.accounts || []
  const activeCount = accounts.filter((a) => a.status === 'active').length
  const totalCost = data.accountPrice + data.ticketFee

  return (
    <div className="grid-stack">
      <div className="stat-grid">
        <StatCard label="Wallet Balance" value={fmt.format(data.walletBalance)} accent="#D4AF37" />
        <StatCard label="Trading Accounts" value={accounts.length} sub={`${activeCount} active`} />
        <StatCard label="Total Deposited" value={fmt.format(data.totals.deposited)} trend="up" />
        <StatCard label="Total Withdrawn" value={fmt.format(data.totals.withdrawn)} />
      </div>

      <div className="seg">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" className={`seg__btn${view === v.id ? ' is-active' : ''}`} onClick={() => setView(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      {view === 'overview' && <FundsOverview data={data} fmt={fmt} totalCost={totalCost} onOpened={load} />}
      {view === 'deposit' && <FundsDeposit data={data} onSubmitted={load} />}
      {view === 'withdraw' && <FundsWithdraw data={data} fmt={fmt} onSubmitted={load} />}
      {view === 'history' && <FundsHistory data={data} fmt={fmt} />}
    </div>
  )
}

function FundsOverview({ data, fmt, totalCost, onOpened }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const canOpen = data.walletBalance >= totalCost

  const open = async () => {
    setBusy(true)
    setError('')
    try {
      await api.openAccount({})
      await onOpened()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel
      title="My Trading Accounts"
      action={
        <button
          type="button"
          className="auth-btn auth-btn--inline"
          onClick={open}
          disabled={busy || !canOpen}
          title={!canOpen ? `Deposit at least ${fmt.format(totalCost)} to your wallet first` : undefined}
        >
          {busy ? 'Opening…' : `+ Open account (${fmt.format(totalCost)})`}
        </button>
      }
    >
      {error && <div className="auth-alert auth-alert--err">{error}</div>}
      <p className="panel__lead">
        Each trading account costs <strong>{fmt.format(data.accountPrice)}</strong> plus a one-time{' '}
        <strong>{fmt.format(data.ticketFee)}</strong> opening ticket — {fmt.format(totalCost)} total, deducted from
        your wallet balance. Open as many accounts as you need.
      </p>

      {data.accounts.length === 0 ? (
        <Empty icon="▤" title="No trading accounts yet" hint="Deposit funds to your wallet, then open your first account." />
      ) : (
        <div className="acct-grid">
          {data.accounts.map((a) => (
            <div className="acct-card" key={a.id}>
              <div className="acct-card__head">
                <strong>{a.label}</strong>
                <Badge tone={a.status === 'active' ? 'green' : 'muted'}>{a.status}</Badge>
              </div>
              <span className="acct-card__balance">{fmt.format(a.balance)}</span>
              <span className="acct-card__meta">Opened {new Date(a.openedAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function FundsDeposit({ data, onSubmitted }) {
  const [method, setMethod] = useState('usdt')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [qr, setQr] = useState('')

  const address = data.wallets?.[method]
  const isCrypto = method !== 'wire'

  useEffect(() => {
    if (!isCrypto || !address) {
      setQr('')
      return
    }
    let cancelled = false
    QRCode.toDataURL(address, { margin: 1, width: 176, color: { dark: '#050504', light: '#f2ead2' } })
      .then((url) => !cancelled && setQr(url))
      .catch(() => !cancelled && setQr(''))
    return () => {
      cancelled = true
    }
  }, [address, isCrypto])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.walletDeposit({ amount: Number(amount), method, note })
      setDone(true)
      await onSubmitted()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <Panel title="Deposit Funds">
        <div className="auth-alert auth-alert--ok">
          Deposit request for <strong>${Number(amount).toLocaleString()}</strong> via{' '}
          {ALL_METHODS.find((m) => m.id === method)?.name} received. Our team will verify and credit your wallet shortly.
        </div>
        <button
          type="button"
          className="auth-btn auth-btn--inline"
          style={{ marginTop: '1rem' }}
          onClick={() => {
            setDone(false)
            setAmount('')
            setNote('')
          }}
        >
          Make another deposit
        </button>
      </Panel>
    )
  }

  return (
    <Panel title="Deposit Funds" action={<Badge>Min $10</Badge>}>
      {error && <div className="auth-alert auth-alert--err">{error}</div>}
      <form onSubmit={submit} className="dep-form">
        <span className="field__label">Choose a method</span>
        <div className="dep-methods">
          {ALL_METHODS.map((m) => (
            <button
              type="button"
              key={m.id}
              className={`dep-method-card${method === m.id ? ' is-active' : ''}`}
              onClick={() => setMethod(m.id)}
            >
              <span className="dep-method-card__icon">{m.icon}</span>
              <span className="dep-method-card__name">{m.name}</span>
              <span className="dep-method-card__net">{m.net}</span>
            </button>
          ))}
        </div>

        {isCrypto ? (
          address ? (
            <div className="funds-wallet-box">
              {qr && <img src={qr} alt={`${method.toUpperCase()} deposit address QR`} className="funds-qr" />}
              <div className="funds-wallet-box__addr">
                <span>Send {method.toUpperCase()} to</span>
                <code>{address}</code>
              </div>
            </div>
          ) : (
            <div className="auth-alert auth-alert--info">This method isn't configured yet — contact support for funding details.</div>
          )
        ) : (
          <div className="funds-wallet-box">
            <div className="funds-wallet-box__addr funds-wallet-box__addr--kv">
              <span>Bank</span><code>{data.bankWire?.bankName || 'Contact support'}</code>
              <span>Account name</span><code>{data.bankWire?.accountName || '—'}</code>
              <span>IBAN</span><code>{data.bankWire?.iban || '—'}</code>
              <span>SWIFT</span><code>{data.bankWire?.swift || '—'}</code>
            </div>
          </div>
        )}

        <label className="field">
          <span className="field__label">Amount (USD)</span>
          <div className="field__box">
            <input
              className="field__input"
              type="number"
              min="10"
              step="any"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </label>
        <label className="field">
          <span className="field__label">Transaction reference (optional)</span>
          <div className="field__box">
            <input className="field__input" placeholder="Tx hash or note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </label>

        <button type="submit" className="auth-btn" disabled={busy || Number(amount) < 10}>
          {busy ? 'Submitting…' : "I've sent the funds"}
        </button>
      </form>
    </Panel>
  )
}

function FundsWithdraw({ data, fmt, onSubmitted }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('usdt')
  const [dest, setDest] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const balance = data.walletBalance

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.walletWithdraw({ amount: Number(amount), method, destination: dest })
      setDone(true)
      setAmount('')
      setDest('')
      await onSubmitted()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel title="Withdraw Funds">
      <div className="withdraw-balance">
        <span>Available in wallet</span>
        <strong>{fmt.format(balance)}</strong>
      </div>
      {error && <div className="auth-alert auth-alert--err">{error}</div>}
      {done && <div className="auth-alert auth-alert--ok">Withdrawal request submitted. Our team will process it shortly.</div>}
      {balance <= 0 ? (
        <div className="auth-alert auth-alert--info">You don't have any withdrawable wallet balance yet.</div>
      ) : (
        <form onSubmit={submit} className="dep-form">
          <label className="field">
            <span className="field__label">Method</span>
            <div className="field__box">
              <select className="field__input" value={method} onChange={(e) => setMethod(e.target.value)}>
                {ALL_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </label>
          <label className="field">
            <span className="field__label">Amount (USD)</span>
            <div className="field__box">
              <input
                className="field__input"
                type="number"
                min="1"
                max={balance}
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </label>
          <label className="field">
            <span className="field__label">Destination wallet / IBAN</span>
            <div className="field__box">
              <input className="field__input" placeholder="Address or account" value={dest} onChange={(e) => setDest(e.target.value)} required />
            </div>
          </label>
          <button type="submit" className="auth-btn" disabled={busy}>
            {busy ? 'Submitting…' : 'Request withdrawal'}
          </button>
        </form>
      )}
    </Panel>
  )
}

function FundsHistory({ data, fmt }) {
  const txs = data.transactions || []
  return (
    <Panel title="Transaction History">
      {txs.length === 0 ? (
        <Empty icon="≣" title="No transactions yet" hint="Your deposits, withdrawals and account activity will be listed here." />
      ) : (
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Method</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {txs.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.createdAt).toLocaleString()}</td>
                <td className="td-cap">{t.type.replace('_', ' ')}</td>
                <td className="td-cap">{t.method || '—'}</td>
                <td>{fmt.format(t.amount)}</td>
                <td><StatusBadge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  )
}
