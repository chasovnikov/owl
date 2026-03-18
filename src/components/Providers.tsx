'use client'

import { LangProvider } from '@/lib/lang-context'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <LangProvider>{children}</LangProvider>
}
