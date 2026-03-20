import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import HypothesisBoard from '@/components/HypothesisBoard'
import CompetitorPanel from '@/components/CompetitorPanel'
import { getT } from '@/lib/lang-server'

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) redirect('/')

  const tr = getT()

  const project = await prisma.project.findUnique({
    where: { id: params.id, userId: user.id },
    include: {
      platforms: {
        include: {
          hypotheses: {
            include: { postIdeas: { include: { result: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      competitors: {
        include: { reports: { orderBy: { createdAt: 'desc' } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!project) notFound()

  const platform = project.platforms[0]
  const strategy = project.strategyRecommendation ? JSON.parse(project.strategyRecommendation) : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-content">
        <div style={{ marginBottom: 24 }}>
          <p className="section-label" style={{ marginBottom: 6 }}>{project.businessType}</p>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>{project.name}</h1>
          {project.goal && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{project.goal}</p>}
        </div>

        {strategy ? (
          <div className="ai-block" style={{ padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>✦</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{tr.aiStrategy}</span>
              </div>
              <Link href={`/project/${project.id}/strategy`} style={{ fontSize: 12, color: '#3F3F3F', textDecoration: 'none' }}>{tr.updateStrategy}</Link>
            </div>
            <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.7, marginBottom: 16 }}>{strategy.strategySummary}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {strategy.contentDirections?.length > 0 && (
                <div>
                  <p className="section-label" style={{ marginBottom: 8 }}>{tr.directions}</p>
                  <ul style={{ listStyle: 'none' }}>
                    {strategy.contentDirections.map((d: string, i: number) => (
                      <li key={i} style={{ fontSize: 12, color: '#4B5563', display: 'flex', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: '#3F3F3F' }}>·</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {strategy.exampleThemes?.length > 0 && (
                <div>
                  <p className="section-label" style={{ marginBottom: 8 }}>{tr.themes}</p>
                  <ul style={{ listStyle: 'none' }}>
                    {strategy.exampleThemes.map((t: string, i: number) => (
                      <li key={i} style={{ fontSize: 12, color: '#4B5563', display: 'flex', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: '#3F3F3F' }}>·</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link href={`/project/${project.id}/strategy`} style={{ textDecoration: 'none', display: 'block', marginBottom: 24 }}>
            <div className="card card-hover" style={{ padding: 16, borderStyle: 'dashed', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{tr.createAiStrategy}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tr.createAiStrategyDesc}</p>
                </div>
              </div>
            </div>
          </Link>
        )}

        <HypothesisBoard
          platformId={platform.id}
          businessType={project.businessType}
          hypotheses={platform.hypotheses.map(h => ({
            id: h.id, title: h.title, description: h.description,
            postCount: h.postIdeas.length,
            postedCount: h.postIdeas.filter(p => p.posted).length,
            resultsCount: h.postIdeas.filter(p => p.result).length,
          }))}
        />

        <CompetitorPanel
          projectId={project.id}
          competitors={project.competitors.map(c => ({
            id: c.id,
            handle: c.handle,
            notes: c.notes,
            status: c.status,
            lastAnalyzedAt: c.lastAnalyzedAt,
            followers: c.followers,
            avgLikes: c.avgLikes,
            avgComments: c.avgComments,
            postsPerWeek: c.postsPerWeek,
            contentTypes: c.contentTypes,
            mainTopics: c.mainTopics,
            reports: c.reports.map(r => ({ id: r.id, report: r.report, createdAt: r.createdAt })),
          }))}
        />
      </div>
    </div>
  )
}
