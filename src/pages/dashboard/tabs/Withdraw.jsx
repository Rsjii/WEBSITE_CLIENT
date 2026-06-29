import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { Panel } from '../ui'

export default function Withdraw() {
  const { user } = useAuth()
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.currency || 'USD' })
  const balance = user?.balance ?? 0
  const [amount, setAmount] = useState('')
  const [dest, setDest] = useState('')

  const submit = (e) => {
    e.preventDefault()
  }

  return (
    <div className="grid-stack">
      <Panel title="Withdraw Funds">
        <div className="withdraw-balance">
          <span>Available to withdraw</span>
          <strong>{fmt.format(balance)}</strong>
        </div>
        {balance <= 0 ? (
          <div className="auth-alert auth-alert--info">
            You don’t have any withdrawable balance yet. Deposit and grow your portfolio first.
          </div>
        ) : (
          <form onSubmit={submit} className="dep-form">
            <label className="field">
              <span className="field__label">Amount (USD)</span>
              <div className="field__box">
                <input className="field__input" type="number" min="1" max={balance} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
            </label>
            <label className="field">
              <span className="field__label">Destination wallet / IBAN</span>
              <div className="field__box">
                <input className="field__input" placeholder="Address or account" value={dest} onChange={(e) => setDest(e.target.value)} required />
              </div>
            </label>
            <button type="submit" className="auth-btn">Request withdrawal</button>
          </form>
        )}
      </Panel>
    </div>
  )
}
