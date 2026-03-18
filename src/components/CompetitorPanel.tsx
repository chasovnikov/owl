'use client'

import { useState, useTransition } from 'react'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'
import { addCompetitorAction, deleteCompetitorAction, analyzeCompetitorAction, updateCompetitorDataAction } from '@/lib/actions'

interface CompetitorWithReports {
  id: string
  handle: string
  notes: string | null
  followers: number | null
  avgLikes: number | null
  avgComments: number | null
  postsPerWeek: number | null
  contentTypes: string | null
  mainTopics: string | null
  status: string
  lastAnalyzedAt: Date | null
  reports: { id: string; report: string; createdAt: Date }[]
}

interface Props {
  projectId: string
  competitors: CompetitorWithReports[]
}

interface CompetitorAnalysisResult {
  summary: string
  contentTypes: string[]
  postingFrequency: string
  strongPoints: string[]
  weakPoints: string[]
  recommendations: string[]
  estimatedEngagement: string
  topTopics: string[]
}

function StatusBadge({ status }: { status: string }) {
  const { lang } = useLang()
  const tr = translations[lang]
  const styles: Record<string, React.CSSProperties> = {
    idle: { background: '#F4F4F5', color: '#6B7280' },
    analyzing: { background: '#EFF6FF', color: '#3B82F6' },
    done: { background: '#F0FDF4', color: '#16A34A' },
    error: { background: '#FEF2F2', color: 'var(--red)' },
  }
  const labels: Record<string, string> = {
    idle: tr.competitorStatusIdle,
    analyzing: tr.competitorStatusAnalyzing,
    done: tr.competitorStatusDone,
    error: tr.competitorStatusError,
  }
  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4, ...styles[status] ?? styles.idle }}>
      {status === 'analyzing' && (
        <span style={{ width: 8, height: 8, border: '1.5px solid #BFDBFE', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
      )}
      {labels[status] ?? status}
    </span>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', display: 'inline-block' }}>
      {label}
    </span>
  )
}

