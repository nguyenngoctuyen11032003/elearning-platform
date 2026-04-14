"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Play,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { AnimatedNumber } from "@/components/ui/rolling-number"

type DashboardCourse = {
  id: string
  courseId: string
  nextLessonId: string
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
  availableFrom?: string
  availableUntil?: string
  remainingAttempts?: number
  maxAttempts?: number
}

type ActivityItem = {
  id: string
  title: string
  courseTitle?: string
  type: "lesson" | "certificate" | "assignment" | "exam"
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

type StatCard = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  suffix?: string
  formatter?: (value: number) => string
  detail: string
  accent: string
  orbit: number
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
  const safeHours = Number.isFinite(hours) ? Math.max(0, hours) : 0
  const totalMinutes = Math.round(safeHours * 60)
  const fullHours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${fullHours} ${t("userdb_hours", "giờ")} ${minutes} ${t("userdb_minutes", "phút")}`
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

const dueBadge = (dueDate: string | undefined, t: (key: string, fallback: string) => string) => {
  if (!dueDate) return t("userdb_no_deadline", "Chưa có hạn")
  const now = Date.now()
  const target = new Date(dueDate).getTime()
  const daysLeft = Math.ceil((target - now) / (1000 * 60 * 60 * 24))

  if (daysLeft <= 0) return t("userdb_due_now", "Đến hạn hôm nay")
  if (daysLeft === 1) return t("userdb_due_tomorrow", "Còn 1 ngày")
  if (daysLeft <= 7) return `${t("userdb_due_in", "Còn")} ${daysLeft} ${t("userdb_days", "ngày")}`
  return formatDate(dueDate, t)
}

function StatOrbitCard({ card, index }: { card: StatCard; index: number }) {
  const ringRadius = 23
  const ringLength = 2 * Math.PI * ringRadius
  const clampedOrbit = Math.max(4, Math.min(100, card.orbit))

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.06, duration: 0.34 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 p-4 shadow-[0_10px_30px_rgba(8,47,73,0.12)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70"
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-20 blur-2xl" style={{ backgroundImage: card.accent }} />
      <div className="relative z-10 flex items-start gap-3">
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
            <circle cx="28" cy="28" r={ringRadius} stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-slate-700" fill="none" />
            <motion.circle
              cx="28"
              cy="28"
              r={ringRadius}
              stroke="url(#stat-ring-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={ringLength}
              initial={{ strokeDashoffset: ringLength }}
              animate={{ strokeDashoffset: ringLength - (ringLength * clampedOrbit) / 100 }}
              transition={{ delay: 0.2 + index * 0.04, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
            <defs>
              <linearGradient id="stat-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <card.icon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{card.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            <AnimatedNumber value={card.value} suffix={card.suffix} formatter={card.formatter} />
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.detail}</p>
        </div>
      </div>
    </motion.article>
  )
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
  }, [t])

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
                  (a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
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

          const nextLessonId = Array.isArray(progressEntries)
            ? String(
                progressEntries.find((p: any) => !p?.isCompleted)?.lessonId ||
                  lessons.find((lesson: any) => Number(lesson?.order) === completedLessons + 1)?.id ||
                  lessons[0]?.id ||
                  enrollment.courseId,
              )
            : String(lessons?.[0]?.id || enrollment.courseId)

          const totalDurationSeconds = Array.isArray(lessons)
            ? lessons.reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0)
            : 0

          const estimatedHours = (totalDurationSeconds * (Number(enrollment.progress || 0) / 100)) / 3600

          return {
            id: enrollment.id,
            courseId: enrollment.courseId,
            nextLessonId,
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
        }),
      )

      const now = new Date()
      const extractedExams = await apiClient.getAvailableExtractedExams()

      const upcomingExamCandidates = await Promise.all(
        (Array.isArray(extractedExams) ? extractedExams : []).map(async (exam: any) => {
          try {
            const payload = await apiClient.getMyExtractedExamAttempts(exam.id)
            const attempts = Array.isArray(payload?.attempts) ? payload.attempts : []
            const attemptCount = Number(payload?.attemptCount ?? attempts.length)
            const remainingAttempts = Number.isFinite(Number(payload?.remainingAttempts))
              ? Number(payload?.remainingAttempts)
              : Math.max(0, Number(exam.maxAttempts || 0) - attemptCount)

            return {
              id: String(exam.id || ""),
              title: String(exam.title || t("userdb_exam", "Bài thi")),
              courseTitle: String(exam.course?.title || t("userdb_course", "Khóa học")),
              availableFrom: exam.availableFrom,
              availableUntil: exam.availableUntil,
              remainingAttempts,
              maxAttempts: Number(exam.maxAttempts || 0),
            } as AssignmentItem
          } catch {
            return null
          }
        }),
      )

      const assignments: AssignmentItem[] = upcomingExamCandidates
        .filter((item): item is AssignmentItem => Boolean(item))
        .filter((item) => (item.remainingAttempts ?? 0) > 0)
        .filter((item) => {
          const availableFrom = item.availableFrom ? new Date(item.availableFrom) : null
          const availableUntil = item.availableUntil ? new Date(item.availableUntil) : null
          if (availableUntil && availableUntil <= now) return false
          if (availableFrom && availableFrom > now) return true
          return true
        })
        .sort((a, b) => {
          const aTime = new Date(a.availableFrom || a.availableUntil || 0).getTime()
          const bTime = new Date(b.availableFrom || b.availableUntil || 0).getTime()
          return aTime - bTime
        })
        .slice(0, 3)

      assignments.forEach((exam) => {
        const examTime = exam.availableFrom || exam.availableUntil
        activityEvents.push({
          id: `exam-${exam.id}`,
          title: `${t("userdb_upcoming_exam", "Bài thi sắp tới")}: ${exam.title}`,
          courseTitle: exam.courseTitle,
          type: "exam",
          timestamp: examTime,
        })
      })

      if (Array.isArray(certificates)) {
        certificates.forEach((certificate: any) => {
          activityEvents.push({
            id: certificate.id,
            title: `${t("userdb_got_cert", "Nhận chứng chỉ")}: ${certificate.course?.title || t("userdb_course", "Khóa học")}`,
            courseTitle: certificate.course?.title,
            type: "certificate",
            timestamp: certificate.issueDate,
          })
        })
      }

      const sortedActivities = activityEvents
        .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
        .slice(0, 6)

      setCourses(coursesData.sort((a, b) => (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0)))
      setUpcomingAssignments(assignments)
      setActivities(sortedActivities)

      const averageProgress = coursesData.length
        ? Math.round(coursesData.reduce((sum, c) => sum + c.progress, 0) / coursesData.length)
        : 0

      const totalHours = Number(coursesData.reduce((sum, c) => sum + (c.estimatedHours || 0), 0).toFixed(1))
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData()
      }
    }

    const handleFocus = () => {
      loadData()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [user?.id, t])

  const statCards = useMemo<StatCard[]>(
    () => [
      {
        icon: BookOpen,
        label: t("userdb_active_courses", "Khóa học đang học"),
        value: stats.activeCourses,
        formatter: (val: number) => Math.round(val).toLocaleString("vi-VN"),
        detail: `${stats.inProgress} ${t("userdb_in_progress", "đang diễn ra")}`,
        accent: "linear-gradient(135deg, rgba(14,165,233,0.65), rgba(59,130,246,0.4))",
        orbit: Math.min(100, stats.activeCourses * 18),
      },
      {
        icon: TrendingUp,
        label: t("userdb_avg_progress", "Tiến độ trung bình"),
        value: stats.averageProgress,
        suffix: "%",
        detail: `${stats.completedCourses} ${t("userdb_completed_count", "đã hoàn thành")}`,
        accent: "linear-gradient(135deg, rgba(59,130,246,0.65), rgba(16,185,129,0.45))",
        orbit: stats.averageProgress,
      },
      {
        icon: Award,
        label: t("userdb_certs", "Chứng chỉ đạt được"),
        value: stats.certificates,
        formatter: (val: number) => Math.round(val).toLocaleString("vi-VN"),
        detail: `${stats.completedCourses} ${t("userdb_courses_done", "khóa hoàn tất")}`,
        accent: "linear-gradient(135deg, rgba(245,158,11,0.68), rgba(16,185,129,0.45))",
        orbit: Math.min(100, stats.certificates * 25),
      },
      {
        icon: Clock,
        label: t("userdb_est_hours", "Giờ học ước tính"),
        value: stats.totalHours,
        formatter: (val: number) => formatHours(val, t),
        detail: `${stats.activeCourses} ${t("userdb_enrolled", "khóa đang theo học")}`,
        accent: "linear-gradient(135deg, rgba(20,184,166,0.62), rgba(14,165,233,0.4))",
        orbit: Math.min(100, Math.round((stats.totalHours / 20) * 100)),
      },
    ],
    [stats, t],
  )

  const focusCourses = useMemo(() => courses.slice(0, 4), [courses])
  const momentumCourses = useMemo(() => [...courses].sort((a, b) => b.progress - a.progress).slice(0, 5), [courses])
  const vitality = useMemo(
    () => Math.min(100, Math.round(stats.averageProgress * 0.65 + stats.streakDays * 6 + stats.completedCourses * 4)),
    [stats],
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-72 animate-pulse rounded-[2rem] bg-gradient-to-br from-slate-200 via-slate-100 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="h-[520px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800 xl:col-span-2" />
          <div className="h-[520px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="dashboard-loaded"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="relative space-y-8"
      >
        <motion.div
          aria-hidden
          animate={{ y: [0, -10, 0], opacity: [0.28, 0.42, 0.28] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-24 -right-10 h-72 w-72 rounded-full bg-cyan-300/40 blur-3xl dark:bg-cyan-500/15"
        />
        <motion.div
          aria-hidden
          animate={{ y: [0, 12, 0], opacity: [0.2, 0.32, 0.2] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="pointer-events-none absolute bottom-16 -left-16 h-72 w-72 rounded-full bg-emerald-300/35 blur-3xl dark:bg-emerald-500/12"
        />

        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-[2rem] border border-cyan-100/70 bg-white/80 p-6 shadow-[0_25px_65px_rgba(3,105,161,0.15)] backdrop-blur-xl dark:border-cyan-900/40 dark:bg-slate-900/65 md:p-8"
          style={{ backgroundImage: "url('/image/bg_students.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_20%_0%,rgba(14,165,233,0.18),transparent_46%),radial-gradient(100%_90%_at_90%_8%,rgba(16,185,129,0.22),transparent_50%)] dark:bg-[radial-gradient(120%_100%_at_20%_0%,rgba(14,165,233,0.16),transparent_46%),radial-gradient(100%_90%_at_90%_8%,rgba(16,185,129,0.16),transparent_52%)]" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.45fr_1fr]">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/60 bg-cyan-50/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:border-cyan-800/70 dark:bg-cyan-950/30 dark:text-cyan-200">
                <Sparkles className="h-4 w-4" />
                {greeting}
              </span>

              <div>
                <h1 className="text-3xl font-black leading-tight text-slate-900 dark:text-white md:text-5xl">
                  {user?.name || t("userdb_student", "Học viên")}
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
                  {t("userdb_hero_desc", "Tiếp tục hành trình học tập của bạn. Dữ liệu đang lấy trực tiếp từ khóa học của bạn.")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/my-courses"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(2,132,199,0.35)] transition-transform hover:-translate-y-0.5"
                >
                  <Play className="h-4 w-4" />
                  {t("userdb_resume", "Học tiếp")}
                </Link>
                <Link
                  href="/progress"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-transform hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                >
                  <Target className="h-4 w-4" />
                  {t("student_menu_progress", "Tiến độ học tập")}
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <motion.div
                whileHover={{ y: -2 }}
                className="rounded-2xl border border-white/50 bg-white/65 p-4 backdrop-blur-lg dark:border-slate-700/60 dark:bg-slate-800/60"
              >
                <div className="mb-3 flex items-center gap-2 text-orange-500">
                  <Flame className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.08em]">{t("userdb_recent_days", "Ngày gần đây")}</span>
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  <AnimatedNumber value={stats.streakDays} />
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("userdb_streak_hint", "Mức độ ổn định học tập của bạn")}</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="rounded-2xl border border-white/50 bg-white/65 p-4 backdrop-blur-lg dark:border-slate-700/60 dark:bg-slate-800/60"
              >
                <div className="mb-3 flex items-center gap-2 text-emerald-500">
                  <Target className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.08em]">{t("userdb_weekly_goal", "Mục tiêu tuần")}</span>
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  <AnimatedNumber value={stats.weeklyGoal} suffix="%" />
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("userdb_goal_hint", "Độ sát mục tiêu theo tuần")}</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="rounded-2xl border border-white/50 bg-white/65 p-4 backdrop-blur-lg dark:border-slate-700/60 dark:bg-slate-800/60 sm:col-span-2 lg:col-span-1 xl:col-span-2"
              >
                <div className="mb-3 flex items-center gap-2 text-sky-600 dark:text-sky-300">
                  <Activity className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.08em]">{t("userdb_vitality", "Nhịp học hiện tại")}</span>
                </div>
                <div className="mb-2 flex items-end justify-between">
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    <AnimatedNumber value={vitality} suffix="%" />
                  </p>
                  <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">{t("userdb_vitality_note", "Duy trì rất tốt")}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${vitality}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card, index) => (
            <StatOrbitCard key={card.label} card={card} index={index} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <motion.article
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="overflow-hidden rounded-2xl border border-white/40 bg-white/75 p-6 shadow-[0_12px_40px_rgba(2,132,199,0.12)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/72"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("userdb_continue", "Tiếp tục học")}</h2>
                <Link href="/my-courses" className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-300">
                  {t("userdb_view_all", "Xem tất cả")}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {focusCourses.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center dark:border-slate-700 dark:bg-slate-800/30"
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t("userdb_no_courses", "Chưa có khóa học nào. Hãy bắt đầu một khóa học mới!")}</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {focusCourses.map((course, idx) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.06, duration: 0.26 }}
                      whileHover={{ y: -2 }}
                      className="group rounded-xl border border-slate-200/80 bg-white/70 p-4 transition-all hover:border-cyan-300 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-800/50"
                    >
                      <div className="flex gap-4">
                        <div className="relative h-24 w-32 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-700">
                          <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-1 text-base font-semibold text-slate-900 dark:text-white">{course.title}</h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{course.instructor}</p>
                          <p className="mt-2 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                            {t("userdb_next", "Tiếp theo")}: <span className="text-cyan-600 dark:text-cyan-300">{course.nextLesson}</span>
                          </p>

                          <div className="mt-2">
                            <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>
                                {course.completedLessons}/{course.totalLessons} {t("userdb_lessons", "bài")}
                              </span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{course.progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${course.progress}%` }}
                                transition={{ duration: 0.8, delay: 0.25 + idx * 0.05 }}
                                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500"
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {formatRelativeTime(course.lastAccessed || undefined, t)} • {formatHours(course.estimatedHours, t)}
                            </p>
                            <Link
                              href={`/player/${course.nextLessonId || course.courseId}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-500"
                            >
                              {t("userdb_resume", "Học tiếp")}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="rounded-2xl border border-white/40 bg-white/75 p-6 shadow-[0_12px_40px_rgba(8,47,73,0.1)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/72"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("userdb_momentum", "Động lực học tập")}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">{t("userdb_top_courses", "Top khóa học theo tiến độ")}</span>
              </div>

              {momentumCourses.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("userdb_no_data", "Chưa có dữ liệu")}</p>
              ) : (
                <div className="space-y-3">
                  {momentumCourses.map((course, idx) => (
                    <motion.div
                      key={`momentum-${course.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.24 + idx * 0.05 }}
                    >
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span className="line-clamp-1 max-w-[76%] font-medium">{course.title}</span>
                        <span className="font-bold">{course.progress}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 0.9, delay: 0.3 + idx * 0.06 }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.article>
          </div>

          <div className="space-y-6">
            <motion.article
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.3 }}
              className="rounded-2xl border border-white/40 bg-white/75 p-6 shadow-[0_12px_40px_rgba(8,47,73,0.1)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/72"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">{t("userdb_upcoming", "Bài thi sắp tới")}</h3>
                <Link href="/exams" className="text-xs font-medium text-cyan-600 hover:underline dark:text-cyan-300">
                  {t("userdb_view_all", "Xem tất cả")}
                </Link>
              </div>

              {upcomingAssignments.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("userdb_no_assignments", "Chưa có bài thi sắp tới.")}</p>
              ) : (
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment, idx) => {
                    const now = new Date()
                    const availableFrom = assignment.availableFrom ? new Date(assignment.availableFrom) : null
                    const targetDate = availableFrom && availableFrom > now
                      ? assignment.availableFrom
                      : assignment.availableUntil
                    return (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.24 + idx * 0.06 }}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/45"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{assignment.title}</p>
                        <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-900/35 dark:text-rose-300">
                          {dueBadge(targetDate, t)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{assignment.courseTitle}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(targetDate, t)}
                        </span>
                        {typeof assignment.remainingAttempts === "number" ? (
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5" />
                            {assignment.remainingAttempts}/{assignment.maxAttempts ?? 0} {t("userdb_attempts", "lượt")}
                          </span>
                        ) : null}
                      </div>
                    </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.3 }}
              className="rounded-2xl border border-white/40 bg-white/75 p-6 shadow-[0_12px_40px_rgba(8,47,73,0.1)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/72"
            >
              <h3 className="mb-4 font-bold text-slate-900 dark:text-white">{t("userdb_recent_activity", "Hoạt động gần đây")}</h3>

              {activities.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("userdb_no_activity", "Chưa có hoạt động mới.")}</p>
              ) : (
                <div className="relative space-y-4">
                  <div className="absolute left-3.5 top-1 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-cyan-300 to-emerald-300 dark:from-cyan-700 dark:to-emerald-700" />
                  {activities.map((activity, idx) => {
                    const iconColor =
                      activity.type === "lesson"
                        ? "bg-cyan-500"
                        : activity.type === "assignment"
                          ? "bg-emerald-500"
                          : "bg-amber-500"

                    const Icon =
                      activity.type === "lesson"
                        ? CheckCircle2
                        : activity.type === "assignment"
                          ? Target
                          : Award

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + idx * 0.05 }}
                        className="relative flex gap-3"
                      >
                        <span className={`relative z-10 mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${iconColor}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="line-clamp-1 text-sm font-medium text-slate-800 dark:text-slate-100">{activity.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {activity.courseTitle ? `${activity.courseTitle} • ` : ""}
                            {formatRelativeTime(activity.timestamp, t)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.3 }}
              whileHover={{ y: -2 }}
              className="relative overflow-hidden rounded-2xl border border-cyan-200/60 bg-gradient-to-br from-cyan-500 to-emerald-500 p-6 text-white shadow-[0_18px_40px_rgba(14,165,233,0.38)]"
            >
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
              <div className="relative z-10">
                <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("userdb_recommendation", "Gợi ý cho bạn")}
                </p>
                <h3 className="text-xl font-black leading-tight">{t("userdb_discover", "Khám phá khóa học mới")}</h3>
                <p className="mt-2 text-sm text-white/90">{t("userdb_discover_desc", "Hàng trăm khóa học chất lượng đang chờ bạn")}</p>
                <Link
                  href="/courses"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
                >
                  {t("userdb_discover_btn", "Khám phá ngay")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.article>
          </div>
        </section>
      </motion.div>
    </AnimatePresence>
  )
}
