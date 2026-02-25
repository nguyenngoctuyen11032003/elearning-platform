"use client"

import { Navbar } from "@/components/ui/navbar"
import { CourseCard } from "@/components/ui/course-card"
import { SectionTitle } from "@/components/ui/section-title"
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button"
import { 
  ArrowRight, Play, Users, Award, Zap, BookOpen, Star, TrendingUp, Sparkles,
  Target, Shield, Clock, CheckCircle, Globe, Lightbulb, Trophy, HeartHandshake,
  GraduationCap, Brain, Rocket, BarChart3, MessageSquare
} from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/ui/footer"
import { useEffect, useState, useRef } from "react"
import { apiClient } from "@/lib/api/client"
import { motion } from "framer-motion"

const testimonials = [
  {
    name: "Trần Văn Minh",
    role: "Full-stack Developer tại FPT Software",
    content: "Tôi đã chuyển đổi sự nghiệp từ kế toán sang lập trình chỉ sau 6 tháng học tại ICS Learning. Các khóa học được thiết kế bài bản, giảng viên hỗ trợ nhiệt tình.",
    avatar: "/avatars/student-1.jpg",
    rating: 5,
    course: "Bootcamp Full-stack"
  },
  {
    name: "Nguyễn Thị Mai",
    role: "UI/UX Designer tại Tiki",
    content: "Khóa UI/UX Design đã giúp tôi có được công việc mơ ước. Nội dung cập nhật, thực tế và có nhiều bài tập thực hành. Giá cả hợp lý so với chất lượng nhận được.",
    avatar: "/avatars/student-2.jpg",
    rating: 5,
    course: "UI/UX Professional"
  },
  {
    name: "Lê Hoàng Anh",
    role: "Data Analyst tại Shopee",
    content: "ICS Learning đã thay đổi cuộc đời tôi! Từ không biết gì về data, giờ tôi đã tự tin phân tích và xử lý dữ liệu lớn. Tỷ lệ có việc làm sau khóa học rất cao.",
    avatar: "/avatars/student-3.jpg",
    rating: 5,
    course: "Data Science Masterclass"
  },
]

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
  const [loading, setLoading] = useState(true)
  const [categoriesPage, setCategoriesPage] = useState(0)

  const CATEGORIES_PER_PAGE = 10
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const coursesRes = await apiClient.getCourses()
        
        // Mock data nếu API không trả về
        const mockCourses = [
          {
            id: "1",
            title: "JavaScript Nâng Cao: Mastering Async & Await",
            teacher: { name: "Nguyễn Văn A" },
            price: 599000,
            rating: 5,
            image: "/image/logo-ics.jpg",
            enrollmentCount: 1200
          },
          {
            id: "2",
            title: "React 18: Build Production Apps",
            teacher: { name: "Trần Thị B" },
            price: 699000,
            rating: 4.9,
            image: "/placeholder.svg",
            enrollmentCount: 950
          },
          {
            id: "3",
            title: "TypeScript Từ Zero to Hero",
            teacher: { name: "Phạm Văn C" },
            price: 549000,
            rating: 4.9,
            image: "/image/logo-ics.jpg",
            enrollmentCount: 850
          },
          {
            id: "4",
            title: "Next.js 14: Full Stack Development",
            teacher: { name: "Lê Minh D" },
            price: 799000,
            rating: 4.8,
            image: "/placeholder.svg",
            enrollmentCount: 720
          },
          {
            id: "5",
            title: "Tailwind CSS: Modern Styling",
            teacher: { name: "Đỗ Hồng E" },
            price: 399000,
            rating: 4.8,
            image: "/image/logo-ics.jpg",
            enrollmentCount: 1100
          }
        ]
        
        // Lấy 5 khóa học có đánh giá cao nhất
        const courses = Array.isArray(coursesRes) && coursesRes.length > 0 ? coursesRes : mockCourses
        const sortedCourses = courses
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 5)
        setFeaturedCourses(sortedCourses)

        const categoriesRes = await apiClient.getCategories()
        setCategories(Array.isArray(categoriesRes) ? categoriesRes : [])
        setCategoriesPage(0)
      } catch (error) {
        console.error("Error fetching data:", error)
        setFeaturedCourses([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

  const features = [
    {
      icon: Shield,
      title: "Chất Lượng Đảm Bảo",
      description: "100% khóa học được kiểm duyệt bởi chuyên gia. Hoàn tiền nếu không hài lòng.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30"
    },
    {
      icon: Clock,
      title: "Học Mọi Lúc, Mọi Nơi",
      description: "Truy cập trọn đời, học theo tốc độ riêng. Hỗ trợ offline trên mobile.",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30"
    },
    {
      icon: Users,
      title: "Cộng Đồng 15K+",
      description: "Kết nối, thảo luận và học hỏi cùng cộng đồng học viên năng động.",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/30"
    },
    {
      icon: Trophy,
      title: "Chứng Chỉ Uy Tín",
      description: "Nhận chứng chỉ được công nhận bởi doanh nghiệp sau khi hoàn thành.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/30"
    },
    {
      icon: Lightbulb,
      title: "Nội Dung Thực Tế",
      description: "Học từ dự án thực tế, bài tập case study từ doanh nghiệp hàng đầu.",
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30"
    },
    {
      icon: HeartHandshake,
      title: "Hỗ Trợ 24/7",
      description: "Đội ngũ support luôn sẵn sàng giải đáp mọi thắc mắc của bạn.",
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-50 dark:bg-pink-950/30"
    },
    {
      icon: Brain,
      title: "AI Tutor Thông Minh",
      description: "Trợ lý AI cá nhân hóa giúp bạn học hiệu quả hơn.",
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/30"
    },
    {
      icon: BarChart3,
      title: "Theo Dõi Tiến Độ",
      description: "Dashboard chi tiết giúp bạn theo dõi quá trình học.",
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
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navbar />

      {/* Hero Section - Premium Education Platform */}
      <section className="relative pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6 md:px-8 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.1),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_60%,rgba(147,51,234,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
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
                  <p className="text-sm font-bold text-slate-900 dark:text-white">15,000+ Học viên thành công</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Đánh giá 4.9/5 ⭐</p>
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
                    Nền Tảng Học Trực Tuyến
                  </span>
                  <br />
                  <span className="relative inline-block mt-2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 bg-clip-text text-transparent">
                      Hàng Đầu Việt Nam
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
                  Học <span className="font-bold text-blue-600 dark:text-blue-400">Lập Trình</span>, {" "}
                  <span className="font-bold text-purple-600 dark:text-purple-400">Thiết Kế</span>, {" "}
                  <span className="font-bold text-pink-600 dark:text-pink-400">Data Science</span> {" "}
                  & <span className="font-bold text-orange-600 dark:text-orange-400">AI</span> từ các chuyên gia hàng đầu
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
                  Khám Phá Khóa Học
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/about"
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-900 dark:text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Tìm Hiểu Thêm
                  <Play size={20} className="group-hover:scale-110 transition-transform" />
                </Link>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-8 border-t border-slate-200 dark:border-slate-800"
              >
                <div className="text-center sm:text-left">
                  <p className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">15K+</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">Học viên</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">500+</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">Khóa học</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">98%</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">Hài lòng</p>
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
                      <p className="font-bold text-slate-900 dark:text-white">Chứng Chỉ Uy Tín</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Được công nhận</p>
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
                      <p className="font-bold text-slate-900 dark:text-white">Học Cùng Chuyên Gia</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">100+ giảng viên</p>
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

      {/* Trust Bar - Partner Logos */}
      <section className="py-12 px-4 sm:px-6 md:px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-y border-slate-200 dark:border-slate-800">
        <div className="page-shell">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm font-semibold text-slate-600 dark:text-slate-400 mb-8 uppercase tracking-wider"
          >
            Được tin dùng bởi các tổ chức hàng đầu
          </motion.p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {partners.map((partner, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:bg-slate-800/70 transition-shadow"
              >
                <span className="text-3xl">{partner.logo}</span>
                <span className="font-bold text-slate-900 dark:text-white">{partner.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Propositions - Why Choose Us */}
      <section className="py-20 md:py-24 px-4 sm:px-6 md:px-8 relative">
        <div className="page-shell">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full mb-6 font-semibold">
              <Target size={18} />
              <span>Lợi Ích Vượt Trội</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Tại Sao Chọn ICS Learning?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Chúng tôi cam kết mang đến trải nghiệm học tập chất lượng cao nhất với công nghệ hiện đại và đội ngũ giảng viên chuyên nghiệp
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {visibleFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={`group relative p-8 ${feature.bgColor} rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}
                  >
                    <div className={`inline-flex p-4 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      <feature.icon size={28} className="text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>

                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 rounded-3xl transition-all pointer-events-none" />
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

      {/* Featured Courses */}
      <section className="py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <div className="page-shell">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-full mb-6 font-semibold">
              <Star size={18} className="text-yellow-500" />
              <span>Khóa Học Nổi Bật</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Khóa Học Được Yêu Thích Nhất
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Các khóa học chất lượng cao được hàng ngàn học viên tin tưởng và đánh giá 5 sao
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-3xl overflow-hidden bg-white dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
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
                        teacher={course.teacher?.name || "Chuyên gia hàng đầu"}
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
                    <p className="text-slate-600 dark:text-slate-400 text-lg">Đang tải khóa học...</p>
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
                  className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Xem Tất Cả Khóa Học
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
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full mb-6 font-semibold">
              <Rocket size={18} />
              <span>Danh Mục Phổ Biến</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Khám Phá Lĩnh Vực Của Bạn
            </h2>
            <p className="text-xl text-slate-600 dark:text-white">
              Chọn lĩnh vực bạn muốn chinh phục và bắt đầu hành trình phát triển kỹ năng
            </p>
          </motion.div>

          <motion.div
            key={categoriesPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-10"
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
                      className="group block p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl hover:shadow-xl transition-all duration-300 text-center h-full flex flex-col items-center justify-center"
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

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 w-full">
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {category.courseCount || category.courses?.length || 0}+ khóa học
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <Globe size={64} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 text-lg">Đang tải danh mục...</p>
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
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full mb-6 font-semibold">
              <MessageSquare size={18} />
              <span>Câu Chuyện Thành Công</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Học Viên Nói Gì Về Chúng Tôi
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Hàng ngàn học viên đã thay đổi cuộc đời và sự nghiệp nhờ ICS Learning
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 text-6xl text-blue-100 dark:text-blue-900/30">"</div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, idx) => (
                    <Star key={idx} size={18} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 relative z-10 font-medium">
                  "{testimonial.content}"
                </p>

                {/* Course Badge */}
                <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold mb-4">
                  {testimonial.course}
                </div>

                {/* Author */}
                <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { number: "4.9/5", label: "Đánh giá trung bình", icon: Star },
              { number: "15,000+", label: "Học viên hài lòng", icon: Users },
              { number: "95%", label: "Tỷ lệ hoàn thành", icon: CheckCircle },
              { number: "85%", label: "Có việc làm sau 6 tháng", icon: Trophy }
            ].map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg"
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
      <section className="relative isolate py-20 md:py-24 px-4 sm:px-6 md:px-8 overflow-hidden rounded-3xl mx-4 sm:mx-6 md:mx-8 my-10 md:my-12">
        {/* Background image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat rounded-3xl"
          style={{ backgroundImage: "url('/image/learning.jpg')" }}
        />

        {/* Overlay – FIX DARK MODE + KHÔNG MẤT ẢNH */}
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
              <span>Bắt Đầu Ngay Hôm Nay</span>
            </motion.div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight">
              Sẵn Sàng Thay Đổi Cuộc Đời<br />
              Qua Học Tập?
            </h2>

            <p className="text-base sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-medium">
              Tham gia cùng <span className="font-black">15,000+ học viên</span> đang chinh phục mục tiêu sự nghiệp của họ mỗi ngày
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-6">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-100 dark:bg-white dark:hover:bg-slate-100 text-blue-700 px-6 sm:px-10 py-3.5 sm:py-5 rounded-2xl font-black text-base sm:text-lg shadow-2xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-all transform hover:scale-105"
              >
                <Rocket size={24} />
                Đăng Ký Miễn Phí Ngay
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/courses"
                className="group inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md hover:bg-white/20 border-2 border-white/50 text-white px-6 sm:px-10 py-3.5 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all"
              >
                <BookOpen size={24} />
                Xem Khóa Học
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
                <span className="font-semibold">Không cần thẻ tín dụng</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-300" />
                <span className="font-semibold">Hủy bất kỳ lúc nào</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-300" />
                <span className="font-semibold">Hoàn tiền trong 30 ngày</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  )
}
