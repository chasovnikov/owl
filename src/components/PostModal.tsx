'use client'

import { useState, useEffect, useRef } from 'react'
import { updatePostAction, saveResultAction, uploadPostMediaAction, deletePostMediaAction, fetchPostMetricsAction } from '@/lib/actions'

export interface PostModalData {
  id: string
  title: string
  postText: string | null
  caption: string
  hashtags: string
  status: string
  scheduledPublishDate: string | null
  rubricTitle: string
  channelName: string
  projectName: string
  result: { views: number; likes: number; comments: number; saves: number } | null
  mediaFiles: { id: string; url: string; filename: string; mimeType: string }[]
}

interface PostModalProps {
  post: PostModalData
  onClose: () => void
  onSaved?: () => void
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Черновик', color: '#71717A', bg: '#F4F4F5' },
  SCHEDULED: { label: 'Запланировано', color: '#2563EB', bg: '#EFF6FF' },
  PUBLISHED: { label: 'Опубликовано', color: '#16A34A', bg: '#F0FDF4' },
}

export default function PostModal({ post, onClose, onSaved }: PostModalProps) {
  const [title, setTitle] = useState(post.title)
  const [postText, setPostText] = useState(post.postText ?? post.caption ?? '')
  const [hashtags, setHashtags] = useState(post.hashtags)
  const [status, setStatus] = useState(post.status || 'DRAFT')
  const [scheduledDate, setScheduledDate] = useState(
    post.scheduledPublishDate ? post.scheduledPublishDate.split('T')[0] : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mediaFiles, setMediaFiles] = useState(post.mediaFiles)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  // Metrics
  const [views, setViews] = useState(post.result?.views?.toString() ?? '')
  const [likes, setLikes] = useState(post.result?.likes?.toString() ?? '')
  const [comments, setComments] = useState(post.result?.comments?.toString() ?? '')
  const [saves, setSaves] = useState(post.result?.saves?.toString() ?? '')
  const [savingMetrics, setSavingMetrics] = useState(false)

  // Auto-fetch metrics from a published URL
  const [publishedUrl, setPublishedUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchMsg, setFetchMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function handleFetchMetrics() {
    if (!publishedUrl.trim()) { setFetchMsg({ kind: 'err', text: 'Вставь ссылку на пост' }); return }
    setFetching(true)
    setFetchMsg(null)
    try {
      const res = await fetchPostMetricsAction(post.id, publishedUrl.trim())
      if (!res.ok) { setFetchMsg({ kind: 'err', text: res.error }); return }
      setViews(String(res.metrics.views))
      setLikes(String(res.metrics.likes))
      setComments(String(res.metrics.comments))
      setSaves(String(res.metrics.saves))
      setFetchMsg({ kind: 'ok', text: res.note ?? 'Метрики подтянуты и сохранены' })
      onSaved?.()
    } catch (e: any) {
      setFetchMsg({ kind: 'err', text: e?.message ?? 'Ошибка' })
    } finally {
      setFetching(false)
    }
  }

  const fileRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await updatePostAction(post.id, {
        title,
        postText,
        hashtags,
        status,
        scheduledDate: scheduledDate || null,
      })
      onSaved?.()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveMetrics() {
    setSavingMetrics(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('postId', post.id)
      fd.append('postIdeaId', post.id)
      fd.append('views', views)
      fd.append('likes', likes)
      fd.append('comments', comments)
      fd.append('saves', saves)
      await saveResultAction(fd)
      onSaved?.()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения метрик')
    } finally {
      setSavingMetrics(false)
    }
  }

  async function handleUploadMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingMedia(true)
    try {
      const fd = new FormData()
      fd.append('postId', post.id)
      fd.append('postIdeaId', post.id)
      fd.append('file', file)
      const result = await uploadPostMediaAction(fd)
      setMediaFiles(prev => [...prev, result as typeof mediaFiles[0]])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setUploadingMedia(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDeleteMedia(mediaId: string) {
    try {
      await deletePostMediaAction(mediaId)
      setMediaFiles(prev => prev.filter(m => m.id !== mediaId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.DRAFT

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: 'var(--surface, #fff)',
        borderRadius: 16,
        width: '100%', maxWidth: 560,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Название поста"
              style={{
                fontSize: 17, fontWeight: 600, color: 'var(--text)',
                border: 'none', outline: 'none', background: 'transparent',
                width: '100%', letterSpacing: '-0.02em',
              }}
            />
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: '#F4F4F5', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 8,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tags */}
        <div style={{ padding: '10px 24px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#F4F4F5', color: '#71717A' }}>
            {post.projectName}
          </span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#F4F4F5', color: '#71717A' }}>
            {post.channelName}
          </span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#F4F4F5', color: '#71717A' }}>
            {post.rubricTitle}
          </span>
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Date + Status row */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                Дата публикации
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={e => {
                  setScheduledDate(e.target.value)
                  if (e.target.value && status === 'DRAFT') setStatus('SCHEDULED')
                }}
                className="input"
                style={{ fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                Статус
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="input"
                style={{ fontSize: 13, cursor: 'pointer' }}
              >
                <option value="DRAFT">Черновик</option>
                <option value="SCHEDULED">Запланировано</option>
                <option value="PUBLISHED">Опубликовано</option>
              </select>
            </div>
          </div>

          {/* Post text */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
              Текст поста
            </label>
            <textarea
              value={postText}
              onChange={e => setPostText(e.target.value)}
              placeholder="Основной текст / подпись к посту..."
              rows={5}
              className="input"
              style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.6 }}
            />
          </div>

          {/* Hashtags */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
              Хэштеги
            </label>
            <input
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="#контент #маркетинг"
              className="input"
              style={{ fontSize: 13 }}
            />
          </div>

          {/* Media */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                Материалы
              </label>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingMedia}
                style={{
                  fontSize: 11, color: 'var(--accent, #18181B)', background: 'none',
                  border: 'none', cursor: 'pointer', fontWeight: 500,
                }}
              >
                {uploadingMedia ? 'Загрузка...' : '+ Добавить файл'}
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUploadMedia} style={{ display: 'none' }} />
            </div>
            {mediaFiles.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {mediaFiles.map(m => (
                  <div key={m.id} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    {m.mimeType.startsWith('image/') ? (
                      <img src={m.url} alt={m.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#71717A' }}>
                        Видео
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteMedia(m.id)}
                      style={{
                        position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                        borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 1l6 6M7 1L1 7" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 72, height: 72, borderRadius: 8,
                    border: '1.5px dashed var(--border-color)',
                    background: '#FAFAFA', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', fontSize: 20,
                  }}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%', padding: '14px', borderRadius: 8,
                  border: '1.5px dashed var(--border-color)',
                  background: '#FAFAFA', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontSize: 12, color: 'var(--text-muted)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Фото или видео
              </button>
            )}
          </div>

          {/* Metrics (only when PUBLISHED) */}
          {status === 'PUBLISHED' && (
            <div style={{ padding: 14, background: '#F9FAFB', borderRadius: 10, border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Метрики</p>

              {/* Auto-fetch from published URL (Telegram / YouTube / VK) */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Ссылка на опубликованный пост
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="url"
                    value={publishedUrl}
                    onChange={e => setPublishedUrl(e.target.value)}
                    placeholder="t.me/… · youtube.com/… · vk.com/wall…"
                    className="input"
                    style={{ fontSize: 13, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleFetchMetrics}
                    disabled={fetching}
                    className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                  >
                    {fetching ? 'Тяну…' : 'Подтянуть'}
                  </button>
                </div>
                {fetchMsg && (
                  <p style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4, color: fetchMsg.kind === 'ok' ? 'var(--green)' : 'var(--red)' }}>
                    {fetchMsg.text}
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Просмотры', value: views, set: setViews },
                  { label: 'Лайки', value: likes, set: setLikes },
                  { label: 'Комментарии', value: comments, set: setComments },
                  { label: 'Сохранения', value: saves, set: setSaves },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>{label}</label>
                    <input
                      type="number" min="0" value={value}
                      onChange={e => set(e.target.value)}
                      className="input" style={{ fontSize: 13 }}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleSaveMetrics}
                disabled={savingMetrics}
                className="btn-primary"
                style={{ width: '100%', marginTop: 12, fontSize: 12 }}
              >
                {savingMetrics ? 'Сохранение...' : 'Сохранить метрики'}
              </button>
            </div>
          )}

          {error && <p style={{ fontSize: 12, color: '#DC2626' }}>{error}</p>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Отмена
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 2 }}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
