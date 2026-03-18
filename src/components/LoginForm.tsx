'use client'

import { loginAction } from '@/lib/actions'
import { useState } from 'react'

export default function LoginForm() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await loginAction(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        name="email"
        placeholder="твой@email.com"
        required
        className="input w-full px-3.5 py-2.5"
      />
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-2.5"
      >
        {loading ? 'Входим...' : 'Начать →'}
      </button>
      <p className="text-xs text-center" style={{color: 'var(--text-muted)'}}>Без пароля и карты</p>
    </form>
  )
}
