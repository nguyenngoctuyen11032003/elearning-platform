"use client"

import { useEffect, useMemo, useState } from "react"
import { Award, Bell, BookOpen, Clock, Globe, Mail, Moon, Palette, Save, Sparkles, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
import { SystemSettings } from "@/app/types/system-settings"
import { LanguageCode, useLanguage } from "@/lib/i18n/language-context"
import { DialogSelect } from "@/components/ui/dialog-select"

export default function StudentSettingsPage() {
  const { user } = useAuth()
  const { t, setLanguage } = useLanguage()
  const { resolvedTheme, setTheme } = useTheme()
  const { config, refresh } = useSystemConfig()

  const [settings, setSettings] = useState<SystemSettings>({})
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedSignature, setLastSavedSignature] = useState("")

  useEffect(() => {
    if (config) {
      setSettings(config)
    }
  }, [config])

  useEffect(() => {
    if (!settings || Object.keys(settings).length === 0 || lastSavedSignature) return
    setLastSavedSignature(JSON.stringify(settings))
  }, [settings, lastSavedSignature])

  const isDarkMode = resolvedTheme === "dark"

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleLanguageChange = (lang: string) => {
    const nextLang = (lang === "en" ? "en" : "vi") as LanguageCode
    handleSettingChange("language", nextLang)
    setLanguage(nextLang)
  }

  const toggleTheme = () => {
    const next = isDarkMode ? "light" : "dark"
    setTheme(next)
  }

  const handleSave = async () => {
    if (!settings || Object.keys(settings).length === 0) {
      toast.error(t("settings_save_error", "Có lỗi xảy ra khi lưu cài đặt"))
      return
    }

    setIsSaving(true)
    try {
      await apiClient.updateManySystemSettings(settings)
      await refresh()
      setLastSavedSignature(JSON.stringify(settings))
      toast.success(t("settings_saved", "Cài đặt đã được lưu thành công!"))
    } catch {
      toast.error(t("settings_save_error", "Có lỗi xảy ra khi lưu cài đặt"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetChanges = () => {
    if (!config) return
    setSettings(config)
    toast.success(t("settings_reset_ok", "Đã hoàn tác các thay đổi chưa lưu"))
  }

  const notificationItems = useMemo(
    () => [
      {
        key: "emailNotifications",
        icon: Mail,
        title: t("settings_email_notif", "Thông báo Email"),
        description: t("settings_email_desc", "Nhận thông báo qua email"),
      },
      {
        key: "pushNotifications",
        icon: Bell,
        title: t("settings_push_notif", "Thông báo đẩy"),
        description: t("settings_push_desc", "Nhận thông báo đẩy trên trình duyệt"),
      },
      {
        key: "courseUpdates",
        icon: BookOpen,
        title: t("settings_course_updates", "Cập nhật khóa học"),
        description: t("settings_course_desc", "Thông báo về bài học mới và cập nhật"),
      },
      {
        key: "assignmentReminders",
        icon: Award,
        title: t("settings_assignment_reminders", "Nhắc nhở bài tập"),
        description: t("settings_assignment_desc", "Nhắc nhở deadline bài tập"),
      },
    ],
    [t]
  )

  if (!config) {
    return null
  }

  const hasUnsavedChanges = JSON.stringify(settings) !== lastSavedSignature

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8 pb-28">
        <section
          className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/80"
          style={{ backgroundImage: "url('/image/bg_dashboard.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/45 via-primary/25 to-accent/40 dark:from-slate-950/85 dark:via-slate-950/70 dark:to-slate-900/85" />
          <div className="relative z-10 space-y-4 p-6 md:p-8 lg:p-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles size={14} />
                  {t("settings_title", "Cài đặt")}
                </p>
                <div>
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg lg:text-4xl">{user?.name || t("userdb_student", "Học viên")}</h1>
                  <p className="mt-2 text-white/85 leading-6">{t("settings_desc", "Quản lý cài đặt tài khoản của bạn")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("settings_tab_notifications", "Thông báo")}</p>
                  <p className="mt-1 text-xl font-black leading-none text-slate-900 dark:text-white">
                    {notificationItems.filter((item) => Boolean(settings[item.key as keyof SystemSettings])).length}
                  </p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("settings_tab_appearance", "Giao diện")}</p>
                  <p className="mt-1 text-xl font-black leading-none text-slate-900 dark:text-white">{isDarkMode ? t("settings_dark_mode", "Chế độ tối") : t("settings_light_mode", "Chế độ sáng")}</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("settings_language", "Ngôn ngữ")}</p>
                  <p className="mt-1 text-xl font-black leading-none text-slate-900 dark:text-white">{settings.language === "en" ? "EN" : "VI"}</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("settings_save", "Lưu")}</p>
                  <p className="mt-1 text-xl font-black leading-none text-slate-900 dark:text-white">{isSaving ? t("settings_saving", "Đang lưu...") : "Ready"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Tabs defaultValue="notifications" className="w-full">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
            <div className="border-b border-slate-200 p-3 md:p-4 dark:border-slate-800">
              <TabsList className="grid w-full grid-cols-2 gap-1 rounded-xl bg-slate-50 p-1 dark:bg-slate-800/60">
                <TabsTrigger
                  value="notifications"
                  className="h-10 rounded-lg text-xs font-semibold text-slate-600 transition-all hover:text-primary data-[state=active]:bg-primary/90 data-[state=active]:text-white md:text-sm dark:text-slate-300 dark:hover:text-accent dark:data-[state=active]:bg-accent"
                >
                  {t("settings_tab_notifications", "Thông báo")}
                </TabsTrigger>
                <TabsTrigger
                  value="appearance"
                  className="h-10 rounded-lg text-xs font-semibold text-slate-600 transition-all hover:text-primary data-[state=active]:bg-primary/90 data-[state=active]:text-white md:text-sm dark:text-slate-300 dark:hover:text-accent dark:data-[state=active]:bg-accent"
                >
                  {t("settings_tab_appearance", "Giao diện")}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="notifications" className="m-0 space-y-6 p-5 md:p-6">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground dark:text-white">
                  <Bell size={22} className="text-primary dark:text-accent" />
                  {t("settings_tab_notifications", "Thông báo")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                  {t("settings_notifications_desc", "Quản lý các loại thông báo bạn muốn nhận trong quá trình học tập")}
                </p>
              </div>

              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("settings_notifications_channels", "Kênh thông báo")}
                </h3>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {notificationItems.map((item) => {
                    const isEnabled = Boolean(settings[item.key as keyof SystemSettings])
                    return (
                      <article
                        key={item.key}
                        className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-300">
                            <item.icon className="h-5 w-5" />
                          </div>

                          <button
                            onClick={() => handleSettingChange(item.key, !isEnabled)}
                            className={`h-6 w-12 rounded-full transition ${isEnabled ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-700"}`}
                          >
                            <span className={`block h-5 w-5 rounded-full bg-white transition ${isEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
                          </button>
                        </div>

                        <h3 className="text-sm font-semibold leading-5 text-slate-900 dark:text-white">{item.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
                      </article>
                    )
                  })}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="appearance" className="m-0 space-y-6 p-5 md:p-6">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground dark:text-white">
                  <Palette size={22} className="text-primary dark:text-accent" />
                  {t("settings_appearance_title", "Giao diện")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                  {t("settings_appearance_desc", "Điều chỉnh chủ đề và ngôn ngữ hiển thị phù hợp với trải nghiệm học tập")}
                </p>
              </div>

              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("settings_appearance_controls", "Tùy chọn hiển thị")}
                </h3>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                      <Palette className="h-5 w-5 text-cyan-600" />
                      {t("settings_appearance_title", "Giao diện")}
                    </h3>

                    <div className="space-y-4">
                      <label className="block text-foreground text-sm font-semibold mb-2 dark:text-white">
                        {t("settings_dark_mode", "Chế độ tối")}
                      </label>
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          {isDarkMode ? <Moon className="h-4 w-4 text-cyan-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
                          <div>
                            <p className="text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100">{t("settings_dark_mode", "Chế độ tối")}</p>
                            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{t("settings_dark_desc", "Bật/tắt chế độ tối cho giao diện")}</p>
                          </div>
                        </div>

                        <button
                          onClick={toggleTheme}
                          className={`h-6 w-12 rounded-full transition-all ${isDarkMode ? "bg-primary dark:bg-accent" : "bg-slate-400"}`}
                        >
                          <div className={`h-5 w-5 rounded-full bg-white transition-transform ${isDarkMode ? "translate-x-6" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                      <Globe className="h-5 w-5 text-cyan-600" />
                      {t("settings_language", "Ngôn ngữ")}
                    </h3>

                    <label className="block text-foreground text-sm font-semibold mb-2 dark:text-white">
                      {t("settings_language", "Ngôn ngữ")}
                    </label>

                    <DialogSelect
                      value={settings.language || "vi"}
                      onChange={(value) => handleLanguageChange(value)}
                      className="h-11 w-full"
                    >
                      <option value="vi">{t("settings_lang_vi", "Tiếng Việt")}</option>
                      <option value="en">{t("settings_lang_en", "Tiếng Anh")}</option>
                    </DialogSelect>

                    <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{t("settings_language_desc", "Chọn ngôn ngữ hiển thị")}</p>
                  </div>
                </div>
              </section>

              <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 text-sm text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-900/20 dark:text-cyan-200">
                {t("settings_info", "Giao diện sẽ được lưu tự động và áp dụng cho tất cả các trang trong hệ thống.")}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="sticky bottom-4 z-30">
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_18px_42px_rgba(15,23,42,0.16)] backdrop-blur-xl md:p-4 dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-medium">
                <Clock size={16} className={hasUnsavedChanges ? "text-amber-500" : "text-emerald-500"} />
                <span className={hasUnsavedChanges ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}>
                  {hasUnsavedChanges ? t("settings_unsaved", "Có thay đổi chưa lưu") : t("settings_synced", "Đã đồng bộ với cấu hình mới nhất")}
                </span>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={handleResetChanges}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t("settings_reset", "Hoàn tác")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all hover:shadow-[0_14px_34px_rgba(15,23,42,0.18)] disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSaving ? t("settings_saving", "Đang lưu...") : t("settings_save", "Lưu cài đặt")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
