"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  Play,
  ChevronRight,
  Calendar,
  Target,
  Flame,
  Star,
  CheckCircle,
  ArrowRight,
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { AnimatedNumber } from "@/components/ui/rolling-number"

type DashboardCourse = {
  id: string
  courseId: string
  title: string
  instructor: string
  image: string
  progress: number
  totalLessons: number
  completedLessons: number
  nextLesson: string
  lastAccessed: Date | null
  estimatedHours: number
}

type AssignmentItem = {
  id: string
  title: string
  courseTitle: string
  dueDate?: string
  maxScore?: number
}

type ActivityItem = {
  id: string
  title: string
  courseTitle?: string
  type: "lesson" | "certificate" | "assignment"
  timestamp?: string
}

type DashboardStats = {
  activeCourses: number
  averageProgress: number
  certificates: number
  totalHours: number
  completedCourses: number
  inProgress: number
  streakDays: number
  weeklyGoal: number
}

const formatRelativeTime = (value: string | Date | undefined, t: (key: string, fallback: string) => string) => {
  if (!value) return t("userdb_no_data", "Chưa có dữ liệu")
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return t("userdb_no_data", "Chưa có dữ liệu")
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return t("userdb_just_now", "Vừa xong")
  if (diffMinutes < 60) return `${diffMinutes} ${t("userdb_min_ago", "phút trước")}`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} ${t("userdb_hours_ago", "giờ trước")}`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} ${t("userdb_days_ago", "ngày trước")}`
  return date.toLocaleDateString("vi-VN")
}

