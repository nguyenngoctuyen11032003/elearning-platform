"use client";

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, BookOpen, CreditCard, BarChart3, Settings, LogOut, User, FolderOpen, Award, FileText, ChevronRight, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { getRoleAvatar, getInitials } from "@/lib/utils/avatar"
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { config, loading } = useSystemConfig()

  useEffect(() => {
    if (isCollapsed) return

    const desktopQuery = window.matchMedia("(min-width: 1280px)")
    if (!desktopQuery.matches) return

    const mainContent = document.querySelector("main[data-dashboard-main='true']")
    if (!mainContent) return

    const collapseSidebar = () => setIsCollapsed(true)

    mainContent.addEventListener("pointerdown", collapseSidebar, { passive: true })
    mainContent.addEventListener("wheel", collapseSidebar, { passive: true })
    mainContent.addEventListener("touchstart", collapseSidebar, { passive: true })

    return () => {
      mainContent.removeEventListener("pointerdown", collapseSidebar)
      mainContent.removeEventListener("wheel", collapseSidebar)
      mainContent.removeEventListener("touchstart", collapseSidebar)
    }
  }, [isCollapsed])

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

  if (loading) {
    return null
  }
  const logoSrc = config?.site_logo || "/image/logo-ics.jpg"
  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }
  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen bg-card dark:bg-slate-900/80 border-r border-border dark:border-slate-800 transition-all duration-300 z-30 xl:sticky xl:top-0 flex flex-col ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } xl:translate-x-0`}
      >
        {/* Toggle Collapse Button - Desktop Only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden xl:flex absolute -right-3 top-8 w-6 h-6 bg-primary dark:bg-accent rounded-full items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50"
          title={isCollapsed ? t("sidebar_expand", "Mở rộng") : t("sidebar_collapse", "Thu gọn")}
        >
          <ChevronRight size={14} className={`text-white transition-transform duration-300 ${
            isCollapsed ? "rotate-0" : "rotate-180"
          }`} />
        </button>

        {/* Logo Section - Fixed Header */}
        <div className="flex-shrink-0 px-4 py-5 border-b border-border/50 dark:border-slate-800/50 mt-12 xl:mt-0">
          <Link href="/" className="flex items-center justify-center">
            <LogoDisplay 
              src={config?.site_logo}
              size={isCollapsed ? "md" : "lg"}
              variant="icon"
              showText={false}
            />
          </Link>
          {!isCollapsed && (
            <div className="mt-2 text-center">
              <h3 className="text-sm font-bold text-foreground dark:text-white">{t("admin_portal", "Admin Portal")}</h3>
              <p className="text-xs text-muted-foreground dark:text-slate-400">ICS E-Learning</p>
            </div>
          )}
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40 scrollbar-track-transparent">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? "bg-gradient-to-r from-primary/15 to-accent/10 dark:from-primary/20 dark:to-accent/15 text-primary dark:text-accent border-l-4 border-primary dark:border-accent shadow-sm"
                    : "text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-secondary/60 dark:hover:bg-slate-800/60 hover:border-l-4 hover:border-transparent hover:pl-3"
                }`}
                title={isCollapsed ? item.label : ""}
              >
                <item.icon size={18} className={isActive ? "" : "group-hover:scale-110 transition-transform"} />
                {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Fixed Footer - User Info & Logout */}
        <div className="flex-shrink-0 px-3 py-4 border-t border-border/50 dark:border-slate-800/50 space-y-2.5 bg-card/50 dark:bg-slate-900/50 backdrop-blur-sm">
          {/* User Info - Clickable to Profile */}
          {user && !isCollapsed && (
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

          {user && isCollapsed && (
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
                isCollapsed ? "justify-center px-2" : "px-3"
              }`}
              title={isCollapsed ? t("nav_logout", "Đăng xuất") : ""}
            >
              <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
              {!isCollapsed && <span className="font-medium text-sm">{t("nav_logout", "Đăng xuất")}</span>}
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
