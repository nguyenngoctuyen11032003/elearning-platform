"use client"

import Link from "next/link"
import { Menu, X, Home, LogOut, User, Settings } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { ThemeToggle } from "./theme-toggle"
import { getInitials } from "@/lib/utils/avatar"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { config } = useSystemConfig()
  
  const { user, logout, loading, isAuthenticated } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showProfileMenu])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 backdrop-blur-lg bg-background/80 dark:bg-slate-950/60 border-b border-border dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <img src={config?.site_logo || "/images/logo.svg"} alt="ICS Cyber Security" className="h-12 w-auto rounded-full" />
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
      <Link href="/" className="flex items-center gap-2">
        <img src={config?.site_logo || "/images/logo.svg"} alt="ICS Cyber Security" className="h-12 w-auto rounded-full" />
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
        {isAuthenticated && user ? (
          <Link 
            href={user.role === 'student' ? '/userdb' : user.role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard'} 
            className="hover:text-foreground transition-smooth"
          >
            Trang chủ của tôi
          </Link>
        ) : null}
        <Link href="/about" className="hover:text-foreground transition-smooth">
          Về chúng tôi
        </Link>
      </nav>

      <div className="hidden md:flex items-center gap-4 relative">
        {isAuthenticated && user ? (
          <>
            <ThemeToggle />
            {/* Simple Avatar Button - Click to view profile or show mini menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 hover:opacity-80 transition-smooth px-3 py-2 rounded-lg hover:bg-secondary dark:hover:bg-slate-800"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-primary/20">
                    <span className="text-white font-bold text-sm">{getInitials(user.name)}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-foreground dark:text-white hidden sm:inline">{user.name}</span>
              </button>

              {/* Simplified Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl shadow-2xl z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-4 border-b border-border dark:border-slate-800 bg-gradient-to-r from-primary/5 to-purple-500/5">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center border-2 border-primary/30">
                          <span className="text-white font-bold text-sm">{getInitials(user.name)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground dark:text-slate-400">
                          {user.role === 'student' ? 'Học viên' : user.role === 'teacher' ? 'Giảng viên' : 'Quản trị viên'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="py-2">
                    <Link
                      href={user.role === 'student' ? '/userdb' : user.role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard'}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                    >
                      <Home size={18} />
                      <span className="text-sm font-medium">Trang chủ của tôi</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                    >
                      <User size={18} />
                      <span className="text-sm font-medium">Hồ sơ cá nhân</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                    >
                      <Settings size={18} />
                      <span className="text-sm font-medium">Cài đặt</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-border dark:border-slate-800 py-2">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-smooth"
                    >
                      <LogOut size={18} />
                      <span className="text-sm font-medium">Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            <Link href="/teachers" className="text-sm hover:text-primary transition-smooth">
              Giảng viên
            </Link>
            {isAuthenticated && user ? (
              <Link 
                href={user?.role === 'student' ? '/userdb' : user?.role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard'} 
                className="text-sm hover:text-primary transition-smooth"
              >
                Trang chủ của tôi
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
                <div className="border-t border-border dark:border-slate-800 pt-4 mt-2">
                  <Link
                    href="/profile"
                    className="text-sm hover:text-primary transition-smooth flex items-center gap-2 py-2"
                  >
                    <User size={16} /> Hồ sơ cá nhân
                  </Link>
                  <Link
                    href="/settings"
                    className="text-sm hover:text-primary transition-smooth flex items-center gap-2 py-2"
                  >
                    <Settings size={16} /> Cài đặt
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      handleLogout()
                    }}
                    className="text-sm hover:text-primary transition-smooth text-left text-destructive w-full flex items-center gap-2 py-2"
                  >
                    <LogOut size={16} /> Đăng xuất
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
    </header>
  )
}
