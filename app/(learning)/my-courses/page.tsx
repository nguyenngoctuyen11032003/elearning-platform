"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Clock, Award, Play, CheckCircle, BarChart3, Search, TrendingUp, Star, Grid3x3, Zap, Settings, User, MoreVertical, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { PageHero } from "@/components/ui/page-hero"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ResponsiveContainer as RespContainer } from "recharts"

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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900/60 border-b border-border dark:border-slate-800 px-8 py-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Khóa học của tôi</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 bg-secondary dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors">
              <Star size={20} />
            </button>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="flex gap-4 p-6">
            {/* Courses Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 "
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-foreground dark:text-white mb-2">Khóa học đang học</h2>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">Tổng cộng {courses.length} khóa học</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-foreground dark:text-white">Sắp xếp theo</span>
                  <select
                    value={filter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="bg-transparent border-0 focus:outline-none text-sm font-medium text-muted-foreground dark:text-slate-400"
                  >
                    <option value="all">Tất cả</option>
                    <option value="in-progress">Đang học</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="not-started">Chưa bắt đầu</option>
                  </select>
                </div>
              </div>

              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((enrollment, idx) => {
                    const colors = [
                      { bg: "from-pink-400 to-pink-500", icon: "🎨", light: "bg-pink-100 dark:bg-pink-900/20" },
                      { bg: "from-purple-500 to-purple-600", icon: "✨", light: "bg-purple-100 dark:bg-purple-900/20" },
                      { bg: "from-cyan-400 to-cyan-500", icon: "🎭", light: "bg-cyan-100 dark:bg-cyan-900/20" },
                      { bg: "from-orange-400 to-orange-500", icon: "🖌️", light: "bg-orange-100 dark:bg-orange-900/20" },
                    ]
                    const color = colors[idx % colors.length]
                    const lessons = enrollment.course.lessons || []

                    return (
                      <motion.div
                        key={enrollment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -4 }}
                        className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
                      >
                        {/* Header with gradient */}
                        <motion.div
                          className={`relative aspect-video bg-gradient-to-br ${color.bg} flex items-center justify-center overflow-hidden`}
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-6xl">{color.icon}</span>
                        </motion.div>

                        {/* Card Content */}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-foreground dark:text-white line-clamp-2 mb-1">
                                {enrollment.course.title}
                              </h3>
                              <p className={`text-xs font-medium ${color.light} px-2 py-1 rounded inline-block`}>
                                {enrollment.progress === 100 ? "Hoàn thành" : "Đang học"}
                              </p>
                            </div>
                            <button className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                              <MoreVertical size={16} />
                            </button>
                          </div>

                          {/* Lessons Preview */}
                          <div className="space-y-2 mb-4">
                            {lessons.slice(0, 3).map((_, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground dark:text-slate-400">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                <span>Bài {i + 1}: {enrollment.course.title.slice(0, 20)}...</span>
                              </div>
                            ))}
                            {lessons.length > 3 && (
                              <p className="text-xs text-primary dark:text-accent font-medium">+{lessons.length - 3} bài khác</p>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-foreground dark:text-white">Tiến độ</span>
                              <span className="text-xs font-bold text-primary dark:text-accent">{enrollment.progress}%</span>
                            </div>
                            <div className="h-2 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${enrollment.progress}%` }}
                                transition={{ delay: idx * 0.05 + 0.2, duration: 0.6 }}
                              />
                            </div>
                          </div>

                          {/* Teacher and Avatars */}
                          <div className="flex items-center justify-between pt-4 border-t border-border dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                                {enrollment.course.teacher?.name?.charAt(0) || "T"}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground dark:text-white">
                                  {enrollment.course.teacher?.name?.split(" ")[0] || "Giảng viên"}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-slate-400">Giảng viên</p>
                              </div>
                            </div>
                            <Link
                              href={`/player/${enrollment.courseId}`}
                              className="flex items-center gap-1 text-primary dark:text-accent hover:gap-2 transition-all text-xs font-medium"
                            >
                              Tiếp tục
                              <ChevronRight size={14} />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl p-12 text-center">
                  <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground dark:text-slate-400">Không có khóa học phù hợp</p>
                </div>
              )}
            </motion.div>

            {/* Right Sidebar - Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-80 space-y-6 flex flex-col"
            >
              {/* Total Project Card */}
              <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-foreground dark:text-white mb-6">Tổng khóa học</h3>
                <div className="flex items-center justify-center mb-6">
                  <div className="w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="8"
                        strokeDasharray={`${(stats.completed / stats.total) * 282.7} 282.7`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <circle cx="50" cy="50" r="35" fill="white" className="dark:fill-slate-900" />
                      <text x="50" y="44" textAnchor="middle" dy="0.3em" className="text-2xl font-bold fill-foreground dark:fill-white" fontSize="20">
                        {stats.completed}
                      </text>
                      <text x="50" y="60" textAnchor="middle" className="text-xs fill-muted-foreground dark:fill-slate-400" fontSize="10">
                        Hoàn thành
                      </text>
                    </svg>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground dark:text-slate-400">Tổng cộng: {stats.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground dark:text-slate-400">Đang học: {stats.inProgress}</span>
                  </div>
                </div>
              </div>

              {/* Completed Courses List */}
              <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl p-6 shadow-lg min-h-[350px]">
                <h3 className="text-lg font-bold text-foreground dark:text-white mb-6">Đã hoàn thành</h3>
                <div className="space-y-4">
                  {courses
                    .filter(c => c.progress === 100)
                    .map((enrollment) => (
                      <Link
                        key={enrollment.id}
                        href={`/player/${enrollment.courseId}`}
                        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                            {enrollment.course.title}
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">
                            {enrollment.course.teacher?.name?.split(" ")[0] || "Giảng viên"}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  {courses.filter(c => c.progress === 100).length === 0 && (
                    <p className="text-sm text-muted-foreground dark:text-slate-400 text-center py-6">Chưa hoàn thành khóa học nào</p>
                  )}
                </div>
              </div>

              {/* Buy More Courses */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 shadow-lg text-white flex flex-col justify-center">

                <h3 className="text-2xl font-bold mb-3">Mua thêm khóa học</h3>
                <p className="text-base text-white/90 mb-6">Khám phá các khóa học mới và nâng cao kỹ năng của bạn</p>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-all w-full"
                >
                  <BookOpen size={18} />
                  Khám phá khóa học
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

