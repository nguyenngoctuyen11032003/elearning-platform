"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"

interface AuthFormProps {
  type: "login" | "signup"
  onSubmit: (data: { email: string; password: string; name?: string }) => void
  isLoading?: boolean
}

export function AuthForm({ type, onSubmit, isLoading = false }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.email) newErrors.email = "Email là bắt buộc"
    if (!formData.password) newErrors.password = "Mật khẩu là bắt buộc"

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

    onSubmit({
      email: formData.email,
      password: formData.password,
      name: type === "signup" ? formData.name : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === "signup" && (
        <div>
          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Tên đầy đủ</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nhập tên của bạn"
            className={`w-full px-4 py-3 bg-secondary dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 transition-smooth text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-slate-500 ${
              errors.name
                ? "border-destructive focus:ring-destructive"
                : "border-border dark:border-slate-700 focus:ring-primary dark:focus:ring-accent"
            }`}
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
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
        disabled={isLoading}
        className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-lg font-semibold transition-smooth"
      >
        {isLoading ? "Đang xử lý..." : type === "login" ? "Đăng nhập" : "Đăng ký"}
      </button>
    </form>
  )
}
