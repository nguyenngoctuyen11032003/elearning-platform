'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations'
import { translationOverrides } from './translation-overrides'

export type LanguageCode = 'vi' | 'en'

export const supportedLanguages: Array<{ code: LanguageCode; label: string; flag: string }> = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
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

const VIETNAMESE_DIACRITICS = /[ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/u
const HANGUL_REGEX = /[\uac00-\ud7af]/u
const HIRAGANA_KATAKANA_REGEX = /[\u3040-\u30ff]/u
const CJK_REGEX = /[\u4e00-\u9fff]/u

function isLikelyCorrupted(text: string): boolean {
  if (!text) return true
  if (text.includes('�')) return true
  if (/[A-Za-z]\?[A-Za-z]/.test(text)) return true
  if (/ng\?n|Ch\?n|N\?u|h\? th\?ng|dang nh\?p/i.test(text)) return true
  return false
}

function isInvalidForLanguage(text: string, lang: LanguageCode): boolean {
  if (!text) return true
  if (isLikelyCorrupted(text)) return true

  const hasVietnamese = VIETNAMESE_DIACRITICS.test(text)
  const hasHangul = HANGUL_REGEX.test(text)
  const hasKana = HIRAGANA_KATAKANA_REGEX.test(text)
  const hasCjk = CJK_REGEX.test(text)

  if (lang === 'en') {
    return hasVietnamese || hasHangul || hasKana || hasCjk
  }

  return false
}

function detectBrowserLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') return 'vi'
  const raw = (navigator.language || '').toLowerCase()
  if (raw.startsWith('en')) return 'en'
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
        const selected = translationOverrides[language]?.[key] || translations[language]?.[key]
        if (selected && !isInvalidForLanguage(selected, language)) return selected

        const enCandidate = translationOverrides.en?.[key] || translations.en?.[key]
        if (language !== 'en' && enCandidate && !isInvalidForLanguage(enCandidate, 'en')) return enCandidate

        const viCandidate = translationOverrides.vi?.[key] || translations.vi?.[key]
        if (viCandidate) return viCandidate

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
