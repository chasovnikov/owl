import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import FeedbackPopup from '@/components/FeedbackPopup'
import QuickCreateModal from '@/components/QuickCreateModal'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user) redirect('/')

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      channels: {
        include: {
          rubrics: {
            include: { posts: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  // Flatten for QuickCreateModal: project → channels → rubrics
  const fabProjects = projects.map(p => ({
    id: p.id,
    name: p.name,
    channels: p.channels.map(ch => ({
      id: ch.id,
      name: ch.name,
      rubrics: ch.rubrics.map(r => ({ id: r.id, title: r.title, channelId: ch.id })),
    })),
  }))

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar projects={projects} userEmail={user.email} userName={user.name} userAvatar={user.avatarUrl} />
      <div style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
        {children}
      </div>
      <FeedbackPopup userEmail={user.email} />
      <QuickCreateModal projects={fabProjects} />
    </div>
  )
}
