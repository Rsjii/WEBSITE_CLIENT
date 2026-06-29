import { useState } from 'react'
import { Panel, Badge } from '../ui'

const METHODS = [
  { id: 'usdt', name: 'USDT', net: 'TRC-20 / BEP-20', icon: '₮' },
  { id: 'btc', name: 'Bitcoin', net: 'BTC Network', icon: '₿' },
  { id: 'eth', name: 'Ethereum', net: 'ERC-20', icon: 'Ξ' },
  { id: 'wire', name: 'Bank Wire', net: 'SWIFT / SEPA', icon: '⬚' },
]

export default function Deposit() {
  const [method, setMethod] = useState('usdt')
  const [amount, setAmount] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (Number(amount) >= 100) setDone(true)
  }

  return (
    <div className="grid-stack">
      <Panel title="Deposit Funds" action={<Badge>Min $100</Badge>}>
        {done ? (
          <div className="auth-alert auth-alert--ok">
            Deposit request for <strong>${Number(amount).toLocaleString()}</strong> via{' '}
            {METHODS.find((m) => m.id === method)?.name} received. Your account manager will share funding
            details and confirm shortly.
          </div>
        ) : (
          <form onSubmit={submit} className="dep-form">
            <span className="field__label">Choose a method</span>
            <div className="dep-methods">
              {METHODS.map((m) => (
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

            <label className="field">
              <span className="field__label">Amount (USD)</span>
              <div className="field__box">
                <input
                  className="field__input"
                  type="number"
                  min="100"
                  step="any"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <span className="field__hint">Minimum first deposit is $100. Zero deposit fees.</span>
            </label>

            <button type="submit" className="auth-btn" disabled={Number(amount) < 100}>
              Continue to funding
            </button>
          </form>
        )}
      </Panel>
    </div>
  )
}
