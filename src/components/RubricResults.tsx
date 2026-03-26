'use client'

import { useState } from 'react'
import Link from 'next/link'
import { analyzeRubricAction } from '@/lib/actions'

interface PostResult {
  views: number
  likes: number
  comments: number
  saves: number
}

interface PostData {
  id: string
  title: string
  status: string
  scheduledPublishDate: string | null
  result: PostResult | null
}

interface RubricData {
  id: string
  title: string
  description: string
  channelId: string
  channelName: string
  projectId: string
  projectName: string
  posts: PostData[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Черновик', color: '#71717A' },
  SCHEDULED: { label: 'Запланировано', color: '#2563EB' },
  PUBLISHED: { label: 'Опубликовано', color: '#16A34A' },
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '14px 18px' }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}

export default function RubricResults({ rubric }: { rubric: RubricData }) {
  const [aiAnalysis, setAiAnalysis] = useState<{ summary: string; engagementComparison: string; recommendation: string } | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const publishedPosts = rubric.posts.filter(p => p.result)
  const totalPosts = rubric.posts.length

  // Aggregate metrics
  const totals = publishedPosts.reduce(
    (acc, p) => ({
      views: acc.views + (p.result?.views ?? 0),
      likes: acc.likes + (p.result?.likes ?? 0),
      comments: acc.comments + (p.result?.comments ?? 0),
      saves: acc.saves + (p.result?.saves ?? 0),
    }),
    { views: 0, likes: 0, comments: 0, saves: 0 }
  )

  const avg = publishedPosts.length > 0 ? {
    views: Math.round(totals.views / publishedPosts.length),
    likes: Math.round(totals.likes / publishedPosts.length),
    comments: Math.round(totals.comments / publishedPosts.length),
    saves: Math.round(totals.saves / publishedPosts.length),
  } : null

  async function handleAnalyze() {
    setAnalyzing(true)
    setError('')
    try {
      const result = await analyzeRubricAction(rubric.id)
      setAiAnalysis(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка анализа')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-content">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{rubric.projectName}</Link>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <Link
            href={`/project/${rubric.projectId}/channel/${rubric.channelId}`}
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            {rubric.channelName}
          </Link>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{rubric.title}</span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Результаты рубрики
          </h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>{rubric.title}</p>
          {rubric.description && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{rubric.description}</p>
          )}
        </div>

        {/* Stats overview */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, fontSize: 13, color: 'var(--text-muted)' }}>
          <span>Всего постов: <strong style={{ color: 'var(--text)' }}>{totalPosts}</strong></span>
          <span>·</span>
          <span>Опубликовано: <strong style={{ color: '#16A34A' }}>{publishedPosts.length}</strong></span>
        </div>

        {publishedPosts.length > 0 ? (
          <>
            {/* Aggregate metrics */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Итого
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <MetricCard label="Просмотры" value={totals.views} />
                <MetricCard label="Лайки" value={totals.likes} />
                <MetricCard label="Комментарии" value={totals.comments} />
                <MetricCard label="Сохранения" value={totals.saves} />
              </div>
            </div>

            {avg && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Среднее на пост
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <MetricCard label="Просмотры" value={avg.views} />
                  <MetricCard label="Лайки" value={avg.likes} />
                  <MetricCard label="Комментарии" value={avg.comments} />
                  <MetricCard label="Сохранения" value={avg.saves} />
                </div>
              </div>
            )}

            {/* Posts list */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Посты
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rubric.posts.map(post => {
                  const sc = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.DRAFT
                  return (
                    <div key={post.id} style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{post.title}</p>
                        {post.scheduledPublishDate && (
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(post.scheduledPublishDate).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: sc.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {sc.label}
                      </span>
                      {post.result && (
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{post.result.views.toLocaleString()}</div>
                            <div>просм.</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{post.result.likes.toLocaleString()}</div>
                            <div>лайки</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{post.result.comments.toLocaleString()}</div>
                            <div>комм.</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{post.result.saves.toLocaleString()}</div>
                            <div>сохр.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AI Analysis */}
            {!aiAnalysis ? (
              <div>
                {error && <p style={{ fontSize: 12, color: '#DC2626', marginBottom: 8 }}>{error}</p>}
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ fontSize: 14 }}>✦</span>
                  {analyzing ? 'Анализируем...' : 'AI-анализ рубрики'}
                </button>
              </div>
            ) : (
              <div className="ai-block" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 14 }}>✦</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>AI-анализ</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Сводка</p>
                    <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.7 }}>{aiAnalysis.summary}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Сравнение вовлечённости</p>
                    <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.7 }}>{aiAnalysis.engagementComparison}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Рекомендация</p>
                    <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.7 }}>{aiAnalysis.recommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14, marginBottom: 6 }}>Нет опубликованных постов с метриками</p>
            <p style={{ fontSize: 12 }}>Опубликуй посты и добавь метрики, чтобы увидеть результаты</p>
            <Link
              href={`/project/${rubric.projectId}/channel/${rubric.channelId}`}
              style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: 'var(--accent, #18181B)', textDecoration: 'none', fontWeight: 500 }}
            >
              ← Вернуться к рубрикам
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
