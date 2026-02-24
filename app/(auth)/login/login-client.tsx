// app/(auth)/login/login-client.tsx
"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Users, Award, Sparkles, Brain } from "lucide-react"
import { AuthForm } from "@/components/ui/auth-form"
import { LogoDisplay } from "@/components/ui/logo-display"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
export default function LoginClient() {
  const searchParams = useSearchParams()
  const { config } = useSystemConfig()

  useEffect(() => {
    const error = searchParams.get("error")
    const message = searchParams.get("message")

    if (error && message) {
      const timer = setTimeout(() => {
        toast.error(decodeURIComponent(message), {
          duration: 5000,
          description: "Vui lòng kiểm tra lại thông tin đăng nhập",
        })

        window.history.replaceState({}, "", "/login")
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [searchParams])
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
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-full text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-lg hover:shadow-xl group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">Trang chủ</span>
      </Link>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 sm:px-6 py-8 sm:py-12">
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
                  <LogoDisplay 
                    src={config?.site_logo}
                    size="4xl"
                    variant="icon"
                    showText={false}
                  />
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
                    className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg transition-all group"
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
            </div>

            {/* Right Side - Login Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-full max-w-xl lg:max-w-none mx-auto"
            >
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8 sm:mb-10">
                <Link href="/" className="inline-flex justify-center">
                  <img src="/image/logo-ics.jpg" alt="ICS Cyber Security" className="h-20 sm:h-24 w-auto rounded-full shadow-lg" />
                </Link>
              </div>

              {/* Login Card */}
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                
                <div className="relative bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
                  {/* Header */}
                  <div className="text-center mb-6 sm:mb-8">
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
                      <span className="px-4 bg-white dark:bg-slate-900/95 text-sm text-slate-600 dark:text-slate-300 font-medium">Hoặc tiếp tục với</span>
                    </div>
                  </div>

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
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 leading-relaxed">
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
