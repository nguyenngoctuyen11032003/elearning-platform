"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { AuthForm } from "@/components/ui/auth-form"
import { LogoDisplay } from "@/components/ui/logo-display"
import { BookOpen, Users, ArrowLeft, Sparkles, GraduationCap, Award, Brain, Rocket, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useSystemConfig } from "@/lib/system-config/system-config-context"

export default function SignupPage() {
  const { config } = useSystemConfig()
  const searchParams = useSearchParams()
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "TEACHER">(
    (searchParams.get("role")?.toUpperCase() as "STUDENT" | "TEACHER") || "STUDENT"
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Hình nền phía sau */}
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/image/bg_login.png')" }} />

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -50, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-lg hover:shadow-xl group"
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
            {/* Left Side - Brand & Benefits */}
            <div className="hidden lg:block space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
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

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-4">
                  Tham Gia Cộng Đồng<br />Học Viên Hàng Đầu
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  Đăng ký miễn phí và bắt đầu học cùng <span className="font-bold text-purple-600 dark:text-purple-400">15,000+ học viên</span> khác ngay hôm nay
                </p>
              </motion.div>

              {/* Benefits */}
              <div className="space-y-4">
                {[
                  { icon: Rocket, title: "Bắt Đầu Miễn Phí", description: "Truy cập ngay các khóa học miễn phí" },
                  { icon: Award, title: "Chứng Chỉ Chính Thức", description: "Nhận chứng chỉ sau khi hoàn thành" },
                  { icon: Brain, title: "Học Theo Tốc Độ Bạn", description: "Linh hoạt thời gian và địa điểm học" }
                ].map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg transition-all group"
                  >
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                      <benefit.icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">{benefit.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-6 pt-4"
              >
                {[
                  { icon: CheckCircle, text: "Không cần thẻ" },
                  { icon: CheckCircle, text: "Miễn phí mãi mãi" },
                  { icon: CheckCircle, text: "Hủy bất kỳ lúc nào" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <item.icon size={16} className="text-green-600 dark:text-green-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right Side - Signup Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-full space-y-6"
            >
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8 sm:mb-10">
                <Link href="/" className="inline-flex justify-center">
                  <LogoDisplay 
                    src={config?.site_logo}
                    size="2xl"
                    variant="icon"
                    showText={false}
                  />
                </Link>
              </div>

              {/* Header */}
              <div className="text-center lg:text-left">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full mb-4 font-semibold"
                >
                  <Sparkles size={16} />
                  <span className="text-sm">Tạo Tài Khoản Mới</span>
                </motion.div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-2">Đăng Ký</h2>
                <p className="text-slate-600 dark:text-slate-400">Tham gia cộng đồng học tập ICS Learning</p>
              </div>

              {/* Role Selection */}
              {!searchParams.get("role") && (
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-3xl blur-xl opacity-20" />
                  <div className="relative bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <h3 className="text-lg font-bold mb-4 text-center text-slate-900 dark:text-white">Chọn vai trò của bạn</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSelectedRole("STUDENT")}
                        className={`group relative p-6 rounded-2xl border-2 transition-all ${
                          selectedRole === "STUDENT"
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-lg"
                            : "border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700"
                        }`}
                      >
                        <BookOpen className={`w-10 h-10 mx-auto mb-3 ${selectedRole === "STUDENT" ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`} />
                        <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Học viên</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">Tham gia các khóa học</div>
                      </button>

                      <button
                        onClick={() => setSelectedRole("TEACHER")}
                        className={`group relative p-6 rounded-2xl border-2 transition-all ${
                          selectedRole === "TEACHER"
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-lg"
                            : "border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700"
                        }`}
                      >
                        <Users className={`w-10 h-10 mx-auto mb-3 ${selectedRole === "TEACHER" ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`} />
                        <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Giảng viên</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">Tạo và quản lý khóa học</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Container */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-3xl blur-xl opacity-20" />
                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
                  <AuthForm 
                    type="signup" 
                    role={selectedRole.toLowerCase() as "student" | "teacher"} 
                  />

                  <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
                      Đăng nhập ngay
                    </Link>
                  </p>
                </div>
              </div>

              {/* Terms */}
              <p className="text-center text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <Link href="/terms" className="font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Điều khoản sử dụng
                </Link>{" "}
                và{" "}
                <Link href="/privacy" className="font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
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
