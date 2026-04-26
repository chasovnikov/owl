'use client'

import { useState, useRef } from 'react'
import { saveStrategyAction, parseStrategyFileAction } from '@/lib/actions'

interface Strategy {
  strategySummary?: string
  contentDirections?: string[]
  exampleThemes?: string[]
}

interface Props {
  projectId: string
  projectName: string
  initialAudience: string
  initialVibe: string
  initialGoal: string
  strategy: Strategy | null
}

export default function StrategyForm({
  projectId,
  projectName,
  initialAudience,
  initialVibe,
  initialGoal,
  strategy,
}: Props) {
  const [audience, setAudience] = useState(initialAudience)
  const [vibe, setVibe] = useState(initialVibe)
  const [goal, setGoal] = useState(initialGoal)
  const [strategyCollapsed, setStrategyCollapsed] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const result = await parseStrategyFileAction(fd)
      const text = result.text
      // Эвристически распределяем текст по полям, либо вставляем в аудиторию целиком
      setAudience(prev => prev ? prev + '\n\n' + text : text)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Ошибка чтения файла')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <span className="badge badge-primary" style={{ marginBottom: 14, display: 'inline-flex' }}>
          Стратегия
        </span>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Стратегия контента
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Расскажи об аудитории и целях для{' '}
          <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{projectName}</strong>
        </p>
      </div>

      {/* Сохранённая стратегия — AI-блок */}
      {strategy && (
        <div className="card animate-fade-up" style={{ marginBottom: 28, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(91,106,240,0.07) 0%, rgba(155,107,255,0.07) 100%)',
            borderBottom: '1px solid rgba(91,106,240,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: 'linear-gradient(135deg, #5B6AF0, #9B6BFF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(91,106,240,0.28)',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>AI-стратегия</span>
            </div>
            <button
              type="button"
              onClick={() => setStrategyCollapsed(c => !c)}
              style={{
                width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                style={{ transform: strategyCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {!strategyCollapsed && (
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {strategy.strategySummary && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {strategy.strategySummary}
                </p>
              )}
              {(strategy.contentDirections?.length || strategy.exampleThemes?.length) ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {strategy.contentDirections?.length ? (
                    <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-color)' }}>
                      <p className="section-label" style={{ marginBottom: 8 }}>Направления</p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {strategy.contentDirections.map((d, i) => (
                          <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', gap: 6 }}>
                            <span style={{ color: 'var(--accent)', flexShrink: 0 }}>·</span>{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {strategy.exampleThemes?.length ? (
                    <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-color)' }}>
                      <p className="section-label" style={{ marginBottom: 8 }}>Темы</p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {strategy.exampleThemes.map((t, i) => (
                          <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', gap: 6 }}>
                            <span style={{ color: 'var(--accent)', flexShrink: 0 }}>·</span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Импорт файла */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>Импортировать из файла</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Поддерживаются .txt, .pdf, .doc, .docx</p>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-secondary"
            style={{ height: 32, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            {uploading ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-9-9"/>
                </svg>
                Читаю...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Загрузить файл
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
        {uploadError && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>{uploadError}</p>}
      </div>

      {/* Форма стратегии */}
      <form action={saveStrategyAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="hidden" name="projectId" value={projectId} />

        <div className="card" style={{ padding: 18 }}>
          <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
            Целевая аудитория
          </label>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
            Кто твои читатели? Возраст, интересы, боли, желания
          </p>
          <textarea
            name="audience"
            rows={4}
            placeholder="Например: женщины 25–35 лет, интересуются ЗОЖ..."
            value={audience}
            onChange={e => setAudience(e.target.value)}
            className="input"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="card" style={{ padding: 18 }}>
          <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
            Tone of Voice
          </label>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
            Как ты общаешься с аудиторией? Тон, стиль, настроение
          </p>
          <textarea
            name="vibe"
            rows={2}
            placeholder="Например: дружелюбно, с юмором, без формализма"
            value={vibe}
            onChange={e => setVibe(e.target.value)}
            className="input"
          />
        </div>

        <div className="card" style={{ padding: 18 }}>
          <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
            Цель контента
          </label>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
            Что ты хочешь достичь — продажи, охваты, лояльность?
          </p>
          <textarea
            name="goal"
            rows={2}
            placeholder="Например: увеличить продажи курсов на 30%"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            className="input"
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', height: 42, fontSize: 14 }}>
          {strategy ? 'Обновить стратегию' : 'Создать стратегию'}
        </button>
      </form>
    </div>
  )
}
