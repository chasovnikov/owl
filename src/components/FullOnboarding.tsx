'use client'

import { useState } from 'react'
import { signupAction, loginAction, createOnboardingProjectAction } from '@/lib/actions'

const BUSINESS_TYPES = [
  { value: 'coffee shop', label: '☕ Coffee shop' },
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'local business', label: '🏪 Local business' },
  { value: 'personal brand', label: '✨ Personal brand' },
  { value: 'agency', label: '🏢 Agency' },
  { value: 'e-commerce', label: '🛍️ E-commerce' },
  { value: 'online creator', label: '🎬 Online creator' },
  { value: 'startup', label: '🚀 Startup' },
  { value: 'education', label: '📚 Education' },
  { value: 'fitness / wellness', label: '💪 Fitness / wellness' },
  { value: 'other', label: '📦 Other' },
]

function OwlLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill="#5B6AF0"/>
        <ellipse cx="10" cy="13" rx="3" ry="3.5" fill="white" opacity="0.95"/>
        <ellipse cx="18" cy="13" rx="3" ry="3.5" fill="white" opacity="0.95"/>
        <circle cx="10" cy="13" r="1.5" fill="#5B6AF0"/>
        <circle cx="18" cy="13" r="1.5" fill="#5B6AF0"/>
        <path d="M11.5 18.5 C12.5 19.5 15.5 19.5 16.5 18.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.9"/>
        <path d="M12 8 L14 10 L16 8" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
      </svg>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', letterSpacing: '-0.02em', color: 'var(--text)' }}>OWL</span>
    </div>
  )
}

interface FormState {
  businessType: string
  businessTypeCustom: string
  tone: string
  narrativeStyle: string
  goal: string
  projectName: string
  email: string
  password: string
  confirm: string
}

