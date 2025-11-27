"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AuthForm } from "@/components/ui/auth-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center px-4">
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Quay lại</span>
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
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">Đăng nhập</h1>
          <p className="text-muted-foreground dark:text-slate-400">Chào mừng quay lại ICS Learning</p>
        </div>

        {/* Form */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8 space-y-6">
          <AuthForm type="login" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card dark:bg-slate-900/60 text-muted-foreground dark:text-slate-400">Hoặc</span>
            </div>
          </div>

          <button className="w-full py-3 border border-border dark:border-slate-800 rounded-lg font-medium text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth">
            Đăng nhập với Google
          </button>

          <p className="text-center text-sm text-muted-foreground dark:text-slate-400">
            Chưa có tài khoản?{" "}
            <Link href="/signup" className="text-primary dark:text-accent hover:underline font-medium">
              Đăng ký ngay
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground dark:text-slate-400">
            <Link href="/forgot-password" className="text-primary dark:text-accent hover:underline font-medium">
              Quên mật khẩu?
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground dark:text-slate-500 mt-6">
          Bằng cách đăng nhập, bạn đồng ý với{" "}
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
