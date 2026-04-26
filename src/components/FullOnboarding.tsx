'use client'

import { useState, useRef, useEffect } from 'react'
import { signupAction, loginAction, createOnboardingProjectAction } from '@/lib/actions'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'
import { FumiLogo } from './OwlLogo'

/* ── Language Dropdown ──────────────────────────────────────────── */
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
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
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
                background: lang === opt.value ? 'var(--accent-bg)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s',
              }}
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

/* ── Spinner ──────────────────────────────────────────────────── */
function Spinner() {
  return (
    <span style={{
      width: 16, height: 16,
      border: '2px solid rgba(255,255,255,0.35)',
      borderTopColor: '#fff',
      borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      display: 'inline-block', flexShrink: 0,
    }} />
  )
}

/* ── Left panel step content ──────────────────────────────────── */
const STEP_META = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
        <path d="M10 18 C7.2 14.5 5.5 10.8 6 7 C6.5 3.5 10 2 13 3.5 C15.8 5 15.5 9.5 13 13 L10 18 Z" fill="white" opacity="0.96"/>
        <path d="M10 18 L12.5 5" stroke="rgba(91,106,240,0.45)" strokeWidth="0.9" strokeLinecap="round"/>
        <path d="M11.8 9.5 L14.8 8" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" strokeLinecap="round"/>
        <path d="M11 12.5 L14 11.5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="2" fill="white" opacity="0.9"/>
        <rect x="14" y="3" width="7" height="7" rx="2" fill="white" opacity="0.6"/>
        <rect x="3" y="14" width="7" height="7" rx="2" fill="white" opacity="0.6"/>
        <rect x="14" y="14" width="7" height="7" rx="2" fill="white" opacity="0.35"/>
      </svg>
    ),
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" opacity="0.5"/>
        <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.5" opacity="0.75"/>
        <circle cx="12" cy="12" r="2" fill="white"/>
      </svg>
    ),
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.5" opacity="0.9"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      </svg>
    ),
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L13.8 8.2H20.3L15.1 11.8L16.9 18L12 14.4L7.1 18L8.9 11.8L3.7 8.2H10.2L12 2Z" fill="white" opacity="0.9"/>
      </svg>
    ),
  },
]

