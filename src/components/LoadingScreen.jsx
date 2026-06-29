import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const [phase, setPhase] = useState('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 80)
    const t2 = setTimeout(() => setPhase('exit'),   2400)
    const t3 = setTimeout(() => setPhase('done'),   3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (phase === 'done') return null

  return (
    <div className={`loader-wrap loader-${phase}`} aria-hidden="true">
      <div className="loader-frame">
        <div className="loader-hline top" />
        <div className="loader-inner">
          <div className="loader-mark">
            <img src="/logo.png" alt="AuraTrade" className="loader-logo-img" />
          </div>
          <div className="loader-tagline">Elite Trading Platform</div>
        </div>
        <div className="loader-hline bottom" />
      </div>
      <div className="loader-progress" />
    </div>
  )
}
