"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function AuthResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")

    if (token) {
      router.push(`/reset-password?token=${token}`)
    } else {
      router.push('/forgot-password')
    }
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Đang chuyển hướng...</p>
      </div>
    </div>
  )
}