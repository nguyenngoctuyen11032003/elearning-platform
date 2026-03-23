"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { GoogleLoginButton } from "./google-login-button"
import { useLanguage } from "@/lib/i18n/language-context"

interface AuthFormProps {
  type: "login" | "signup"
  role?: "student" | "teacher"
}

export function AuthForm({ type, role }: AuthFormProps) {
  const { login, register, loading } = useAuth()
  const { t } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    // Validation
    if (!formData.email) newErrors.email = t("auth_email_required", "Email là bắt buộc")
    if (!formData.password) newErrors.password = t("auth_password_required", "Mật khẩu là bắt buộc")
    if (formData.password && formData.password.length < 6) {
      newErrors.password = t("auth_password_min", "Mật khẩu phải có ít nhất 6 ký tự")
    }

    if (type === "signup") {
      if (!formData.name) newErrors.name = t("auth_name_required", "Tên là bắt buộc")
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t("auth_password_mismatch", "Mật khẩu không khớp")
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      if (type === "login") {
        await login({
          email: formData.email,
          password: formData.password,
        })
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone || undefined,
          role: role || "student",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("auth_error_generic", "Xảy ra lỗi. Vui lòng thử lại.")
      setErrors({ submit: errorMessage })
      console.error('Auth error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive font-medium">{errors.submit}</p>
        </div>
      )}
      {type === "signup" && (
        <div>
          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{t("auth_fullname", "Tên đầy đủ")}</label>
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-muted-foreground dark:text-slate-500" size={20} />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t("auth_name_placeholder", "Nhập tên của bạn")}
              className={`w-full pl-12 pr-4 py-3 bg-secondary dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 transition-smooth text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-slate-500 ${
                errors.name
                  ? "border-destructive focus:ring-destructive"
                  : "border-border dark:border-slate-700 focus:ring-primary dark:focus:ring-accent"
              }`}
            />
          </div>
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>
      )}

      {type === "signup" && (
        <div>
          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{t("auth_phone_optional", "Số điện thoại (tuỳ chọn)")}</label>
          <div className="relative">
            <Phone className="absolute left-4 top-3.5 text-muted-foreground dark:text-slate-500" size={20} />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0123 456 789"
              className="w-full pl-12 pr-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-slate-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t("auth_email_label", "Email")}</label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors z-10" size={20} />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium ${
              errors.email
                ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                : "border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500"
            }`}
          />
          {/* Animated border */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-focus-within:opacity-100 -z-10 blur transition-opacity" />
        </div>
        {errors.email && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t("auth_password", "Mật khẩu")}</label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors z-10" size={20} />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium ${
              errors.password
                ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                : "border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors z-10 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          {/* Animated border */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-focus-within:opacity-100 -z-10 blur transition-opacity" />
        </div>
        {errors.password && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.password}
          </p>
        )}
      </div>

      {type === "signup" && (
        <div>
          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{t("auth_confirm_password", "Xác nhận mật khẩu")}</label>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-muted-foreground dark:text-slate-500" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full pl-12 pr-4 py-3 bg-secondary dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 transition-smooth text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-slate-500 ${
                errors.confirmPassword
                  ? "border-destructive focus:ring-destructive"
                  : "border-border dark:border-slate-700 focus:ring-primary dark:focus:ring-accent"
              }`}
            />
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="group relative w-full py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl disabled:shadow-none transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none overflow-hidden"
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        {/* Button content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{t("auth_processing", "Đang xử lý...")}</span>
            </>
          ) : (
            <>
              <span>{type === "login" ? t("login_title", "Đăng nhập") : t("signup_title", "Đăng ký")}</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </span>
      </button>

      {/* Divider */}
      {type === "login" && (
        <>
          <div className="relative flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t("auth_or", "Hoặc")}</span>
            <div className="flex-1 h-px bg-gradient-to-l from-slate-200 dark:from-slate-700 to-transparent" />
          </div>

          {/* Google Login Button */}
          <GoogleLoginButton />
        </>
      )}
    </form>
  )
}
