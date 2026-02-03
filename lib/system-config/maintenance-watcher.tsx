"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
import { useAuth } from "@/lib/auth/auth-context"

export function MaintenanceWatcher() {
  const { config, loading } = useSystemConfig()
  const { user, forceLogout } = useAuth()
  const router = useRouter()
  const hasForcedLogout = useRef(false)

  useEffect(() => {
    if (loading) return

    if (!config?.maintenanceMode) {
      hasForcedLogout.current = false
      return
    }

    if (!user || user.role === "admin") return
    if (hasForcedLogout.current) return

    hasForcedLogout.current = true
    forceLogout({
      redirect: "/maintenance",
      message: "Hệ thống đang bảo trì. Bạn đã được đăng xuất.",
      toastType: "error",
      skipApi: true,
    })
  }, [config?.maintenanceMode, forceLogout, loading, user])

  useEffect(() => {
    if (loading) return
    if (!config?.maintenanceMode) return
    if (user) return

    // Người dùng chưa đăng nhập vẫn có thể truy cập trang đăng nhập để vào bằng tài khoản admin
    // nhưng nếu họ đang ở trang được bảo vệ, chuyển tới trang thông báo bảo trì để tránh nhầm lẫn.
    if (hasForcedLogout.current) return

    router.prefetch("/maintenance")
  }, [config?.maintenanceMode, loading, router, user])

  useEffect(() => {
    if (loading) return
    if (!config?.maintenanceMode) return
    if (user) return
    if (hasForcedLogout.current) return

    const warningShown = sessionStorage.getItem("maintenance_notice_shown")
    if (!warningShown) {
      toast.error("Hệ thống đang bảo trì. Một số tính năng có thể tạm dừng.")
      sessionStorage.setItem("maintenance_notice_shown", "1")
    }
  }, [config?.maintenanceMode, loading, user])

  return null
}
