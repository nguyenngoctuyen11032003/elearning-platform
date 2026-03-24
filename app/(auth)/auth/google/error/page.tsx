"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AlertCircle, Lock, Mail, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/i18n/language-context"

export default function GoogleErrorPage() {
  const { t } = useLanguage()
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{t("common_loading", "Loading...")}</div>}>
      <GoogleErrorContent />
    </Suspense>
  )
}

function GoogleErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()
  const code = searchParams.get("code")
  const message = searchParams.get("message")

  useEffect(() => {
    // Đảm bảo toast notification được hiển thị nếu cần
  }, [])

  const getErrorDisplay = () => {
    switch (code) {
      case "account_locked":
        return {
          title: t("google_err_locked_title", "Tài khoản đã bị khóa"),
          description: t("google_err_locked_desc", "Tài khoản của bạn hiện không thể sử dụng. Tài khoản đã bị vô hiệu hóa bởi quản trị viên."),
          icon: Lock,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-200 dark:border-red-800",
        }
      case "account_not_active":
        return {
          title: t("google_err_inactive_title", "Tài khoản chưa được kích hoạt"),
          description: t("google_err_inactive_desc", "Tài khoản của bạn chưa được kích hoạt. Vui lòng liên hệ với đội ngũ hỗ trợ."),
          icon: Mail,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
        }
      case "email_not_verified":
        return {
          title: t("google_err_unverified_title", "Email chưa được xác thực"),
          description: t("google_err_unverified_desc", "Vui lòng xác thực email của bạn trước khi đăng nhập."),
          icon: Mail,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-950/20",
          borderColor: "border-blue-200 dark:border-blue-800",
        }
      default:
        return {
          title: t("google_err_default_title", "Đăng nhập thất bại"),
          description: message || t("google_err_default_desc", "Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại."),
          icon: AlertCircle,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-200 dark:border-red-800",
        }
    }
  }

  const errorDisplay = getErrorDisplay()
  const IconComponent = errorDisplay.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Error Card */}
        <div className={`${errorDisplay.bgColor} ${errorDisplay.borderColor} border rounded-xl shadow-lg p-8 space-y-6`}>
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex justify-center"
          >
            <div className={`${errorDisplay.color} bg-white dark:bg-slate-900 rounded-full p-4`}>
              <IconComponent size={32} />
            </div>
          </motion.div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className={`text-2xl font-bold ${errorDisplay.color}`}>
              {errorDisplay.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {errorDisplay.description}
            </p>
          </div>

          {/* Message */}
          {message && message !== errorDisplay.description && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong>{t("google_err_detail", "Chi tiết")}:</strong> {decodeURIComponent(message)}
              </p>
            </div>
          )}

          {/* Support Info */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 space-y-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {t("google_err_need_help", "Cần giúp đỡ?")}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t("google_err_contact_support", "Vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi qua email hoặc nhắn tin.")}
            </p>
            <div className="flex gap-3 pt-2">
              <a
                href="mailto:support@icslearning.com"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                📧 support@icslearning.com
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 transition-all"
            >
              <ArrowRight size={18} />
              {t("google_err_back_login", "Quay lại trang đăng nhập")}
            </Button>

            <Button
              onClick={() => router.push("/")}
              className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg py-2.5 transition-all"
            >
              {t("common_home", "Trang chủ")}
            </Button>
          </div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400"
        >
          <p>
            {t("google_err_footer", "Nếu bạn tin đây là một lỗi, vui lòng")}{" "}
            <a href="mailto:support@icslearning.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              {t("google_err_contact_us", "liên hệ với chúng tôi")}
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
