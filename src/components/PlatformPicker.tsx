'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createChannelAction } from '@/lib/actions'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'

interface Channel {
  id: string
  name: string
  rubricsCount: number
}

interface Strategy {
  strategySummary?: string
  contentDirections?: string[]
  exampleThemes?: string[]
}

interface Props {
  projectId: string
  projectName: string
  channels: Channel[]
  audience?: string
  vibe?: string
  goal?: string
  strategy?: Strategy | null
}

const PLATFORM_OPTIONS = [
  {
    name: 'Instagram',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4.5"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    color: '#dc2743',
  },
  {
    name: 'YouTube',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="4"/>
        <polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #FF0000, #CC0000)',
    color: '#FF0000',
  },
  {
    name: 'Threads',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 3C7.5 3 4 7 4 12s3.5 9 8 9c3.5 0 7-2.5 7-7 0-2-.8-3.5-2.2-4.2S13.5 9 12 10"/>
        <path d="M8 12c0-2.5 1.5-4.5 4-4.5" strokeLinecap="round"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #1A1A1A, #3D3D3D)',
    color: '#1A1A1A',
  },
  {
    name: 'TikTok',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #010101, #2D2D2D)',
    color: '#010101',
  },
  {
    name: 'Telegram',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #2CA5E0, #1C86C0)',
    color: '#2CA5E0',
  },
  {
    name: 'VK',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <path d="M6 9h2.5l2 3.5L13 9h2.5M8.5 15s0-2.5 2-3.5"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #4680C2, #2B5FA3)',
    color: '#4680C2',
  },
]

function getPlatformMeta(name: string) {
  return PLATFORM_OPTIONS.find(p => p.name.toLowerCase() === name.toLowerCase()) ?? PLATFORM_OPTIONS[0]
}

