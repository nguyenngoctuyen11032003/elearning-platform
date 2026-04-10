"use client"

import { CourseCard } from "@/components/ui/course-card"
import { 
  ArrowRight, Play, Users, BookOpen, Star, Sparkles,
  Target, Shield, Clock, CheckCircle, Globe, Lightbulb, Trophy, HeartHandshake,
  GraduationCap, Brain, Rocket, BarChart3, MessageSquare
} from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/ui/footer"
import { useEffect, useState, useRef } from "react"
import { apiClient } from "@/lib/api/client"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/i18n/language-context"
import { autoTranslateData } from "@/lib/i18n/dynamic-translate"
import { AnimatedNumber } from "@/components/ui/rolling-number"

type HomeTestimonial = {
  id: string
  rating: number
  comment: string
  student?: {
    id: string
    name: string
    avatar?: string | null
  }
  course?: {
    id: string
    title: string
  }
}

type HomeTestimonialCachePayload = {
  expiresAt: number
  data: HomeTestimonial[]
}

const TESTIMONIALS_CACHE_KEY = "home:testimonials:latest-5-star:v1"
const TESTIMONIALS_CACHE_TTL_MS = 90 * 1000

const isValidAvatarUrl = (avatar?: string | null): boolean => {
  const normalized = avatar?.trim()
  if (!normalized) return false
  if (normalized.startsWith("/")) return true

  try {
    const parsed = new URL(normalized)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

const normalizeCourseImage = (image?: string | null): string => {
  const normalized = image?.trim()
  if (!normalized) return "/placeholder.svg"
  if (normalized.startsWith("/")) return normalized

  const uploadsMatch = normalized.match(/https?:\/\/[^/]+\/uploads\/(.+)$/i)
  if (uploadsMatch?.[1]) return `/api/uploads/${uploadsMatch[1]}`

  const apiUploadsMatch = normalized.match(/https?:\/\/[^/]+\/api\/uploads\/(.+)$/i)
  if (apiUploadsMatch?.[1]) return `/api/uploads/${apiUploadsMatch[1]}`

  return normalized
}

const readTestimonialsCache = (): HomeTestimonial[] | null => {
  if (typeof window === "undefined") return null

  try {
    const raw = sessionStorage.getItem(TESTIMONIALS_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as HomeTestimonialCachePayload
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.expiresAt !== "number") {
      sessionStorage.removeItem(TESTIMONIALS_CACHE_KEY)
      return null
    }

    if (Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(TESTIMONIALS_CACHE_KEY)
      return null
    }

    return parsed.data
  } catch {
    return null
  }
}

const writeTestimonialsCache = (data: HomeTestimonial[]): void => {
  if (typeof window === "undefined") return

  const payload: HomeTestimonialCachePayload = {
    expiresAt: Date.now() + TESTIMONIALS_CACHE_TTL_MS,
    data,
  }

  try {
    sessionStorage.setItem(TESTIMONIALS_CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage quota errors.
  }
}

const partners = [
  { name: "Microsoft", logo: "🏢" },
  { name: "Google", logo: "🔍" },
  { name: "Amazon", logo: "📦" },
  { name: "Meta", logo: "👥" },
  { name: "Apple", logo: "🍎" },
]



export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [testimonials, setTestimonials] = useState<HomeTestimonial[]>([])
  const [testimonialsLoading, setTestimonialsLoading] = useState(true)
  const [invalidAvatarByReviewId, setInvalidAvatarByReviewId] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [categoriesPage, setCategoriesPage] = useState(0)
  const { language, t } = useLanguage()

  const CATEGORIES_PER_PAGE = 10
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setTestimonialsLoading(true)

        const cachedTestimonials = readTestimonialsCache()
        const testimonialsPromise = cachedTestimonials
          ? Promise.resolve(cachedTestimonials)
          : apiClient.getLatestFiveStarReviews(3)

        const [featuredCoursesRes, categoriesRes, latestFiveStarReviews] = await Promise.all([
          apiClient.getFeaturedCourses(),
          apiClient.getCategories(),
          testimonialsPromise,
        ])

        const normalizedFeaturedCourses = Array.isArray(featuredCoursesRes)
          ? featuredCoursesRes.map((course: any) => ({
              ...course,
              price: parseFloat(course?.price ?? "0") || 0,
              rating: parseFloat(course?.rating ?? "0") || 0,
              image: normalizeCourseImage(course?.thumbnail || course?.image),
            }))
          : []

        const localizedCourses = await autoTranslateData(normalizedFeaturedCourses, language)
        setFeaturedCourses(localizedCourses.slice(0, 5))

        const localizedCategories = await autoTranslateData(Array.isArray(categoriesRes) ? categoriesRes : [], language)
        setCategories(localizedCategories)

        const finalTestimonials = Array.isArray(latestFiveStarReviews) ? latestFiveStarReviews : []
        setTestimonials(finalTestimonials)
        writeTestimonialsCache(finalTestimonials)
        setTestimonialsLoading(false)
        setInvalidAvatarByReviewId({})
        setCategoriesPage(0)
      } catch (error) {
        console.error("Error fetching data:", error)
        setFeaturedCourses([])
        setCategories([])
        setTestimonials([])
        setTestimonialsLoading(false)
        setInvalidAvatarByReviewId({})
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [language])

  const FEATURES_VISIBLE = 4
  const [featurePage, setFeaturePage] = useState(0)
  const scrollPositionRef = useRef<number>(0)

  const handleCategoryPageChange = (newPage: number) => {
    scrollPositionRef.current = window.scrollY
    setCategoriesPage(newPage)
  }

  useEffect(() => {
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current)
      scrollPositionRef.current = 0
    }
  }, [categoriesPage])

  const markAvatarAsInvalid = (reviewId: string) => {
    setInvalidAvatarByReviewId((prev) => {
      if (prev[reviewId]) return prev
      return { ...prev, [reviewId]: true }
    })
  }

  const features = [
    {
      icon: Shield,
      title: t("home_feat_quality_title", "Chất Lượng Đảm Bảo"),
      description: t("home_feat_quality_desc", "100% khóa học được kiểm duyệt bởi chuyên gia. Hoàn tiền nếu không hài lòng."),
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30"
    },
    {
      icon: Clock,
      title: t("home_feat_anytime_title", "Học Mọi Lúc, Mọi Nơi"),
      description: t("home_feat_anytime_desc", "Truy cập trọn đời, học theo tốc độ riêng. Hỗ trợ offline trên mobile."),
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30"
    },
    {
      icon: Users,
      title: t("home_feat_community_title", "Cộng Đồng 15K+"),
      description: t("home_feat_community_desc", "Kết nối, thảo luận và học hỏi cùng cộng đồng học viên năng động."),
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/30"
    },
    {
      icon: Trophy,
      title: t("home_feat_cert_title", "Chứng Chỉ Uy Tín"),
      description: t("home_feat_cert_desc", "Nhận chứng chỉ được công nhận bởi doanh nghiệp sau khi hoàn thành."),
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/30"
    },
    {
      icon: Lightbulb,
      title: t("home_feat_practical_title", "Nội Dung Thực Tế"),
      description: t("home_feat_practical_desc", "Học từ dự án thực tế, bài tập case study từ doanh nghiệp hàng đầu."),
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30"
    },
    {
      icon: HeartHandshake,
      title: t("home_feat_support_title", "Hỗ Trợ 24/7"),
      description: t("home_feat_support_desc", "Đội ngũ support luôn sẵn sàng giải đáp mọi thắc mắc của bạn."),
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-50 dark:bg-pink-950/30"
    },
    {
      icon: Brain,
      title: t("home_feat_ai_title", "AI Tutor Thông Minh"),
      description: t("home_feat_ai_desc", "Trợ lý AI cá nhân hóa giúp bạn học hiệu quả hơn."),
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/30"
    },
    {
      icon: BarChart3,
      title: t("home_feat_progress_title", "Theo Dõi Tiến Độ"),
      description: t("home_feat_progress_desc", "Dashboard chi tiết giúp bạn theo dõi quá trình học."),
      color: "from-teal-500 to-cyan-500",
      bgColor: "bg-teal-50 dark:bg-teal-950/30"
    }
  ]

  const featureTotalPages = Math.ceil(features.length / FEATURES_VISIBLE)

  const visibleFeatures = features.slice(
    featurePage * FEATURES_VISIBLE,
    featurePage * FEATURES_VISIBLE + FEATURES_VISIBLE
  )

  
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_40%,#f1f5ff_70%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#0b1220_0%,#0f172a_45%,#111827_72%,#0f172a_100%)] stagger-items">
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="absolute -top-20 left-[-12%] h-[560px] w-[560px] rounded-full bg-[#eaf3ff] blur-[105px]" />
        <div className="absolute top-[8%] right-[-10%] h-[540px] w-[540px] rounded-full bg-[#f3e8ff] blur-[110px]" />
        <div className="absolute top-[32%] left-[22%] h-[460px] w-[640px] rounded-full bg-[#e6f7ff] blur-[130px]" />
        <div className="absolute top-[60%] right-[8%] h-[420px] w-[620px] rounded-full bg-[#eaf3ff] blur-[120px]" />
        <div className="absolute bottom-[4%] left-[8%] h-[420px] w-[520px] rounded-full bg-[#f3e8ff] blur-[110px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.58] [background:radial-gradient(110%_82%_at_10%_12%,rgba(147,197,253,0.42)_0%,rgba(147,197,253,0)_58%),radial-gradient(95%_80%_at_86%_18%,rgba(196,181,253,0.4)_0%,rgba(196,181,253,0)_62%),radial-gradient(80%_88%_at_48%_66%,rgba(103,232,249,0.3)_0%,rgba(103,232,249,0)_64%),radial-gradient(95%_90%_at_24%_88%,rgba(125,211,252,0.22)_0%,rgba(125,211,252,0)_62%)]" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22 viewBox=%220 0 160 160%22%3E%3Cfilter id=%22n%22 x=%220%22 y=%220%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%221.05%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22160%22 height=%22160%22 filter=%22url(%23n)%22 opacity=%220.9%22/%3E%3C/svg%3E')",
        }}
      />
      {/* Hero Section - Premium Education Platform */}
      <section className="relative pt-24 sm:pt-28 md:pt-32 pb-20 sm:pb-24 md:pb-28 px-4 sm:px-6 md:px-8 overflow-hidden bg-transparent">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_28%_16%,rgba(59,130,246,0.14),transparent_58%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_72%_56%,rgba(168,85,247,0.12),transparent_60%)]" />
          <div className="absolute inset-0 opacity-[0.3] bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        </div>

        {/* Floating Orbs */}
        <motion.div 
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-[10%] w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        />

        <div className="page-shell relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Trust Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex max-w-full items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-full shadow-lg backdrop-blur-sm"
              >
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-bold">1K</div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-bold">+</div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{t("home_hero_students", "15,000+ Học viên thành công")}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{t("home_hero_rating", "Đánh giá 4.9/5 ⭐")}</p>
                </div>
              </motion.div>

              {/* Main Headline - SEO Optimized */}
              <div className="space-y-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight"
                >
                  <span className="bg-gradient-to-r from-slate-900 via-blue-700 to-purple-700 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {t("home_hero_title1", "Nền Tảng Học Trực Tuyến")}
                  </span>
                  <br />
                  <span className="relative inline-block mt-2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 bg-clip-text text-transparent">
                      {t("home_hero_title2", "Hàng Đầu Việt Nam")}
                    </span>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 1, duration: 0.8 }}
                      className="absolute -bottom-3 left-0 h-3 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 rounded-full"
                    />
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-base sm:text-lg md:text-2xl text-slate-700 dark:text-slate-300 leading-relaxed font-medium"
                >
                  {t("home_hero_learn", "Học")} <span className="font-bold text-blue-600 dark:text-blue-400">{t("home_hero_programming", "Lập Trình")}</span>, {" "}
                  <span className="font-bold text-purple-600 dark:text-purple-400">{t("home_hero_design", "Thiết Kế")}</span>, {" "}
                  <span className="font-bold text-pink-600 dark:text-pink-400">Data Science</span> {" "}
                  & <span className="font-bold text-orange-600 dark:text-orange-400">AI</span> {t("home_hero_from_experts", "từ các chuyên gia hàng đầu")}
                </motion.p>
              </div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4"
              >
                <Link
                  href="/courses"
                  className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg shadow-[0_8px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.4)] transition-all transform hover:scale-105 hover:-translate-y-0.5"
                >
                  <GraduationCap size={24} />
                  {t("home_cta_explore", "Khám Phá Khóa Học")}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/about"
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-900 dark:text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {t("home_cta_learn_more", "Tìm Hiểu Thêm")}
                  <Play size={20} className="group-hover:scale-110 transition-transform" />
                </Link>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-8"
              >
                <div className="text-center sm:text-left">
                  <p className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    <AnimatedNumber value={15000} formatter={(val) => `${Math.round(val / 1000)}K+`} />
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">{t("home_stat_students", "Học viên")}</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    <AnimatedNumber value={500} formatter={(val) => `${Math.round(val)}+`} />
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">{t("home_stat_courses", "Khóa học")}</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    <AnimatedNumber value={98} suffix="%" />
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">{t("home_stat_satisfied", "Hài lòng")}</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {/* Hero Image/Illustration Placeholder */}
              <div className="relative w-full aspect-square">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-3xl animate-pulse" />
                
                {/* Feature Cards Floating */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-10 right-10 w-56 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                      <Trophy className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{t("home_hero_cert", "Chứng Chỉ Uy Tín")}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t("home_hero_cert_sub", "Được công nhận")}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute bottom-20 left-5 w-56 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                      <Users className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{t("home_hero_expert", "Học Cùng Chuyên Gia")}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t("home_hero_expert_sub", "100+ giảng viên")}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Center Illustration */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-80 h-80 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-10 animate-spin-slow" />
                  <div className="absolute w-64 h-64 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="relative pt-20 overflow-hidden bg-transparent">

        {/* Trust Bar - Partner Logos */}
        <section className="relative py-24 md:py-[100px] px-4 sm:px-6 md:px-8 bg-transparent">
          <div className="page-shell">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-sm font-semibold text-slate-600 dark:text-slate-400 mb-8 uppercase tracking-wider"
            >
              {t("home_trust_bar", "Được tin dùng bởi các tổ chức hàng đầu")}
            </motion.p>
            <div className="flex flex-wrap items-center justify-center gap-12">
              {partners.map((partner, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-3 px-6 py-3 bg-white/68 dark:bg-slate-900/65 backdrop-blur-xl rounded-[20px] border border-white/60 dark:border-slate-700/70 shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_28px_72px_rgba(0,0,0,0.12)] transition-all"
                >
                  <span className="text-3xl">{partner.logo}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{partner.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Value Propositions - Why Choose Us */}
        <section className="py-24 md:py-[100px] px-4 sm:px-6 md:px-8 relative bg-transparent">
        <div className="page-shell">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full mb-6 font-semibold">
              <Target size={18} />
              <span>{t("home_why_badge", "Lợi Ích Vượt Trội")}</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
              {t("home_why_title", "Tại Sao Chọn ICS Learning?")}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {t("home_why_desc", "Chúng tôi cam kết mang đến trải nghiệm học tập chất lượng cao nhất với công nghệ hiện đại và đội ngũ giảng viên chuyên nghiệp")}
            </p>
          </motion.div>
          {/* FEATURES SLIDER */}
          <div className="relative overflow-visible pt-6">

            <motion.div
              key={featurePage}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {visibleFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="group relative p-8 bg-white/66 dark:bg-slate-900/62 backdrop-blur-xl rounded-[20px] border border-white/60 dark:border-slate-700/70 hover:border-blue-300/80 dark:hover:border-blue-600/80 shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_72px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col items-center text-center"
                  >
                    <div className={`inline-flex p-4 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 shadow-[0_18px_34px_-10px_rgba(2,6,23,0.65)] group-hover:scale-110 group-hover:shadow-[0_24px_42px_-10px_rgba(2,6,23,0.75)] transition-all`}>
                      <feature.icon size={28} className="text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-[26ch] mx-auto">
                      {feature.description}
                    </p>

                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/6 group-hover:to-purple-500/6 rounded-[20px] transition-all pointer-events-none" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <div className="flex justify-center items-center gap-6 mt-14">
              <button
                onClick={() => setFeaturePage(p => Math.max(0, p - 1))}
                disabled={featurePage === 0}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition
                  ${featurePage === 0
                    ? "bg-slate-200 dark:bg-slate-800 opacity-40 cursor-not-allowed"
                    : "bg-slate-200 dark:bg-slate-800 hover:scale-110"
                  }`}
              >
                ←
              </button>

              <button
                onClick={() => setFeaturePage(p => Math.min(featureTotalPages - 1, p + 1))}
                disabled={featurePage === featureTotalPages - 1}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition
                  ${featurePage === featureTotalPages - 1
                    ? "bg-slate-200 dark:bg-slate-800 opacity-40 cursor-not-allowed"
                    : "bg-slate-200 dark:bg-slate-800 hover:scale-110"
                  }`}
              >
                →
              </button>
            </div>

          </div>

        </div>
        </section>
      </div>

      {/* Featured Courses */}
      <section className="py-24 md:py-[100px] px-4 sm:px-6 md:px-8 bg-transparent">
        <div className="page-shell">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-full mb-6 font-semibold">
              <Star size={18} className="text-yellow-500" />
              <span>{t("home_courses_badge", "Khóa Học Nổi Bật")}</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
              {t("home_courses_title", "Khóa Học Được Yêu Thích Nhất")}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {t("home_courses_desc", "Các khóa học chất lượng cao được hàng ngàn học viên tin tưởng và đánh giá 5 sao")}
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8 pt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-[20px] overflow-hidden bg-white/66 dark:bg-slate-900/62 backdrop-blur-xl animate-pulse border border-white/60 dark:border-slate-700/70 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <div className="h-56 bg-slate-200 dark:bg-slate-800" />
                  <div className="p-6 space-y-4">
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
                {featuredCourses.length > 0 ? (
                  featuredCourses.map((course, idx) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 40, scale: 0.9 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ 
                        duration: 0.6, 
                        ease: "easeOut",
                        delay: idx * 0.15
                      }}
                    >
                      <CourseCard
                        id={course.id}
                        title={course.title}
                        teacher={course.teacher?.name || t("home_default_teacher", "Chuyên gia hàng đầu")}
                        price={course.price}
                        rating={course.rating || 4.8}
                        image={course.image || "/placeholder.svg"}
                        students={course.enrollmentCount || 0}
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <BookOpen size={64} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 text-lg">{t("home_loading_courses", "Đang tải khóa học...")}</p>
                  </div>
                )}
              </div>

              {/* View All Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mt-12"
              >
                <Link
                  href="/courses"
                  className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-[20px] font-semibold text-base shadow-[0_20px_48px_rgba(37,99,235,0.35)] hover:shadow-[0_26px_58px_rgba(37,99,235,0.45)] transition-all transform hover:scale-[1.02]"
                >
                  {t("home_view_all_courses", "Xem Tất Cả Khóa Học")}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </section>
      {/* Categories */}
      <section className="relative py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-cover bg-center bg-no-repeat rounded-3xl mx-4 sm:mx-6 md:mx-8 my-10 md:my-12" style={{ backgroundImage: "url('/image/bg_homecate1.jpg')" }}>
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 rounded-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b via-transparent rounded-3xl dark:hidden" style={{ backgroundImage: 'linear-gradient(to bottom, #f7f9fc, transparent, #f7f9fc)', '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)' } as any} />
        <div className="hidden dark:absolute dark:inset-0 dark:rounded-3xl dark:block" style={{ backgroundImage: 'linear-gradient(to bottom, #0d1529, transparent, #0d1529)', backgroundSize: 'cover' }} />
        <div className="page-shell relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full mb-6 font-semibold">
              <Rocket size={18} />
              <span>{t("home_cat_badge", "Danh Mục Phổ Biến")}</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
              {t("home_cat_title", "Khám Phá Lĩnh Vực Của Bạn")}
            </h2>
            <p className="text-xl text-slate-600 dark:text-white">
              {t("home_cat_desc", "Chọn lĩnh vực bạn muốn chinh phục và bắt đầu hành trình phát triển kỹ năng")}
            </p>
          </motion.div>

          <motion.div
            key={categoriesPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8"
          >
            {categories.length > 0 ? (
              categories.slice(categoriesPage * CATEGORIES_PER_PAGE, (categoriesPage + 1) * CATEGORIES_PER_PAGE).map((category, idx) => {
                return (
                  <motion.div
                    key={category.id || category.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      href={`/courses?category=${category.id}`}
                      className="group block p-8 bg-white/68 dark:bg-slate-900/62 backdrop-blur-xl border border-white/60 dark:border-slate-700/70 hover:border-blue-400 dark:hover:border-blue-500 rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_72px_rgba(0,0,0,0.12)] transition-all duration-300 text-center h-full flex flex-col items-center justify-center hover:-translate-y-1"
                    >
                      <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2" title={category.name}>
                        {category.name}
                      </h3>

                      <div className="mb-4 group-hover:scale-125 transition-transform duration-300 flex items-center justify-center">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-5xl sm:text-6xl">{category.icon || "📚"}</span>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/70 w-full">
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {category.courseCount || category.courses?.length || 0}+ {t("home_cat_courses", "khóa học")}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <Globe size={64} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 text-lg">{t("home_loading_categories", "Đang tải danh mục...")}</p>
              </div>
            )}
          </motion.div>

          {/* Pagination */}
          {categories.length > CATEGORIES_PER_PAGE && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex justify-center items-center gap-6 mt-14"
            >
              <button
                onClick={() => handleCategoryPageChange(Math.max(0, categoriesPage - 1))}
                disabled={categoriesPage === 0}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition font-bold ${
                  categoriesPage === 0
                    ? "bg-slate-200 dark:bg-slate-800 opacity-40 cursor-not-allowed text-slate-500"
                    : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-110"
                }`}
              >
                ←
              </button>

              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(categories.length / CATEGORIES_PER_PAGE) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleCategoryPageChange(i)}
                    className={`w-10 h-10 rounded-full font-semibold transition ${
                      categoriesPage === i
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleCategoryPageChange(Math.min(Math.ceil(categories.length / CATEGORIES_PER_PAGE) - 1, categoriesPage + 1))}
                disabled={categoriesPage === Math.ceil(categories.length / CATEGORIES_PER_PAGE) - 1}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition font-bold ${
                  categoriesPage === Math.ceil(categories.length / CATEGORIES_PER_PAGE) - 1
                    ? "bg-slate-200 dark:bg-slate-800 opacity-40 cursor-not-allowed text-slate-500"
                    : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-110"
                }`}
              >
                →
              </button>
            </motion.div>
          )}
        </div>
      </section>
      <section className="py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="page-shell">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full mb-6 font-semibold">
              <MessageSquare size={18} />
              <span>{t("home_test_badge", "Câu Chuyện Thành Công")}</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
              {t("home_test_title", "Học Viên Nói Gì Về Chúng Tôi")}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t("home_test_desc", "Hàng ngàn học viên đã thay đổi cuộc đời và sự nghiệp nhờ ICS Learning")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {testimonialsLoading ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={`testimonial-skeleton-${i}`}
                  className="group relative p-8 bg-white/68 dark:bg-slate-900/62 backdrop-blur-xl rounded-[20px] border border-white/60 dark:border-slate-700/70 shadow-[0_20px_60px_rgba(0,0,0,0.08)] animate-pulse"
                >
                  <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
                  <div className="space-y-2 mb-6">
                    <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="h-6 w-40 rounded-full bg-slate-200 dark:bg-slate-700 mb-4" />
                  <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                </div>
              ))
            ) : testimonials.length > 0 ? testimonials.map((testimonial, i) => {
              const studentName = testimonial.student?.name || t("home_test_student", "Học viên")
              const avatarUrl = testimonial.student?.avatar?.trim() || ""
              const canShowAvatarImage =
                isValidAvatarUrl(avatarUrl) &&
                !invalidAvatarByReviewId[testimonial.id]

              return (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative p-8 bg-white/68 dark:bg-slate-900/62 backdrop-blur-xl rounded-[20px] border border-white/60 dark:border-slate-700/70 hover:border-blue-300 dark:hover:border-blue-600 shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_72px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1.5"
                >
                  <div className="absolute top-6 right-6 text-6xl text-blue-100 dark:text-blue-900/30">"</div>

                  <div className="flex gap-1 mb-4">
                    {[...Array(Math.max(0, Math.min(5, testimonial.rating || 0)))].map((_, idx) => (
                      <Star key={idx} size={18} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 relative z-10 font-medium">
                    "{testimonial.comment}"
                  </p>

                  <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold mb-4">
                    {testimonial.course?.title || t("home_test_course_fallback", "Khóa học tại ICS Learning")}
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {canShowAvatarImage ? (
                        <img
                          src={avatarUrl}
                          alt={studentName}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={() => markAvatarAsInvalid(testimonial.id)}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        studentName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{studentName}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{t("home_test_role", "Học viên ICS Learning")}</p>
                    </div>
                  </div>
                </motion.div>
              )
            }) : (
              <div className="md:col-span-3 p-8 rounded-[20px] bg-white/66 dark:bg-slate-900/62 border border-white/60 dark:border-slate-700/70 text-center text-slate-600 dark:text-slate-300">
                {t("home_test_empty", "Chưa có bình luận 5 sao mới nhất để hiển thị.")}
              </div>
            )}
          </div>

          {/* Trust Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8"
          >
            {[
              { number: "4.9/5", label: t("home_metric_rating", "Đánh giá trung bình"), icon: Star },
              { number: "15,000+", label: t("home_metric_students", "Học viên hài lòng"), icon: Users },
              { number: "95%", label: t("home_metric_completion", "Tỷ lệ hoàn thành"), icon: CheckCircle },
              { number: "85%", label: t("home_metric_employment", "Có việc làm sau 6 tháng"), icon: Trophy }
            ].map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center p-6 bg-white/66 dark:bg-slate-900/62 backdrop-blur-xl rounded-[20px] border border-white/60 dark:border-slate-700/70 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
              >
                <metric.icon size={32} className="mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                <p className="text-3xl font-black text-slate-900 dark:text-white mb-2">{metric.number}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{metric.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative isolate py-24 md:py-[100px] px-4 sm:px-6 md:px-8 overflow-hidden rounded-3xl mx-4 sm:mx-6 md:mx-8 my-10 md:my-12">
        {/* Background image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat rounded-3xl"
          style={{ backgroundImage: "url('/image/learning.jpg')" }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 z-10 
          bg-gradient-to-br 
          from-blue-600/10 via-purple-600/10 to-pink-600/10
          dark:from-black/35 dark:via-black/20 dark:to-black/35
          rounded-3xl"
        />

        {/* Animated Orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 left-0 z-20 w-96 h-96 bg-white/20 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-0 right-0 z-20 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl pointer-events-none"
        />

        {/* CONTENT */}
        <div className="relative z-30 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-white/20 backdrop-blur-md border-2 border-transparent bg-clip-padding text-white rounded-full font-semibold"
              style={{
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), linear-gradient(90deg, #405d8d, #856bc8, #d691b4)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box'
              }}
            >
              <Sparkles size={18} />
              <span>{t("home_final_badge", "Bắt Đầu Ngay Hôm Nay")}</span>
            </motion.div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight">
              {t("home_final_title1", "Sẵn Sàng Thay Đổi Cuộc Đời")}<br />
              {t("home_final_title2", "Qua Học Tập?")}
            </h2>

            <p className="text-base sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-medium">
              {t("home_final_desc_pre", "Tham gia cùng")} <span className="font-black">{t("home_final_desc_count", "15,000+ học viên")}</span> {t("home_final_desc_post", "đang chinh phục mục tiêu sự nghiệp của họ mỗi ngày")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-6">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-100 dark:bg-white dark:hover:bg-slate-100 text-blue-700 px-6 sm:px-10 py-3.5 sm:py-5 rounded-[20px] font-black text-base sm:text-lg shadow-2xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-all transform hover:scale-105"
              >
                <Rocket size={24} />
                {t("home_final_signup", "Đăng Ký Miễn Phí Ngay")}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/courses"
                className="group inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/60 text-white px-6 sm:px-10 py-3.5 sm:py-5 rounded-[20px] font-bold text-base sm:text-lg transition-all"
              >
                <BookOpen size={24} />
                {t("home_final_courses", "Xem Khóa Học")}
              </Link>
            </div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-8 sm:pt-12 text-white/80 text-sm sm:text-base"
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-300" />
                <span className="font-semibold">{t("home_trust_no_card", "Không cần thẻ tín dụng")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-300" />
                <span className="font-semibold">{t("home_trust_cancel", "Hủy bất kỳ lúc nào")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-300" />
                <span className="font-semibold">{t("home_trust_refund", "Hoàn tiền trong 30 ngày")}</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
