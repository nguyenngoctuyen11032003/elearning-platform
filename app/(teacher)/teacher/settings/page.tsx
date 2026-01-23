"use client"

import { useState } from "react"
import {
  Save,
  Mail,
  Database,
  Bell,
  BookOpen,
  Users,
  Moon,
  Sun,
  Palette,
  CreditCard,
  Upload,
  Globe,
  QrCode,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function TeacherSettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    bankAccount: "1234567890",
    bankName: "Vietcombank",
    accountHolder: "Nguyễn Ngọc Tuyền",
    emailNotifications: true,
    courseNotifications: true,
    studentNotifications: true,
    reviewNotifications: true,
    earningNotifications: true,
    // Teaching preferences
    autoApproveEnrollments: false,
    showContactInfo: true,
    allowDirectMessages: true,
    // Appearance
    language: "vi",
  })

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Kích thước file không được vượt quá 2MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setQrPreview(reader.result as string)
        toast.success("Đã tải lên mã QR thành công")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast.success("Đã lưu cài đặt thành công")
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Cài đặt</h1>
          <p className="text-muted-foreground dark:text-slate-400">Quản lý cài đặt tài khoản giảng viên</p>
        </div>

        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 p-1">
            <TabsTrigger value="payment" className="text-xs md:text-sm">
              Thanh toán
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs md:text-sm">
              Thông báo
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs md:text-sm">
              Giao diện
            </TabsTrigger>
          </TabsList>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-6 mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <CreditCard size={24} /> Thông tin thanh toán
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 text-sm">
                Thông tin ngân hàng để nhận thanh toán từ các khóa học của bạn
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    Tên ngân hàng
                  </label>
                  <input
                    type="text"
                    value={settings.bankName}
                    onChange={(e) => handleSettingChange("bankName", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    value={settings.bankAccount}
                    onChange={(e) => handleSettingChange("bankAccount", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    Chủ tài khoản
                  </label>
                  <input
                    type="text"
                    value={settings.accountHolder}
                    onChange={(e) => handleSettingChange("accountHolder", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                </div>

                {/* QR Code Upload */}
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <QrCode size={16} /> Mã QR thanh toán
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-32 bg-secondary dark:bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed border-border dark:border-slate-700 overflow-hidden">
                      {qrPreview ? (
                        <img
                          src={qrPreview}
                          alt="QR Code preview"
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
                            const input = e.currentTarget.parentElement?.querySelector(
                              'input[type="file"]'
                            ) as HTMLInputElement
                            input?.click()
                          }}
                          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-smooth font-medium flex items-center gap-2"
                        >
                          <Upload size={16} /> Tải lên mã QR
                        </button>
                      </label>
                      <p className="text-xs text-muted-foreground dark:text-slate-400 mt-2">
                        PNG, JPG (Tối đa 2MB). Mã QR sẽ được hiển thị cho học viên khi thanh toán.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Teaching Preferences */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <BookOpen size={24} /> Tùy chọn giảng dạy
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-primary dark:text-accent" />
                    <div>
                      <p className="text-foreground dark:text-white font-semibold">Tự động phê duyệt đăng ký</p>
                      <p className="text-muted-foreground dark:text-slate-400 text-sm">
                        Học viên được ghi danh tự động không cần xét duyệt
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange("autoApproveEnrollments", !settings.autoApproveEnrollments)}
                    className={`w-12 h-6 rounded-full transition-all ${
                      settings.autoApproveEnrollments ? "bg-primary dark:bg-accent" : "bg-slate-400"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.autoApproveEnrollments ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-primary dark:text-accent" />
                    <div>
                      <p className="text-foreground dark:text-white font-semibold">Hiển thị thông tin liên hệ</p>
                      <p className="text-muted-foreground dark:text-slate-400 text-sm">
                        Cho phép học viên xem email và số điện thoại của bạn
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange("showContactInfo", !settings.showContactInfo)}
                    className={`w-12 h-6 rounded-full transition-all ${
                      settings.showContactInfo ? "bg-primary dark:bg-accent" : "bg-slate-400"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.showContactInfo ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database size={20} className="text-primary dark:text-accent" />
                    <div>
                      <p className="text-foreground dark:text-white font-semibold">Cho phép tin nhắn trực tiếp</p>
                      <p className="text-muted-foreground dark:text-slate-400 text-sm">
                        Học viên có thể gửi tin nhắn trực tiếp cho bạn
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange("allowDirectMessages", !settings.allowDirectMessages)}
                    className={`w-12 h-6 rounded-full transition-all ${
                      settings.allowDirectMessages ? "bg-primary dark:bg-accent" : "bg-slate-400"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.allowDirectMessages ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6 mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Bell size={24} /> Cài đặt thông báo
              </h2>
              <div className="space-y-4">
                {[
                  { key: "emailNotifications", icon: Mail, title: "Thông báo Email", desc: "Nhận thông báo qua email" },
                  { key: "courseNotifications", icon: BookOpen, title: "Thông báo khóa học", desc: "Thông báo về khóa học của bạn" },
                  { key: "studentNotifications", icon: Users, title: "Thông báo học viên", desc: "Thông báo khi có học viên mới đăng ký" },
                  { key: "reviewNotifications", icon: BookOpen, title: "Thông báo đánh giá", desc: "Thông báo khi có đánh giá mới" },
                  { key: "earningNotifications", icon: CreditCard, title: "Thông báo doanh thu", desc: "Thông báo về doanh thu và thanh toán" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className="text-primary dark:text-accent" />
                      <div>
                        <p className="text-foreground dark:text-white font-semibold">{item.title}</p>
                        <p className="text-muted-foreground dark:text-slate-400 text-sm">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSettingChange(item.key, !(settings as any)[item.key])}
                      className={`w-12 h-6 rounded-full transition-all ${
                        (settings as any)[item.key] ? "bg-primary dark:bg-accent" : "bg-slate-400"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          (settings as any)[item.key] ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="space-y-6 mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Palette size={24} /> Giao diện
              </h2>
              <div className="space-y-4">
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
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">Tiếng Anh</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="zh">中文</option>
                  </select>
                </div>

                {/* Dark Mode Toggle */}
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
                        Bật/tắt chế độ tối cho giao diện
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

