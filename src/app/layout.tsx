import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OWL — AI content testing',
  description: 'Test Instagram content ideas with AI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ background: 'var(--bg)', minHeight: '100vh' }}>{children}</body>
    </html>
  )
}
