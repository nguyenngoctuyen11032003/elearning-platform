"use client"

import { useState, useEffect } from "react"
import { Save, Lock, User, Mail, Phone, Eye, EyeOff, ArrowLeft, Upload, Camera, MapPin, FileText, Calendar, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { getRoleDisplayName } from "@/lib/utils/avatar"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useLanguage } from "@/lib/i18n/language-context"

const TEACHER_PROFILE_MOTION_SCALE_SESSION_KEY = "teacher-profile-motion-scale"
const TEACHER_PROFILE_OLED_PROFILE_KEY = "teacher-profile-oled-profile"

const PROFILE_LAYER_MOTION = {
  hero: { durationMs: 460, baseStaggerMs: 52, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  card: { durationMs: 760, baseStaggerMs: 86, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  tab: { durationMs: 920, baseStaggerMs: 108, easing: "cubic-bezier(0.19, 1, 0.22, 1)" },
} as const

export default function TeacherProfilePage() {
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
    bio: "",
    dateOfBirth: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [submitTarget, setSubmitTarget] = useState<"profile" | "password" | null>(null)
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile")
  const [tabMotionKey, setTabMotionKey] = useState(0)
  const [motionScale, setMotionScale] = useState(1)
  const [oledProfile, setOledProfile] = useState<"neutral" | "high-contrast">("neutral")

  const getLayerMotionStyle = (layer: keyof typeof PROFILE_LAYER_MOTION, index: number) => {
    const preset = PROFILE_LAYER_MOTION[layer]
    return {
      animationDelay: `${Math.max(index, 0) * Math.round(preset.baseStaggerMs * motionScale)}ms`,
      animationDuration: `${Math.round(preset.durationMs * motionScale)}ms`,
      animationTimingFunction: preset.easing,
    }
  }

  const uiTransitionMs = Math.max(140, Math.round(220 * motionScale))
  const getUiTransitionStyle = () => ({
    transitionDuration: `${uiTransitionMs}ms`,
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
        dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "",
      })
      
      // Set avatar preview from user data if available
      if (user.avatar) {
        setAvatarPreview(user.avatar)
      }
    }
  }, [user])

  useEffect(() => {
    setTabMotionKey((prev) => prev + 1)
  }, [activeTab])

  useEffect(() => {
    if (typeof window === "undefined") return

    const storedProfile = window.localStorage.getItem(TEACHER_PROFILE_OLED_PROFILE_KEY)
    if (storedProfile === "neutral" || storedProfile === "high-contrast") {
      setOledProfile(storedProfile)
    } else {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches
      const hasHighDynamicRange = window.matchMedia("(dynamic-range: high)").matches
      const hasWideGamut = window.matchMedia("(color-gamut: p3)").matches
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      const seemsOled = hasHighDynamicRange || (hasWideGamut && prefersDark)
      const nextPreset: "neutral" | "high-contrast" = seemsOled ? "high-contrast" : (isDesktop ? "neutral" : "neutral")
      setOledProfile(nextPreset)
      window.localStorage.setItem(TEACHER_PROFILE_OLED_PROFILE_KEY, nextPreset)
    }

    let cancelled = false
    let rafId = 0

    const cachedScale = window.sessionStorage.getItem(TEACHER_PROFILE_MOTION_SCALE_SESSION_KEY)
    if (cachedScale) {
      const parsed = Number(cachedScale)
      if (Number.isFinite(parsed)) {
        setMotionScale(Math.min(1, Math.max(0.62, parsed)))
        return
      }
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isMobile = window.matchMedia("(max-width: 768px)").matches
    const hw = Number((navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 8)
    const memory = Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8)
    const stamps: number[] = []

    const tick = (ts: number) => {
      if (cancelled) return
      stamps.push(ts)

      if (stamps.length < 12) {
        rafId = window.requestAnimationFrame(tick)
        return
      }

      const deltas = stamps.slice(1).map((value, idx) => value - stamps[idx])
      const avgDelta = deltas.reduce((sum, value) => sum + value, 0) / Math.max(deltas.length, 1)
      const fps = avgDelta > 0 ? 1000 / avgDelta : 60

      let scale = 1
      if (isMobile) scale *= 0.9
      if (hw <= 4) scale *= 0.9
      if (memory <= 4) scale *= 0.9
      if (fps < 45) scale *= 0.8
      else if (fps < 55) scale *= 0.9
      if (reducedMotion) scale *= 0.75

      const next = Math.min(1, Math.max(0.62, Number(scale.toFixed(2))))
      if (!cancelled) {
        setMotionScale(next)
        window.sessionStorage.setItem(TEACHER_PROFILE_MOTION_SCALE_SESSION_KEY, String(next))
      }
    }

    rafId = window.requestAnimationFrame(tick)

    return () => {
      cancelled = true
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(TEACHER_PROFILE_OLED_PROFILE_KEY, oledProfile)
  }, [oledProfile])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        toast.error(t("tch_prof_file_too_big", "Kích thước file không được vượt quá 5MB"))
        return
      }
      
      // Store the actual file for upload
      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        toast.success(t("tch_prof_avatar_selected", "Đã chọn ảnh đại diện mới"))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSubmitTarget("profile")
      setSaving(true)

      // Upload avatar if a new one is selected
      if (selectedFile) {
        try {
          await apiClient.uploadAvatar(selectedFile)
          // Refresh user data to get new avatar URL
          // You might want to call a refresh function here
        } catch (error) {
          console.error('Avatar upload failed:', error)
          toast.error(t("tch_prof_avatar_fail", "Có lỗi xảy ra khi tải lên ảnh đại diện"))
          return; // Stop if avatar upload fails
        }
      }

      await apiClient.updateProfile({
        name: profileData.name,
        phone: profileData.phone || undefined,
        address: profileData.address || undefined,
        bio: profileData.bio || undefined,
        dateOfBirth: profileData.dateOfBirth || undefined,
      })

      // Refresh profile data in auth context
      await refreshProfile()

      toast.success(t("tch_prof_updated", "Cập nhật hồ sơ thành công!"))
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(t("tch_prof_update_fail", "Có lỗi xảy ra khi cập nhật hồ sơ"))
    } finally {
      setSaving(false)
      setSubmitTarget(null)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t("tch_prof_pw_mismatch", "Mật khẩu mới không khớp!"))
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t("tch_prof_pw_short", "Mật khẩu mới phải có ít nhất 6 ký tự!"))
      return
    }

    try {
      setSubmitTarget("password")
      setSaving(true)

      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      toast.success(t("tch_prof_pw_ok", "Đổi mật khẩu thành công!"))
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error(t("tch_prof_pw_fail", "Có lỗi xảy ra khi đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại."))
    } finally {
      setSaving(false)
      setSubmitTarget(null)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const hasMinLength = passwordData.newPassword.length >= 6
  const hasPasswordMatch =
    passwordData.confirmPassword.length > 0 &&
    passwordData.newPassword === passwordData.confirmPassword
  const isProfileSaving = saving && submitTarget === "profile"
  const isPasswordSaving = saving && submitTarget === "password"

  const isHighContrast = oledProfile === "high-contrast"
  const darkBorder = isHighContrast ? "dark:border-slate-600/90" : "dark:border-slate-700/80"
  const darkPanelBg = isHighContrast ? "dark:bg-[#020617]/90" : "dark:bg-[#0b1120]/82"
  const darkAsideBg = isHighContrast ? "dark:bg-[#030712]/92" : "dark:bg-[#0b1120]/80"
  const darkShadow = isHighContrast ? "dark:shadow-[0_22px_60px_rgba(0,0,0,0.76)]" : "dark:shadow-[0_20px_50px_rgba(0,0,0,0.62)]"
  const darkInputBg = isHighContrast ? "dark:bg-[#020617]" : "dark:bg-slate-950"
  const darkInputBorder = isHighContrast ? "dark:border-slate-600/90" : "dark:border-slate-700"
  const darkInputFocus = isHighContrast ? "dark:focus:ring-accent/70" : "dark:focus:ring-accent/60"

  if (loading) {
    return (
      <div className="min-h-screen w-full">
        <div className="w-full space-y-8 animate-pulse">
          <div className="rounded-3xl h-48 bg-slate-200/80 dark:bg-slate-800/70" />
          <div className="grid grid-cols-1 xl:grid-cols-[330px_1fr] gap-6">
            <div className="rounded-2xl h-[440px] bg-slate-200/80 dark:bg-slate-800/70" />
            <div className="rounded-2xl h-[440px] bg-slate-200/80 dark:bg-slate-800/70" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full">
        <div className="w-full text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-10 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
          <h1 className="text-3xl font-bold text-foreground dark:text-white">
            {t("tch_prof_not_found", "Không tìm thấy thông tin người dùng")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("tch_prof_login_again", "Vui lòng đăng nhập lại")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        <section
          className={`animate-fadeIn relative overflow-hidden rounded-3xl border border-white/40 ${darkBorder} shadow-[0_20px_60px_rgba(15,23,42,0.18)] ${darkShadow} bg-white/85 ${darkPanelBg} backdrop-blur-xl`}
          style={{
            ...getLayerMotionStyle("hero", 0),
            backgroundImage: "url('/image/bgr_setting_teacher.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br from-primary/45 via-primary/25 to-accent/40 ${isHighContrast ? "dark:from-black/93 dark:via-slate-950/88 dark:to-slate-900/92" : "dark:from-slate-950/86 dark:via-slate-950/72 dark:to-slate-900/86"}`} />
          <div className="relative z-10 p-6 md:p-8 lg:p-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
              <div className="space-y-3">
                <Link
                  href="/teacher/dashboard"
                  className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-white/90 text-primary text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={getUiTransitionStyle()}
                >
                  <ArrowLeft size={18} />
                  {t("tch_prof_back_dashboard", "Về Dashboard")}
                </Link>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">{t("tch_prof_title", "Hồ sơ cá nhân")}</h1>
                  <p className="text-white/85 mt-2">{t("tch_prof_subtitle", "Quản lý thông tin và bảo mật tài khoản")}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-primary shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
                  style={getUiTransitionStyle()}
                >
                  {getRoleDisplayName(user.role)}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 transition-all hover:-translate-y-px hover:shadow-md"
                  style={getUiTransitionStyle()}
                >
                  {t("tch_prof_status_active", "Tài khoản hoạt động")}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[330px_1fr] gap-6">
          <aside className={`animate-fadeIn rounded-2xl border border-slate-200 ${darkBorder} bg-white/85 ${darkAsideBg} p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)] ${darkShadow} space-y-6`} style={getLayerMotionStyle("card", 1)}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 border-4 border-white dark:border-slate-800 shadow-[0_10px_28px_rgba(15,23,42,0.12)] rounded-full">
                  <UserAvatar
                    src={avatarPreview || user?.avatar}
                    name={user?.name || t("tch_prof_instructor", "Giảng viên")}
                    size="xl"
                    className="w-full h-full"
                  />
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/55 rounded-full opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all cursor-pointer"
                  style={getUiTransitionStyle()}
                >
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Camera size={24} className="text-white" />
                </label>
                <label className="absolute -bottom-1 -right-1 h-10 w-10 bg-primary hover:bg-primary/90 rounded-full inline-flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-105 border-2 border-white dark:border-slate-900"
                  style={getUiTransitionStyle()}
                >
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Upload size={16} className="text-white" />
                </label>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-foreground dark:text-white">{user.name || t("tch_prof_instructor", "Giảng viên")}</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400 break-all">{user.email}</p>
              </div>

              <p className="text-xs text-muted-foreground dark:text-slate-500 max-w-xs">
                {t("tch_prof_avatar_hint", "Nhấn vào ảnh đại diện để thay đổi (PNG, JPG - Tối đa 2MB)")}
              </p>
            </div>

            <div className={`space-y-3 rounded-xl border border-slate-200 ${darkBorder} bg-slate-50/80 ${isHighContrast ? "dark:bg-slate-900/62" : "dark:bg-slate-900/55"} p-4`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("tch_prof_role", "Vai trò")}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("tch_prof_sync", "Đồng bộ")}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  {t("tch_prof_live", "Trực tuyến")}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("tch_prof_security_note", "Nên đổi mật khẩu định kỳ để tăng mức độ an toàn tài khoản.")}
              </p>
            </div>

            <div className={`space-y-3 rounded-xl border border-slate-200 ${darkBorder} bg-slate-50/80 ${isHighContrast ? "dark:bg-slate-900/62" : "dark:bg-slate-900/55"} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("tch_prof_oled_profile", "Chế độ OLED")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOledProfile("neutral")}
                  className={`h-9 rounded-lg text-xs font-semibold border transition-all ${oledProfile === "neutral" ? "bg-primary text-white border-primary shadow" : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  {t("tch_prof_oled_neutral", "Trung tính")}
                </button>
                <button
                  type="button"
                  onClick={() => setOledProfile("high-contrast")}
                  className={`h-9 rounded-lg text-xs font-semibold border transition-all ${oledProfile === "high-contrast" ? "bg-primary text-white border-primary shadow" : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  {t("tch_prof_oled_high", "Tương phản cao")}
                </button>
              </div>
            </div>
          </aside>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "profile" | "password")} className="w-full">
            <div className={`animate-fadeIn rounded-2xl border border-slate-200 ${darkBorder} bg-white/85 ${darkPanelBg} shadow-[0_10px_28px_rgba(15,23,42,0.12)] ${darkShadow}`} style={getLayerMotionStyle("card", 2)}>
              <div className={`p-4 md:p-5 border-b border-slate-200 ${darkBorder}`}>
                <TabsList className={`grid w-full grid-cols-2 bg-slate-50 ${isHighContrast ? "dark:bg-slate-900/78" : "dark:bg-slate-900/65"} rounded-xl p-1`}>
                  <TabsTrigger value="profile" className="h-10 rounded-lg text-xs md:text-sm font-semibold data-[state=active]:bg-primary/90 data-[state=active]:text-white dark:data-[state=active]:bg-accent">
                    <User size={16} className="mr-2" />
                    {t("tch_prof_tab_info", "Thông tin cá nhân")}
                  </TabsTrigger>
                  <TabsTrigger value="password" className="h-10 rounded-lg text-xs md:text-sm font-semibold data-[state=active]:bg-primary/90 data-[state=active]:text-white dark:data-[state=active]:bg-accent">
                    <Lock size={16} className="mr-2" />
                    {t("tch_prof_tab_pw", "Đổi mật khẩu")}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="profile" className="m-0">
                <div key={`profile-tab-${tabMotionKey}`} className="animate-fadeIn p-6 md:p-8 border-t border-slate-200 dark:border-slate-700/80" style={getLayerMotionStyle("tab", 0)}>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                          <User size={16} /> {t("tch_prof_lbl_name", "Họ và tên")}
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                          required
                          className={`w-full h-11 bg-background ${darkInputBg} text-foreground dark:text-slate-50 rounded-xl px-4 border border-border ${darkInputBorder} focus:outline-none focus:ring-2 focus:ring-primary/50 ${darkInputFocus} transition-all`}
                          placeholder={t("tch_prof_ph_name", "Nhập họ và tên của bạn")}
                        />
                      </div>

                      <div>
                        <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                          <Mail size={16} /> Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          readOnly
                          className={`w-full h-11 bg-muted ${isHighContrast ? "dark:bg-slate-900/90" : "dark:bg-slate-900/80"} text-muted-foreground dark:text-slate-300 cursor-not-allowed rounded-xl px-4 border border-border ${darkInputBorder}`}
                        />
                        <p className="text-xs text-muted-foreground dark:text-slate-500 mt-1">
                          {t("tch_prof_email_readonly", "Email không thể thay đổi vì lý do bảo mật")}
                        </p>
                      </div>

                      <div>
                        <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                          <Phone size={16} /> {t("tch_prof_lbl_phone", "Số điện thoại")}
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          className={`w-full h-11 bg-background ${darkInputBg} text-foreground dark:text-slate-50 rounded-xl px-4 border border-border ${darkInputBorder} focus:outline-none focus:ring-2 focus:ring-primary/50 ${darkInputFocus} transition-all`}
                          placeholder={t("tch_prof_ph_phone", "Nhập số điện thoại (tùy chọn)")}
                        />
                      </div>

                      <div>
                        <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                          <Calendar size={16} /> {t("tch_prof_lbl_dob", "Ngày sinh")}
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={profileData.dateOfBirth}
                          onChange={handleProfileChange}
                          className={`w-full h-11 bg-background ${darkInputBg} text-foreground dark:text-slate-50 rounded-xl px-4 border border-border ${darkInputBorder} focus:outline-none focus:ring-2 focus:ring-primary/50 ${darkInputFocus} transition-all`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                        <MapPin size={16} /> {t("tch_prof_lbl_addr", "Địa chỉ")}
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={profileData.address}
                        onChange={handleProfileChange}
                        className={`w-full h-11 bg-background ${darkInputBg} text-foreground dark:text-slate-50 rounded-xl px-4 border border-border ${darkInputBorder} focus:outline-none focus:ring-2 focus:ring-primary/50 ${darkInputFocus} transition-all`}
                        placeholder={t("tch_prof_ph_addr", "Nhập địa chỉ của bạn")}
                      />
                    </div>

                    <div>
                      <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                        <FileText size={16} /> {t("tch_prof_lbl_bio", "Giới thiệu bản thân")}
                      </label>
                      <textarea
                        name="bio"
                        value={profileData.bio}
                        onChange={handleProfileChange}
                        rows={4}
                        className={`w-full bg-background ${darkInputBg} text-foreground dark:text-slate-50 rounded-xl px-4 py-3 border border-border ${darkInputBorder} focus:outline-none focus:ring-2 focus:ring-primary/50 ${darkInputFocus} transition-all resize-none`}
                        placeholder={t("tch_prof_ph_bio", "Giới thiệu về bản thân, kinh nghiệm giảng dạy, chuyên môn...")}
                      />
                      <p className="text-xs text-muted-foreground dark:text-slate-500 mt-1">
                        {t("tch_prof_bio_public_hint", "Giới thiệu này sẽ hiển thị trên trang hồ sơ công khai của bạn")}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="group w-full h-11 px-6 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-200 active:scale-[0.99] active:translate-y-px flex items-center justify-center gap-2 disabled:opacity-50"
                      style={getUiTransitionStyle()}
                    >
                      {isProfileSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="transition-transform group-active:scale-95" />}
                      <span className="transition-opacity duration-200">
                        {isProfileSaving ? t("tch_prof_saving", "Đang lưu...") : t("tch_prof_save_changes", "Lưu thay đổi")}
                      </span>
                    </button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="password" className="m-0">
                <div key={`password-tab-${tabMotionKey}`} className="animate-fadeIn p-6 md:p-8 border-t border-slate-200 dark:border-slate-700/80" style={getLayerMotionStyle("tab", 0)}>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-5">
                      <div>
                        <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                          <Lock size={16} /> {t("tch_prof_lbl_cur_pw", "Mật khẩu hiện tại")}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.current ? "text" : "password"}
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            required
                            className={`w-full h-11 bg-background ${darkInputBg} text-foreground dark:text-slate-50 rounded-xl px-4 pr-12 border border-border ${darkInputBorder} focus:outline-none focus:ring-2 focus:ring-primary/50 ${darkInputFocus} transition-all`}
                            placeholder={t("tch_prof_ph_cur_pw", "Nhập mật khẩu hiện tại")}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg inline-flex items-center justify-center text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                          <Lock size={16} /> {t("tch_prof_lbl_new_pw", "Mật khẩu mới")}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.new ? "text" : "password"}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            required
                            className={`w-full h-11 bg-background ${darkInputBg} text-foreground dark:text-slate-50 rounded-xl px-4 pr-12 border border-border ${darkInputBorder} focus:outline-none focus:ring-2 focus:ring-primary/50 ${darkInputFocus} transition-all`}
                            placeholder={t("tch_prof_ph_new_pw", "Nhập mật khẩu mới (tối thiểu 6 ký tự)")}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg inline-flex items-center justify-center text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                          <Lock size={16} /> {t("tch_prof_lbl_confirm_pw", "Xác nhận mật khẩu mới")}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.confirm ? "text" : "password"}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            required
                            className={`w-full h-11 bg-background ${darkInputBg} text-foreground dark:text-slate-50 rounded-xl px-4 pr-12 border border-border ${darkInputBorder} focus:outline-none focus:ring-2 focus:ring-primary/50 ${darkInputFocus} transition-all`}
                            placeholder={t("tch_prof_ph_confirm_pw", "Nhập lại mật khẩu mới")}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg inline-flex items-center justify-center text-muted-foreground dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700/90 bg-slate-50/80 dark:bg-slate-900/55 p-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t("tch_prof_password_requirements", "Yêu cầu mật khẩu")}
                      </p>
                      <p className={`text-sm ${hasMinLength ? "text-emerald-600 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
                        {hasMinLength ? "• " + t("tch_prof_pw_rule_len_ok", "Đã đạt: tối thiểu 6 ký tự") : "• " + t("tch_prof_pw_rule_len", "Tối thiểu 6 ký tự")}
                      </p>
                      <p className={`text-sm ${hasPasswordMatch ? "text-emerald-600 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
                        {hasPasswordMatch ? "• " + t("tch_prof_pw_rule_match_ok", "Đã đạt: xác nhận mật khẩu khớp") : "• " + t("tch_prof_pw_rule_match", "Xác nhận mật khẩu phải khớp")}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="group w-full h-11 px-6 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-200 active:scale-[0.99] active:translate-y-px flex items-center justify-center gap-2 disabled:opacity-50"
                      style={getUiTransitionStyle()}
                    >
                      {isPasswordSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="transition-transform group-active:scale-95" />}
                      <span className="transition-opacity duration-200">
                        {isPasswordSaving ? t("tch_prof_saving", "Đang lưu...") : t("tch_prof_change_pw", "Đổi mật khẩu")}
                      </span>
                    </button>
                  </form>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

