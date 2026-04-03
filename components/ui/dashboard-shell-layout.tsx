"use client"

import type { ReactNode } from "react"

interface DashboardShellLayoutProps {
  children: ReactNode
  SidebarProvider: React.ComponentType<{ children: ReactNode }>
  MobileMenuToggle: React.ComponentType
  Sidebar: React.ComponentType
  scopeClass: string
}

export function DashboardShellLayout({
  children,
  SidebarProvider,
  MobileMenuToggle,
  Sidebar,
  scopeClass,
}: DashboardShellLayoutProps) {
  return (
    <SidebarProvider>
      <MobileMenuToggle />
      <div className="flex min-h-screen bg-background dark:bg-slate-950 animate-page-enter">
        <Sidebar />
        <main data-dashboard-main="true" className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <div className={`p-4 md:p-6 lg:p-8 w-full min-h-screen pb-20 dashboard-shell stagger-scope stagger-items ${scopeClass}`}>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
