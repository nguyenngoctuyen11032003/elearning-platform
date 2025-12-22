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
  Settings,
  LogOut,
  Menu,
  X,
  User,
  GraduationCap,
  ChevronRight,
  Bell
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { getRoleAvatar } from "@/lib/utils/avatar"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/userdb", description: "Tổng quan học tập" },
  { icon: BookOpen, label: "Khóa học của tôi", href: "/my-courses", description: "Các khóa đã đăng ký" },
  { icon: ClipboardList, label: "Bài thi", href: "/exams", description: "Thi thử & thi thật" },
  { icon: Award, label: "Chứng chỉ", href: "/certificates", description: "Chứng chỉ đạt được" },
  { icon: FileText, label: "Ghi chú", href: "/notes", description: "Ghi chú học tập" },
  { icon: Heart, label: "Yêu thích", href: "/wishlist", description: "Khóa học yêu thích" },
]

const bottomMenuItems = [
  { icon: User, label: "Hồ sơ", href: "/profile" },
  { icon: Settings, label: "Cài đặt", href: "/settings" },
]

export function StudentSidebar() {
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card dark:bg-slate-900 rounded-lg border border-border dark:border-slate-800 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
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
        className={`fixed top-0 left-0 h-full z-40 bg-card dark:bg-slate-900 border-r border-border dark:border-slate-800 transition-all duration-300 ${
          isOpen ? "w-72" : "w-0 lg:w-20"
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-border dark:border-slate-800">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <GraduationCap className="text-white" size={22} />
              </div>
              {isOpen && (
                <div>
                  <span className="font-bold text-foreground dark:text-white text-lg">ICS Learning</span>
                  <p className="text-xs text-muted-foreground">Học tập mọi nơi</p>
                </div>
              )}
            </Link>
          </div>

          {/* User Info */}
          {isOpen && user && (
            <div className="p-4 border-b border-border dark:border-slate-800">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-xl">
                <img
                  src={getRoleAvatar(user.role)}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground dark:text-white text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <button className="p-2 hover:bg-secondary dark:hover:bg-slate-700 rounded-lg transition-colors relative">
                  <Bell size={16} className="text-muted-foreground" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>
          )}

          {/* Main Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <p className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 ${!isOpen && "hidden"}`}>
              Học tập
            </p>
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:bg-secondary dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-white"
                  }`}
                >
                  <item.icon size={20} className={isActive ? "text-white" : "group-hover:text-primary"} />
                  {isOpen && (
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{item.label}</span>
                      {!isActive && (
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      )}
                    </div>
                  )}
                  {isOpen && isActive && <ChevronRight size={16} />}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Menu */}
          <div className="p-4 border-t border-border dark:border-slate-800 space-y-2">
            {bottomMenuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    isActive 
                      ? "bg-secondary dark:bg-slate-800 text-foreground dark:text-white" 
                      : "text-muted-foreground hover:bg-secondary dark:hover:bg-slate-800"
                  }`}
                >
                  <item.icon size={18} />
                  {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )
            })}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all w-full"
            >
              <LogOut size={18} />
              {isOpen && <span className="text-sm font-medium">Đăng xuất</span>}
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

