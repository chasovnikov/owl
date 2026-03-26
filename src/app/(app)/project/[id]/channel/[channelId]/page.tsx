import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import ChannelView from '@/components/ChannelView'

export default async function ChannelPage({
  params,
}: {
  params: { id: string; channelId: string }
}) {
  const user = await getSession()
  if (!user) redirect('/')

  const project = await prisma.project.findUnique({
    where: { id: params.id, userId: user.id },
    include: {
      channels: {
        where: { id: params.channelId },
        include: {
          rubrics: {
            include: {
              posts: {
                include: { result: true, mediaFiles: true },
                orderBy: { scheduledPublishDate: 'asc' },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  if (!project) notFound()
  const channel = project.channels[0]
  if (!channel) notFound()

  // Serialize dates for client component
  const serialized = {
    project: {
      id: project.id,
      name: project.name,
      businessType: project.businessType,
    },
    channel: {
      id: channel.id,
      name: channel.name,
      rubrics: channel.rubrics.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        createdAt: r.createdAt.toISOString(),
        posts: r.posts.map(p => ({
          id: p.id,
          title: p.title,
          postText: p.postText ?? null,
          caption: p.caption,
          hashtags: p.hashtags,
          status: (p as { status?: string }).status ?? (p.posted ? 'PUBLISHED' : p.scheduledPublishDate ? 'SCHEDULED' : 'DRAFT'),
          posted: p.posted,
          scheduledPublishDate: p.scheduledPublishDate?.toISOString() ?? null,
          recommendedPublishDate: p.recommendedPublishDate?.toISOString() ?? null,
          result: p.result ? {
            views: p.result.views,
            likes: p.result.likes,
            comments: p.result.comments,
            saves: p.result.saves,
          } : null,
          mediaFiles: p.mediaFiles.map(m => ({
            id: m.id,
            url: m.url,
            filename: m.filename,
            mimeType: m.mimeType,
          })),
        })),
      })),
    },
  }

  return <ChannelView data={serialized} />
}
