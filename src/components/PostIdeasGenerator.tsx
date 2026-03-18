'use client'

import { useState } from 'react'
import { generatePostIdeasAction } from '@/lib/actions'

export default function PostIdeasGenerator({ hypothesisId, regenerate = false }: { hypothesisId: string; regenerate?: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      await generatePostIdeasAction(hypothesisId)
      window.location.reload()
    } catch { setLoading(false) }
  }

  if (regenerate) {
    return (
      <button onClick={handleGenerate} disabled={loading} className="btn-secondary" style={{ height: 32, fontSize: 12 }}>
        {loading ? 'Regenerating...' : '↺ Regenerate'}
      </button>
    )
  }

  return (
    <div className="card" style={{ padding: 32, textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, margin: '0 auto 12px' }}>✦</div>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Generate content plan</h2>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>
        AI will create 5 post ideas with scripts, captions and hashtags
      </p>
      <button onClick={handleGenerate} disabled={loading} className="btn-primary">
        {loading ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Generating...</span> : 'Generate content plan'}
      </button>
    </div>
  )
}
