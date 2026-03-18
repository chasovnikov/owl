import { cookies } from 'next/headers'
import { type Lang, translations } from './translations'

export function getLang(): Lang {
  return (cookies().get('lang')?.value as Lang) ?? 'ru'
}

export function getT() {
  const lang = getLang()
  return translations[lang]
}
