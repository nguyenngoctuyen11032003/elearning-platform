"use client"

import { Suspense } from "react"
import { GoogleAuthCallback } from "@/components/ui/google-auth-callback"
import { useLanguage } from "@/lib/i18n/language-context"

function GoogleCallbackFallback() {
  const { t } = useLanguage()
  return <div className="min-h-screen flex items-center justify-center">{t("common_loading", "Loading...")}</div>
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<GoogleCallbackFallback />}>
      <GoogleAuthCallback />
    </Suspense>
  )
}
