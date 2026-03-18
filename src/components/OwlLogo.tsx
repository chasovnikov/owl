export function OwlIcon({ size = 22 }: { size?: number }) {
  const r = Math.round(size * 0.27)
  return (
    <div style={{ width: size, height: size, borderRadius: r, background: '#18181B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 100 110" fill="none">
        {/* Ears */}
        <polygon points="28,28 18,8 36,24" fill="white"/>
        <polygon points="72,28 82,8 64,24" fill="white"/>
        {/* Head */}
        <ellipse cx="50" cy="36" rx="28" ry="26" fill="white"/>
        {/* Body */}
        <path d="M22 58 Q18 90 50 100 Q82 90 78 58 Q64 68 50 67 Q36 68 22 58Z" fill="white"/>
        {/* Wings */}
        <path d="M22 58 Q10 62 12 80 Q24 72 34 68" fill="white"/>
        <path d="M78 58 Q90 62 88 80 Q76 72 66 68" fill="white"/>
        {/* Feet */}
        <path d="M40 100 L36 108 M40 100 L40 109 M40 100 L44 108" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <path d="M60 100 L56 108 M60 100 L60 109 M60 100 L64 108" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

export function OWLLogo({ size = 22 }: { size?: number }) {
  const fontSize = size >= 26 ? 16 : size >= 22 ? 14 : 13
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <OwlIcon size={size} />
      <span style={{ fontSize, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>OWL</span>
    </div>
  )
}
