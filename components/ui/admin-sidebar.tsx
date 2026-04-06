"use client";

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, BookOpen, CreditCard, BarChart3, Settings, LogOut, User, FolderOpen, Award, FileText, ShieldCheck } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
import { UserAvatar } from "@/components/ui/user-avatar"
import { LogoDisplay } from "@/components/ui/logo-display"
import { useSidebarContext } from "@/components/ui/mobile-sidebar-toggle"
import { useLanguage } from "@/lib/i18n/language-context"

// Re-export for backward compatibility
export { SidebarProvider, MobileMenuToggle, useSidebarContext } from "@/components/ui/mobile-sidebar-toggle"

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const { isOpen, setIsOpen } = useSidebarContext()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { config, loading } = useSystemConfig()
  const touchStartYRef = useRef<number | null>(null)
  const isExpanded = isHovering || !isCollapsed

  useEffect(() => {
    if (isCollapsed) return

    const desktopQuery = window.matchMedia("(min-width: 1280px)")
    const canAutoCollapse = () => desktopQuery.matches
    if (!canAutoCollapse()) return

    const mainContentEl = document.querySelector<HTMLElement>("main[data-dashboard-main='true']")
    if (!mainContentEl) return

    const mainContent = mainContentEl as EventTarget

    const collapseSidebar = () => {
      setIsCollapsed(true)
    }

    const getWheelThreshold = () => {
      return 8
    }

    const getTouchThreshold = () => {
      return 12
    }

    const onPointerDown = (event: Event) => {
      if (!desktopQuery.matches) return
      const pointerEvent = event as PointerEvent
      if (pointerEvent.pointerType === "mouse") {
        collapseSidebar()
      }
    }

    const onWheel = (event: Event) => {
      if (!canAutoCollapse()) return
      const wheelEvent = event as WheelEvent
      if (Math.abs(wheelEvent.deltaY) >= getWheelThreshold()) {
        collapseSidebar()
      }
    }

    const onTouchStart = (event: Event) => {
      if (!canAutoCollapse()) return
      const touchEvent = event as TouchEvent
      touchStartYRef.current = touchEvent.touches[0]?.clientY ?? null
    }

    const onTouchMove = (event: Event) => {
      if (!canAutoCollapse()) return
      if (touchStartYRef.current === null) return
      const touchEvent = event as TouchEvent
      const currentY = touchEvent.touches[0]?.clientY ?? touchStartYRef.current
      const deltaY = Math.abs(currentY - touchStartYRef.current)
      if (deltaY >= getTouchThreshold()) {
        collapseSidebar()
        touchStartYRef.current = null
      }
    }

    const onTouchEnd = () => {
      touchStartYRef.current = null
    }

    mainContent.addEventListener("pointerdown", onPointerDown, { passive: true })
    mainContent.addEventListener("wheel", onWheel, { passive: true })
    mainContent.addEventListener("touchstart", onTouchStart, { passive: true })
    mainContent.addEventListener("touchmove", onTouchMove, { passive: true })
    mainContent.addEventListener("touchend", onTouchEnd, { passive: true })

    return () => {
      mainContent.removeEventListener("pointerdown", onPointerDown)
      mainContent.removeEventListener("wheel", onWheel)
      mainContent.removeEventListener("touchstart", onTouchStart)
      mainContent.removeEventListener("touchmove", onTouchMove)
      mainContent.removeEventListener("touchend", onTouchEnd)
    }
  }, [isCollapsed])

  useEffect(() => {
    if (!isOpen) return
    if (window.matchMedia("(min-width: 1280px)").matches) return
    setIsCollapsed(false)
  }, [isOpen])

  const menuItems = [
    { icon: LayoutDashboard, label: t("admin_menu_dashboard", "Dashboard"), href: "/admin/dashboard" },
    { icon: Users, label: t("admin_menu_users", "Người dùng"), href: "/admin/users" },
    { icon: FolderOpen, label: t("admin_menu_categories", "Danh mục"), href: "/admin/categories" },
    { icon: BookOpen, label: t("admin_menu_courses", "Khóa học"), href: "/admin/courses" },
    { icon: FileText, label: t("admin_menu_exams", "Bài thi"), href: "/admin/exams" },
    { icon: Award, label: t("admin_menu_certificates", "Chứng chỉ"), href: "/admin/certificates" },
    { icon: CreditCard, label: t("admin_menu_payments", "Thanh toán"), href: "/admin/payments" },
    { icon: ShieldCheck, label: t("admin_menu_subscriptions", "Gói giảng viên"), href: "/admin/subscriptions" },
    { icon: BarChart3, label: t("admin_menu_reports", "Báo cáo"), href: "/admin/reports" },
    { icon: Settings, label: t("admin_menu_settings", "Cài đặt"), href: "/admin/settings" },
  ]

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const handleMouseEnter = () => {
    const canHover = window.matchMedia("(hover: hover)").matches
    if (canHover) {
      setIsHovering(true)
    }
  }

  const handleMouseLeave = () => {
    const canHover = window.matchMedia("(hover: hover)").matches
    if (canHover) {
      setIsHovering(false)
    }
  }

  if (loading) {
    return (
      <>
        <aside className="fixed top-0 left-0 h-screen z-40 bg-card dark:bg-slate-900/80 border-r border-border dark:border-slate-800 xl:sticky xl:top-0 flex flex-col w-20">
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground text-xs">Loading...</div>
          </div>
        </aside>
      </>
    )
  }

  return (
    <>
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 left-0 h-screen z-40 bg-card dark:bg-slate-900/80 border-r border-border dark:border-slate-800 transition-all duration-500 ease-out transform-gpu xl:sticky xl:top-0 flex flex-col ${
          isExpanded ? "w-64" : "w-20"
        } ${
          isOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
        }`}
      >
        {/* Logo Section - Fixed Header */}
        <div className="flex-shrink-0 px-4 py-5 border-b border-border/50 dark:border-slate-800/50 mt-12 xl:mt-0">
          <Link href="/" className="flex items-center justify-center">
            <LogoDisplay 
              src={config?.site_logo}
              size={isExpanded ? "lg" : "md"}
              variant="icon"
              showText={false}
            />
          </Link>
          {isExpanded && (
            <div className="mt-2 text-center">
              <h3 className="text-sm font-bold text-foreground dark:text-white">{t("admin_portal", "Admin Portal")}</h3>
              <p className="text-xs text-muted-foreground dark:text-slate-400">ICS E-Learning</p>
            </div>
          )}
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y px-3 py-4 space-y-1.5 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40 scrollbar-track-transparent">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-out group relative ${
                  isActive
                    ? "bg-gradient-to-r from-primary/15 to-accent/10 dark:from-primary/20 dark:to-accent/15 text-primary dark:text-accent border-l-4 border-primary dark:border-accent shadow-sm"
                    : "text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-secondary/60 dark:hover:bg-slate-800/60 hover:border-l-4 hover:border-transparent hover:pl-3"
                }`}
                title={!isExpanded ? item.label : ""}
              >
                <item.icon size={18} className={isActive ? "" : "group-hover:scale-110 transition-transform duration-300 ease-out"} />
                {isExpanded && <span className="font-medium text-sm transition-opacity duration-300 ease-out">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Fixed Footer - User Info & Logout */}
        <div className="flex-shrink-0 px-3 py-4 border-t border-border/50 dark:border-slate-800/50 space-y-2.5 bg-card/50 dark:bg-slate-900/50 backdrop-blur-sm">
          {/* User Info - Clickable to Profile */}
          {user && isExpanded && (
            <Link
              href="/admin/profile"
              className="block bg-gradient-to-br from-secondary/40 to-secondary/20 dark:from-slate-800/40 dark:to-slate-800/20 rounded-xl p-3 border border-border/70 dark:border-slate-700/70 hover:border-primary/50 dark:hover:border-accent/50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={user.avatar}
                  name={user.name}
                  size="md"
                  className="group-hover:scale-105 transition-all shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground dark:text-white font-semibold text-sm truncate group-hover:text-primary dark:group-hover:text-accent transition-colors">
                    {user.name || t("role_admin", "Admin")}
                  </p>
                  <p className="text-muted-foreground dark:text-slate-400 text-xs truncate">
                    {user.email}
                  </p>
                </div>
                <User size={16} className="text-muted-foreground dark:text-slate-400 group-hover:text-primary dark:group-hover:text-accent transition-colors flex-shrink-0" />
              </div>
            </Link>
          )}

          {user && !isExpanded && (
            <Link
              href="/admin/profile"
              className="flex justify-center"
              title={user.name || t("role_admin", "Admin")}
            >
              <UserAvatar
                src={user.avatar}
                name={user.name}
                size="md"
                className="hover:scale-105 transition-all shadow-md"
              />
            </Link>
          )}

          <div className="relative">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={`w-full flex items-center gap-3 py-2.5 text-muted-foreground dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all group border border-transparent hover:border-red-200 dark:hover:border-red-900/50 ${
                isExpanded ? "px-3" : "justify-center px-2"
              }`}
              title={!isExpanded ? t("nav_logout", "Đăng xuất") : ""}
            >
              <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
              {isExpanded && <span className="font-medium text-sm">{t("nav_logout", "Đăng xuất")}</span>}
            </button>

            {/* Logout Confirmation Modal - anchored to button */}
            {showLogoutConfirm && (
              <>
                <div 
                  className="fixed inset-0 bg-black/40 z-[9998]" 
                  onClick={() => setShowLogoutConfirm(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 z-[9999] bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl shadow-2xl w-72 p-4">
                  <h3 className="text-base font-bold text-foreground dark:text-white mb-2">{t("logout_confirm_title", "Đăng xuất?")}</h3>
                  <p className="text-sm text-muted-foreground dark:text-slate-400 mb-4">
                    {t("logout_confirm_message", "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 px-3 py-2 bg-secondary dark:bg-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary/80 dark:hover:bg-slate-700 transition-smooth font-medium text-sm"
                    >
                      {t("common_cancel", "Hủy")}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-smooth font-medium text-sm"
                    >
                      {t("nav_logout", "Đăng xuất")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 xl:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
