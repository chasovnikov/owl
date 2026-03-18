import { OWLLogo } from '@/components/OwlLogo'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createProjectAction } from '@/lib/actions'

const BUSINESS_TYPES = [
  { value: 'coffee shop', label: 'Coffee shop' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'local business', label: 'Local business' },
  { value: 'personal brand', label: 'Personal brand' },
  { value: 'agency', label: 'Agency' },
  { value: 'e-commerce', label: 'E-commerce' },
  { value: 'online creator', label: 'Online creator' },
  { value: 'startup', label: 'Startup' },
  { value: 'education', label: 'Education' },
  { value: 'fitness / wellness', label: 'Fitness / wellness' },
  { value: 'other', label: 'Other' },
]

export default async function DashboardPage() {
  const user = await getSession()
  if (!user) redirect('/')

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      platforms: {
        include: { hypotheses: { include: { postIdeas: true } } },
      },
    },
  })

  if (projects.length === 0 && !user.completedOnboarding) redirect('/onboarding')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-content">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>Projects</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage your content experiments</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>New project</p>
            <form action={createProjectAction} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="text" name="name" placeholder="Project name" required className="input" />
              <select name="businessType" required className="input" style={{ cursor: 'pointer' }}>
                <option value="">Business type...</option>
                {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Create project</button>
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
                    <span className="badge badge-default">Instagram</span>
                  </div>
                  {strategy?.strategySummary && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                      {strategy.strategySummary}
                    </p>
                  )}
                  <div className="separator" style={{ margin: '12px 0' }} />
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{hypothesisCount} hypotheses</span>
                    <span>·</span>
                    <span>{postCount} posts</span>
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
