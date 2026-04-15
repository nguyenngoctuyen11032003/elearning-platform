"use client"

import { Footer } from "@/components/ui/footer"
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button"
import { BarChart3, Users, TrendingUp, Award, Zap, DollarSign, Sparkles, BookOpen, Video, Globe } from "lucide-react"
import { CarouselBenefits } from "./CarouselBenefits"
import Link from "next/link"
import { formatCurrencyByLanguage, formatNumber, formatStudentCount } from "@/lib/format"
import { useLanguage } from "@/lib/i18n/language-context"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { apiClient } from "@/lib/api/client"

const formatRevenueByLanguage = (value: number, language: "vi" | "en"): string => {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
  return formatCurrencyByLanguage(safeValue, language)
}

const getRevenueToneClass = (value: number): string => {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0

  if (safeValue >= 5000000) {
    return "text-emerald-600 dark:text-emerald-400"
  }

  if (safeValue >= 1000000) {
    return "text-amber-600 dark:text-amber-400"
  }

  return "text-slate-500 dark:text-slate-400"
}

const getNameBasedAvatar = (name: string): string => {
  const safeName = (name || "Teacher").trim() || "Teacher"
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=0D8ABC&color=fff&size=512`
}

const normalizeTeacherAvatar = (avatar: unknown, teacherName: string): string => {
  if (typeof avatar !== "string") return getNameBasedAvatar(teacherName)
  const normalized = avatar.trim()
  if (!normalized) return getNameBasedAvatar(teacherName)

  if (normalized.startsWith("/uploads/")) {
    return `/api${normalized}`
  }

  if (normalized.startsWith("/api/uploads/")) {
    return normalized
  }

  if (normalized.startsWith("/avatars/teacher.jpg")) {
    return "/avatars/teacher.avif"
  }

  if (normalized.startsWith("/")) {
    return normalized
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized
  }

  return getNameBasedAvatar(teacherName)
}


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}


export default function TeachersPage() {
  const gradientPalette = useMemo(
    () => [
      "from-blue-500 to-cyan-500",
      "from-purple-500 to-pink-500",
      "from-orange-500 to-red-500",
      "from-green-500 to-emerald-600",
      "from-indigo-500 to-purple-600",
      "from-teal-500 to-cyan-500",
      "from-fuchsia-500 to-rose-500",
      "from-sky-500 to-blue-600",
      "from-amber-500 to-orange-600",
    ],
    [],
  )

  const [teachers, setTeachers] = useState<any[]>([])
  const [teachersLoading, setTeachersLoading] = useState(true)
  const { t, language } = useLanguage()
  const VISIBLE_COUNT = 3
  const [page, setPage] = useState(0)
  const direction = 1
  const totalPages = Math.ceil(teachers.length / VISIBLE_COUNT)

  useEffect(() => {
    const loadTopTeachers = async () => {
      try {
        setTeachersLoading(true)
        const result = await apiClient.getTopTeachers(9)
        const normalized = Array.isArray(result)
          ? result.map((teacher: any, index: number) => ({
              ...teacher,
              image: normalizeTeacherAvatar(teacher?.avatar, teacher?.name || "Teacher"),
              gradient: gradientPalette[index % gradientPalette.length],
            }))
          : []
        setTeachers(normalized)
      } catch (error) {
        console.error("Error loading top teachers:", error)
        setTeachers([])
      } finally {
        setTeachersLoading(false)
      }
    }

    loadTopTeachers()
  }, [gradientPalette])

  useEffect(() => {
    if (page > 0 && page >= totalPages) {
      setPage(Math.max(0, totalPages - 1))
    }
  }, [page, totalPages])

  const visibleTeachers = teachers.slice(
    page * VISIBLE_COUNT,
    page * VISIBLE_COUNT + VISIBLE_COUNT
  )

  const handleNext = () => {
    if (page < totalPages - 1) {
      setPage(page + 1)
    }
  }

  const handlePrev = () => {
    if (page > 0) {
      setPage(page - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 stagger-items">

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/image/bg_tcher.png')",
          }}
        />

        {/* Overlay làm tối ảnh */}
        <div className="absolute inset-0 bg-black/50 dark:bg-black/60" />

        {/* Gradient hiệu ứng như cũ */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent_50%)]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center space-y-6 relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 dark:bg-accent/20 rounded-full text-accent font-medium text-sm mb-4"
          >
            <Sparkles size={16} />
            <span>{t("teachers_hero_badge", "Tham gia cộng đồng 200+ giảng viên")}</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            {t("teachers_hero_title1", "Trở thành")}{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t("teachers_hero_highlight", "Giảng viên")}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto">
            {t("teachers_hero_desc", "Chia sẻ kiến thức của bạn với hàng triệu học viên trên toàn thế giới và tạo thu nhập thụ động")}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Link
              href="/signup?role=teacher"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <span>{t("teachers_cta_start", "Bắt đầu dạy ngay")}</span>
              <Sparkles size={18} />
            </Link>

            <Link
              href="#benefits"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white text-white px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
            >
              <span>{t("teachers_learn_more", "Tìm hiểu thêm")}</span>
              <BookOpen size={18} />
            </Link>
          </motion.div>
        </motion.div>
      </section>


      {/* Stats Section */}
      <section className="py-12 px-4 md:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[ 
            { value: 50, prefix: "₫", suffix: "M+", desc: t("teachers_stat_income", "Thu nhập TB/năm"), icon: DollarSign, color: "from-green-500 to-emerald-500" },
            { value: 15000, suffix: "+", desc: t("teachers_stat_students", "Học viên TB/khóa"), icon: Users, color: "from-blue-500 to-cyan-500" },
            { value: 70, suffix: "%", desc: t("teachers_stat_commission", "Hoa hồng cho GV"), icon: TrendingUp, color: "from-purple-500 to-pink-500" },
            { label: "24/7", desc: t("teachers_stat_support", "Hỗ trợ tận tâm"), icon: Award, color: "from-orange-500 to-red-500" },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="group">
              <div className="relative p-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl hover:shadow-2xl transition-all duration-300 text-center overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <stat.icon className={`w-10 h-10 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mx-auto mb-2`} />
                <p className="text-3xl font-bold text-foreground dark:text-white mb-1">
                  {stat.value !== undefined ? (
                    <AnimatedNumber
                      value={stat.value}
                      formatter={(v) => formatNumber(v)}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  ) : (
                    stat.label
                  )}
                </p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{stat.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-start">
          {/* Title bên trái */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:w-1/3 w-full mb-8 md:mb-0"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-left text-foreground dark:text-white mb-4 mt-8">
              {t("teachers_benefits_title", "Lợi ích khi trở thành giảng viên")}
            </h2>
            <p className="text-xl text-muted-foreground dark:text-slate-300 max-w-md text-left mt-2">
              {t("teachers_benefits_desc", "Những ưu đãi độc quyền dành riêng cho giảng viên ICS Learning")}
            </p>
          </motion.div>

          {/* Card bên phải với thanh trượt */}
          <div className="md:w-2/3 w-full relative">
            {/* Carousel */}
            <CarouselBenefits />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto border border-slate-300 dark:border-slate-700 rounded-3xl p-8 md:p-12 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left Content */}
            <div className="space-y-8 ">
              <div>
                <h2 className="text-xl md:text-7xl font-bold text-slate-900 dark:text-white mb-4">
                  {t("teachers_how_title", "Cách bắt đầu")}
                </h2>
                <p className="text-2xl md:text-xl text-slate-700 dark:text-slate-300">
                  {t("teachers_how_desc", "Chỉ 4 bước đơn giản để trở thành giảng viên")}
                </p>
              </div>

              {/* Steps Grid - 2x2 */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { step: "1", title: t("teachers_step1_title", "Đăng ký miễn phí"), desc: t("teachers_step1_desc", "Tạo tài khoản giảng viên chỉ trong 2 phút"), icon: Users, gradient: "from-blue-500 to-cyan-500" },
                  { step: "2", title: t("teachers_step2_title", "Tạo nội dung"), desc: t("teachers_step2_desc", "Tải lên video, tài liệu và quiz với công cụ AI"), icon: Video, gradient: "from-purple-500 to-pink-500" },
                  { step: "3", title: t("teachers_step3_title", "Xuất bản khóa học"), desc: t("teachers_step3_desc", "Đưa khóa học của bạn ra toàn cầu"), icon: Globe, gradient: "from-orange-500 to-red-500" },
                  { step: "4", title: t("teachers_step4_title", "Bắt đầu kiếm tiền"), desc: t("teachers_step4_desc", "Nhận hoa hồng từ mỗi học viên đăng ký"), icon: DollarSign, gradient: "from-green-500 to-emerald-500" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group"
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg md:text-xl text-slate-900 dark:text-white mb-1">{item.title}</h3>
                        <p className="text-base md:text-l text-slate-700 dark:text-slate-300">{item.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/signup?role=teacher"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <span>{t("teachers_learn_more", "Tìm hiểu thêm")}</span>
                  <BookOpen size={18} />
                </Link>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-3">
                  {t("teachers_free_no_hidden", "Bắt đầu miễn phí • Không phí ẩn")}
                </p>
              </motion.div>
            </div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative hidden lg:block"
            >
              <div className="space-y-4">
                
                  <img 
                    src="/image/tcher2.jpeg" 
                    alt={t("teachers_ai_content_alt", "AI Content Creation")} 
                    className="w-full h-full object-cover"
                  />
                
                
                {/* Card 2 - Image with decoration */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="p-6 bg-white dark:bg-slate-800 rounded-2xl h-40 shadow-xl flex items-center justify-center border-2 border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-2">👨‍💼</div>
                      <p className="text-sm font-semibold text-foreground dark:text-white">{t("teachers_label_instructor", "Instructor")}</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="p-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl h-40 shadow-xl flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-2">✨</div>
                      <p className="text-sm font-semibold text-white">{t("teachers_label_features", "Features")}</p>
                    </div>
                  </motion.div>
                </div>

                {/* Card 3 - VR Headset */}
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                  className="p-6 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl h-32 shadow-xl flex items-center justify-center"
                >
                  <div className="text-5xl">🥽</div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <section className="py-20 px-4 md:px-8 relative">
        <div className="max-w-6xl mx-auto sticky top-24">

          {/* TITLE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-4">
              {t("teachers_success_title", "Giảng viên thành công")}
            </h2>
            <p className="text-xl text-muted-foreground dark:text-slate-300">
              {t("teachers_success_desc", "Những câu chuyện truyền cảm hứng từ cộng đồng giảng viên")}
            </p>
          </motion.div>

          {/* SLIDER WRAPPER */}
          <div className="relative overflow-hidden rounded-2xl">

            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ x: 120, opacity: 0 }}   
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -120, opacity: 0 }}     
                transition={{ duration: 0.45, ease: "easeInOut" }}
              >
                {/* STAGGER CONTAINER */}
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
                >
                  {teachersLoading
                    ? [...Array(VISIBLE_COUNT)].map((_, i) => (
                      <div
                        key={`teacher-skeleton-${i}`}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden animate-pulse"
                      >
                        <div className="h-56 bg-slate-200 dark:bg-slate-700" />
                        <div className="p-6 space-y-4">
                          <div className="h-6 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                          <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                          <div className="grid grid-cols-3 gap-2 border-y py-4">
                            <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
                            <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
                            <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
                          </div>
                          <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                        </div>
                      </div>
                    ))
                    : visibleTeachers.map((teacher, i) => (
                    <motion.div
                      key={teacher.id || i}
                      variants={cardVariants}
                      custom={direction}
                      className="bg-white dark:bg-slate-900 rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden"
                    >
                      {/* IMAGE */}
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={teacher.image}
                          alt={teacher.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getNameBasedAvatar(teacher.name || "Teacher")
                          }}
                        />
                        <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-sm font-semibold backdrop-blur">
                          <AnimatedNumber value={Number(teacher.rating || 0)} decimals={1} suffix=" ⭐" />
                        </div>
                      </div>

                      {/* CONTENT */}
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="text-xl font-bold">{teacher.name}</h3>
                          <p
                            className={`bg-gradient-to-r ${teacher.gradient} bg-clip-text text-transparent font-medium`}
                          >
                            {teacher.specialty}
                          </p>
                        </div>

                          <div className="grid grid-cols-3 text-center border-y py-4 text-sm">
                            <div>
                              <p className="font-bold">
                                <AnimatedNumber value={Number(teacher.students || 0)} formatter={formatStudentCount} />
                              </p>
                              <p className="text-muted-foreground">{t("teachers_card_students", "Học viên")}</p>
                            </div>
                            <div>
                              <p className="font-bold">
                                <AnimatedNumber value={Number(teacher.courses || 0)} formatter={formatNumber} />
                              </p>
                              <p className="text-muted-foreground">{t("teachers_card_courses", "Khóa học")}</p>
                            </div>
                            <div>
                              <p
                                className={`font-bold ${getRevenueToneClass(
                                  Number(teacher.revenue || 0),
                                )}`}
                              >
                                {formatRevenueByLanguage(Number(teacher.revenue || 0), language)}
                              </p>
                              <p className="text-muted-foreground">{t("teachers_card_lastyear", "Năm ngoái")}</p>
                            </div>
                          </div>

                        <Link
                          href={`/courses?teacherId=${teacher.id}`}
                          className={`block text-center bg-gradient-to-r ${teacher.gradient} text-white py-3 rounded-xl font-semibold hover:opacity-90 transition`}
                        >
                          {t("teachers_card_view", "Xem khóa học")}
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* CONTROLS */}
            <div className="flex justify-center items-center gap-6 mt-12">
              <button
                onClick={handlePrev}
                disabled={page === 0 || teachersLoading || totalPages === 0}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition
                  ${
                    page === 0 || teachersLoading || totalPages === 0
                      ? "bg-slate-300 dark:bg-slate-700 opacity-40 cursor-not-allowed"
                      : "bg-slate-200 dark:bg-slate-800 hover:scale-110"
                  }
                `}
              >
                ←
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages || 1 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i === page && !teachersLoading ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={teachersLoading || totalPages === 0 || page === totalPages - 1}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition
                  ${
                    teachersLoading || totalPages === 0 || page === totalPages - 1
                      ? "bg-slate-300 dark:bg-slate-700 opacity-40 cursor-not-allowed"
                      : "bg-slate-200 dark:bg-slate-800 hover:scale-110"
                  }
                `}
              >
                →
              </button>
            </div>

          </div>
        </div>
      </section>





      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-20" />
          <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-12 text-center text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">{t("teachers_cta_title", "Sẵn sàng chia sẻ kiến thức?")}</h2>
              <p className="text-lg md:text-xl mb-8 opacity-90">
                {t("teachers_cta_desc", "Tham gia cộng đồng giảng viên ICS Learning và bắt đầu kiếm thu nhập từ đam mê")}
              </p>
              <Link
                href="/signup?role=teacher"
                className="inline-flex items-center justify-center gap-2 bg-white text-purple-600 hover:bg-slate-100 px-8 py-4 rounded-full font-semibold transition-all hover:scale-105 shadow-xl"
              >
                <span>{t("teachers_cta_register", "Đăng ký giảng viên ngay")}</span>
                <Sparkles size={18} />
              </Link>
              <p className="text-sm mt-6 opacity-80">
                {t("teachers_cta_footer", "Miễn phí đăng ký • Không phí ẩn • Hoa hồng 70%")}
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  )
}
