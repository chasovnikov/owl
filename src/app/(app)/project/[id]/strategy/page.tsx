import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { saveStrategyAction } from '@/lib/actions'

export default async function StrategyPage({ params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) redirect('/')
  const project = await prisma.project.findUnique({ where: { id: params.id, userId: user.id } })
  if (!project) notFound()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="page-header">
        <Link href="/dashboard" className="nav-link" style={{ fontSize: 13 }}>← Dashboard</Link>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 24px' }}>
        <span className="badge badge-primary" style={{ marginBottom: 16, display: 'inline-flex' }}>Step 2 of 2</span>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>Content strategy</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>
          AI will create a personalized strategy for <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{project.name}</strong>
        </p>

        <form action={saveStrategyAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="hidden" name="projectId" value={project.id} />
          {[
            { name: 'tone', label: 'Tone of voice', placeholder: 'How do you communicate? E.g. friendly, premium, educational' },
            { name: 'narrativeStyle', label: 'Narrative style', placeholder: 'Your brand images? E.g. cozy moments, street culture, lifestyle' },
            { name: 'goal', label: 'Goal on Instagram', placeholder: 'What do you want to achieve? E.g. awareness, visits, community' },
          ].map(f => (
            <div key={f.name} className="card" style={{ padding: 14 }}>
              <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>{f.label}</label>
              <textarea name={f.name} rows={2} placeholder={f.placeholder} className="input" style={{ height: 'auto', padding: '8px 12px' }} />
            </div>
          ))}
          <button type="submit" className="btn-primary" style={{ width: '100%', height: 38 }}>
            Create AI strategy →
          </button>
          <Link href={`/project/${project.id}`} style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
            Skip for now
          </Link>
        </form>
      </div>
    </div>
  )
}
