"use client"

import { useState } from "react"
import {
  Save,
  Mail,
  Phone,
  Lock,
  Database,
  Bell,
  Shield,
  Eye,
  EyeOff,
  BookOpen,
  Users,
  Upload,
  Camera,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TeacherSettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [settings, setSettings] = useState({
    fullName: "Nguyễn Ngọc Tuyền",
    email: "teacher@icslearning.com",
    phone: "+84 (123) 456-789",
    bio: "Giáo viên lập trình với 10 năm kinh nghiệm",
    avatar: "/professional-woman.png",
    bankAccount: "1234567890",
    bankName: "Vietcombank",
    accountHolder: "Nguyễn Ngọc Tuyền",
    emailNotifications: true,
    courseNotifications: true,
    studentNotifications: true,
    currentPassword: "",
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
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Cài đặt tài khoản</h1>
          <p className="text-muted-foreground dark:text-slate-400">Quản lý thông tin cá nhân và cài đặt giảng viên</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 p-1">
            <TabsTrigger value="profile" className="text-xs md:text-sm">
              Hồ sơ
            </TabsTrigger>
            <TabsTrigger value="avatar" className="text-xs md:text-sm">
              Avatar
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-xs md:text-sm">
              Thanh toán
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs md:text-sm">
              Thông báo
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm">
              Bảo mật
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Database size={24} /> Thông tin cá nhân
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Họ và tên</label>
                  <input
                    type="text"
                    value={settings.fullName}
                    onChange={(e) => handleSettingChange("fullName", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                      <Mail size={16} /> Email
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleSettingChange("email", e.target.value)}
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
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Tiểu sử</label>
                  <textarea
                    value={settings.bio}
                    onChange={(e) => handleSettingChange("bio", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-24"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Avatar Settings */}
          <TabsContent value="avatar" className="space-y-6 mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Camera size={24} /> Ảnh đại diện
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-6">
                  <img
                    src={settings.avatar || "/placeholder.svg"}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary dark:border-accent"
                  />
                  <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth">
                    <Upload size={20} />
                    Tải lên ảnh mới
                  </button>
                </div>
                <p className="text-sm text-muted-foreground dark:text-slate-400 text-center">
                  Hỗ trợ các định dạng: JPG, PNG, GIF (Tối đa 5MB)
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-6 mt-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <Lock size={24} /> Thông tin thanh toán
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    Tên ngân hàng
                  </label>
                  <input
                    type="text"
                    value={settings.bankName}
                    onChange={(e) => handleSettingChange("bankName", e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
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
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
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
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
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
                    <Users size={20} className="text-primary dark:text-accent" />
                    <div>
                      <p className="text-foreground dark:text-white font-semibold">Thông báo học viên</p>
                      <p className="text-muted-foreground dark:text-slate-400 text-sm">Thông báo về học viên mới</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSettingChange("studentNotifications", !settings.studentNotifications)}
                    className={`w-12 h-6 rounded-full transition-all ${
                      settings.studentNotifications ? "bg-primary dark:bg-accent" : "bg-slate-400"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.studentNotifications ? "translate-x-6" : "translate-x-0.5"
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
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    Mật khẩu mới
                  </label>
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
                    Xác nhận mật khẩu mới
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
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                </p>
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