function ReportView({ report }: { report: CompetitorAnalysisResult }) {
  const { lang } = useLang()
  const tr = translations[lang]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{tr.competitorSummary}</p>
        <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{report.summary}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{tr.competitorStrong}</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {report.strongPoints?.map((pt, i) => (
              <li key={i} style={{ fontSize: 12, color: '#166534', display: 'flex', gap: 6 }}><span style={{ color: '#16A34A', flexShrink: 0 }}>+</span>{pt}</li>
            ))}
          </ul>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{tr.competitorWeak}</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {report.weakPoints?.map((pt, i) => (
              <li key={i} style={{ fontSize: 12, color: '#991B1B', display: 'flex', gap: 6 }}><span style={{ color: 'var(--red)', flexShrink: 0 }}>−</span>{pt}</li>
            ))}
          </ul>
        </div>
      </div>

      {report.recommendations?.length > 0 && (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{tr.competitorRecs}</p>
          <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {report.recommendations.map((rec, i) => (
              <li key={i} style={{ fontSize: 12, color: 'var(--text)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0, minWidth: 16 }}>{i + 1}.</span>{rec}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {report.postingFrequency && (
          <div style={{ flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{tr.competitorFrequency}</p>
            <p style={{ fontSize: 12, color: 'var(--text)' }}>{report.postingFrequency}</p>
          </div>
        )}
        {report.estimatedEngagement && (
          <div style={{ flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{tr.competitorEngagement}</p>
            <p style={{ fontSize: 12, color: 'var(--text)' }}>{report.estimatedEngagement}</p>
          </div>
        )}
      </div>

      {report.contentTypes?.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{tr.competitorContentTypes}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{report.contentTypes.map((ct, i) => <Chip key={i} label={ct} />)}</div>
        </div>
      )}

      {report.topTopics?.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{tr.competitorTopics}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{report.topTopics.map((t, i) => <Chip key={i} label={t} />)}</div>
        </div>
      )}
    </div>
  )
}

function DataForm({ competitor, onSaved }: { competitor: CompetitorWithReports; onSaved: () => void }) {
  const { lang } = useLang()
  const tr = translations[lang]
  const [saving, startSave] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startSave(async () => {
      await updateCompetitorDataAction(fd)
      onSaved()
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 32, padding: '0 10px', borderRadius: 6,
    border: '1px solid var(--border-color)', background: 'var(--surface)',
    color: 'var(--text)', fontSize: 12, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, display: 'block' }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input type="hidden" name="competitorId" value={competitor.id} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>{tr.competitorFollowers}</label>
          <input style={inputStyle} name="followers" type="number" placeholder="10000" defaultValue={competitor.followers ?? ''} />
        </div>
        <div>
          <label style={labelStyle}>{tr.competitorPostsPerWeek}</label>
          <input style={inputStyle} name="postsPerWeek" type="number" step="0.5" placeholder="3" defaultValue={competitor.postsPerWeek ?? ''} />
        </div>
        <div>
          <label style={labelStyle}>{tr.competitorAvgLikes}</label>
          <input style={inputStyle} name="avgLikes" type="number" placeholder="500" defaultValue={competitor.avgLikes ?? ''} />
        </div>
        <div>
          <label style={labelStyle}>{tr.competitorAvgComments}</label>
          <input style={inputStyle} name="avgComments" type="number" placeholder="20" defaultValue={competitor.avgComments ?? ''} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>{tr.competitorContentTypes}</label>
        <input style={inputStyle} name="contentTypes" placeholder={tr.competitorContentTypesPlaceholder} defaultValue={competitor.contentTypes ?? ''} />
      </div>
      <div>
        <label style={labelStyle}>{tr.competitorTopics}</label>
        <input style={inputStyle} name="mainTopics" placeholder={tr.competitorTopicsPlaceholder} defaultValue={competitor.mainTopics ?? ''} />
      </div>
      <div>
        <label style={labelStyle}>{tr.competitorNotes}</label>
        <textarea
          name="notes"
          placeholder={tr.competitorNotesPlaceholder}
          defaultValue={competitor.notes ?? ''}
          rows={2}
          style={{ ...inputStyle, height: 'auto', padding: '6px 10px', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={saving} className="btn-primary" style={{ height: 28, fontSize: 11, padding: '0 12px' }}>
          {saving ? '...' : tr.competitorSaveData}
        </button>
        <button type="button" onClick={onSaved} className="btn-secondary" style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
          {tr.deleteProjectCancel}
        </button>
      </div>
    </form>
  )
}

function CompetitorCard({ competitor, projectId }: { competitor: CompetitorWithReports; projectId: string }) {
  const { lang } = useLang()
  const tr = translations[lang]
  const [localStatus, setLocalStatus] = useState(competitor.status)
  const [analyzing, startAnalyze] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [error, setError] = useState('')

  const latestReport = competitor.reports[0]
    ? (JSON.parse(competitor.reports[0].report) as CompetitorAnalysisResult)
    : null

  const isAnalyzing = localStatus === 'analyzing' || analyzing
  const hasData = competitor.followers || competitor.avgLikes || competitor.contentTypes || competitor.mainTopics || competitor.notes

  function handleAnalyze() {
    setError('')
    setLocalStatus('analyzing')
    startAnalyze(async () => {
      try {
        await analyzeCompetitorAction(competitor.id)
        setLocalStatus('done')
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Ошибка анализа')
        setLocalStatus('error')
      }
    })
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>@{competitor.handle}</span>
          <StatusBadge status={isAnalyzing ? 'analyzing' : localStatus} />
          {competitor.lastAnalyzedAt && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {tr.competitorLastAnalyzed}: {new Date(competitor.lastAnalyzedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => setEditOpen(v => !v)} className="btn-secondary" style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
            {editOpen ? '×' : tr.competitorEditData}
          </button>
          <button onClick={handleAnalyze} disabled={isAnalyzing} className="btn-secondary" style={{ height: 28, fontSize: 11, padding: '0 10px' }}>
            {isAnalyzing
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, border: '1.5px solid #D1D5DB', borderTopColor: '#6B7280', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  {tr.competitorStatusAnalyzing}
                </span>
              : latestReport ? tr.reanalyzeCompetitor : tr.analyzeCompetitor
            }
          </button>
          <button onClick={() => startDelete(async () => { await deleteCompetitorAction(competitor.id, projectId) })} className="btn-secondary"
            style={{ height: 28, fontSize: 11, padding: '0 10px', color: 'var(--red)' }}>×</button>
        </div>
      </div>

      {/* Data summary chips */}
      {!editOpen && hasData && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {competitor.followers && <Chip label={`${competitor.followers.toLocaleString('ru-RU')} подписчиков`} />}
          {competitor.avgLikes && <Chip label={`~${competitor.avgLikes} лайков`} />}
          {competitor.postsPerWeek && <Chip label={`${competitor.postsPerWeek} постов/нед`} />}
          {competitor.avgLikes && competitor.followers && (
            <Chip label={`ER: ${((competitor.avgLikes + (competitor.avgComments ?? 0)) / competitor.followers * 100).toFixed(1)}%`} />
          )}
        </div>
      )}

      {!editOpen && !hasData && !latestReport && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{tr.competitorNoData}</p>
      )}

      {editOpen && <DataForm competitor={competitor} onSaved={() => setEditOpen(false)} />}

      {error && (
        <div style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, background: '#FEF2F2', color: 'var(--red)', marginTop: 8 }}>{error}</div>
      )}

      {isAnalyzing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: 36 }} />)}
        </div>
      )}

      {latestReport && !isAnalyzing && <ReportView report={latestReport} />}

      {competitor.reports.length > 1 && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
          <button onClick={() => setHistoryOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
            <span style={{ transform: historyOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▶</span>
            {tr.competitorHistory} ({competitor.reports.length})
          </button>
          {historyOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {competitor.reports.map((r, i) => (
                <div key={r.id} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
                  {i === 0 ? '★ ' : ''}{new Date(r.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CompetitorPanel({ projectId, competitors }: Props) {
  const { lang } = useLang()
  const tr = translations[lang]
  const [adding, startAdd] = useTransition()
  const [addError, setAddError] = useState('')

  async function handleAdd(formData: FormData) {
    setAddError('')
    startAdd(async () => {
      try {
        await addCompetitorAction(formData)
      } catch (e: unknown) {
        setAddError(e instanceof Error ? e.message : 'Ошибка')
      }
    })
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 2 }}>{tr.competitors}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tr.competitorsDesc}</p>
      </div>

      <form action={handleAdd} style={{ marginBottom: 16 }}>
        <input type="hidden" name="projectId" value={projectId} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input name="handle" placeholder={tr.competitorHandle} required
            style={{ flex: 1, height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
          <button type="submit" disabled={adding} className="btn-secondary" style={{ height: 34, fontSize: 12, padding: '0 14px', flexShrink: 0 }}>
            {adding ? '...' : `+ ${tr.addCompetitor}`}
          </button>
        </div>
        {addError && <div style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, background: '#FEF2F2', color: 'var(--red)', marginTop: 6 }}>{addError}</div>}
      </form>

      {competitors.length === 0 ? (
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tr.noCompetitors}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {competitors.map(c => <CompetitorCard key={c.id} competitor={c} projectId={projectId} />)}
        </div>
      )}
    </div>
  )
}
