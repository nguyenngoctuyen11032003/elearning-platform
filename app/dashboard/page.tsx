"use client"

import { useState, useEffect } from "react"
import { BookOpen, Clock, Award, TrendingUp, Play, Target, Flame } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { getRoleAvatar } from "@/lib/utils/avatar"

interface DashboardStats {
  coursesEnrolled: number
  hoursLearned: number
  certificatesEarned: number
  currentStreak: number
}

interface RecentCourse {
  id: string
  courseId: string
  title: string
  thumbnail: string
  progress: number
  lastAccessed: string
  teacherName: string
}

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    coursesEnrolled: 0,
    hoursLearned: 0,
    certificatesEarned: 0,
    currentStreak: 0,
  })
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    // Redirect based on user role
    if (!loading) {
      if (!isAuthenticated) {
        window.location.href = "/login"
        return
      }

      if (user?.role === "admin") {
        window.location.href = "/admin/dashboard"
        return
      }

      if (user?.role === "teacher") {
        window.location.href = "/teacher/dashboard"
        return
      }

      // For students, fetch and display data
      fetchDashboardData()
    }
  }, [loading, isAuthenticated, user?.role])

  const fetchDashboardData = async () => {
    if (!user?.id) return

    try {
      setPageLoading(true)

      // Fetch enrollments
      const enrollments = await apiClient.getMyEnrollments()

      // Calculate stats
      const hoursLearned = enrollments.reduce((total: number, enrollment: any) => {
        return total + Math.floor((enrollment.progress / 100) * 20)
      }, 0)

      // Fetch certificates
      const certificatesResponse = await fetch(`/api/certificates?userId=${user.id}`)
      const certificates = await certificatesResponse.json()

      setStats({
        coursesEnrolled: enrollments.length,
        hoursLearned: hoursLearned,
        certificatesEarned: certificates.length || 0,
        currentStreak: 5,
      })

      // Format recent courses
      const recent = enrollments.slice(0, 3).map((enrollment: any) => ({
        id: enrollment.id,
        courseId: enrollment.courseId,
        title: enrollment.course.title,
        thumbnail: enrollment.course.thumbnail || "/placeholder.jpg",
        progress: enrollment.progress,
        lastAccessed: enrollment.updatedAt,
        teacherName: enrollment.course.teacher?.name || "Giảng viên",
      }))
      setRecentCourses(recent)

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Không thể tải dữ liệu dashboard")
    } finally {
      setPageLoading(false)
    }
  }

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <div className="animate-pulse text-foreground dark:text-white">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                <img
                  src={getRoleAvatar(user?.role || 'student')}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Chào mừng trở lại, {user?.name || 'Học viên'}!</h1>
                <p className="text-white/80">Tiếp tục hành trình học tập của bạn</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Khóa học</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{stats.coursesEnrolled}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <BookOpen size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Giờ học</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{stats.hoursLearned}h</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Clock size={24} className="text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Chứng chỉ</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{stats.certificatesEarned}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                  <Award size={24} className="text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Chuỗi ngày</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{stats.currentStreak}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Flame size={24} className="text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Continue Learning */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Tiếp tục học</h2>
              <Link
                href="/my-courses"
                className="text-primary dark:text-accent hover:underline font-medium text-sm"
              >
                Xem tất cả
              </Link>
            </div>

            {recentCourses.length === 0 ? (
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-12 text-center">
                <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                  Bạn chưa đăng ký khóa học nào
                </h3>
                <p className="text-muted-foreground dark:text-slate-400 mb-4">
                  Khám phá các khóa học và bắt đầu hành trình học tập của bạn
                </p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  <BookOpen size={20} />
                  Khám phá khóa học
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentCourses.map(course => (
                  <div
                    key={course.id}
                    className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
                  >
                    <div className="relative aspect-video bg-muted dark:bg-slate-800">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Link
                          href={`/player/${course.courseId}`}
                          className="px-6 py-3 bg-white text-black rounded-lg font-medium flex items-center gap-2 hover:bg-white/90 transition-all"
                        >
                          <Play size={20} />
                          Tiếp tục học
                        </Link>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground dark:text-white line-clamp-2 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground dark:text-slate-400 mb-3">
                        {course.teacherName}
                      </p>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground dark:text-slate-400">Tiến độ</span>
                          <span className="font-medium text-foreground dark:text-white">{course.progress}%</span>
                        </div>
                        <div className="h-2 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/my-courses"
              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 hover:border-primary dark:hover:border-accent transition-all group"
            >
              <BookOpen size={24} className="text-primary dark:text-accent mb-3" />
              <h3 className="font-semibold text-foreground dark:text-white">Khóa học của tôi</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-400">Quản lý khóa học</p>
            </Link>
            <Link
              href="/notes"
              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 hover:border-primary dark:hover:border-accent transition-all group"
            >
              <Target size={24} className="text-primary dark:text-accent mb-3" />
              <h3 className="font-semibold text-foreground dark:text-white">Ghi chú</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-400">Xem ghi chú của bạn</p>
            </Link>
            <Link
              href="/certificates"
              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 hover:border-primary dark:hover:border-accent transition-all group"
            >
              <Award size={24} className="text-primary dark:text-accent mb-3" />
              <h3 className="font-semibold text-foreground dark:text-white">Chứng chỉ</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-400">Xem chứng chỉ đạt được</p>
            </Link>
            <Link
              href="/wishlist"
              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 hover:border-primary dark:hover:border-accent transition-all group"
            >
              <TrendingUp size={24} className="text-primary dark:text-accent mb-3" />
              <h3 className="font-semibold text-foreground dark:text-white">Yêu thích</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-400">Khóa học đã lưu</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
