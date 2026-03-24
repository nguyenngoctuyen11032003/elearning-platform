"use client"

import { useState, useEffect } from "react"
import { Save, Lock, User, Mail, Phone, Eye, EyeOff, ArrowLeft, Upload, Camera } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { getRoleAvatar, getRoleDisplayName, getInitials } from "@/lib/utils/avatar"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useLanguage } from "@/lib/i18n/language-context"

export default function AdminProfilePage() {
  const { t } = useLanguage()
  const { user, loading, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
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
        address: user.address || "",
      })
      
      // Set avatar preview from user data if available
      if (user.avatar) {
        setAvatarPreview(user.avatar)
      }
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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("adm_prof_file_too_large", "Kích thước file không được vượt quá 5MB"))
        return
      }
      
      // Store the actual file for upload
      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        toast.success(t("adm_prof_avatar_selected", "Đã chọn ảnh đại diện mới"))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)

      // Upload avatar if a new one is selected
      if (selectedFile) {
        try {
          await apiClient.uploadAvatar(selectedFile)
          // Refresh user data to get new avatar URL
          // You might want to call a refresh function here
        } catch (error) {
          console.error('Avatar upload failed:', error)
          toast.error(t("adm_prof_avatar_fail", "Có lỗi xảy ra khi tải lên ảnh đại diện"))
          return; // Stop if avatar upload fails
        }
      }

      await apiClient.updateProfile({
        name: profileData.name,
        phone: profileData.phone || undefined,
        address: profileData.address || undefined,
      })

      // Refresh user profile in auth context
      await refreshProfile()

      toast.success(t("adm_prof_update_ok", "Cập nhật hồ sơ thành công!"))
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(t("adm_prof_update_fail", "Có lỗi xảy ra khi cập nhật hồ sơ"))
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t("adm_prof_pw_mismatch", "Mật khẩu mới không khớp!"))
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t("adm_prof_pw_too_short", "Mật khẩu mới phải có ít nhất 6 ký tự!"))
      return
    }

    try {
      setSaving(true)

      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      toast.success(t("adm_prof_pw_ok", "Đổi mật khẩu thành công!"))
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error(t("adm_prof_pw_fail", "Có lỗi xảy ra khi đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại."))
    } finally {
      setSaving(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full">
        <div className="w-full space-y-8">
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
      <div className="min-h-screen w-full">
        <div className="w-full text-center">
          <h1 className="text-3xl font-bold text-foreground dark:text-white">
            {t("adm_prof_user_not_found", "Không tìm thấy thông tin người dùng")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("adm_prof_login_again", "Vui lòng đăng nhập lại")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">{t("adm_prof_title", "Hồ sơ cá nhân")}</h1>
            <p className="text-muted-foreground dark:text-slate-400">{t("adm_prof_subtitle", "Quản lý thông tin và bảo mật tài khoản")}</p>
          </div>
        </div>

        {/* Avatar Section with Upload */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar with Upload Button */}
            <div className="relative group">
              <div className="w-28 h-28 border-4 border-white dark:border-slate-800 shadow-lg rounded-full">
                <UserAvatar 
                  src={avatarPreview || user?.avatar} 
                  name={user?.name || 'Admin'} 
                  size="xl"
                  className="w-full h-full"
                />
              </div>
              {/* Upload Overlay */}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Camera size={24} className="text-white" />
              </label>
              {/* Upload Badge */}
              <label className="absolute bottom-0 right-0 w-9 h-9 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Upload size={16} className="text-white" />
              </label>
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-foreground dark:text-white">{user.name || 'Admin'}</h2>
              <p className="text-muted-foreground dark:text-slate-400">{user.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-accent/20 dark:text-accent">
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground dark:text-slate-500 mt-2">
                {t("adm_prof_avatar_hint", "Nhấn vào ảnh đại diện để thay đổi (PNG, JPG - Tối đa 2MB)")}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs for Profile and Password */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 p-1">
            <TabsTrigger value="profile" className="text-sm md:text-base">
              <User size={16} className="mr-2" />
              {t("adm_prof_tab_info", "Thông tin cá nhân")}
            </TabsTrigger>
            <TabsTrigger value="password" className="text-sm md:text-base">
              <Lock size={16} className="mr-2" />
              {t("adm_prof_tab_password", "Đổi mật khẩu")}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <User size={16} /> {t("adm_prof_name", "Họ và tên")}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth"
                    placeholder={t("adm_prof_name_placeholder", "Nhập họ và tên của bạn")}
                  />
                </div>

                {/* Email Field (Read-only) */}
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <Mail size={16} /> {t("adm_prof_email_label", "Email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    readOnly
                    className="w-full bg-muted dark:bg-slate-800 text-muted-foreground cursor-not-allowed rounded-lg px-4 py-3 border border-border dark:border-slate-800"
                  />
                  <p className="text-xs text-muted-foreground dark:text-slate-500 mt-1">
                    {t("adm_prof_email_readonly", "Email không thể thay đổi vì lý do bảo mật")}
                  </p>
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <Phone size={16} /> {t("adm_prof_phone", "Số điện thoại")}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth"
                    placeholder={t("adm_prof_phone_placeholder", "Nhập số điện thoại (tùy chọn)")}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={20} />
                  {saving ? t("adm_prof_saving", "Đang lưu...") : t("adm_prof_save", "Lưu thay đổi")}
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
                    <Lock size={16} /> {t("adm_prof_current_pw", "Mật khẩu hiện tại")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 pr-12 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth"
                      placeholder={t("adm_prof_current_pw_placeholder", "Nhập mật khẩu hiện tại")}
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
                    <Lock size={16} /> {t("adm_prof_new_pw", "Mật khẩu mới")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 pr-12 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth"
                      placeholder={t("adm_prof_new_pw_placeholder", "Nhập mật khẩu mới (tối thiểu 6 ký tự)")}
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
                    <Lock size={16} /> {t("adm_prof_confirm_pw", "Xác nhận mật khẩu mới")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 pr-12 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth"
                      placeholder={t("adm_prof_confirm_pw_placeholder", "Nhập lại mật khẩu mới")}
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={20} />
                  {saving ? t("adm_prof_saving", "Đang lưu...") : t("adm_prof_change_pw", "Đổi mật khẩu")}
                </button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

