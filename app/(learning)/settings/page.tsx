"use client"

import { useState, useEffect } from "react"
import { Save, Bell, Lock, Eye, EyeOff, Moon, Sun, Palette, Mail, BookOpen, Award, Globe } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"

export default function StudentSettingsPage() {
  const { user } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [settings, setSettings] = useState({
    emailNotifications: true,
    courseNotifications: true,
    newCourseNotifications: true,
    certificateNotifications: true,
    promotionNotifications: true,
    language: "vi",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

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

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Cài đặt đã được lưu thành công!")
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu cài đặt")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      toast.error("Mật khẩu mới không khớp!")
      return
    }

    if (settings.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!")
      return
    }

    setIsSaving(true)
    try {
      await apiClient.changePassword({
        currentPassword: settings.currentPassword,
        newPassword: settings.newPassword,
      })
      toast.success("Đổi mật khẩu thành công!")
      setSettings(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Cài đặt</h1>
          <p className="text-muted-foreground dark:text-slate-400">Quản lý cài đặt tài khoản của bạn</p>
        </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 p-1">
          <TabsTrigger value="notifications" className="text-xs md:text-sm">
            Thông báo
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs md:text-sm">
            Giao diện
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs md:text-sm">
            Bảo mật
          </TabsTrigger>
        </TabsList>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
              <Bell size={24} /> Cài đặt thông báo
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-primary dark:text-accent" />
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">Thông báo Email</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Nhận thông báo qua email</p>
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
                    <p className="text-foreground dark:text-white font-semibold">Thông báo khóa học</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Cập nhật về khóa học đã đăng ký</p>
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
                    <p className="text-foreground dark:text-white font-semibold">Khóa học mới</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Thông báo về khóa học mới</p>
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
                    <p className="text-foreground dark:text-white font-semibold">Chứng chỉ</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Thông báo khi nhận chứng chỉ mới</p>
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
                    <p className="text-foreground dark:text-white font-semibold">Khuyến mãi</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Nhận thông tin khuyến mãi và ưu đãi</p>
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
              <Palette size={24} /> Giao diện
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

              <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-primary dark:text-accent" />
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">Ngôn ngữ</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Chọn ngôn ngữ hiển thị</p>
                  </div>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange("language", e.target.value)}
                  className="bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">Tiếng Anh</option>
                </select>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              Giao diện sẽ được lưu tự động và áp dụng cho tất cả các trang trong hệ thống.
            </p>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
              <Lock size={24} /> Đổi mật khẩu
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type={showPasswords["current"] ? "text" : "password"}
                    value={settings.currentPassword}
                    onChange={(e) => handleSettingChange("currentPassword", e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 pr-10 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                  >
                    {showPasswords["current"] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPasswords["new"] ? "text" : "password"}
                    value={settings.newPassword}
                    onChange={(e) => handleSettingChange("newPassword", e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 pr-10 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                  >
                    {showPasswords["new"] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPasswords["confirm"] ? "text" : "password"}
                    value={settings.confirmPassword}
                    onChange={(e) => handleSettingChange("confirmPassword", e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 pr-10 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                  >
                    {showPasswords["confirm"] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground dark:text-slate-400">
                Mật khẩu phải có ít nhất 6 ký tự.
              </p>
              <button
                onClick={handlePasswordChange}
                disabled={isSaving || !settings.currentPassword || !settings.newPassword || !settings.confirmPassword}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock size={20} />
                {isSaving ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
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

