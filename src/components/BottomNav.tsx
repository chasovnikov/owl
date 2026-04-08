'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function openCreate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fumi:create'))
  }
}

export default function BottomNav({
  userInitials,
  userAvatar,
}: {
  userInitials: string
  userAvatar?: string | null
}) {
  const pathname = usePathname()

  const isProjects = pathname === '/dashboard' || pathname.startsWith('/project/')
  const isCalendar = pathname === '/calendar'
  const isSettings = pathname === '/settings'

  return (
    <nav className="bottom-nav">
      {/* Проекты */}
      <Link href="/dashboard" className={`bottom-nav-item${isProjects ? ' active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.7"/>
          <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.7"/>
          <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.7"/>
          <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.7"/>
        </svg>
        <span>Проекты</span>
      </Link>

      {/* Календарь */}
      <Link href="/calendar" className={`bottom-nav-item${isCalendar ? ' active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="17" rx="3.5" stroke="currentColor" strokeWidth="1.7"/>
          <path d="M3 10h18" stroke="currentColor" strokeWidth="1.7"/>
          <path d="M8 2v3M16 2v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          <circle cx="8.5" cy="15" r="1.1" fill="currentColor"/>
          <circle cx="12" cy="15" r="1.1" fill="currentColor"/>
          <circle cx="15.5" cy="15" r="1.1" fill="currentColor"/>
        </svg>
        <span>Календарь</span>
      </Link>

      {/* FAB — центральная кнопка создания */}
      <div className="bottom-nav-fab-slot">
        <button onClick={openCreate} className="bottom-nav-fab" aria-label="Создать">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path d="M13 5v16M5 13h16" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Аналитика */}
      <Link href="/dashboard" className="bottom-nav-item">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="13" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.7"/>
          <rect x="10" y="8" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="1.7"/>
          <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.7"/>
        </svg>
        <span>Аналитика</span>
      </Link>

      {/* Профиль */}
      <Link href="/settings" className={`bottom-nav-item${isSettings ? ' active' : ''}`}>
        {userAvatar ? (
          <img
            src={userAvatar}
            alt=""
            style={{
              width: 26, height: 26, borderRadius: '50%', objectFit: 'cover',
              border: isSettings ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          />
        ) : (
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: isSettings ? 'var(--accent-gradient)' : 'var(--bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
            color: isSettings ? '#fff' : 'var(--text-muted)',
            border: isSettings ? '2px solid var(--accent)' : '2px solid transparent',
          }}>
            {userInitials}
          </div>
        )}
        <span>Профиль</span>
      </Link>
    </nav>
  )
}
