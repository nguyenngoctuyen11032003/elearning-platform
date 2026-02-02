"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Clock, Award, Play, CheckCircle, BarChart3, Search, TrendingUp, Star } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { PageHero } from "@/components/ui/page-hero"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface EnrolledCourse {
  id: string
  courseId: string
  course: {
    id: string
    title: string
    description: string
    thumbnail: string
    teacher: {
      name: string
    }
    lessons: any[]
  }
  progress: number
  status: string
  enrolledAt: string
}

const MOCK_COURSES: EnrolledCourse[] = [
  {
    id: "enroll-1",
    courseId: "course-1",
    course: {
      id: "course-1",
      title: "JavaScript Nâng Cao: Mastering Async & Await",
      description: "Học JavaScript advanced concepts",
      thumbnail: "/image/logo-ics.jpg",
      teacher: { name: "Nguyễn Văn A" },
      lessons: Array(15).fill(null)
    },
    progress: 75,
    status: "in-progress",
    enrolledAt: "2025-12-01"
  },
  {
    id: "enroll-2",
    courseId: "course-2",
    course: {
      id: "course-2",
      title: "React 18: Build Production Apps",
      description: "Xây dựng ứng dụng React chuyên nghiệp",
      thumbnail: "/image/course-2.jpg",
      teacher: { name: "Trần Thị B" },
      lessons: Array(20).fill(null)
    },
    progress: 100,
    status: "completed",
    enrolledAt: "2025-10-15"
  },
  {
    id: "enroll-3",
    courseId: "course-3",
    course: {
      id: "course-3",
      title: "TypeScript Từ Zero to Hero",
      description: "Học TypeScript từ cơ bản đến nâng cao",
      thumbnail: "/image/course-3.jpg",
      teacher: { name: "Phạm Văn C" },
      lessons: Array(18).fill(null)
    },
    progress: 45,
    status: "in-progress",
    enrolledAt: "2025-12-10"
  },
  {
    id: "enroll-4",
    courseId: "course-4",
    course: {
      id: "course-4",
      title: "Next.js 14: Full Stack Development",
      description: "Phát triển ứng dụng full stack với Next.js",
      thumbnail: "/image/course-4.jpg",
      teacher: { name: "Lê Minh D" },
      lessons: Array(25).fill(null)
    },
    progress: 0,
    status: "not-started",
    enrolledAt: "2026-01-15"
  },
  {
    id: "enroll-5",
    courseId: "course-5",
    course: {
      id: "course-5",
      title: "Tailwind CSS: Modern Styling",
      description: "Thiết kế giao diện với Tailwind CSS",
      thumbnail: "/image/course-5.jpg",
      teacher: { name: "Đỗ Hồng E" },
      lessons: Array(12).fill(null)
    },
    progress: 90,
    status: "in-progress",
    enrolledAt: "2025-11-20"
  },
  {
    id: "enroll-6",
    courseId: "course-6",
    course: {
      id: "course-6",
      title: "Node.js & Express: Backend API",
      description: "Xây dựng backend API với Node.js",
      thumbnail: "/image/course-6.jpg",
      teacher: { name: "Bùi Văn F" },
      lessons: Array(22).fill(null)
    },
    progress: 60,
    status: "in-progress",
    enrolledAt: "2025-11-05"
  },
  
  
]

const ITEMS_PER_PAGE = 4

