"use client"

import Link from "next/link"
import { Wrench, RefreshCw } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export function MaintenanceContent() {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
          <Wrench className="text-amber-300" size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("maintenance_title", "Hệ thống đang bảo trì")}</h1>
          <p className="text-slate-200 text-sm leading-relaxed">
            {t(
              "maintenance_message",
              "Chúng tôi đang nâng cấp để phục vụ bạn tốt hơn. Tạm thời tất cả tài khoản học viên và giảng viên bị vô hiệu hóa cho đến khi bảo trì kết thúc.",
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black font-semibold shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-colors"
          >
            <RefreshCw size={18} />
            {t("maintenance_retry", "Thử tải lại")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-white/20 text-white hover:border-white/40 transition-colors"
          >
            {t("maintenance_back_home", "Quay lại trang chủ")}
          </Link>
        </div>
        <p className="text-xs text-slate-400">
          {t(
            "maintenance_admin_hint",
            "Nếu bạn là quản trị viên, hãy đăng nhập để tắt chế độ bảo trì sau khi kiểm tra hoàn tất.",
          )}
        </p>
      </div>
    </main>
  )
}
