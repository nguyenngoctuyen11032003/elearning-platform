"use client"

import type React from "react"
import { AdminSidebar } from "@/components/ui/admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background dark:bg-slate-950 animate-page-enter">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="p-4 md:p-6 lg:p-8 w-full min-h-screen pb-20 dashboard-shell stagger-scope stagger-admin stagger-items">{children}</div>
      </main>
    </div>
  )
}
