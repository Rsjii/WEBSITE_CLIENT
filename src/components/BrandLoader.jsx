// Branded loading screen shown whenever a section/route is loading.
// `fullscreen` covers the viewport; otherwise it fills its container.
export default function BrandLoader({ fullscreen = false, label = 'Loading' }) {
  return (
    <div className={`brand-loader${fullscreen ? ' brand-loader--full' : ''}`} role="status" aria-live="polite">
      <div className="brand-loader__mark">
        <span className="brand-loader__ring" />
        <span className="brand-loader__diamond">◆</span>
      </div>
      <div className="brand-loader__logo">AURATRADE</div>
      <div className="brand-loader__bar"><span /></div>
      <span className="brand-loader__label">{label}</span>
    </div>
  )
}
