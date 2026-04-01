import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { translations } from '@/lib/translations'
import type { Lang } from '@/lib/translations'
import StrategyForm from '@/components/StrategyForm'

export default async function StrategyPage({ params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) redirect('/')
  const project = await prisma.project.findUnique({ where: { id: params.id, userId: user.id } })
  if (!project) notFound()

  const cookieStore = cookies()
  const lang = ((cookieStore.get('lang')?.value) ?? 'ru') as Lang
  const tr = translations[lang]

  let parsedStrategy = null
  if (project.strategyRecommendation) {
    try {
      parsedStrategy = JSON.parse(project.strategyRecommendation)
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header className="page-header">
        <Link href={`/project/${project.id}`} className="nav-link" style={{ fontSize: 13 }}>
          {tr.strategyBackLink}
        </Link>
      </header>

      <StrategyForm
        projectId={project.id}
        projectName={project.name}
        initialAudience={project.tone || ''}
        initialVibe={project.narrativeStyle || ''}
        initialGoal={project.goal || ''}
        strategy={parsedStrategy}
      />
    </div>
  )
}
