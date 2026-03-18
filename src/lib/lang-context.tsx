'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { type Lang } from './translations'

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'ru',
  setLang: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru')

  useEffect(() => {
    const stored = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/)?.[1] as Lang | undefined
    if (stored === 'en' || stored === 'ru') setLangState(stored)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    document.cookie = `lang=${l}; path=/; max-age=31536000`
    window.location.reload()
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}
