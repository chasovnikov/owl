'use client'

import { useState, useRef } from 'react'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'
import { updateProfileAction, uploadAvatarAction, changePasswordAction, deleteAccountAction, logoutAction } from '@/lib/actions'

interface Props {
  user: { id: string; email: string; name: string | null; avatarUrl: string | null; createdAt: string; hasPassword: boolean }
  stats: { projects: number; hypotheses: number; posts: number; results: number }
}

type Section = 'profile' | 'preferences' | 'security' | 'stats' | 'danger'

export default function SettingsClient({ user, stats }: Props) {
  const { lang, setLang } = useLang()
  const tr = translations[lang]

  const [active, setActive] = useState<Section>('profile')

  // Profile
  const [name, setName] = useState(user.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
  const [avatarStatus, setAvatarStatus] = useState<'idle' | 'uploading'>('idle')
  const [avatarHovered, setAvatarHovered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Password
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [pwdStatus, setPwdStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [pwdError, setPwdError] = useState('')

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const navItems: { key: Section; label: string }[] = [
    { key: 'profile', label: tr.settingsProfile },
    { key: 'preferences', label: tr.settingsPreferences },
    { key: 'security', label: tr.settingsSecurity },
    { key: 'stats', label: tr.settingsStats },
    { key: 'danger', label: tr.settingsDanger },
  ]

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarStatus('uploading')
    try {
      const fd = new FormData()
      fd.set('avatar', file)
      const url = await uploadAvatarAction(fd)
      setAvatarUrl(url)
    } catch {}
    setAvatarStatus('idle')
    e.target.value = ''
  }

  async function handleSaveProfile() {
    setProfileStatus('saving')
    const fd = new FormData()
    fd.set('name', name)
    await updateProfileAction(fd)
    setProfileStatus('saved')
    setTimeout(() => setProfileStatus('idle'), 2000)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdError('')
    setPwdStatus('saving')
    try {
      const fd = new FormData()
      fd.set('current', pwd.current)
      fd.set('next', pwd.next)
      fd.set('confirm', pwd.confirm)
      await changePasswordAction(fd)
      setPwdStatus('saved')
      setPwd({ current: '', next: '', confirm: '' })
      setTimeout(() => setPwdStatus('idle'), 2500)
    } catch (e: any) {
      setPwdError(e.message)
      setPwdStatus('error')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteAccountAction()
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14,
  }

  const row: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20,
  }

  const label: React.CSSProperties = {
    fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
  }

  const hint: React.CSSProperties = {
    fontSize: 12, color: 'var(--text-muted)', marginTop: 2,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 32 }}>

      {/* Sidebar nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            style={{
              textAlign: 'left', padding: '7px 10px', borderRadius: 6,
              fontSize: 13, fontWeight: active === item.key ? 500 : 400,
              color: active === item.key ? 'var(--text)' : 'var(--text-muted)',
              background: active === item.key ? 'var(--bg-subtle)' : 'transparent',
              border: 'none', cursor: 'pointer', transition: 'all 0.1s',
              ...(item.key === 'danger' ? { color: active === item.key ? 'var(--red)' : 'var(--text-muted)', marginTop: 12 } : {}),
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div>

        {/* ── Profile ── */}
        {active === 'profile' && (
          <div>
            <p style={sectionLabel}>{tr.settingsProfile}</p>

            {/* Avatar */}
            <div style={{ marginBottom: 24 }}>
              <label style={label}>{tr.settingsAvatar}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={() => setAvatarHovered(true)}
                  onMouseLeave={() => setAvatarHovered(false)}
                  style={{
                    width: 64, height: 64, borderRadius: 16, overflow: 'hidden',
                    background: avatarUrl ? 'transparent' : 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0, position: 'relative',
                    border: '2px solid var(--border-color)',
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>
                      {(user.name || user.email)[0].toUpperCase()}
                    </span>
                  )}
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: avatarStatus === 'uploading' || avatarHovered ? 1 : 0, transition: 'opacity 0.15s',
                  }}>
                    {avatarStatus === 'uploading' ? (
                      <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3v8M4 7l4-4 4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary"
                    style={{ height: 32, fontSize: 12, marginBottom: 4 }}
                    disabled={avatarStatus === 'uploading'}
                  >
                    {avatarStatus === 'uploading' ? tr.settingsUploading : tr.settingsUploadPhoto}
                  </button>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tr.settingsAvatarHint}</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>
            </div>

            <div style={row}>
              <label style={label}>{tr.settingsName}</label>
              <input
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={tr.settingsNamePlaceholder}
              />
            </div>

            <div style={row}>
              <label style={label}>{tr.settingsEmail}</label>
              <input className="input" value={user.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <span style={hint}>{tr.settingsEmailHint}</span>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={profileStatus === 'saving'}
              className="btn-primary"
              style={{ height: 34, fontSize: 13, minWidth: 100 }}
            >
              {profileStatus === 'saving' ? tr.settingsSaving
               : profileStatus === 'saved' ? tr.settingsSaved
               : tr.settingsSave}
            </button>
          </div>
        )}

        {/* ── Preferences ── */}
        {active === 'preferences' && (
          <div>
            <p style={sectionLabel}>{tr.settingsPreferences}</p>

            <div style={{ ...row, marginBottom: 0 }}>
              <label style={label}>{tr.settingsLanguage}</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {(['ru', 'en'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    style={{
                      padding: '8px 24px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.15s',
                      border: lang === l ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                      background: lang === l ? 'var(--accent-light, rgba(91,106,240,0.08))' : 'var(--surface)',
                      color: lang === l ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {l === 'ru' ? '🇷🇺  Русский' : '🇬🇧  English'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Security ── */}
        {active === 'security' && (
          <div>
            <p style={sectionLabel}>{tr.settingsSecurity}</p>

            {!user.hasPassword && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: 20, fontSize: 12, color: '#92400E' }}>
                У тебя нет пароля — его можно установить ниже.
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {user.hasPassword && (
                <div style={row}>
                  <label style={label}>{tr.settingsCurrentPassword}</label>
                  <input type="password" className="input" value={pwd.current}
                    onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} required />
                </div>
              )}
              <div style={row}>
                <label style={label}>{tr.settingsNewPassword}</label>
                <input type="password" className="input" value={pwd.next} minLength={8}
                  onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} required />
              </div>
              <div style={row}>
                <label style={label}>{tr.settingsConfirmPassword}</label>
                <input type="password" className="input" value={pwd.confirm}
                  onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} required />
              </div>

              {pwdStatus === 'error' && pwdError && (
                <div style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'var(--red-light)', borderRadius: 6 }}>{pwdError}</div>
              )}

              <button type="submit" disabled={pwdStatus === 'saving'} className="btn-primary" style={{ height: 34, fontSize: 13, width: 'fit-content' }}>
                {pwdStatus === 'saving' ? tr.settingsChangingPassword
                 : pwdStatus === 'saved' ? tr.settingsPasswordChanged
                 : tr.settingsChangePassword}
              </button>
            </form>
          </div>
        )}

        {/* ── Stats ── */}
        {active === 'stats' && (
          <div>
            <p style={sectionLabel}>{tr.settingsStats}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
              {[
                { label: tr.settingsStatsProjects, value: stats.projects },
                { label: tr.settingsStatsHypotheses, value: stats.hypotheses },
                { label: tr.settingsStatsPosts, value: stats.posts },
                { label: tr.settingsStatsResults, value: stats.results },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
                  <p style={{ fontSize: 28, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 4 }}>
                    {s.value}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {tr.settingsMemberSince} {new Date(user.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        )}

        {/* ── Danger zone ── */}
        {active === 'danger' && (
          <div>
            <p style={sectionLabel}>{tr.settingsDanger}</p>

            {/* Logout */}
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{tr.settingsLogout}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</p>
                </div>
                <form action={logoutAction}>
                  <button type="submit" className="btn-secondary" style={{ height: 32, fontSize: 12 }}>
                    {tr.settingsLogout}
                  </button>
                </form>
              </div>
            </div>

            {/* Delete account */}
            <div className="card" style={{ padding: 20, border: '1px solid rgba(239,68,68,0.35)' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--red)', marginBottom: 6 }}>{tr.settingsDeleteAccount}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{tr.settingsDeleteWarning}</p>

              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} className="btn-secondary" style={{ height: 32, fontSize: 12, color: 'var(--red)', borderColor: 'var(--red)' }}>
                  {tr.settingsDeleteAccount}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleDelete} disabled={deleting} className="btn-primary" style={{ height: 32, fontSize: 12, background: 'var(--red)' }}>
                    {deleting ? '...' : tr.settingsDeleteConfirm}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary" style={{ height: 32, fontSize: 12 }}>
                    {tr.settingsDeleteCancel}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
