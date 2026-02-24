"use client"

import type React from "react"
import { TeacherSidebar } from "@/components/ui/teacher-sidebar"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background dark:bg-slate-950">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="p-4 md:p-6 lg:p-8 w-full min-h-screen pb-20 dashboard-shell">{children}</div>
      </main>
    </div>
  )
}
