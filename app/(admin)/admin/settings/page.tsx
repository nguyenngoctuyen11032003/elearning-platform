"use client"

import type React from "react"

import { useState } from "react"
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
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminSettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    siteName: "ICS Learning",
    siteDescription: "Nền tảng học trực tuyến cao cấp",
    supportEmail: "support@icslearning.com",
    phone: "+84 (123) 456-789",
    primaryColor: "#2563eb",
    accentColor: "#06b6d4",
    stripeKey: "sk_test_...",
    muxToken: "mux_token_...",
    openaiKey: "sk_...",
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpEmail: "noreply@icslearning.com",
    smtpPassword: "••••••••",
    aiAssistantEnabled: true,
    emailNotifications: true,
    maintenanceMode: false,
  })

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground dark:text-slate-400">Quản lý cấu hình toàn bộ nền tảng</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 p-1">
            <TabsTrigger value="general" className="text-xs md:text-sm">
              Chung
            </TabsTrigger>
            <TabsTrigger value="branding" className="text-xs md:text-sm">
              Thương hiệu
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm">
              Bảo mật
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Database size={24} /> Thông tin chung
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    Tên trang web
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange("siteName", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    Mô tả trang web
                  </label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                      <Mail size={16} /> Email hỗ trợ
                    </label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => handleSettingChange("supportEmail", e.target.value)}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                      <Phone size={16} /> Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => handleSettingChange("phone", e.target.value)}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Branding Settings */}
          <TabsContent value="branding" className="space-y-6 mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Palette size={24} /> Thương hiệu & Giao diện
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-3">Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-secondary dark:bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed border-border dark:border-slate-700 overflow-hidden">
                      {logoPreview ? (
                        <img
                          src={logoPreview || "/placeholder.svg"}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Upload size={32} className="text-muted-foreground dark:text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block">
                        <span className="sr-only">Chọn logo</span>
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
                          Tải lên logo
                        </button>
                      </label>
                      <p className="text-xs text-muted-foreground dark:text-slate-400 mt-2">PNG, JPG (Max 2MB)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                      Màu chính
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange("primaryColor", e.target.value)}
                        className="w-16 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange("primaryColor", e.target.value)}
                        className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Màu nhấn</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => handleSettingChange("accentColor", e.target.value)}
                        className="w-16 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.accentColor}
                        onChange={(e) => handleSettingChange("accentColor", e.target.value)}
                        className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? (
                      <Moon size={24} className="text-primary dark:text-accent" />
                    ) : (
                      <Sun size={24} className="text-yellow-400" />
                    )}
                    <div>
                      <p className="text-foreground dark:text-white font-semibold">Chế độ tối</p>
                      <p className="text-muted-foreground dark:text-slate-400 text-sm">
                        Bật/tắt chế độ tối cho toàn bộ hệ thống
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
                <Shield size={24} /> Bảo mật
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe size={20} className="text-primary dark:text-accent" />
                    <div>
                      <p className="text-foreground dark:text-white font-semibold">Chế độ bảo trì</p>
                      <p className="text-muted-foreground dark:text-slate-400 text-sm">Tắt trang web để bảo trì</p>
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
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    Các cài đặt bảo mật được mã hóa và lưu trữ an toàn. Chỉ quản trị viên mới có thể truy cập.
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
          {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>
    </div>
  )
}
