import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createProjectAction } from '@/lib/actions'
import { getT } from '@/lib/lang-server'
import DeleteProjectButton from '@/components/DeleteProjectButton'

const BUSINESS_TYPES = [
  { value: 'coffee shop',        labelKey: 'bt_coffee_shop' },
  { value: 'restaurant',         labelKey: 'bt_restaurant' },
  { value: 'local business',     labelKey: 'bt_local_business' },
  { value: 'personal brand',     labelKey: 'bt_personal_brand' },
  { value: 'agency',             labelKey: 'bt_agency' },
  { value: 'e-commerce',         labelKey: 'bt_ecommerce' },
  { value: 'online creator',     labelKey: 'bt_online_creator' },
  { value: 'startup',            labelKey: 'bt_startup' },
  { value: 'education',          labelKey: 'bt_education' },
  { value: 'fitness / wellness', labelKey: 'bt_fitness' },
  { value: 'other',              labelKey: 'bt_other' },
] as const

// Rich gradients per project (AirBnB cover-card energy)
const PROJECT_PALETTES = [
  { g1: '#5B6AF0', g2: '#9B6BFF', bg: 'rgba(91,106,240,0.06)'  },
  { g1: '#059669', g2: '#10B981', bg: 'rgba(5,150,105,0.06)'   },
  { g1: '#F59E0B', g2: '#F97316', bg: 'rgba(245,158,11,0.06)'  },
  { g1: '#EF4444', g2: '#EC4899', bg: 'rgba(239,68,68,0.06)'   },
  { g1: '#0EA5E9', g2: '#6366F1', bg: 'rgba(14,165,233,0.06)'  },
  { g1: '#8B5CF6', g2: '#D946EF', bg: 'rgba(139,92,246,0.06)'  },
]

// Telegram-style: platform-specific brand colors
const PLATFORM_META: Record<string, { color: string; icon: React.ReactNode }> = {
  instagram: {
    color: '#E1306C',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  tiktok: {
    color: '#010101',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.02-.07z"/>
      </svg>
    ),
  },
  telegram: {
    color: '#2AABEE',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.5l-2.95-.924c-.64-.203-.658-.64.135-.953l11.566-4.458c.537-.194 1.006.131.973.956z"/>
      </svg>
    ),
  },
  youtube: {
    color: '#FF0000',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
      </svg>
    ),
  },
  vk: {
    color: '#2787F5',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.162 18.994c.609 0 .858-.406.851-1.003-.031-1.888 1.083-2.938 2.798-1.217 1.124 1.145 1.679 1.973 2.798 1.973h2.314c.842 0 1.077-.379.689-1.004-.378-.617-1.504-1.894-2.486-2.868l-.022-.02c-.826-.851-.945-1.4-.26-2.36.798-1.1 2.147-2.946 2.88-4.131.387-.648.155-1.074-.598-1.074h-2.314c-.793 0-1.077.379-1.419.999-.786 1.38-2.048 3.27-2.796 4.31-.483.663-.88.891-1.184.891-.255 0-.608-.228-.608-.868V5.994c0-.786-.247-1.122-1.077-1.122H10.9c-.638 0-1.077.438-1.077 1.005 0 .753.981 1.053.981 3.103V12.3c0 .868-.244 1.029-.622 1.029-.962 0-2.952-3.027-3.798-5.614C6.084 6.79 5.756 5.875 4.916 5.875H2.602C1.776 5.875 1.5 6.254 1.5 6.874c0 1.243 2.647 7.764 5.666 11.22 2.747 3.146 6.024 3.014 7.996 2.9z"/>
      </svg>
    ),
  },
  threads: {
    color: '#101010',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.473 12.01v-.017c.027-3.579.877-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.773 6.827 2.24 1.697 1.404 2.767 3.376 3.186 5.864l-2.followedBy.47.074c-.79-4.166-3.52-6.4-7.536-6.402-2.685.019-4.775.966-6.212 2.78-1.289 1.623-1.948 4.031-1.968 7.156.02 3.125.679 5.532 1.968 7.156 1.437 1.814 3.527 2.761 6.212 2.78 2.742-.018 4.564-.724 5.96-2.138 1.598-1.617 2.052-4.17 2.052-6.98 0-.3-.009-.593-.027-.88h-7.885v-2.258h10.297l.022.452c.065 1.256.03 2.485-.223 3.68-.537 2.536-1.735 4.559-3.491 5.828-1.631 1.177-3.642 1.794-5.982 1.835z"/>
      </svg>
    ),
  },
}

function getPlatformMeta(name: string) {
  const key = name.toLowerCase().trim()
  return PLATFORM_META[key] ?? {
    color: '#8888A8',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 8v4l2.5 2.5"/>
      </svg>
    ),
  }
}

