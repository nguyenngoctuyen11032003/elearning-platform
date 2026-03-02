"use client"

import type React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { StudentSidebar, SidebarProvider, MobileMenuToggle } from "@/components/ui/student-sidebar"
import { GraduationCap } from "lucide-react"

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <GraduationCap className="text-white" size={32} />
          </div>
          <p className="text-muted-foreground dark:text-slate-400">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8 max-w-md mx-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">Bạn cần đăng nhập</h2>
          <p className="text-muted-foreground dark:text-slate-400 mb-6">Đăng nhập để tiếp tục học tập</p>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      {/* Mobile toggle outside animated container */}
      <MobileMenuToggle />
      <div className="flex min-h-screen bg-background dark:bg-slate-950 animate-page-enter">
        <StudentSidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <div className="p-4 md:p-6 lg:p-8 w-full min-h-screen pb-20 dashboard-shell stagger-scope stagger-learning stagger-items">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
