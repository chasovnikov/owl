'use client'

import { useState } from 'react'
import Link from 'next/link'
import { generateHypothesesAction, saveHypothesesAction } from '@/lib/actions'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'

interface ExistingHypothesis {
  id: string
  title: string
  description: string
  postCount: number
  postedCount: number
  resultsCount: number
}

interface GeneratedHypothesis {
  title: string
  description: string
}

export default function HypothesisGenerator({ platformId, businessType, projectId, existingHypotheses }: {
  platformId: string
  businessType: string
  projectId: string
  existingHypotheses: ExistingHypothesis[]
}) {
  const { lang } = useLang()
  const tr = translations[lang]

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generated, setGenerated] = useState<GeneratedHypothesis[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setGenerated([])
    setSelected(new Set())
    try {
      const results = await generateHypothesesAction(platformId, businessType)
      setGenerated(results)
    } catch (e: any) {
      setError(e.message || tr.generationError)
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) { next.delete(idx) } else { if (next.size >= 3) return prev; next.add(idx) }
      return next
    })
  }

  async function handleSave() {
    if (selected.size === 0) return
    setSaving(true)
    try {
      const selectedItems = Array.from(selected).map((i) => generated[i])
      await saveHypothesesAction(platformId, selectedItems)
      setGenerated([])
      setSelected(new Set())
      window.location.reload()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {existingHypotheses.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-4" style={{fontFamily: 'var(--font-display)'}}>
            {tr.activeHypotheses}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingHypotheses.map((h) => (
              <Link key={h.id} href={`/hypothesis/${h.id}`} className="card p-5 block group">
                <div className="flex items-start justify-between mb-3">
                  <span className="badge badge-purple text-[10px]">{tr.hypothesisBadge}</span>
                  {h.resultsCount > 0 && <span className="badge badge-green text-[10px]">{tr.resultsBadge(h.resultsCount)}</span>}
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-fuchsia-300 transition-colors mb-2" style={{fontFamily: 'var(--font-display)'}}>
                  {h.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{h.description}</p>
                <div className="flex gap-3 text-xs text-gray-600">
                  <span>{tr.postsLabel(h.postCount)}</span>
                  <span>·</span>
                  <span>{tr.postedLabel(h.postedCount)}</span>
                </div>
                <div className="mt-3 text-xs text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors">
                  {tr.viewPlan}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-white" style={{fontFamily: 'var(--font-display)'}}>
              {tr.generateHypothesesTitle}
            </h2>
            <p className="text-xs text-gray-500 mt-1">{tr.aiWillSuggest}</p>
          </div>
          <button onClick={handleGenerate} disabled={loading} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {tr.generatingBtn}
              </span>
            ) : tr.generateIdeasBtn}
          </button>
        </div>

        {error && <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-4">{error}</div>}

        {loading && (
          <div className="space-y-3">
            {Array.from({length: 5}).map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)}
          </div>
        )}

        {generated.length > 0 && (
          <div className="space-y-3 animate-fade-up">
            <p className="text-xs text-gray-500 mb-2">{tr.selectedCount(selected.size)}</p>
            {generated.map((h, i) => {
              const isSelected = selected.has(i)
              return (
                <button key={i} onClick={() => toggleSelect(i)} className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected ? 'border-fuchsia-500/50 bg-fuchsia-500/8' : 'border-white/6 bg-white/2 hover:border-white/12'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${isSelected ? 'border-fuchsia-400 bg-fuchsia-400' : 'border-gray-600'}`}>
                      {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white" style={{fontFamily: 'var(--font-display)'}}>{h.title}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{h.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}

            {selected.size > 0 && (
              <div className="pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-sm disabled:opacity-60">
                  {saving ? tr.savingHypotheses : tr.saveHypotheses(selected.size)}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
