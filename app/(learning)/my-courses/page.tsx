"use client"

import { useState, useEffect } from "react"
import { BookOpen, Clock, Award, Play, CheckCircle, BarChart3, Search } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"

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

export default function MyCoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const enrollments = await apiClient.getMyEnrollments()
        setCourses(enrollments)
      } catch (error) {
        console.error("Error fetching enrollments:", error)
        toast.error("Không thể tải danh sách khóa học")
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Khóa học của tôi</h1>
        <p className="text-muted-foreground dark:text-slate-400">Quản lý và theo dõi tiến độ học tập</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng khóa học</p>
              <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{stats.total}</p>
            </div>
            <BookOpen size={24} className="text-primary dark:text-accent opacity-50" />
          </div>
        </div>
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Đang học</p>
              <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.inProgress}</p>
            </div>
            <Clock size={24} className="text-yellow-500 opacity-50" />
          </div>
        </div>
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Hoàn thành</p>
              <p className="text-2xl font-bold text-green-500 mt-1">{stats.completed}</p>
            </div>
            <CheckCircle size={24} className="text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Chưa bắt đầu</p>
              <p className="text-2xl font-bold text-muted-foreground dark:text-slate-400 mt-1">{stats.notStarted}</p>
            </div>
            <BarChart3 size={24} className="text-muted-foreground opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              onClick={() => setFilter(option.value)}
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
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-12 text-center">
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(enrollment => (
            <div
              key={enrollment.id}
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

