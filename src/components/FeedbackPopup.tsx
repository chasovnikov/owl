'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyyWE7afnQGBm89NJaHPZlIgGxSVXiiyZ0C9rlkDwRbq0fqV90aLqsMKT4s5uQdj-m3rA/exec'

const EXCLUDED_PATHS = ['/', '/onboarding']

export default function FeedbackPopup({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const { lang } = useLang()
  const tr = translations[lang]

  const [visible, setVisible] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [joinTester, setJoinTester] = useState(false)
  const [email, setEmail] = useState(userEmail)
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (EXCLUDED_PATHS.includes(pathname)) return
    if (sessionStorage.getItem('feedbackShown')) return

    const timer = setTimeout(() => {
      if (!sessionStorage.getItem('feedbackShown')) {
        setVisible(true)
      }
    }, 120000)

    return () => clearTimeout(timer)
  }, [pathname])

  function dismiss() {
    sessionStorage.setItem('feedbackShown', 'true')
    setVisible(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) return
    setSubmitting(true)
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment,
          joinTester,
          email,
          contact,
          timestamp: new Date().toISOString(),
          page: pathname,
        }),
      })
    } catch {
      // не блокируем пользователя при ошибке сети
    }
    setSubmitted(true)
    setSubmitting(false)
    sessionStorage.setItem('feedbackShown', 'true')
    setTimeout(() => setVisible(false), 2000)
  }

  if (!visible) return null

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="card animate-fade-up"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 420, borderRadius: 10, padding: 24, background: 'var(--surface)' }}
      >
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: 20, marginBottom: 6 }}>{tr.thanks}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tr.feedbackImportant}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{tr.howsOwl}</h2>
              <button
                type="button"
                onClick={dismiss}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, lineHeight: 1, fontSize: 18 }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                    fontSize: 26, lineHeight: 1,
                    color: star <= (hovered || rating) ? '#F59E0B' : '#D4D4D8',
                    transition: 'color 0.1s',
                  }}
                >
                  ★
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <textarea
                className="input"
                rows={3}
                placeholder={tr.leaveComment}
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>

            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14, cursor: 'pointer' }}>
              <div
                onClick={() => setJoinTester(v => !v)}
                style={{
                  width: 36, height: 20, borderRadius: 10, flexShrink: 0, marginTop: 1,
                  background: joinTester ? 'var(--accent-color)' : '#D4D4D8',
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, left: joinTester ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {tr.joinTester}
              </span>
            </label>

            <div style={{ marginBottom: 14 }}>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                {tr.contactHint}
              </p>
              <input
                className="input"
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder={tr.contactPlaceholder}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={dismiss}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', textDecoration: 'underline', padding: 0 }}
              >
                {tr.later}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={rating === 0 || submitting}
              >
                {submitting ? tr.submitting : tr.submitFeedback}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