export default function FullOnboarding() {
  const [step, setStep] = useState(1)
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<FormState>({
    businessType: '', businessTypeCustom: '',
    tone: '', narrativeStyle: '', goal: '',
    projectName: '', email: '', password: '', confirm: '',
  })

  const TOTAL = 6

  function update(field: keyof FormState, value: string) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  function next() { setError(''); setStep(s => Math.min(s + 1, TOTAL)) }
  function back() { setError(''); setStep(s => Math.max(s - 1, 1)) }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (!data.email.includes('@')) throw new Error('Неверный формат email')
      if (data.password.length < 8) throw new Error('Пароль минимум 8 символов')
      if (data.password !== data.confirm) throw new Error('Пароли не совпадают')
      const fd = new window.FormData()
      fd.set('email', data.email)
      fd.set('password', data.password)
      fd.set('confirm', data.confirm)
      fd.set('skipRedirect', 'true')
      await signupAction(fd)
      setStep(6)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const finalBusinessType = data.businessType === 'other'
        ? (data.businessTypeCustom || 'other')
        : data.businessType
      const fd = new window.FormData()
      fd.set('name', data.projectName || finalBusinessType)
      fd.set('businessType', finalBusinessType)
      fd.set('tone', data.tone)
      fd.set('narrativeStyle', data.narrativeStyle)
      fd.set('goal', data.goal)
      await createOnboardingProjectAction(fd)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const fd = new window.FormData()
      fd.set('email', data.email)
      fd.set('password', data.password)
      await loginAction(fd)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const s = {
    accent: { color: 'var(--accent)' },
    muted: { color: 'var(--text-muted)' },
    text: { color: 'var(--text)' },
    secondary: { color: 'var(--text-secondary)' },
    subtle: { background: 'var(--bg-subtle)', border: '1px solid var(--border)' } as React.CSSProperties,
    border: { borderColor: 'var(--border)', background: 'var(--surface)' } as React.CSSProperties,
    error: { background: 'var(--red-light)', color: 'var(--red)' } as React.CSSProperties,
  }

  if (showLogin) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="mb-8"><OwlLogo /></div>
        <div className="w-full max-w-sm card p-8">
          <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', ...s.text }}>Добро пожаловать</h2>
          <p className="text-sm mb-6" style={s.muted}>Войди в аккаунт OWL</p>
          {error && <div className="text-xs p-3 rounded-lg mb-4" style={s.error}>{error}</div>}
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={s.secondary}>Email</label>
              <input type="email" value={data.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" required className="input w-full px-3.5 py-2.5" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={s.secondary}>Пароль</label>
              <input type="password" value={data.password} onChange={e => update('password', e.target.value)} placeholder="••••••••" required className="input w-full px-3.5 py-2.5" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 disabled:opacity-50">
              {loading ? 'Входим...' : 'Войти →'}
            </button>
          </form>
          <p className="text-xs text-center mt-4" style={s.muted}>
            Нет аккаунта?{' '}
            <button onClick={() => { setShowLogin(false); setError('') }} style={s.accent}>Зарегистрироваться</button>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="flex items-center justify-between px-8 py-4 border-b" style={s.border}>
        <OwlLogo />
        <button onClick={() => { setShowLogin(true); setError('') }} className="btn-secondary px-4 py-2 text-xs">Войти</button>
      </header>

      <div className="w-full h-0.5" style={{ background: 'var(--border)' }}>
        <div className="h-full transition-all duration-500" style={{ width: `${(step / TOTAL) * 100}%`, background: 'var(--accent)' }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {step < 6 && (
            <div className="flex items-center gap-1.5 mb-8">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <div key={i} className="rounded-full transition-all duration-300" style={{
                  width: i + 1 === step ? '20px' : '6px',
                  height: '6px',
                  background: i + 1 <= step ? 'var(--accent)' : 'var(--border)',
                }} />
              ))}
              <span className="text-xs ml-2" style={s.muted}>{step} / {TOTAL}</span>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-up">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-6" style={{ background: 'var(--accent-light)' }}>🦉</div>
              <h1 className="text-3xl mb-3" style={{ fontFamily: 'var(--font-display)', ...s.text, letterSpacing: '-0.02em' }}>
                Meet OWL — your AI copilot for content experiments
              </h1>
              <p className="text-sm mb-8 leading-relaxed" style={s.secondary}>
                OWL помогает тестировать гипотезы контента, понимать что работает в соцсетях и строить системный контент-план.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  { icon: '⚡', title: 'Generate content ideas faster', desc: 'AI помогает генерировать и улучшать идеи постов.' },
                  { icon: '🧪', title: 'Test content hypotheses', desc: 'Проверяй гипотезы и смотри какие форматы работают лучше.' },
                  { icon: '📅', title: 'Turn strategy into a real posting plan', desc: 'OWL превращает стратегию в конкретный план публикаций.' },
                ].map(f => (
                  <div key={f.title} className="flex gap-4 p-4 rounded-xl" style={s.subtle}>
                    <span className="text-xl flex-shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={s.text}>{f.title}</p>
                      <p className="text-xs leading-relaxed" style={s.secondary}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={next} className="btn-primary w-full py-3">Start setup →</button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={s.accent}>Step 2 — Business</p>
              <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', ...s.text }}>What kind of business are you working on?</h2>
              <p className="text-sm mb-6" style={s.muted}>We use this to generate relevant content ideas.</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {BUSINESS_TYPES.map(bt => (
                  <button key={bt.value} onClick={() => update('businessType', bt.value)}
                    className="flex items-center gap-2.5 p-3 rounded-xl text-left text-sm transition-all"
                    style={{
                      border: data.businessType === bt.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: data.businessType === bt.value ? 'var(--accent-light)' : 'var(--surface)',
                      color: data.businessType === bt.value ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: data.businessType === bt.value ? 500 : 400,
                    }}>
                    {bt.label}
                  </button>
                ))}
              </div>
              {data.businessType === 'other' && (
                <input type="text" placeholder="Describe your business..." value={data.businessTypeCustom}
                  onChange={e => update('businessTypeCustom', e.target.value)}
                  className="input w-full px-3.5 py-2.5 mb-4 animate-fade-up" autoFocus />
              )}
              <div className="flex gap-2 mt-2">
                <button onClick={back} className="btn-secondary px-5 py-2.5">← Back</button>
                <button onClick={next}
                  disabled={!data.businessType || (data.businessType === 'other' && !data.businessTypeCustom)}
                  className="btn-primary flex-1 py-2.5 disabled:opacity-40">Continue →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={s.accent}>Step 3 — Strategy</p>
              <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', ...s.text }}>Define your content strategy</h2>
              <p className="text-sm mb-6" style={s.muted}>OWL будет использовать это для генерации релевантного контента.</p>
              <div className="space-y-4">
                {[
                  { field: 'tone' as const, label: 'Tone of voice', placeholder: 'friendly, premium, educational, funny, bold...', hint: 'Помогает OWL писать тексты в нужном стиле.' },
                  { field: 'narrativeStyle' as const, label: 'Narrative style', placeholder: 'cozy lifestyle, behind the scenes, expert tips...', hint: 'OWL генерирует посты в стиле бренда.' },
                  { field: 'goal' as const, label: 'Goal', placeholder: 'get more visitors, build community, sell products...', hint: 'OWL предложит контент для достижения цели.' },
                ].map(f => (
                  <div key={f.field} className="card p-4">
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={s.muted}>{f.label}</label>
                    <p className="text-xs mb-2" style={s.muted}>{f.hint}</p>
                    <input type="text" placeholder={f.placeholder} value={data[f.field]}
                      onChange={e => update(f.field, e.target.value)} className="input w-full px-3.5 py-2.5" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={back} className="btn-secondary px-5 py-2.5">← Back</button>
                <button onClick={next} className="btn-primary flex-1 py-2.5">Continue →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={s.accent}>Step 4 — How it works</p>
              <h2 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-display)', ...s.text }}>How OWL helps you grow your content</h2>
              <p className="text-sm mb-7" style={s.muted}>Три простых шага от идеи до результата.</p>
              <div className="space-y-3 mb-7">
                {[
                  { num: '01', title: 'Create hypotheses', desc: 'Формулируй гипотезы — например "Reels с историями бариста получают больше сохранений". OWL превращает идеи в тестируемые гипотезы.', bg: 'var(--accent-light)', fg: 'var(--accent)' },
                  { num: '02', title: 'Generate content plan', desc: 'OWL создаёт идеи постов на основе гипотез. Сразу получаешь готовый контент-план с подписями и хэштегами.', bg: '#F0FDF4', fg: 'var(--green)' },
                  { num: '03', title: 'Track what works', desc: 'Загружай скриншот аналитики — OWL извлекает метрики и помогает понять какие форматы работают.', bg: '#FFF7ED', fg: 'var(--amber)' },
                ].map(st => (
                  <div key={st.num} className="flex gap-4 p-4 rounded-xl" style={s.subtle}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: st.bg, color: st.fg }}>{st.num}</div>
                    <div>
                      <p className="text-sm font-semibold mb-1" style={s.text}>{st.title}</p>
                      <p className="text-xs leading-relaxed" style={s.secondary}>{st.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={back} className="btn-secondary px-5 py-2.5">← Back</button>
                <button onClick={next} className="btn-primary flex-1 py-2.5">Create account →</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={s.accent}>Step 5 — Create account</p>
              <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', ...s.text }}>Almost there!</h2>
              <p className="text-sm mb-6" style={s.muted}>Создай аккаунт чтобы сохранить настройки.</p>
              {error && <div className="text-xs p-3 rounded-lg mb-4" style={s.error}>{error}</div>}
              <form onSubmit={handleSignup} className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={s.secondary}>Email</label>
                  <input type="email" value={data.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" required className="input w-full px-3.5 py-2.5" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={s.secondary}>Пароль</label>
                  <input type="password" value={data.password} onChange={e => update('password', e.target.value)} placeholder="Минимум 8 символов" minLength={8} required className="input w-full px-3.5 py-2.5" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={s.secondary}>Подтверди пароль</label>
                  <input type="password" value={data.confirm} onChange={e => update('confirm', e.target.value)} placeholder="••••••••" required className="input w-full px-3.5 py-2.5" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={back} className="btn-secondary px-5 py-2.5">← Back</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 disabled:opacity-50">
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Создаю...</span>
                      : 'Создать аккаунт →'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 6 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={s.accent}>Последний шаг 🎉</p>
              <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', ...s.text }}>Create your first project</h2>
              <p className="text-sm mb-6" style={s.muted}>Проверь данные и дай название проекту.</p>
              <div className="p-4 rounded-xl mb-5 space-y-2" style={{ background: 'var(--accent-light)', border: '1px solid rgba(91,106,240,0.15)' }}>
                <p className="text-xs font-semibold mb-2" style={s.accent}>Твои настройки:</p>
                {[
                  { label: 'Business', value: data.businessType === 'other' ? data.businessTypeCustom : data.businessType },
                  { label: 'Tone', value: data.tone || '—' },
                  { label: 'Style', value: data.narrativeStyle || '—' },
                  { label: 'Goal', value: data.goal || '—' },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3">
                    <span className="text-xs w-16 flex-shrink-0 font-medium" style={s.accent}>{row.label}</span>
                    <span className="text-xs" style={s.secondary}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mb-5">
                <label className="text-xs font-medium block mb-1.5" style={s.secondary}>Название проекта</label>
                <input type="text"
                  placeholder={data.businessType === 'other' ? data.businessTypeCustom || 'Мой проект' : data.businessType}
                  value={data.projectName} onChange={e => update('projectName', e.target.value)}
                  className="input w-full px-3.5 py-2.5" />
              </div>
              {error && <div className="text-xs p-3 rounded-lg mb-4" style={s.error}>{error}</div>}
              <button onClick={handleCreate} disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Создаю проект...</span>
                  : 'Create project →'}
              </button>
              <p className="text-xs text-center mt-3" style={s.muted}>AI сгенерирует стратегию автоматически</p>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
