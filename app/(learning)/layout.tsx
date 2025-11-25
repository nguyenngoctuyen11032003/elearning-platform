"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { LogOut, User, Settings, LayoutDashboard, BookOpen, FileText, Heart, Award } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { getRoleAvatar, getInitials } from "@/lib/utils/avatar"

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const router = useRouter()
  
  const { user, logout, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Đang tải...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Bạn cần đăng nhập</h2>
          <Link href="/login" className="text-primary hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-border dark:border-slate-800 bg-card dark:bg-slate-900/50 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">IC</span>
            </div>
            <span className="font-bold text-foreground dark:text-white">ICS Learning</span>
          </Link>

          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 hover:opacity-80 transition-smooth px-3 py-2 rounded-lg hover:bg-secondary dark:hover:bg-slate-800"
            >
              <img
                src={getRoleAvatar(user.role)}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to initials if role avatar fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  if (target.nextSibling) return
                  const div = document.createElement('div')
                  div.className = 'w-10 h-10 rounded-full bg-primary flex items-center justify-center'
                  div.innerHTML = `<span class="text-white font-bold text-sm">${getInitials(user.name)}</span>`
                  target.parentNode?.appendChild(div)
                }}
              />
              <span className="text-sm font-medium text-foreground dark:text-white hidden sm:inline">{user?.name}</span>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-border dark:border-slate-800 sticky top-0 bg-card dark:bg-slate-900">
                  <p className="text-sm font-semibold text-foreground dark:text-white">{user?.name}</p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">
                    {user?.role === 'student' ? 'Học viên' : user?.role === 'teacher' ? 'Giảng viên' : 'Admin'}
                  </p>
                </div>

                {/* Navigation Section */}
                <div className="border-b border-border dark:border-slate-800">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    <LayoutDashboard size={18} />
                    <span className="text-sm font-medium">Bảng điều khiển</span>
                  </Link>
                  <Link
                    href="/my-courses"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    <BookOpen size={18} />
                    <span className="text-sm font-medium">Khóa học của tôi</span>
                  </Link>
                  <Link
                    href="/notes"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    <FileText size={18} />
                    <span className="text-sm font-medium">Ghi chú</span>
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    <Heart size={18} />
                    <span className="text-sm font-medium">Yêu thích</span>
                  </Link>
                  <Link
                    href="/certificates"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    <Award size={18} />
                    <span className="text-sm font-medium">Chứng chỉ</span>
                  </Link>
                </div>

                {/* Profile Section */}
                <div className="border-b border-border dark:border-slate-800">
                  <Link
                    href="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    <User size={18} />
                    <span className="text-sm font-medium">Xem hồ sơ</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    <Settings size={18} />
                    <span className="text-sm font-medium">Cài đặt</span>
                  </Link>
                </div>

                {/* Logout */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    setShowLogoutConfirm(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-smooth rounded-b-lg"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white mb-2">Xác nhận đăng xuất</h2>
            <p className="text-muted-foreground dark:text-slate-400 mb-6">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 bg-secondary dark:bg-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary/80 dark:hover:bg-slate-700 transition-smooth font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
