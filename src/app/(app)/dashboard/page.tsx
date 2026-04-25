import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createProjectAction } from '@/lib/actions'
import { getT } from '@/lib/lang-server'
import DeleteProjectButton from '@/components/DeleteProjectButton'

const BUSINESS_TYPES = [
  { value: 'coffee shop',      labelKey: 'bt_coffee_shop' },
  { value: 'restaurant',       labelKey: 'bt_restaurant' },
  { value: 'local business',   labelKey: 'bt_local_business' },
  { value: 'personal brand',   labelKey: 'bt_personal_brand' },
  { value: 'agency',           labelKey: 'bt_agency' },
  { value: 'e-commerce',       labelKey: 'bt_ecommerce' },
  { value: 'online creator',   labelKey: 'bt_online_creator' },
  { value: 'startup',          labelKey: 'bt_startup' },
  { value: 'education',        labelKey: 'bt_education' },
  { value: 'fitness / wellness', labelKey: 'bt_fitness' },
  { value: 'other',            labelKey: 'bt_other' },
] as const

// Gradient pairs per project index
const GRAD_COLORS = [
  ['#5B6AF0', '#9B6BFF'],
  ['#10B981', '#34D399'],
  ['#F59E0B', '#FCD34D'],
  ['#EF4444', '#F97316'],
  ['#06B6D4', '#3B82F6'],
]

const INSTAGRAM_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
  </svg>
)

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

      {/* Page header */}
      <div className="page-header">
        <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          {tr.dashboardTitle}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tr.dashboardSubtitle}</span>
        </div>
      </div>

      <div className="page-content">

        <div
          className="dashboard-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))', gap: 16 }}
        >

          {/* Existing projects */}
          {projects.map((project, idx) => {
            const hypothesisCount = project.channels.reduce((a, ch) => a + ch.rubrics.length, 0)
            const postCount = project.channels.reduce((a, ch) => a + ch.rubrics.reduce((b, r) => b + r.posts.length, 0), 0)
            const strategy = project.strategyRecommendation ? JSON.parse(project.strategyRecommendation) : null
            const href = project.channels[0]
              ? `/project/${project.id}/channel/${project.channels[0].id}`
              : `/project/${project.id}`
            const [c1, c2] = GRAD_COLORS[idx % GRAD_COLORS.length]

            return (
              <Link
                key={project.id}
                href={href}
                className={`card card-hover anim-slide-up d${Math.min(idx, 8)}`}
                style={{ padding: 24, cursor: 'pointer', textDecoration: 'none', display: 'block' }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Gradient avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: `linear-gradient(135deg, ${c1}, ${c2})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, color: '#fff',
                    }}>
                      {project.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 2 }}>
                        {project.name}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {project.businessType}
                      </p>
                    </div>
                  </div>

                  {/* Channel badges + delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {project.channels.length > 0 ? (
                      project.channels.slice(0, 2).map(ch => (
                        <span key={ch.id} className="badge badge-default" style={{ fontSize: 10 }}>
                          {INSTAGRAM_ICON}{ch.name}
                        </span>
                      ))
                    ) : (
                      <span className="badge badge-default" style={{ fontSize: 10 }}>No channels</span>
                    )}
                    <DeleteProjectButton projectId={project.id} />
                  </div>
                </div>

                {/* Strategy summary */}
                {(strategy?.strategySummary) && (
                  <p style={{
                    fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 14,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  } as React.CSSProperties}>
                    {strategy.strategySummary}
                  </p>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border-color)', margin: '0 0 14px' }} />

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{tr.hypothesesCount(hypothesisCount)}</span>
                    <span>{tr.postsTotal(postCount)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--accent)', fontSize: 12, fontWeight: 500 }}>
                    <span>Open</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Create new project card */}
          <div
            className="card dashboard-create-card dashboard-create-dashed"
            style={{ padding: 24 }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 18, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              {tr.newProjectCard}
            </p>
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
                {BUSINESS_TYPES.map(bt => <option key={bt.value} value={bt.value} />)}
              </datalist>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                {tr.createProject}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
