/** FumiLogo — replaces the old OwlLogo. Exports FumiIcon, FumiLogo, and legacy OWLLogo alias. */

export function FumiIcon({ size = 22 }: { size?: number }) {
  const r = Math.round(size * 0.30)
  return (
    <div style={{
      width: size, height: size, borderRadius: r,
      background: 'linear-gradient(145deg, #5B6AF0 0%, #9B6BFF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(91,106,240,0.32)',
    }}>
      <svg
        width={size * 0.60}
        height={size * 0.60}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Feather body — leaf silhouette tilted ~30° */}
        <path
          d="M10 18 C7.2 14.5 5.5 10.8 6 7 C6.5 3.5 10 2 13 3.5 C15.8 5 15.5 9.5 13 13 L10 18 Z"
          fill="white"
          opacity="0.96"
        />
        {/* Quill spine */}
        <path
          d="M10 18 L12.5 5"
          stroke="rgba(91,106,240,0.45)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        {/* Upper barb */}
        <path
          d="M11.8 9.5 L14.8 8"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        {/* Lower barb */}
        <path
          d="M11 12.5 L14 11.5"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export function FumiLogo({ size = 22 }: { size?: number }) {
  const fontSize = size >= 26 ? 22 : size >= 22 ? 20 : 18
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{
        fontSize,
        fontWeight: 700,
        letterSpacing: '-0.04em',
        background: 'linear-gradient(135deg, #5B6AF0, #9B6BFF)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        Fumi
      </span>
    </div>
  )
}

/** @deprecated use FumiLogo */
export function OwlIcon(props: { size?: number }) { return <FumiIcon {...props} /> }
/** @deprecated use FumiLogo */
export function OWLLogo(props: { size?: number }) { return <FumiLogo {...props} /> }
