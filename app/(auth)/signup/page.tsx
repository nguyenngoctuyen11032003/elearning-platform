"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { AuthForm } from "@/components/ui/auth-form"
import { setCurrentUser } from "@/lib/auth"
import { BookOpen, Users } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | null>(
    (searchParams.get("role") as "student" | "teacher") || null,
  )

  const handleSignup = async (data: { email: string; password: string; name?: string }) => {
    if (!selectedRole) {
      setError("Vui lòng chọn vai trò")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (data.email && data.password && data.name) {
        const newUser = {
          id: `${selectedRole}-${Date.now()}`,
          email: data.email,
          name: data.name,
          role: selectedRole,
          avatar: selectedRole === "teacher" ? "/teacher-1.jpg" : "/professional-woman.png",
        }
        setCurrentUser(newUser)

        if (selectedRole === "teacher") {
          router.push("/teacher/dashboard")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err) {
      setError("Đăng ký thất bại. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">IC</span>
            </div>
            <span className="font-bold text-xl text-foreground dark:text-white">ICS Learning</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">Đăng ký</h1>
          <p className="text-muted-foreground dark:text-slate-400">Bắt đầu hành trình học tập của bạn</p>
        </div>

        {/* Form */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8 space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Role Selection */}
          {!selectedRole ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground dark:text-white">Bạn là:</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedRole("student")}
                  className="p-4 border-2 border-border dark:border-slate-800 rounded-lg hover:border-primary dark:hover:border-accent hover:bg-primary/5 dark:hover:bg-accent/5 transition-smooth text-center"
                >
                  <BookOpen className="w-8 h-8 text-primary dark:text-accent mx-auto mb-2" />
                  <p className="font-semibold text-foreground dark:text-white">Học viên</p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Muốn học tập</p>
                </button>
                <button
                  onClick={() => setSelectedRole("teacher")}
                  className="p-4 border-2 border-border dark:border-slate-800 rounded-lg hover:border-primary dark:hover:border-accent hover:bg-primary/5 dark:hover:bg-accent/5 transition-smooth text-center"
                >
                  <Users className="w-8 h-8 text-primary dark:text-accent mx-auto mb-2" />
                  <p className="font-semibold text-foreground dark:text-white">Giảng viên</p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Muốn dạy học</p>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                <span className="text-sm font-medium text-primary dark:text-accent">
                  {selectedRole === "student" ? "Đăng ký học viên" : "Đăng ký giảng viên"}
                </span>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-xs text-primary dark:text-accent hover:underline"
                >
                  Thay đổi
                </button>
              </div>

              <AuthForm type="signup" onSubmit={handleSignup} isLoading={isLoading} />
            </>
          )}

          {selectedRole && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card dark:bg-slate-900/60 text-muted-foreground dark:text-slate-400">
                    Hoặc
                  </span>
                </div>
              </div>

              <button className="w-full py-3 border border-border dark:border-slate-800 rounded-lg font-medium text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth">
                Đăng ký với Google
              </button>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground dark:text-slate-400">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-primary dark:text-accent hover:underline font-medium">
              Đăng nhập
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground dark:text-slate-500 mt-6">
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
