'use client'

import { Globe } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LanguageCode } from '@/lib/i18n/language-context'

export function LanguageSelector() {
  const { language, setLanguage, t, supportedLanguages } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <Globe size={16} className="text-muted-foreground" />
      <Select value={language} onValueChange={(value) => setLanguage(value as LanguageCode)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('language_select')} />
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
