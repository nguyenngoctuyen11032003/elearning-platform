"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Clock, Award, Play, CheckCircle, BarChart3, Search } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { PageHero } from "@/components/ui/page-hero"

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
  {
    id: "enroll-7",
    courseId: "course-7",
    course: {
      id: "course-7",
      title: "Database Design & SQL Mastery",
      description: "Thiết kế database và SQL advanced",
      thumbnail: "/image/course-7.jpg",
      teacher: { name: "Vũ Thị G" },
      lessons: Array(16).fill(null)
    },
    progress: 100,
    status: "completed",
    enrolledAt: "2025-09-10"
  },
  {
    id: "enroll-8",
    courseId: "course-8",
    course: {
      id: "course-8",
      title: "Docker & Kubernetes: DevOps Essentials",
      description: "Tìm hiểu Docker và Kubernetes",
      thumbnail: "/image/course-8.jpg",
      teacher: { name: "Hoàng Văn H" },
      lessons: Array(19).fill(null)
    },
    progress: 25,
    status: "in-progress",
    enrolledAt: "2026-01-20"
  }
]

const ITEMS_PER_PAGE = 6

export default function MyCoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

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
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-300 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-300 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHero
        title="Khóa học của tôi"
        subtitle="Quản lý và theo dõi tiến độ học tập"
        bgImage="/image/bg_mycourses.png"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Tổng khóa học</p>
                <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <BookOpen size={20} className="text-primary" />
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Đang học</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.inProgress}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Chưa bắt đầu</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.notStarted}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <BarChart3 size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </PageHero>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: "Tất cả" },
            { value: "in-progress", label: "Đang học" },
            { value: "completed", label: "Hoàn thành" },
            { value: "not-started", label: "Chưa bắt đầu" }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => handleFilterChange(option.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === option.value
                  ? "bg-primary dark:bg-accent text-white"
                  : "bg-secondary dark:bg-slate-800 text-foreground dark:text-white hover:bg-secondary/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-12 text-center"
        >
          <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
            {searchTerm || filter !== "all"
              ? "Không tìm thấy khóa học"
              : "Bạn chưa đăng ký khóa học nào"}
          </h3>
          <p className="text-muted-foreground dark:text-slate-400 mb-4">
            {searchTerm || filter !== "all"
              ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
              : "Khám phá các khóa học và bắt đầu hành trình học tập của bạn"}
          </p>
          {!searchTerm && filter === "all" && (
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              <BookOpen size={20} />
              Khám phá khóa học
            </Link>
          )}
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCourses.map((enrollment, idx) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
              >
                <div className="relative aspect-video bg-muted dark:bg-slate-800">
                  <img
                    src={enrollment.course.thumbnail || "/placeholder.jpg"}
                    alt={enrollment.course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Link
                      href={`/player/${enrollment.courseId}`}
                      className="px-6 py-3 bg-white text-black rounded-lg font-medium flex items-center gap-2 hover:bg-white/90 transition-all"
                    >
                      <Play size={20} />
                      Tiếp tục học
                    </Link>
                  </div>
                  {enrollment.progress === 100 && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle size={12} />
                      Hoàn thành
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground dark:text-white line-clamp-2 mb-2">
                    {enrollment.course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground dark:text-slate-400 mb-3">
                    {enrollment.course.teacher?.name || "Giảng viên"}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground dark:text-slate-400">Tiến độ</span>
                      <span className="font-medium text-foreground dark:text-white">{enrollment.progress}%</span>
                    </div>
                    <div className="h-2 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground dark:text-slate-400">
                      {enrollment.course.lessons?.length || 0} bài học
                    </span>
                    {enrollment.progress === 100 ? (
                      <Link
                        href={`/certificates?courseId=${enrollment.courseId}`}
                        className="text-primary dark:text-accent hover:underline flex items-center gap-1"
                      >
                        <Award size={14} />
                        Xem chứng chỉ
                      </Link>
                    ) : (
                      <Link
                        href={`/player/${enrollment.courseId}`}
                        className="text-primary dark:text-accent hover:underline flex items-center gap-1"
                      >
                        <Play size={14} />
                        {enrollment.progress > 0 ? "Tiếp tục" : "Bắt đầu"}
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-1 mt-8"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    currentPage === page
                      ? "bg-primary dark:bg-accent text-white shadow-lg"
                      : "bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                  }`}
                >
                  {page}
                </motion.button>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

