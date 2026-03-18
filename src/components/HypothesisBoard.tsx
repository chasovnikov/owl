'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createHypothesisAction, generateHypothesesAction, addHypothesisFromAI, improveHypothesisAction, applyImprovedHypothesis } from '@/lib/actions'

interface Hypothesis { id: string; title: string; description: string; postCount: number; postedCount: number; resultsCount: number }
interface ImprovedResult { improvedTitle: string; improvedDescription: string; variations: { title: string; description: string }[] }

export default function HypothesisBoard({ platformId, businessType, hypotheses: initial }: {
  platformId: string; businessType: string; hypotheses: Hypothesis[]
}) {
  const [hypotheses, setHypotheses] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [aiIdeas, setAiIdeas] = useState<{ title: string; description: string }[]>([])
  const [loadingAI, setLoadingAI] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [improvingId, setImprovingId] = useState<string | null>(null)
  const [improveResult, setImproveResult] = useState<{ id: string; result: ImprovedResult } | null>(null)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreating(true)
    const fd = new FormData(e.currentTarget)
    fd.set('platformId', platformId)
    const title = fd.get('title') as string
    const description = fd.get('description') as string
    await createHypothesisAction(fd)
    setHypotheses(prev => [{ id: Date.now().toString(), title, description, postCount: 0, postedCount: 0, resultsCount: 0 }, ...prev])
    setCreating(false)
    setShowCreate(false)
    ;(e.target as HTMLFormElement).reset()
  }

  async function handleGenerateAI() {
    setLoadingAI(true)
    setError('')
    try {
      const results = await generateHypothesesAction(platformId, businessType)
      setAiIdeas(results)
    } catch (e: any) { setError(e.message) }
    finally { setLoadingAI(false) }
  }

  async function handleAddFromAI(idea: { title: string; description: string }, idx: number) {
    setAddingId(String(idx))
    await addHypothesisFromAI(platformId, idea.title, idea.description)
    setHypotheses(prev => [{ id: Date.now().toString(), ...idea, postCount: 0, postedCount: 0, resultsCount: 0 }, ...prev])
    setAiIdeas(prev => prev.filter((_, i) => i !== idx))
    setAddingId(null)
  }

  async function handleImprove(id: string) {
    setImprovingId(id)
    setImproveResult(null)
    try {
      const result = await improveHypothesisAction(id)
      setImproveResult({ id, result })
    } catch (e: any) { setError(e.message) }
    finally { setImprovingId(null) }
  }

  async function handleApply(id: string, title: string, description: string) {
    await applyImprovedHypothesis(id, title, description)
    setHypotheses(prev => prev.map(h => h.id === id ? { ...h, title, description } : h))
    setImproveResult(null)
  }

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Hypotheses</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary" style={{ height: 32, fontSize: 12 }}>
          + Add hypothesis
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card animate-fade-up" style={{ padding: 16, marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>New hypothesis</p>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="text" name="title" placeholder="Hypothesis title" required className="input" />
            <textarea name="description" placeholder="What do you want to test and why should it work?" rows={3} required className="input" style={{ height: 'auto', padding: '8px 12px' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={creating} className="btn-primary" style={{ height: 32, fontSize: 12 }}>
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ height: 32, fontSize: 12 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Empty */}
      {hypotheses.length === 0 && !showCreate && (
        <div className="card" style={{ padding: 40, textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>No hypotheses yet</p>
          <button onClick={() => setShowCreate(true)} className="btn-secondary" style={{ height: 32, fontSize: 12 }}>+ Create first hypothesis</button>
        </div>
      )}

      {/* Hypotheses grid */}
      {hypotheses.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
          {hypotheses.map(h => (
            <div key={h.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="badge badge-primary">Hypothesis</span>
                {h.resultsCount > 0 && <span className="badge badge-green">{h.resultsCount} results</span>}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{h.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{h.description}</p>
              <div className="separator" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                {h.postCount} posts · {h.postedCount} published
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Link href={`/hypothesis/${h.id}`}>
                  <button className="btn-secondary" style={{ height: 28, fontSize: 11 }}>Open →</button>
                </Link>
                <button onClick={() => handleImprove(h.id)} disabled={improvingId === h.id} className="btn-ghost" style={{ height: 28, fontSize: 11 }}>
                  {improvingId === h.id
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, border: '1.5px solid #D1D5DB', borderTopColor: '#6B7280', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Improving...</span>
                    : '✦ Improve with AI'}
                </button>
              </div>

              {improveResult?.id === h.id && (
                <div className="ai-block animate-fade-up" style={{ marginTop: 12, padding: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#1A1A1A', marginBottom: 10 }}>AI suggestions:</p>
                  <div className="card" style={{ padding: 10, marginBottom: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{improveResult.result.improvedTitle}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{improveResult.result.improvedDescription}</p>
                    <button onClick={() => handleApply(h.id, improveResult.result.improvedTitle, improveResult.result.improvedDescription)} className="btn-primary" style={{ height: 26, fontSize: 11 }}>Apply</button>
                  </div>
                  {improveResult.result.variations?.map((v, i) => (
                    <div key={i} className="card" style={{ padding: 10, marginBottom: 8 }}>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Variation {i + 1}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{v.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{v.description}</p>
                      <button onClick={() => handleApply(h.id, v.title, v.description)} className="btn-secondary" style={{ height: 26, fontSize: 11 }}>Use this</button>
                    </div>
                  ))}
                  <button onClick={() => setImproveResult(null)} className="btn-ghost" style={{ height: 26, fontSize: 11 }}>Keep original</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Suggestions */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>AI suggestions</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ideas based on your strategy</p>
          </div>
          <button onClick={handleGenerateAI} disabled={loadingAI} className="btn-secondary" style={{ height: 32, fontSize: 12 }}>
            {loadingAI ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, border: '1.5px solid #D1D5DB', borderTopColor: '#6B7280', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Generating...</span> : 'Generate ideas'}
          </button>
        </div>

        {error && <div style={{ fontSize: 12, padding: '8px 12px', borderRadius: 6, background: 'var(--red-light)', color: 'var(--red)', marginBottom: 10 }}>{error}</div>}

        {loadingAI && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 52 }} />)}</div>}

        {aiIdeas.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {aiIdeas.map((idea, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 8, background: '#F9FAFB', border: '1px solid var(--border-color)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{idea.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{idea.description}</p>
                </div>
                <button onClick={() => handleAddFromAI(idea, i)} disabled={addingId === String(i)} className="btn-secondary" style={{ height: 28, fontSize: 11, flexShrink: 0 }}>
                  {addingId === String(i) ? '...' : '+ Add'}
                </button>
              </div>
            ))}
          </div>
        )}

        {aiIdeas.length === 0 && !loadingAI && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            Click "Generate ideas" to get AI suggestions
          </p>
        )}
      </div>
    </div>
  )
}
