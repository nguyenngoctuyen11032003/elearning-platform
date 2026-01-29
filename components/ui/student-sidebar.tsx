"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Award,
  Heart,
  FileText,
  LogOut,
  Menu,
  X,
  User,
  GraduationCap,
  ChevronRight,
  TrendingUp,
  Calendar,
  CreditCard,
  Settings,
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
import { LogoDisplay } from "@/components/ui/logo-display"
import { UserAvatar } from "@/components/ui/user-avatar"

const menuItems = [
  { icon: LayoutDashboard, label: "Tổng quan", href: "/userdb" },
  { icon: BookOpen, label: "Khóa học của tôi", href: "/my-courses" },
  { icon: ClipboardList, label: "Bài thi", href: "/exams" },
  { icon: Award, label: "Chứng chỉ", href: "/certificates" },
  { icon: FileText, label: "Ghi chú", href: "/notes" },
  { icon: Heart, label: "Yêu thích", href: "/wishlist" },
  { icon: TrendingUp, label: "Tiến độ học tập", href: "/progress" },
  { icon: Calendar, label: "Lịch học", href: "/schedule" },
  { icon: CreditCard, label: "Thanh toán", href: "/payment-history" },
  { icon: Settings, label: "Cài đặt", href: "/settings" },
]

export function StudentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { config } = useSystemConfig()
  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} className="text-foreground dark:text-white" /> : <Menu size={20} className="text-foreground dark:text-white" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen z-40 bg-card dark:bg-slate-900/80 border-r border-border dark:border-slate-800 transition-all duration-300 lg:sticky lg:top-0 flex flex-col ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Toggle Collapse Button - Desktop Only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 bg-primary dark:bg-accent rounded-full items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50"
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          <ChevronRight size={14} className={`text-white transition-transform duration-300 ${
            isCollapsed ? "rotate-0" : "rotate-180"
          }`} />
        </button>

        {/* Logo Section - Fixed Header */}
        <div className="flex-shrink-0 px-4 py-5 border-b border-border/50 dark:border-slate-800/50">
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
              <h3 className="text-sm font-bold text-foreground dark:text-white">Student Portal</h3>
              <p className="text-xs text-muted-foreground dark:text-slate-400">ICS E-Learning</p>
            </div>
          )}
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40 scrollbar-track-transparent">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
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
              href="/profile"
              className="block bg-gradient-to-br from-secondary/40 to-secondary/20 dark:from-slate-800/40 dark:to-slate-800/20 rounded-xl p-3 border border-border/70 dark:border-slate-700/70 hover:border-primary/50 dark:hover:border-accent/50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <UserAvatar 
                  src={user.avatar}
                  name={user.name || 'Student'}
                  size="md"
                  className="group-hover:scale-105 transition-all shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground dark:text-white font-semibold text-sm truncate group-hover:text-primary dark:group-hover:text-accent transition-colors">
                    {user.name || 'Học viên'}
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
              href="/profile"
              className="flex justify-center"
              title={user.name || 'Học viên'}
            >
              <UserAvatar 
                src={user.avatar}
                name={user.name || 'Student'}
                size="md"
                className="hover:scale-105 transition-all shadow-md"
              />
            </Link>
          )}

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full flex items-center gap-3 py-2.5 text-muted-foreground dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all group border border-transparent hover:border-red-200 dark:hover:border-red-900/50 ${
              isCollapsed ? "justify-center px-2" : "px-3"
            }`}
            title={isCollapsed ? "Đăng xuất" : ""}
          >
            <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            {!isCollapsed && <span className="font-medium text-sm">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground dark:text-white">Xác nhận đăng xuất</h3>
              <p className="text-sm text-muted-foreground mt-2">Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-secondary dark:bg-slate-800 text-foreground dark:text-white rounded-xl font-medium hover:bg-secondary/80 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

