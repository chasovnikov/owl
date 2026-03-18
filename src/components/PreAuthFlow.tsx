'use client'

import { useState } from 'react'
import { loginAction, signupAction } from '@/lib/actions'

function OwlLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill="#5B6AF0"/>
        <ellipse cx="10" cy="13" rx="3" ry="3.5" fill="white" opacity="0.95"/>
        <ellipse cx="18" cy="13" rx="3" ry="3.5" fill="white" opacity="0.95"/>
        <circle cx="10" cy="13" r="1.5" fill="#5B6AF0"/>
        <circle cx="18" cy="13" r="1.5" fill="#5B6AF0"/>
        <path d="M11.5 18.5 C12.5 19.5 15.5 19.5 16.5 18.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.9"/>
        <path d="M12 8 L14 10 L16 8" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
      </svg>
      <span style={{fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--text)'}}>OWL</span>
    </div>
  )
}

type Step = 'welcome' | 'signup' | 'login'

export default function PreAuthFlow() {
  const [step, setStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const formData = new FormData(e.currentTarget)
      await signupAction(formData)
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации')
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
      setError(err.message || 'Ошибка входа')
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5" style={{background: 'var(--accent-light)'}}>
              🦉
            </div>
            <h1 className="text-2xl mb-2" style={{fontFamily: 'var(--font-display)', color: 'var(--text)'}}>
              Добро пожаловать в OWL
            </h1>
            <p className="text-sm mb-6 leading-relaxed" style={{color: 'var(--text-secondary)'}}>
              OWL помогает тестировать и улучшать контент для социальных сетей с помощью AI.
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
              Войди в свой аккаунт OWL
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
