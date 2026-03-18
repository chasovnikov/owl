'use client'

import { useState } from 'react'
import { analyzeHypothesisAction } from '@/lib/actions'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'

interface AnalysisResult { summary: string; engagementComparison: string; recommendation: string }

export default function AnalysisPanel({ hypothesisId }: { hypothesisId: string }) {
  const { lang } = useLang()
  const tr = translations[lang]
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    setLoading(true)
    setError('')
    try {
      const result = await analyzeHypothesisAction(hypothesisId)
      setAnalysis(result)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{tr.aiAnalysis}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tr.interpretResults}</p>
        </div>
        <button onClick={handleAnalyze} disabled={loading} className="btn-secondary" style={{ height: 32, fontSize: 12 }}>
          {loading ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, border: '1.5px solid #D1D5DB', borderTopColor: '#6B7280', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />{tr.analyzing}</span> : tr.analyze}
        </button>
      </div>

      {error && <div style={{ fontSize: 12, padding: '8px 12px', borderRadius: 6, background: 'var(--red-light)', color: 'var(--red)', marginBottom: 12 }}>{error}</div>}
      {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 44 }} />)}</div>}

      {analysis && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="animate-fade-up">
          {[
            { label: tr.summary, content: analysis.summary },
            { label: tr.engagement, content: analysis.engagementComparison },
            { label: tr.recommendation, content: analysis.recommendation },
          ].map(s => (
            <div key={s.label} style={{ padding: '10px 12px', borderRadius: 8, background: '#F9FAFB', border: '1px solid var(--border-color)' }}>
              <p className="section-label" style={{ marginBottom: 6 }}>{s.label}</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.content}</p>
            </div>
          ))}
        </div>
      )}

      {!analysis && !loading && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
          {tr.clickAnalyze}
        </p>
      )}
    </div>
  )
}
