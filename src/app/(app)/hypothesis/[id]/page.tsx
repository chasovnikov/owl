import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'

// Legacy route — redirect to new channel page
export default async function HypothesisPage({ params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) redirect('/')

  const rubric = await prisma.rubric.findUnique({
    where: { id: params.id },
    include: { channel: true },
  })
  if (!rubric) notFound()

  redirect(`/project/${rubric.channel.projectId}/channel/${rubric.channel.id}`)
}
