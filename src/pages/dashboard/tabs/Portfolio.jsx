import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Panel, StatCard, Empty, Badge } from '../ui'
import { api } from '../../../lib/api'

export default function Portfolio() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .walletOverview()
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="grid-stack">
        <Panel><Empty icon="!" title="Couldn't load your portfolio" hint={error} /></Panel>
      </div>
    )
  }
  if (!data) return null

  const accounts = data.accounts || []
  const totals = accounts.reduce(
    (acc, a) => ({
      trades: acc.trades + a.trades,
      wins: acc.wins + a.wins,
      losses: acc.losses + a.losses,
      profit: acc.profit + a.profit,
    }),
    { trades: 0, wins: 0, losses: 0, profit: 0 },
  )
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency || 'USD' })

  return (
    <div className="grid-stack">
      <div className="stat-grid">
        <StatCard label="Total Trades" value={totals.trades} sub={`${accounts.length} account${accounts.length === 1 ? '' : 's'}`} />
        <StatCard label="Wins" value={totals.wins} accent="#6fcf97" trend="up" />
        <StatCard label="Losses" value={totals.losses} accent="#ff6b74" trend={totals.losses ? 'down' : undefined} />
        <StatCard
          label="Total P&L"
          value={`${totals.profit >= 0 ? '+' : ''}${fmt.format(totals.profit)}`}
          trend={totals.profit >= 0 ? 'up' : 'down'}
        />
      </div>

      <Panel title="Accounts" action={<Badge tone="muted">{accounts.length} total</Badge>}>
        {accounts.length === 0 ? (
          <Empty
            icon="▤"
            title="No trading accounts yet"
            hint={
              <>
                Open your first account from the <Link to="/dashboard/funds">Funds</Link> tab to start trading.
              </>
            }
          />
        ) : (
          <table className="table">
            <thead>
              <tr><th>Account</th><th>Status</th><th>Balance</th><th>Trades</th><th>W/L</th><th>P&L</th></tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td>{a.label}</td>
                  <td><Badge tone={a.status === 'active' ? 'green' : 'muted'}>{a.status}</Badge></td>
                  <td>{fmt.format(a.balance)}</td>
                  <td>{a.trades}</td>
                  <td>{a.wins}/{a.losses}</td>
                  <td className={a.profit >= 0 ? 'td-up' : 'td-dn'}>{a.profit >= 0 ? '+' : ''}{fmt.format(a.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}
