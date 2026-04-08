'use client'

import { useState, useEffect, useRef } from 'react'
import { createProjectAction, createHypothesisAction, createPostIdeaAction } from '@/lib/actions'
import { useRouter } from 'next/navigation'

interface Rubric {
  id: string
  title: string
  channelId: string
}

interface Channel {
  id: string
  name: string
  rubrics: Rubric[]
}

interface Project {
  id: string
  name: string
  channels: Channel[]
}

interface Props {
  projects: Project[]
}

type Tab = 'project' | 'rubric' | 'post'

const PLATFORMS = ['Instagram', 'TikTok', 'VK', 'YouTube', 'Telegram', 'Threads', 'Twitter/X']
const BUSINESS_SUGGESTIONS = [
  'coffee shop', 'restaurant', 'local business', 'personal brand',
  'agency', 'e-commerce', 'online creator', 'startup', 'education', 'fitness / wellness',
]

export default function QuickCreateModal({ projects }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragCurrentY = useRef(0)

  // Listen for FAB event from BottomNav
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('fumi:create', handler)
    return () => window.removeEventListener('fumi:create', handler)
  }, [])

  // Touch drag-to-dismiss for bottom sheet
  function onTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY
    dragCurrentY.current = 0
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }
  function onTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - dragStartY.current
    if (delta < 0) return
    dragCurrentY.current = delta
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`
  }
  function onTouchEnd() {
    if (dragCurrentY.current > 100) {
      close()
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32,0.72,0,1)'
        sheetRef.current.style.transform = 'translateY(0)'
      }
    }
  }
  const [tab, setTab] = useState<Tab>('project')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Project tab state
  const [projName, setProjName] = useState('')
  const [projBusiness, setProjBusiness] = useState('')

  // Rubric tab state
  const [rubricProjectId, setRubricProjectId] = useState(projects[0]?.id ?? '')
  const [rubricChannelId, setRubricChannelId] = useState(projects[0]?.channels[0]?.id ?? '')
  const [rubricTitle, setRubricTitle] = useState('')
  const [rubricDesc, setRubricDesc] = useState('')

  // Post tab state
  const [postProjectId, setPostProjectId] = useState(projects[0]?.id ?? '')
  const [postRubricId, setPostRubricId] = useState('')
  const [postTitle, setPostTitle] = useState('')
  const [postScript, setPostScript] = useState('')
  const [postCaption, setPostCaption] = useState('')
  const [postHashtags, setPostHashtags] = useState('')
  const [postPlatform, setPostPlatform] = useState('Instagram')
  const [postDate, setPostDate] = useState('')

  function close() {
    setOpen(false)
    setError('')
    setSuccess('')
  }

  // Derived data
  const rubricProject = projects.find(p => p.id === rubricProjectId)
  const rubricChannels = rubricProject?.channels ?? []

  const postProject = projects.find(p => p.id === postProjectId)
  const postRubrics = postProject?.channels.flatMap(ch => ch.rubrics) ?? []

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projName.trim() || !projBusiness.trim()) { setError('Заполни все поля'); return }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.set('name', projName.trim())
      fd.set('businessType', projBusiness.trim())
      await createProjectAction(fd)
      setSuccess('Проект создан!')
      setProjName(''); setProjBusiness('')
      setTimeout(() => { close(); router.refresh() }, 900)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Ошибка') }
    finally { setLoading(false) }
  }

  async function handleCreateRubric(e: React.FormEvent) {
    e.preventDefault()
    if (!rubricChannelId) { setError('Выбери платформу'); return }
    if (!rubricTitle.trim()) { setError('Введи название рубрики'); return }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.set('platformId', rubricChannelId)
      fd.set('title', rubricTitle.trim())
      fd.set('description', rubricDesc.trim())
      await createHypothesisAction(fd)
      setSuccess('Рубрика создана!')
      setRubricTitle(''); setRubricDesc('')
      setTimeout(() => { close(); router.refresh() }, 900)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Ошибка') }
    finally { setLoading(false) }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault()
    if (!postRubricId) { setError('Выбери рубрику'); return }
    if (!postTitle.trim()) { setError('Введи название поста'); return }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.set('hypothesisId', postRubricId)
      fd.set('title', postTitle.trim())
      fd.set('script', postScript.trim())
      fd.set('caption', postCaption.trim())
      fd.set('hashtags', postHashtags.trim())
      fd.set('platform', postPlatform)
      if (postDate) fd.set('scheduledPublishDate', postDate)
      await createPostIdeaAction(fd)
      setSuccess('Пост создан!')
      setPostTitle(''); setPostScript(''); setPostCaption(''); setPostHashtags(''); setPostDate('')
      setTimeout(() => { close(); router.refresh() }, 900)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Ошибка') }
    finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid var(--border-color)',
    borderRadius: 10, fontSize: 13,
    background: 'var(--bg)', color: 'var(--text)',
    outline: 'none', transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
    display: 'block', marginBottom: 5,
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'project', label: 'Проект' },
    { id: 'rubric', label: 'Рубрика' },
    { id: 'post', label: 'Пост' },
  ]

  return (
    <>
      {/* FAB — desktop only, hidden on mobile (BottomNav has its own) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Быстрое создание"
        className="desktop-fab"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #5B6AF0, #9B6BFF)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(91,106,240,0.40), 0 2px 8px rgba(0,0,0,0.12)',
          transition: 'transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s',
          color: '#fff',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(91,106,240,0.50), 0 3px 12px rgba(0,0,0,0.14)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(91,106,240,0.40), 0 2px 8px rgba(0,0,0,0.12)'
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 4v14M4 11h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Modal / Bottom Sheet */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) close() }}
          className="create-overlay"
        >
          <div
            ref={sheetRef}
            className="create-sheet"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Drag handle — mobile only */}
            <div className="sheet-handle" />

            {/* Header */}
            <div style={{ padding: '18px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Создать</h2>
              <button
                onClick={close}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: 'none',
                  background: '#F4F4F5', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#71717A',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Segmented tabs */}
            <div style={{ padding: '14px 24px 0' }}>
              <div style={{
                display: 'flex', gap: 4, padding: 4,
                background: '#F4F4F5', borderRadius: 12,
              }}>
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setError(''); setSuccess('') }}
                    style={{
                      flex: 1, padding: '7px 0',
                      borderRadius: 9, fontSize: 13, fontWeight: 500,
                      border: 'none', cursor: 'pointer',
                      background: tab === t.id ? 'var(--surface, #fff)' : 'transparent',
                      color: tab === t.id ? 'var(--text)' : 'var(--text-muted)',
                      boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{ fontSize: 12, color: '#DC2626', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8 }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ fontSize: 12, color: '#16A34A', background: '#F0FDF4', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {success}
                </div>
              )}

              {/* === Проект === */}
              {tab === 'project' && (
                <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Название проекта</label>
                    <input
                      style={inputStyle} value={projName}
                      onChange={e => setProjName(e.target.value)}
                      placeholder="Мой Instagram канал"
                      onFocus={e => e.target.style.borderColor = 'var(--accent, #5B6AF0)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Тип бизнеса</label>
                    <input
                      style={inputStyle} value={projBusiness}
                      onChange={e => setProjBusiness(e.target.value)}
                      placeholder="personal brand, кафе, агентство..."
                      list="fab-business-list"
                      onFocus={e => e.target.style.borderColor = 'var(--accent, #5B6AF0)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                    />
                    <datalist id="fab-business-list">
                      {BUSINESS_SUGGESTIONS.map(b => <option key={b} value={b} />)}
                    </datalist>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary" style={{ height: 40, marginTop: 4 }}>
                    {loading ? 'Создание...' : 'Создать проект'}
                  </button>
                </form>
              )}

              {/* === Рубрика === */}
              {tab === 'rubric' && (
                <form onSubmit={handleCreateRubric} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {projects.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                      Сначала создай проект с платформой
                    </p>
                  ) : (
                    <>
                      <div>
                        <label style={labelStyle}>Проект</label>
                        <select
                          style={{ ...inputStyle, cursor: 'pointer' }}
                          value={rubricProjectId}
                          onChange={e => {
                            setRubricProjectId(e.target.value)
                            const p = projects.find(p => p.id === e.target.value)
                            setRubricChannelId(p?.channels[0]?.id ?? '')
                          }}
                        >
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      {rubricChannels.length > 0 && (
                        <div>
                          <label style={labelStyle}>Платформа</label>
                          <select
                            style={{ ...inputStyle, cursor: 'pointer' }}
                            value={rubricChannelId}
                            onChange={e => setRubricChannelId(e.target.value)}
                          >
                            {rubricChannels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                          </select>
                        </div>
                      )}
                      <div>
                        <label style={labelStyle}>Название рубрики</label>
                        <input
                          style={inputStyle} value={rubricTitle}
                          onChange={e => setRubricTitle(e.target.value)}
                          placeholder="Обучающий контент, Кейсы..."
                          onFocus={e => e.target.style.borderColor = 'var(--accent, #5B6AF0)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Описание (необязательно)</label>
                        <textarea
                          style={{ ...inputStyle, resize: 'vertical', minHeight: 70, lineHeight: 1.5 }}
                          value={rubricDesc}
                          onChange={e => setRubricDesc(e.target.value)}
                          placeholder="Для чего эта рубрика..."
                          onFocus={e => e.target.style.borderColor = 'var(--accent, #5B6AF0)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                        />
                      </div>
                      <button type="submit" disabled={loading} className="btn-primary" style={{ height: 40, marginTop: 4 }}>
                        {loading ? 'Создание...' : 'Создать рубрику'}
                      </button>
                    </>
                  )}
                </form>
              )}

              {/* === Пост === */}
              {tab === 'post' && (
                <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {projects.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                      Сначала создай проект с рубриками
                    </p>
                  ) : (
                    <>
                      <div>
                        <label style={labelStyle}>Проект</label>
                        <select
                          style={{ ...inputStyle, cursor: 'pointer' }}
                          value={postProjectId}
                          onChange={e => { setPostProjectId(e.target.value); setPostRubricId('') }}
                        >
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Рубрика</label>
                        <select
                          style={{ ...inputStyle, cursor: 'pointer' }}
                          value={postRubricId}
                          onChange={e => setPostRubricId(e.target.value)}
                        >
                          <option value="">— выбери рубрику —</option>
                          {postRubrics.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Название поста *</label>
                        <input
                          style={inputStyle} value={postTitle}
                          onChange={e => setPostTitle(e.target.value)}
                          placeholder="Название поста"
                          onFocus={e => e.target.style.borderColor = 'var(--accent, #5B6AF0)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Текст / сценарий</label>
                        <textarea
                          style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }}
                          value={postScript}
                          onChange={e => setPostScript(e.target.value)}
                          placeholder="Идея, структура поста..."
                          onFocus={e => e.target.style.borderColor = 'var(--accent, #5B6AF0)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Подпись (caption)</label>
                        <textarea
                          style={{ ...inputStyle, resize: 'vertical', minHeight: 60, lineHeight: 1.6 }}
                          value={postCaption}
                          onChange={e => setPostCaption(e.target.value)}
                          placeholder="Текст для публикации..."
                          onFocus={e => e.target.style.borderColor = 'var(--accent, #5B6AF0)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Хэштеги</label>
                        <input
                          style={inputStyle} value={postHashtags}
                          onChange={e => setPostHashtags(e.target.value)}
                          placeholder="#smm #маркетинг"
                          onFocus={e => e.target.style.borderColor = 'var(--accent, #5B6AF0)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                        />
                      </div>
                      {/* Platform pills */}
                      <div>
                        <label style={labelStyle}>Платформа</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {PLATFORMS.map(p => (
                            <button
                              key={p} type="button"
                              onClick={() => setPostPlatform(p)}
                              style={{
                                padding: '4px 12px', borderRadius: 99, fontSize: 12,
                                fontWeight: postPlatform === p ? 500 : 400,
                                border: postPlatform === p ? '1.5px solid #5B6AF0' : '1.5px solid var(--border-color)',
                                background: postPlatform === p ? 'rgba(91,106,240,0.08)' : '#FAFAFA',
                                color: postPlatform === p ? '#5B6AF0' : 'var(--text-muted)',
                                cursor: 'pointer', transition: 'all 0.12s',
                              }}
                            >{p}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Дата публикации</label>
                        <input
                          type="date" style={inputStyle} value={postDate}
                          onChange={e => setPostDate(e.target.value)}
                          onFocus={e => e.target.style.borderColor = 'var(--accent, #5B6AF0)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                        />
                      </div>
                      <button type="submit" disabled={loading} className="btn-primary" style={{ height: 40, marginTop: 4 }}>
                        {loading ? 'Создание...' : 'Создать пост'}
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
