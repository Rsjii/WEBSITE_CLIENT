import { Panel, Empty } from '../ui'

export default function Transactions() {
  const txs = []

  return (
    <div className="grid-stack">
      <Panel title="Transaction History">
        {txs.length === 0 ? (
          <Empty icon="≣" title="No transactions yet" hint="Your deposits, withdrawals and trades will be listed here." />
        ) : (
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {txs.map((t, i) => (
                <tr key={i}>
                  <td>{t.date}</td><td>{t.type}</td><td>{t.amount}</td><td>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}
