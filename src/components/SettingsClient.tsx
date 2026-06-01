'use client'

import { useState, useRef } from 'react'
import { useLang } from '@/lib/lang-context'
import { translations } from '@/lib/translations'
import { updateProfileAction, uploadAvatarAction, changePasswordAction, deleteAccountAction, logoutAction } from '@/lib/actions'

interface Props {
  user: { id: string; email: string; name: string | null; avatarUrl: string | null; createdAt: string; hasPassword: boolean }
  stats: { projects: number; hypotheses: number; posts: number; results: number }
}

type Section = 'profile' | 'preferences' | 'security' | 'stats' | 'danger' | '__none__'

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

  const SECTION_ICONS: Partial<Record<Section, React.ReactNode>> = {
    profile: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2.5 13.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
    preferences: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>,
    security: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3.5" y="7" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
    stats: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="9" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="6.5" y="5" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="11" y="2" width="3" height="12" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>,
    danger: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  }

  return (
    <div className="settings-container">

      {/* ═══ MOBILE PROFILE PAGE (Airbnb-style) ═══ */}
      <div className="settings-mobile-profile">

        {/* Page title */}
        <h1 className="mob-page-title">Профиль</h1>

        {/* Profile row */}
        <button className="mob-profile-row" onClick={() => setActive(active === 'profile' ? '__none__' as Section : 'profile')}>
          <div className="mob-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{(user.name || user.email)[0].toUpperCase()}</span>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{user.name || user.email}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Редактировать профиль</p>
          </div>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="mob-divider" />

        {/* Profile edit form (inline, expandable) */}
        {active === 'profile' && (
          <div className="mob-expanded-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: avatarUrl ? 'transparent' : 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, position: 'relative', border: '2px solid var(--border-color)' }}
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{(user.name || user.email)[0].toUpperCase()}</span>
                }
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: avatarStatus === 'uploading' ? 1 : 0, transition: 'opacity 0.15s' }}>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ fontSize: 13 }} disabled={avatarStatus === 'uploading'}>
                {avatarStatus === 'uploading' ? tr.settingsUploading : tr.settingsUploadPhoto}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={label}>{tr.settingsName}</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={tr.settingsNamePlaceholder} style={{ marginTop: 6 }} /></div>
              <div><label style={label}>{tr.settingsEmail}</label><input className="input" value={user.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed', marginTop: 6 }} /></div>
              <button onClick={handleSaveProfile} disabled={profileStatus === 'saving'} className="btn-primary" style={{ width: '100%' }}>
                {profileStatus === 'saving' ? tr.settingsSaving : profileStatus === 'saved' ? tr.settingsSaved : tr.settingsSave}
              </button>
            </div>
          </div>
        )}

        {/* Stats strip */}
        <div className="mob-stats-strip">
          {[
            { value: stats.projects, label: tr.settingsStatsProjects },
            { value: stats.hypotheses, label: tr.settingsStatsHypotheses },
            { value: stats.posts, label: tr.settingsStatsPosts },
          ].map(s => (
            <div key={s.label} className="mob-stat-item">
              <span className="mob-stat-value">{s.value}</span>
              <span className="mob-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ MOBILE SETTINGS LIST ═══ */}
      <div className="settings-mobile-sections">

        <h2 className="mob-section-title">Настройки</h2>

        <div className="mob-list">
          {/* Preferences */}
          <button className="mob-list-row" onClick={() => setActive(active === 'preferences' ? '__none__' as Section : 'preferences')}>
            <svg className="mob-list-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>
            <span className="mob-list-label">{tr.settingsPreferences}</span>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="mob-list-chevron"><path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {active === 'preferences' && (
            <div className="mob-expanded-content">
              <label style={label}>{tr.settingsLanguage}</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {(['ru', 'en'] as const).map(l => (
                  <button key={l} onClick={() => setLang(l)} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: lang === l ? '2px solid var(--accent)' : '1px solid var(--border-color)', background: lang === l ? 'var(--accent-light)' : 'var(--surface)', color: lang === l ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {l === 'ru' ? '🇷🇺  Русский' : '🇬🇧  English'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mob-row-divider" />

          {/* Security */}
          <button className="mob-list-row" onClick={() => setActive(active === 'security' ? '__none__' as Section : 'security')}>
            <svg className="mob-list-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 9V7a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span className="mob-list-label">{tr.settingsSecurity}</span>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="mob-list-chevron"><path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {active === 'security' && (
            <div className="mob-expanded-content">
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {user.hasPassword && <div><label style={label}>{tr.settingsCurrentPassword}</label><input type="password" className="input" value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} required style={{ marginTop: 6 }} /></div>}
                <div><label style={label}>{tr.settingsNewPassword}</label><input type="password" className="input" value={pwd.next} minLength={8} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} required style={{ marginTop: 6 }} /></div>
                <div><label style={label}>{tr.settingsConfirmPassword}</label><input type="password" className="input" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} required style={{ marginTop: 6 }} /></div>
                {pwdStatus === 'error' && pwdError && <div style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'var(--red-light)', borderRadius: 6 }}>{pwdError}</div>}
                <button type="submit" disabled={pwdStatus === 'saving'} className="btn-primary" style={{ width: '100%' }}>
                  {pwdStatus === 'saving' ? tr.settingsChangingPassword : pwdStatus === 'saved' ? tr.settingsPasswordChanged : tr.settingsChangePassword}
                </button>
              </form>
            </div>
          )}
          <div className="mob-row-divider" />

          {/* Stats */}
          <button className="mob-list-row" onClick={() => setActive(active === 'stats' ? '__none__' as Section : 'stats')}>
            <svg className="mob-list-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="12" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="8" y="7" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="13" y="3" width="4" height="15" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
            <span className="mob-list-label">{tr.settingsStats}</span>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="mob-list-chevron"><path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {active === 'stats' && (
            <div className="mob-expanded-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[{ label: tr.settingsStatsProjects, value: stats.projects }, { label: tr.settingsStatsHypotheses, value: stats.hypotheses }, { label: tr.settingsStatsPosts, value: stats.posts }, { label: tr.settingsStatsResults, value: stats.results }].map(s => (
                  <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
                    <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 2 }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <h2 className="mob-section-title" style={{ marginTop: 32 }}>Аккаунт</h2>

        <div className="mob-list">
          {/* Logout */}
          <form action={logoutAction} style={{ display: 'contents' }}>
            <button type="submit" className="mob-list-row mob-list-row-danger">
              <svg className="mob-list-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3M13 14l4-4-4-4M17 10H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="mob-list-label">{tr.settingsLogout}</span>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="mob-list-chevron"><path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </form>
          <div className="mob-row-divider" />

          {/* Delete account */}
          <button className="mob-list-row mob-list-row-danger" onClick={() => setActive(active === 'danger' ? '__none__' as Section : 'danger')}>
            <svg className="mob-list-icon" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L17 15H3L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 8v3M10 13.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span className="mob-list-label">{tr.settingsDeleteAccount}</span>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="mob-list-chevron"><path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {active === 'danger' && (
            <div className="mob-expanded-content">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>{tr.settingsDeleteWarning}</p>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} className="btn-secondary" style={{ width: '100%', color: 'var(--red)', borderColor: 'var(--red)' }}>{tr.settingsDeleteAccount}</button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleDelete} disabled={deleting} className="btn-primary" style={{ flex: 1, background: 'var(--red)' }}>{deleting ? '...' : tr.settingsDeleteConfirm}</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary" style={{ flex: 1 }}>{tr.settingsDeleteCancel}</button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mob-footer-text">
          {tr.settingsMemberSince} {new Date(user.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Desktop: sidebar nav */}
      <nav className="settings-desktop-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

      {/* Desktop: Content */}
      <div className="settings-desktop-content">

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
                { label: tr.settingsStatsProjects, value: stats.projects, color: '#5B6AF0', bg: 'rgba(91,106,240,0.10)', icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.85"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.3"/></svg> },
                { label: tr.settingsStatsHypotheses, value: stats.hypotheses, color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.6 3.9L13.8 5l-2.9 2.8.7 4L8 9.9 4.4 11.8l.7-4L2.2 5l4.2-.1L8 1z"/></svg> },
                { label: tr.settingsStatsPosts, value: stats.posts, color: '#0EA5E9', bg: 'rgba(14,165,233,0.10)', icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="2" rx="1" fill="currentColor" opacity="0.85"/><rect x="1" y="7" width="10" height="2" rx="1" fill="currentColor" opacity="0.5"/><rect x="1" y="11" width="12" height="2" rx="1" fill="currentColor" opacity="0.3"/></svg> },
                { label: tr.settingsStatsResults, value: stats.results, color: '#059669', bg: 'rgba(5,150,105,0.10)', icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 11l3.5-3.5 3 3L14 4"/></svg> },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, marginBottom: 12, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.icon}
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 4 }}>
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

