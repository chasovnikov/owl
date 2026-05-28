import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import PlatformPicker from '@/components/PlatformPicker'
import CompetitorPanel from '@/components/CompetitorPanel'

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) redirect('/')

  const project = await prisma.project.findUnique({
    where: { id: params.id, userId: user.id },
    include: {
      channels: {
        orderBy: { id: 'asc' },
        include: {
          _count: { select: { rubrics: true } },
        },
      },
      competitors: {
        orderBy: { createdAt: 'desc' },
        include: { reports: { orderBy: { createdAt: 'desc' } } },
      },
    },
  })
  if (!project) notFound()

  const channels = project.channels.map(ch => ({
    id: ch.id,
    name: ch.name,
    rubricsCount: ch._count.rubrics,
  }))

  const strategy = project.strategyRecommendation
    ? JSON.parse(project.strategyRecommendation)
    : null

  return (
    <>
      <PlatformPicker
        projectId={project.id}
        projectName={project.name}
        channels={channels}
        audience={project.tone || ''}
        vibe={project.narrativeStyle || ''}
        goal={project.goal || ''}
        strategy={strategy}
      />
      <CompetitorPanel
        projectId={project.id}
        competitors={project.competitors}
      />
    </>
  )
}
