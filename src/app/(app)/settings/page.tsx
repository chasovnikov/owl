import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getT } from '@/lib/lang-server'
import SettingsClient from '@/components/SettingsClient'

export default async function SettingsPage() {
  const user = await getSession()
  if (!user) redirect('/')

  const tr = getT()

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      platforms: {
        include: {
          hypotheses: {
            include: { postIdeas: { include: { result: true } } },
          },
        },
      },
    },
  })

  const hypothesesCount = projects.reduce((a, p) => a + (p.platforms[0]?.hypotheses.length ?? 0), 0)
  const postsCount = projects.reduce((a, p) =>
    a + (p.platforms[0]?.hypotheses.reduce((b, h) => b + h.postIdeas.length, 0) ?? 0), 0)
  const resultsCount = projects.reduce((a, p) =>
    a + (p.platforms[0]?.hypotheses.reduce((b, h) =>
      b + h.postIdeas.filter(pi => pi.result).length, 0) ?? 0), 0)

  const stats = {
    projects: projects.length,
    hypotheses: hypothesesCount,
    posts: postsCount,
    results: resultsCount,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-content" style={{ maxWidth: 680 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 32 }}>
          {tr.settings}
        </h1>
        <SettingsClient
          user={{ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl ?? null, createdAt: user.createdAt.toISOString(), hasPassword: !!user.passwordHash }}
          stats={stats}
        />
      </div>
    </div>
  )
}
