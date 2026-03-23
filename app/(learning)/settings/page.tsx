"use client"

import { useState, useEffect } from "react"
import { Save, Bell, Moon, Sun, Palette, Mail, BookOpen, Award, Globe } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
import { SystemSettings } from "@/app/types/system-settings"
import { LanguageCode, useLanguage } from "@/lib/i18n/language-context"

export default function StudentSettingsPage() {
  const { user } = useAuth()
  const { t, setLanguage } = useLanguage()
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const { config } = useSystemConfig()

useEffect(() => {
  if (config) {
    setSettings(config)
  }
}, [config])

  useEffect(() => {
    // Check current theme
    const isDark = document.documentElement.classList.contains("dark")
    setIsDarkMode(isDark)
  }, [])

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const { refresh } = useSystemConfig()

const handleSave = async () => {
  setIsSaving(true)

  try {
    await apiClient.updateManySystemSettings(settings)

    await refresh() // reload config mới từ server

    toast.success(t("settings_saved", "Cài đặt đã được lưu thành công!"))
  } catch (error) {
    toast.error(t("settings_save_error", "Có lỗi xảy ra khi lưu cài đặt"))
  } finally {
    setIsSaving(false)
  }
}

const handleLanguageChange = (lang: string) => {
  const nextLang = (lang === "en" ? "en" : "vi") as LanguageCode
  handleSettingChange("language", nextLang)
  setLanguage(nextLang)
}

const [settings, setSettings] = useState<SystemSettings>(config || {})

if (!config) return null

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">{t("settings_title", "Cài đặt")}</h1>
          <p className="text-muted-foreground dark:text-slate-400">{t("settings_desc", "Quản lý cài đặt tài khoản của bạn")}</p>
        </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 p-1">
          <TabsTrigger value="notifications" className="text-xs md:text-sm">
            {t("settings_tab_notifications", "Thông báo")}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs md:text-sm">
            {t("settings_tab_appearance", "Giao diện")}
          </TabsTrigger>
        </TabsList>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
              <Bell size={24} /> {t("settings_notif_title", "Cài đặt thông báo")}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-primary dark:text-accent" />
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">{t("settings_email_notif", "Thông báo Email")}</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("settings_email_desc", "Nhận thông báo qua email")}</p>
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
              <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen size={20} className="text-primary dark:text-accent" />
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">{t("settings_course_notif", "Thông báo khóa học")}</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("settings_course_desc", "Cập nhật về khóa học đã đăng ký")}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange("courseNotifications", !settings.courseNotifications)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    settings.courseNotifications ? "bg-primary dark:bg-accent" : "bg-slate-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.courseNotifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen size={20} className="text-primary dark:text-accent" />
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">{t("settings_new_course", "Khóa học mới")}</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("settings_new_course_desc", "Thông báo về khóa học mới")}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange("newCourseNotifications", !settings.newCourseNotifications)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    settings.newCourseNotifications ? "bg-primary dark:bg-accent" : "bg-slate-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.newCourseNotifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Award size={20} className="text-primary dark:text-accent" />
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">{t("settings_cert_notif", "Chứng chỉ")}</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("settings_cert_desc", "Thông báo khi nhận chứng chỉ mới")}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange("certificateNotifications", !settings.certificateNotifications)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    settings.certificateNotifications ? "bg-primary dark:bg-accent" : "bg-slate-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.certificateNotifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-primary dark:text-accent" />
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">{t("settings_promo", "Khuyến mãi")}</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("settings_promo_desc", "Nhận thông tin khuyến mãi và ưu đãi")}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange("promotionNotifications", !settings.promotionNotifications)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    settings.promotionNotifications ? "bg-primary dark:bg-accent" : "bg-slate-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.promotionNotifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6 mt-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
              <Palette size={24} /> {t("settings_appearance_title", "Giao diện")}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon size={24} className="text-primary dark:text-accent" />
                  ) : (
                    <Sun size={24} className="text-yellow-400" />
                  )}
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">{t("settings_dark_mode", "Chế độ tối")}</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">
                      {t("settings_dark_desc", "Bật/tắt chế độ tối cho giao diện")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsDarkMode(!isDarkMode)
                    if (!isDarkMode) {
                      document.documentElement.classList.add("dark")
                    } else {
                      document.documentElement.classList.remove("dark")
                    }
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

              <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-primary dark:text-accent" />
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">{t("settings_language", "Ngôn ngữ")}</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("settings_language_desc", "Chọn ngôn ngữ hiển thị")}</p>
                  </div>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                >
                  <option value="vi">{t("settings_lang_vi", "Tiếng Việt")}</option>
                  <option value="en">{t("settings_lang_en", "Tiếng Anh")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              {t("settings_info", "Giao diện sẽ được lưu tự động và áp dụng cho tất cả các trang trong hệ thống.")}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save size={20} />
        {isSaving ? t("settings_saving", "Đang lưu...") : t("settings_save", "Lưu cài đặt")}
      </button>
      </div>
    </div>
  )
}

