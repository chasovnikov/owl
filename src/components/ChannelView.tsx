'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PostModal, { PostModalData } from './PostModal'
import { createRubricAction, createPostAction, generateHypothesesAction, saveHypothesesAction, uploadPostMediaAction } from '@/lib/actions'

interface PostData {
  id: string
  title: string
  postText: string | null
  caption: string
  hashtags: string
  status: string
  posted: boolean
  scheduledPublishDate: string | null
  recommendedPublishDate: string | null
  result: { views: number; likes: number; comments: number; saves: number } | null
  mediaFiles: { id: string; url: string; filename: string; mimeType: string }[]
}

interface RubricData {
  id: string
  title: string
  description: string
  createdAt: string
  posts: PostData[]
}

interface ChannelData {
  id: string
  name: string
  rubrics: RubricData[]
}

interface ProjectData {
  id: string
  name: string
  businessType: string
}

interface Props {
  data: { project: ProjectData; channel: ChannelData }
}

// Status config
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Черновик', color: '#71717A', bg: '#F4F4F5' },
  SCHEDULED: { label: 'Запланировано', color: '#2563EB', bg: '#EFF6FF' },
  PUBLISHED: { label: 'Опубликовано', color: '#16A34A', bg: '#F0FDF4' },
}

// Platform brand lookup (gradient + solid color + icon) — Telegram-energy
const PLATFORM_BRAND: Record<string, { color: string; gradient: string; icon: React.ReactNode }> = {
  instagram: { color: '#E1306C', gradient: 'linear-gradient(135deg, #f09433, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> },
  tiktok: { color: '#010101', gradient: 'linear-gradient(135deg, #010101, #2D2D2D)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 1 1 .79-5.68V9.01a6.34 6.34 0 1 0 5.56 6.29V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.02-.07z"/></svg> },
  telegram: { color: '#2AABEE', gradient: 'linear-gradient(135deg, #2CA5E0, #1C86C0)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg> },
  youtube: { color: '#FF0000', gradient: 'linear-gradient(135deg, #FF0000, #CC0000)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="4"/><polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none"/></svg> },
  vk: { color: '#4680C2', gradient: 'linear-gradient(135deg, #4680C2, #2B5FA3)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M6 9h2.5l2 3.5L13 9h2.5M8.5 15s0-2.5 2-3.5"/></svg> },
  threads: { color: '#101010', gradient: 'linear-gradient(135deg, #1A1A1A, #3D3D3D)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3C7.5 3 4 7 4 12s3.5 9 8 9c3.5 0 7-2.5 7-7 0-2-.8-3.5-2.2-4.2S13.5 9 12 10"/></svg> },
}

function getChannelBrand(name: string) {
  return PLATFORM_BRAND[name.toLowerCase().trim()] ?? {
    color: '#5B6AF0',
    gradient: 'linear-gradient(135deg, #5B6AF0, #9B6BFF)',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.5 2.5"/></svg>,
  }
}

function formatDate(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function rubricWordCV(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'рубрика'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'рубрики'
  return 'рубрик'
}
function postWordCV(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'пост'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'поста'
  return 'постов'
}

// ─── Post Card (mini) ──────────────────────────────────────────────────────────
function PostCard({
  post,
  onClick,
}: {
  post: PostData
  onClick: () => void
}) {
  const status = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.DRAFT
  const date = post.scheduledPublishDate ?? post.recommendedPublishDate

  // Overdue check
  const isOverdue = post.status !== 'PUBLISHED' && date && new Date(date) < new Date()

  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--surface, #fff)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: '13px 15px',
        cursor: 'pointer',
        textAlign: 'left',
        minWidth: 190,
        maxWidth: 230,
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.18s cubic-bezier(0.16,1,0.3,1), transform 0.18s cubic-bezier(0.16,1,0.3,1), border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = 'var(--border-medium)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = 'var(--border-color)'
      }}
    >
      {date && (
        <p style={{
          fontSize: 11,
          color: isOverdue ? '#DC2626' : 'var(--text-muted)',
          fontWeight: 500,
        }}>
          {formatDate(date)}
          {isOverdue && ' ⚠'}
        </p>
      )}
      <p style={{
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text)',
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } as React.CSSProperties}>
        {post.title}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: status.color,
          background: status.bg,
          padding: '2px 6px',
          borderRadius: 4,
        }}>
          {status.label}
        </span>
        {post.result && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {(post.result.likes + post.result.comments + post.result.saves).toLocaleString()} eng
          </span>
        )}
      </div>
      {post.status === 'PUBLISHED' && (
        <p style={{ fontSize: 11, color: '#2563EB', marginTop: 2 }}>
          Посмотреть результаты →
        </p>
      )}
    </button>
  )
}

