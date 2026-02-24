"use client"

import Link from "next/link"
import { ArrowLeft, Mail, Lock, Shield, Sparkles, GraduationCap } from "lucide-react"
import { ForgotPasswordForm } from "@/components/ui/forgot-password-form"
import { motion } from "framer-motion"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Hình nền phía sau */}
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40" style={{ backgroundImage: "url('/image/bg_forgot.jpg')" }} />
        {/* Lớp phủ xám đậm */}
        <div className="absolute inset-0 z-0 bg-gray-900 opacity-15 mix-blend-multiply pointer-events-none" />

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [360, 180, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Back Button */}
      <Link
        href="/login"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-lg hover:shadow-xl group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">Quay lại</span>
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
                <img src="/image/logo-ics.jpg" alt="ICS Cyber Security" className="h-20 sm:h-28 w-auto rounded-full shadow-lg" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full mb-4 font-semibold">
                <Lock size={16} />
                <span className="text-sm">Khôi Phục Mật Khẩu</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">Quên Mật Khẩu?</h1>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                Đừng lo lắng! Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu
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
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-3xl blur-xl opacity-20" />
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <Shield size={20} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                  Liên kết khôi phục được mã hóa và an toàn
                </span>
              </div>

              <ForgotPasswordForm />

              <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
                Nhớ mật khẩu?{" "}
                <Link href="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  Đăng nhập ngay
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
              <Mail size={20} className="text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Kiểm tra email</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Trong 5 phút</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Hỗ trợ 24/7</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Liên hệ admin</div>
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
            <Link href="/terms" className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link href="/privacy" className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Chính sách bảo mật
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}