import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import Scene from '../components/Scene'
import LoadingScreen from '../components/LoadingScreen'
import { initScroll } from '../utils/scroll'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ── Data ──────────────────────────────────────────────────────────────

const TICKERS = [
  { pair: 'EUR/USD',   price: '1.08420', change: '+0.12%', up: true  },
  { pair: 'GBP/USD',   price: '1.26548', change: '-0.08%', up: false },
  { pair: 'BTC/USD',   price: '67,420',  change: '+2.34%', up: true  },
  { pair: 'XAU/USD',   price: '2,345.2', change: '+0.45%', up: true  },
  { pair: 'S&P 500',   price: '5,234',   change: '+0.78%', up: true  },
  { pair: 'CRUDE OIL', price: '82.40',   change: '-0.22%', up: false },
  { pair: 'USD/JPY',   price: '154.820', change: '+0.31%', up: true  },
  { pair: 'ETH/USD',   price: '3,280',   change: '+1.15%', up: true  },
  { pair: 'USD/CAD',   price: '1.36450', change: '-0.05%', up: false },
  { pair: 'XAG/USD',   price: '29.845',  change: '+0.88%', up: true  },
  { pair: 'XRP/USD',   price: '0.5248',  change: '+3.21%', up: true  },
  { pair: 'NASDAQ',    price: '18,234',  change: '+1.02%', up: true  },
]

const ACCOUNTS = [
  {
    name: 'AURA',
    badge: null,
    min: '$100',
    leverage: '1:2000',
    spread: 'From 0.1 pips',
    commission: 'Zero commission',
    accent: '#C9A84C',
    features: [
      'WebTrader — all devices, zero download',
      '200+ instruments: Forex, Crypto, Stocks, Indices',
      'Institutional-grade execution',
      '24/7 multilingual premium support',
      'Segregated tier-1 bank accounts',
      'Islamic / Swap-Free available',
      'Instant crypto deposit (USDT, BTC, ETH)',
    ],
  },
]

const DEPOSITS = [
  { name: 'USDT',       network: 'TRC-20 / BEP-20',  icon: '₮', time: '~1 Hour',   fee: 'No fee' },
  { name: 'USDC',       network: 'ERC-20 / Polygon',  icon: 'U', time: '~1 Hour',   fee: 'No fee' },
  { name: 'Bitcoin',    network: 'BTC Network',        icon: '₿', time: '2–3 Hours', fee: 'No fee' },
  { name: 'Ethereum',   network: 'ERC-20',             icon: 'Ξ', time: '~1 Hour',   fee: 'No fee' },
  { name: 'Bank Wire',  network: 'SWIFT / SEPA',       icon: '⬚', time: '1–3 Days',  fee: 'No fee' },
  { name: 'Local Bank', network: 'Regional Transfer',  icon: '▣', time: 'Same Day',  fee: 'No fee' },
]

const WHY = [
  { icon: '🏛', title: 'Institutional Execution',  desc: 'Direct market access with institutional-grade infrastructure. No requotes, no manipulation on any pair.' },
  { icon: '🔒', title: 'Segregated Funds',         desc: 'Your capital held in segregated tier-1 bank accounts. Always protected, always accessible.' },
  { icon: '👑', title: 'Premium Support',          desc: 'Dedicated relationship managers for serious traders. White-glove multilingual service, 24/7.' },
  { icon: '🌍', title: '24/7 Global Access',       desc: 'Elite support team available around the clock via live chat, email and direct phone line.' },
  { icon: '💎', title: 'Instant Crypto Funding',   desc: 'Fund your account in seconds via USDT, USDC, BTC, ETH across multiple networks. Zero fees.' },
  { icon: '📊', title: 'Advanced Analytics',       desc: 'Premium market analysis, economic calendar, real-time signals and institutional charting tools.' },
]

// ── Components ─────────────────────────────────────────────────────────

function AccountCard({ a }) {
  return (
    <div className={`acc-card${a.badge === 'MOST POPULAR' ? ' acc-popular' : ''}`} style={{ '--ac': a.accent }}>
      {a.badge && <div className="acc-badge">{a.badge}</div>}
      <div className="acc-name">{a.name}</div>
      <div className="acc-min-wrap">
        <span className="acc-min-val">{a.min}</span>
        <span className="acc-min-lbl">min deposit</span>
      </div>
      <div className="acc-divider" />
      <ul className="acc-specs">
        <li><span>Leverage</span><strong>{a.leverage}</strong></li>
        <li><span>Spread</span><strong>{a.spread}</strong></li>
        <li><span>Commission</span><strong>{a.commission}</strong></li>
      </ul>
      <ul className="acc-feats">
        {a.features.map((f, i) => (
          <li key={i}><span className="feat-dot" />{f}</li>
        ))}
      </ul>
      <Link to="/signup" className="acc-cta">Open Account</Link>
    </div>
  )
}

// ── Landing ──────────────────────────────────────────────────────────────

