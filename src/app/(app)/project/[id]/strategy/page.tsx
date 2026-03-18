import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { saveStrategyAction } from '@/lib/actions'
import { getT } from '@/lib/lang-server'

export default async function StrategyPage({ params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) redirect('/')
  const project = await prisma.project.findUnique({ where: { id: params.id, userId: user.id } })
  if (!project) notFound()

  const tr = getT()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="page-header">
        <Link href="/dashboard" className="nav-link" style={{ fontSize: 13 }}>← {tr.allProjects}</Link>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 24px' }}>
        <span className="badge badge-primary" style={{ marginBottom: 16, display: 'inline-flex' }}>{tr.strategyStep}</span>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>{tr.strategyTitle}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>
          {tr.strategySubtitle} <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{project.name}</strong>
        </p>

        <form action={saveStrategyAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="hidden" name="projectId" value={project.id} />
          {[
            { name: 'tone', label: tr.strategyToneLabel, placeholder: tr.strategyTonePlaceholder },
            { name: 'narrativeStyle', label: tr.strategyNarrativeLabel, placeholder: tr.strategyNarrativePlaceholder },
            { name: 'goal', label: tr.strategyGoalLabel, placeholder: tr.strategyGoalPlaceholder },
          ].map(f => (
            <div key={f.name} className="card" style={{ padding: 14 }}>
              <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>{f.label}</label>
              <textarea name={f.name} rows={2} placeholder={f.placeholder} className="input" style={{ height: 'auto', padding: '8px 12px' }} />
            </div>
          ))}
          <button type="submit" className="btn-primary" style={{ width: '100%', height: 38 }}>
            {tr.strategyCreate}
          </button>
          <Link href={`/project/${project.id}`} style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
            {tr.strategySkip}
          </Link>
        </form>
      </div>
    </div>
  )
}
