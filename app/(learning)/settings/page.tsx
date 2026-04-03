"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Award,
  Bell,
  BookOpen,
  Globe,
  Mail,
  Moon,
  Palette,
  Save,
  Sparkles,
  Sun,
} from "lucide-react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
import { SystemSettings } from "@/app/types/system-settings"
import { LanguageCode, useLanguage } from "@/lib/i18n/language-context"
import { UniversalSelect } from "@/components/ui/universal-select"

export default function StudentSettingsPage() {
  const { user } = useAuth()
  const { t, setLanguage } = useLanguage()
  const { resolvedTheme, setTheme } = useTheme()
  const { config, refresh } = useSystemConfig()

  const [settings, setSettings] = useState<SystemSettings>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (config) {
      setSettings(config)
    }
  }, [config])

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
    setIsSaving(true)
    try {
      await apiClient.updateManySystemSettings(settings)
      await refresh()
      toast.success(t("settings_saved", "Cài đặt đã được lưu thành công!"))
    } catch {
      toast.error(t("settings_save_error", "Có lỗi xảy ra khi lưu cài đặt"))
    } finally {
      setIsSaving(false)
    }
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
        key: "courseNotifications",
        icon: BookOpen,
        title: t("settings_course_notif", "Thông báo khóa học"),
        description: t("settings_course_desc", "Cập nhật về khóa học đã đăng ký"),
      },
      {
        key: "newCourseNotifications",
        icon: BookOpen,
        title: t("settings_new_course", "Khóa học mới"),
        description: t("settings_new_course_desc", "Thông báo về khóa học mới"),
      },
      {
        key: "certificateNotifications",
        icon: Award,
        title: t("settings_cert_notif", "Chứng chỉ"),
        description: t("settings_cert_desc", "Thông báo khi nhận chứng chỉ mới"),
      },
      {
        key: "promotionNotifications",
        icon: Bell,
        title: t("settings_promo", "Khuyến mãi"),
        description: t("settings_promo_desc", "Nhận thông tin khuyến mãi và ưu đãi"),
      },
    ],
    [t],
  )

  if (!config) {
    return null
  }

  return (
    <div className="relative min-h-screen space-y-6">
      <motion.div
        aria-hidden
        animate={{ opacity: [0.2, 0.34, 0.2], y: [0, -14, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-14 top-8 h-72 w-72 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-900/20"
      />
      <motion.div
        aria-hidden
        animate={{ opacity: [0.2, 0.3, 0.2], y: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.45 }}
        className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-900/20"
      />

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-cyan-100/70 bg-white/85 p-6 shadow-[0_24px_60px_rgba(14,116,144,0.14)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 md:p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(34,211,238,0.2),transparent_45%),radial-gradient(100%_110%_at_100%_0%,rgba(16,185,129,0.2),transparent_42%)]" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-900/30 dark:text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              {t("settings_title", "Cài đặt")}
            </p>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white md:text-5xl">{user?.name || t("userdb_student", "Học viên")}</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
              {t("settings_desc", "Quản lý cài đặt tài khoản của bạn")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("settings_tab_notifications", "Thông báo")}</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {notificationItems.filter((item) => Boolean(settings[item.key as keyof SystemSettings])).length}
              </p>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("settings_tab_appearance", "Giao diện")}</p>
              <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{isDarkMode ? t("settings_dark_mode", "Tối") : t("settings_lang_en", "Sáng")}</p>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("settings_language", "Ngôn ngữ")}</p>
              <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{settings.language === "en" ? "EN" : "VI"}</p>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("settings_save", "Lưu")}</p>
              <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{isSaving ? t("settings_saving", "Đang lưu...") : "Ready"}</p>
            </div>
          </div>
        </div>
      </motion.section>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2 border border-slate-200 bg-white/85 p-1 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <TabsTrigger value="notifications" className="text-xs md:text-sm">
            {t("settings_tab_notifications", "Thông báo")}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs md:text-sm">
            {t("settings_tab_appearance", "Giao diện")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {notificationItems.map((item) => {
              const isEnabled = Boolean(settings[item.key as keyof SystemSettings])
              return (
                <motion.article
                  key={item.key}
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-300">
                      <item.icon className="h-5 w-5" />
                    </div>

                    <button
                      onClick={() => handleSettingChange(item.key, !isEnabled)}
                      className={`h-6 w-12 rounded-full transition ${isEnabled ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-700"}`}
                    >
                      <span
                        className={`block h-5 w-5 rounded-full bg-white transition ${isEnabled ? "translate-x-6" : "translate-x-0.5"}`}
                      />
                    </button>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                </motion.article>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70"
            >
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Palette className="h-5 w-5 text-cyan-600" />
                {t("settings_appearance_title", "Giao diện")}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    {isDarkMode ? <Moon className="h-4 w-4 text-cyan-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("settings_dark_mode", "Chế độ tối")}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t("settings_dark_desc", "Bật/tắt chế độ tối cho giao diện")}</p>
                    </div>
                  </div>

                  <button
                    onClick={toggleTheme}
                    className={`h-6 w-12 rounded-full transition ${isDarkMode ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <span className={`block h-5 w-5 rounded-full bg-white transition ${isDarkMode ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70"
            >
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Globe className="h-5 w-5 text-cyan-600" />
                {t("settings_language", "Ngôn ngữ")}
              </h3>

              <UniversalSelect
                value={settings.language || "vi"}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                contentClassName="border-blue-500/30 bg-slate-950/92 text-slate-100 backdrop-blur-2xl shadow-[0_20px_50px_rgba(2,6,23,0.75)]"
                portalled={true}
              >
                <option value="vi">{t("settings_lang_vi", "Tiếng Việt")}</option>
                <option value="en">{t("settings_lang_en", "Tiếng Anh")}</option>
              </UniversalSelect>

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t("settings_language_desc", "Chọn ngôn ngữ hiển thị")}</p>
            </motion.div>
          </div>

          <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 text-sm text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-900/20 dark:text-cyan-200">
            {t("settings_info", "Giao diện sẽ được lưu tự động và áp dụng cho tất cả các trang trong hệ thống.")}
          </div>
        </TabsContent>
      </Tabs>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(14,165,233,0.25)] transition hover:shadow-[0_16px_34px_rgba(14,165,233,0.35)] disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {isSaving ? t("settings_saving", "Đang lưu...") : t("settings_save", "Lưu cài đặt")}
      </button>
    </div>
  )
}
