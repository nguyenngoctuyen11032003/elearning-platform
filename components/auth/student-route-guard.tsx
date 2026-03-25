"use client"

import { ReactNode, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ShieldAlert, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { useLanguage } from "@/lib/i18n/language-context"

interface StudentRouteGuardProps {
  children: ReactNode
}

export function StudentRouteGuard({ children }: StudentRouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, isAuthenticated } = useAuth()
  const { t } = useLanguage()

  const isStudent = user?.role === "student"
  const unauthorized = !loading && (!isAuthenticated || !isStudent)

  useEffect(() => {
    if (!unauthorized) return

    const next = encodeURIComponent(pathname || "/userdb")
    router.replace(`/login?next=${next}`)
  }, [unauthorized, pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mx-auto mb-3" size={34} />
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            {t("common_loading", "Đang tải...")}
          </p>
        </div>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950 p-4">
        <div className="max-w-md w-full rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900/60 p-6 text-center">
          <ShieldAlert className="mx-auto mb-3 text-amber-500" size={34} />
          <h2 className="text-xl font-bold text-foreground dark:text-white mb-2">
            {t("auth_login_required", "Bạn cần đăng nhập")}
          </h2>
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            {t("student_auth_required", "Phiên đăng nhập không hợp lệ. Đang chuyển đến trang đăng nhập...")}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
