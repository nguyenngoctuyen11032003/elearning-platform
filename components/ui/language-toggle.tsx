"use client"

import * as React from "react"
import { useLanguage } from "@/lib/i18n/language-context"
import { Button } from "@/components/ui/button"

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
        <span className="text-xs font-bold tracking-tight">EN</span>
        <span className="sr-only">Chuyển đổi ngôn ngữ</span>
      </Button>
    )
  }

  const toggleLanguage = () => {
    const newLang = language === "en" ? "vi" : "en"
    setLanguage(newLang)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="h-8 w-auto px-2.5 transition-all duration-300 hover:bg-accent hover:text-accent-foreground flex items-center justify-center gap-0.5"
      title={t("language_toggle", "Chuyển đổi ngôn ngữ")}
      aria-label={t("language_toggle", "Chuyển đổi ngôn ngữ")}
    >
      <span className={`text-xs font-bold tracking-tight transition-all duration-300 ${language === "en" ? "opacity-100" : "opacity-50"}`}>
        EN
      </span>
      <span className="text-muted-foreground/30">/</span>
      <span className={`text-xs font-bold tracking-tight transition-all duration-300 ${language === "vi" ? "opacity-100" : "opacity-50"}`}>
        VI
      </span>
      <span className="sr-only">Chuyển đổi ngôn ngữ</span>
    </Button>
  )
}
