"use client"

import type React from "react"
import { TeacherSidebar, SidebarProvider, MobileMenuToggle } from "@/components/ui/teacher-sidebar"
import { DashboardShellLayout } from "@/components/ui/dashboard-shell-layout"
import { TeacherRouteGuard } from "@/components/auth/teacher-route-guard"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeacherRouteGuard>
      <DashboardShellLayout
        SidebarProvider={SidebarProvider}
        MobileMenuToggle={MobileMenuToggle}
        Sidebar={TeacherSidebar}
        scopeClass="stagger-teacher"
      >
        {children}
      </DashboardShellLayout>
    </TeacherRouteGuard>
  )
}
