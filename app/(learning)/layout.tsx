"use client"

import type React from "react"
import { StudentSidebar, SidebarProvider, MobileMenuToggle } from "@/components/ui/student-sidebar"
import { DashboardShellLayout } from "@/components/ui/dashboard-shell-layout"
import { StudentRouteGuard } from "@/components/auth/student-route-guard"

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentRouteGuard>
      <DashboardShellLayout
        SidebarProvider={SidebarProvider}
        MobileMenuToggle={MobileMenuToggle}
        Sidebar={StudentSidebar}
        scopeClass="stagger-learning"
      >
        {children}
      </DashboardShellLayout>
    </StudentRouteGuard>
  )
}
