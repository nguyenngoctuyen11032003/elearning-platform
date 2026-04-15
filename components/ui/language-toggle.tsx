"use client"

import * as React from "react"
import { useLanguage } from "@/lib/i18n/language-context"
import { Button } from "@/components/ui/button"

export function LanguageToggle() {
  const { language, setLanguage, t, supportedLanguages } = useLanguage()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
        <span className="text-base leading-none" aria-hidden="true">🇻🇳</span>
        <span className="sr-only">Chuyển đổi ngôn ngữ</span>
      </Button>
    )
  }

  const current = supportedLanguages.find((item) => item.code === language) || supportedLanguages[0]

  const toggleLanguage = () => {
    const newLang = language === "en" ? "vi" : "en"
    setLanguage(newLang)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="group relative h-8 w-8 rounded-full border border-border/70 bg-card/60 px-0 transition-all duration-300 hover:border-primary/50 hover:bg-accent/70 hover:shadow-sm"
      title={t("language_toggle", "Chuyển đổi ngôn ngữ")}
      aria-label={t("language_toggle", "Chuyển đổi ngôn ngữ")}
    >
      <span className="text-base leading-none transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
        {current.flag}
      </span>
      <span className="sr-only">Chuyển đổi ngôn ngữ</span>
    </Button>
  )
}
