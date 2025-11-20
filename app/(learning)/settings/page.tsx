"use client"

import { useState } from "react"
import { Save, Bell, Lock, Eye, EyeOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StudentSettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [settings, setSettings] = useState({
    emailNotifications: true,
    courseNotifications: true,
    newCourseNotifications: true,
    currentPassword: "••••••••",
    newPassword: "",
    confirmPassword: "",
  })

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
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Cài đặt</h1>
        <p className="text-muted-foreground dark:text-slate-400">Quản lý cài đặt tài khoản của bạn</p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 p-1">
          <TabsTrigger value="notifications" className="text-xs md:text-sm">
            Thông báo
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
                  <Bell size={20} className="text-primary dark:text-accent" />
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
                  <Bell size={20} className="text-primary dark:text-accent" />
                  <div>
                    <p className="text-foreground dark:text-white font-semibold">Thông báo khóa học</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Thông báo về khóa học của bạn</p>
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
                  <Bell size={20} className="text-primary dark:text-accent" />
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
            </div>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
              <Lock size={24} /> Bảo mật
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
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 pr-10 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                  <button
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
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 pr-10 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                  <button
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                  >
                    {showPasswords["new"] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPasswords["confirm"] ? "text" : "password"}
                    value={settings.confirmPassword}
                    onChange={(e) => handleSettingChange("confirmPassword", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 pr-10 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                  <button
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                  >
                    {showPasswords["confirm"] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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
  )
}
