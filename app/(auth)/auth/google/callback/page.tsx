"use client"

import { Suspense } from "react"
import { GoogleAuthCallback } from "@/components/ui/google-auth-callback"

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div>Đang xử lý đăng nhập Google...</div>}>
      <GoogleAuthCallback />
    </Suspense>
  )
}
