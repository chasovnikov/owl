'use client'

import { useState, useEffect } from 'react'
import { loginAction, signupAction } from '@/lib/actions'
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
      <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(145deg, #5B6AF0, #9B6BFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(91,106,240,0.32)' }}>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
          <path d="M10 18 C7.2 14.5 5.5 10.8 6 7 C6.5 3.5 10 2 13 3.5 C15.8 5 15.5 9.5 13 13 L10 18 Z" fill="white" opacity="0.96"/>
          <path d="M10 18 L12.5 5" stroke="rgba(91,106,240,0.45)" strokeWidth="0.9" strokeLinecap="round"/>
        </svg>
      </div>
      <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.025em', background: 'linear-gradient(135deg, #5B6AF0, #9B6BFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Fumi</span>
    </div>
  )
}

type Step = 'welcome' | 'signup' | 'login'

export default function PreAuthFlow() {
  const [step, setStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<Lang>('ru')
  useEffect(() => { setLang(getLang()) }, [])
  const tr = translations[lang]

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const formData = new FormData(e.currentTarget)
      await signupAction(formData)
    } catch (err: any) {
      setError(err.message || tr.signupError)
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const formData = new FormData(e.currentTarget)
      await loginAction(formData)
    } catch (err: any) {
      setError(err.message || tr.loginError)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{background: 'var(--bg)'}}>
      {/* Logo */}
      <div className="mb-10">
        <OwlLogo />
      </div>

      {/* Progress dots — только для welcome и signup */}
      {step !== 'login' && (
        <div className="flex items-center gap-2 mb-8">
          {['welcome', 'signup'].map((s) => (
            <div
              key={s}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: s === step ? '32px' : '16px',
                background: s === step || (s === 'welcome' && step === 'signup')
                  ? 'var(--accent)'
                  : 'var(--border)',
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-md">

        {/* ── Step 1: Welcome ── */}
        {step === 'welcome' && (
          <div className="card p-8 animate-fade-up text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(145deg, #5B6AF0, #9B6BFF)', boxShadow: '0 6px 20px rgba(91,106,240,0.35)' }}>
              <svg width="30" height="30" viewBox="0 0 20 20" fill="none">
                <path d="M10 18 C7.2 14.5 5.5 10.8 6 7 C6.5 3.5 10 2 13 3.5 C15.8 5 15.5 9.5 13 13 L10 18 Z" fill="white" opacity="0.96"/>
                <path d="M10 18 L12.5 5" stroke="rgba(91,106,240,0.45)" strokeWidth="0.9" strokeLinecap="round"/>
                <path d="M11.8 9.5 L14.8 8" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-2xl mb-2" style={{fontFamily: 'var(--font-display)', color: 'var(--text)'}}>
              Добро пожаловать в Fumi
            </h1>
            <p className="text-sm mb-6 leading-relaxed" style={{color: 'var(--text-secondary)'}}>
              Fumi помогает тестировать и улучшать контент для социальных сетей с помощью AI.
            </p>

            <div className="text-left space-y-3 mb-8 p-4 rounded-xl" style={{background: 'var(--bg-subtle)', border: '1px solid var(--border)'}}>
              {[
                { icon: '🧪', text: 'Создавай гипотезы контента' },
                { icon: '✨', text: 'Генерируй идеи постов с AI' },
                { icon: '📊', text: 'Анализируй результаты через скриншоты' },
              ].map(f => (
                <div key={f.text} className="flex items-center gap-3">
                  <span>{f.icon}</span>
                  <span className="text-sm" style={{color: 'var(--text-secondary)'}}>{f.text}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setStep('signup')} className="btn-primary w-full py-2.5">
              Начать →
            </button>
            <p className="text-xs mt-4" style={{color: 'var(--text-muted)'}}>
              Уже есть аккаунт?{' '}
              <button onClick={() => setStep('login')} style={{color: 'var(--accent)'}}>
                Войти
              </button>
            </p>
          </div>
        )}

        {/* ── Step 2: Sign up ── */}
        {step === 'signup' && (
          <div className="card p-8 animate-fade-up">
            <h2 className="text-2xl mb-1" style={{fontFamily: 'var(--font-display)', color: 'var(--text)'}}>
              Создать аккаунт
            </h2>
            <p className="text-sm mb-6" style={{color: 'var(--text-muted)'}}>
              Начни тестировать контент бесплатно
            </p>

            {error && (
              <div className="text-xs p-3 rounded-lg mb-4" style={{background: 'var(--red-light)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.15)'}}>
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{color: 'var(--text-secondary)'}}>Email</label>
                <input type="email" name="email" placeholder="you@example.com" required className="input w-full px-3.5 py-2.5" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{color: 'var(--text-secondary)'}}>Пароль</label>
                <input type="password" name="password" placeholder="Минимум 8 символов" minLength={8} required className="input w-full px-3.5 py-2.5" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{color: 'var(--text-secondary)'}}>Подтверди пароль</label>
                <input type="password" name="confirm" placeholder="••••••••" required className="input w-full px-3.5 py-2.5" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setStep('welcome'); setError('') }} className="btn-secondary px-4 py-2.5">
                  ← Назад
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Создаю...
                    </span>
                  ) : 'Создать аккаунт →'}
                </button>
              </div>
            </form>

            <p className="text-xs text-center mt-4" style={{color: 'var(--text-muted)'}}>
              Уже есть аккаунт?{' '}
              <button onClick={() => { setStep('login'); setError('') }} style={{color: 'var(--accent)'}}>
                Войти
              </button>
            </p>
          </div>
        )}

        {/* ── Login ── */}
        {step === 'login' && (
          <div className="card p-8 animate-fade-up">
            <h2 className="text-2xl mb-1" style={{fontFamily: 'var(--font-display)', color: 'var(--text)'}}>
              Добро пожаловать
            </h2>
            <p className="text-sm mb-6" style={{color: 'var(--text-muted)'}}>
              Войди в свой аккаунт Fumi
            </p>

            {error && (
              <div className="text-xs p-3 rounded-lg mb-4" style={{background: 'var(--red-light)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.15)'}}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{color: 'var(--text-secondary)'}}>Email</label>
                <input type="email" name="email" placeholder="you@example.com" required className="input w-full px-3.5 py-2.5" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{color: 'var(--text-secondary)'}}>Пароль</label>
                <input type="password" name="password" placeholder="••••••••" className="input w-full px-3.5 py-2.5" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1 disabled:opacity-50">
                {loading ? 'Входим...' : 'Войти →'}
              </button>
            </form>

            <p className="text-xs text-center mt-4" style={{color: 'var(--text-muted)'}}>
              Нет аккаунта?{' '}
              <button onClick={() => { setStep('welcome'); setError('') }} style={{color: 'var(--accent)'}}>
                Зарегистрироваться
              </button>
            </p>
          </div>
        )}

      </div>
    </main>
  )
}
