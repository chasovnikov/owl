'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createHypothesisAction, generateHypothesesAction, addHypothesisFromAI, improveHypothesisAction, applyImprovedHypothesis } from '@/lib/actions'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'

interface Hypothesis { id: string; title: string; description: string; postCount: number; postedCount: number; resultsCount: number }
interface ImprovedResult { improvedTitle: string; improvedDescription: string; variations: { title: string; description: string }[] }

function Spinner() {
  return (
    <span style={{
      width: 12, height: 12, border: '1.5px solid var(--border-md)', borderTopColor: 'var(--accent)',
      borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0,
    }} />
  )
}

export default function HypothesisBoard({ platformId, businessType, hypotheses: initial }: {
  platformId: string; businessType: string; hypotheses: Hypothesis[]
}) {
  const { lang } = useLang()
  const tr = translations[lang]

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.015em' }}>{tr.hypothesesHeader}</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary btn-sm">
          {tr.addHypothesis}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card anim-pop-in" style={{ padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text)', letterSpacing: '-0.01em' }}>{tr.newHypothesis}</p>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="text" name="title" placeholder={tr.hypothesisTitlePlaceholder} required className="inp" />
            <textarea name="description" placeholder={tr.hypothesisDescPlaceholder} rows={3} required className="inp" />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={creating} className="btn btn-primary btn-sm">
                {creating ? <><Spinner /> {tr.creating}</> : tr.create}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary btn-sm">{tr.cancel}</button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {hypotheses.length === 0 && !showCreate && (
        <div className="card" style={{ padding: 56, textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round">
              <path d="M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9"/>
            </svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{tr.noHypothesesYet}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.6 }}>{tr.noHypothesesDesc}</p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm">{tr.createFirstHypothesis}</button>
        </div>
      )}

      {/* Hypotheses grid */}
      {hypotheses.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16, marginBottom: 24 }}>
          {hypotheses.map((h, i) => {
            const pct = h.postCount > 0 ? h.postedCount / h.postCount : 0
            return (
              <div key={h.id} className={`card card-hover anim-slide-up d${Math.min(i, 8)}`} style={{ padding: 20, cursor: 'pointer' }}>
                {/* Badge row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className="badge badge-primary">{tr.hypothesisBadge}</span>
                  {h.resultsCount > 0 && <span className="badge badge-green">{tr.resultsBadge(h.resultsCount)}</span>}
                </div>

                {/* Title + description */}
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.01em', lineHeight: 1.4 }}>{h.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 14 }}>{h.description}</p>

                {/* Progress bar */}
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
                  {tr.postCountLabel(h.postCount, h.postedCount)}
                </div>
                <div className="hyp-bar-track" style={{ marginBottom: 14 }}>
                  <div
                    className="hyp-bar-fill"
                    style={{ '--w': `${pct * 100}%`, width: `${pct * 100}%` } as React.CSSProperties}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Link href={`/hypothesis/${h.id}`}>
                    <button className="btn btn-secondary btn-xs">{tr.open} →</button>
                  </Link>
                  <button
                    onClick={() => handleImprove(h.id)}
                    disabled={improvingId === h.id}
                    className="btn btn-ghost btn-xs"
                  >
                    {improvingId === h.id
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Spinner />{tr.improving}</span>
                      : <span>✦ {tr.improveWithAi}</span>}
                  </button>
                </div>

                {/* Improve result panel */}
                {improveResult?.id === h.id && (
                  <div className="ai-block anim-fade-in" style={{ marginTop: 14, padding: 14, borderRadius: 'var(--r-sm)' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tr.aiSuggestionsLabel}</p>
                    <div className="card" style={{ padding: 12, marginBottom: 10 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 5, color: 'var(--text)', letterSpacing: '-0.01em' }}>{improveResult.result.improvedTitle}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10 }}>{improveResult.result.improvedDescription}</p>
                      <button onClick={() => handleApply(h.id, improveResult.result.improvedTitle, improveResult.result.improvedDescription)} className="btn btn-primary btn-xs">{tr.apply}</button>
                    </div>
                    {improveResult.result.variations?.map((v, vi) => (
                      <div key={vi} className="card" style={{ padding: 12, marginBottom: 10 }}>
                        <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tr.variation(vi + 1)}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 5, color: 'var(--text)', letterSpacing: '-0.01em' }}>{v.title}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10 }}>{v.description}</p>
                        <button onClick={() => handleApply(h.id, v.title, v.description)} className="btn btn-secondary btn-xs">{tr.useThis}</button>
                      </div>
                    ))}
                    <button onClick={() => setImproveResult(null)} className="btn btn-ghost btn-xs">{tr.keepOriginal}</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* AI Suggestions card */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3, letterSpacing: '-0.01em' }}>{tr.aiSuggestionsTitle}</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{tr.ideasBasedOnStrategy}</p>
          </div>
          <button onClick={handleGenerateAI} disabled={loadingAI} className="btn btn-secondary btn-sm">
            {loadingAI
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Spinner />{tr.generating}</span>
              : tr.generateIdeas}
          </button>
        </div>

        {error && (
          <div style={{ fontSize: 12, padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'var(--red-light)', color: 'var(--red)', marginBottom: 12, border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </div>
        )}

        {loadingAI && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 56, borderRadius: 'var(--r-sm)' }} />)}
          </div>
        )}

        {aiIdeas.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aiIdeas.map((idea, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14,
                padding: '12px 14px', borderRadius: 'var(--r-sm)',
                background: 'var(--bg)', border: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.01em' }}>{idea.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{idea.description}</p>
                </div>
                <button
                  onClick={() => handleAddFromAI(idea, i)}
                  disabled={addingId === String(i)}
                  className="btn btn-secondary btn-xs"
                  style={{ flexShrink: 0 }}
                >
                  {addingId === String(i) ? <Spinner /> : '+ Add'}
                </button>
              </div>
            ))}
          </div>
        )}

        {aiIdeas.length === 0 && !loadingAI && (
          <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>
            {tr.clickGenerateIdeas}
          </p>
        )}
      </div>
    </div>
  )
}
