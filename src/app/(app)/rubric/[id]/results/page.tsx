import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import RubricResults from '@/components/RubricResults'

export default async function RubricResultsPage({ params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) redirect('/')

  const rubric = await prisma.rubric.findUnique({
    where: { id: params.id },
    include: {
      channel: { include: { project: true } },
      posts: {
        include: { result: true },
        orderBy: { scheduledPublishDate: 'asc' },
      },
    },
  })

  if (!rubric) notFound()
  if (rubric.channel.project.userId !== user.id) redirect('/dashboard')

  const serialized = {
    id: rubric.id,
    title: rubric.title,
    description: rubric.description,
    channelId: rubric.channel.id,
    channelName: rubric.channel.name,
    projectId: rubric.channel.project.id,
    projectName: rubric.channel.project.name,
    posts: rubric.posts.map(p => ({
      id: p.id,
      title: p.title,
      status: (p as { status?: string }).status ?? (p.posted ? 'PUBLISHED' : p.scheduledPublishDate ? 'SCHEDULED' : 'DRAFT'),
      scheduledPublishDate: p.scheduledPublishDate?.toISOString() ?? null,
      result: p.result ? {
        views: p.result.views,
        likes: p.result.likes,
        comments: p.result.comments,
        saves: p.result.saves,
      } : null,
    })),
  }

  return <RubricResults rubric={serialized} />
}
