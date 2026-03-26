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
  CreditCard,
  QrCode,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/lib/i18n/language-context"
import { DEFAULT_SYSTEM_SETTINGS } from "../../../../lib/system-config/default-system-settings"
import type { LanguageCode } from "@/lib/i18n/language-context"

export default function AdminSettingsPage() {
  const { t, language, setLanguage, supportedLanguages } = useLanguage()
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [qrFile, setQrFile] = useState<File | null>(null)
  const { refresh } = useSystemConfig()
  const { config } = useSystemConfig()
  const { setConfig } = useSystemConfig()
const [settings, setSettings] = useState<SystemSettings | null>(null)

useEffect(() => {
  if (config && !settings) {
    setSettings({
      ...DEFAULT_SYSTEM_SETTINGS,
      ...config,
      language: config.language,
    })
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [config])

useEffect(() => {
  setSettings((prev) => {
    if (!prev) return prev
    if (prev.language === language) return prev
    return { ...prev, language }
  })
}, [language])

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

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t("adm_set_file_too_large", "Kích thước file không được vượt quá 2MB"))
        return
      }
      setQrFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setQrPreview(reader.result as string)
        toast.success(t("adm_set_qr_upload_success", "Đã tải lên mã QR thành công"))
      }
      reader.readAsDataURL(file)
    }
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

    // upload QR nếu có
    if (qrFile) {
      const uploadRes = await apiClient.uploadFile(qrFile)
      updatedSettings.paymentQrCode = uploadRes.url
    }

    // Lưu cài đặt vào API
    await apiClient.put('/system-settings', updatedSettings)

    // Cập nhật config cục bộ
    setConfig(updatedSettings)
    
    // Clear file state sau khi lưu thành công
    setLogoFile(null)
    setQrFile(null)

    toast.success(t("adm_set_save_success", "Lưu cài đặt thành công"))
  } catch (err) {
    console.error(err)
    toast.error(t("adm_set_save_fail", "Lưu thất bại"))
  } finally {
    setIsSaving(false)
  }
}
if (!settings) return null
  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">{t("adm_set_title", "Cài đặt hệ thống")}</h1>
          <p className="text-muted-foreground dark:text-slate-400">{t("adm_set_subtitle", "Quản lý cấu hình toàn bộ nền tảng")}</p>
        </div>

        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 p-1">
            <TabsTrigger value="payment" className="text-xs md:text-sm hover:border hover:border-[#0b9bde] hover:text-[#0b9bde] data-[state=active]:bg-[#0b9bde] data-[state=active]:text-white transition-colors">
              {t("adm_set_tab_payment", "Thanh toán")}
            </TabsTrigger>
            <TabsTrigger value="general" className="text-xs md:text-sm hover:border hover:border-[#0b9bde] hover:text-[#0b9bde] data-[state=active]:bg-[#0b9bde] data-[state=active]:text-white transition-colors">
              {t("adm_set_tab_general", "Chung")}
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs md:text-sm hover:border hover:border-[#0b9bde] hover:text-[#0b9bde] data-[state=active]:bg-[#0b9bde] data-[state=active]:text-white transition-colors">
              {t("adm_set_tab_contact", "Liên hệ")}
            </TabsTrigger>
            <TabsTrigger value="branding" className="text-xs md:text-sm hover:border hover:border-[#0b9bde] hover:text-[#0b9bde] data-[state=active]:bg-[#0b9bde] data-[state=active]:text-white transition-colors">
              {t("adm_set_tab_branding", "Giao diện")}
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm hover:border hover:border-[#0b9bde] hover:text-[#0b9bde] data-[state=active]:bg-[#0b9bde] data-[state=active]:text-white transition-colors">
              {t("adm_set_tab_security", "Bảo mật")}
            </TabsTrigger>
          </TabsList>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-6 mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <CreditCard size={24} className="text-primary dark:text-accent" /> {t("adm_set_payment_title", "Thông tin thanh toán")}
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 text-sm">
                {t("adm_set_payment_desc", "Thông tin ngân hàng để nhận thanh toán từ học viên")}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">{t("adm_set_bank_name", "Tên ngân hàng")}</label>
                  <input
                    type="text"
                    value={settings.bankName ?? ""}
                    onChange={(e) => handleSettingChange("bankName", e.target.value)}
                    placeholder="VD: Vietcombank"
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">{t("adm_set_account_number", "Số tài khoản")}</label>
                  <input
                    type="text"
                    value={settings.bankAccount ?? ""}
                    onChange={(e) => handleSettingChange("bankAccount", e.target.value)}
                    placeholder="VD: 1234567890"
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">{t("adm_set_account_holder", "Chủ tài khoản")}</label>
                  <input
                    type="text"
                    value={settings.accountHolder ?? ""}
                    onChange={(e) => handleSettingChange("accountHolder", e.target.value)}
                    placeholder="VD: NGUYEN VAN A"
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <QrCode size={16} /> {t("adm_set_qr_code", "Mã QR thanh toán")}
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-32 bg-secondary dark:bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed border-border dark:border-slate-700 overflow-hidden">
                      {qrPreview || settings.paymentQrCode ? (
                        <img
                          src={qrPreview || settings.paymentQrCode}
                          alt="QR Code"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode size={40} className="text-muted-foreground dark:text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleQrUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement
                            input?.click()
                          }}
                          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-smooth font-medium flex items-center gap-2"
                        >
                          <Upload size={16} /> {t("adm_set_upload_qr", "Tải lên mã QR")}
                        </button>
                      </label>
                      <p className="text-xs text-muted-foreground dark:text-slate-400 mt-2">
                        {t("adm_set_qr_note", "PNG, JPG (Tối đa 2MB). Mã QR sẽ được hiển thị cho học viên khi thanh toán.")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6 mt-6">
            {/* About ICS Learning */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Heart size={24} className="text-primary dark:text-accent" /> {t("adm_set_about", "Về ICS Learning")}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    {t("adm_set_about_label", "Giới thiệu về ICS Learning")}
                  </label>
                  <textarea
                    value={settings.about_ics}
                    onChange={(e) => handleSettingChange("about_ics", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-32 resize-none"
                    placeholder={t("adm_set_about_placeholder", "Mô tả về ICS Learning...")}
                  />
                </div>
              </div>
            </div>

            {/* Mission */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Target size={24} className="text-primary dark:text-accent" /> {t("adm_set_our_mission", "Sứ mệnh của chúng tôi")}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    {t("adm_set_mission", "Sứ mệnh")}
                  </label>
                  <textarea
                    value={settings.mission}
                    onChange={(e) => handleSettingChange("mission", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-32 resize-none"
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
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-24 resize-none"
                    placeholder={t("adm_set_vision_placeholder", "Tầm nhìn của ICS Learning...")}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Contact Settings */}
          <TabsContent value="contact" className="space-y-6 mt-6">
            {/* Contact Information */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Mail size={24} className="text-primary dark:text-accent" /> {t("adm_set_contact_info", "Thông tin liên hệ")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                    <Mail size={16} /> {t("adm_set_support_email", "Email hỗ trợ")}
                  </label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleSettingChange("supportEmail", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
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
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
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
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Globe size={24} className="text-primary dark:text-accent" /> {t("adm_set_social_media", "Mạng xã hội")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                    <Facebook size={16} className="text-blue-600" /> Facebook
                  </label>
                  <input
                    type="url"
                    value={settings.facebook}
                    onChange={(e) => handleSettingChange("facebook", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
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
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
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
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
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
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
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
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Branding Settings */}
          <TabsContent value="branding" className="space-y-6 mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Palette size={24} className="text-primary dark:text-accent" /> {t("adm_set_branding_title", "Giao diện hệ thống")}
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

                {/* Language Selection */}
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <Globe size={16} /> {t("adm_set_language", "Ngôn ngữ")}
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleLanguageSelect(e.target.value as LanguageCode)}
                    className="w-full md:w-64 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
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
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
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
              </div>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Shield size={24} className="text-primary dark:text-accent" /> {t("adm_set_security_title", "Bảo mật hệ thống")}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
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

                <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
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

                <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
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

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    {t("adm_set_security_note", "Các cài đặt bảo mật được mã hóa và lưu trữ an toàn. Chỉ quản trị viên mới có thể truy cập và thay đổi các cài đặt này.")}
                  </p>
                </div>
              </div>
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
          {isSaving ? t("adm_set_saving", "Đang lưu...") : t("adm_set_save", "Lưu cài đặt")}
        </button>
      </div>
    </div>
  )
}
