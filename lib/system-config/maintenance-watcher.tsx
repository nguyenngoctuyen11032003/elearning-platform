"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
import { useAuth } from "@/lib/auth/auth-context"
import { useLanguage } from "@/lib/i18n/language-context"

export function MaintenanceWatcher() {
  const { config, loading } = useSystemConfig()
  const { user, forceLogout } = useAuth()
  const { language } = useLanguage()
  const router = useRouter()
  const hasForcedLogout = useRef(false)
  const tr = (vi: string, en: string) => (language === "en" ? en : vi)

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
      message: tr("Hệ thống đang bảo trì. Bạn đã được đăng xuất.", "The system is under maintenance. You have been signed out."),
      toastType: "error",
      skipApi: true,
    })
  }, [config?.maintenanceMode, forceLogout, language, loading, user])

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
      toast.error(tr("Hệ thống đang bảo trì. Một số tính năng có thể tạm dừng.", "The system is under maintenance. Some features may be temporarily unavailable."))
      sessionStorage.setItem("maintenance_notice_shown", "1")
    }
  }, [config?.maintenanceMode, language, loading, user])

  return null
}
