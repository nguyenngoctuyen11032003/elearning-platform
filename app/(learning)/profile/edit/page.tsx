"use client"

import { useState, useEffect } from "react"
import { Save, ArrowLeft, Mail, Phone, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getRoleAvatar, getRoleDisplayName, getInitials } from "@/lib/utils/avatar"

export default function EditProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      
      // Call API to update profile
      await apiClient.updateProfile({
        name: formData.name,
        phone: formData.phone || undefined,
      })

      toast.success("Cập nhật hồ sơ thành công!")
      router.push("/profile")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Có lỗi xảy ra khi cập nhật hồ sơ")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold text-foreground dark:text-white">
          Không tìm thấy thông tin người dùng
        </h1>
        <p className="text-muted-foreground">Vui lòng đăng nhập lại</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/profile"
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">
          Chỉnh sửa hồ sơ
        </h1>
      </div>

      {/* Edit Form */}
      <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Display */}
          <div className="text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <img
                src={getRoleAvatar(user.role)}
                alt={`${user.name || 'User'} Avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if role avatar fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  if (target.nextSibling) return
                  const span = document.createElement('span')
                  span.className = 'text-2xl font-bold text-foreground dark:text-white'
                  span.textContent = getInitials(user.name)
                  target.parentNode?.appendChild(span)
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Avatar mặc định theo vai trò: {getRoleDisplayName(user.role)}
            </p>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
              <User size={16} /> Họ và tên
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              placeholder="Nhập họ và tên của bạn"
            />
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              className="w-full bg-muted dark:bg-slate-800 text-muted-foreground cursor-not-allowed rounded-lg px-4 py-2 border border-border dark:border-slate-800"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email không thể thay đổi vì lý do bảo mật
            </p>
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
              <Phone size={16} /> Số điện thoại
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              placeholder="Nhập số điện thoại (tùy chọn)"
            />
          </div>

          {/* Role Display */}
          <div>
            <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Vai trò</label>
            <div className="px-4 py-2 bg-muted dark:bg-slate-800 rounded-lg">
              <span className="text-foreground dark:text-white font-medium">
                {user.role === 'student' ? 'Học viên' : 
                 user.role === 'teacher' ? 'Giảng viên' : 'Quản trị viên'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Vai trò không thể thay đổi. Liên hệ admin nếu cần hỗ trợ.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Link href="/profile" className="flex-1">
              <button type="button" className="w-full px-6 py-3 border border-border dark:border-slate-800 text-foreground dark:text-white rounded-lg font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-smooth">
                Hủy
              </button>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
