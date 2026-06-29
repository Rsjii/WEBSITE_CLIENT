import { Panel, Empty, Badge } from '../ui'

export default function Portfolio() {
  // Placeholder — wired to real positions later.
  const positions = []

  return (
    <div className="grid-stack">
      <Panel title="Open Positions" action={<Badge tone="muted">Live</Badge>}>
        {positions.length === 0 ? (
          <Empty
            icon="▤"
            title="No open positions yet"
            hint="Once you deposit and your strategy activates, your managed positions appear here."
          />
        ) : (
          <table className="table">
            <thead>
              <tr><th>Instrument</th><th>Side</th><th>Size</th><th>Entry</th><th>P&L</th></tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <tr key={i}>
                  <td>{p.symbol}</td><td>{p.side}</td><td>{p.size}</td><td>{p.entry}</td><td>{p.pnl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}