/* ── Types ────────────────────────────────────────────────────── */
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

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */
export default function FullOnboarding() {
  const { lang } = useLang()
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

  const TOTAL = 5

  function update(field: keyof FormState, value: string) {
    setData(prev => ({ ...prev, [field]: value }))
  }
  function next() { setError(''); setStep(s => Math.min(s + 1, TOTAL)) }
  function skip() { setError(''); setStep(4) }
  function back() { setError(''); setStep(s => Math.max(s - 1, 1)) }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')
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
      setStep(5)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleCreate() {
    setLoading(true); setError('')
    try {
      const finalBusinessType = data.businessType === 'other'
        ? (data.businessTypeCustom || 'other') : data.businessType
      const fd = new window.FormData()
      fd.set('name', data.projectName || finalBusinessType)
      fd.set('businessType', finalBusinessType)
      fd.set('tone', data.tone)
      fd.set('narrativeStyle', data.narrativeStyle)
      fd.set('goal', data.goal)
      await createOnboardingProjectAction(fd)
    } catch (err: any) { setError(err.message); setLoading(false) }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const fd = new window.FormData()
      fd.set('email', data.email)
      fd.set('password', data.password)
      await loginAction(fd)
    } catch (err: any) { setError(err.message); setLoading(false) }
  }

  const stepIdx = Math.min(step - 1, STEP_META.length - 1)

  /* ── Left panel step labels (per-step overrides) ─────────── */
  const leftTitles = [
    tr.ob_step1Title,
    tr.ob_step2Title,
    tr.ob_step3Title,
    tr.ob_step5Title,
    tr.ob_step6Title,
  ]
  const leftDescs = [
    tr.ob_step1Desc,
    tr.ob_step2Desc,
    tr.ob_step3Desc,
    tr.ob_step5Desc,
    tr.ob_step6Desc,
  ]

  /* ── Login view ───────────────────────────────────────────── */
  if (showLogin) {
    return (
      <div className="ob-wrap">
        {/* Left panel */}
        <div className="ob-left">
          {/* Decorative orbs */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '40%', left: '60%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(155,107,255,0.18)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Logo */}
            <div style={{ marginBottom: 'auto' }}>
              <div style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}>
                <FumiLogo />
              </div>
            </div>

            {/* Center content */}
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', backdropFilter: 'blur(8px)',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.5" opacity="0.9"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
                {tr.ob_welcome}
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
                {tr.ob_loginSubtitle}
              </p>
            </div>

            <div style={{ marginTop: 'auto' }} />
          </div>
        </div>

        {/* Right panel */}
        <div className="ob-right">
          {/* Top bar */}
          <div style={{ position: 'absolute', top: 24, right: 32, display: 'flex', gap: 10, alignItems: 'center' }}>
            <LangDropdown />
            <button
              onClick={() => { setShowLogin(false); setError('') }}
              className="btn btn-secondary btn-sm"
            >
              {tr.ob_register}
            </button>
          </div>

          <div style={{ width: '100%', maxWidth: 400 }} className="anim-slide-up">
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.02em' }}>
              {tr.ob_welcome}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>{tr.ob_loginSubtitle}</p>

            {error && (
              <div style={{ fontSize: 12, padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'var(--red-light)', color: 'var(--red)', marginBottom: 16, border: '1px solid rgba(239,68,68,0.15)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>{tr.ob_emailLabel}</label>
                <input type="email" value={data.email} onChange={e => update('email', e.target.value)}
                  placeholder="you@example.com" required className="inp" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>{tr.ob_passwordLabel}</label>
                <input type="password" value={data.password} onChange={e => update('password', e.target.value)}
                  placeholder="••••••••" required className="inp" />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: 44, fontSize: 14 }}>
                {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner />{tr.ob_loggingIn}</span> : tr.ob_loginBtn}
              </button>
            </form>

            <p style={{ fontSize: 12, textAlign: 'center', marginTop: 16, color: 'var(--text-3)' }}>
              {tr.ob_noAccount}{' '}
              <button onClick={() => { setShowLogin(false); setError('') }}
                style={{ color: 'var(--accent)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                {tr.ob_register}
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ── Main onboarding ──────────────────────────────────────── */
  return (
    <div className="ob-wrap">
      {/* ── Left brand panel ──────────────────────────────── */}
      <div className="ob-left">
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '38%', left: '55%', width: 140, height: 140, borderRadius: '50%', background: 'rgba(155,107,255,0.15)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Logo */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}>
              <FumiLogo />
            </div>
          </div>

          {/* Step icon + text */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24, backdropFilter: 'blur(8px)',
            }}>
              {STEP_META[stepIdx].icon}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              {leftTitles[stepIdx]}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>
              {leftDescs[stepIdx]}
            </p>
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 40 }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div key={i} style={{
                height: 6, borderRadius: 99,
                width: i + 1 === step ? 20 : 6,
                background: i + 1 <= step ? '#fff' : 'rgba(255,255,255,0.25)',
                transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              }} />
            ))}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 6 }}>{step} / {TOTAL}</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────── */}
      <div className="ob-right" style={{ position: 'relative' }}>
        {/* Top-right controls */}
        <div style={{ position: 'absolute', top: 24, right: 32, display: 'flex', gap: 10, alignItems: 'center' }}>
          <LangDropdown />
          <button
            onClick={() => { setShowLogin(true); setError('') }}
            className="btn btn-secondary btn-sm"
          >
            {tr.ob_login}
          </button>
        </div>

        <div style={{ width: '100%', maxWidth: 420 }} className="anim-slide-up">

          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
                {tr.ob_step1Title}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.6 }}>
                {tr.ob_step1Desc}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {[
                  {
                    gradient: 'linear-gradient(135deg, #5B6AF0 0%, #818CF8 100%)',
                    shadow: 'rgba(91,106,240,0.25)',
                    icon: (<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/><rect x="11" y="3" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/><rect x="3" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/><rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.35"/></svg>),
                    title: tr.ob_f1Title, desc: tr.ob_f1Desc,
                  },
                  {
                    gradient: 'linear-gradient(135deg, #9B6BFF 0%, #C084FC 100%)',
                    shadow: 'rgba(155,107,255,0.25)',
                    icon: (<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="10" r="2.5" fill="white" opacity="0.9"/><circle cx="10" cy="10" r="2.5" fill="white" opacity="0.7"/><circle cx="15" cy="10" r="2.5" fill="white" opacity="0.5"/></svg>),
                    title: tr.ob_f2Title, desc: tr.ob_f2Desc,
                  },
                  {
                    gradient: 'linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)',
                    shadow: 'rgba(34,197,94,0.22)',
                    icon: (<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><polyline points="3,13 7,9 11,11 17,6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/><circle cx="17" cy="6" r="2" fill="white" opacity="0.9"/></svg>),
                    title: tr.ob_f3Title, desc: tr.ob_f3Desc,
                  },
                ].map(f => (
                  <div key={f.title} style={{
                    display: 'flex', gap: 14, padding: '14px 16px',
                    borderRadius: 'var(--r)', background: 'var(--surface)',
                    border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: f.gradient, boxShadow: `0 4px 12px ${f.shadow}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {f.icon}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{f.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={next} className="btn btn-primary" style={{ width: '100%', height: 46, fontSize: 14 }}>
                {tr.ob_startSetup}
              </button>
            </div>
          )}

          {/* ── Step 2: Business type ── */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: 6 }}>{tr.ob_step2Label}</p>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.02em' }}>{tr.ob_step2Title}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>{tr.ob_step2Desc}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {BUSINESS_TYPES.map(bt => (
                  <button key={bt.value} onClick={() => update('businessType', bt.value)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                    borderRadius: 'var(--r-sm)', textAlign: 'left', fontSize: 13, cursor: 'pointer',
                    border: data.businessType === bt.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: data.businessType === bt.value ? 'var(--accent-bg)' : 'var(--surface)',
                    color: data.businessType === bt.value ? 'var(--accent)' : 'var(--text-2)',
                    fontWeight: data.businessType === bt.value ? 500 : 400,
                    transition: 'all 0.15s',
                  }}>
                    {bt.label}
                  </button>
                ))}
              </div>

              {data.businessType === 'other' && (
                <input type="text" placeholder={tr.ob_descPlaceholder} value={data.businessTypeCustom}
                  onChange={e => update('businessTypeCustom', e.target.value)}
                  className="inp anim-fade-in" style={{ marginBottom: 16 }} autoFocus />
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={back} className="btn btn-secondary" style={{ height: 44, padding: '0 20px' }}>{tr.ob_back}</button>
                <button onClick={next}
                  disabled={!data.businessType || (data.businessType === 'other' && !data.businessTypeCustom)}
                  className="btn btn-primary"
                  style={{ flex: 1, height: 44, fontSize: 14, opacity: (!data.businessType || (data.businessType === 'other' && !data.businessTypeCustom)) ? 0.4 : 1 }}>
                  {tr.ob_continue}
                </button>
              </div>
              <button onClick={skip} style={{ width: '100%', textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>{tr.ob_skip}</button>
            </div>
          )}

          {/* ── Step 3: Strategy ── */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: 6 }}>{tr.ob_step3Label}</p>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.02em' }}>{tr.ob_step3Title}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>{tr.ob_step3Desc}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card" style={{ padding: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>{tr.strategyAudienceLabel}</label>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{tr.strategyAudienceHint}</p>
                  <textarea placeholder={tr.strategyAudiencePlaceholder} value={data.tone}
                    onChange={e => update('tone', e.target.value)} rows={3} className="inp" />
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>{tr.strategyVibeLabel}</label>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{tr.strategyVibeHint}</p>
                  <textarea placeholder={tr.strategyVibePlaceholder} value={data.narrativeStyle}
                    onChange={e => update('narrativeStyle', e.target.value)} rows={2} className="inp" />
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>{tr.strategyGoalLabel2}</label>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{tr.strategyGoalHint}</p>
                  <textarea placeholder={tr.strategyGoalPlaceholder2} value={data.goal}
                    onChange={e => update('goal', e.target.value)} rows={2} className="inp" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <button onClick={back} className="btn btn-secondary" style={{ height: 44, padding: '0 20px' }}>{tr.ob_back}</button>
                <button onClick={next} className="btn btn-primary" style={{ flex: 1, height: 44, fontSize: 14 }}>{tr.ob_continue}</button>
              </div>
              <button onClick={skip} style={{ width: '100%', textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>{tr.ob_skip}</button>
            </div>
          )}

          {/* ── Step 4: Account ── */}
          {step === 4 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: 6 }}>{tr.ob_step5Label}</p>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.02em' }}>{tr.ob_step5Title}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>{tr.ob_step5Desc}</p>

              {error && (
                <div style={{ fontSize: 12, padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'var(--red-light)', color: 'var(--red)', marginBottom: 16, border: '1px solid rgba(239,68,68,0.15)' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>{tr.ob_nameLabel}</label>
                  <input type="text" value={data.name} onChange={e => update('name', e.target.value)} placeholder={tr.ob_namePlaceholder} className="inp" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>{tr.ob_emailLabel}</label>
                  <input type="email" value={data.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" required className="inp" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>{tr.ob_passwordLabel}</label>
                  <input type="password" value={data.password} onChange={e => update('password', e.target.value)} placeholder={tr.ob_minPassword} minLength={8} required className="inp" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>{tr.ob_confirmPassword}</label>
                  <input type="password" value={data.confirm} onChange={e => update('confirm', e.target.value)} placeholder="••••••••" required className="inp" />
                </div>
                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                  <button type="button" onClick={back} className="btn btn-secondary" style={{ height: 44, padding: '0 20px' }}>{tr.ob_back}</button>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, height: 44, fontSize: 14 }}>
                    {loading
                      ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner />{tr.ob_creatingAccount}</span>
                      : tr.ob_createAccount}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Step 5: Create project ── */}
          {step === 5 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: 6 }}>{tr.ob_step6Label}</p>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.02em' }}>{tr.ob_step6Title}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>{tr.ob_step6Desc}</p>

              {/* Summary */}
              <div style={{ padding: 16, borderRadius: 'var(--r)', marginBottom: 20, background: 'var(--accent-bg)', border: '1px solid var(--accent-ring)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 10 }}>{tr.ob_yourSettings}</p>
                {[
                  { label: tr.ob_step2Label.split('—')[1]?.trim() || 'Business', value: data.businessType === 'other' ? data.businessTypeCustom : data.businessType },
                  { label: tr.audienceLabel, value: data.tone || '—' },
                  { label: tr.vibeLabel, value: data.narrativeStyle || '—' },
                  { label: tr.ob_goalLabel, value: data.goal || '—' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, width: 70, flexShrink: 0, fontWeight: 500, color: 'var(--accent)' }}>{row.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>{tr.ob_projectNameLabel}</label>
                <input type="text"
                  placeholder={data.businessType === 'other' ? data.businessTypeCustom || tr.ob_projectNameLabel : data.businessType}
                  value={data.projectName} onChange={e => update('projectName', e.target.value)}
                  className="inp" />
              </div>

              {error && (
                <div style={{ fontSize: 12, padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'var(--red-light)', color: 'var(--red)', marginBottom: 16, border: '1px solid rgba(239,68,68,0.15)' }}>
                  {error}
                </div>
              )}

              <button onClick={handleCreate} disabled={loading} className="btn btn-primary" style={{ width: '100%', height: 46, fontSize: 14 }}>
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner />{tr.ob_creatingProject}</span>
                  : tr.ob_createProject}
              </button>
              <p style={{ fontSize: 11, textAlign: 'center', marginTop: 12, color: 'var(--text-3)' }}>{tr.ob_aiAutoStrategy}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