export default async function DashboardPage() {
  const user = await getSession()
  if (!user) redirect('/')

  const tr = getT()

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      channels: {
        include: { rubrics: { include: { posts: true } } },
      },
    },
  })

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 6)  return 'Доброй ночи'
    if (h < 12) return 'Доброе утро'
    if (h < 18) return 'Добрый день'
    return 'Добрый вечер'
  })()
  const firstName = user.name?.split(' ')[0] ?? null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Page header ── */}
      <div className="page-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {greeting}{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {projects.length > 0
              ? `У тебя ${projects.length} ${projects.length === 1 ? 'проект' : projects.length < 5 ? 'проекта' : 'проектов'}`
              : 'Создай первый проект'}
          </p>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tr.dashboardSubtitle}</span>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>

          {/* ── Project cards ── */}
          {projects.map((project, idx) => {
            const hypothesisCount = project.channels.reduce((a, ch) => a + ch.rubrics.length, 0)
            const postCount = project.channels.reduce((a, ch) => a + ch.rubrics.reduce((b, r) => b + r.posts.length, 0), 0)
            const strategy = project.strategyRecommendation ? JSON.parse(project.strategyRecommendation) : null
            const href = project.channels[0]
              ? `/project/${project.id}/channel/${project.channels[0].id}`
              : `/project/${project.id}`
            const palette = PROJECT_PALETTES[idx % PROJECT_PALETTES.length]

            return (
              <Link
                key={project.id}
                href={href}
                className={`project-card anim-slide-up d${Math.min(idx, 8)}`}
              >

                {/* ── AirBnB-style cover ── */}
                <div style={{
                  height: 80,
                  background: `linear-gradient(135deg, ${palette.g1} 0%, ${palette.g2} 100%)`,
                  position: 'relative',
                  flexShrink: 0,
                }}>
                  {/* Subtle noise texture overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
                    borderRadius: 0,
                    opacity: 0.5,
                  }} />

                  {/* Delete button top-right */}
                  <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
                    <DeleteProjectButton projectId={project.id} light />
                  </div>

                  {/* Avatar overlapping cover/body */}
                  <div style={{
                    position: 'absolute', bottom: -20, left: 20,
                    width: 48, height: 48,
                    borderRadius: 14,
                    background: 'var(--surface)',
                    boxShadow: `0 0 0 3px var(--surface), 0 4px 12px rgba(0,0,0,0.12)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 700,
                    color: palette.g1,
                    zIndex: 1,
                    userSelect: 'none',
                  }}>
                    {project.name[0].toUpperCase()}
                  </div>
                </div>

                {/* ── Card body ── */}
                <div style={{ padding: '28px 20px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>

                  {/* Name + business type */}
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 3 }}>
                      {project.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize', letterSpacing: '0.01em' }}>
                      {project.businessType}
                    </p>
                  </div>

                  {/* Strategy summary */}
                  {strategy?.strategySummary ? (
                    <p style={{
                      fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    } as React.CSSProperties}>
                      {strategy.strategySummary}
                    </p>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 14, lineHeight: 1.6 }}>
                      Стратегия не создана
                    </p>
                  )}

                  {/* Telegram-style channel chips */}
                  {project.channels.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                      {project.channels.slice(0, 3).map(ch => {
                        const meta = getPlatformMeta(ch.name)
                        return (
                          <span key={ch.id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px 3px 6px',
                            borderRadius: 99,
                            background: `${meta.color}14`,
                            border: `1px solid ${meta.color}28`,
                            color: meta.color,
                            fontSize: 11, fontWeight: 500,
                          }}>
                            {meta.icon}
                            {ch.name}
                          </span>
                        )
                      })}
                      {project.channels.length > 3 && (
                        <span style={{
                          padding: '3px 8px', borderRadius: 99, fontSize: 11,
                          background: 'var(--bg)', color: 'var(--text-muted)',
                          border: '1px solid var(--border-color)',
                        }}>
                          +{project.channels.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── ClickUp-style stats footer ── */}
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {/* Rubrics stat */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: palette.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                            <rect x="1" y="1" width="6" height="6" rx="1.5" fill={palette.g1} opacity="0.8"/>
                            <rect x="9" y="1" width="6" height="6" rx="1.5" fill={palette.g1} opacity="0.5"/>
                            <rect x="1" y="9" width="6" height="6" rx="1.5" fill={palette.g1} opacity="0.5"/>
                            <rect x="9" y="9" width="6" height="6" rx="1.5" fill={palette.g1} opacity="0.3"/>
                          </svg>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {hypothesisCount} {hypothesisCount === 1 ? 'рубрика' : hypothesisCount < 5 ? 'рубрики' : 'рубрик'}
                        </span>
                      </div>

                      {/* Posts stat */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: palette.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                            <rect x="1" y="3" width="14" height="2" rx="1" fill={palette.g1} opacity="0.8"/>
                            <rect x="1" y="7" width="10" height="2" rx="1" fill={palette.g1} opacity="0.5"/>
                            <rect x="1" y="11" width="12" height="2" rx="1" fill={palette.g1} opacity="0.3"/>
                          </svg>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {postCount} {postCount === 1 ? 'пост' : postCount < 5 ? 'поста' : 'постов'}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: palette.g1, fontSize: 12, fontWeight: 600,
                    }}>
                      Открыть
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M5 3l4 3.5L5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                </div>
              </Link>
            )
          })}

          {/* ── Create new project card ── */}
          <div
            className="anim-slide-up"
            style={{
              animationDelay: `${Math.min(projects.length, 8) * 50}ms`,
              background: 'var(--surface)',
              border: '1.5px dashed rgba(91,106,240,0.25)',
              borderRadius: 16,
              padding: 24,
              display: 'flex', flexDirection: 'column',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                Новый проект
              </p>
            </div>
            <form action={createProjectAction} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="text" name="name" placeholder="Название проекта" required className="input" style={{ height: 38, fontSize: 13 }} />
              <input
                type="text"
                name="businessType"
                required
                className="input"
                placeholder="Тип бизнеса..."
                list="business-types-list"
                style={{ height: 38, fontSize: 13 }}
              />
              <datalist id="business-types-list">
                {BUSINESS_TYPES.map(bt => <option key={bt.value} value={bt.value} />)}
              </datalist>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 38, marginTop: 2 }}>
                Создать проект
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
