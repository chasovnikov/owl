'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FumiLogo } from './OwlLogo'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'
import { createProjectAction } from '@/lib/actions'

const BUSINESS_TYPES = [
  'coffee shop', 'restaurant', 'local business', 'personal brand',
  'agency', 'e-commerce', 'online creator', 'startup', 'education',
  'fitness / wellness', 'other',
]

interface Post { id: string }
interface Rubric { id: string; title: string; posts: Post[] }
interface Channel { id: string; name: string; rubrics: Rubric[] }
interface Project { id: string; name: string; businessType: string; channels: Channel[] }

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
    </svg>
  ),
  youtube: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="4"/>
      <polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none"/>
    </svg>
  ),
  threads: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 3C7 3 4 7 4 12s3 9 8 9c4 0 8-3 8-8 0-2-1-3.5-2.5-4S14 8 12 9"/>
    </svg>
  ),
  default: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 8v4l2.5 2.5" strokeLinecap="round"/>
    </svg>
  ),
}

function getPlatformIcon(name: string) {
  const key = name.toLowerCase()
  return PLATFORM_ICONS[key] ?? PLATFORM_ICONS.default
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s', flexShrink: 0 }}>
      <path d="M4 2.5L8 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const rowBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '5px 10px', borderRadius: 10,
  cursor: 'pointer', fontSize: 13,
  color: 'var(--text-secondary)', textDecoration: 'none',
  transition: 'background 0.12s, color 0.12s',
  userSelect: 'none', border: 'none',
  background: 'transparent', width: '100%', textAlign: 'left',
  fontWeight: 400,
}