export default function MyCoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [expandCourses, setExpandCourses] = useState(false)

  useEffect(() => {
    const fetchEnrollments = async () => {
      // Use mock data in development
      if (process.env.NODE_ENV === "development") {
        setCourses(MOCK_COURSES)
        setLoading(false)
        return
      }

      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const enrollments = await apiClient.getMyEnrollments()
        setCourses(Array.isArray(enrollments) ? enrollments : [])
      } catch (error) {
        console.error("Error fetching enrollments:", error)
        setCourses([])
        // Don't show error toast if it's just empty data
        if (error instanceof Error && !error.message.includes('status: 404')) {
          toast.error("Không thể tải danh sách khóa học")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollments()
  }, [user?.id])

  const filteredCourses = courses.filter(enrollment => {
    const matchesFilter =
      filter === "all" ||
      (filter === "in-progress" && enrollment.progress > 0 && enrollment.progress < 100) ||
      (filter === "completed" && enrollment.progress === 100) ||
      (filter === "not-started" && enrollment.progress === 0)

    const matchesSearch = enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE)
  const initialCoursesToShow = expandCourses ? filteredCourses : filteredCourses.slice(0, 4)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset to page 1 when filter or search changes
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const stats = {
    total: courses.length,
    inProgress: courses.filter(c => c.progress > 0 && c.progress < 100).length,
    completed: courses.filter(c => c.progress === 100).length,
    notStarted: courses.filter(c => c.progress === 0).length,
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-300 rounded-2xl mb-8"></div>
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-56 bg-gray-300 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const activityData = [
    { month: "Apr", value: 45 },
    { month: "May", value: 52 },
    { month: "Jun", value: 48 },
    { month: "Jul", value: 71 },
    { month: "Aug", value: 65 },
    { month: "Sep", value: 78 },
  ]

  const runningCourses = filteredCourses
  const suggestedCourses = courses.filter(c => c.progress === 0).slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-12"
        style={{ backgroundImage: "url('/image/bg_mycourses.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/25 dark:bg-black/40 rounded-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Xin chào {user?.name || "Học viên"}!
            </h1>
            <p className="text-white/90 text-lg mb-6 drop-shadow">
              Khóa học của tôi
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-all"
            >
              <BookOpen size={20} />
              Khám phá khóa học
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Running Courses Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground dark:text-white">Khóa học đang học</h2>
        </div>

        {runningCourses.length > 0 ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={expandCourses ? "expanded" : "collapsed"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {initialCoursesToShow.map((enrollment, idx) => {
                  const colors = [
                    { bg: "from-orange-400 to-orange-500", icon: "🎨" },
                    { bg: "from-purple-500 to-purple-600", icon: "✨" },
                    { bg: "from-cyan-400 to-cyan-500", icon: "🎭" },
                    { bg: "from-pink-500 to-pink-600", icon: "🖌️" },
                  ]
                  const color = colors[idx % colors.length]

                  return (
                    <motion.div
                      key={enrollment.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      whileHover={{ y: -8, transition: { duration: 0.2 } }}
                      className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/50 dark:hover:border-accent/50 transition-all duration-300 group cursor-pointer"
                    >
                      <motion.div
                        className={`relative aspect-video bg-gradient-to-br ${color.bg} flex items-end justify-start p-4 overflow-hidden`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.span
                          className="text-4xl"
                          whileHover={{ scale: 1.2, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          {color.icon}
                        </motion.span>
                      </motion.div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground dark:text-white line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-200">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground dark:text-slate-400 mb-3">
                          {enrollment.course.teacher?.name || "Giảng viên"}
                        </p>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="h-1.5 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${enrollment.progress}%` }}
                              transition={{ delay: idx * 0.05 + 0.2, duration: 0.6, ease: "easeOut" }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground dark:text-slate-400">
                            {enrollment.progress}%
                          </span>
                          <Link
                            href={`/player/${enrollment.courseId}`}
                            className="text-primary dark:text-accent hover:underline flex items-center gap-1 group/link"
                          >
                            <motion.div
                              whileHover={{ x: 4 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Play size={12} />
                            </motion.div>
                            <span className="group-hover/link:opacity-100 opacity-90 transition-opacity">Tiếp tục</span>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </AnimatePresence>

            {/* Show More Button */}
            {filteredCourses.length > 4 && !expandCourses && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center mt-6"
              >
                <motion.button
                  onClick={() => setExpandCourses(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                >
                  Xem thêm khóa học
                </motion.button>
              </motion.div>
            )}

            {/* Show Less Button */}
            {expandCourses && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center mt-6"
              >
                <motion.button
                  onClick={() => setExpandCourses(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 rounded-lg bg-secondary dark:bg-slate-800 text-foreground dark:text-white font-semibold hover:bg-secondary/80 dark:hover:bg-slate-700 transition-all shadow-md hover:shadow-lg"
                >
                  Ẩn bớt
                </motion.button>
              </motion.div>
            )}
          </>
        ) : (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground dark:text-slate-400">Không có khóa học đang học</p>
          </div>
        )}
      </motion.div>

      {/* Activity & Suggested Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground dark:text-white">Hoạt động</h3>
            <span className="text-sm text-muted-foreground dark:text-slate-400 flex items-center gap-1">
              <TrendingUp size={16} />
              Oct (1-10)
            </span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
                cursor={{ stroke: '#8b5cf6', strokeWidth: 1 }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
                fill="url(#colorValue)"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Suggested Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground dark:text-white">Khóa học gợi ý</h3>
            <Star size={16} className="text-yellow-500" />
          </div>
          <div className="space-y-4">
            {suggestedCourses.length > 0 ? (
              suggestedCourses.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/player/${enrollment.courseId}`}
                  className="group block p-4 bg-secondary/50 dark:bg-slate-800/50 border border-border/50 dark:border-slate-700/50 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-all"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <img 
                      src={enrollment.course.thumbnail || "/placeholder.jpg"} 
                      alt={enrollment.course.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                        {enrollment.course.title}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                        {enrollment.course.teacher?.name || "Giảng viên"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">
                    Đăng tải vào 1/1/2026
                  </p>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <BookOpen size={32} className="mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground dark:text-slate-400">Chưa có gợi ý</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

