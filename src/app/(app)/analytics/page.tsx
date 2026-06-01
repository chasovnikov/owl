import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Gradient pairs for projects — synced with dashboard PROJECT_PALETTES
const GRAD_COLORS = [
  ['#5B6AF0', '#9B6BFF'],
  ['#059669', '#10B981'],
  ['#F59E0B', '#F97316'],
  ['#EF4444', '#EC4899'],
  ['#0EA5E9', '#6366F1'],
  ['#8B5CF6', '#D946EF'],
]

// KPI accent icons (ClickUp-style colored badges)
const KPI_META: { color: string; bg: string; icon: React.ReactNode }[] = [
  { color: '#5B6AF0', bg: 'rgba(91,106,240,0.10)', icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="2" rx="1" fill="currentColor" opacity="0.85"/><rect x="1" y="7" width="10" height="2" rx="1" fill="currentColor" opacity="0.5"/><rect x="1" y="11" width="12" height="2" rx="1" fill="currentColor" opacity="0.3"/></svg> },
  { color: '#0EA5E9', bg: 'rgba(14,165,233,0.10)', icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="8" r="1.8" fill="currentColor" stroke="none"/></svg> },
  { color: '#EC4899', bg: 'rgba(236,72,153,0.10)', icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 14s-5.5-3.5-5.5-7.2A3.3 3.3 0 0 1 8 4.5a3.3 3.3 0 0 1 5.5 2.3C13.5 10.5 8 14 8 14z"/></svg> },
  { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2h8a1 1 0 0 1 1 1v11l-5-3-5 3V3a1 1 0 0 1 1-1z"/></svg> },
]

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

export default async function AnalyticsPage() {
  const user = await getSession()
  if (!user) redirect('/')

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      channels: {
        include: {
          rubrics: {
            include: {
              posts: {
                include: { result: true },
              },
            },
          },
        },
      },
    },
  })

  // ── Global totals ──
  let totalPosts = 0
  let totalPublished = 0
  let totalViews = 0
  let totalLikes = 0
  let totalComments = 0
  let totalSaves = 0

  // ── Per-project stats ──
  type ProjectStat = {
    id: string
    name: string
    businessType: string
    colorIdx: number
    posts: number
    published: number
    views: number
    likes: number
    comments: number
    saves: number
    engagement: number
    topRubric: { id: string; title: string; engagement: number } | null
  }

  // ── Top rubrics across all projects ──
  type RubricStat = {
    id: string
    title: string
    projectName: string
    projectId: string
    published: number
    views: number
    likes: number
    comments: number
    saves: number
    engagement: number
  }

  const projectStats: ProjectStat[] = []
  const rubricStats: RubricStat[] = []

  projects.forEach((project, idx) => {
    let pPosts = 0, pPublished = 0, pViews = 0, pLikes = 0, pComments = 0, pSaves = 0
    let topRubric: ProjectStat['topRubric'] = null

    project.channels.forEach(channel => {
      channel.rubrics.forEach(rubric => {
        let rViews = 0, rLikes = 0, rComments = 0, rSaves = 0, rPublished = 0

        rubric.posts.forEach(post => {
          pPosts++
          totalPosts++
          if (post.posted || post.status === 'PUBLISHED') {
            pPublished++
            totalPublished++
            rPublished++
          }
          if (post.result) {
            pViews    += post.result.views
            pLikes    += post.result.likes
            pComments += post.result.comments
            pSaves    += post.result.saves
            totalViews    += post.result.views
            totalLikes    += post.result.likes
            totalComments += post.result.comments
            totalSaves    += post.result.saves
            rViews    += post.result.views
            rLikes    += post.result.likes
            rComments += post.result.comments
            rSaves    += post.result.saves
          }
        })

        const rEng = rLikes + rComments + rSaves
        if (rubric.posts.length > 0) {
          rubricStats.push({
            id: rubric.id,
            title: rubric.title,
            projectName: project.name,
            projectId: project.id,
            published: rPublished,
            views: rViews,
            likes: rLikes,
            comments: rComments,
            saves: rSaves,
            engagement: rEng,
          })
          if (!topRubric || rEng > topRubric.engagement) {
            topRubric = { id: rubric.id, title: rubric.title, engagement: rEng }
          }
        }
      })
    })

    const pEng = pLikes + pComments + pSaves
    projectStats.push({
      id: project.id,
      name: project.name,
      businessType: project.businessType,
      colorIdx: idx,
      posts: pPosts,
      published: pPublished,
      views: pViews,
      likes: pLikes,
      comments: pComments,
      saves: pSaves,
      engagement: pEng,
      topRubric,
    })
  })

  // Sort rubrics by engagement
  rubricStats.sort((a, b) => b.engagement - a.engagement)
  const topRubrics = rubricStats.slice(0, 5)

  const totalEngagement = totalLikes + totalComments + totalSaves
  const publishRate = totalPosts > 0 ? Math.round((totalPublished / totalPosts) * 100) : 0

  const hasData = totalPosts > 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Page header */}
      <div className="page-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Аналитика
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {hasData ? `${fmt(totalEngagement)} вовлечённости за всё время` : 'Метрики появятся после первых публикаций'}
          </p>
        </div>
        <span className="hide-mobile" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {projects.length} {projects.length === 1 ? 'проект' : projects.length < 5 ? 'проекта' : 'проектов'}
        </span>
      </div>

      <div className="page-content" style={{ maxWidth: 860 }}>

        {/* ── Global KPI strip ── */}
        <div
          className="anim-slide-up"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 28,
          }}
        >
          {[
            { label: 'Постов',       value: fmt(totalPosts),       sub: `${publishRate}% опубликовано` },
            { label: 'Просмотры',    value: fmt(totalViews),       sub: 'суммарно' },
            { label: 'Лайки',        value: fmt(totalLikes),       sub: 'суммарно' },
            { label: 'Сохранения',   value: fmt(totalSaves),       sub: 'суммарно' },
          ].map((s, i) => {
            const m = KPI_META[i]
            return (
              <div
                key={s.label}
                className={`card anim-slide-up d${i}`}
                style={{ padding: '16px 18px' }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 9, marginBottom: 12,
                  background: m.bg, color: m.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.icon}
                </div>
                <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{s.label}</p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.sub}</p>
              </div>
            )
          })}
        </div>

        {!hasData && (
          <div className="card anim-slide-up d1" style={{ padding: 40, textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--accent-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: 'var(--accent)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="13" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.7"/>
                <rect x="10" y="8" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="1.7"/>
                <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.7"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Нет данных пока</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Опубликуй первые посты и добавь метрики — здесь появится аналитика
            </p>
          </div>
        )}

        {/* ── Two columns ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* Left: Projects breakdown */}
          <div className="anim-slide-up d2">
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 12 }}>
              По проектам
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projectStats.length === 0 && (
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет проектов</p>
                </div>
              )}
              {projectStats.map(proj => {
                const [c1, c2] = GRAD_COLORS[proj.colorIdx % GRAD_COLORS.length]
                const barW = totalPosts > 0 ? (proj.published / totalPublished) * 100 : 0
                return (
                  <Link
                    key={proj.id}
                    href={`/project/${proj.id}`}
                    className="card card-hover"
                    style={{ padding: '16px 18px', textDecoration: 'none', display: 'block' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: `linear-gradient(135deg, ${c1}, ${c2})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#fff',
                      }}>
                        {proj.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {proj.name}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{proj.businessType}</p>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--accent)', flexShrink: 0 }}>
                        <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>

                    {/* Metrics grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
                      {[
                        { l: 'Постов',     v: proj.published },
                        { l: 'Лайки',      v: proj.likes },
                        { l: 'Сохранения', v: proj.saves },
                      ].map(m => (
                        <div key={m.l} style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(m.v)}</p>
                          <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{m.l}</p>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar relative to all projects */}
                    {totalPublished > 0 && (
                      <>
                        <div style={{ height: 3, background: 'var(--border-color)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${barW}%`, background: `linear-gradient(90deg, ${c1}, ${c2})`, borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                        </div>
                        <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                          {Math.round(barW)}% от всех опубликованных постов
                        </p>
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right: Top rubrics */}
          <div className="anim-slide-up d3">
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 12 }}>
              Топ рубрики
            </p>

            {topRubrics.length === 0 ? (
              <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Нет данных</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topRubrics.map((r, i) => {
                  const projIdx = projects.findIndex(p => p.id === r.projectId)
                  const [c1] = GRAD_COLORS[projIdx % GRAD_COLORS.length]
                  const maxEng = topRubrics[0].engagement || 1
                  const pct = (r.engagement / maxEng) * 100
                  return (
                    <Link
                      key={r.id}
                      href={`/rubric/${r.id}/results`}
                      className="card card-hover"
                      style={{ padding: '14px 16px', textDecoration: 'none', display: 'block' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          background: 'var(--accent-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: 'var(--accent)',
                        }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.title}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.projectName}</p>
                        </div>
                      </div>

                      {/* Engagement bar */}
                      <div style={{ height: 3, background: 'var(--border-color)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: c1, borderRadius: 99 }} />
                      </div>

                      <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-muted)' }}>
                        <span>❤️ {fmt(r.likes)}</span>
                        <span>💬 {fmt(r.comments)}</span>
                        <span>🔖 {fmt(r.saves)}</span>
                        {r.views > 0 && <span>👁 {fmt(r.views)}</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Engagement summary */}
            {totalEngagement > 0 && (
              <div
                className="anim-slide-up d4"
                style={{
                  marginTop: 12, padding: '14px 16px', borderRadius: 'var(--r-lg)',
                  background: 'linear-gradient(135deg, rgba(91,106,240,0.06), rgba(155,107,255,0.06))',
                  border: '1px solid var(--accent-ring)',
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  ✦ Суммарный охват
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'Engagement', v: fmt(totalEngagement) },
                    { l: 'Комментарии', v: fmt(totalComments) },
                    { l: 'Просмотры', v: fmt(totalViews) },
                    { l: 'Публикации', v: String(totalPublished) },
                  ].map(m => (
                    <div key={m.l}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{m.v}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
