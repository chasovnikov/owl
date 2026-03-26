import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import GlobalCalendar from '@/components/GlobalCalendar'

export default async function CalendarPage() {
  const user = await getSession()
  if (!user) redirect('/')

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      channels: {
        include: {
          rubrics: {
            include: {
              posts: {
                include: { result: true },
                orderBy: { scheduledPublishDate: 'asc' },
              },
            },
          },
        },
      },
    },
  })

  const serialized = projects.map(p => ({
    id: p.id,
    name: p.name,
    channels: p.channels.map(ch => ({
      id: ch.id,
      name: ch.name,
      projectId: p.id,
      rubrics: ch.rubrics.map(r => ({
        id: r.id,
        title: r.title,
        posts: r.posts.map(post => ({
          id: post.id,
          title: post.title,
          status: (post as { status?: string }).status ?? (post.posted ? 'PUBLISHED' : post.scheduledPublishDate ? 'SCHEDULED' : 'DRAFT'),
          scheduledPublishDate: post.scheduledPublishDate?.toISOString() ?? null,
          recommendedPublishDate: post.recommendedPublishDate?.toISOString() ?? null,
          rubricId: r.id,
          rubricTitle: r.title,
          channelId: ch.id,
          channelName: ch.name,
          projectId: p.id,
          projectName: p.name,
        })),
      })),
    })),
  }))

  return <GlobalCalendar projects={serialized} />
}
