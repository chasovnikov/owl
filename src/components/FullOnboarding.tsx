'use client'

import { useState, useRef, useEffect } from 'react'
import { signupAction, loginAction, createOnboardingProjectAction } from '@/lib/actions'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'
import { FumiLogo } from './OwlLogo'

function LangDropdown() {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const options = [
    { value: 'ru' as const, label: '🇷🇺  Русский' },
    { value: 'en' as const, label: '🇬🇧  English' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderRadius: 7, fontSize: 13, fontWeight: 500,
          border: '1px solid var(--border-color)', background: 'var(--surface)',
          color: 'var(--text-secondary)', cursor: 'pointer', transition: 'border-color 0.15s',
        }}
      >
        {lang === 'ru' ? '🇷🇺  RU' : '🇬🇧  EN'}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--surface)', border: '1px solid var(--border-color)',
          borderRadius: 8, padding: 4, minWidth: 140,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 100,
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setLang(opt.value); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '8px 10px', borderRadius: 5,
                fontSize: 13, fontWeight: lang === opt.value ? 500 : 400,
                color: lang === opt.value ? 'var(--accent)' : 'var(--text-secondary)',
                background: lang === opt.value ? 'var(--accent-light, rgba(91,106,240,0.07))' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (lang !== opt.value) e.currentTarget.style.background = 'var(--bg-subtle, #f4f4f5)' }}
              onMouseLeave={e => { if (lang !== opt.value) e.currentTarget.style.background = 'transparent' }}
            >
              {opt.label}
              {lang === opt.value && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto' }}>
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
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
  name: string
  email: string
  password: string
  confirm: string
}

