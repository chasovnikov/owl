'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  markAsPostedAction,
  saveResultAction,
  uploadPostMediaAction,
  deletePostMediaAction,
} from '@/lib/actions'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostMedia {
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  createdAt: string
}

interface PostResult {
  views: number
  likes: number
  comments: number
  saves: number
}

interface PostIdea {
  id: string
  title: string
  script: string
  caption: string
  hashtags: string
  posted: boolean
  recommendedPublishDate: string | null
  scheduledPublishDate: string | null
  result: PostResult | null
  mediaFiles: PostMedia[]
}

interface Hypothesis {
  id: string
  title: string
  description: string
  postIdeas: PostIdea[]
}

interface Platform {
  id: string
  hypotheses: Hypothesis[]
}

interface Project {
  id: string
  name: string
  businessType: string
  platforms: Platform[]
}

type ViewMode = 'week' | 'month' | 'quarter'

// ─── Constants ────────────────────────────────────────────────────────────────

const TREE_WIDTH = 248
const ROW_HEIGHT = 34
const HEADER_H = 46

const PROJECT_COLORS = [
  '#5B6AF0', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#EF4444', '#84CC16',
]

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function floorDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getPostDate(post: PostIdea): Date | null {
  const s = post.scheduledPublishDate ?? post.recommendedPublishDate
  return s ? new Date(s) : null
}

function dayWidth(mode: ViewMode): number {
  return mode === 'week' ? 54 : mode === 'month' ? 26 : 13
}

function daysCount(mode: ViewMode): number {
  return mode === 'week' ? 14 : mode === 'month' ? 35 : 91
}

function navStep(mode: ViewMode): number {
  return mode === 'week' ? 7 : mode === 'month' ? 14 : 30
}

function defaultViewStart(): Date {
  const d = floorDay(new Date())
  d.setDate(d.getDate() - 7)
  return d
}

// ─── PostDrawer ───────────────────────────────────────────────────────────────

interface DrawerProps {
  post: PostIdea
  projectColor: string
  hypothesisTitle: string
  onClose: () => void
}

