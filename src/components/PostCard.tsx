'use client'

import { useState } from 'react'
import { markAsPostedAction, saveResultAction, extractMetricsAction, improvePostIdeaAction, applyImprovedPostIdea, updateScheduledDateAction } from '@/lib/actions'
import { generateICSFile } from '@/lib/ics'

interface PostResult { views: number; likes: number; comments: number; saves: number }
interface ImprovedPost { improvedTitle: string; improvedScript: string; improvedCaption: string; improvedHashtags: string }
interface Post {
  id: string; title: string; script: string; caption: string; hashtags: string
  posted: boolean; isUserCreated: boolean
  recommendedPublishDate: string | null; scheduledPublishDate: string | null
  result: PostResult | null
}

export default function PostCard({ post, index }: { post: Post; index: number }) {
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
      if (metrics.confidence === 'low') setExtractError('Not all metrics recognized — please verify')
    } catch {
      setExtractError('Could not recognize — enter manually')
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

  return (
    <div className="card animate-fade-up" style={{ padding: 16, animationDelay: `${index * 40}ms`, opacity: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{index + 1}</span>
          {post.isUserCreated && <span className="badge badge-default">Mine</span>}
          {localPosted ? <span className="badge badge-green">Published</span> : <span className="badge badge-default">Draft</span>}
          {localResult && <span className="badge badge-primary">Has data</span>}
        </div>
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>{localTitle}</p>

      {/* Metrics */}
      {localResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 10, borderRadius: 8, background: '#F9FAFB', border: '1px solid var(--border-color)', marginBottom: 10 }}>
          {[
            { label: 'Views', value: localResult.views },
            { label: 'Likes', value: localResult.likes },
            { label: 'Comments', value: localResult.comments },
            { label: 'Saves', value: localResult.saves },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{m.value.toLocaleString()}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Date row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        {post.recommendedPublishDate && !scheduledDate && (
          <span style={{ fontSize: 11, color: '#3F3F3F' }}>
            ✦ AI: {new Date(post.recommendedPublishDate).toLocaleDateString('en-US')}
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date:</span>
          <input type="date" value={scheduledDate} onChange={handleDateChange} className="input" style={{ height: 28, fontSize: 11, padding: '0 8px', width: 'auto' }} />
        </div>
        {publishDate && (
          <button onClick={handleDownloadICS} style={{ fontSize: 11, color: '#3F3F3F', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            📅 Save to calendar
          </button>
        )}
      </div>

      {/* Expand toggle */}
      <button onClick={() => setExpanded(!expanded)} className="btn-ghost" style={{ height: 26, fontSize: 11, padding: '0 6px', marginBottom: 8, color: 'var(--text-muted)' }}>
        {expanded ? '▲ Hide' : '▼ Script & caption'}
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }} className="animate-fade-up">
          {[{ label: 'Script', content: localScript }, { label: 'Caption', content: localCaption }].map(s => (
            <div key={s.label}>
              <p className="section-label" style={{ marginBottom: 6 }}>{s.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, padding: '8px 10px', borderRadius: 6, background: '#F9FAFB', border: '1px solid var(--border-color)' }}>{s.content}</p>
            </div>
          ))}
          <div>
            <p className="section-label" style={{ marginBottom: 6 }}>Hashtags</p>
            <p style={{ fontSize: 12, color: '#3F3F3F' }}>{localHashtags}</p>
          </div>
        </div>
      )}

      {/* AI improve result */}
      {improveResult && (
        <div className="ai-block animate-fade-up" style={{ padding: 12, marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#1A1A1A', marginBottom: 8 }}>AI improved this post:</p>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{improveResult.improvedTitle}</p>
          <p style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.5, marginBottom: 4 }}>{improveResult.improvedCaption}</p>
          <p style={{ fontSize: 11, color: '#3F3F3F', marginBottom: 8 }}>{improveResult.improvedHashtags}</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleApplyImproved} className="btn-primary" style={{ height: 28, fontSize: 11 }}>Apply</button>
            <button onClick={() => setImproveResult(null)} className="btn-secondary" style={{ height: 28, fontSize: 11 }}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="separator" style={{ margin: '10px 0' }} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {!localPosted && (
          <button onClick={handleMarkPosted} disabled={isPosting} className="btn-secondary" style={{ height: 28, fontSize: 11 }}>
            {isPosting ? 'Marking...' : '✓ Mark published'}
          </button>
        )}
        <button onClick={handleImprove} disabled={isImproving} className="btn-ghost" style={{ height: 28, fontSize: 11 }}>
          {isImproving ? 'Improving...' : '✦ Improve with AI'}
        </button>
        {localPosted && (
          <>
            <label className="btn-secondary" style={{ height: 28, fontSize: 11, cursor: 'pointer' }}>
              {isExtracting ? 'Reading...' : '📸 Screenshot'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleScreenshot} disabled={isExtracting} />
            </label>
            <button onClick={() => setShowResultForm(!showResultForm)} className="btn-secondary" style={{ height: 28, fontSize: 11 }}>
              {localResult ? 'Edit metrics' : '+ Metrics'}
            </button>
          </>
        )}
      </div>

      {extractError && <p style={{ fontSize: 11, color: 'var(--amber)', marginTop: 6 }}>{extractError}</p>}

      {/* Results form */}
      {showResultForm && (
        <form onSubmit={handleSaveResult} className="animate-fade-up" style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#F9FAFB', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--text)' }}>
            Metrics {extractedMetrics ? '(detected by AI)' : ''}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[{ name: 'views', label: 'Views' }, { name: 'likes', label: 'Likes' }, { name: 'comments', label: 'Comments' }, { name: 'saves', label: 'Saves' }].map(f => (
              <div key={f.name}>
                <label className="section-label" style={{ display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input type="number" name={f.name} min="0"
                  defaultValue={extractedMetrics?.[f.name as keyof PostResult] ?? localResult?.[f.name as keyof PostResult] ?? 0}
                  className="input" style={{ height: 32, fontSize: 12 }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button type="submit" disabled={isSaving} className="btn-primary" style={{ height: 30, fontSize: 11 }}>{isSaving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setShowResultForm(false)} className="btn-secondary" style={{ height: 30, fontSize: 11 }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
