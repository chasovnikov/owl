'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OWLLogo } from './OwlLogo'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'

interface PostIdea { id: string }
interface Hypothesis { id: string; title: string; postIdeas: PostIdea[] }
interface Platform { hypotheses: Hypothesis[] }
interface Project { id: string; name: string; businessType: string; platforms: Platform[] }

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="11" height="11" viewBox="0 0 12 12" fill="none"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
    >
      <path d="M4 2.5L8 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const rowBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '4px 8px', borderRadius: 6,
  cursor: 'pointer', fontSize: 13,
  color: 'var(--text-secondary)', textDecoration: 'none',
  transition: 'background 0.1s, color 0.1s',
  userSelect: 'none', border: 'none',
  background: 'transparent', width: '100%', textAlign: 'left',
}

export default function Sidebar({ projects, userEmail, userName, userAvatar }: { projects: Project[]; userEmail: string; userName?: string | null; userAvatar?: string | null }) {
  const pathname = usePathname()
  const { lang } = useLang()
  const tr = translations[lang]
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.filter(p => pathname.includes(p.id)).map(p => p.id))
  )
  const [expandedHypotheses, setExpandedHypotheses] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState(false)

  function toggleProject(id: string) {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleHypothesis(id: string) {
    setExpandedHypotheses(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (collapsed) {
    return (
      <div style={{ position: 'fixed', top: 14, left: 14, zIndex: 100 }}>
        <button
          onClick={() => setCollapsed(false)}
          title="Open sidebar"
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: 'var(--surface)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div style={{
      width: 220, borderRight: '1px solid var(--border-color)',
      background: 'var(--surface)', display: 'flex', flexDirection: 'column',
      flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <OWLLogo />
          </Link>
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse"
            style={{ ...rowBase, width: 26, height: 26, padding: 0, justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L5 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        {/* User row — click to open settings */}
        <Link
          href="/settings"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
            borderRadius: 6, textDecoration: 'none', transition: 'background 0.1s',
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle, #f4f4f5)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{
            width: 20, height: 20, borderRadius: 5, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
            overflow: 'hidden',
          }}>
            {userAvatar
              ? <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (userName || userEmail)[0].toUpperCase()
            }
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {userName || userEmail}
          </p>
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>

      {/* Nav */}
      <div style={{ padding: '8px', flex: 1 }}>
        <Link href="/dashboard" style={{
          ...rowBase, textDecoration: 'none', marginBottom: 2,
          color: pathname === '/dashboard' ? 'var(--text)' : 'var(--text-secondary)',
          background: pathname === '/dashboard' ? '#18181B' : 'transparent',
          ...(pathname === '/dashboard' ? { color: '#fff' } : {}),
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <rect x="8" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <rect x="1" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <rect x="8" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
          {tr.allProjects}
        </Link>

        <Link href="/calendar" style={{
          ...rowBase, textDecoration: 'none', marginBottom: 4,
          color: pathname === '/calendar' ? 'var(--text)' : 'var(--text-secondary)',
          background: pathname === '/calendar' ? '#18181B' : 'transparent',
          ...(pathname === '/calendar' ? { color: '#fff' } : {}),
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M1 6h12" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M4 1v2M10 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <circle cx="4.5" cy="9" r="0.8" fill="currentColor"/>
            <circle cx="7" cy="9" r="0.8" fill="currentColor"/>
            <circle cx="9.5" cy="9" r="0.8" fill="currentColor"/>
          </svg>
          Calendar
        </Link>

        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '8px 8px 4px' }}>
          {tr.projects}
        </p>

        {projects.map(project => {
          const hypotheses = project.platforms[0]?.hypotheses ?? []
          const isProjectActive = pathname.includes(project.id)
          const isExpanded = expandedProjects.has(project.id)

          return (
            <div key={project.id} style={{ marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', borderRadius: 6, background: isProjectActive ? '#18181B' : 'transparent' }}>
                <button
                  onClick={() => toggleProject(project.id)}
                  style={{ ...rowBase, flex: 1, color: isProjectActive ? '#fff' : 'var(--text-secondary)', background: 'transparent', gap: 5 }}
                >
                  <ChevronIcon open={isExpanded} />
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <rect x="1" y="1" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M4 5h6M4 7.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: isProjectActive ? 500 : 400 }}>
                    {project.name}
                  </span>
                </button>
                <Link
                  href={`/project/${project.id}`}
                  style={{ padding: '4px 6px', color: isProjectActive ? '#fff' : 'var(--text-muted)', textDecoration: 'none', flexShrink: 0, borderRadius: 4, opacity: 0.6 }}
                  title="Open"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>

              {isExpanded && (
                <div style={{ marginLeft: 18, borderLeft: '1px solid var(--border-color)', paddingLeft: 8, marginTop: 2 }}>
                  {hypotheses.length === 0 && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '3px 8px' }}>{tr.noHypotheses}</p>
                  )}
                  {hypotheses.map(h => {
                    const isHActive = pathname.includes(h.id)
                    const isHExpanded = expandedHypotheses.has(h.id)
                    return (
                      <div key={h.id} style={{ marginBottom: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 6, background: isHActive ? '#18181B' : 'transparent' }}>
                          <button
                            onClick={() => toggleHypothesis(h.id)}
                            style={{ ...rowBase, flex: 1, fontSize: 12, color: isHActive ? '#fff' : 'var(--text-secondary)', background: 'transparent', gap: 5 }}
                          >
                            <ChevronIcon open={isHExpanded} />
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                              <path d="M6 4v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isHActive ? 500 : 400 }}>
                              {h.title}
                            </span>
                          </button>
                          <Link
                            href={`/hypothesis/${h.id}`}
                            style={{ padding: '4px 6px', color: isHActive ? '#fff' : 'var(--text-muted)', textDecoration: 'none', flexShrink: 0, borderRadius: 4, opacity: 0.6 }}
                            title="Open"
                          >
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </Link>
                        </div>
                        {isHExpanded && (
                          <div style={{ marginLeft: 16, paddingLeft: 8, borderLeft: '1px solid var(--border-color)', marginBottom: 4 }}>
                            <Link href={`/hypothesis/${h.id}`} style={{ ...rowBase, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', gap: 6 }}>
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                                <path d="M3.5 4.5h5M3.5 6.5h3.5M3.5 8.5h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                              </svg>
                              {tr.postsCount(h.postIdeas.length)}
                            </Link>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        <Link href="/dashboard" style={{ ...rowBase, marginTop: 8, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {tr.newProject}
        </Link>
      </div>

    </div>
  )
}
