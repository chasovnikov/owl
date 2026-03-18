'use client'

import { useState } from 'react'
import { loginAction, signupAction } from '@/lib/actions'

export default function AuthTabs() {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <div>
      <h2 className="text-2xl mb-1" style={{fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.02em'}}>
        {tab === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
      </h2>
      <p className="text-sm mb-6" style={{color: 'var(--text-muted)'}}>
        {tab === 'login' ? 'Войди в свой аккаунт OWL' : 'Начни тестировать контент бесплатно'}
      </p>

      {/* Tabs */}
      <div className="flex mb-6 p-1 rounded-lg" style={{background: 'var(--bg-subtle)', border: '1px solid var(--border)'}}>
        {(['login', 'signup'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError('') }}
            className="flex-1 py-2 text-sm rounded-md transition-all"
            style={{
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              background: tab === t ? 'var(--surface)' : 'transparent',
              color: tab === t ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: tab === t ? 'var(--shadow-xs)' : 'none',
              border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
            }}
          >
            {t === 'login' ? 'Войти' : 'Регистрация'}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs p-3 rounded-lg mb-4" style={{background: 'var(--red-light)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.15)'}}>
          {error}
        </div>
      )}

      {/* Login form */}
      {tab === 'login' && (
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
          <p className="text-xs text-center" style={{color: 'var(--text-muted)'}}>
            Нет аккаунта?{' '}
            <button type="button" onClick={() => setTab('signup')} style={{color: 'var(--accent)'}}>
              Зарегистрироваться
            </button>
          </p>
        </form>
      )}

      {/* Signup form */}
      {tab === 'signup' && (
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
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1 disabled:opacity-50">
            {loading ? 'Создаю аккаунт...' : 'Создать аккаунт →'}
          </button>
          <p className="text-xs text-center" style={{color: 'var(--text-muted)'}}>
            Уже есть аккаунт?{' '}
            <button type="button" onClick={() => setTab('login')} style={{color: 'var(--accent)'}}>
              Войти
            </button>
          </p>
        </form>
      )}
    </div>
  )
}