export default function FullOnboarding() {
  const { lang, setLang } = useLang()
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
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<FormState>({
    businessType: '', businessTypeCustom: '',
    tone: '', narrativeStyle: '', goal: '',
    projectName: '', name: '', email: '', password: '', confirm: '',
  })

  const TOTAL = 6

  function update(field: keyof FormState, value: string) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  function next() { setError(''); setStep(s => Math.min(s + 1, TOTAL)) }
  function skip() { setError(''); setStep(5) }
  function back() { setError(''); setStep(s => Math.max(s - 1, 1)) }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (!data.email.includes('@')) throw new Error(tr.ob_invalidEmail)
      if (data.password.length < 8) throw new Error(tr.ob_shortPassword)
      if (data.password !== data.confirm) throw new Error(tr.ob_passwordMismatch)
      const fd = new window.FormData()
      fd.set('name', data.name)
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
        <div className="mb-8 flex items-center gap-4">
          <FumiLogo />
          <LangDropdown />
        </div>
        <div className="w-full max-w-sm card p-8">
          <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', ...s.text }}>{tr.ob_welcome}</h2>
          <p className="text-sm mb-6" style={s.muted}>{tr.ob_loginSubtitle}</p>
          {error && <div className="text-xs p-3 rounded-lg mb-4" style={s.error}>{error}</div>}
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={s.secondary}>{tr.ob_emailLabel}</label>
              <input type="email" value={data.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" required className="input w-full px-3.5 py-2.5" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={s.secondary}>{tr.ob_passwordLabel}</label>
              <input type="password" value={data.password} onChange={e => update('password', e.target.value)} placeholder="••••••••" required className="input w-full px-3.5 py-2.5" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 disabled:opacity-50">
              {loading ? tr.ob_loggingIn : tr.ob_loginBtn}
            </button>
          </form>
          <p className="text-xs text-center mt-4" style={s.muted}>
            {tr.ob_noAccount}{' '}
            <button onClick={() => { setShowLogin(false); setError('') }} style={s.accent}>{tr.ob_register}</button>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="flex items-center justify-between px-8 py-4 border-b" style={s.border}>
        <FumiLogo />
        <div className="flex items-center gap-3">
          <LangDropdown />
          <button onClick={() => { setShowLogin(true); setError('') }} className="btn-secondary px-4 py-2 text-xs">{tr.ob_login}</button>
        </div>
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
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(145deg, #5B6AF0, #9B6BFF)', boxShadow: '0 4px 16px rgba(91,106,240,0.30)' }}>
                <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
                  <path d="M10 18 C7.2 14.5 5.5 10.8 6 7 C6.5 3.5 10 2 13 3.5 C15.8 5 15.5 9.5 13 13 L10 18 Z" fill="white" opacity="0.96"/>
                  <path d="M10 18 L12.5 5" stroke="rgba(91,106,240,0.45)" strokeWidth="0.9" strokeLinecap="round"/>
                  <path d="M11.8 9.5 L14.8 8" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" strokeLinecap="round"/>
                  <path d="M11 12.5 L14 11.5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 className="text-3xl mb-3" style={{ fontFamily: 'var(--font-display)', ...s.text, letterSpacing: '-0.02em' }}>
                {tr.ob_step1Title}
              </h1>
              <p className="text-sm mb-8 leading-relaxed" style={s.secondary}>
                {tr.ob_step1Desc}
              </p>
              <div className="space-y-3 mb-8">
                {[
                  { icon: '⚡', title: tr.ob_f1Title, desc: tr.ob_f1Desc },
                  { icon: '🧪', title: tr.ob_f2Title, desc: tr.ob_f2Desc },
                  { icon: '📅', title: tr.ob_f3Title, desc: tr.ob_f3Desc },
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
              <button onClick={next} className="btn-primary w-full py-3">{tr.ob_startSetup}</button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={s.accent}>{tr.ob_step2Label}</p>
              <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', ...s.text }}>{tr.ob_step2Title}</h2>
              <p className="text-sm mb-6" style={s.muted}>{tr.ob_step2Desc}</p>
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
                <input type="text" placeholder={tr.ob_descPlaceholder} value={data.businessTypeCustom}
                  onChange={e => update('businessTypeCustom', e.target.value)}
                  className="input w-full px-3.5 py-2.5 mb-4 animate-fade-up" autoFocus />
              )}
              <div className="flex gap-2 mt-2">
                <button onClick={back} className="btn-secondary px-5 py-2.5">{tr.ob_back}</button>
                <button onClick={next}
                  disabled={!data.businessType || (data.businessType === 'other' && !data.businessTypeCustom)}
                  className="btn-primary flex-1 py-2.5 disabled:opacity-40">{tr.ob_continue}</button>
              </div>
              <button onClick={skip} className="w-full text-center mt-3 text-xs" style={s.muted}>{tr.ob_skip}</button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={s.accent}>{tr.ob_step3Label}</p>
              <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', ...s.text }}>{tr.ob_step3Title}</h2>
              <p className="text-sm mb-6" style={s.muted}>{tr.ob_step3Desc}</p>
              <div className="space-y-4">
                <div className="card p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={s.muted}>{tr.strategyAudienceLabel}</label>
                  <p className="text-xs mb-2" style={s.muted}>{tr.strategyAudienceHint}</p>
                  <textarea placeholder={tr.strategyAudiencePlaceholder} value={data.tone}
                    onChange={e => update('tone', e.target.value)} rows={3} className="input w-full px-3.5 py-2.5" />
                </div>
                <div className="card p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={s.muted}>{tr.strategyVibeLabel}</label>
                  <p className="text-xs mb-2" style={s.muted}>{tr.strategyVibeHint}</p>
                  <textarea placeholder={tr.strategyVibePlaceholder} value={data.narrativeStyle}
                    onChange={e => update('narrativeStyle', e.target.value)} rows={2} className="input w-full px-3.5 py-2.5" />
                </div>
                <div className="card p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={s.muted}>{tr.strategyGoalLabel2}</label>
                  <p className="text-xs mb-2" style={s.muted}>{tr.strategyGoalHint}</p>
                  <textarea placeholder={tr.strategyGoalPlaceholder2} value={data.goal}
                    onChange={e => update('goal', e.target.value)} rows={2} className="input w-full px-3.5 py-2.5" />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={back} className="btn-secondary px-5 py-2.5">{tr.ob_back}</button>
                <button onClick={next} className="btn-primary flex-1 py-2.5">{tr.ob_continue}</button>
              </div>
              <button onClick={skip} className="w-full text-center mt-3 text-xs" style={s.muted}>{tr.ob_skip}</button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={s.accent}>{tr.ob_step4Label}</p>
              <h2 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-display)', ...s.text }}>{tr.ob_step4Title}</h2>
              <p className="text-sm mb-7" style={s.muted}>{tr.ob_step4Desc}</p>
              <div className="space-y-3 mb-7">
                {[
                  { num: '01', title: tr.ob_h1Title, desc: tr.ob_h1Desc, bg: 'var(--accent-light)', fg: 'var(--accent)' },
                  { num: '02', title: tr.ob_h2Title, desc: tr.ob_h2Desc, bg: '#F0FDF4', fg: 'var(--green)' },
                  { num: '03', title: tr.ob_h3Title, desc: tr.ob_h3Desc, bg: '#FFF7ED', fg: 'var(--amber)' },
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
                <button onClick={back} className="btn-secondary px-5 py-2.5">{tr.ob_back}</button>
                <button onClick={next} className="btn-primary flex-1 py-2.5">{tr.ob_createAccount}</button>
              </div>
              <button onClick={skip} className="w-full text-center mt-3 text-xs" style={s.muted}>{tr.ob_skip}</button>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={s.accent}>{tr.ob_step5Label}</p>
              <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', ...s.text }}>{tr.ob_step5Title}</h2>
              <p className="text-sm mb-6" style={s.muted}>{tr.ob_step5Desc}</p>
              {error && <div className="text-xs p-3 rounded-lg mb-4" style={s.error}>{error}</div>}
              <form onSubmit={handleSignup} className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={s.secondary}>{tr.ob_nameLabel}</label>
                  <input type="text" value={data.name} onChange={e => update('name', e.target.value)} placeholder={tr.ob_namePlaceholder} className="input w-full px-3.5 py-2.5" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={s.secondary}>{tr.ob_emailLabel}</label>
                  <input type="email" value={data.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" required className="input w-full px-3.5 py-2.5" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={s.secondary}>{tr.ob_passwordLabel}</label>
                  <input type="password" value={data.password} onChange={e => update('password', e.target.value)} placeholder={tr.ob_minPassword} minLength={8} required className="input w-full px-3.5 py-2.5" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={s.secondary}>{tr.ob_confirmPassword}</label>
                  <input type="password" value={data.confirm} onChange={e => update('confirm', e.target.value)} placeholder="••••••••" required className="input w-full px-3.5 py-2.5" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={back} className="btn-secondary px-5 py-2.5">{tr.ob_back}</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 disabled:opacity-50">
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{tr.ob_creatingAccount}</span>
                      : tr.ob_createAccount}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 6 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={s.accent}>{tr.ob_step6Label}</p>
              <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', ...s.text }}>{tr.ob_step6Title}</h2>
              <p className="text-sm mb-6" style={s.muted}>{tr.ob_step6Desc}</p>
              <div className="p-4 rounded-xl mb-5 space-y-2" style={{ background: 'var(--accent-light)', border: '1px solid rgba(91,106,240,0.15)' }}>
                <p className="text-xs font-semibold mb-2" style={s.accent}>{tr.ob_yourSettings}</p>
                {[
                  { label: tr.ob_step2Label.split('—')[1]?.trim() || 'Business', value: data.businessType === 'other' ? data.businessTypeCustom : data.businessType },
                  { label: tr.audienceLabel, value: data.tone || '—' },
                  { label: tr.vibeLabel, value: data.narrativeStyle || '—' },
                  { label: tr.ob_goalLabel, value: data.goal || '—' },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3">
                    <span className="text-xs w-16 flex-shrink-0 font-medium" style={s.accent}>{row.label}</span>
                    <span className="text-xs" style={s.secondary}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mb-5">
                <label className="text-xs font-medium block mb-1.5" style={s.secondary}>{tr.ob_projectNameLabel}</label>
                <input type="text"
                  placeholder={data.businessType === 'other' ? data.businessTypeCustom || tr.ob_projectNameLabel : data.businessType}
                  value={data.projectName} onChange={e => update('projectName', e.target.value)}
                  className="input w-full px-3.5 py-2.5" />
              </div>
              {error && <div className="text-xs p-3 rounded-lg mb-4" style={s.error}>{error}</div>}
              <button onClick={handleCreate} disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{tr.ob_creatingProject}</span>
                  : tr.ob_createProject}
              </button>
              <p className="text-xs text-center mt-3" style={s.muted}>{tr.ob_aiAutoStrategy}</p>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
