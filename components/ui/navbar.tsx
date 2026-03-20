"use client"

import Link from "next/link"
import { Menu, X, Home, LogOut, User, Settings, MessageCircle } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { ThemeToggle } from "./theme-toggle"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
import { UserAvatar } from "@/components/ui/user-avatar"
import { LogoDisplay } from "@/components/ui/logo-display"
import { LanguageSelector } from "@/components/ui/language-selector"
import { useLanguage } from "@/lib/i18n/language-context"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { config } = useSystemConfig()
  const { user, logout, loading, isAuthenticated } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (pathname === "/") {
      document.body.dataset.chatbot = "header"
    } else {
      delete document.body.dataset.chatbot
    }

    return () => {
      delete document.body.dataset.chatbot
    }
  }, [pathname])

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
  const handleChatbotOpen = () => {
    const botContainer = document.getElementById("gim-bot-tool-bot-container")
    if (botContainer) {
      botContainer.style.position = "fixed"
      botContainer.style.right = "24px"
      botContainer.style.top = "72px"
      botContainer.style.bottom = "auto"
      botContainer.style.zIndex = "10001"
    }

    const chatButton = document.getElementById("gim-bot-tool-button")
    if (chatButton) {
      chatButton.click()
    }
  }

  return (
    <header className="sticky top-0 left-0 right-0 z-[1000] isolate flex items-center justify-between px-8 py-2 backdrop-blur-xl border-b border-white/10 bg-background/70 dark:bg-slate-950/70 shadow-lg shadow-black/10 dark:shadow-black/40 rounded-b-xl">
        <Link href="/" className="flex items-center gap-2">
          <LogoDisplay
            src={config?.site_logo}
            size="md"
            variant="compact"
            showText={true}
          />
        </Link>

        <nav className="hidden md:flex gap-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-smooth flex items-center gap-2">
            <Home size={16} /> {t("nav_home", "Trang chủ")}
          </Link>
          <Link href="/courses" className="hover:text-foreground transition-smooth">
            {t("nav_courses", "Khóa học")}
          </Link>
          {!isAuthenticated && (
            <Link href="/teachers" className="hover:text-foreground transition-smooth">
              {t("nav_teachers", "Giảng viên")}
            </Link>
          )}
          {isAuthenticated && user ? (
            <Link 
              href={user.role === 'student' ? '/userdb' : user.role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard'} 
              className="hover:text-foreground transition-smooth"
            >
              {t("nav_my_home", "Trang chủ của tôi")}
            </Link>
          ) : null}
          <Link href="/about" className="hover:text-foreground transition-smooth">
            {t("nav_about", "Về chúng tôi")}
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4 relative">
          <LanguageSelector />
          {isAuthenticated && user ? (
            <>
              <ThemeToggle />
              {pathname === "/" && (
                <button
                  type="button"
                  onClick={handleChatbotOpen}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                >
                  <MessageCircle size={16} />
                  Chatbot
                </button>
              )}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 hover:opacity-80 transition-smooth px-2 py-1 rounded-lg hover:bg-secondary dark:hover:bg-slate-800"
                >
                  <UserAvatar 
                    src={user.avatar} 
                    name={user.name} 
                    size="sm"
                  />
                  <span className="text-sm font-medium text-foreground dark:text-white hidden sm:inline">{user.name}</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl shadow-2xl z-50">
                    <div className="px-4 py-3 border-b border-border dark:border-slate-800 bg-gradient-to-r from-primary/5 to-purple-500/5">
                      <div className="flex items-center gap-3">
                        <UserAvatar 
                          src={user.avatar} 
                          name={user.name} 
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground dark:text-white truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">
                            {user.role === 'student' ? t("role_student", "Học viên") : user.role === 'teacher' ? t("role_teacher", "Giảng viên") : t("role_admin", "Quản trị viên")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <Link
                        href={user.role === 'student' ? '/userdb' : user.role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard'}
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                      >
                        <Home size={18} />
                        <span className="text-sm font-medium">{t("nav_my_home", "Trang chủ của tôi")}</span>
                      </Link>
                      <Link
                        href={user.role === 'student' ? '/profile' : user.role === 'teacher' ? '/teacher/profile' : '/admin/profile'}
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                      >
                        <User size={18} />
                        <span className="text-sm font-medium">{t("nav_profile", "Hồ sơ cá nhân")}</span>
                      </Link>
                      <Link
                        href={user.role === 'student' ? '/settings' : user.role === 'teacher' ? '/teacher/settings' : '/admin/settings'}
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                      >
                        <Settings size={18} />
                        <span className="text-sm font-medium">{t("nav_settings", "Cài đặt")}</span>
                      </Link>
                    </div>

                    <div className="border-t border-border dark:border-slate-800 py-2">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-smooth"
                      >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">{t("nav_logout", "Đăng xuất")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <ThemeToggle />
              {pathname === "/" && (
                <button
                  type="button"
                  onClick={handleChatbotOpen}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                >
                  <MessageCircle size={16} />
                  Chatbot
                </button>
              )}
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                {t("nav_login", "Đăng nhập")}
              </Link>
              <Link
                href="/signup"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-full text-sm font-medium transition-smooth"
              >
                {t("nav_start_learning", "Bắt đầu học")}
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border border-border dark:border-slate-800 bg-card/90 dark:bg-slate-900/80"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Đóng menu" : "Mở menu"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 top-16 bg-black/35 md:hidden z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-16 left-0 right-0 bg-background dark:bg-slate-950 border-b border-border dark:border-slate-800 p-4 md:hidden z-50 shadow-xl">
              <div className="mb-4 pb-4 border-b border-border dark:border-slate-800">
                <LanguageSelector />
              </div>
              <nav className="flex flex-col gap-4">
                <Link href="/" className="text-sm hover:text-primary transition-smooth flex items-center gap-2">
                  <Home size={16} /> {t("nav_home", "Trang chủ")}
                </Link>
                <Link href="/courses" className="text-sm hover:text-primary transition-smooth">
                  {t("nav_courses", "Khóa học")}
                </Link>
                {!isAuthenticated && (
                  <Link href="/teachers" className="text-sm hover:text-primary transition-smooth">
                    {t("nav_teachers", "Giảng viên")}
                  </Link>
                )}
                {isAuthenticated && user ? (
                  <Link 
                    href={user?.role === 'student' ? '/userdb' : user?.role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard'} 
                    className="text-sm hover:text-primary transition-smooth"
                  >
                    {t("nav_my_home", "Trang chủ của tôi")}
                  </Link>
                ) : null}
                <Link href="/about" className="text-sm hover:text-primary transition-smooth">
                  {t("nav_about", "Về chúng tôi")}
                </Link>
                {pathname === "/" && (
                  <button
                    type="button"
                    onClick={handleChatbotOpen}
                    className="text-sm hover:text-primary transition-smooth flex items-center gap-2"
                  >
                    <MessageCircle size={16} /> Chatbot
                  </button>
                )}
                {isAuthenticated ? (
                  <>
                    <div className="border-t border-border dark:border-slate-800 pt-4 mt-2">
                      <Link
                        href="/profile"
                        className="text-sm hover:text-primary transition-smooth flex items-center gap-2 py-2"
                      >
                        <User size={16} /> {t("nav_profile", "Hồ sơ cá nhân")}
                      </Link>
                      <Link
                        href="/settings"
                        className="text-sm hover:text-primary transition-smooth flex items-center gap-2 py-2"
                      >
                        <Settings size={16} /> {t("nav_settings", "Cài đặt")}
                      </Link>
                      <button
                        onClick={() => {
                          setIsOpen(false)
                          handleLogout()
                        }}
                        className="text-sm hover:text-primary transition-smooth text-left text-destructive w-full flex items-center gap-2 py-2"
                      >
                        <LogOut size={16} /> {t("nav_logout", "Đăng xuất")}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-sm hover:text-primary transition-smooth">
                      {t("nav_login", "Đăng nhập")}
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium text-center"
                    >
                      {t("nav_start_learning", "Bắt đầu học")}
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </>
        )}
      </header>
    )
  }