export default function PlatformPicker({ projectId, projectName, channels, audience, vibe, goal, strategy }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [customName, setCustomName] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [strategyCollapsed, setStrategyCollapsed] = useState(false)
  const { lang } = useLang()
  const tr = translations[lang]

  async function handleCreate() {
    const name = selectedPlatform === 'custom' ? customName.trim() : selectedPlatform
    if (!name) { setError('Выбери или введи название платформы'); return }
    setCreating(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('projectId', projectId)
      fd.append('name', name)
      const result = await createChannelAction(fd)
      startTransition(() => router.push(`/project/${projectId}/channel/${result.channelId}`))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="page-content" style={{ maxWidth: 720 }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Проекты
          </Link>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{projectName}</span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            {tr.platforms}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {tr.platformsSubtitle}
          </p>
        </div>

        {/* Strategy banner */}
        {strategy ? (
          <div className="card animate-fade-up" style={{ marginBottom: 28, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(91,106,240,0.07) 0%, rgba(155,107,255,0.07) 100%)',
              borderBottom: '1px solid rgba(91,106,240,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg, #5B6AF0, #9B6BFF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(91,106,240,0.28)',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{tr.aiStrategy}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link href={`/project/${projectId}/strategy`} style={{ textDecoration: 'none' }}>
                  <button className="btn-ghost" style={{ height: 28, fontSize: 11, color: 'var(--text-muted)' }}>
                    {tr.updateBtn}
                  </button>
                </Link>
                <button
                  onClick={() => setStrategyCollapsed(c => !c)}
                  className="btn-ghost"
                  style={{ height: 28, width: 28, padding: 0, color: 'var(--text-muted)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ transform: strategyCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {!strategyCollapsed && <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary */}
              {strategy.strategySummary && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {strategy.strategySummary}
                </p>
              )}

              {/* User inputs */}
              {(audience || goal) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {audience && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span className="section-label" style={{ flexShrink: 0, minWidth: 64 }}>{tr.audienceLabel}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{audience}</span>
                    </div>
                  )}
                  {vibe && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span className="section-label" style={{ flexShrink: 0, minWidth: 64 }}>{tr.vibeLabel}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{vibe}</span>
                    </div>
                  )}
                  {goal && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span className="section-label" style={{ flexShrink: 0, minWidth: 64 }}>{tr.ob_goalLabel}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{goal}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Directions + Themes */}
              {(strategy.contentDirections?.length || strategy.exampleThemes?.length) ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {strategy.contentDirections?.length ? (
                    <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', border: '1px solid var(--border-color)' }}>
                      <p className="section-label" style={{ marginBottom: 8 }}>{tr.directions}</p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {strategy.contentDirections.map((d: string, i: number) => (
                          <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', gap: 6 }}>
                            <span style={{ color: 'var(--accent)', flexShrink: 0 }}>·</span>{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {strategy.exampleThemes?.length ? (
                    <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', border: '1px solid var(--border-color)' }}>
                      <p className="section-label" style={{ marginBottom: 8 }}>{tr.themes}</p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {strategy.exampleThemes.map((t: string, i: number) => (
                          <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', gap: 6 }}>
                            <span style={{ color: 'var(--accent)', flexShrink: 0 }}>·</span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>}
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <Link href={`/project/${projectId}/strategy`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '14px 18px',
                border: '1.5px dashed rgba(91,106,240,0.30)',
                borderRadius: 'var(--radius)',
                background: 'linear-gradient(135deg, rgba(91,106,240,0.04), rgba(155,107,255,0.04))',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(91,106,240,0.5)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(91,106,240,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(91,106,240,0.30)'; (e.currentTarget as HTMLDivElement).style.background = 'linear-gradient(135deg, rgba(91,106,240,0.04), rgba(155,107,255,0.04))' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #5B6AF0, #9B6BFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(91,106,240,0.25)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 2 }}>{tr.createAiStrategy}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tr.strategyAnswerDesc}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--accent)', flexShrink: 0 }}>
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          </div>
        )}

        {/* Existing channels */}
        {channels.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {channels.map((ch, idx) => {
                const meta = getPlatformMeta(ch.name)
                return (
                  <Link
                    key={ch.id}
                    href={`/project/${projectId}/channel/${ch.id}`}
                    className={`project-card anim-slide-up d${Math.min(idx, 8)}`}
                  >
                    {/* Platform-gradient cover */}
                    <div style={{
                      height: 56,
                      background: meta.gradient,
                      position: 'relative',
                      flexShrink: 0,
                    }}>
                      <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
                        opacity: 0.5,
                      }} />
                      {/* Overlapping platform icon tile */}
                      <div style={{
                        position: 'absolute', bottom: -18, left: 18,
                        width: 40, height: 40, borderRadius: 11,
                        background: 'var(--surface)',
                        boxShadow: '0 0 0 3px var(--surface), 0 4px 12px rgba(0,0,0,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: meta.color, zIndex: 1,
                      }}>
                        {meta.icon}
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '26px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 12 }}>
                        {ch.name}
                      </p>

                      {/* Stat footer + CTA */}
                      <div style={{
                        marginTop: 'auto', paddingTop: 12,
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 6,
                            background: `${meta.color}14`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                              <rect x="1" y="1" width="6" height="6" rx="1.5" fill={meta.color} opacity="0.8"/>
                              <rect x="9" y="1" width="6" height="6" rx="1.5" fill={meta.color} opacity="0.5"/>
                              <rect x="1" y="9" width="6" height="6" rx="1.5" fill={meta.color} opacity="0.5"/>
                              <rect x="9" y="9" width="6" height="6" rx="1.5" fill={meta.color} opacity="0.3"/>
                            </svg>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {ch.rubricsCount === 0
                              ? tr.noHypotheses
                              : `${ch.rubricsCount} ${lang === 'ru' ? rubricWord(ch.rubricsCount) : ch.rubricsCount === 1 ? 'hypothesis' : 'hypotheses'}`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: meta.color, fontSize: 12, fontWeight: 600 }}>
                          Открыть
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M5 3l4 3.5L5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Add new platform — dashed button only when channels already exist;
            the empty state below shows the primary CTA instead */}
        {!showAdd && channels.length > 0 ? (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              width: '100%', padding: '16px 20px',
              border: '1.5px dashed var(--border-color)',
              borderRadius: 12, background: '#FAFAFA',
              cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.1s, color 0.1s, border-color 0.1s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#F4F4F5'
              e.currentTarget.style.color = 'var(--text)'
              e.currentTarget.style.borderColor = '#A1A1AA'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#FAFAFA'
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border-color)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {tr.addPlatformBtn.replace(/^\+\s*/, '')}
          </button>
        ) : showAdd ? (
          <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: 14, padding: 24,
            background: 'var(--surface, #fff)',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>
              {tr.addPlatformTitle}
            </h3>

            {/* Platform grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {PLATFORM_OPTIONS.map(p => {
                const isSelected = selectedPlatform === p.name
                return (
                  <button
                    key={p.name}
                    onClick={() => { setSelectedPlatform(p.name); setError('') }}
                    style={{
                      padding: '14px 12px',
                      borderRadius: 10,
                      border: isSelected ? `2px solid ${p.color}` : '1.5px solid var(--border-color)',
                      background: isSelected ? `${p.color}08` : '#FAFAFA',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F4F4F5' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#FAFAFA' }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: isSelected ? p.gradient : '#E4E4E7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isSelected ? '#fff' : '#71717A',
                      transition: 'all 0.12s',
                    }}>
                      {p.icon}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 400, color: isSelected ? p.color : 'var(--text-secondary)' }}>
                      {p.name}
                    </span>
                  </button>
                )
              })}

              {/* Custom */}
              <button
                onClick={() => { setSelectedPlatform('custom'); setError('') }}
                style={{
                  padding: '14px 12px',
                  borderRadius: 10,
                  border: selectedPlatform === 'custom' ? '2px solid #18181B' : '1.5px dashed var(--border-color)',
                  background: selectedPlatform === 'custom' ? '#F4F4F5' : '#FAFAFA',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  transition: 'all 0.12s',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#E4E4E7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#71717A', fontSize: 20,
                }}>
                  +
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tr.bt_other}</span>
              </button>
            </div>

            {/* Custom name input */}
            {selectedPlatform === 'custom' && (
              <input
                autoFocus
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder={tr.channelNamePlaceholder}
                className="input"
                style={{ marginBottom: 16 }}
              />
            )}

            {error && <p style={{ fontSize: 12, color: '#DC2626', marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setShowAdd(false); setSelectedPlatform(null); setCustomName(''); setError('') }}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                {tr.cancel}
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !selectedPlatform}
                className="btn-primary"
                style={{ flex: 2 }}
              >
                {creating ? `${tr.addBtn}...` : tr.addBtn}
              </button>
            </div>
          </div>
        ) : null}

        {/* Empty state */}
        {channels.length === 0 && !showAdd && (
          <div style={{ textAlign: 'center', padding: '48px 0 8px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{tr.selectPlatformEmpty}</p>
            <p style={{ fontSize: 13, marginBottom: 24 }}>{tr.selectPlatformEmptyDesc}</p>
            <button
              onClick={() => setShowAdd(true)}
              className="btn-primary"
              style={{ fontSize: 13 }}
            >
              {tr.addPlatformTitle}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function rubricWord(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'рубрика'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'рубрики'
  return 'рубрик'
}
