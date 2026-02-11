import { redirect } from "next/navigation"

interface ResetPasswordTokenPageProps {
  params: Promise<{ token: string }>
}

export default async function ResetPasswordTokenPage({ params }: ResetPasswordTokenPageProps) {
  const { token } = await params
  
  // Redirect to the main reset password page with token as query parameter
  redirect(`/reset-password?token=${token}`)
}