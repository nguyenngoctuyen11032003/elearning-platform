"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, BookOpen, Users, DollarSign, Settings, LogOut, Menu, X, User, Star, BarChart3, FileText, Award } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { getRoleAvatar, getInitials } from "@/lib/utils/avatar"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/teacher/dashboard" },
  { icon: BookOpen, label: "Khóa học", href: "/teacher/courses" },
  { icon: FileText, label: "Bài thi", href: "/teacher/exams" },
  { icon: Award, label: "Chứng chỉ", href: "/teacher/certificates" },
  { icon: Users, label: "Học viên", href: "/teacher/students" },
  { icon: Star, label: "Đánh giá", href: "/teacher/reviews" },
  { icon: BarChart3, label: "Thống kê", href: "/teacher/analytics" },
  { icon: DollarSign, label: "Doanh thu", href: "/teacher/earnings" },
  { icon: Settings, label: "Cài đặt", href: "/teacher/settings" },
]

export function TeacherSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 md:hidden p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-card dark:bg-slate-900/80 border-r border-border dark:border-slate-800 p-6 transition-transform duration-300 z-30 md:sticky md:top-0 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Link href="/teacher/dashboard" className="flex items-center gap-2 mb-8 mt-12 md:mt-0">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IC</span>
          </div>
          <span className="font-bold text-foreground dark:text-white">ICS Teacher</span>
        </Link>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                  isActive
                    ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent border-l-2 border-primary dark:border-accent"
                    : "text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-secondary dark:hover:bg-slate-800"
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 space-y-4">
          {/* User Info - Clickable to Profile */}
          {user && (
            <Link
              href="/teacher/profile"
              className="block bg-secondary/30 dark:bg-slate-800/30 rounded-lg p-3 border border-border dark:border-slate-700 hover:bg-secondary/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary dark:group-hover:ring-accent transition-all">
                  <img
                    src={getRoleAvatar(user.role)}
                    alt={`${user.name || 'Teacher'} Avatar`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if role avatar fails to load
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      if (target.nextSibling) return
                      const span = document.createElement('span')
                      span.className = 'text-white font-bold text-sm'
                      span.textContent = getInitials(user.name)
                      target.parentNode?.appendChild(span)
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground dark:text-white font-medium text-sm truncate group-hover:text-primary dark:group-hover:text-accent transition-colors">
                    {user.name || 'Giảng viên'}
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
            className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
          >
            <LogOut size={20} />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

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

      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