// ─── Rubric Section ────────────────────────────────────────────────────────────
function RubricSection({
  rubric,
  projectName,
  channelName,
  brandColor,
  onPostClick,
  onAddPost,
}: {
  rubric: RubricData
  projectName: string
  channelName: string
  brandColor: string
  onPostClick: (post: PostData) => void
  onAddPost: (rubricId: string) => void
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
          {/* Accent icon badge */}
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 1,
            background: `${brandColor}14`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill={brandColor} opacity="0.85"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill={brandColor} opacity="0.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill={brandColor} opacity="0.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill={brandColor} opacity="0.3"/>
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {rubric.title}
            </h3>
            {rubric.description && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{rubric.description}</p>
            )}
          </div>
        </div>
        <a
          href={`/rubric/${rubric.id}/results`}
          style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', flexShrink: 0, fontWeight: 500 }}
          onMouseEnter={e => (e.currentTarget.style.color = brandColor)}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Результаты →
        </a>
      </div>
      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', margin: '12px 0 10px 38px', letterSpacing: '0.02em' }}>
        Ближайшие публикации
      </p>

      {/* Horizontal scroll of post cards */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
        {rubric.posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onClick={() => onPostClick(post)}
          />
        ))}
        {/* Add post card */}
        <button
          onClick={() => onAddPost(rubric.id)}
          style={{
            minWidth: 72, height: 'auto', minHeight: 90,
            border: '1.5px dashed var(--border-color)',
            borderRadius: 10,
            background: '#FAFAFA',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: 'var(--text-muted)',
            flexShrink: 0,
            transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F4F4F5'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({
  rubrics,
  projectName,
  channelName,
  onPostClick,
}: {
  rubrics: RubricData[]
  projectName: string
  channelName: string
  onPostClick: (post: PostData, rubric: RubricData) => void
}) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday-based week
  const startDow = (firstDay.getDay() + 6) % 7
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7

  const days = Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(year, month, 1 - startDow + i)
    return d
  })

  // Build post map by date string "YYYY-MM-DD"
  const postsByDate: Record<string, { post: PostData; rubric: RubricData }[]> = {}
  rubrics.forEach(rubric => {
    rubric.posts.forEach(post => {
      const dateStr = post.scheduledPublishDate ?? post.recommendedPublishDate
      if (!dateStr) return
      const key = dateStr.split('T')[0]
      if (!postsByDate[key]) postsByDate[key] = []
      postsByDate[key].push({ post, rubric })
    })
  })

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M6.5 1.5L3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', minWidth: 160, textAlign: 'center' }}>
          {monthNames[month]} {year}
        </span>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3.5 1.5L7 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
        {/* Day headers */}
        {dayNames.map(d => (
          <div key={d} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', borderBottom: '1px solid var(--border-color)', background: '#FAFAFA' }}>
            {d}
          </div>
        ))}
        {/* Cells */}
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === month
          const key = day.toISOString().split('T')[0]
          const posts = postsByDate[key] ?? []
          const isToday = key === new Date().toISOString().split('T')[0]

          return (
            <div
              key={i}
              style={{
                minHeight: 80,
                padding: '6px 8px',
                borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border-color)' : 'none',
                borderBottom: i < totalCells - 7 ? '1px solid var(--border-color)' : 'none',
                background: isToday ? '#FFFBF0' : 'var(--surface, #fff)',
                opacity: isCurrentMonth ? 1 : 0.35,
              }}
            >
              <span style={{
                fontSize: 11, fontWeight: isToday ? 700 : 400,
                color: isToday ? '#D97706' : 'var(--text-muted)',
                display: 'block', marginBottom: 4,
                textAlign: 'right',
              }}>
                {day.getDate()}.{String(day.getMonth() + 1).padStart(2, '0')}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {posts.slice(0, 3).map(({ post, rubric }) => {
                  const sc = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.DRAFT
                  return (
                    <button
                      key={post.id}
                      onClick={() => onPostClick(post, rubric)}
                      style={{
                        fontSize: 10, padding: '2px 6px',
                        background: sc.bg, color: sc.color,
                        border: 'none', borderRadius: 4,
                        cursor: 'pointer', textAlign: 'left',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}
                      title={post.title}
                    >
                      {post.title}
                    </button>
                  )
                })}
                {posts.length > 3 && (
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{posts.length - 3}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Add Rubric Modal ──────────────────────────────────────────────────────────
function AddRubricModal({
  channelId,
  onClose,
  onCreated,
}: {
  channelId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Введи название рубрики'); return }
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('channelId', channelId)
      fd.append('title', title.trim())
      fd.append('description', description.trim())
      await createRubricAction(fd)
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Новая рубрика</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Название рубрики"
            className="input"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Описание (необязательно)"
            rows={3}
            className="input"
            style={{ resize: 'vertical' }}
          />
          {error && <p style={{ fontSize: 12, color: '#DC2626' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Отмена</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2 }}>
              {loading ? 'Создание...' : 'Создать рубрику'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Add Post Modal (полная форма, идентичная PostModal) ──────────────────────
function AddPostModal({
  rubricId,
  rubricTitle,
  channelName,
  projectName,
  onClose,
  onCreated,
}: {
  rubricId: string
  rubricTitle: string
  channelName: string
  projectName: string
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [postText, setPostText] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [status, setStatus] = useState('DRAFT')
  const [scheduledDate, setScheduledDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Media — выбранные файлы до создания поста
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function addFiles(files: FileList | null) {
    if (!files) return
    setPendingFiles(prev => [...prev, ...Array.from(files)])
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeFile(idx: number) {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Введи название поста'); return }
    setLoading(true)
    setError('')
    try {
      const post = await createPostAction({
        rubricId,
        title: title.trim(),
        postText: postText.trim(),
        caption: postText.trim(),
        hashtags: hashtags.trim(),
        scheduledDate: scheduledDate || undefined,
        status,
      })

      // Загружаем медиафайлы если есть
      if (pendingFiles.length > 0 && post?.id) {
        setUploadingMedia(true)
        for (const file of pendingFiles) {
          const fd = new FormData()
          fd.append('postId', post.id)
          fd.append('postIdeaId', post.id)
          fd.append('file', file)
          await uploadPostMediaAction(fd)
        }
        setUploadingMedia(false)
      }

      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
      setLoading(false)
      setUploadingMedia(false)
    }
  }

  const isBusy = loading || uploadingMedia
  let busyLabel = 'Создать пост'
  if (uploadingMedia) busyLabel = `Загрузка файлов (${pendingFiles.length})...`
  else if (loading) busyLabel = 'Создание...'

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: 'var(--surface, #fff)',
        borderRadius: 16,
        width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header — название поста inline, как в PostModal */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Название поста"
              style={{
                fontSize: 17, fontWeight: 600, color: 'var(--text)',
                border: 'none', outline: 'none', background: 'transparent',
                width: '100%', letterSpacing: '-0.02em',
              }}
            />
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: '#F4F4F5', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 8,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Контекстные теги — проект / канал / рубрика */}
        <div style={{ padding: '10px 24px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#F4F4F5', color: '#71717A' }}>
            {projectName}
          </span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#F4F4F5', color: '#71717A' }}>
            {channelName}
          </span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#F4F4F5', color: '#71717A' }}>
            {rubricTitle}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Дата + статус */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                  Дата публикации
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => {
                    setScheduledDate(e.target.value)
                    if (e.target.value && status === 'DRAFT') setStatus('SCHEDULED')
                  }}
                  className="input"
                  style={{ fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                  Статус
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="input"
                  style={{ fontSize: 13, cursor: 'pointer' }}
                >
                  <option value="DRAFT">Черновик</option>
                  <option value="SCHEDULED">Запланировано</option>
                  <option value="PUBLISHED">Опубликовано</option>
                </select>
              </div>
            </div>

            {/* Текст поста */}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                Текст поста
              </label>
              <textarea
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="Основной текст / подпись к посту..."
                rows={5}
                className="input"
                style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.6 }}
              />
            </div>

            {/* Хэштеги */}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                Хэштеги
              </label>
              <input
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                placeholder="#контент #маркетинг"
                className="input"
                style={{ fontSize: 13 }}
              />
            </div>

            {/* Медиафайлы */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                  Материалы
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{ fontSize: 11, color: 'var(--accent, #18181B)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                >
                  + Добавить файл
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={e => addFiles(e.target.files)}
                  style={{ display: 'none' }}
                />
              </div>

              {pendingFiles.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {pendingFiles.map((file, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)', background: '#F4F4F5' }}>
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#71717A' }}>
                          Видео
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        style={{
                          position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                          borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1 1l6 6M7 1L1 7" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      width: 72, height: 72, borderRadius: 8,
                      border: '1.5px dashed var(--border-color)',
                      background: '#FAFAFA', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', fontSize: 20,
                    }}
                  >+</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 8,
                    border: '1.5px dashed var(--border-color)',
                    background: '#FAFAFA', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontSize: 12, color: 'var(--text-muted)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Фото или видео
                </button>
              )}
            </div>

            {error && <p style={{ fontSize: 12, color: '#DC2626' }}>{error}</p>}

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
                Отмена
              </button>
              <button type="submit" disabled={isBusy} className="btn-primary" style={{ flex: 2 }}>
                {busyLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── AI Rubrics Modal ──────────────────────────────────────────────────────────
function AIRubricsModal({
  channelId,
  businessType,
  onClose,
  onCreated,
}: {
  channelId: string
  businessType: string
  onClose: () => void
  onCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generated, setGenerated] = useState<{ title: string; description: string }[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setGenerated([])
    setSelected(new Set())
    try {
      const results = await generateHypothesesAction(channelId, businessType)
      setGenerated(results)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка генерации')
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(idx: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  async function handleSave() {
    if (selected.size === 0) return
    setSaving(true)
    try {
      const items = Array.from(selected).map(i => generated[i])
      await saveHypothesesAction(channelId, items)
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: 'var(--surface, #fff)', borderRadius: 16, width: '100%', maxWidth: 500,
        maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: 'linear-gradient(135deg, #5B6AF0, #9B6BFF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Добавить рубрики с помощью AI</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI предложит рубрики на основе вашего контента</p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#F4F4F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!generated.length && !loading && (
            <button
              onClick={handleGenerate}
              className="btn-primary"
              style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Сгенерировать рубрики
            </button>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ height: 60, borderRadius: 10, background: '#F4F4F5', animation: 'pulse 1.5s infinite' }} />
              ))}
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>AI генерирует рубрики...</p>
            </div>
          )}

          {error && <p style={{ fontSize: 12, color: '#DC2626' }}>{error}</p>}

          {generated.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Выбрано: {selected.size} из {generated.length}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {generated.map((item, i) => {
                  const isSelected = selected.has(i)
                  return (
                    <button
                      key={i}
                      onClick={() => toggleSelect(i)}
                      style={{
                        padding: '12px 14px', borderRadius: 10, textAlign: 'left',
                        border: isSelected ? '2px solid var(--accent, #18181B)' : '1.5px solid var(--border-color)',
                        background: isSelected ? 'rgba(91,106,240,0.04)' : '#FAFAFA',
                        cursor: 'pointer', transition: 'all 0.12s',
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        border: isSelected ? '2px solid #5B6AF0' : '1.5px solid #D4D4D8',
                        background: isSelected ? '#5B6AF0' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && (
                          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{item.title}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button onClick={handleGenerate} className="btn-secondary" style={{ flex: 1 }}>
                  Перегенерировать
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || selected.size === 0}
                  className="btn-primary"
                  style={{ flex: 2 }}
                >
                  {saving ? 'Сохранение...' : `Добавить ${selected.size > 0 ? selected.size : ''} рубрик${selected.size === 1 ? 'у' : ''}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main ChannelView ──────────────────────────────────────────────────────────
export default function ChannelView({ data }: Props) {
  const { project, channel } = data
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [activeTab, setActiveTab] = useState<'rubrics' | 'calendar'>('rubrics')
  const [selectedPost, setSelectedPost] = useState<{ post: PostData; rubric: RubricData } | null>(null)
  const [showAddRubric, setShowAddRubric] = useState(false)
  const [showAIRubrics, setShowAIRubrics] = useState(false)
  const [addPostRubricId, setAddPostRubricId] = useState<string | null>(null)

  function refresh() {
    startTransition(() => router.refresh())
  }

  const addPostRubric = addPostRubricId ? channel.rubrics.find(r => r.id === addPostRubricId) : null
  const brand = getChannelBrand(channel.name)
  const rubricsCount = channel.rubrics.length
  const postsCount = channel.rubrics.reduce((a, r) => a + r.posts.length, 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-content">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link
            href={`/project/${project.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <div style={{ width: 18, height: 18, borderRadius: 4, background: '#E4E4E7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#52525B' }}>
              {project.name[0].toUpperCase()}
            </div>
            <span>{project.name}</span>
          </Link>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{channel.name}</span>
        </div>

        {/* ── Channel hero header ── */}
        <div style={{
          borderRadius: 16, overflow: 'hidden', marginBottom: 24,
          border: '1px solid var(--border-color)', background: 'var(--surface)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          {/* Gradient cover */}
          <div style={{ height: 64, background: brand.gradient, position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
              opacity: 0.5,
            }} />
            <div style={{
              position: 'absolute', bottom: -22, left: 24,
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--surface)',
              boxShadow: '0 0 0 3px var(--surface), 0 4px 12px rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: brand.color, zIndex: 1,
            }}>
              {brand.icon}
            </div>
          </div>

          {/* Name + stats row */}
          <div style={{ padding: '30px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 2 }}>
                {channel.name}
              </h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {rubricsCount} {rubricWordCV(rubricsCount)} · {postsCount} {postWordCV(postsCount)}
              </p>
            </div>
            {/* Tab bar (segmented, brand-colored) */}
            <div style={{ display: 'flex', gap: 2, background: 'var(--bg)', padding: 3, borderRadius: 10 }}>
              {(['rubrics', 'calendar'] as const).map(t => {
                const active = activeTab === t
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{
                      padding: '7px 16px', fontSize: 13, fontWeight: active ? 600 : 500,
                      color: active ? brand.color : 'var(--text-muted)',
                      background: active ? 'var(--surface)' : 'transparent',
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.12s',
                    }}
                  >
                    {t === 'rubrics' ? 'Рубрики' : 'Календарь'}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'rubrics' && (
          <div>
            {channel.rubrics.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 14, marginBottom: 8 }}>Рубрик пока нет</p>
                <p style={{ fontSize: 12 }}>Создай первую рубрику для {channel.name}</p>
              </div>
            )}

            {channel.rubrics.map(rubric => (
              <RubricSection
                key={rubric.id}
                rubric={rubric}
                projectName={project.name}
                channelName={channel.name}
                brandColor={brand.color}
                onPostClick={post => setSelectedPost({ post, rubric })}
                onAddPost={id => setAddPostRubricId(id)}
              />
            ))}

            {/* Add rubric buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => setShowAddRubric(true)}
                style={{
                  width: '100%', padding: '16px',
                  border: '1.5px dashed var(--border-color)',
                  borderRadius: 12, background: '#FAFAFA',
                  cursor: 'pointer', fontSize: 13,
                  color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.1s, color 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F4F4F5'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Добавить рубрику
              </button>

              <button
                onClick={() => setShowAIRubrics(true)}
                style={{
                  width: '100%', padding: '14px',
                  border: '1.5px solid rgba(91,106,240,0.25)',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(91,106,240,0.04), rgba(155,107,255,0.04))',
                  cursor: 'pointer', fontSize: 13,
                  color: '#5B6AF0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.1s, border-color 0.1s',
                  fontWeight: 500,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(91,106,240,0.08)'; e.currentTarget.style.borderColor = 'rgba(91,106,240,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(91,106,240,0.04), rgba(155,107,255,0.04))'; e.currentTarget.style.borderColor = 'rgba(91,106,240,0.25)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Добавить рубрики с помощью AI
              </button>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            rubrics={channel.rubrics}
            projectName={project.name}
            channelName={channel.name}
            onPostClick={(post, rubric) => setSelectedPost({ post, rubric })}
          />
        )}
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={{
            id: selectedPost.post.id,
            title: selectedPost.post.title,
            postText: selectedPost.post.postText,
            caption: selectedPost.post.caption,
            hashtags: selectedPost.post.hashtags,
            status: selectedPost.post.status,
            scheduledPublishDate: selectedPost.post.scheduledPublishDate,
            rubricTitle: selectedPost.rubric.title,
            channelName: channel.name,
            projectName: project.name,
            result: selectedPost.post.result,
            mediaFiles: selectedPost.post.mediaFiles,
          }}
          onClose={() => setSelectedPost(null)}
          onSaved={refresh}
        />
      )}

      {/* Add Rubric Modal */}
      {showAddRubric && (
        <AddRubricModal
          channelId={channel.id}
          onClose={() => setShowAddRubric(false)}
          onCreated={() => { setShowAddRubric(false); refresh() }}
        />
      )}

      {/* AI Rubrics Modal */}
      {showAIRubrics && (
        <AIRubricsModal
          channelId={channel.id}
          businessType={project.businessType}
          onClose={() => setShowAIRubrics(false)}
          onCreated={() => { setShowAIRubrics(false); refresh() }}
        />
      )}

      {/* Add Post Modal */}
      {addPostRubric && (
        <AddPostModal
          rubricId={addPostRubric.id}
          rubricTitle={addPostRubric.title}
          channelName={channel.name}
          projectName={project.name}
          onClose={() => setAddPostRubricId(null)}
          onCreated={() => { setAddPostRubricId(null); refresh() }}
        />
      )}
    </div>
  )
}
