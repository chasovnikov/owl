'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PostItem {
  id: string
  title: string
  status: string
  scheduledPublishDate: string | null
  recommendedPublishDate: string | null
  rubricId: string
  rubricTitle: string
  channelId: string
  channelName: string
  projectId: string
  projectName: string
}

interface RubricItem {
  id: string
  title: string
  posts: PostItem[]
}

interface ChannelItem {
  id: string
  name: string
  projectId: string
  rubrics: RubricItem[]
}

interface ProjectItem {
  id: string
  name: string
  channels: ChannelItem[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Черновик', color: '#71717A', bg: '#F4F4F5' },
  SCHEDULED: { label: 'Запланировано', color: '#2563EB', bg: '#EFF6FF' },
  PUBLISHED: { label: 'Опубликовано', color: '#16A34A', bg: '#F0FDF4' },
}

// Project color palette
const PROJECT_COLORS = [
  '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6',
]

export default function GlobalCalendar({ projects }: { projects: ProjectItem[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterChannel, setFilterChannel] = useState<string>('all')
  const [filterRubric, setFilterRubric] = useState<string>('all')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7

  const days = Array.from({ length: totalCells }, (_, i) => new Date(year, month, 1 - startDow + i))

  // Build color map for projects
  const projectColorMap: Record<string, string> = {}
  projects.forEach((p, i) => {
    projectColorMap[p.id] = PROJECT_COLORS[i % PROJECT_COLORS.length]
  })

  // Collect all posts with filters
  const allPosts: PostItem[] = []
  projects.forEach(p => {
    if (filterProject !== 'all' && p.id !== filterProject) return
    p.channels.forEach(ch => {
      if (filterChannel !== 'all' && ch.id !== filterChannel) return
      ch.rubrics.forEach(r => {
        if (filterRubric !== 'all' && r.id !== filterRubric) return
        r.posts.forEach(post => allPosts.push(post))
      })
    })
  })

  // Build post map by date
  const postsByDate: Record<string, PostItem[]> = {}
  allPosts.forEach(post => {
    const dateStr = post.scheduledPublishDate ?? post.recommendedPublishDate
    if (!dateStr) return
    const key = dateStr.split('T')[0]
    if (!postsByDate[key]) postsByDate[key] = []
    postsByDate[key].push(post)
  })

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  // Available channels for filter
  const availableChannels = filterProject === 'all'
    ? projects.flatMap(p => p.channels)
    : projects.find(p => p.id === filterProject)?.channels ?? []

  const availableRubrics = filterChannel === 'all'
    ? availableChannels.flatMap(ch => ch.rubrics)
    : availableChannels.find(ch => ch.id === filterChannel)?.rubrics ?? []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Календарь
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Filters */}
            <select
              value={filterProject}
              onChange={e => { setFilterProject(e.target.value); setFilterChannel('all'); setFilterRubric('all') }}
              className="input"
              style={{ fontSize: 12, cursor: 'pointer' }}
            >
              <option value="all">Все проекты</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            {filterProject !== 'all' && (
              <select
                value={filterChannel}
                onChange={e => { setFilterChannel(e.target.value); setFilterRubric('all') }}
                className="input"
                style={{ fontSize: 12, cursor: 'pointer' }}
              >
                <option value="all">Все каналы</option>
                {availableChannels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
              </select>
            )}

            {filterChannel !== 'all' && (
              <select
                value={filterRubric}
                onChange={e => setFilterRubric(e.target.value)}
                className="input"
                style={{ fontSize: 12, cursor: 'pointer' }}
              >
                <option value="all">Все рубрики</option>
                {availableRubrics.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            )}
          </div>
        </div>

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

          {/* Project legend */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {projects.filter(p => filterProject === 'all' || p.id === filterProject).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: projectColorMap[p.id] }} />
                {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
          {dayNames.map(d => (
            <div key={d} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', borderBottom: '1px solid var(--border-color)', background: '#FAFAFA' }}>
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            const isCurrentMonth = day.getMonth() === month
            const key = day.toISOString().split('T')[0]
            const posts = postsByDate[key] ?? []
            const isToday = key === new Date().toISOString().split('T')[0]

            return (
              <div
                key={i}
                style={{
                  minHeight: 88,
                  padding: '6px 8px',
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border-color)' : 'none',
                  borderBottom: i < totalCells - 7 ? '1px solid var(--border-color)' : 'none',
                  background: isToday ? '#FFFBF0' : 'var(--surface, #fff)',
                  opacity: isCurrentMonth ? 1 : 0.3,
                }}
              >
                <span style={{
                  fontSize: 11, fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#D97706' : 'var(--text-muted)',
                  display: 'block', marginBottom: 4, textAlign: 'right',
                }}>
                  {day.getDate()}.{String(day.getMonth() + 1).padStart(2, '0')}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {posts.slice(0, 3).map(post => {
                    const color = projectColorMap[post.projectId] ?? '#6366F1'
                    return (
                      <Link
                        key={post.id}
                        href={`/project/${post.projectId}/channel/${post.channelId}`}
                        style={{
                          fontSize: 10, padding: '2px 5px',
                          background: `${color}18`,
                          color: color,
                          borderRadius: 4,
                          textDecoration: 'none',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          display: 'block',
                          borderLeft: `2px solid ${color}`,
                        }}
                        title={`${post.projectName} · ${post.channelName} · ${post.rubricTitle}\n${post.title}`}
                      >
                        {post.title}
                      </Link>
                    )
                  })}
                  {posts.length > 3 && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{posts.length - 3} ещё</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div style={{ marginTop: 20, display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Всего постов в месяце: <strong style={{ color: 'var(--text)' }}>{allPosts.filter(p => {
            const d = p.scheduledPublishDate ?? p.recommendedPublishDate
            if (!d) return false
            const date = new Date(d)
            return date.getFullYear() === year && date.getMonth() === month
          }).length}</strong></span>
          {Object.entries(STATUS_CONFIG).map(([key, s]) => {
            const count = allPosts.filter(p => {
              const d = p.scheduledPublishDate ?? p.recommendedPublishDate
              if (!d) return false
              const date = new Date(d)
              return date.getFullYear() === year && date.getMonth() === month && p.status === key
            }).length
            return count > 0 ? (
              <span key={key}>
                <span style={{ color: s.color, fontWeight: 600 }}>{s.label}: {count}</span>
              </span>
            ) : null
          })}
        </div>
      </div>
    </div>
  )
}
