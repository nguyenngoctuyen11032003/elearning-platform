"use client"

import { Suspense } from "react"
import { GoogleAuthCallback } from "@/components/ui/google-auth-callback"
export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div>...</div>}>
      <GoogleAuthCallback />
    </Suspense>
  )
}
