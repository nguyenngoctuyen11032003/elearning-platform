"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Lock, Eye, EyeOff, CheckCircle, Mail, AlertTriangle } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      toast.error(t("reset_invalid_link", "Liên kết không hợp lệ hoặc đã hết hạn"))
      // Don't redirect immediately, let user see the error
      setTimeout(() => {
        router.push("/forgot-password")
      }, 3000)
    }
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      toast.error(t("reset_fill_all", "Vui lòng nhập đầy đủ thông tin"))
      return
    }

    if (password.length < 6) {
      toast.error(t("auth_password_min", "Mật khẩu phải có ít nhất 6 ký tự"))
      return
    }

    if (password !== confirmPassword) {
      toast.error(t("reset_password_mismatch", "Mật khẩu xác nhận không khớp"))
      return
    }

    if (!token) {
      toast.error(t("reset_token_invalid", "Token không hợp lệ"))
      return
    }

    try {
      setLoading(true)
      await apiClient.resetPassword({ token, password })
      setSuccess(true)
      toast.success(t("reset_success", "Đặt lại mật khẩu thành công!"))
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error) {
      const message = error instanceof Error ? error.message : t("reset_failed", "Đặt lại mật khẩu thất bại")
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
            {t("reset_link_invalid_title", "Liên kết không hợp lệ")}
          </h3>
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            {t("reset_link_invalid_desc", "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.")}
          </p>
          <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">
            {t("reset_redirecting_forgot", "Bạn sẽ được chuyển hướng đến trang quên mật khẩu...")}
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
            {t("reset_success_title", "Đặt lại mật khẩu thành công!")}
          </h3>
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            {t("reset_success_desc", "Mật khẩu của bạn đã được cập nhật thành công.")}
          </p>
          <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">
            {t("reset_redirecting_login", "Đang chuyển hướng đến trang đăng nhập...")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
          {t("reset_new_password", "Mật khẩu mới")}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-slate-400" size={20} />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-11 pr-12 py-3 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth text-foreground dark:text-white"
            placeholder={t("reset_new_password_placeholder", "Nhập mật khẩu mới")}
            required
            minLength={6}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
          {t("auth_confirm_password", "Xác nhận mật khẩu")}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-slate-400" size={20} />
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-11 pr-12 py-3 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth text-foreground dark:text-white"
            placeholder={t("reset_confirm_placeholder", "Nhập lại mật khẩu mới")}
            required
            minLength={6}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !password || !confirmPassword}
        className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-smooth font-medium flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {t("auth_processing", "Đang xử lý...")}
          </>
        ) : (
          t("reset_submit", "Đặt lại mật khẩu")
        )}
      </button>

      <div className="text-xs text-muted-foreground dark:text-slate-400 text-center">
        <p>{t("auth_password_min", "Mật khẩu phải có ít nhất 6 ký tự")}</p>
      </div>
    </form>
  )
}

export function ResetPasswordForm() {
  function t(arg0: string, arg1: string): import("react").ReactNode {
    throw new Error("Function not implemented.")
  }

  return (
    <Suspense fallback={
      <div className="text-center">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground dark:text-slate-400">{t("common_loading", "Đang tải...")}</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}