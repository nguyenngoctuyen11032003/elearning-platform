"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, ArrowLeft, Mail, RefreshCw, Sparkles, Shield, GraduationCap } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
import { LogoDisplay } from "@/components/ui/logo-display"
import { useLanguage } from "@/lib/i18n/language-context"

type VerificationStatus = "loading" | "success" | "error" | "invalid"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<VerificationStatus>("loading")
  const [message, setMessage] = useState("")
  const [isRetrying, setIsRetrying] = useState(false)
  const { config } = useSystemConfig()
  const { t } = useLanguage()
  const token = searchParams.get("token")

  const verifyEmail = async (verificationToken: string) => {
    try {
      setStatus("loading")
      const response = await apiClient.verifyEmail(verificationToken)
      setStatus("success")
      setMessage(response.message || t("verify_success_msg", "Email đã được xác nhận thành công!"))
    } catch (error: any) {
      setStatus("error")
      setMessage(
        error?.message || 
        t("verify_error_msg", "Xác nhận email thất bại. Token có thể đã hết hạn hoặc không hợp lệ.")
      )
    }
  }

  useEffect(() => {
    if (!token) {
      setStatus("invalid")
      setMessage(t("verify_invalid_token", "Token xác nhận không hợp lệ hoặc không được tìm thấy."))
      return
    }

    verifyEmail(token)
  }, [token])

  const handleRetry = async () => {
    if (!token) return
    setIsRetrying(true)
    await verifyEmail(token)
    setIsRetrying(false)
  }

  const redirectToLogin = () => {
    router.push("/login")
  }

  const getIcon = () => {
    switch (status) {
      case "loading":
        return (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse" />
            <RefreshCw size={80} className="relative text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        )
      case "success":
        return (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-xl opacity-50" />
            <CheckCircle size={80} className="relative text-green-600 dark:text-green-400" />
          </div>
        )
      case "error":
      case "invalid":
        return (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 rounded-full blur-xl opacity-50" />
            <XCircle size={80} className="relative text-red-600 dark:text-red-400" />
          </div>
        )
    }
  }

  const getTitle = () => {
    switch (status) {
      case "loading":
        return t("verify_loading", "Đang Xác Nhận Email...")
      case "success":
        return t("verify_success", "Xác Nhận Thành Công!")
      case "error":
        return t("verify_error", "Xác Nhận Thất Bại")
      case "invalid":
        return t("verify_invalid", "Token Không Hợp Lệ")
    }
  }

  const getActionButtons = () => {
    if (status === "success") {
      return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={redirectToLogin}
            className="relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-2xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative flex items-center gap-2 justify-center">
              <GraduationCap size={20} />
              {t("auth_login_now", "Đăng nhập ngay")}
            </span>
          </motion.button>
          <Link
            href="/"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-semibold transition-all text-center"
          >
            {t("verify_go_home", "Về trang chủ")}
          </Link>
        </div>
      )
    }

    if (status === "error") {
      return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 justify-center"
          >
            {isRetrying ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <RefreshCw size={20} />
            )}
            {isRetrying ? t("verify_retrying", "Đang thử lại...") : t("verify_retry", "Thử lại")}
          </button>
          <Link
            href="/login"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-semibold transition-all text-center"
          >
            {t("nav_login", "Đăng nhập")}
          </Link>
        </div>
      )
    }

    return (
      <div className="flex justify-center">
        <Link
          href="/signup"
          className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl"
        >
          {t("verify_signup_again", "Đăng ký lại")}
        </Link>
      </div>
    )
  }

  const getBackgroundGradient = () => {
    switch (status) {
      case "loading":
        return "from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      case "success":
        return "from-slate-50 via-green-50/30 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      default:
        return "from-slate-50 via-red-50/30 to-orange-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} relative overflow-hidden`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 360]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-10 right-10 w-96 h-96 ${
            status === "success" 
              ? "bg-gradient-to-br from-green-400/20 to-emerald-400/20" 
              : status === "error" || status === "invalid"
              ? "bg-gradient-to-br from-red-400/20 to-orange-400/20"
              : "bg-gradient-to-br from-blue-400/20 to-purple-400/20"
          } rounded-full blur-3xl`}
        />
      </div>

      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-full text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">{t("common_back", "Quay lại")}</span>
      </Link>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {/* Logo */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex justify-center">
              <LogoDisplay 
                src={config?.site_logo}
                size="2xl"
                variant="icon"
                showText={false}
              />
            </Link>
          </div>

          {/* Main Card */}
          <div className="relative">
            <div className={`absolute -inset-1 bg-gradient-to-r ${
              status === "success" 
                ? "from-green-600 via-emerald-600 to-teal-600" 
                : status === "error" || status === "invalid"
                ? "from-red-600 via-orange-600 to-pink-600"
                : "from-blue-600 via-purple-600 to-pink-600"
            } rounded-3xl blur-xl opacity-20`} />
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center space-y-4 sm:space-y-6 shadow-2xl"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="flex justify-center"
              >
                {getIcon()}
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">
                  {getTitle()}
                </h1>
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  {message}
                </p>
              </motion.div>

              {/* Success Additional Info */}
              {status === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 justify-center text-green-800 dark:text-green-200">
                    <Mail size={24} />
                    <span className="font-black text-lg">{t("verify_email_activated", "Email Đã Được Kích Hoạt")}</span>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-3">
                    <p className="font-semibold">{t("verify_account_ready", "Tài khoản của bạn đã sẵn sàng!")} 🎉</p>
                    <ul className="space-y-2 text-left">
                      {[
                        t("verify_can_login", "Đăng nhập vào hệ thống"),
                        t("verify_explore_courses", "Khám phá 1000+ khóa học"),
                        t("verify_start_learning", "Bắt đầu hành trình học tập"),
                        t("verify_get_cert", "Nhận chứng chỉ sau khi hoàn thành")
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Error Additional Info */}
              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6"
                >
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <p className="font-bold text-base mb-3">{t("verify_possible_causes", "Các nguyên nhân có thể:")}</p>
                    <ul className="space-y-2 text-left">
                      {[
                        t("verify_token_expired", "Token đã hết hạn (sau 24 giờ)"),
                        t("verify_token_used", "Token đã được sử dụng trước đó"),
                        t("verify_link_broken", "Link xác nhận bị lỗi hoặc sai"),
                        t("verify_already_verified", "Email đã được xác nhận rồi")
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <XCircle size={16} className="text-red-600 dark:text-red-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="pt-4"
              >
                {getActionButtons()}
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom Info Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 grid grid-cols-2 gap-4"
          >
            <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Shield size={20} className="text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{t("auth_security", "Bảo mật")}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{t("auth_256bit", "Mã hóa 256-bit")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{t("auth_support_247", "Hỗ trợ 24/7")}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <Link href="/contact" className="hover:underline">Liên hệ</Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse" />
            <RefreshCw className="relative w-16 h-16 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Đang tải...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}