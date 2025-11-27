"use client"

import { redirect } from "next/navigation"

interface AuthResetPasswordTokenPageProps {
  params: Promise<{ token: string }>
}

export default async function AuthResetPasswordTokenPage({ params }: AuthResetPasswordTokenPageProps) {
  const { token } = await params
  
  // Redirect to the main reset password page with token as query parameter
  redirect(`/reset-password?token=${token}`)
}