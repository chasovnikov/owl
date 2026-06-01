'use client'

import { useState } from 'react'
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
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
      style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
      <path d="M3.5 2L7 5L3.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Gradient colors per project index
const GRAD_COLORS = [
  ['#5B6AF0', '#9B6BFF'],
  ['#10B981', '#34D399'],
  ['#F59E0B', '#FCD34D'],
  ['#EF4444', '#F97316'],
  ['#06B6D4', '#3B82F6'],
]

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
  const [showCreateModal, setShowCreateModal] = useState(false)

  function toggleProject(id: string) {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const initials = (userName || userEmail)[0].toUpperCase()
  const isDashboard = pathname === '/dashboard'
  const isCalendar  = pathname === '/calendar'
  const isAnalytics = pathname === '/analytics'
  const isSettings  = pathname === '/settings'

  return (
    <>
      <div className="sidebar">

        {/* ── Logo + User ── */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: 12 }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <FumiLogo />
            </Link>
          </div>

          {/* User row */}
          <Link
            href="/settings"
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 8px', borderRadius: 10,
              textDecoration: 'none', transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, #5B6AF0, #9B6BFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden',
            }}>
              {userAvatar
                ? <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {userName || userEmail}
              </p>
              {userName && (
                <p style={{ fontSize: 10, color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {userEmail}
                </p>
              )}
            </div>
          </Link>
        </div>

        {/* ── Nav ── */}
        <div style={{ padding: '10px 10px', flex: 1 }}>

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`nav-item${isDashboard ? ' active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, opacity: isDashboard ? 1 : 0.7 }}>
              <path d="M1.5 6.5L7.5 1.5L13.5 6.5V13H9.5V9.5H5.5V13H1.5V6.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            <span>Dashboard</span>
          </Link>

          {/* Calendar */}
          <Link
            href="/calendar"
            className={`nav-item${isCalendar ? ' active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, opacity: isCalendar ? 1 : 0.7 }}>
              <rect x="1" y="2" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M1 6h13" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 1v2M10 1v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span>{tr.calendar}</span>
          </Link>

          {/* Analytics */}
          <Link
            href="/analytics"
            className={`nav-item${isAnalytics ? ' active' : ''}`}
            style={{ textDecoration: 'none', marginBottom: 6 }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, opacity: isAnalytics ? 1 : 0.7 }}>
              <rect x="1" y="8"  width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="6" y="5"  width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="11" y="1" width="3" height="13" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            <span>Аналитика</span>
          </Link>

          {/* Projects section header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 10px 5px',
          }}>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
            }}>
              {tr.projects}
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              title={tr.newProject}
              style={{
                width: 18, height: 18, border: 'none', background: 'transparent',
                cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 4, transition: 'color 0.1s, background 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Project list */}
          {projects.map((project, idx) => {
            const isExpanded = expandedProjects.has(project.id)
            const isProjectActive = pathname.includes(project.id) && !pathname.includes('/channel/')
            const [c1, c2] = GRAD_COLORS[idx % GRAD_COLORS.length]

            return (
              <div key={project.id} style={{ marginBottom: 1 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', borderRadius: 8,
                  background: isProjectActive ? 'var(--accent-light)' : 'transparent',
                }}>
                  {/* Chevron toggle */}
                  <button
                    onClick={() => toggleProject(project.id)}
                    style={{
                      width: 24, flexShrink: 0, border: 'none', background: 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', height: 34,
                      color: isProjectActive ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    <ChevronIcon open={isExpanded} />
                  </button>

                  {/* Project link */}
                  <Link
                    href={`/project/${project.id}`}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 7,
                      height: 34, padding: '0 6px 0 2px', borderRadius: 8,
                      textDecoration: 'none', fontSize: 13,
                      color: isProjectActive ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: isProjectActive ? 500 : 400,
                      background: 'transparent', overflow: 'hidden',
                    }}
                    onClick={() => { if (!isExpanded) toggleProject(project.id) }}
                    onMouseEnter={e => { if (!isProjectActive) e.currentTarget.style.color = 'var(--text)' }}
                    onMouseLeave={e => { if (!isProjectActive) e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                      background: isProjectActive ? `linear-gradient(135deg, ${c1}, ${c2})` : 'var(--bg)',
                      border: '1px solid var(--border-medium)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 700,
                      color: isProjectActive ? '#fff' : 'var(--text-muted)',
                    }}>
                      {project.name[0].toUpperCase()}
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {project.name}
                    </span>
                  </Link>
                </div>

                {/* Channels */}
                {isExpanded && (
                  <div style={{
                    marginLeft: 22, paddingLeft: 8,
                    borderLeft: '1px solid var(--border-color)',
                    marginBottom: 4, marginTop: 2,
                  }}>
                    {project.channels.length === 0 && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px' }}>
                        {tr.noChannels}
                      </p>
                    )}
                    {project.channels.map(channel => {
                      const channelPath = `/project/${project.id}/channel/${channel.id}`
                      const isChannelActive = pathname.startsWith(channelPath)
                      return (
                        <Link
                          key={channel.id}
                          href={channelPath}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            height: 30, padding: '0 8px', borderRadius: 8,
                            textDecoration: 'none', fontSize: 12,
                            color: isChannelActive ? 'var(--accent)' : 'var(--text-secondary)',
                            background: isChannelActive ? 'var(--accent-light)' : 'transparent',
                            fontWeight: isChannelActive ? 500 : 400,
                            transition: 'background 0.12s, color 0.12s',
                          }}
                          onMouseEnter={e => { if (!isChannelActive) { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)' } }}
                          onMouseLeave={e => { if (!isChannelActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
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

        {/* ── Settings bottom ── */}
        <div style={{ padding: '10px 10px 14px', borderTop: '1px solid var(--border-color)' }}>
          <Link
            href="/settings"
            className={`nav-item${isSettings ? ' active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, opacity: isSettings ? 1 : 0.7 }}>
              <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.2 3.2l1.1 1.1M10.7 10.7l1.1 1.1M3.2 11.8l1.1-1.1M10.7 4.3l1.1-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span>Settings</span>
          </Link>
        </div>

      </div>

      {/* Create project modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false) }}
        >
          <div className="card anim-pop-in" style={{ width: 400, padding: 28, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                {tr.newProjectCard}
              </p>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 26, height: 26, borderRadius: 7, transition: 'background 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)' }}
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
