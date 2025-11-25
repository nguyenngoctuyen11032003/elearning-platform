"use client"

import Link from "next/link"
import { Menu, X, Home, LogOut, User, Settings, BookOpen, FileText, Heart, Award } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { ThemeToggle } from "./theme-toggle"
import { getRoleAvatar, getInitials } from "@/lib/utils/avatar"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  const { user, logout, loading, isAuthenticated } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 backdrop-blur-lg bg-background/80 dark:bg-slate-950/60 border-b border-border dark:border-slate-800">
        <Link href="/" className="font-bold text-xl text-foreground tracking-tight">
          ICS Learning
        </Link>
        <nav className="hidden md:flex gap-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-smooth flex items-center gap-2">
            <Home size={16} /> Trang chủ
          </Link>
          <Link href="/courses" className="hover:text-foreground transition-smooth">
            Khóa học
          </Link>
          <Link href="/teachers" className="hover:text-foreground transition-smooth">
            Giảng viên
          </Link>
          <Link href="/about" className="hover:text-foreground transition-smooth">
            Về chúng tôi
          </Link>
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
            Đăng nhập
          </Link>
          <Link
            href="/signup"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-full text-sm font-medium transition-smooth"
          >
            Bắt đầu học
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 backdrop-blur-lg bg-background/80 dark:bg-slate-950/60 border-b border-border dark:border-slate-800">
      <Link href="/" className="font-bold text-xl text-foreground tracking-tight">
        ICS Learning
      </Link>

      <nav className="hidden md:flex gap-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-smooth flex items-center gap-2">
          <Home size={16} /> Trang chủ
        </Link>
        <Link href="/courses" className="hover:text-foreground transition-smooth">
          Khóa học
        </Link>
        {isAuthenticated ? (
          <Link href="/dashboard" className="hover:text-foreground transition-smooth">
            Bảng điều khiển
          </Link>
        ) : (
          <Link href="/teachers" className="hover:text-foreground transition-smooth">
            Giảng viên
          </Link>
        )}
        <Link href="/about" className="hover:text-foreground transition-smooth">
          Về chúng tôi
        </Link>
      </nav>

      <div className="hidden md:flex items-center gap-4 relative">
        {isAuthenticated && user ? (
          <>
            <ThemeToggle />
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
              <span className="text-sm font-medium text-foreground dark:text-white hidden sm:inline">{user.name}</span>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-border dark:border-slate-800 sticky top-0 bg-card dark:bg-slate-900">
                  <p className="text-sm font-semibold text-foreground dark:text-white">{user.name}</p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">
                    {user.role === 'student' ? 'Học viên' : user.role === 'teacher' ? 'Giảng viên' : 'Admin'}
                  </p>
                </div>

                <div className="border-b border-border dark:border-slate-800">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    <Home size={18} />
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

                <div>
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
              </div>
            )}
          </>
        ) : (
          <>
            <ThemeToggle />
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Đăng nhập
            </Link>
            <Link
              href="/signup"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-full text-sm font-medium transition-smooth"
            >
              Bắt đầu học
            </Link>
          </>
        )}
      </div>

      <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background dark:bg-slate-950 border-b border-border dark:border-slate-800 p-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <Link href="/" className="text-sm hover:text-primary transition-smooth flex items-center gap-2">
              <Home size={16} /> Trang chủ
            </Link>
            <Link href="/courses" className="text-sm hover:text-primary transition-smooth">
              Khóa học
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard" className="text-sm hover:text-primary transition-smooth">
                Bảng điều khiển
              </Link>
            ) : (
              <Link href="/teachers" className="text-sm hover:text-primary transition-smooth">
                Giảng viên
              </Link>
            )}
            <Link href="/about" className="text-sm hover:text-primary transition-smooth">
              Về chúng tôi
            </Link>
            {isAuthenticated ? (
              <>
                <div className="border-t border-border dark:border-slate-800 pt-4 mt-4">
                  <Link
                    href="/dashboard"
                    className="text-sm hover:text-primary transition-smooth flex items-center gap-2"
                  >
                    <Home size={16} /> Bảng điều khiển
                  </Link>
                  <Link
                    href="/my-courses"
                    className="text-sm hover:text-primary transition-smooth flex items-center gap-2"
                  >
                    <BookOpen size={16} /> Khóa học của tôi
                  </Link>
                  <Link href="/notes" className="text-sm hover:text-primary transition-smooth flex items-center gap-2">
                    <FileText size={16} /> Ghi chú
                  </Link>
                  <Link
                    href="/wishlist"
                    className="text-sm hover:text-primary transition-smooth flex items-center gap-2"
                  >
                    <Heart size={16} /> Yêu thích
                  </Link>
                  <Link
                    href="/certificates"
                    className="text-sm hover:text-primary transition-smooth flex items-center gap-2"
                  >
                    <Award size={16} /> Chứng chỉ
                  </Link>
                </div>
                <div className="border-t border-border dark:border-slate-800 pt-4">
                  <Link href="/profile" className="text-sm hover:text-primary transition-smooth">
                    Xem hồ sơ
                  </Link>
                  <Link href="/settings" className="text-sm hover:text-primary transition-smooth">
                    Cài đặt
                  </Link>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="text-sm hover:text-primary transition-smooth text-left text-destructive w-full"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm hover:text-primary transition-smooth">
                  Đăng nhập
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium text-center"
                >
                  Bắt đầu học
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative z-[10000]">
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
    </header>
  )
}
