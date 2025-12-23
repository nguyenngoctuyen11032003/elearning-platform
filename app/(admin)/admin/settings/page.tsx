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

export default function AdminSettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    // About ICS Learning
    aboutUs: "ICS Learning là nền tảng giáo dục trực tuyến hàng đầu Việt Nam, được thành lập với mục tiêu mang đến cơ hội học tập chất lượng cao cho mọi người, mọi lúc, mọi nơi. Với đội ngũ giảng viên giàu kinh nghiệm và công nghệ hiện đại, chúng tôi cam kết đồng hành cùng bạn trên con đường chinh phục tri thức.",
    // Mission
    mission: "Sứ mệnh của ICS Learning là dân chủ hóa giáo dục, mang kiến thức đến gần hơn với mọi người. Chúng tôi tin rằng việc học không bao giờ là quá muộn và mỗi người đều xứng đáng được tiếp cận với những khóa học chất lượng cao với chi phí hợp lý.",
    // Vision
    vision: "Trở thành nền tảng học trực tuyến số 1 Việt Nam, nơi mà mỗi học viên đều có thể phát triển kỹ năng và sự nghiệp của mình.",
    // Contact
    supportEmail: "support@icslearning.com",
    businessEmail: "business@icslearning.com",
    phone: "+84 (028) 3823-6868",
    hotline: "1900 6868",
    address: "Tầng 10, Tòa nhà ICS Tower, 123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    workingHours: "Thứ 2 - Thứ 6: 8:00 - 18:00, Thứ 7: 8:00 - 12:00",
    // Social Media
    facebook: "https://facebook.com/icslearning",
    instagram: "https://instagram.com/icslearning",
    twitter: "https://twitter.com/icslearning",
    youtube: "https://youtube.com/icslearning",
    linkedin: "https://linkedin.com/company/icslearning",
    tiktok: "https://tiktok.com/@icslearning",
    zalo: "https://zalo.me/icslearning",
    // Branding
    primaryColor: "#2563eb",
    accentColor: "#06b6d4",
    // System
    maintenanceMode: false,
    stripeKey: "sk_test_...",
    muxToken: "mux_token_...",
    openaiKey: "sk_...",
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpEmail: "noreply@icslearning.com",
    smtpPassword: "••••••••",
    aiAssistantEnabled: true,
    emailNotifications: true,
    language: "vi",
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
          <TabsList className="grid w-full grid-cols-4 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 p-1">
            <TabsTrigger value="general" className="text-xs md:text-sm">
              Chung
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs md:text-sm">
              Liên hệ
            </TabsTrigger>
            <TabsTrigger value="branding" className="text-xs md:text-sm">
              Giao diện
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm">
              Bảo mật
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6 mt-6">
            {/* About ICS Learning */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Heart size={24} className="text-primary dark:text-accent" /> Về ICS Learning
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    Giới thiệu về ICS Learning
                  </label>
                  <textarea
                    value={settings.aboutUs}
                    onChange={(e) => handleSettingChange("aboutUs", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-32 resize-none"
                    placeholder="Mô tả về ICS Learning..."
                  />
                </div>
              </div>
            </div>

            {/* Mission */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Target size={24} className="text-primary dark:text-accent" /> Sứ mệnh của chúng tôi
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    Sứ mệnh
                  </label>
                  <textarea
                    value={settings.mission}
                    onChange={(e) => handleSettingChange("mission", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-32 resize-none"
                    placeholder="Sứ mệnh của ICS Learning..."
                  />
                </div>
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    Tầm nhìn
                  </label>
                  <textarea
                    value={settings.vision}
                    onChange={(e) => handleSettingChange("vision", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-24 resize-none"
                    placeholder="Tầm nhìn của ICS Learning..."
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
                <Mail size={24} className="text-primary dark:text-accent" /> Thông tin liên hệ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                    <Mail size={16} /> Email hỗ trợ
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
                    <Phone size={16} /> Hotline
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
                  <MapPin size={16} /> Địa chỉ
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleSettingChange("address", e.target.value)}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-foreground dark:text-white text-sm font-semibold mb-2">
                  <Clock size={16} /> Giờ làm việc
                </label>
                <input
                  type="text"
                  value={settings.workingHours}
                  onChange={(e) => handleSettingChange("workingHours", e.target.value)}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Globe size={24} className="text-primary dark:text-accent" /> Mạng xã hội
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
                    <MessageCircle size={16} className="text-blue-500" /> Zalo
                  </label>
                  <input
                    type="url"
                    value={settings.zalo}
                    onChange={(e) => handleSettingChange("zalo", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    placeholder="https://zalo.me/..."
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Branding Settings */}
          <TabsContent value="branding" className="space-y-6 mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Palette size={24} className="text-primary dark:text-accent" /> Giao diện hệ thống
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

                {/* Language Selection */}
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <Globe size={16} /> Ngôn ngữ
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingChange("language", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  >
                    <option value="vi">🇻🇳 Tiếng Việt</option>
                    <option value="en">🇺🇸 English</option>
                    <option value="ja">🇯🇵 日本語</option>
                    <option value="ko">🇰🇷 한국어</option>
                    <option value="zh">🇨🇳 中文</option>
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
                <Shield size={24} className="text-primary dark:text-accent" /> Bảo mật hệ thống
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe size={20} className="text-orange-500" />
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

                <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-blue-500" />
                    <div>
                      <p className="text-foreground dark:text-white font-semibold">Thông báo Email</p>
                      <p className="text-muted-foreground dark:text-slate-400 text-sm">Gửi thông báo qua email</p>
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
                      <p className="text-muted-foreground dark:text-slate-400 text-sm">Kích hoạt trợ lý AI</p>
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
                    Các cài đặt bảo mật được mã hóa và lưu trữ an toàn. Chỉ quản trị viên mới có thể truy cập và thay đổi các cài đặt này.
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

