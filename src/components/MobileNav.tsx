'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav({ userInitials, userAvatar }: { userInitials: string; userAvatar?: string | null }) {
  const pathname = usePathname()

  const isCalendar = pathname === '/calendar'
  const isProjects = pathname === '/dashboard' || pathname.startsWith('/project/')
  const isSettings = pathname === '/settings'

  return (
    <nav className="mobile-nav">
      {/* Calendar */}
      <Link href="/calendar" className={`mobile-nav-item${isCalendar ? ' active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="3" width="18" height="17" rx="3.5" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M2 9h18" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M7 1v3M15 1v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <circle cx="7.5" cy="13.5" r="1" fill="currentColor"/>
          <circle cx="11" cy="13.5" r="1" fill="currentColor"/>
          <circle cx="14.5" cy="13.5" r="1" fill="currentColor"/>
        </svg>
        <span>Календарь</span>
      </Link>

      {/* Projects */}
      <Link href="/dashboard" className={`mobile-nav-item${isProjects ? ' active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <rect x="12" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <rect x="2" y="12" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <rect x="12" y="12" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        </svg>
        <span>Проекты</span>
      </Link>

      {/* Profile */}
      <Link href="/settings" className={`mobile-nav-item${isSettings ? ' active' : ''}`}>
        {userAvatar ? (
          <img src={userAvatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: isSettings ? 'var(--accent-gradient)' : 'var(--bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
            color: isSettings ? '#fff' : 'var(--text-secondary)',
          }}>
            {userInitials}
          </div>
        )}
        <span>Профиль</span>
      </Link>
    </nav>
  )
}
