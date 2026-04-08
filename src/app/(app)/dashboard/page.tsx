import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createProjectAction } from '@/lib/actions'
import { getT } from '@/lib/lang-server'
import DeleteProjectButton from '@/components/DeleteProjectButton'

const PLATFORM_COLORS: Record<string, { bg: string; color: string }> = {
  instagram: { bg: '#FEE2E2', color: '#9D174D' },
  tiktok:    { bg: '#F3F4F6', color: '#111827' },
  youtube:   { bg: '#FEF2F2', color: '#991B1B' },
  telegram:  { bg: '#EFF6FF', color: '#1D4ED8' },
  vk:        { bg: '#EFF6FF', color: '#1E40AF' },
  threads:   { bg: '#F3F4F6', color: '#374151' },
}
function getPlatformBg(name: string) {
  return PLATFORM_COLORS[name.toLowerCase()]?.bg ?? '#F4F4F5'
}
function getPlatformColor(name: string) {
  return PLATFORM_COLORS[name.toLowerCase()]?.color ?? '#71717A'
}

const BUSINESS_TYPES = [
  { value: 'coffee shop', labelKey: 'bt_coffee_shop' },
  { value: 'restaurant', labelKey: 'bt_restaurant' },
  { value: 'local business', labelKey: 'bt_local_business' },
  { value: 'personal brand', labelKey: 'bt_personal_brand' },
  { value: 'agency', labelKey: 'bt_agency' },
  { value: 'e-commerce', labelKey: 'bt_ecommerce' },
  { value: 'online creator', labelKey: 'bt_online_creator' },
  { value: 'startup', labelKey: 'bt_startup' },
  { value: 'education', labelKey: 'bt_education' },
  { value: 'fitness / wellness', labelKey: 'bt_fitness' },
  { value: 'other', labelKey: 'bt_other' },
] as const

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-content">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.025em', marginBottom: 6 }}>{tr.dashboardTitle}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{tr.dashboardSubtitle}</p>
        </div>

        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {/* New project card — hidden on mobile (use FAB instead) */}
          <div className="card dashboard-create-card" style={{ padding: 24, border: '1.5px dashed var(--border-medium)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 18, color: 'var(--text)', letterSpacing: '-0.01em' }}>{tr.newProjectCard}</p>
            <form action={createProjectAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" name="name" placeholder={tr.projectNamePlaceholder} required className="input" />
              <input
                type="text"
                name="businessType"
                required
                className="input"
                placeholder={tr.businessTypePlaceholder}
                list="business-types-list"
              />
              <datalist id="business-types-list">
                {BUSINESS_TYPES.map(bt => (
                  <option key={bt.value} value={bt.value} />
                ))}
              </datalist>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>{tr.createProject}</button>
            </form>
          </div>

          {projects.map((project) => {
            const hypothesisCount = project.channels.reduce((a, ch) => a + ch.rubrics.length, 0)
            const postCount = project.channels.reduce((a, ch) => a + ch.rubrics.reduce((b, r) => b + r.posts.length, 0), 0)
            const strategy = project.strategyRecommendation ? JSON.parse(project.strategyRecommendation) : null

            return (
              <Link key={project.id} href={project.channels[0] ? `/project/${project.id}/channel/${project.channels[0].id}` : `/project/${project.id}`} style={{ textDecoration: 'none' }}>
                <div className="card card-hover" style={{ padding: 24, height: '100%', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 3, letterSpacing: '-0.01em' }}>{project.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{project.businessType}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {project.channels.length > 0 ? project.channels.slice(0, 3).map(ch => (
                        <span key={ch.id} style={{
                          fontSize: 10, fontWeight: 500, padding: '2px 8px',
                          borderRadius: 99, background: getPlatformBg(ch.name),
                          color: getPlatformColor(ch.name), whiteSpace: 'nowrap',
                        }}>
                          {ch.name}
                        </span>
                      )) : (
                        <span className="badge badge-default" style={{ fontSize: 10 }}>Нет платформ</span>
                      )}
                      <DeleteProjectButton projectId={project.id} />
                    </div>
                  </div>
                  {strategy?.strategySummary && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 14,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                      {strategy.strategySummary}
                    </p>
                  )}
                  <div className="separator" style={{ margin: '14px 0' }} />
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{tr.hypothesesCount(hypothesisCount)}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{tr.postsTotal(postCount)}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
