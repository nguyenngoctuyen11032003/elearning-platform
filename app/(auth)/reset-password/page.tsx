"use client"

import Link from "next/link"
import { ArrowLeft, Key, Shield, CheckCircle, Sparkles, GraduationCap } from "lucide-react"
import { ResetPasswordForm } from "@/components/ui/reset-password-form"
import { motion } from "framer-motion"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
import { LogoDisplay } from "@/components/ui/logo-display"
import { useLanguage } from "@/lib/i18n/language-context"
export default function ResetPasswordPage() {
    const { config } = useSystemConfig()
    const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 100, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -100, 0]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-br from-green-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Back Button */}
      <Link
        href="/login"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-full text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-lg hover:shadow-xl group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">{t("common_back", "Quay lại")}</span>
      </Link>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="text-center mb-10"
            >
              <Link href="/" className="inline-flex justify-center">
                <LogoDisplay 
                  src={config?.site_logo}
                  size="2xl"
                  variant="icon"
                  showText={false}
                />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full mb-4 font-semibold">
                <Key size={16} />
                <span className="text-sm">{t("auth_create_new_password", "Tạo Mật Khẩu Mới")}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">{t("auth_reset_password", "Đặt Lại Mật Khẩu")}</h1>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                {t("auth_reset_desc", "Tạo mật khẩu mới an toàn và dễ nhớ cho tài khoản của bạn")}
              </p>
            </motion.div>
          </div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 rounded-3xl blur-xl opacity-20" />
            <div className="relative bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
              {/* Security Info */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <Shield size={20} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                    {t("auth_aes_encryption", "Mật khẩu được mã hóa với chuẩn AES-256")}
                  </span>
                </div>
                
                {/* Password Requirements */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    t("auth_req_min_chars", "Tối thiểu 8 ký tự"),
                    t("auth_req_case", "Có chữ hoa & thường"),
                    t("auth_req_number", "Có ít nhất 1 số"),
                    t("auth_req_special", "Có ký tự đặc biệt")
                  ].map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              <ResetPasswordForm />

              <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
                {t("auth_remember_password", "Nhớ mật khẩu?")}{" "}
                <Link href="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                  {t("auth_login_now", "Đăng nhập ngay")}
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 grid grid-cols-2 gap-4"
          >
            <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Shield size={20} className="text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{t("auth_high_security", "Bảo mật cao")}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{t("auth_256bit", "Mã hóa 256-bit")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{t("auth_support_247", "Hỗ trợ 24/7")}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{t("auth_contact_admin", "Liên hệ admin")}</div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6 leading-relaxed"
          >
            Bằng cách sử dụng dịch vụ, bạn đồng ý với{" "}
            <Link href="/terms" className="font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t("auth_terms", "Điều khoản sử dụng")}
            </Link>{" "}
            {t("common_and", "và")}{" "}
            <Link href="/privacy" className="font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {t("auth_privacy", "Chính sách bảo mật")}
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
