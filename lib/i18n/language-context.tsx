'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations'

export type LanguageCode = 'vi' | 'en' | 'ja' | 'ko' | 'zh-CN'

export const supportedLanguages: Array<{ code: LanguageCode; label: string }> = [
  { code: 'vi', label: '🇻🇳 Tiếng Việt' },
  { code: 'en', label: '🇺🇸 English' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'ko', label: '🇰🇷 한국어' },
  { code: 'zh-CN', label: '🇨🇳 简体中文' },
]

type LanguageContextValue = {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: (key: string, fallback?: string) => string
  supportedLanguages: typeof supportedLanguages
}

const defaultValue: LanguageContextValue = {
  language: 'vi',
  setLanguage: () => {},
  t: (_key: string, fallback?: string) => fallback || _key,
  supportedLanguages,
}

const LanguageContext = createContext<LanguageContextValue>(defaultValue)

function detectBrowserLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') return 'vi'
  const raw = (navigator.language || '').toLowerCase()
  if (raw.startsWith('en')) return 'en'
  if (raw.startsWith('ja')) return 'ja'
  if (raw.startsWith('ko')) return 'ko'
  if (raw.startsWith('zh')) return 'zh-CN'
  return 'vi'
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('vi')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ics_lang') as LanguageCode | null
      if (stored && supportedLanguages.some((x: typeof supportedLanguages[number]) => x.code === stored)) {
        setLanguageState(stored)
        return
      }
      setLanguageState(detectBrowserLanguage())
    } catch {
      setLanguageState('vi')
    }
  }, [])

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ics_lang', lang)
    }
  }

  const value = useMemo<LanguageContextValue>(() => {
    return {
      language,
      setLanguage,
      t: (key: string, fallback?: string) => {
        const selected = translations[language]?.[key]
        if (selected) return selected
        const viFallback = translations.vi[key]
        if (viFallback) return viFallback
        return fallback || key
      },
      supportedLanguages,
    }
  }, [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
