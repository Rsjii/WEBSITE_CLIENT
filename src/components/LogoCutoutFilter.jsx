// Cuts the flat dark-navy square out of /logo.png, keeping only the bright
// emblem + its own glow — see index.css rules that reference #logo-cutout.
export default function LogoCutoutFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="logo-cutout" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="lum" />
          <feComponentTransfer in="lum" result="keyMask">
            <feFuncA type="linear" slope="4" intercept="-0.2" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="keyMask" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}
