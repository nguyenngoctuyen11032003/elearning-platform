"use client"

import type React from "react"
import { apiClient } from "@/lib/api/client"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
import { toast } from "sonner"
import type { SystemSettings } from "@/app/types/system-settings"
import { useState, useEffect } from "react"
import {
  Save,
  Moon,
  Sun,
  Mail,
  Phone,
  Palette,
  Database,
  Upload,
  Globe,
  Shield,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  MessageCircle,
  MapPin,
  Clock,
  Target,
  Heart,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/lib/i18n/language-context"
import { DEFAULT_SYSTEM_SETTINGS } from "../../../../lib/system-config/default-system-settings"
import type { LanguageCode } from "@/lib/i18n/language-context"
import { UniversalSelect } from "@/components/ui/universal-select"

export default function AdminSettingsPage() {
  const { t, language, setLanguage, supportedLanguages } = useLanguage()
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load dark mode preference from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      if (saved !== null) {
        return saved === 'true'
      }
      // Default to true if no preference saved
      return true
    }
    return true
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedSignature, setLastSavedSignature] = useState("")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const { refresh } = useSystemConfig()
  const { config } = useSystemConfig()
  const { setConfig } = useSystemConfig()
  const [settings, setSettings] = useState<SystemSettings | null>(null)

  // Load config khi component mount hoặc khi branding tab được mở
  useEffect(() => {
    if (config && !settings) {
      setSettings({
        ...DEFAULT_SYSTEM_SETTINGS,
        ...config,
        language: config.language,
      })
      // Nếu có logo từ server, set preview
      if (config.site_logo) {
        setLogoPreview(config.site_logo)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  // Khi component mount, load config từ server để lấy logo mới nhất
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setSettings((prev) => {
      if (!prev) return prev
      if (prev.language === language) return prev
      return { ...prev, language }
    })
  }, [language])

  useEffect(() => {
    if (!settings || lastSavedSignature) return
    setLastSavedSignature(JSON.stringify(settings))
  }, [settings, lastSavedSignature])

  // Initialize dark mode on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleLanguageSelect = (lang: LanguageCode) => {
    setLanguage(lang)
    setSettings((prev) => (prev ? { ...prev, language: lang } : prev))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleResetChanges = () => {
    if (!config) return
    setSettings({
      ...DEFAULT_SYSTEM_SETTINGS,
      ...config,
      language: config.language,
    })
    setLogoFile(null)
    setLogoPreview(null)
    toast.success(t("adm_set_reset_ok", "Đã hoàn tác các thay đổi chưa lưu"))
  }

const handleSave = async () => {
  try {
    if (!settings) {
      toast.error(t("adm_set_load_failed", "Không thể tải cài đặt"))
      return
    }

    setIsSaving(true)

    let updatedSettings = {
      ...settings,
    }

    // upload logo nếu có
    if (logoFile) {
      const uploadRes = await apiClient.uploadFile(logoFile)
      updatedSettings.site_logo = uploadRes.url
    }

    // Lưu cài đặt vào API
    await apiClient.put('/system-settings', updatedSettings)

    // Cập nhật config cục bộ
    setConfig(updatedSettings)
    setSettings(updatedSettings)
    setLastSavedSignature(JSON.stringify(updatedSettings))
    
    // Clear file state sau khi lưu thành công
    setLogoFile(null)

    toast.success(t("adm_set_save_success", "Lưu cài đặt thành công"))
  } catch (err) {
    console.error(err)
    toast.error(t("adm_set_save_fail", "Lưu thất bại"))
  } finally {
    setIsSaving(false)
  }
}

  if (!settings) return null

  const hasUnsavedChanges =
    JSON.stringify(settings) !== lastSavedSignature || Boolean(logoFile)

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8 pb-28">
        <section
          className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-slate-800/70 shadow-[0_20px_60px_rgba(15,23,42,0.18)] bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl"
          style={{ backgroundImage: "url('/image/bg_dashboard.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/45 via-primary/25 to-accent/40 dark:from-slate-950/85 dark:via-slate-950/70 dark:to-slate-900/85" />
          <div className="relative z-10 p-6 md:p-8 lg:p-10 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary">
              <Shield size={14} />
              {t("adm_set_title", "Cài đặt hệ thống")}
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">{t("adm_set_title", "Cài đặt hệ thống")}</h1>
              <p className="text-white/85 mt-2">{t("adm_set_subtitle", "Quản lý cấu hình toàn bộ nền tảng")}</p>
            </div>
          </div>
        </section>

        <Tabs defaultValue="general" className="w-full">
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <div className="border-b border-slate-200 dark:border-slate-800 p-3 md:p-4">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-1">
                <TabsTrigger value="general" className="h-10 text-xs md:text-sm rounded-lg font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-accent data-[state=active]:bg-primary/90 data-[state=active]:text-white dark:data-[state=active]:bg-accent transition-all">
                  {t("adm_set_tab_general", "Chung")}
                </TabsTrigger>
                <TabsTrigger value="contact" className="h-10 text-xs md:text-sm rounded-lg font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-accent data-[state=active]:bg-primary/90 data-[state=active]:text-white dark:data-[state=active]:bg-accent transition-all">
                  {t("adm_set_tab_contact", "Liên hệ")}
                </TabsTrigger>
                <TabsTrigger value="branding" className="h-10 text-xs md:text-sm rounded-lg font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-accent data-[state=active]:bg-primary/90 data-[state=active]:text-white dark:data-[state=active]:bg-accent transition-all">
                  {t("adm_set_tab_branding", "Giao diện")}
                </TabsTrigger>
                <TabsTrigger value="security" className="h-10 text-xs md:text-sm rounded-lg font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-accent data-[state=active]:bg-primary/90 data-[state=active]:text-white dark:data-[state=active]:bg-accent transition-all">
                  {t("adm_set_tab_security", "Bảo mật")}
                </TabsTrigger>
              </TabsList>
            </div>

          {/* General Settings */}
          <TabsContent value="general" className="m-0 p-5 md:p-6 space-y-6">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-4">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Heart size={22} className="text-primary dark:text-accent" /> {t("adm_set_about", "Về ICS Learning")}
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 text-sm mt-1">Cấu hình nội dung giới thiệu, sứ mệnh và tầm nhìn.</p>
            </div>

            <section className="bg-white/85 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                  {t("adm_set_about_label", "Giới thiệu về ICS Learning")}
                </label>
                <textarea
                  value={settings.about_ics}
                  onChange={(e) => handleSettingChange("about_ics", e.target.value)}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-32 resize-none"
                  placeholder={t("adm_set_about_placeholder", "Mô tả về ICS Learning...")}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    {t("adm_set_mission", "Sứ mệnh")}
                  </label>
                  <textarea
                    value={settings.mission}
                    onChange={(e) => handleSettingChange("mission", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-32 resize-none"
                    placeholder={t("adm_set_mission_placeholder", "Sứ mệnh của ICS Learning...")}
                  />
                </div>
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    {t("adm_set_vision", "Tầm nhìn")}
                  </label>
                  <textarea
                    value={settings.vision}
                    onChange={(e) => handleSettingChange("vision", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-32 resize-none"
                    placeholder={t("adm_set_vision_placeholder", "Tầm nhìn của ICS Learning...")}
                  />
                </div>
              </div>
            </section>
          </TabsContent>

          {/* Contact Settings */}
          <TabsContent value="contact" className="m-0 p-5 md:p-6 space-y-6">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-4">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Mail size={22} className="text-primary dark:text-accent" /> {t("adm_set_contact_info", "Thông tin liên hệ")}
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 text-sm mt-1">Quản lý kênh liên hệ vận hành và hệ thống mạng xã hội.</p>
            </div>

            <section className="bg-white/85 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Liên hệ vận hành</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                    <Mail size={16} /> {t("adm_set_support_email", "Email hỗ trợ")}
                  </label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleSettingChange("supportEmail", e.target.value)}
                    className="w-full h-11 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                    <Phone size={16} /> {t("adm_set_hotline", "Hotline")}
                  </label>
                  <input
                    type="tel"
                    value={settings.hotline}
                    onChange={(e) => handleSettingChange("hotline", e.target.value)}
                    className="w-full h-11 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                  <MapPin size={16} /> {t("adm_set_address", "Địa chỉ")}
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleSettingChange("address", e.target.value)}
                  className="w-full h-11 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                />
              </div>
            </section>

            <section className="bg-white/85 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Mạng xã hội</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                    <Facebook size={16} className="text-blue-600" /> Facebook
                  </label>
                  <input
                    type="url"
                    value={settings.facebook}
                    onChange={(e) => handleSettingChange("facebook", e.target.value)}
                    className="w-full h-11 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                    <Instagram size={16} className="text-pink-600" /> Instagram
                  </label>
                  <input
                    type="url"
                    value={settings.instagram}
                    onChange={(e) => handleSettingChange("instagram", e.target.value)}
                    className="w-full h-11 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    TikTok
                  </label>
                  <input
                    type="url"
                    value={settings.tiktok}
                    onChange={(e) => handleSettingChange("tiktok", e.target.value)}
                    className="w-full h-11 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    placeholder="https://tiktok.com/@..."
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                    <Youtube size={16} className="text-red-600" /> YouTube
                  </label>
                  <input
                    type="url"
                    value={settings.youtube}
                    onChange={(e) => handleSettingChange("youtube", e.target.value)}
                    className="w-full h-11 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                    <Linkedin size={16} className="text-blue-700" /> LinkedIn
                  </label>
                  <input
                    type="url"
                    value={settings.linkedin}
                    onChange={(e) => handleSettingChange("linkedin", e.target.value)}
                    className="w-full h-11 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>
            </section>
          </TabsContent>

          {/* Branding Settings */}
          <TabsContent value="branding" className="m-0 p-5 md:p-6 space-y-6">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-4">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Palette size={22} className="text-primary dark:text-accent" /> {t("adm_set_branding_title", "Giao diện hệ thống")}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-3">{t("adm_set_logo", "Logo")}</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 border-2 border-border dark:border-slate-600 flex items-center justify-center">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center">
                          <Upload size={24} className="text-muted-foreground dark:text-slate-400 mb-1" />
                          <span className="text-xs text-muted-foreground dark:text-slate-400 font-medium">ICS</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block">
                        <span className="sr-only">{t("adm_set_choose_logo", "Chọn logo")}</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        <button
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector(
                              'input[type="file"]',
                            ) as HTMLInputElement
                            input?.click()
                          }}
                          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-smooth font-medium"
                        >
                          {t("adm_set_upload_logo", "Tải lên logo")}
                        </button>
                      </label>
                      <p className="text-xs text-muted-foreground dark:text-slate-400 mt-2">PNG, JPG (Max 2MB)</p>
                    </div>
                  </div>
                </div>

                <div className="relative z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-4">
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <Globe size={16} /> {t("adm_set_language", "Ngôn ngữ")}
                  </label>
                  <UniversalSelect
                    value={settings.language}
                    onChange={(e) => handleLanguageSelect(e.target.value as LanguageCode)}
                    className="w-full md:w-80 h-11 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl px-4 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent shadow-sm"
                    contentClassName="z-[60] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    portalled={true}
                  >
                    {(supportedLanguages || ["en", "vi"]).map((langItem) => {
                      const code = typeof langItem === "string" ? (langItem as LanguageCode) : langItem.code
                      const label = typeof langItem === "string" ? String(langItem).toUpperCase() : langItem.label || code.toUpperCase()
                      return (
                        <option key={code} value={code}>
                          {label}
                        </option>
                      )
                    })}
                  </UniversalSelect>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    Chọn ngôn ngữ hiển thị mặc định cho toàn bộ nền tảng.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? (
                      <Moon size={24} className="text-primary dark:text-accent" />
                    ) : (
                      <Sun size={24} className="text-yellow-400" />
                    )}
                    <div>
                      <p className="text-foreground dark:text-white font-semibold">{t("adm_set_dark_mode", "Chế độ tối")}</p>
                      <p className="text-muted-foreground dark:text-slate-400 text-sm">
                        {t("adm_set_dark_mode_desc", "Bật/tắt chế độ tối cho toàn bộ hệ thống")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newDarkMode = !isDarkMode
                      setIsDarkMode(newDarkMode)
                      // Save preference to localStorage
                      localStorage.setItem('darkMode', String(newDarkMode))
                    }}
                    className={`w-12 h-6 rounded-full transition-all ${
                      isDarkMode ? "bg-primary dark:bg-accent" : "bg-slate-400"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        isDarkMode ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
            </div>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="m-0 p-5 md:p-6 space-y-6">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-4">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Shield size={22} className="text-primary dark:text-accent" /> {t("adm_set_security_title", "Bảo mật hệ thống")}
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 text-sm mt-1">Tách riêng cấu hình rủi ro cao và cấu hình bảo vệ thường xuyên.</p>
            </div>

            <section className="bg-white/85 dark:bg-slate-900/70 border border-red-200/80 dark:border-red-900/50 rounded-2xl p-6 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-300">Danger zone</h3>
              <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-orange-500" />
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">{t("adm_set_maintenance", "Chế độ bảo trì")}</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("adm_set_maintenance_desc", "Tắt trang web để bảo trì")}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange("maintenanceMode", !settings.maintenanceMode)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    settings.maintenanceMode ? "bg-destructive" : "bg-slate-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.maintenanceMode ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </section>

            <section className="bg-white/85 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Protection & automation</h3>
              <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-blue-500" />
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">{t("adm_set_email_notif", "Thông báo Email")}</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("adm_set_email_notif_desc", "Gửi thông báo qua email")}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange("emailNotifications", !settings.emailNotifications)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    settings.emailNotifications ? "bg-primary dark:bg-accent" : "bg-slate-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.emailNotifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Database size={20} className="text-purple-500" />
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">AI Assistant</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("adm_set_ai_desc", "Kích hoạt trợ lý AI")}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange("aiAssistantEnabled", !settings.aiAssistantEnabled)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    settings.aiAssistantEnabled ? "bg-primary dark:bg-accent" : "bg-slate-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.aiAssistantEnabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </section>

            <div className="p-4 bg-blue-50/90 dark:bg-blue-900/20 border border-blue-200/80 dark:border-blue-800 rounded-xl">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                {t("adm_set_security_note", "Các cài đặt bảo mật được mã hóa và lưu trữ an toàn. Chỉ quản trị viên mới có thể truy cập và thay đổi các cài đặt này.")}
              </p>
            </div>
          </TabsContent>
          </div>
        </Tabs>

        <div className="sticky bottom-4 z-30">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl shadow-[0_18px_42px_rgba(15,23,42,0.16)] p-3 md:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-medium">
                <Clock size={16} className={hasUnsavedChanges ? "text-amber-500" : "text-emerald-500"} />
                <span className={hasUnsavedChanges ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}>
                  {hasUnsavedChanges
                    ? t("adm_set_unsaved", "Có thay đổi chưa lưu")
                    : t("adm_set_synced", "Đã đồng bộ với cấu hình mới nhất")}
                </span>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={handleResetChanges}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {t("adm_set_reset", "Hoàn tác")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="h-11 px-6 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm shadow-[0_10px_28px_rgba(15,23,42,0.12)] hover:shadow-[0_14px_34px_rgba(15,23,42,0.18)] transition-all font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSaving ? t("adm_set_saving", "Đang lưu...") : t("adm_set_save", "Lưu cài đặt")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



