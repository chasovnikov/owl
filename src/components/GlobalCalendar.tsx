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
  const today = new Date().toISOString().split('T')[0]
  const [selectedDay, setSelectedDay] = useState<string>(today)

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Календарь
          </h1>
          <div className="calendar-filters" style={{ display: 'flex', gap: 8 }}>
            {/* Filters — all visible, downstream disabled until parent selected */}
            <select
              value={filterProject}
              onChange={e => { setFilterProject(e.target.value); setFilterChannel('all'); setFilterRubric('all') }}
              className="input"
              style={{ fontSize: 12, cursor: 'pointer', width: 'auto' }}
            >
              <option value="all">Все проекты</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select
              value={filterProject === 'all' ? 'all' : filterChannel}
              onChange={e => { setFilterChannel(e.target.value); setFilterRubric('all') }}
              disabled={filterProject === 'all'}
              className="input"
              style={{ fontSize: 12, cursor: filterProject === 'all' ? 'not-allowed' : 'pointer', opacity: filterProject === 'all' ? 0.4 : 1, width: 'auto' }}
            >
              <option value="all">Все каналы</option>
              {availableChannels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </select>

            <select
              value={filterChannel === 'all' ? 'all' : filterRubric}
              onChange={e => setFilterRubric(e.target.value)}
              disabled={filterChannel === 'all'}
              className="input"
              style={{ fontSize: 12, cursor: filterChannel === 'all' ? 'not-allowed' : 'pointer', opacity: filterChannel === 'all' ? 0.4 : 1, width: 'auto' }}
            >
              <option value="all">Все рубрики</option>
              {availableRubrics.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
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

        {/* ── Desktop calendar grid ── */}
        <div className="calendar-desktop-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
          {dayNames.map(d => (
            <div key={d} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', borderBottom: '1px solid var(--border-color)', background: '#FAFAFA' }}>
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            const isCurrentMonth = day.getMonth() === month
            const key = day.toISOString().split('T')[0]
            const posts = postsByDate[key] ?? []
            const isToday = key === today

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
                <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? '#D97706' : 'var(--text-muted)', display: 'block', marginBottom: 4, textAlign: 'right' }}>
                  {day.getDate()}.{String(day.getMonth() + 1).padStart(2, '0')}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {posts.slice(0, 3).map(post => {
                    const color = projectColorMap[post.projectId] ?? '#6366F1'
                    return (
                      <Link key={post.id} href={`/project/${post.projectId}/channel/${post.channelId}`}
                        style={{ fontSize: 10, padding: '2px 5px', background: `${color}18`, color, borderRadius: 4, textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', borderLeft: `2px solid ${color}` }}
                        title={`${post.projectName} · ${post.channelName} · ${post.rubricTitle}\n${post.title}`}
                      >{post.title}</Link>
                    )
                  })}
                  {posts.length > 3 && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{posts.length - 3} ещё</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Mobile: compact grid + agenda ── */}
        <div className="calendar-mobile">
          {/* Compact month grid — dots only */}
          <div style={{ background: 'var(--surface)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {dayNames.map(d => (
                <div key={d} style={{ padding: '8px 0', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>{d}</div>
              ))}
              {days.map((day, i) => {
                const isCurrentMonth = day.getMonth() === month
                const key = day.toISOString().split('T')[0]
                const posts = postsByDate[key] ?? []
                const isToday = key === today
                const isSelected = key === selectedDay

                return (
                  <div
                    key={i}
                    onClick={() => isCurrentMonth && setSelectedDay(key)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '4px 0 6px',
                      opacity: isCurrentMonth ? 1 : 0.25,
                      cursor: isCurrentMonth ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? 'var(--accent)' : isToday ? '#FFFBF0' : 'transparent',
                      fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400,
                      color: isSelected ? '#fff' : isToday ? '#D97706' : 'var(--text)',
                    }}>
                      {day.getDate()}
                    </div>
                    {/* Event dots */}
                    <div style={{ display: 'flex', gap: 2, marginTop: 2, minHeight: 6 }}>
                      {posts.slice(0, 3).map(post => (
                        <div key={post.id} style={{ width: 4, height: 4, borderRadius: '50%', background: projectColorMap[post.projectId] ?? '#6366F1' }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Agenda: posts for selected day */}
          <div>
            {(() => {
              const selectedDate = new Date(selectedDay + 'T12:00:00')
              const dayLabel = selectedDay === today ? 'Сегодня' : selectedDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
              const posts = postsByDate[selectedDay] ?? []
              return (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10, textTransform: selectedDay === today ? 'none' : 'capitalize' }}>
                    {dayLabel}
                  </p>
                  {posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                      Постов нет
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {posts.map(post => {
                        const color = projectColorMap[post.projectId] ?? '#6366F1'
                        const sc = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.DRAFT
                        return (
                          <Link key={post.id} href={`/project/${post.projectId}/channel/${post.channelId}`} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start', borderLeft: `3px solid ${color}` }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{post.projectName} · {post.channelName}</p>
                              </div>
                              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>{sc.label}</span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>

        {/* Summary (desktop only) */}
        <div className="calendar-desktop-grid" style={{ marginTop: 20, display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-muted)' }}>
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
            return count > 0 ? <span key={key}><span style={{ color: s.color, fontWeight: 600 }}>{s.label}: {count}</span></span> : null
          })}
        </div>
      </div>
    </div>
  )
}
