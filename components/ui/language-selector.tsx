'use client'

import { Globe } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function LanguageSelector() {
  const { language, setLanguage, t, supportedLanguages } = useLanguage()
  const current = supportedLanguages.find((item) => item.code === language) || supportedLanguages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-sm hover:bg-secondary transition-smooth"
          aria-label={t('language_select', 'Chọn ngôn ngữ')}
          title={t('language_select', 'Chọn ngôn ngữ')}
        >
          <Globe size={16} className="text-muted-foreground" />
          <span className="text-base leading-none" aria-hidden="true">{current.flag}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {supportedLanguages.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onClick={() => setLanguage(item.code)}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none" aria-hidden="true">{item.flag}</span>
              <span>{item.label}</span>
            </span>
            {item.code === language && <span className="text-xs text-primary">●</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