export default function Landing() {
  const ringRef  = useRef()
  const dotRef   = useRef()
  const mouseRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const lenis = initScroll()

    const onMove = (e) => {
      mouseRef.current.x = e.clientX / window.innerWidth
      mouseRef.current.y = e.clientY / window.innerHeight
      gsap.to(ringRef.current, { x: e.clientX, y: e.clientY, duration: 0.55, ease: 'power2.out' })
      gsap.to(dotRef.current,  { x: e.clientX, y: e.clientY, duration: 0.08 })
    }
    window.addEventListener('mousemove', onMove)

    const targets = document.querySelectorAll('a, button, .acc-card, .why-card, .dep-method')
    targets.forEach(el => {
      el.addEventListener('mouseenter', () => gsap.to(ringRef.current, { scale: 2.2, opacity: 0.45, duration: 0.3 }))
      el.addEventListener('mouseleave', () => gsap.to(ringRef.current, { scale: 1,   opacity: 1,    duration: 0.3 }))
    })

    gsap.from('.glass-nav',    { y: -70, opacity: 0, duration: 1.1, ease: 'power3.out', delay: 0.2 })
    gsap.from('.hero-eyebrow', { y: 20,  opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.6 })
    gsap.from('.hero-h1',      { y: 40,  opacity: 0, duration: 1.0, ease: 'power3.out', delay: 0.8 })
    gsap.from('.hero-sub',     { y: 25,  opacity: 0, duration: 0.8, ease: 'power3.out', delay: 1.0 })
    gsap.from('.hero-ctas',    { y: 20,  opacity: 0, duration: 0.7, ease: 'power3.out', delay: 1.2 })
    gsap.from('.hero-stat',    { y: 20,  opacity: 0, duration: 0.6, ease: 'power3.out', delay: 1.4, stagger: 0.1 })
    gsap.from('.hero-visual',  { x: 80, opacity: 0, duration: 1.4, ease: 'power3.out', delay: 0.5 })

    ScrollTrigger.batch('.acc-card',   { onEnter: b => gsap.from(b, { x: 70, y: 50, opacity: 0, duration: 0.9,  ease: 'power3.out', stagger: 0.12 }), once: true })
    ScrollTrigger.batch('.why-card',   { onEnter: b => gsap.from(b, { y: 40, opacity: 0, duration: 0.78, ease: 'power3.out', stagger: 0.1  }), once: true })
    ScrollTrigger.batch('.dep-method', { onEnter: b => gsap.from(b, { y: 30, opacity: 0, duration: 0.65, ease: 'power3.out', stagger: 0.07 }), once: true })
    ScrollTrigger.batch('.s-heading',  { onEnter: b => gsap.from(b, { y: 28, opacity: 0, duration: 0.85, ease: 'power3.out' }), once: true })

    const TILT = ['.acc-card', '.why-card', '.dep-method']
    TILT.forEach(sel => {
      document.querySelectorAll(sel).forEach(card => {
        card.addEventListener('mousemove', e => {
          const rc = card.getBoundingClientRect()
          const cx = e.clientX - rc.left  - rc.width  / 2
          const cy = e.clientY - rc.top   - rc.height / 2
          const rx = -(cy / rc.height) * 12
          const ry =  (cx / rc.width)  * 12
          card.style.transform  = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px) scale(1.02)`
          card.style.transition = 'transform 0.08s linear'
        })
        card.addEventListener('mouseleave', () => {
          card.style.transform  = ''
          card.style.transition = 'transform 0.55s ease'
        })
      })
    })

    return () => {
      window.removeEventListener('mousemove', onMove)
      lenis.destroy()
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return (
    <>
      <LoadingScreen />

      {/* Cursor */}
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef}  className="cursor-dot"  />

      {/* Ambient particle canvas — fixed bg */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      >
        <Scene mouseRef={mouseRef} />
      </Canvas>

      {/* ── NAV ─────────────────────────────────────── */}
      <nav className="glass-nav">
        <Link className="nav-logo" to="/">AuraTrade</Link>
        <ul className="nav-links">
          <li><a href="#accounts">Accounts</a></li>
          <li><a href="#why">Why Us</a></li>
          <li><a href="#deposits">Funding</a></li>
        </ul>
        <div className="nav-actions">
          <Link to="/login"  className="nav-login">Login</Link>
          <Link to="/signup" className="nav-open">Open Account</Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="hero-sec">
        <div className="hero-inner">
          <span className="hero-eyebrow">— Premium Trading Platform — Global Markets — Elite Execution</span>
          <h1 className="hero-h1">
            Where <span className="hero-h1-gold">Wealth</span><br />Moves.
          </h1>
          <p className="hero-sub">
            Access Forex, Crypto, Stocks, Indices &amp; Commodities<br />
            with institutional-grade execution built for serious traders.
          </p>
          <div className="hero-ctas">
            <Link to="/signup" className="btn-primary">Open Live Account</Link>
            <a href="#why"     className="btn-ghost">Why AuraTrade</a>
          </div>
          <div className="hero-stats-row">
            {[
              { v: '50,000+', l: 'Active Traders' },
              { v: '$2B+',    l: 'Daily Volume'   },
              { v: '200+',    l: 'Instruments'    },
              { v: '1:2000',  l: 'Max Leverage'   },
            ].map((s, i) => (
              <div key={i} className="hero-stat">
                <span className="hero-stat-v">{s.v}</span>
                <span className="hero-stat-l">{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bull visual */}
        <div className="hero-visual">
          <div className="hv-glow-orb" />
          <div className="hv-ray hv-ray-1" />
          <div className="hv-ray hv-ray-2" />
          <div className="hv-ray hv-ray-3" />
          <div className="hv-sparks">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className={`hv-spark hv-spark-${i + 1}`} />
            ))}
          </div>
          <img src="/main.png" alt="AuraTrade Bull" className="hero-bull-img" draggable={false} />
          <div className="hv-scan" />
          <div className="hv-bottom-fade" />
        </div>

        <div className="hero-scroll-cue">
          <div className="scroll-bar" /><span>Scroll</span>
        </div>
      </section>

      {/* ── LIVE TICKER ──────────────────────────────── */}
      <div className="ticker-wrap">
        <div className="ticker-live">LIVE</div>
        <div className="ticker-track">
          <div className="ticker-inner">
            {[...TICKERS, ...TICKERS].map((t, i) => (
              <div key={i} className="ticker-item">
                <span className="t-pair">{t.pair}</span>
                <span className="t-price">{t.price}</span>
                <span className={`t-chg ${t.up ? 'up' : 'dn'}`}>{t.up ? '▲' : '▼'} {t.change}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ACCOUNTS ─────────────────────────────────── */}
      <section id="accounts" className="sec accounts-sec">
        <div className="sec-inner">
          <span className="s-eyebrow">One Account. Everything Included.</span>
          <h2 className="s-heading">Start Trading from $100</h2>
          <p className="s-sub">No tiers. No hidden upgrades. One account unlocks every market, every instrument, zero commission.</p>
          <div className="acc-grid">
            {ACCOUNTS.map((a, i) => <AccountCard key={i} a={a} />)}
          </div>
        </div>
      </section>

      {/* ── WHY US ───────────────────────────────────── */}
      <section id="why" className="sec why-sec">
        <div className="sec-inner">
          <span className="s-eyebrow">Why AuraTrade</span>
          <h2 className="s-heading">The Premium Edge</h2>
          <div className="why-grid">
            {WHY.map((w, i) => (
              <div key={i} className="why-card">
                <div className="why-icon-wrap">
                  <span className="why-icon">{w.icon}</span>
                </div>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOSITS ─────────────────────────────────── */}
      <section id="deposits" className="sec deposits-sec">
        <div className="sec-inner">
          <span className="s-eyebrow">Funding</span>
          <h2 className="s-heading">Deposit &amp; Withdraw Instantly</h2>
          <p className="s-sub">Multiple crypto networks and bank options. Zero fees on all deposits.</p>
          <div className="dep-grid">
            {DEPOSITS.map((d, i) => (
              <div key={i} className="dep-method">
                <div className="dep-icon">{d.icon}</div>
                <div className="dep-name">{d.name}</div>
                <div className="dep-net">{d.network}</div>
                <div className="dep-meta">
                  <span className="dep-time">{d.time}</span>
                  <span className="dep-fee">{d.fee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="sec cta-sec">
        <div className="cta-inner">
          <div className="cta-glow" />
          <span className="s-eyebrow">Begin Your Journey</span>
          <h2 className="cta-h2">Elevate Your<br />Trading Today.</h2>
          <p className="cta-sub">Open your account now. Deposit instantly via crypto. Access every market on earth.</p>
          <div className="hero-ctas">
            <Link to="/signup" className="btn-primary">Open Live Account</Link>
            <Link to="/login"  className="btn-ghost">Sign In</Link>
          </div>
          <p className="cta-legal">By registering you confirm you are 18+ and accept our <Link to="/signup">Terms of Service</Link>.</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">AuraTrade</div>
            <p className="footer-tag">Elite Trading Platform</p>
            <p className="footer-risk">
              Risk Warning: Trading CFDs involves significant risk of loss and is not suitable for all investors.
              Leverage products can result in losses exceeding your initial deposit. Please ensure you fully understand the risks.
            </p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Trading</h4>
              <a href="#">Forex</a><a href="#">Cryptocurrencies</a>
              <a href="#">Stocks</a><a href="#">Commodities</a><a href="#">Indices</a>
            </div>
            <div className="footer-col">
              <h4>Accounts</h4>
              <a href="#">Standard</a><a href="#">ECN</a>
              <a href="#">Swap-Free</a><a href="#">Pro</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About Us</a><a href="#">Legal</a>
              <a href="#">Privacy Policy</a><a href="#">Contact</a><a href="#">Referral</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 AuraTrade. All rights reserved.</span>
          <span>Risk Warning: CFDs are complex instruments and come with a high risk of losing money.</span>
        </div>
      </footer>
    </>
  )
}
