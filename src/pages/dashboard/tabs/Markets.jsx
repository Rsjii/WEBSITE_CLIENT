import { useEffect, useState } from 'react'
import { Panel, Badge } from '../ui'
import MiniChart, { useLiveSeries } from '../../../components/MiniChart'
import { api } from '../../../lib/api'

const COMMODITIES = [
  { symbol: 'XAU/USD', name: 'Gold', base: 2345.2 },
  { symbol: 'XAG/USD', name: 'Silver', base: 28.14 },
  { symbol: 'WTI/USD', name: 'Crude Oil (WTI)', base: 82.4 },
  { symbol: 'BRENT/USD', name: 'Brent Oil', base: 86.05 },
]

// No free real-time feed for forex/indices — kept simulated but live-ticking.
const SIMULATED_MARKETS = [
  { symbol: 'EUR/USD', base: 1.0842, digits: 5 },
  { symbol: 'GBP/USD', base: 1.26548, digits: 5 },
  { symbol: 'USD/JPY', base: 154.82, digits: 3 },
  { symbol: 'S&P 500', base: 5234.0, digits: 2 },
]

function LiveDot() {
  return <span className="live-dot" aria-hidden />
}

function CommodityCard({ item }) {
  const { series, change, up } = useLiveSeries(item.symbol, { intervalMs: 2500, volatility: 0.006 })
  const price = item.base * series[series.length - 1]
  return (
    <div className="commodity-card">
      <div className="commodity-card__head">
        <div className="commodity-card__name">
          <strong>{item.name}</strong>
          <span>{item.symbol}</span>
        </div>
        <span className={up ? 'td-up' : 'td-dn'}>{up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%</span>
      </div>
      <div className="commodity-card__price">{price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <MiniChart data={series} up={up} height={56} />
    </div>
  )
}

function SimulatedRow({ item }) {
  const { series, change, up } = useLiveSeries(item.symbol, { intervalMs: 3000, volatility: 0.003 })
  const price = item.base * series[series.length - 1]
  return (
    <tr>
      <td className="td-pair">{item.symbol}</td>
      <td className="td-num">{price.toFixed(item.digits)}</td>
      <td className={up ? 'td-up' : 'td-dn'}>{up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%</td>
    </tr>
  )
}

// Real price + real 24h sparkline history from CoinGecko — not a simulation.
function CryptoCard({ symbol, name, live }) {
  if (!live) {
    return (
      <div className="commodity-card">
        <div className="commodity-card__head">
          <div className="commodity-card__name"><strong>{name}</strong><span>{symbol}</span></div>
        </div>
        <div className="commodity-card__price">Loading…</div>
      </div>
    )
  }
  const { price, change24h: change, sparkline } = live
  const up = change >= 0
  return (
    <div className="commodity-card">
      <div className="commodity-card__head">
        <div className="commodity-card__name">
          <strong>{name}</strong>
          <span>{symbol}</span>
        </div>
        <span className={up ? 'td-up' : 'td-dn'}>{up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%</span>
      </div>
      <div className="commodity-card__price">{price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      {sparkline?.length > 1 && <MiniChart data={sparkline} up={up} height={56} />}
    </div>
  )
}

export default function Markets() {
  const [crypto, setCrypto] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = () => api.marketsCrypto().then((d) => !cancelled && setCrypto(d)).catch(() => {})
    load()
    const id = setInterval(load, 30000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const btc = crypto?.find((c) => c.symbol === 'BTC/USD')
  const eth = crypto?.find((c) => c.symbol === 'ETH/USD')

  return (
    <div className="grid-stack">
      <Panel title="Crypto" action={<Badge tone="muted"><LiveDot /> Live · Real</Badge>}>
        <div className="commodity-grid">
          <CryptoCard symbol="BTC/USD" name="Bitcoin" live={btc} />
          <CryptoCard symbol="ETH/USD" name="Ethereum" live={eth} />
        </div>
      </Panel>

      <Panel title="Commodities" action={<Badge tone="muted"><LiveDot /> Live</Badge>}>
        <div className="commodity-grid">
          {COMMODITIES.map((c) => (
            <CommodityCard key={c.symbol} item={c} />
          ))}
        </div>
      </Panel>

      <Panel title="Live Markets" action={<Badge tone="muted"><LiveDot /> Live</Badge>}>
        <table className="table table--markets">
          <thead>
            <tr><th>Instrument</th><th>Price</th><th>24h</th></tr>
          </thead>
          <tbody>
            {SIMULATED_MARKETS.map((m) => (
              <SimulatedRow key={m.symbol} item={m} />
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