const formatDate = (value: string | Date | undefined, t: (key: string, fallback: string) => string) => {
  if (!value) return t("userdb_no_deadline", "Chưa có hạn")
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return t("userdb_no_deadline", "Chưa có hạn")
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const formatHours = (hours: number, t: (key: string, fallback: string) => string) => {
  if (hours <= 0) return "0h"
  if (hours < 1) return `${Math.round(hours * 60)} ${t("userdb_minutes", "phút")}`
  return `${hours.toFixed(1)}h`
}

const computeStreak = (courses: DashboardCourse[]) => {
  const today = new Date()
  const dayOffsets = new Set<number>()
  courses.forEach((course) => {
    if (!course.lastAccessed) return
    const diff = Math.floor((today.getTime() - course.lastAccessed.getTime()) / (1000 * 60 * 60 * 24))
    if (diff >= 0 && diff < 7) {
      dayOffsets.add(diff)
    }
  })
  return dayOffsets.size
}

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [greeting, setGreeting] = useState("")
  const [stats, setStats] = useState<DashboardStats>({
    activeCourses: 0,
    averageProgress: 0,
    certificates: 0,
    totalHours: 0,
    completedCourses: 0,
    inProgress: 0,
    streakDays: 0,
    weeklyGoal: 0,
  })
  const [courses, setCourses] = useState<DashboardCourse[]>([])
  const [upcomingAssignments, setUpcomingAssignments] = useState<AssignmentItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting(t("userdb_morning", "Chào buổi sáng"))
    else if (hour < 18) setGreeting(t("userdb_afternoon", "Chào buổi chiều"))
    else setGreeting(t("userdb_evening", "Chào buổi tối"))
  }, [])

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [enrollmentsResponse, certificates] = await Promise.all([
        apiClient.getMyEnrollments(),
        apiClient.getMyCertificates(),
      ])

        const enrollments = Array.isArray(enrollmentsResponse)
          ? enrollmentsResponse
          : (enrollmentsResponse as any)?.data || []

        const validEnrollments = enrollments.filter((enrollment: any) => enrollment?.course)
        const activityEvents: ActivityItem[] = []

        const coursesData: DashboardCourse[] = await Promise.all(
          validEnrollments.map(async (enrollment: any) => {
            const lessons = await apiClient.getLessonsByCourse(enrollment.courseId)
            const progressEntries = await apiClient.getLessonProgress(enrollment.id)

            const totalLessons = Array.isArray(lessons) ? lessons.length : 0
            const completedLessons = Array.isArray(progressEntries)
              ? progressEntries.filter((p: any) => p?.isCompleted).length
              : Math.round(totalLessons * (Number(enrollment.progress || 0) / 100))

            const latestCompleted = Array.isArray(progressEntries)
              ? [...progressEntries]
                  .filter((p: any) => p?.completedAt)
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
                  )[0]
              : undefined

            if (latestCompleted) {
              activityEvents.push({
                id: `${enrollment.id}-${latestCompleted.lessonId}`,
                title: `${t("userdb_completed", "Hoàn thành")}: ${latestCompleted.lesson?.title || t("userdb_lesson", "Bài học")}`,
                courseTitle: enrollment.course.title,
                type: "lesson",
                timestamp: latestCompleted.completedAt,
              })
            }

            const nextLesson = Array.isArray(progressEntries)
              ? progressEntries.find((p: any) => !p?.isCompleted)?.lesson?.title ||
                lessons.find((lesson: any) => lesson?.order === completedLessons + 1)?.title ||
                t("userdb_continue_next", "Tiếp tục học bài tiếp theo")
              : t("userdb_continue_next", "Tiếp tục học bài tiếp theo")

            const totalDurationSeconds = Array.isArray(lessons)
              ? lessons.reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0)
              : 0
            const estimatedHours = (totalDurationSeconds * (Number(enrollment.progress || 0) / 100)) / 3600

            return {
              id: enrollment.id,
              courseId: enrollment.courseId,
              title: enrollment.course.title,
              instructor: enrollment.course.teacher?.name || t("userdb_instructor", "Giảng viên"),
              image: enrollment.course.thumbnail || "/image/logo-ics.jpg",
              progress: Math.round(Number(enrollment.progress) || 0),
              totalLessons,
              completedLessons,
              nextLesson,
              lastAccessed: enrollment.lastAccessedAt
                ? new Date(enrollment.lastAccessedAt)
                : enrollment.updatedAt
                ? new Date(enrollment.updatedAt)
                : null,
              estimatedHours,
            }
          })
        )

        // Assignments coming soon
        const now = new Date()
        const assignmentsNested = await Promise.all(
          validEnrollments.map(async (enrollment: any) => {
            try {
              return await apiClient.getAssignments(enrollment.courseId)
            } catch (error) {
              console.error("Error fetching assignments", error)
              return []
            }
          })
        )

        const assignments: AssignmentItem[] = assignmentsNested
          .flat()
          .filter((item: any) => item?.dueDate && new Date(item.dueDate) > now)
          .sort(
            (a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          )
          .slice(0, 3)
          .map((assignment: any) => ({
            id: assignment.id,
            title: assignment.title,
            courseTitle:
              coursesData.find((c) => c.courseId === assignment.courseId)?.title || t("userdb_course", "Khóa học"),
            dueDate: assignment.dueDate,
            maxScore: assignment.maxScore,
          }))

        assignments.forEach((assignment) => {
          activityEvents.push({
            id: `assignment-${assignment.id}`,
            title: `${t("userdb_due_soon", "Sắp đến hạn")}: ${assignment.title}`,
            courseTitle: assignment.courseTitle,
            type: "assignment",
            timestamp: assignment.dueDate,
          })
        })

        // Activities from certificates
        if (Array.isArray(certificates)) {
          certificates.forEach((certificate: any) => {
            activityEvents.push({
              id: certificate.id,
              title: `${t("userdb_got_cert", "Nhận chứng chỉ")}: ${certificate.course?.title || t("userdb_course", t("userdb_course", "Khóa học"))}`,
              courseTitle: certificate.course?.title,
              type: "certificate",
              timestamp: certificate.issueDate,
            })
          })
        }

        const sortedActivities = activityEvents
          .sort(
            (a, b) =>
              new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          )
          .slice(0, 6)

        setCourses(
          coursesData.sort(
            (a, b) => (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0)
          )
        )
        setUpcomingAssignments(assignments)
        setActivities(sortedActivities)

        const averageProgress = coursesData.length
          ? Math.round(coursesData.reduce((sum, c) => sum + c.progress, 0) / coursesData.length)
          : 0
        const totalHours = Number(
          coursesData.reduce((sum, c) => sum + (c.estimatedHours || 0), 0).toFixed(1)
        )
        const completedCourses = coursesData.filter((c) => c.progress >= 99).length
        const inProgress = coursesData.filter((c) => c.progress > 0 && c.progress < 99).length

        setStats({
          activeCourses: coursesData.length,
          averageProgress,
          certificates: Array.isArray(certificates) ? certificates.length : 0,
          totalHours,
          completedCourses,
          inProgress,
          streakDays: computeStreak(coursesData),
          weeklyGoal: Math.min(100, averageProgress + inProgress * 5),
        })
      } catch (error) {
        console.error("Error loading dashboard", error)
        toast.error(t("userdb_load_error", "Không thể tải dữ liệu bảng điều khiển"))
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [user?.id])

  // Refetch data when page becomes visible (user returns from other page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }

    const handleFocus = () => {
      loadData()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user?.id, t])

  const statCards = useMemo(
    () => [
      {
        icon: BookOpen,
        label: t("userdb_active_courses", "Khóa học đang học"),
        value: stats.activeCourses,
        formatter: (val: number) => Math.round(val).toLocaleString("vi-VN"),
        sublabel: `${stats.inProgress} ${t("userdb_in_progress", "đang diễn ra")}`,
        color: "bg-blue-500",
      },
      {
        icon: TrendingUp,
        label: t("userdb_avg_progress", "Tiến độ trung bình"),
        value: stats.averageProgress,
        suffix: "%",
        sublabel: `${stats.completedCourses} ${t("userdb_completed_count", "đã hoàn thành")}`,
        color: "bg-purple-500",
      },
      {
        icon: Award,
        label: t("userdb_certs", "Chứng chỉ đạt được"),
        value: stats.certificates,
        formatter: (val: number) => Math.round(val).toLocaleString("vi-VN"),
        sublabel: `${stats.completedCourses} ${t("userdb_courses_done", "khóa hoàn tất")}`,
        color: "bg-green-500",
      },
      {
        icon: Clock,
        label: t("userdb_est_hours", "Giờ học ước tính"),
        value: stats.totalHours,
        formatter: (val: number) => formatHours(val, t),
        sublabel: `${stats.activeCourses} ${t("userdb_enrolled", "khóa đang theo học")}`,
        color: "bg-orange-500",
      },
    ],
    [stats]
  )

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 animate-pulse h-64" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8"
        style={{ backgroundImage: "url('/image/bg_dashboard.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-black/15 dark:bg-black/45" />

        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-black/70 dark:text-white/80 drop-shadow mb-1">{greeting}</p>
              <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                {user?.name || t("userdb_student", "Học viên")}! 👋
              </h1>
              <p className="text-black/70 dark:text-white/80 drop-shadow">
                {t("userdb_hero_desc", "Tiếp tục hành trình học tập của bạn. Dữ liệu đang lấy trực tiếp từ khóa học của bạn.")}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-center px-4 py-2 sm:px-6 sm:py-3 bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl">
                <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mx-auto mb-1 drop-shadow" />
                <p className="text-xl sm:text-2xl font-bold text-white drop-shadow"><AnimatedNumber value={stats.streakDays} /></p>
                <p className="text-[10px] sm:text-xs text-black/70 dark:text-white/80 drop-shadow whitespace-nowrap">{t("userdb_recent_days", "Ngày gần đây")}</p>
              </div>
              <div className="text-center px-4 py-2 sm:px-6 sm:py-3 bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-1 drop-shadow" />
                <p className="text-xl sm:text-2xl font-bold text-white drop-shadow"><AnimatedNumber value={stats.weeklyGoal} suffix="%" /></p>
                <p className="text-[10px] sm:text-xs text-black/70 dark:text-white/80 drop-shadow whitespace-nowrap">{t("userdb_weekly_goal", "Mục tiêu tuần")}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 xl:gap-6">
            {statCards.map((stat, idx) => (
              <div
                key={idx}
                className="group flex flex-col xl:flex-row items-center xl:items-start gap-2 xl:gap-4 p-3 sm:p-4 xl:p-6 bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-900/40 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer text-center xl:text-left"
              >
                <div className={`p-2 sm:p-3 ${stat.color} rounded-lg group-hover:scale-110 transition-all duration-300`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs xl:text-sm text-black/70 dark:text-white/80 mb-0.5 sm:mb-1 drop-shadow">{stat.label}</p>
                  <p className="text-lg sm:text-xl xl:text-2xl font-bold text-white drop-shadow">
                    <AnimatedNumber value={stat.value} formatter={stat.formatter} suffix={stat.suffix} />
                  </p>
                  <p className="text-[9px] sm:text-[10px] xl:text-xs text-green-600 dark:text-green-400 mt-0.5 sm:mt-1 drop-shadow">{stat.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 group bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 hover:bg-white/50 dark:hover:bg-slate-900/40 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.01] transition-all duration-300 ease-out"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white drop-shadow">{t("userdb_continue", "Tiếp tục học")}</h2>
            <Link href="/my-courses" className="text-sm text-primary dark:text-accent hover:underline flex items-center gap-1 drop-shadow">
              {t("userdb_view_all", "Xem tất cả")} <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {courses.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("userdb_no_courses", "Chưa có khóa học nào. Hãy bắt đầu một khóa học mới!")}</p>
            )}
            {courses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-xl p-4 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-lg transition-all duration-300 group/course"
              >
                <div className="flex gap-4">
                  <div className="relative w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/course:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="text-white drop-shadow-lg" size={32} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground dark:text-white mb-1 line-clamp-1 drop-shadow-sm">{course.title}</h3>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2 drop-shadow-sm">{course.instructor}</p>
                    <p className="text-xs text-muted-foreground dark:text-slate-500 mb-2 drop-shadow-sm">
                      {t("userdb_next", "Tiếp theo")}: <span className="text-primary dark:text-accent">{course.nextLesson}</span>
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground dark:text-slate-400 drop-shadow-sm">{course.completedLessons}/{course.totalLessons} bài</span>
                          <span className="font-medium text-foreground dark:text-white drop-shadow-sm">{course.progress}%</span>
                        </div>
                        <div className="h-2 bg-white/40 dark:bg-slate-700/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all shadow-sm"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground dark:text-slate-400 mt-1 drop-shadow-sm">
                          {t("userdb_updated", "Cập nhật")} {formatRelativeTime(course.lastAccessed || undefined, t)} • {t("userdb_estimated", "Ước tính")} {formatHours(course.estimatedHours, t)} {t("userdb_studied", "đã học")}
                        </p>
                      </div>
                      <Link
                        href={`/player/${course.courseId}`}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                      >
                        <Play size={16} />
                        {t("userdb_resume", "Học tiếp")}
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="group bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 hover:bg-white/50 dark:hover:bg-slate-900/40 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.01] transition-all duration-300 ease-out">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground dark:text-white drop-shadow">{t("userdb_upcoming", "Bài tập/Bài thi sắp tới")}</h3>
              <Link href="/exams" className="text-xs text-primary dark:text-accent hover:underline drop-shadow">{t("userdb_view_all", "Xem tất cả")}</Link>
            </div>
            <div className="space-y-3">
              {upcomingAssignments.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("userdb_no_assignments", "Chưa có bài tập hoặc bài thi sắp đến hạn.")}</p>
              )}
              {upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="p-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl">
                  <h4 className="font-medium text-foreground dark:text-white text-sm mb-1 drop-shadow-sm">{assignment.title}</h4>
                  <p className="text-xs text-muted-foreground dark:text-slate-400 mb-2 drop-shadow-sm">{assignment.courseTitle}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-slate-400">
                    <span className="flex items-center gap-1 drop-shadow-sm">
                      <Calendar size={12} />
                      {formatDate(assignment.dueDate, t)}
                    </span>
                    {assignment.maxScore && (
                      <span className="flex items-center gap-1 drop-shadow-sm">
                        <Star size={12} />
                        {t("userdb_max_score", "Tối đa")} {assignment.maxScore} {t("userdb_points", "điểm")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="group bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 hover:bg-white/50 dark:hover:bg-slate-900/40 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.01] transition-all duration-300 ease-out">
            <h3 className="font-bold text-foreground dark:text-white mb-4 drop-shadow">{t("userdb_recent_activity", "Hoạt động gần đây")}</h3>
            <div className="space-y-3">
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("userdb_no_activity", "Chưa có hoạt động mới.")}</p>
              )}
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm ${
                      activity.type === "lesson"
                        ? "bg-blue-500/20 text-blue-500"
                        : activity.type === "assignment"
                        ? "bg-green-500/20 text-green-500"
                        : "bg-yellow-500/20 text-yellow-500"
                    }`}
                  >
                    {activity.type === "lesson" ? (
                      <CheckCircle size={16} />
                    ) : activity.type === "assignment" ? (
                      <Star size={16} />
                    ) : (
                      <Award size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground dark:text-white line-clamp-1 drop-shadow-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground dark:text-slate-400 drop-shadow-sm">
                      {activity.courseTitle || ""} {activity.courseTitle ? "• " : ""}
                      {formatRelativeTime(activity.timestamp, t)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-white hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.01] transition-all duration-300 ease-out">
            <h3 className="font-bold mb-2 drop-shadow">{t("userdb_discover", "Khám phá khóa học mới")}</h3>
            <p className="text-sm text-white/90 mb-4 drop-shadow">
              {t("userdb_discover_desc", "Hàng trăm khóa học chất lượng đang chờ bạn")}
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all backdrop-blur-sm hover:scale-105"
            >
              {t("userdb_discover_btn", "Khám phá ngay")} <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
