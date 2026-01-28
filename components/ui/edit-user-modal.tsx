"use client"

import { useState, useEffect } from "react"
import { X, User, Mail, Phone, MapPin, Calendar, Shield, Loader2 } from "lucide-react"
import type { UpdateUserData, UserData } from "@/app/types/user"

interface EditUserModalProps {
  user: UserData | null
  onClose: () => void
  onSubmit: (updatedData: UpdateUserData) => Promise<void>
}

export function EditUserModal({ onClose, user, onSubmit }: EditUserModalProps) {
  const [formData, setFormData] = useState<UpdateUserData>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone || "",
        role: user.role,
        status: user.status,
        bio: user.bio || "",
        address: user.address || "",
        dateOfBirth: user.dateOfBirth || "",
      })
      setErrors({})
    }
  }, [user])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = "Tên không được để trống"
    }

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!validate() || !user) return

  setLoading(true)
  try {
    await onSubmit(formData) // ✅ ĐÚNG
    onClose()
  } catch (error) {
    console.error("Error saving user:", error)
  } finally {
    setLoading(false)
  }
}

  const handleChange = (field: keyof UpdateUserData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

if (!user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              {user.avatar && !user.avatar.includes('ui-avatars.com') ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold"
                style={{
                  display: user.avatar && !user.avatar.includes('ui-avatars.com') ? 'none' : 'flex'
                }}
              >
                {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground dark:text-white">
                Chỉnh sửa người dùng
              </h3>
              <p className="text-sm text-muted-foreground dark:text-slate-400">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">
                Họ và tên *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    errors.name
                      ? "border-red-500 dark:border-red-500"
                      : "border-border dark:border-slate-700"
                  } bg-background dark:bg-slate-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary`}
                  placeholder="Nhập họ và tên"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    errors.phone
                      ? "border-red-500 dark:border-red-500"
                      : "border-border dark:border-slate-700"
                  } bg-background dark:bg-slate-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary`}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">
                Vai trò
              </label>
              <select
                value={formData.role || "student"}
                onChange={(e) => handleChange("role", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border dark:border-slate-700 bg-background dark:bg-slate-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="student">Học viên</option>
                <option value="teacher">Giảng viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">
                Trạng thái
              </label>
              <select
                value={formData.status || "pending"}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border dark:border-slate-700 bg-background dark:bg-slate-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Vô hiệu hóa</option>
                <option value="pending">Chờ xác thực</option>
              </select>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">
              Ngày sinh
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={formData.dateOfBirth || ""}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border dark:border-slate-700 bg-background dark:bg-slate-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">
              Địa chỉ
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border dark:border-slate-700 bg-background dark:bg-slate-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nhập địa chỉ"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">
              Giới thiệu
            </label>
            <textarea
              value={formData.bio || ""}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-border dark:border-slate-700 bg-background dark:bg-slate-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Mô tả ngắn về người dùng..."
            />
          </div>

          {/* User Info */}
          <div className="p-4 bg-secondary/30 dark:bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                Thông tin hệ thống
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground dark:text-slate-500">ID:</span>{" "}
                <span className="text-foreground dark:text-white font-mono">{String(user.id).slice(0, 8)
}...</span>
              </div>
              <div>
                <span className="text-muted-foreground dark:text-slate-500">Ngày tạo:</span>{" "}
                <span className="text-foreground dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border dark:border-slate-700 hover:bg-secondary dark:hover:bg-slate-800 transition-colors text-foreground dark:text-white font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
