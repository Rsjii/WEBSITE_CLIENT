import { useEffect, useRef, useState } from 'react'

// Deterministic seeded PRNG — same symbol always starts from the same shape.
function makeRng(seedStr) {
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i) * (i + 7)
  let s = seed || 1
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// One-shot pseudo-random walk (no market data feed wired up for this instrument).
export function generateSeries(symbol, points = 24, volatility = 0.012) {
  const rand = makeRng(symbol)
  const series = [1]
  for (let i = 1; i < points; i++) {
    const drift = (rand() - 0.48) * volatility
    series.push(series[i - 1] * (1 + drift))
  }
  return series
}

// Same random walk, but it keeps ticking forward on an interval — used where
// there's no real feed but the UI should still feel "live".
export function useLiveSeries(symbol, { points = 24, intervalMs = 2500, volatility = 0.01 } = {}) {
  const rngRef = useRef(null)
  if (!rngRef.current) rngRef.current = makeRng(`${symbol}-live`)
  const [series, setSeries] = useState(() => generateSeries(symbol, points, volatility))

  useEffect(() => {
    const id = setInterval(() => {
      setSeries((prev) => {
        const drift = (rngRef.current() - 0.48) * volatility
        const next = prev[prev.length - 1] * (1 + drift)
        return [...prev.slice(1), next]
      })
    }, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, volatility])

  const first = series[0]
  const last = series[series.length - 1]
  const change = first ? ((last - first) / first) * 100 : 0
  return { series, last, change, up: change >= 0 }
}

export default function MiniChart({ data, up = true, width = 220, height = 64 }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`)
  const line = `M${points.join(' L')}`
  const area = `${line} L${width},${height} L0,${height} Z`
  const color = up ? '#6fcf97' : '#ff6b74'
  const gid = `mc-${up ? 'u' : 'd'}-${width}x${height}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="mini-chart">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} stroke="none" style={{ transition: 'd 0.6s ease, fill 0.3s ease' }} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'd 0.6s ease, stroke 0.3s ease' }}
      />
    </svg>
  )
}
