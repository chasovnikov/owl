import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import PostCard from '@/components/PostCard'
import PostIdeasGenerator from '@/components/PostIdeasGenerator'
import AnalysisPanel from '@/components/AnalysisPanel'
import AddPostForm from '@/components/AddPostForm'

export default async function HypothesisPage({ params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) redirect('/')

  const hypothesis = await prisma.hypothesis.findUnique({
    where: { id: params.id },
    include: {
      platform: { include: { project: true } },
      postIdeas: { include: { result: true }, orderBy: { id: 'asc' } },
    },
  })
  if (!hypothesis) notFound()
  if (hypothesis.platform.project.userId !== user.id) redirect('/dashboard')

  const postsWithResults = hypothesis.postIdeas.filter(p => p.result)
  const totalEngagement = postsWithResults.reduce((acc, p) => acc + p.result!.likes + p.result!.comments + p.result!.saves, 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-content">
        <div style={{ marginBottom: 24 }}>
          <p className="section-label" style={{ marginBottom: 6 }}>Testing hypothesis</p>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>{hypothesis.title}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 560 }}>{hypothesis.description}</p>

          {postsWithResults.length > 0 && (
            <div style={{ display: 'flex', gap: 32, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Posts with data</p>
                <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  {postsWithResults.length}/{hypothesis.postIdeas.length}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total engagement</p>
                <p style={{ fontSize: 20, fontWeight: 600, color: '#2D2D2D', letterSpacing: '-0.02em' }}>
                  {totalEngagement.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {hypothesis.postIdeas.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <PostIdeasGenerator hypothesisId={hypothesis.id} />
            <AddPostForm hypothesisId={hypothesis.id} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Content plan</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <AddPostForm hypothesisId={hypothesis.id} />
                  <PostIdeasGenerator hypothesisId={hypothesis.id} regenerate />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {hypothesis.postIdeas.map((post, idx) => (
                  <PostCard key={post.id} index={idx} post={{
                    ...post,
                    recommendedPublishDate: post.recommendedPublishDate?.toISOString() ?? null,
                    scheduledPublishDate: post.scheduledPublishDate?.toISOString() ?? null,
                  }} />
                ))}
              </div>
            </div>
            {postsWithResults.length > 0 && <AnalysisPanel hypothesisId={hypothesis.id} />}
          </div>
        )}
      </div>
    </div>
  )
}
