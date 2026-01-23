"use client"

import Link from "next/link"
import { ArrowLeft, BookOpen, Users, Award, Sparkles, GraduationCap, Brain, Rocket } from "lucide-react"
import { AuthForm } from "@/components/ui/auth-form"
import { motion } from "framer-motion"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Hình nền phía sau */}
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/image/bg_login.png')" }} />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -50, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
      </div>

      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-lg hover:shadow-xl group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">Trang chủ</span>
      </Link>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center"
          >
            {/* Left Side - Brand & Visual */}
            <div className="hidden lg:block space-y-8">
              {/* Logo & Brand */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center mb-12"
              >
                <Link href="/" className="inline-flex justify-center mb-8">
                  <img src="/image/logo-ics.jpg" alt="ICS Cyber Security" className="h-28 w-auto rounded-full shadow-lg" />
                </Link>

                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-4"
                >
                  Chào Mừng Trở Lại!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed"
                >
                  Tiếp tục hành trình học tập của bạn cùng <span className="font-bold text-blue-600 dark:text-blue-400">15,000+ học viên</span> đang phát triển kỹ năng mỗi ngày.
                </motion.p>
              </motion.div>

              {/* Feature Cards */}
              <div className="space-y-4">
                {[
                  {
                    icon: Brain,
                    title: "Học Thông Minh",
                    description: "AI cá nhân hóa lộ trình học tập cho bạn",
                    color: "from-blue-500 to-cyan-500"
                  },
                  {
                    icon: Users,
                    title: "Cộng Đồng Sôi Động",
                    description: "Kết nối với hàng ngàn học viên khác",
                    color: "from-purple-500 to-pink-500"
                  },
                  {
                    icon: Award,
                    title: "Chứng Chỉ Uy Tín",
                    description: "Được công nhận bởi các doanh nghiệp",
                    color: "from-orange-500 to-red-500"
                  }
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg transition-all group"
                  >
                    <div className={`p-3 bg-gradient-to-br ${feature.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                      <feature.icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="grid grid-cols-3 gap-4 pt-4"
              >
                {[
                  { number: "15K+", label: "Học viên" },
                  { number: "500+", label: "Khóa học" },
                  { number: "4.9/5", label: "Đánh giá" }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stat.number}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right Side - Login Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-full"
            >
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8 sm:mb-10">
                <Link href="/" className="inline-flex justify-center">
                  <img src="/image/logo-ics.jpg" alt="ICS Cyber Security" className="h-24 w-auto rounded-full shadow-lg" />
                </Link>
              </div>

              {/* Login Card */}
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                
                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full mb-4 font-semibold"
                    >
                      <Sparkles size={16} />
                      <span className="text-sm">Đăng Nhập Tài Khoản</span>
                    </motion.div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-2">Đăng Nhập</h2>
                    <p className="text-slate-600 dark:text-slate-400">Tiếp tục hành trình học tập của bạn</p>
                  </div>

                  {/* Form */}
                  <AuthForm type="login" />

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-400 font-medium">Hoặc tiếp tục với</span>
                    </div>
                  </div>

                  {/* Social Login */}
                  <button className="w-full py-3 sm:py-3.5 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl font-semibold text-sm sm:text-base text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-center gap-3 group shadow-sm hover:shadow-md">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Đăng nhập với Google</span>
                  </button>

                  {/* Footer Links */}
                  <div className="mt-8 space-y-3 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Chưa có tài khoản?{" "}
                      <Link href="/signup" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        Đăng ký ngay
                      </Link>
                    </p>
                    <p className="text-sm">
                      <Link href="/forgot-password" className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Quên mật khẩu?
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6 leading-relaxed">
                Bằng cách đăng nhập, bạn đồng ý với{" "}
                <Link href="/terms" className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Điều khoản sử dụng
                </Link>{" "}
                và{" "}
                <Link href="/privacy" className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Chính sách bảo mật
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
