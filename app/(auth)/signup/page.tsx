"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { AuthForm } from "@/components/ui/auth-form"
import { BookOpen, Users, ArrowLeft } from "lucide-react"

export default function SignupPage() {
  const searchParams = useSearchParams()
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "TEACHER">(
    (searchParams.get("role")?.toUpperCase() as "STUDENT" | "TEACHER") || "STUDENT"
  )

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center px-4">
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Quay lại</span>
      </Link>

      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">
            Tạo tài khoản
          </h1>
          <p className="text-muted-foreground dark:text-slate-400">
            Tham gia cộng đồng học tập ICS Learning
          </p>
        </div>

        {/* Role Selection */}
        {!searchParams.get("role") && (
          <div className="bg-card dark:bg-slate-900/60 p-6 rounded-xl border border-border dark:border-slate-800">
            <h3 className="text-lg font-semibold mb-4 text-center">Chọn vai trò của bạn</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedRole("STUDENT")}
                className={`p-4 rounded-lg border transition-all ${
                  selectedRole === "STUDENT"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border dark:border-slate-800 hover:border-primary/50"
                }`}
              >
                <BookOpen className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-medium">Học viên</div>
                <div className="text-xs text-muted-foreground">Tham gia các khóa học</div>
              </button>

              <button
                onClick={() => setSelectedRole("TEACHER")}
                className={`p-4 rounded-lg border transition-all ${
                  selectedRole === "TEACHER"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border dark:border-slate-800 hover:border-primary/50"
                }`}
              >
                <Users className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-medium">Giảng viên</div>
                <div className="text-xs text-muted-foreground">Tạo và quản lý khóa học</div>
              </button>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-card dark:bg-slate-900/60 p-8 rounded-xl border border-border dark:border-slate-800 backdrop-blur-sm">
          <AuthForm type="signup" />

          <p className="text-center text-sm text-muted-foreground dark:text-slate-400 mt-6">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-primary dark:text-accent hover:underline font-medium">
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground dark:text-slate-500">
          Bằng cách đăng ký, bạn đồng ý với{" "}
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
