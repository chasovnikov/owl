'use client'

import { useState } from 'react'
import { markAsPostedAction, saveResultAction, extractMetricsAction, improvePostIdeaAction, applyImprovedPostIdea, updateScheduledDateAction } from '@/lib/actions'
import { generateICSFile } from '@/lib/ics'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'

interface PostResult { views: number; likes: number; comments: number; saves: number }
interface ImprovedPost { improvedTitle: string; improvedScript: string; improvedCaption: string; improvedHashtags: string }
interface Post {
  id: string; title: string; script: string; caption: string; hashtags: string
  posted: boolean; isUserCreated: boolean
  recommendedPublishDate: string | null; scheduledPublishDate: string | null
  result: PostResult | null
}

function Spinner({ size = 12 }: { size?: number }) {
  return (
    <span style={{
      width: size, height: size,
      border: `1.5px solid var(--border-md)`, borderTopColor: 'var(--accent)',
      borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0,
    }} />
  )
}

export default function PostCard({ post, index }: { post: Post; index: number }) {
  const { lang } = useLang()
  const tr = translations[lang]

  const [expanded, setExpanded] = useState(false)
  const [showResultForm, setShowResultForm] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [localPosted, setLocalPosted] = useState(post.posted)
  const [localResult, setLocalResult] = useState<PostResult | null>(post.result)
  const [localTitle, setLocalTitle] = useState(post.title)
  const [localScript, setLocalScript] = useState(post.script)
  const [localCaption, setLocalCaption] = useState(post.caption)
  const [localHashtags, setLocalHashtags] = useState(post.hashtags)
  const [scheduledDate, setScheduledDate] = useState(post.scheduledPublishDate?.split('T')[0] || '')
  const [improveResult, setImproveResult] = useState<ImprovedPost | null>(null)
  const [extractedMetrics, setExtractedMetrics] = useState<PostResult | null>(null)
  const [extractError, setExtractError] = useState('')

  const publishDate = scheduledDate || post.recommendedPublishDate?.split('T')[0] || null

  async function handleMarkPosted() {
    setIsPosting(true)
    await markAsPostedAction(post.id)
    setLocalPosted(true)
    setIsPosting(false)
  }

  async function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setScheduledDate(val)
    await updateScheduledDateAction(post.id, val)
  }

  async function handleImprove() {
    setIsImproving(true)
    setImproveResult(null)
    try {
      const result = await improvePostIdeaAction(post.id)
      setImproveResult(result)
    } finally { setIsImproving(false) }
  }

  async function handleApplyImproved() {
    if (!improveResult) return
    await applyImprovedPostIdea(post.id, improveResult.improvedTitle, improveResult.improvedScript, improveResult.improvedCaption, improveResult.improvedHashtags)
    setLocalTitle(improveResult.improvedTitle)
    setLocalScript(improveResult.improvedScript)
    setLocalCaption(improveResult.improvedCaption)
    setLocalHashtags(improveResult.improvedHashtags)
    setImproveResult(null)
  }

  async function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsExtracting(true)
    setExtractError('')
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.readAsDataURL(file)
      })
      const metrics = await extractMetricsAction(post.id, base64)
      setExtractedMetrics(metrics)
      setShowResultForm(true)
      if (metrics.confidence === 'low') setExtractError(tr.notAllMetrics)
    } catch {
      setExtractError(tr.couldNotRecognize)
      setShowResultForm(true)
    } finally { setIsExtracting(false) }
  }

  async function handleSaveResult(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSaving(true)
    const fd = new FormData(e.currentTarget)
    fd.set('postIdeaId', post.id)
    await saveResultAction(fd)
    setLocalResult({
      views: parseInt(fd.get('views') as string) || 0,
      likes: parseInt(fd.get('likes') as string) || 0,
      comments: parseInt(fd.get('comments') as string) || 0,
      saves: parseInt(fd.get('saves') as string) || 0,
    })
    setShowResultForm(false)
    setIsSaving(false)
  }

  function handleDownloadICS() {
    if (!publishDate) return
    const ics = generateICSFile({
      title: localTitle,
      description: `${localScript}\n\n${localCaption}\n\n${localHashtags}`,
      date: new Date(publishDate),
    })
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${localTitle.substring(0, 30).replace(/\s+/g, '-')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  const metricFields = [
    { name: 'views', label: tr.views },
    { name: 'likes', label: tr.likes },
    { name: 'comments', label: tr.comments },
    { name: 'saves', label: tr.saves },
  ]

  return (
    <div className={`card anim-slide-up d${Math.min(index, 8)}`} style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.04em' }}>#{index + 1}</span>
          {post.isUserCreated && <span className="badge badge-default">{tr.mine}</span>}
          {localPosted
            ? <span className="badge badge-green">{tr.published}</span>
            : <span className="badge badge-default">{tr.draft}</span>}
          {localResult && <span className="badge badge-primary">{tr.hasData}</span>}
        </div>
      </div>

      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14, lineHeight: 1.4, letterSpacing: '-0.01em' }}>{localTitle}</p>

      {/* Metrics grid */}
      {localResult && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
          padding: '12px 14px', borderRadius: 'var(--r-sm)',
          background: 'var(--bg)', border: '1px solid var(--border)',
          marginBottom: 14,
        }}>
          {[
            { label: tr.views, value: localResult.views },
            { label: tr.likes, value: localResult.likes },
            { label: tr.comments, value: localResult.comments },
            { label: tr.saves, value: localResult.saves },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{m.value.toLocaleString()}</p>
              <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Date row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        {post.recommendedPublishDate && !scheduledDate && (
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
            ✦ AI: {new Date(post.recommendedPublishDate).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{tr.dateLabel}</span>
          <input
            type="date"
            value={scheduledDate}
            onChange={handleDateChange}
            className="inp"
            style={{ height: 28, fontSize: 11, padding: '0 10px', width: 'auto', borderRadius: 'var(--r-xs)' }}
          />
        </div>
        {publishDate && (
          <button
            onClick={handleDownloadICS}
            className="btn btn-ghost btn-xs"
          >
            {tr.saveToCalendar}
          </button>
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="btn btn-ghost btn-xs"
        style={{ marginBottom: 10 }}
      >
        {expanded ? tr.hide : tr.scriptCaption}
      </button>

      {/* Expanded script/caption */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }} className="anim-fade-in">
          {[{ label: tr.script, content: localScript }, { label: tr.caption, content: localCaption }].map(s => (
            <div key={s.label}>
              <p className="section-label" style={{ marginBottom: 7 }}>{s.label}</p>
              <p style={{
                fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7,
                padding: '10px 12px', borderRadius: 'var(--r-sm)',
                background: 'var(--bg)', border: '1px solid var(--border)',
              }}>{s.content}</p>
            </div>
          ))}
          <div>
            <p className="section-label" style={{ marginBottom: 7 }}>{tr.hashtags}</p>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{localHashtags}</p>
          </div>
        </div>
      )}

      {/* AI improve result */}
      {improveResult && (
        <div className="ai-block anim-fade-in" style={{ padding: 14, marginBottom: 12, borderRadius: 'var(--r-sm)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 10, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{tr.aiImprovedPost}</p>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)', letterSpacing: '-0.01em' }}>{improveResult.improvedTitle}</p>
          <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 6 }}>{improveResult.improvedCaption}</p>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>{improveResult.improvedHashtags}</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleApplyImproved} className="btn btn-primary btn-xs">{tr.apply}</button>
            <button onClick={() => setImproveResult(null)} className="btn btn-secondary btn-xs">{tr.dismiss}</button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="separator" style={{ margin: '12px 0' }} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {!localPosted && (
          <button onClick={handleMarkPosted} disabled={isPosting} className="btn btn-secondary btn-xs">
            {isPosting ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Spinner size={10} />{tr.marking}</span> : tr.markPublished}
          </button>
        )}
        <button onClick={handleImprove} disabled={isImproving} className="btn btn-ghost btn-xs">
          {isImproving
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Spinner size={10} />{tr.improving}</span>
            : <span>✦ {tr.improveWithAi}</span>}
        </button>
        {localPosted && (
          <>
            <label className="btn btn-secondary btn-xs" style={{ cursor: 'pointer' }}>
              {isExtracting ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Spinner size={10} />{tr.reading}</span> : tr.screenshot}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleScreenshot} disabled={isExtracting} />
            </label>
            <button onClick={() => setShowResultForm(!showResultForm)} className="btn btn-secondary btn-xs">
              {localResult ? tr.editMetrics : tr.addMetrics}
            </button>
          </>
        )}
      </div>

      {extractError && <p style={{ fontSize: 11, color: 'var(--amber)', marginTop: 8 }}>{extractError}</p>}

      {/* Results form */}
      {showResultForm && (
        <form onSubmit={handleSaveResult} className="anim-fade-in" style={{
          marginTop: 14, padding: 14, borderRadius: 'var(--r-sm)',
          background: 'var(--bg)', border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>
            {tr.metricsTitle} {extractedMetrics ? `(${tr.detectedByAi})` : ''}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {metricFields.map(f => (
              <div key={f.name}>
                <label className="section-label" style={{ display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input
                  type="number"
                  name={f.name}
                  min="0"
                  defaultValue={extractedMetrics?.[f.name as keyof PostResult] ?? localResult?.[f.name as keyof PostResult] ?? 0}
                  className="inp"
                  style={{ height: 34, fontSize: 13 }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" disabled={isSaving} className="btn btn-primary btn-sm">
              {isSaving ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Spinner />{tr.saving}</span> : tr.save}
            </button>
            <button type="button" onClick={() => setShowResultForm(false)} className="btn btn-secondary btn-sm">{tr.cancel}</button>
          </div>
        </form>
      )}
    </div>
  )
}
