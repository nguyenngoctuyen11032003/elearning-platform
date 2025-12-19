"use client"

import { useState, useEffect } from "react"
import { Save, Lock, User, Mail, Phone, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { getRoleAvatar, getRoleDisplayName, getInitials } from "@/lib/utils/avatar"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminProfilePage() {
  const { user, loading } = useAuth()
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)

      await apiClient.updateProfile({
        name: profileData.name,
        phone: profileData.phone || undefined,
      })

      toast.success("Cập nhật hồ sơ thành công!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Có lỗi xảy ra khi cập nhật hồ sơ")
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu mới không khớp!")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!")
      return
    }

    try {
      setSaving(true)

      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      toast.success("Đổi mật khẩu thành công!")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Có lỗi xảy ra khi đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại.")
    } finally {
      setSaving(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="h-96 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-foreground dark:text-white">
            Không tìm thấy thông tin người dùng
          </h1>
          <p className="text-muted-foreground mt-2">Vui lòng đăng nhập lại</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Hồ sơ cá nhân</h1>
            <p className="text-muted-foreground dark:text-slate-400">Quản lý thông tin và bảo mật tài khoản</p>
          </div>
        </div>

        {/* Avatar Section */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <img
                src={getRoleAvatar(user.role)}
                alt={`${user.name || 'Admin'} Avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  if (target.nextSibling) return
                  const span = document.createElement('span')
                  span.className = 'text-2xl font-bold text-white'
                  span.textContent = getInitials(user.name)
                  target.parentNode?.appendChild(span)
                }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground dark:text-white">{user.name || 'Admin'}</h2>
              <p className="text-muted-foreground dark:text-slate-400">{user.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-accent/20 dark:text-accent">
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Profile and Password */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 p-1">
            <TabsTrigger value="profile" className="text-sm md:text-base">
              <User size={16} className="mr-2" />
              Thông tin cá nhân
            </TabsTrigger>
            <TabsTrigger value="password" className="text-sm md:text-base">
              <Lock size={16} className="mr-2" />
              Đổi mật khẩu
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <User size={16} /> Họ và tên
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth"
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
                    value={profileData.email}
                    readOnly
                    className="w-full bg-muted dark:bg-slate-800 text-muted-foreground cursor-not-allowed rounded-lg px-4 py-3 border border-border dark:border-slate-800"
                  />
                  <p className="text-xs text-muted-foreground dark:text-slate-500 mt-1">
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
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth"
                    placeholder="Nhập số điện thoại (tùy chọn)"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={20} />
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </form>
            </div>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <Lock size={16} /> Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 pr-12 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth"
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-colors"
                    >
                      {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <Lock size={16} /> Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 pr-12 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth"
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-colors"
                    >
                      {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <Lock size={16} /> Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 pr-12 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-colors"
                    >
                      {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Security Note */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Lưu ý bảo mật:</strong> Mật khẩu nên có ít nhất 6 ký tự và kết hợp chữ cái, số và ký tự đặc biệt.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock size={20} />
                  {saving ? "Đang cập nhật..." : "Đổi mật khẩu"}
                </button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

