import { Router } from 'express'

const router = Router()

// Public, no-key CoinGecko endpoint. `sparkline=true` gives a real 7-day
// hourly price series per coin — we keep just the last 24 points (last 24h)
// so the chart is real history, not a simulated random walk.
// Cached server-side so N browser tabs never turn into N upstream calls.
const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&sparkline=true&price_change_percentage=24h'
const CACHE_TTL_MS = 60_000
let cache = { data: null, ts: 0 }

const SYMBOLS = { bitcoin: 'BTC/USD', ethereum: 'ETH/USD' }

router.get('/crypto', async (req, res) => {
  const now = Date.now()
  if (cache.data && now - cache.ts < CACHE_TTL_MS) return res.json(cache.data)

  try {
    const r = await fetch(COINGECKO_URL)
    if (!r.ok) throw new Error(`CoinGecko responded ${r.status}`)
    const coins = await r.json()

    const data = coins.map((c) => {
      const hourly = c.sparkline_in_7d?.price || []
      return {
        symbol: SYMBOLS[c.id] || `${c.symbol?.toUpperCase()}/USD`,
        price: c.current_price,
        change24h: c.price_change_percentage_24h,
        sparkline: hourly.length > 24 ? hourly.slice(-24) : hourly,
      }
    })
    cache = { data, ts: now }
    res.json(data)
  } catch (err) {
    // Upstream hiccup — serve the last good snapshot instead of breaking the page.
    if (cache.data) return res.json(cache.data)
    res.status(502).json({ error: 'Could not fetch live crypto prices right now.' })
  }
})

export default router
