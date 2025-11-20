"use client"

import { useState } from "react"
import { Save, Upload, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"

export default function EditProfilePage() {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "Trần Thị Hương",
    email: "hương@icslearning.com",
    phone: "+84 (123) 456-789",
    location: "Hà Nội, Việt Nam",
    bio: "Học viên đam mê lập trình và thiết kế web",
  })

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Chỉnh sửa hồ sơ</h1>
        <Link
          href="/profile"
          className="px-6 py-2 border border-border dark:border-slate-800 text-foreground dark:text-white rounded-lg font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
        >
          Quay lại
        </Link>
      </div>

      {/* Edit Form */}
      <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8 max-w-2xl">
        <div className="space-y-6">
          {/* Avatar Upload */}
          <div>
            <label className="block text-foreground dark:text-white text-sm font-semibold mb-3">Ảnh đại diện</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-secondary dark:bg-slate-800 rounded-full flex items-center justify-center border-2 border-dashed border-border dark:border-slate-700 overflow-hidden">
                <img src="/professional-woman.png" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <label className="block">
                  <span className="sr-only">Chọn ảnh</span>
                  <input type="file" accept="image/*" className="hidden" />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.querySelector(
                        'input[type="file"]',
                      ) as HTMLInputElement
                      input?.click()
                    }}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-smooth font-medium flex items-center gap-2"
                  >
                    <Upload size={18} />
                    Tải lên ảnh
                  </button>
                </label>
                <p className="text-xs text-muted-foreground dark:text-slate-400 mt-2">PNG, JPG (Max 2MB)</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Họ và tên</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                <Phone size={16} /> Điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
              <MapPin size={16} /> Địa điểm
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Tiểu sử</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  )
}
