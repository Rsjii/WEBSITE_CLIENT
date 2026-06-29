import { Panel } from '../ui'

const MARKETS = [
  { pair: 'EUR/USD', price: '1.08420', chg: '+0.12%', up: true },
  { pair: 'BTC/USD', price: '67,420.00', chg: '+2.34%', up: true },
  { pair: 'XAU/USD', price: '2,345.20', chg: '+0.45%', up: true },
  { pair: 'GBP/USD', price: '1.26548', chg: '-0.08%', up: false },
  { pair: 'S&P 500', price: '5,234.00', chg: '+0.78%', up: true },
  { pair: 'ETH/USD', price: '3,280.00', chg: '+1.15%', up: true },
  { pair: 'USD/JPY', price: '154.820', chg: '+0.31%', up: true },
  { pair: 'CRUDE OIL', price: '82.40', chg: '-0.22%', up: false },
]

export default function Markets() {
  return (
    <div className="grid-stack">
      <Panel title="Live Markets">
        <table className="table table--markets">
          <thead>
            <tr><th>Instrument</th><th>Price</th><th>24h</th></tr>
          </thead>
          <tbody>
            {MARKETS.map((m) => (
              <tr key={m.pair}>
                <td className="td-pair">{m.pair}</td>
                <td className="td-num">{m.price}</td>
                <td className={m.up ? 'td-up' : 'td-dn'}>{m.up ? '▲' : '▼'} {m.chg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
