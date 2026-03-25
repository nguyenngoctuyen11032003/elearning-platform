"use client"

import type React from "react"
import { AdminSidebar, SidebarProvider, MobileMenuToggle } from "@/components/ui/admin-sidebar"
import { DashboardShellLayout } from "@/components/ui/dashboard-shell-layout"
import { AdminRouteGuard } from "@/components/auth/admin-route-guard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRouteGuard>
      <DashboardShellLayout
        SidebarProvider={SidebarProvider}
        MobileMenuToggle={MobileMenuToggle}
        Sidebar={AdminSidebar}
        scopeClass="stagger-admin"
      >
        {children}
      </DashboardShellLayout>
    </AdminRouteGuard>
  )
}