function PostDrawer({ post, projectColor, hypothesisTitle, onClose }: DrawerProps) {
  const router = useRouter()
  const [scriptOpen, setScriptOpen] = useState(false)
  const [captionOpen, setCaptionOpen] = useState(false)
  const [localPosted, setLocalPosted] = useState(post.posted)
  const [localMedia, setLocalMedia] = useState<PostMedia[]>(post.mediaFiles)
  const [metrics, setMetrics] = useState({
    views: String(post.result?.views ?? ''),
    likes: String(post.result?.likes ?? ''),
    comments: String(post.result?.comments ?? ''),
    saves: String(post.result?.saves ?? ''),
  })
  const [saving, setSaving] = useState(false)
  const [metricsSaved, setMetricsSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const postDate = getPostDate(post)

  async function handleMarkPosted() {
    setSaving(true)
    try {
      await markAsPostedAction(post.id)
      setLocalPosted(true)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveMetrics() {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.set('postIdeaId', post.id)
      fd.set('views', metrics.views || '0')
      fd.set('likes', metrics.likes || '0')
      fd.set('comments', metrics.comments || '0')
      fd.set('saves', metrics.saves || '0')
      await saveResultAction(fd)
      setMetricsSaved(true)
      setTimeout(() => setMetricsSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.set('postIdeaId', post.id)
      fd.set('file', file)
      const result = await uploadPostMediaAction(fd)
      setLocalMedia(prev => [...prev, result as PostMedia])
    } catch (err: any) {
      setUploadError(err.message || 'Ошибка загрузки')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteMedia(mediaId: string) {
    if (!confirm('Удалить файл?')) return
    try {
      await deletePostMediaAction(mediaId)
      setLocalMedia(prev => prev.filter(m => m.id !== mediaId))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const colLabel: Record<string, string> = {
    views: 'Просмотры', likes: 'Лайки', comments: 'Комментарии', saves: 'Сохранения',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ flex: 1, background: 'rgba(0,0,0,0.25)' }}
      />

      {/* Panel */}
      <div style={{
        width: 420, height: '100vh', background: 'var(--surface)',
        borderLeft: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px 12px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: projectColor, flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hypothesisTitle}
                </span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, marginBottom: 4 }}>
                {post.title}
              </h3>
              {postDate && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {postDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingTop: 2 }}>
              {localPosted ? (
                <span className="badge badge-green" style={{ fontSize: 11 }}>✓ Опубликован</span>
              ) : (
                <button
                  onClick={handleMarkPosted}
                  disabled={saving}
                  className="btn-primary"
                  style={{ height: 30, fontSize: 12, padding: '0 12px' }}
                >
                  {saving ? '...' : 'Опубликован'}
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  width: 28, height: 28, border: '1px solid var(--border-color)',
                  borderRadius: 6, background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Script */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setScriptOpen(o => !o)}
              style={{
                width: '100%', padding: '9px 13px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, color: 'var(--text)',
              }}
            >
              <span>Сценарий</span>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
                style={{ transform: scriptOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', opacity: 0.5 }}>
                <path d="M4 2.5L8 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {scriptOpen && (
              <div style={{ padding: '0 13px 13px', borderTop: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap', paddingTop: 10 }}>
                  {post.script}
                </p>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setCaptionOpen(o => !o)}
              style={{
                width: '100%', padding: '9px 13px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, color: 'var(--text)',
              }}
            >
              <span>Caption</span>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
                style={{ transform: captionOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', opacity: 0.5 }}>
                <path d="M4 2.5L8 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {captionOpen && (
              <div style={{ padding: '0 13px 13px', borderTop: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap', paddingTop: 10 }}>
                  {post.caption}
                </p>
                {post.hashtags && (
                  <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8, lineHeight: 1.7 }}>
                    {post.hashtags}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Metrics */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Метрики
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['views', 'likes', 'comments', 'saves'] as const).map(key => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    {colLabel[key]}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    style={{ height: 32, fontSize: 13, padding: '0 10px' }}
                    value={metrics[key]}
                    onChange={e => setMetrics(m => ({ ...m, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSaveMetrics}
              disabled={saving}
              className="btn-secondary"
              style={{ marginTop: 10, height: 32, fontSize: 12 }}
            >
              {metricsSaved ? '✓ Сохранено' : 'Сохранить метрики'}
            </button>
          </div>

          {/* Media */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Медиафайлы
            </p>

            {localMedia.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {localMedia.map(m => (
                  <div
                    key={m.id}
                    style={{
                      position: 'relative', width: 72, height: 72,
                      borderRadius: 8, overflow: 'hidden',
                      border: '1px solid var(--border-color)',
                      background: '#F4F4F5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {m.mimeType.startsWith('image/') ? (
                      <img src={m.url} alt={m.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path d="M5 5h9l3 3v9H5V5z" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinejoin="round" />
                        <path d="M14 5v3h3" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinejoin="round" />
                      </svg>
                    )}
                    <button
                      onClick={() => handleDeleteMedia(m.id)}
                      style={{
                        position: 'absolute', top: 3, right: 3,
                        width: 18, height: 18, borderRadius: 4,
                        background: 'rgba(0,0,0,0.55)', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#fff',
                      }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadError && (
              <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{uploadError}</p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary"
              style={{ height: 32, fontSize: 12 }}
            >
              {uploading ? 'Загрузка...' : '+ Добавить файл'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ContentCalendar ──────────────────────────────────────────────────────────

export default function ContentCalendar({ projects }: { projects: Project[] }) {
  const today = floorDay(new Date())

  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [viewStart, setViewStart] = useState<Date>(defaultViewStart)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    () => new Set(projects.map(p => p.id))
  )
  const [expandedHypotheses, setExpandedHypotheses] = useState<Set<string>>(new Set())
  const [selectedPost, setSelectedPost] = useState<{
    post: PostIdea
    projectColor: string
    hypothesisTitle: string
  } | null>(null)

  const dw = dayWidth(viewMode)
  const dc = daysCount(viewMode)
  const totalW = dc * dw

  const viewEnd = addDays(viewStart, dc - 1)

  // Day offset helpers
  function dayOff(date: Date): number {
    const a = floorDay(date)
    const b = floorDay(viewStart)
    return Math.round((a.getTime() - b.getTime()) / 86400000)
  }

  function xOf(date: Date): number {
    return dayOff(date) * dw
  }

  // Navigation
  function prev() { setViewStart(d => addDays(d, -navStep(viewMode))) }
  function next() { setViewStart(d => addDays(d, navStep(viewMode))) }
  function goToday() { setViewStart(defaultViewStart()) }

  // Project color range
  function projectDateRange(p: Project): { min: Date; max: Date } | null {
    const dates: number[] = []
    for (const pl of p.platforms)
      for (const h of pl.hypotheses)
        for (const post of h.postIdeas) {
          const d = getPostDate(post)
          if (d) dates.push(d.getTime())
        }
    if (!dates.length) return null
    return { min: new Date(Math.min(...dates)), max: new Date(Math.max(...dates)) }
  }

  function hypothesisDateRange(h: Hypothesis): { min: Date; max: Date } | null {
    const dates = h.postIdeas.map(getPostDate).filter(Boolean) as Date[]
    if (!dates.length) return null
    const ts = dates.map(d => d.getTime())
    return { min: new Date(Math.min(...ts)), max: new Date(Math.max(...ts)) }
  }

  // Build header days array
  const headerDays: Date[] = Array.from({ length: dc }, (_, i) => addDays(viewStart, i))

  // Build month groups for top header row
  const monthGroups: { label: string; startIdx: number; count: number }[] = []
  headerDays.forEach((d, i) => {
    const label = d.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })
    const last = monthGroups[monthGroups.length - 1]
    if (last && last.label === label) last.count++
    else monthGroups.push({ label, startIdx: i, count: 1 })
  })

  const todayOff = dayOff(today)
  const showToday = todayOff >= 0 && todayOff < dc

  // Build flat rows
  type Row =
    | { kind: 'project'; project: Project; color: string }
    | { kind: 'hypothesis'; hyp: Hypothesis; project: Project; color: string }
    | { kind: 'post'; post: PostIdea; hyp: Hypothesis; project: Project; color: string }

  const rows: Row[] = []
  projects.forEach((project, idx) => {
    const color = PROJECT_COLORS[idx % PROJECT_COLORS.length]
    rows.push({ kind: 'project', project, color })
    if (!expandedProjects.has(project.id)) return
    const hypotheses = project.platforms[0]?.hypotheses ?? []
    hypotheses.forEach(hyp => {
      rows.push({ kind: 'hypothesis', hyp, project, color })
      if (!expandedHypotheses.has(hyp.id)) return
      hyp.postIdeas.forEach(post => {
        rows.push({ kind: 'post', post, hyp, project, color })
      })
    })
  })

  // ── Render helpers ──

  function renderGridLines() {
    return headerDays.map((_, i) => (
      <div key={i} style={{
        position: 'absolute', left: i * dw, top: 0, bottom: 0,
        width: 1, background: 'var(--border-color)', opacity: 0.45,
      }} />
    ))
  }

  function renderTodayLine() {
    if (!showToday) return null
    return (
      <div style={{
        position: 'absolute',
        left: todayOff * dw + Math.floor(dw / 2),
        top: 0, bottom: 0,
        width: 2, background: '#EF4444', opacity: 0.55,
        zIndex: 2, pointerEvents: 'none',
      }} />
    )
  }

  function renderBar(range: { min: Date; max: Date } | null, height: number, color: string, opacity: number) {
    if (!range) return null
    const left = xOf(range.min)
    const right = xOf(range.max) + dw
    const clampedLeft = Math.max(0, left)
    const clampedRight = Math.min(totalW, right)
    if (clampedRight <= clampedLeft) return null
    return (
      <div style={{
        position: 'absolute',
        left: clampedLeft, top: '50%',
        transform: 'translateY(-50%)',
        width: clampedRight - clampedLeft,
        height, borderRadius: height / 2,
        background: color, opacity,
        pointerEvents: 'none',
      }} />
    )
  }

  function renderPostMarker(post: PostIdea, color: string, onClick: () => void) {
    const d = getPostDate(post)
    if (!d) return null
    const x = xOf(d)
    if (x < 0 || x >= totalW) return null
    const posted = post.posted
    return (
      <button
        onClick={onClick}
        title={post.title}
        style={{
          position: 'absolute',
          left: x + Math.floor(dw / 2) - 8,
          top: '50%', transform: 'translateY(-50%)',
          width: 16, height: 16, borderRadius: '50%',
          background: posted ? 'var(--green)' : 'var(--surface)',
          border: `2px solid ${posted ? 'var(--green)' : color}`,
          cursor: 'pointer', zIndex: 3,
          transition: 'transform 0.1s',
          padding: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1.35)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1)' }}
      />
    )
  }

  const stickyCell: React.CSSProperties = {
    position: 'sticky', left: 0, zIndex: 5,
    borderRight: '1px solid var(--border-color)',
    width: TREE_WIDTH, flexShrink: 0,
    display: 'flex', alignItems: 'center',
    height: ROW_HEIGHT,
  }

  const chevron = (open: boolean) => (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
      style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0, opacity: 0.6 }}>
      <path d="M4 2.5L8 6L4 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  const rangeLabel = `${viewStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${viewEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Top bar ── */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border-color)',
        background: 'var(--surface)', display: 'flex', alignItems: 'center',
        gap: 12, flexShrink: 0,
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Календарь контента</h1>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{rangeLabel}</p>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <button onClick={prev} className="btn-secondary" style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={goToday} className="btn-secondary" style={{ height: 32, fontSize: 12 }}>
            Сегодня
          </button>
          <button onClick={next} className="btn-secondary" style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* View mode */}
        <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
          {(['week', 'month', 'quarter'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                height: 32, padding: '0 13px', fontSize: 12, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                background: viewMode === mode ? 'var(--accent-color)' : 'transparent',
                color: viewMode === mode ? '#fff' : 'var(--text-secondary)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {mode === 'week' ? 'Неделя' : mode === 'month' ? 'Месяц' : 'Квартал'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Gantt ── */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{ minWidth: TREE_WIDTH + totalW }}>

          {/* ── Sticky header ── */}
          <div style={{
            display: 'flex', position: 'sticky', top: 0, zIndex: 10,
            background: 'var(--surface)', borderBottom: '1px solid var(--border-color)',
            height: HEADER_H,
          }}>
            {/* Tree header cell */}
            <div style={{
              ...stickyCell,
              height: HEADER_H, zIndex: 11,
              background: 'var(--surface)',
              padding: '0 12px',
              display: 'flex', alignItems: 'flex-end', paddingBottom: 7,
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {projects.length} {projects.length === 1 ? 'проект' : 'проектов'}
              </span>
            </div>

            {/* Timeline header */}
            <div style={{ width: totalW, flexShrink: 0, position: 'relative', height: HEADER_H }}>
              {/* Month labels */}
              {monthGroups.map(g => (
                <div
                  key={g.label}
                  style={{
                    position: 'absolute',
                    left: g.startIdx * dw, top: 0,
                    width: g.count * dw, height: 20,
                    display: 'flex', alignItems: 'center', paddingLeft: 7,
                    fontSize: 10, color: 'var(--text-muted)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderLeft: g.startIdx > 0 ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  {g.label}
                </div>
              ))}

              {/* Day / week labels */}
              {viewMode !== 'quarter'
                ? headerDays.map((d, i) => {
                    const isToday = isSameDay(d, today)
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6
                    return (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: i * dw, top: 20,
                          width: dw, height: 26,
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 10,
                          color: isToday ? 'var(--accent-color)' : isWeekend ? 'var(--text-muted)' : 'var(--text-secondary)',
                          fontWeight: isToday ? 700 : 400,
                          borderLeft: '1px solid var(--border-color)',
                          background: isWeekend ? 'rgba(0,0,0,0.018)' : 'transparent',
                        }}
                      >
                        {viewMode === 'week' && (
                          <span style={{ fontSize: 9, opacity: 0.6, marginBottom: 1 }}>
                            {d.toLocaleDateString('ru-RU', { weekday: 'short' })}
                          </span>
                        )}
                        <span>{d.getDate()}</span>
                      </div>
                    )
                  })
                : headerDays.filter((_, i) => i % 7 === 0).map((d, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: i * 7 * dw, top: 20,
                        width: 7 * dw, height: 26,
                        display: 'flex', alignItems: 'center', paddingLeft: 5,
                        fontSize: 10, color: 'var(--text-secondary)',
                        borderLeft: '1px solid var(--border-color)',
                      }}
                    >
                      {d.getDate()} {d.toLocaleDateString('ru-RU', { month: 'short' })}
                    </div>
                  ))
              }
            </div>
          </div>

          {/* ── Rows ── */}
          {rows.length === 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 200, color: 'var(--text-muted)', fontSize: 14,
            }}>
              Нет проектов с постами
            </div>
          )}

          {rows.map((row, ri) => {
            const stripe = ri % 2 === 1 ? 'rgba(0,0,0,0.015)' : 'transparent'

            if (row.kind === 'project') {
              const range = projectDateRange(row.project)
              const expanded = expandedProjects.has(row.project.id)
              return (
                <div key={`p-${row.project.id}`} style={{ display: 'flex', background: stripe }}>
                  <div style={{ ...stickyCell, background: stripe || 'var(--bg)', gap: 6, padding: '0 10px' }}>
                    <button
                      onClick={() => setExpandedProjects(prev => {
                        const s = new Set(prev)
                        s.has(row.project.id) ? s.delete(row.project.id) : s.add(row.project.id)
                        return s
                      })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      {chevron(expanded)}
                    </button>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: row.color, flexShrink: 0 }} />
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {row.project.name}
                    </span>
                  </div>
                  <div style={{ width: totalW, flexShrink: 0, height: ROW_HEIGHT, position: 'relative', overflow: 'hidden' }}>
                    {renderGridLines()}
                    {renderTodayLine()}
                    {renderBar(range, 6, row.color, 0.28)}
                  </div>
                </div>
              )
            }

            if (row.kind === 'hypothesis') {
              const range = hypothesisDateRange(row.hyp)
              const expanded = expandedHypotheses.has(row.hyp.id)
              return (
                <div key={`h-${row.hyp.id}`} style={{ display: 'flex', background: stripe }}>
                  <div style={{ ...stickyCell, background: stripe || 'var(--bg)', gap: 5, paddingLeft: 28, paddingRight: 10 }}>
                    <button
                      onClick={() => setExpandedHypotheses(prev => {
                        const s = new Set(prev)
                        s.has(row.hyp.id) ? s.delete(row.hyp.id) : s.add(row.hyp.id)
                        return s
                      })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      {chevron(expanded)}
                    </button>
                    <span style={{
                      fontSize: 12, color: 'var(--text-secondary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {row.hyp.title}
                    </span>
                  </div>
                  <div style={{ width: totalW, flexShrink: 0, height: ROW_HEIGHT, position: 'relative', overflow: 'hidden' }}>
                    {renderGridLines()}
                    {renderTodayLine()}
                    {renderBar(range, 4, row.color, 0.45)}
                  </div>
                </div>
              )
            }

            if (row.kind === 'post') {
              return (
                <div key={`post-${row.post.id}`} style={{ display: 'flex', background: stripe }}>
                  <div
                    style={{
                      ...stickyCell, background: stripe || 'var(--bg)',
                      gap: 6, paddingLeft: 46, paddingRight: 10, cursor: 'pointer',
                    }}
                    onClick={() => setSelectedPost({ post: row.post, projectColor: row.color, hypothesisTitle: row.hyp.title })}
                  >
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: row.post.posted ? 'var(--green)' : 'var(--text-muted)',
                    }} />
                    <span style={{
                      fontSize: 12, color: 'var(--text-secondary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {row.post.title}
                    </span>
                    {!getPostDate(row.post) && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 'auto' }}>—</span>
                    )}
                  </div>
                  <div style={{ width: totalW, flexShrink: 0, height: ROW_HEIGHT, position: 'relative', overflow: 'hidden' }}>
                    {renderGridLines()}
                    {renderTodayLine()}
                    {renderPostMarker(row.post, row.color, () =>
                      setSelectedPost({ post: row.post, projectColor: row.color, hypothesisTitle: row.hyp.title })
                    )}
                  </div>
                </div>
              )
            }

            return null
          })}
        </div>
      </div>

      {/* ── Post drawer ── */}
      {selectedPost && (
        <PostDrawer
          post={selectedPost.post}
          projectColor={selectedPost.projectColor}
          hypothesisTitle={selectedPost.hypothesisTitle}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  )
}
