'use client'

import { useState } from 'react'
import { deleteProjectAction } from '@/lib/actions'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'

export default function DeleteProjectButton({ projectId, light }: { projectId: string; light?: boolean }) {
  const { lang } = useLang()
  const tr = translations[lang]
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(true)
    await deleteProjectAction(projectId)
  }

  if (confirm) {
    return (
      <div style={{ display: 'flex', gap: 4 }} onClick={e => { e.preventDefault(); e.stopPropagation() }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            height: 26, padding: '0 8px', borderRadius: 5, fontSize: 11, fontWeight: 500,
            background: 'var(--red)', color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          {deleting ? '...' : tr.deleteProjectConfirm}
        </button>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirm(false) }}
          style={{
            height: 26, padding: '0 8px', borderRadius: 5, fontSize: 11,
            background: 'var(--bg-subtle)', color: 'var(--text-muted)',
            border: '1px solid var(--border-color)', cursor: 'pointer',
          }}
        >
          {tr.deleteProjectCancel}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirm(true) }}
      title={tr.deleteProject}
      style={{
        width: 26, height: 26, borderRadius: 6,
        border: light ? '1px solid rgba(255,255,255,0.25)' : '1px solid var(--border-color)',
        background: light ? 'rgba(0,0,0,0.15)' : 'transparent',
        cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: light ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
        transition: 'all 0.1s', flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = light ? 'rgba(255,255,255,0.6)' : 'var(--red)'
        e.currentTarget.style.color = light ? '#fff' : 'var(--red)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = light ? 'rgba(255,255,255,0.25)' : 'var(--border-color)'
        e.currentTarget.style.color = light ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 3h8M5 3V2h2v1M4.5 3v6M7.5 3v6M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}
