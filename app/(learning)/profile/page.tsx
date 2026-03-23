"use client"

import { useState, useEffect } from "react"
import { Save, Lock, User, Mail, Phone, Eye, EyeOff, Upload, Camera, MapPin, Award, BookOpen, Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { getRoleAvatar, getRoleDisplayName } from "@/lib/utils/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/lib/i18n/language-context"

interface UserStats {
  coursesEnrolled: number
  certificatesEarned: number
  totalHours: number
}

export default function StudentProfilePage() {
  const { user, loading, refreshProfile } = useAuth()
  const { t } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [userStats, setUserStats] = useState<UserStats>({
    coursesEnrolled: 0,
    certificatesEarned: 0,
    totalHours: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

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

  // Fetch user statistics
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) return

      try {
        setStatsLoading(true)

        // Fetch enrollments
        const enrollments = await apiClient.getMyEnrollments()
        const enrollmentsArray = Array.isArray(enrollments) ? enrollments : []

        // Calculate total hours (mock calculation based on progress)
        const totalHours = enrollmentsArray.reduce((total: number, enrollment: any) => {
          return total + Math.floor((enrollment.progress / 100) * 20)
        }, 0)

        setUserStats({
          coursesEnrolled: enrollmentsArray.length || 0,
          certificatesEarned: 0, // Would need certificate API
          totalHours: totalHours || 0
        })
      } catch (error) {
        console.error('Error fetching user stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchUserStats()
  }, [user?.id])

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

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("profile_file_too_large", "Kích thước file không được vượt quá 5MB"))
        return
      }
      
      // Store the actual file for upload
      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        toast.success(t("profile_avatar_selected", "Đã chọn ảnh đại diện mới"))
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
          const response = await apiClient.uploadAvatar(selectedFile)
          console.log('Avatar uploaded successfully:', response)
          // Refresh user data to get new avatar URL
          // You might want to call a refresh function here
        } catch (error) {
          console.error('Avatar upload failed:', error)
          toast.error(t("profile_avatar_error", "Có lỗi xảy ra khi tải lên ảnh đại diện"))
          return; // Stop if avatar upload fails
        }
      }

      await apiClient.updateProfile({
        name: profileData.name,
        phone: profileData.phone || undefined,
        address: profileData.address || undefined,
      })

      // Refresh profile data in auth context
      await refreshProfile()

      toast.success(t("profile_updated", "Cập nhật hồ sơ thành công!"))
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(t("profile_update_error", "Có lỗi xảy ra khi cập nhật hồ sơ"))
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t("profile_pwd_mismatch", "Mật khẩu mới không khớp!"))
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t("profile_pwd_too_short", "Mật khẩu mới phải có ít nhất 6 ký tự!"))
      return
    }

    try {
      setSaving(true)

      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      toast.success(t("profile_pwd_changed", "Đổi mật khẩu thành công!"))
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error(t("profile_pwd_error", "Có lỗi xảy ra khi đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại."))
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
            <div className="h-8 bg-gray-300 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
            <div className="h-96 bg-gray-300 dark:bg-slate-700 rounded"></div>
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
            {t("profile_not_found", "Không tìm thấy thông tin người dùng")}
          </h1>
          <p className="text-muted-foreground">{t("profile_login_again", "Vui lòng đăng nhập lại")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {t("profile_title", "Hồ sơ cá nhân")}
          </h1>
          <p className="text-muted-foreground dark:text-slate-400 mt-1">
            {t("profile_desc", "Quản lý thông tin và cài đặt tài khoản của bạn")}
          </p>
      </div>

      {/* Avatar Section with Upload */}
      <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar with Upload Button */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={`${user.name || t('profile_student', 'Học viên')} Avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    // Show initials fallback
                    const fallback = target.parentElement?.querySelector('.avatar-fallback') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : user.avatar && !user.avatar.includes('ui-avatars.com') ? (
                <img
                  src={user.avatar}
                  alt={`${user.name || t('profile_student', 'Học viên')} Avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    // Show initials fallback
                    const fallback = target.parentElement?.querySelector('.avatar-fallback') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="avatar-fallback w-full h-full flex items-center justify-center text-white text-3xl font-bold"
                style={{
                  display: (avatarPreview || (user.avatar && !user.avatar.includes('ui-avatars.com'))) ? 'none' : 'flex'
                }}
              >
                {user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
              </div>
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
            <label className="absolute bottom-0 right-0 w-9 h-9 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Upload size={16} className="text-white" />
            </label>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-foreground dark:text-white">{user.name || t('profile_student', 'Học viên')}</h2>
            <p className="text-muted-foreground dark:text-slate-400">{user.email}</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-primary/10 to-purple-600/10 text-primary dark:text-accent">
                {getRoleDisplayName(user.role)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground dark:text-slate-500 mt-2">
              {t("profile_avatar_hint", "Nhấn vào ảnh đại diện để thay đổi (PNG, JPG - Tối đa 2MB)")}
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 dark:bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BookOpen size={24} className="text-primary dark:text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-white">
                {statsLoading ? "..." : userStats.coursesEnrolled}
              </p>
              <p className="text-xs text-muted-foreground">{t("profile_stats_courses", "Khóa học")}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 dark:bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Award size={24} className="text-primary dark:text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-white">
                {statsLoading ? "..." : userStats.certificatesEarned}
              </p>
              <p className="text-xs text-muted-foreground">{t("profile_stats_certificates", "Chứng chỉ")}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 dark:bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Calendar size={24} className="text-primary dark:text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-white">
                {statsLoading ? "..." : `${userStats.totalHours}h`}
              </p>
              <p className="text-xs text-muted-foreground">{t("profile_stats_hours", "Giờ học")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Profile, Password and Settings */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 p-1">
          <TabsTrigger value="profile" className="text-xs md:text-sm">
            <User size={16} className="mr-2" />
            {t("profile_tab_info", "Thông tin")}
          </TabsTrigger>
          <TabsTrigger value="password" className="text-xs md:text-sm">
            <Lock size={16} className="mr-2" />
            {t("profile_tab_password", "Mật khẩu")}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                  <User size={16} /> {t("profile_name", "Họ và tên")}
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  required
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors"
                  placeholder={t("profile_name_placeholder", "Nhập họ và tên của bạn")}
                />
              </div>

              {/* Email Field (Read-only) */}
              <div>
                <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                  <Mail size={16} /> {t("profile_email", "Email")}
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  readOnly
                  className="w-full bg-muted dark:bg-slate-800 text-muted-foreground cursor-not-allowed rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800"
                />
                <p className="text-xs text-muted-foreground dark:text-slate-500 mt-1">
                  {t("profile_email_note", "Email không thể thay đổi vì lý do bảo mật")}
                </p>
              </div>

              {/* Phone Field */}
              <div>
                <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                  <Phone size={16} /> {t("profile_phone", "Số điện thoại")}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors"
                  placeholder={t("profile_phone_placeholder", "Nhập số điện thoại (tùy chọn)")}
                />
              </div>

              {/* Address Field */}
              <div>
                <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                  <MapPin size={16} /> {t("profile_address", "Địa chỉ")}
                </label>
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors"
                  placeholder={t("profile_address_placeholder", "Nhập địa chỉ của bạn (tùy chọn)")}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {saving ? t("profile_saving", "Đang lưu...") : t("profile_save", "Lưu thay đổi")}
              </button>
            </form>
          </div>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password" className="mt-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Lock size={20} className="text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    {t("profile_security", "Bảo mật tài khoản")}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    {t("profile_pwd_hint", "Mật khẩu mới phải có ít nhất 6 ký tự và khác mật khẩu cũ")}
                  </p>
                </div>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">
                  {t("profile_current_pwd_label", "Mật khẩu hiện tại")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 pr-12 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors"
                    placeholder={t("profile_current_pwd_placeholder", "Nhập mật khẩu hiện tại")}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword.current ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">
                  {t("profile_new_pwd_label", "Mật khẩu mới")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 pr-12 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors"
                    placeholder={t("profile_new_pwd_placeholder", "Nhập mật khẩu mới")}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">
                  {t("profile_confirm_pwd_label", "Xác nhận mật khẩu mới")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 pr-12 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors"
                    placeholder={t("profile_confirm_pwd_placeholder", "Nhập lại mật khẩu mới")}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock size={18} />
                {saving ? t("profile_changing_pwd", "Đang cập nhật...") : t("profile_change_pwd", "Đổi mật khẩu")}
              </button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  )
}
