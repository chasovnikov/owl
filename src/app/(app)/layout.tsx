import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import FeedbackPopup from '@/components/FeedbackPopup'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user) redirect('/')

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      platforms: {
        include: {
          hypotheses: {
            include: { postIdeas: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar projects={projects} userEmail={user.email} />
      <div style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
        {children}
      </div>
      <FeedbackPopup userEmail={user.email} />
    </div>
  )
}
