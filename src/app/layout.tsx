import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Fumi — AI content testing',
  description: 'Test content ideas with AI. Beautiful, minimal, and intelligent.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
