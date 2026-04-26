'use client'

import { useState } from 'react'
import { createPostIdeaAction } from '@/lib/actions'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'

const PLATFORMS = ['Instagram', 'TikTok', 'VK', 'YouTube', 'Telegram', 'Threads']

export default function AddPostForm({ hypothesisId }: { hypothesisId: string }) {
  const { lang } = useLang()
  const tr = translations[lang]
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [platform, setPlatform] = useState('Instagram')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    fd.set('hypothesisId', hypothesisId)
    fd.set('platform', platform)
    await createPostIdeaAction(fd)
    setSaving(false)
    setOpen(false)
    window.location.reload()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary" style={{ height: 32, fontSize: 12 }}>
        {tr.addPost}
      </button>
    )
  }

  return (
    <div className="card animate-fade-up" style={{ padding: 20, gridColumn: '1 / -1' }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>{tr.newPost}</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="text" name="title" placeholder={tr.postTitlePlaceholder} required className="input" />
        <textarea name="script" placeholder={tr.ideaScriptPlaceholder} rows={3} required className="input" style={{ height: 'auto', padding: '8px 12px' }} />
        <textarea name="caption" placeholder={tr.captionOptionalPlaceholder} rows={2} className="input" style={{ height: 'auto', padding: '8px 12px' }} />
        <input type="text" name="hashtags" placeholder={tr.hashtagsOptionalPlaceholder} className="input" />

        {/* Platform soft pill selector */}
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Платформа</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PLATFORMS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: platform === p ? 500 : 400,
                  border: platform === p ? '1.5px solid var(--accent, #5B6AF0)' : '1.5px solid var(--border-color)',
                  background: platform === p ? 'rgba(91,106,240,0.08)' : '#FAFAFA',
                  color: platform === p ? 'var(--accent, #5B6AF0)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Scheduled date */}
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Дата публикации</label>
          <input type="date" name="scheduledPublishDate" className="input" style={{ fontSize: 13 }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ height: 32, fontSize: 12 }}>
            {saving ? tr.saving : tr.addPostBtn}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary" style={{ height: 32, fontSize: 12 }}>
            {tr.cancel}
          </button>
        </div>
      </form>
    </div>
  )
}
