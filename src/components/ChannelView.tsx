'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PostModal, { PostModalData } from './PostModal'
import { createRubricAction, createPostAction } from '@/lib/actions'

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

function formatDate(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
        borderRadius: 10,
        padding: '12px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        minWidth: 180,
        maxWidth: 220,
        flexShrink: 0,
        transition: 'box-shadow 0.15s, transform 0.1s',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
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
  onPostClick,
  onAddPost,
}: {
  rubric: RubricData
  projectName: string
  channelName: string
  onPostClick: (post: PostData) => void
  onAddPost: (rubricId: string) => void
}) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          {rubric.title}
        </h3>
        <a
          href={`/rubric/${rubric.id}/results`}
          style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Результаты рубрики →
        </a>
      </div>
      {rubric.description && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{rubric.description}</p>
      )}
      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.02em' }}>
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

// ─── Add Post Modal ────────────────────────────────────────────────────────────
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
  const [scheduledDate, setScheduledDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Введи название поста'); return }
    setLoading(true)
    setError('')
    try {
      await createPostAction({
        rubricId,
        title: title.trim(),
        postText: postText.trim(),
        scheduledDate: scheduledDate || undefined,
      })
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
      <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>Новый пост</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{rubricTitle}</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Название поста"
            className="input"
          />
          <textarea
            value={postText}
            onChange={e => setPostText(e.target.value)}
            placeholder="Текст поста (необязательно)"
            rows={3}
            className="input"
            style={{ resize: 'vertical' }}
          />
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Дата публикации</label>
            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="input" />
          </div>
          {error && <p style={{ fontSize: 12, color: '#DC2626' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Отмена</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2 }}>
              {loading ? 'Создание...' : 'Создать пост'}
            </button>
          </div>
        </form>
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
  const [addPostRubricId, setAddPostRubricId] = useState<string | null>(null)

  function refresh() {
    startTransition(() => router.refresh())
  }

  const addPostRubric = addPostRubricId ? channel.rubrics.find(r => r.id === addPostRubricId) : null

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    color: active ? 'var(--text)' : 'var(--text-muted)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--text)' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.1s',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-content">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, color: 'var(--text-muted)' }}>
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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
          </svg>
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{channel.name}</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: 28, gap: 0 }}>
          <button style={tabStyle(activeTab === 'rubrics')} onClick={() => setActiveTab('rubrics')}>
            Рубрики
          </button>
          <button style={tabStyle(activeTab === 'calendar')} onClick={() => setActiveTab('calendar')}>
            Календарь
          </button>
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
                onPostClick={post => setSelectedPost({ post, rubric })}
                onAddPost={id => setAddPostRubricId(id)}
              />
            ))}

            {/* Add rubric button */}
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
