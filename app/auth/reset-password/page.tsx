"use client"

import { redirect } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function ResetPasswordRedirect() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  if (token) {
    redirect(`/reset-password?token=${token}`)
  } else {
    redirect('/forgot-password')
  }
}

export default function AuthResetPasswordPage() {
  return (
    <Suspense fallback={<div>Redirecting...</div>}>
      <ResetPasswordRedirect />
    </Suspense>
  )
}