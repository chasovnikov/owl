import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { saveStrategyAction } from '@/lib/actions'
import { translations } from '@/lib/translations'
import type { Lang } from '@/lib/translations'

export default async function StrategyPage({ params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) redirect('/')
  const project = await prisma.project.findUnique({ where: { id: params.id, userId: user.id } })
  if (!project) notFound()

  const cookieStore = cookies()
  const lang = ((cookieStore.get('lang')?.value) ?? 'ru') as Lang
  const tr = translations[lang]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="page-header">
        <Link href={`/project/${project.id}`} className="nav-link" style={{ fontSize: 13 }}>
          {tr.strategyBackLink}
        </Link>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <span className="badge badge-primary" style={{ marginBottom: 14, display: 'inline-flex' }}>
            {tr.strategyPageBadge}
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            {tr.strategyPageTitle}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {tr.strategyPageDesc} <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{project.name}</strong>
          </p>
        </div>

        <form action={saveStrategyAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input type="hidden" name="projectId" value={project.id} />

          {/* Q1: Audience */}
          <div className="card" style={{ padding: 18 }}>
            <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
              {tr.strategyAudienceLabel}
            </label>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
              {tr.strategyAudienceHint}
            </p>
            <textarea
              name="audience"
              rows={3}
              placeholder={tr.strategyAudiencePlaceholder}
              defaultValue={project.tone || ''}
              className="input"
            />
          </div>

          {/* Q2: Vibe */}
          <div className="card" style={{ padding: 18 }}>
            <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
              {tr.strategyVibeLabel}
            </label>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
              {tr.strategyVibeHint}
            </p>
            <textarea
              name="vibe"
              rows={2}
              placeholder={tr.strategyVibePlaceholder}
              defaultValue={project.narrativeStyle || ''}
              className="input"
            />
          </div>

          {/* Q3: Goal */}
          <div className="card" style={{ padding: 18 }}>
            <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
              {tr.strategyGoalLabel2}
            </label>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
              {tr.strategyGoalHint}
            </p>
            <textarea
              name="goal"
              rows={2}
              placeholder={tr.strategyGoalPlaceholder2}
              defaultValue={project.goal || ''}
              className="input"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', height: 42, fontSize: 14 }}>
            {tr.strategySubmitBtn}
          </button>
          <Link href={`/project/${project.id}`} style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
            {tr.strategySkipLink}
          </Link>
        </form>
      </div>
    </div>
  )
}