export default function Sidebar({
  projects,
  userEmail,
  userName,
  userAvatar,
}: {
  projects: Project[]
  userEmail: string
  userName?: string | null
  userAvatar?: string | null
}) {
  const pathname = usePathname()
  const { lang } = useLang()
  const tr = translations[lang]
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.filter(p => pathname.includes(p.id)).map(p => p.id))
  )
  const [collapsed, setCollapsed] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectsHidden, setProjectsHidden] = useState(false)

  function toggleProject(id: string) {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleProjectsVisibility() {
    if (projectsHidden) {
      // Раскрыть — показать проекты, но без каналов
      setExpandedProjects(new Set())
      setProjectsHidden(false)
    } else {
      // Скрыть весь список проектов
      setProjectsHidden(true)
    }
  }

  if (collapsed) {
    return (
      <div style={{ position: 'fixed', top: 14, left: 14, zIndex: 100 }}>
        <button
          onClick={() => setCollapsed(false)}
          title="Open sidebar"
          style={{
            width: 34, height: 34, borderRadius: 10,
            border: '1px solid var(--border-color)',
            background: 'var(--surface)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    )
  }

  const initials = (userName || userEmail)[0].toUpperCase()

  return (
    <>
    <div style={{
      width: 224,
      borderRight: '1px solid var(--border-color)',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, height: '100vh',
      position: 'sticky', top: 0, overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 12px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <FumiLogo />
          </Link>
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse"
            style={{
              ...rowBase,
              width: 28, height: 28, padding: 0,
              justifyContent: 'center',
              color: 'var(--text-muted)', flexShrink: 0,
              borderRadius: 8,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L5 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* User row */}
        <Link
          href="/settings"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', borderRadius: 10,
            textDecoration: 'none', transition: 'background 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{
            width: 22, height: 22, borderRadius: 7,
            background: 'linear-gradient(135deg, #5B6AF0, #9B6BFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff',
            flexShrink: 0, overflow: 'hidden',
          }}>
            {userAvatar
              ? <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials
            }
          </div>
          <p style={{
            fontSize: 12, color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', flex: 1,
          }}>
            {userName || userEmail}
          </p>
        </Link>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-color)', margin: '0 12px' }} />

      {/* Nav */}
      <div style={{ padding: '10px 10px', flex: 1 }}>

        {/* Calendar */}
        <Link href="/calendar" style={{
          ...rowBase, textDecoration: 'none', marginBottom: 2,
          ...(pathname === '/calendar' ? {
            background: 'linear-gradient(135deg, rgba(91,106,240,0.12), rgba(155,107,255,0.10))',
            color: 'var(--accent)',
            fontWeight: 500,
          } : {}),
        }}
          onMouseEnter={e => { if (pathname !== '/calendar') e.currentTarget.style.background = 'var(--bg-subtle)' }}
          onMouseLeave={e => { if (pathname !== '/calendar') e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, opacity: pathname === '/calendar' ? 1 : 0.7 }}>
            <rect x="1" y="2" width="12" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M1 6h12" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M4 1v2M10 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <circle cx="4.5" cy="9" r="0.7" fill="currentColor"/>
            <circle cx="7" cy="9" r="0.7" fill="currentColor"/>
            <circle cx="9.5" cy="9" r="0.7" fill="currentColor"/>
          </svg>
          {tr.calendar}
        </Link>

        {/* Projects section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 10px 5px' }}>
          <Link
            href="/dashboard"
            style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
              color: pathname === '/dashboard' ? 'var(--accent)' : 'var(--text-muted)',
              margin: 0, textDecoration: 'none', cursor: 'pointer',
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.color = pathname === '/dashboard' ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            {tr.projects}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Hide/show projects list */}
            {projects.length > 0 && (
              <button
                onClick={toggleProjectsVisibility}
                title={projectsHidden ? 'Показать проекты' : 'Скрыть проекты'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 20, height: 20, borderRadius: 6,
                  color: 'var(--text-muted)', background: 'transparent',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
                  style={{ transform: projectsHidden ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}>
                  <path d="M2 4.5L6 8L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            {/* New project */}
            <button
              onClick={() => setShowCreateModal(true)}
              title={tr.newProject}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: 6,
                color: 'var(--text-muted)', background: 'transparent',
                border: 'none', cursor: 'pointer',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Project list */}
        {!projectsHidden && projects.map(project => {
          const isExpanded = expandedProjects.has(project.id)
          const isProjectActive = pathname.includes(project.id) && !pathname.includes('/channel/')

          return (
            <div key={project.id} style={{ marginBottom: 1 }}>
              <div style={{
                display: 'flex', alignItems: 'center', borderRadius: 10,
                background: isProjectActive
                  ? 'linear-gradient(135deg, rgba(91,106,240,0.12), rgba(155,107,255,0.10))'
                  : 'transparent',
              }}>
                <button
                  onClick={() => toggleProject(project.id)}
                  style={{
                    ...rowBase, width: 26, padding: '5px 4px 5px 7px', flex: 'none',
                    color: isProjectActive ? 'var(--accent)' : 'var(--text-muted)',
                    background: 'transparent', borderRadius: 10,
                  }}
                >
                  <ChevronIcon open={isExpanded} />
                </button>
                <Link
                  href={`/project/${project.id}`}
                  style={{
                    ...rowBase, flex: 1, gap: 6, textDecoration: 'none',
                    color: isProjectActive ? 'var(--accent)' : 'var(--text-secondary)',
                    background: 'transparent',
                    padding: '5px 10px 5px 2px',
                    fontWeight: isProjectActive ? 500 : 400,
                  }}
                  onClick={() => { if (!isExpanded) toggleProject(project.id) }}
                  onMouseEnter={e => { if (!isProjectActive) e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { if (!isProjectActive) e.currentTarget.style.color = 'var(--text-secondary)' }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 6,
                    background: isProjectActive
                      ? 'linear-gradient(135deg, #5B6AF0, #9B6BFF)'
                      : 'var(--bg-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700,
                    color: isProjectActive ? '#fff' : 'var(--text-secondary)',
                    flexShrink: 0,
                  }}>
                    {project.name[0].toUpperCase()}
                  </div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                    {project.name}
                  </span>
                </Link>
              </div>

              {/* Channels */}
              {isExpanded && (
                <div style={{
                  marginLeft: 16, paddingLeft: 10,
                  borderLeft: '1px solid var(--border-color)',
                  marginTop: 2, marginBottom: 3,
                }}>
                  {project.channels.length === 0 && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px' }}>{tr.noChannels}</p>
                  )}
                  {project.channels.map(channel => {
                    const channelPath = `/project/${project.id}/channel/${channel.id}`
                    const isChannelActive = pathname.startsWith(channelPath)
                    return (
                      <Link
                        key={channel.id}
                        href={channelPath}
                        style={{
                          ...rowBase, textDecoration: 'none', fontSize: 12,
                          color: isChannelActive ? 'var(--accent)' : 'var(--text-secondary)',
                          background: isChannelActive ? 'linear-gradient(135deg, rgba(91,106,240,0.10), rgba(155,107,255,0.08))' : 'transparent',
                          fontWeight: isChannelActive ? 500 : 400,
                          borderRadius: 8,
                        }}
                        onMouseEnter={e => { if (!isChannelActive) e.currentTarget.style.background = 'var(--bg-subtle)' }}
                        onMouseLeave={e => { if (!isChannelActive) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span style={{ color: isChannelActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {getPlatformIcon(channel.name)}
                        </span>
                        {channel.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

      </div>
    </div>

    {/* Create project modal */}
    {showCreateModal && (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false) }}
      >
        <div className="card" style={{ width: 380, padding: 28, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              {tr.newProjectCard}
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, borderRadius: 6, transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <form action={createProjectAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="text" name="name" placeholder={tr.projectNamePlaceholder} required className="input" />
            <input
              type="text"
              name="businessType"
              required
              className="input"
              placeholder={tr.businessTypePlaceholder}
              list="sidebar-business-types-list"
            />
            <datalist id="sidebar-business-types-list">
              {BUSINESS_TYPES.map(bt => <option key={bt} value={bt} />)}
            </datalist>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              {tr.createProject}
            </button>
          </form>
        </div>
      </div>
    )}
    </>
  )
}
