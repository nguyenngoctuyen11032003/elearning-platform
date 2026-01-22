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
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { getRoleAvatar } from "@/lib/utils/avatar"

const menuItems = [
  { icon: LayoutDashboard, label: "Tổng quan", href: "/userdb", description: "Dashboard học tập" },
  { icon: BookOpen, label: "Khóa học của tôi", href: "/my-courses", description: "Các khóa đã đăng ký" },
  { icon: ClipboardList, label: "Bài thi", href: "/exams", description: "Thi thử & thi thật" },
  { icon: Award, label: "Chứng chỉ", href: "/certificates", description: "Chứng chỉ đạt được" },
  { icon: FileText, label: "Ghi chú", href: "/notes", description: "Ghi chú học tập" },
  { icon: Heart, label: "Yêu thích", href: "/wishlist", description: "Khóa học yêu thích" },
  { icon: TrendingUp, label: "Tiến độ học tập", href: "/progress", description: "Theo dõi tiến độ" },
  { icon: Calendar, label: "Lịch học", href: "/schedule", description: "Lịch trình học tập" },
  { icon: CreditCard, label: "Lịch sử thanh toán", href: "/payment-history", description: "Lịch sử mua khóa học" },
]

export function StudentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

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
        className={`fixed top-0 left-0 h-full z-40 bg-card dark:bg-slate-900/95 border-r border-border dark:border-slate-800 transition-all duration-300 w-72 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border dark:border-slate-800 flex justify-center">
            <Link href="/" className="flex items-center gap-3">
              <img src="/image/logo-ics.jpg" alt="ICS Cyber Security" className="h-16 w-auto rounded-full shadow-md" />
            </Link>
          </div>

          {/* Main Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Học tập
            </p>
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:bg-secondary dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-white"
                  }`}
                >
                  <item.icon size={20} className={isActive ? "text-white" : "group-hover:text-primary"} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{item.label}</span>
                    {!isActive && (
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    )}
                  </div>
                  {isActive && <ChevronRight size={16} />}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Menu */}
          <div className="p-4 border-t border-border dark:border-slate-800 space-y-2">
            {/* User Info - Clickable to Profile */}
            {user && (
              <Link
                href="/profile"
                className="block bg-secondary/30 dark:bg-slate-800/30 rounded-xl p-3 border border-border dark:border-slate-700 hover:bg-secondary/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group mb-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary dark:group-hover:ring-accent transition-all">
                    <img
                      src={getRoleAvatar(user.role)}
                      alt={`${user.name || 'Student'} Avatar`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        if (target.nextSibling) return
                        const span = document.createElement('span')
                        span.className = 'text-white font-bold text-sm'
                        span.textContent = user.name?.charAt(0).toUpperCase() || 'U'
                        target.parentNode?.appendChild(span)
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground dark:text-white font-medium text-sm truncate group-hover:text-primary dark:group-hover:text-accent transition-colors">
                      {user.name || 'Học viên'}
                    </p>
                    <p className="text-muted-foreground dark:text-slate-400 text-xs truncate">
                      {user.email}
                    </p>
                  </div>
                  <User size={16} className="text-muted-foreground dark:text-slate-400 group-hover:text-primary dark:group-hover:text-accent transition-colors" />
                </div>
              </Link>
            )}

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all w-full"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Đăng xuất</span>
            </button>
          </div>
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

