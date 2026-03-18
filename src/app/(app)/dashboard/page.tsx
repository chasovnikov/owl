import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createProjectAction } from '@/lib/actions'
import { getT } from '@/lib/lang-server'
import DeleteProjectButton from '@/components/DeleteProjectButton'

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
      platforms: {
        include: { hypotheses: { include: { postIdeas: true } } },
      },
    },
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-content">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>{tr.dashboardTitle}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{tr.dashboardSubtitle}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>{tr.newProjectCard}</p>
            <form action={createProjectAction} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="text" name="name" placeholder={tr.projectNamePlaceholder} required className="input" />
              <select name="businessType" required className="input" style={{ cursor: 'pointer' }}>
                <option value="">{tr.businessTypePlaceholder}</option>
                {BUSINESS_TYPES.map(bt => (
                  <option key={bt.value} value={bt.value}>{tr[bt.labelKey]}</option>
                ))}
              </select>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>{tr.createProject}</button>
            </form>
          </div>

          {projects.map((project) => {
            const hypothesisCount = project.platforms[0]?.hypotheses.length ?? 0
            const postCount = project.platforms[0]?.hypotheses.reduce((a, h) => a + h.postIdeas.length, 0) ?? 0
            const strategy = project.strategyRecommendation ? JSON.parse(project.strategyRecommendation) : null

            return (
              <Link key={project.id} href={`/project/${project.id}`} style={{ textDecoration: 'none' }}>
                <div className="card card-hover" style={{ padding: 20, height: '100%', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{project.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{project.businessType}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="badge badge-default">Instagram</span>
                      <DeleteProjectButton projectId={project.id} />
                    </div>
                  </div>
                  {strategy?.strategySummary && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                      {strategy.strategySummary}
                    </p>
                  )}
                  <div className="separator" style={{ margin: '12px 0' }} />
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{tr.hypothesesCount(hypothesisCount)}</span>
                    <span>·</span>
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
