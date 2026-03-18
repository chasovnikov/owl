'use client'

import { useState } from 'react'
import { createPostIdeaAction } from '@/lib/actions'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'

export default function AddPostForm({ hypothesisId }: { hypothesisId: string }) {
  const { lang } = useLang()
  const tr = translations[lang]
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    fd.set('hypothesisId', hypothesisId)
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
    <div className="card animate-fade-up" style={{ padding: 16, gridColumn: '1 / -1' }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>{tr.newPost}</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="text" name="title" placeholder={tr.postTitlePlaceholder} required className="input" />
        <textarea name="script" placeholder={tr.ideaScriptPlaceholder} rows={3} required className="input" style={{ height: 'auto', padding: '8px 12px' }} />
        <textarea name="caption" placeholder={tr.captionOptionalPlaceholder} rows={2} className="input" style={{ height: 'auto', padding: '8px 12px' }} />
        <input type="text" name="hashtags" placeholder={tr.hashtagsOptionalPlaceholder} className="input" />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ height: 32, fontSize: 12 }}>{saving ? tr.saving : tr.addPostBtn}</button>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary" style={{ height: 32, fontSize: 12 }}>{tr.cancel}</button>
        </div>
      </form>
    </div>
  )
}
