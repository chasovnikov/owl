import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ContentCalendar from '@/components/ContentCalendar'

export default async function CalendarPage() {
  const user = await getSession()
  if (!user) redirect('/')

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      platforms: {
        include: {
          hypotheses: {
            include: {
              postIdeas: {
                include: { result: true, mediaFiles: true },
                orderBy: { recommendedPublishDate: 'asc' },
              },
            },
          },
        },
      },
    },
  })

  // Serialize dates for client component
  const serialized = projects.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    platforms: p.platforms.map(pl => ({
      ...pl,
      hypotheses: pl.hypotheses.map(h => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
        postIdeas: h.postIdeas.map(post => ({
          ...post,
          recommendedPublishDate: post.recommendedPublishDate?.toISOString() ?? null,
          scheduledPublishDate: post.scheduledPublishDate?.toISOString() ?? null,
          result: post.result
            ? { ...post.result, createdAt: post.result.createdAt.toISOString() }
            : null,
          mediaFiles: post.mediaFiles.map(m => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
          })),
        })),
      })),
    })),
  }))

  return <ContentCalendar projects={serialized} />
}
