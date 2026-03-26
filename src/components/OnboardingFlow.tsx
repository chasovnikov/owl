'use client'

import { useState, useEffect } from 'react'
import { createOnboardingProjectAction } from '@/lib/actions'
import { translations } from '@/lib/translations'
import type { Lang } from '@/lib/translations'

function getLang(): Lang {
  if (typeof document === 'undefined') return 'ru'
  const m = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/)
  return (m?.[1] === 'en' ? 'en' : 'ru') as Lang
}

function OwlLogo() {
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(145deg, #5B6AF0, #9B6BFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(91,106,240,0.32)' }}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M10 18 C7.2 14.5 5.5 10.8 6 7 C6.5 3.5 10 2 13 3.5 C15.8 5 15.5 9.5 13 13 L10 18 Z" fill="white" opacity="0.96"/>
          <path d="M10 18 L12.5 5" stroke="rgba(91,106,240,0.45)" strokeWidth="0.9" strokeLinecap="round"/>
        </svg>
      </div>
      <span style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.025em', background: 'linear-gradient(135deg, #5B6AF0, #9B6BFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Fumi</span>
    </div>
  )
}

interface FormData {
  businessType: string
  businessTypeCustom: string
  tone: string
  narrativeStyle: string
  goal: string
  projectName: string
}

export default function OnboardingFlow({ userEmail }: { userEmail: string }) {
  const [lang, setLang] = useState<Lang>('ru')
  useEffect(() => { setLang(getLang()) }, [])
  const tr = translations[lang]

  const BUSINESS_TYPES = [
    { value: 'coffee shop', label: `☕ ${tr.bt_coffee_shop}` },
    { value: 'restaurant', label: `🍽️ ${tr.bt_restaurant}` },
    { value: 'local business', label: `🏪 ${tr.bt_local_business}` },
    { value: 'personal brand', label: `✨ ${tr.bt_personal_brand}` },
    { value: 'agency', label: `🏢 ${tr.bt_agency}` },
    { value: 'e-commerce', label: `🛍️ ${tr.bt_ecommerce}` },
    { value: 'online creator', label: `🎬 ${tr.bt_online_creator}` },
    { value: 'startup', label: `🚀 ${tr.bt_startup}` },
    { value: 'education', label: `📚 ${tr.bt_education}` },
    { value: 'fitness / wellness', label: `💪 ${tr.bt_fitness}` },
    { value: 'other', label: `📦 ${tr.bt_other}` },
  ]

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<FormData>({
    businessType: '',
    businessTypeCustom: '',
    tone: '',
    narrativeStyle: '',
    goal: '',
    projectName: '',
  })

  const totalSteps = 5

  function update(field: keyof FormData, value: string) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  function next() {
    setError('')
    setStep(s => Math.min(s + 1, totalSteps))
  }

  function back() {
    setError('')
    setStep(s => Math.max(s - 1, 1))
  }

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const finalBusinessType = data.businessType === 'other'
        ? data.businessTypeCustom || 'other'
        : data.businessType

      const formData = new window.FormData()
      formData.set('name', data.projectName || finalBusinessType)
      formData.set('businessType', finalBusinessType)
      formData.set('tone', data.tone)
      formData.set('narrativeStyle', data.narrativeStyle)
      formData.set('goal', data.goal)
      await createOnboardingProjectAction(formData)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 2) return data.businessType !== '' && (data.businessType !== 'other' || data.businessTypeCustom !== '')
    return true
  }

  return (
    <main className="min-h-screen flex flex-col" style={{background: 'var(--bg)'}}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{borderColor: 'var(--border)', background: 'var(--surface)'}}>
        <OwlLogo />
        <span className="text-xs" style={{color: 'var(--text-muted)'}}>{userEmail}</span>
      </header>

      {/* Progress bar */}
      <div className="w-full h-0.5" style={{background: 'var(--border)'}}>
        <div
          className="h-full transition-all duration-500"
          style={{width: `${(step / totalSteps) * 100}%`, background: 'var(--accent)'}}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-8">
            {Array.from({length: totalSteps}).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i + 1 === step ? '20px' : '6px',
                  height: '6px',
                  background: i + 1 <= step ? 'var(--accent)' : 'var(--border)',
                }}
              />
            ))}
            <span className="text-xs ml-2" style={{color: 'var(--text-muted)'}}>
              {step} / {totalSteps}
            </span>
          </div>

          {/* ── Step 1: Intro ── */}
          {step === 1 && (
            <div className="animate-fade-up">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(145deg, #5B6AF0, #9B6BFF)', boxShadow: '0 4px 16px rgba(91,106,240,0.32)' }}>
                <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
                  <path d="M10 18 C7.2 14.5 5.5 10.8 6 7 C6.5 3.5 10 2 13 3.5 C15.8 5 15.5 9.5 13 13 L10 18 Z" fill="white" opacity="0.96"/>
                  <path d="M10 18 L12.5 5" stroke="rgba(91,106,240,0.45)" strokeWidth="0.9" strokeLinecap="round"/>
                  <path d="M11.8 9.5 L14.8 8" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 className="text-3xl mb-3" style={{fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.02em'}}>
                Meet Fumi — your AI copilot for content experiments
              </h1>
              <p className="text-sm mb-8 leading-relaxed" style={{color: 'var(--text-secondary)'}}>
                Fumi помогает тестировать гипотезы контента, понимать что работает в соцсетях и строить системный контент-план.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  {
                    icon: '⚡',
                    title: 'Generate content ideas faster',
                    desc: 'AI помогает генерировать и улучшать идеи постов.',
                  },
                  {
                    icon: '🧪',
                    title: 'Test content hypotheses',
                    desc: 'Проверяй гипотезы и смотри какие форматы работают лучше.',
                  },
                  {
                    icon: '📅',
                    title: 'Turn strategy into a real posting plan',
                    desc: 'Fumi превращает стратегию контента в конкретный план публикаций.',
                  },
                ].map(f => (
                  <div key={f.title} className="flex gap-4 p-4 rounded-xl" style={{background: 'var(--bg-subtle)', border: '1px solid var(--border)'}}>
                    <span className="text-xl flex-shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={{color: 'var(--text)'}}>{f.title}</p>
                      <p className="text-xs leading-relaxed" style={{color: 'var(--text-secondary)'}}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={next} className="btn-primary w-full py-3">
                Start setup →
              </button>
            </div>
          )}

          {/* ── Step 2: Business type ── */}
          {step === 2 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color: 'var(--accent)'}}>Step 2 — Business</p>
              <h2 className="text-2xl mb-1" style={{fontFamily: 'var(--font-display)', color: 'var(--text)'}}>
                What kind of business are you working on?
              </h2>
              <p className="text-sm mb-6" style={{color: 'var(--text-muted)'}}>
                We use this to generate relevant content ideas.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {BUSINESS_TYPES.map(bt => (
                  <button
                    key={bt.value}
                    onClick={() => update('businessType', bt.value)}
                    className="flex items-center gap-2.5 p-3 rounded-xl text-left text-sm transition-all"
                    style={{
                      border: data.businessType === bt.value
                        ? '2px solid var(--accent)'
                        : '1px solid var(--border)',
                      background: data.businessType === bt.value
                        ? 'var(--accent-light)'
                        : 'var(--surface)',
                      color: data.businessType === bt.value ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: data.businessType === bt.value ? 500 : 400,
                    }}
                  >
                    <span>{bt.label}</span>
                  </button>
                ))}
              </div>

              {data.businessType === 'other' && (
                <input
                  type="text"
                  placeholder="Describe your business..."
                  value={data.businessTypeCustom}
                  onChange={e => update('businessTypeCustom', e.target.value)}
                  className="input w-full px-3.5 py-2.5 mb-4 animate-fade-up"
                  autoFocus
                />
              )}

              <div className="flex gap-2 mt-2">
                <button onClick={back} className="btn-secondary px-5 py-2.5">← Back</button>
                <button onClick={next} disabled={!canProceed()} className="btn-primary flex-1 py-2.5 disabled:opacity-40">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Strategy ── */}
          {step === 3 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color: 'var(--accent)'}}>Step 3 — Strategy</p>
              <h2 className="text-2xl mb-1" style={{fontFamily: 'var(--font-display)', color: 'var(--text)'}}>
                Define your content strategy
              </h2>
              <p className="text-sm mb-6" style={{color: 'var(--text-muted)'}}>
                Fumi будет использовать это для генерации релевантного контента.
              </p>

              <div className="space-y-4">
                <div className="card p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{color: 'var(--text-muted)'}}>
                    Tone of voice
                  </label>
                  <p className="text-xs mb-2" style={{color: 'var(--text-muted)'}}>
                    Это помогает Fumi писать тексты в нужном стиле.
                  </p>
                  <input
                    type="text"
                    placeholder="friendly, premium, educational, funny, bold..."
                    value={data.tone}
                    onChange={e => update('tone', e.target.value)}
                    className="input w-full px-3.5 py-2.5"
                  />
                </div>

                <div className="card p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{color: 'var(--text-muted)'}}>
                    Narrative style
                  </label>
                  <p className="text-xs mb-2" style={{color: 'var(--text-muted)'}}>
                    Fumi будет генерировать посты, которые соответствуют стилю бренда.
                  </p>
                  <input
                    type="text"
                    placeholder="cozy lifestyle, behind the scenes, expert tips..."
                    value={data.narrativeStyle}
                    onChange={e => update('narrativeStyle', e.target.value)}
                    className="input w-full px-3.5 py-2.5"
                  />
                </div>

                <div className="card p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{color: 'var(--text-muted)'}}>
                    Goal
                  </label>
                  <p className="text-xs mb-2" style={{color: 'var(--text-muted)'}}>
                    Fumi будет предлагать контент, который помогает достичь этой цели.
                  </p>
                  <input
                    type="text"
                    placeholder="get more visitors, build community, sell products..."
                    value={data.goal}
                    onChange={e => update('goal', e.target.value)}
                    className="input w-full px-3.5 py-2.5"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={back} className="btn-secondary px-5 py-2.5">← Back</button>
                <button onClick={next} className="btn-primary flex-1 py-2.5">Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 4: How Fumi works ── */}
          {step === 4 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color: 'var(--accent)'}}>Step 4 — How it works</p>
              <h2 className="text-2xl mb-2" style={{fontFamily: 'var(--font-display)', color: 'var(--text)'}}>
                How Fumi helps you grow your content
              </h2>
              <p className="text-sm mb-7" style={{color: 'var(--text-muted)'}}>
                Три простых шага от идеи до результата.
              </p>

              <div className="space-y-3 mb-7">
                {[
                  {
                    num: '01',
                    title: 'Create hypotheses',
                    desc: 'Формулируй гипотезы контента — например "Reels с историями бариста получают больше сохранений". Fumi помогает превращать идеи в тестируемые гипотезы.',
                    color: 'var(--accent-light)',
                    textColor: 'var(--accent)',
                  },
                  {
                    num: '02',
                    title: 'Generate content plan',
                    desc: 'Fumi создаёт идеи постов на основе гипотез. Ты сразу получаешь готовый контент-план с подписями и хэштегами.',
                    color: '#F0FDF4',
                    textColor: 'var(--green)',
                  },
                  {
                    num: '03',
                    title: 'Track what works',
                    desc: 'Загружай скриншот аналитики — Fumi извлекает метрики и помогает понять какие форматы работают. Решения на данных, не на интуиции.',
                    color: '#FFF7ED',
                    textColor: 'var(--amber)',
                  },
                ].map(s => (
                  <div key={s.num} className="flex gap-4 p-4 rounded-xl" style={{background: 'var(--bg-subtle)', border: '1px solid var(--border)'}}>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{background: s.color, color: s.textColor}}
                    >
                      {s.num}
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{color: 'var(--text)'}}>{s.title}</p>
                      <p className="text-xs leading-relaxed" style={{color: 'var(--text-secondary)'}}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={back} className="btn-secondary px-5 py-2.5">← Back</button>
                <button onClick={next} className="btn-primary flex-1 py-2.5">Let's create your project →</button>
              </div>
            </div>
          )}

          {/* ── Step 5: Create project ── */}
          {step === 5 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color: 'var(--accent)'}}>Step 5 — Almost done</p>
              <h2 className="text-2xl mb-1" style={{fontFamily: 'var(--font-display)', color: 'var(--text)'}}>
                Create your first project
              </h2>
              <p className="text-sm mb-6" style={{color: 'var(--text-muted)'}}>
                Проверь данные и дай название проекту.
              </p>

              {/* Summary */}
              <div className="p-4 rounded-xl mb-5 space-y-2.5" style={{background: 'var(--accent-light)', border: '1px solid rgba(91,106,240,0.15)'}}>
                <p className="text-xs font-semibold mb-3" style={{color: 'var(--accent)'}}>Твои настройки:</p>
                {[
                  { label: 'Business', value: data.businessType === 'other' ? data.businessTypeCustom : data.businessType },
                  { label: 'Tone', value: data.tone || '—' },
                  { label: 'Style', value: data.narrativeStyle || '—' },
                  { label: 'Goal', value: data.goal || '—' },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3">
                    <span className="text-xs w-16 flex-shrink-0" style={{color: 'var(--accent)', fontWeight: 500}}>{row.label}</span>
                    <span className="text-xs" style={{color: 'var(--text-secondary)'}}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Project name */}
              <div className="mb-4">
                <label className="text-xs font-medium block mb-1.5" style={{color: 'var(--text-secondary)'}}>
                  Название проекта
                </label>
                <input
                  type="text"
                  placeholder={`Например: ${data.businessType === 'other' ? data.businessTypeCustom || 'Мой проект' : data.businessType}`}
                  value={data.projectName}
                  onChange={e => update('projectName', e.target.value)}
                  className="input w-full px-3.5 py-2.5"
                />
              </div>

              {error && (
                <div className="text-xs p-3 rounded-lg mb-4" style={{background: 'var(--red-light)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.15)'}}>
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={back} className="btn-secondary px-5 py-2.5">← Back</button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="btn-primary flex-1 py-2.5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Создаю проект...
                    </span>
                  ) : 'Create project →'}
                </button>
              </div>

              <p className="text-xs text-center mt-3" style={{color: 'var(--text-muted)'}}>
                AI сгенерирует стратегию автоматически на основе твоих данных
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
