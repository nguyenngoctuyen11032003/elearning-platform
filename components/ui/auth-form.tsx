"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"

interface AuthFormProps {
  type: "login" | "signup"
}

export function AuthForm({ type }: AuthFormProps) {
  const { login, register, loading } = useAuth()
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
    if (!formData.email) newErrors.email = "Email là bắt buộc"
    if (!formData.password) newErrors.password = "Mật khẩu là bắt buộc"
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự"
    }

    if (type === "signup") {
      if (!formData.name) newErrors.name = "Tên là bắt buộc"
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Mật khẩu không khớp"
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
        })
      }
    } catch (error) {
      console.error('Auth error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === "signup" && (
        <div>
          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Tên đầy đủ</label>
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-muted-foreground dark:text-slate-500" size={20} />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên của bạn"
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
          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Số điện thoại (tuỳ chọn)</label>
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
        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Email</label>
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 text-muted-foreground dark:text-slate-500" size={20} />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className={`w-full pl-12 pr-4 py-3 bg-secondary dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 transition-smooth text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-slate-500 ${
              errors.email
                ? "border-destructive focus:ring-destructive"
                : "border-border dark:border-slate-700 focus:ring-primary dark:focus:ring-accent"
            }`}
          />
        </div>
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Mật khẩu</label>
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 text-muted-foreground dark:text-slate-500" size={20} />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full pl-12 pr-12 py-3 bg-secondary dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 transition-smooth text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-slate-500 ${
              errors.password
                ? "border-destructive focus:ring-destructive"
                : "border-border dark:border-slate-700 focus:ring-primary dark:focus:ring-accent"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3.5 text-muted-foreground dark:text-slate-500 hover:text-foreground dark:hover:text-white"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
      </div>

      {type === "signup" && (
        <div>
          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Xác nhận mật khẩu</label>
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
        className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-lg font-semibold transition-smooth"
      >
        {loading ? "Đang xử lý..." : type === "login" ? "Đăng nhập" : "Đăng ký"}
      </button>
    </form>
  )
}
