"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ForgotPasswordForm } from "@/components/ui/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center px-4">
      <Link
        href="/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Quay lại đăng nhập</span>
      </Link>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">IC</span>
            </div>
            <span className="font-bold text-xl text-foreground dark:text-white">ICS Learning</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">Quên mật khẩu</h1>
          <p className="text-muted-foreground dark:text-slate-400">
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu
          </p>
        </div>

        {/* Form */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8 space-y-6">
          <ForgotPasswordForm />

          <p className="text-center text-sm text-muted-foreground dark:text-slate-400">
            Nhớ mật khẩu?{" "}
            <Link href="/login" className="text-primary dark:text-accent hover:underline font-medium">
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground dark:text-slate-500 mt-6">
          Bằng cách sử dụng dịch vụ, bạn đồng ý với{" "}
          <Link href="/terms" className="hover:underline">
            Điều khoản sử dụng
          </Link>{" "}
          và{" "}
          <Link href="/privacy" className="hover:underline">
            Chính sách bảo mật
          </Link>
        </p>
      </div>
    </div>
  )
}