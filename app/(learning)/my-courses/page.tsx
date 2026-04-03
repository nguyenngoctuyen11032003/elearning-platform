"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  BookOpen,
  ChevronRight,
  Clock3,
  Compass,
  Filter,
  Flame,
  Layers3,
  MoreVertical,
  Pin,
  PlayCircle,
  Search,
  Share2,
  Sparkles,
  Star,
  Target,
  Trash2,
  Trophy,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { UniversalSelect } from "@/components/ui/universal-select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface EnrolledCourse {
  id: string
  courseId: string
  course: {
    id: string
    title: string
    description: string
    thumbnail: string
    teacher?: {
      name?: string
    }
    lessons: any[]
  }
  progress: number
  status: string
  enrolledAt: string
}

type FilterMode = "all" | "in-progress" | "completed" | "not-started"
type SortMode = "recent" | "progress-desc" | "progress-asc" | "title"

const getFirstLessonId = (enrollment: EnrolledCourse): string => {
  const lessons = Array.isArray(enrollment.course?.lessons) ? enrollment.course.lessons : []
  if (lessons.length === 0) return enrollment.courseId

  const sorted = [...lessons].sort((a: any, b: any) => Number(a?.order || 0) - Number(b?.order || 0))
  return String(sorted[0]?.id || enrollment.courseId)
}

const normalizeProgress = (value: unknown): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(100, Math.round(parsed)))
}

const normalizeStatus = (value: unknown): string => {
  return String(value ?? "").trim().toLowerCase()
}

const isCompletedEnrollment = (enrollment: Pick<EnrolledCourse, "progress" | "status">): boolean => {
  const status = normalizeStatus(enrollment.status)
  return (
    enrollment.progress >= 100 ||
    status === "completed" ||
    status === "complete" ||
    status === "done" ||
    status === "finished"
  )
}

const isInProgressEnrollment = (enrollment: Pick<EnrolledCourse, "progress" | "status">): boolean => {
  if (isCompletedEnrollment(enrollment)) return false
  const status = normalizeStatus(enrollment.status)
  return enrollment.progress > 0 || status === "in-progress" || status === "in_progress" || status === "learning"
}

export default function MyCoursesPage() {
  const { t } = useLanguage()
  const { user } = useAuth()

  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterMode>("all")
  const [sortMode, setSortMode] = useState<SortMode>("recent")
  const [searchTerm, setSearchTerm] = useState("")
  const [pinnedCourses, setPinnedCourses] = useState<Set<string>>(new Set())

  const fetchEnrollments = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const enrollments = await apiClient.getMyEnrollments()
      const normalized: EnrolledCourse[] = Array.isArray(enrollments)
        ? enrollments
            .filter((item: any) => item?.course)
            .map((item: any) => ({
              ...item,
              progress: normalizeProgress(item?.progress),
              status: normalizeStatus(item?.status),
              course: {
                ...item.course,
                title: String(item.course?.title || t("mycourses_course", "Khóa học")),
                description: String(item.course?.description || ""),
                thumbnail: item.course?.thumbnail || "/image/logo-ics.jpg",
                teacher: item.course?.teacher || { name: t("mycourses_teacher", "Giảng viên") },
                lessons: Array.isArray(item.course?.lessons) ? item.course.lessons : [],
              },
            }))
        : []

      setCourses(normalized)
    } catch (error) {
      console.error("Error fetching enrollments:", error)
      setCourses([])
      if (error instanceof Error && !error.message.includes("status: 404")) {
        toast.error(t("mycourses_load_error", "Không thể tải danh sách khóa học"))
      }
    } finally {
      setLoading(false)
    }
  }, [t, user?.id])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchEnrollments()
      }
    }

    const handleFocus = () => {
      fetchEnrollments()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [fetchEnrollments])

  const togglePinCourse = (courseId: string) => {
    setPinnedCourses((prev) => {
      const next = new Set(prev)
      if (next.has(courseId)) {
        next.delete(courseId)
        toast.success(t("mycourses_unpinned", "Bỏ ghim khóa học"))
      } else {
        next.add(courseId)
        toast.success(t("mycourses_pinned", "Đã ghim khóa học"))
      }
      return next
    })
  }

  const handleRemoveCourse = () => {
    toast.info(t("mycourses_coming_soon", "Chức năng này sẽ được thêm sớm"))
  }

  const handleShareCourse = async (courseTitle: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: t("mycourses_share_title", "Khóa học ICS"),
          text: `${t("mycourses_share_text", "Hãy khám phá khóa học này")}: ${courseTitle}`,
          url: window.location.href,
        })
      } else {
        toast.info(t("mycourses_coming_soon", "Chức năng này sẽ được thêm sớm"))
      }
    } catch {
      toast.info(t("mycourses_share_cancelled", "Đã hủy chia sẻ"))
    }
  }

  const stats = useMemo(() => {
    const total = courses.length
    const completed = courses.filter((course) => isCompletedEnrollment(course)).length
    const inProgress = courses.filter((course) => isInProgressEnrollment(course)).length
    const notStarted = courses.filter((course) => course.progress === 0 && !isCompletedEnrollment(course)).length
    const avgProgress =
      total > 0 ? Math.round(courses.reduce((sum, course) => sum + normalizeProgress(course.progress), 0) / total) : 0

    return {
      total,
      completed,
      inProgress,
      notStarted,
      avgProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }, [courses])

  const pinnedList = useMemo(() => courses.filter((course) => pinnedCourses.has(course.id)).slice(0, 4), [courses, pinnedCourses])

  const recentlyJoined = useMemo(
    () =>
      [...courses]
        .sort((a, b) => new Date(b.enrolledAt || 0).getTime() - new Date(a.enrolledAt || 0).getTime())
        .slice(0, 4),
    [courses],
  )

  const filteredCourses = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    const byFilter = courses.filter((enrollment) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "in-progress" && isInProgressEnrollment(enrollment)) ||
        (filter === "completed" && isCompletedEnrollment(enrollment)) ||
        (filter === "not-started" && enrollment.progress === 0 && !isCompletedEnrollment(enrollment))

      if (!matchesFilter) return false

      if (!keyword) return true

      return (
        enrollment.course.title.toLowerCase().includes(keyword) ||
        String(enrollment.course.teacher?.name || "").toLowerCase().includes(keyword)
      )
    })

    const sorted = [...byFilter]

    sorted.sort((a, b) => {
      const aPinned = pinnedCourses.has(a.id)
      const bPinned = pinnedCourses.has(b.id)
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1

      switch (sortMode) {
        case "progress-desc":
          return b.progress - a.progress
        case "progress-asc":
          return a.progress - b.progress
        case "title":
          return a.course.title.localeCompare(b.course.title, "vi")
        case "recent":
        default:
          return new Date(b.enrolledAt || 0).getTime() - new Date(a.enrolledAt || 0).getTime()
      }
    })

    return sorted
  }, [courses, filter, pinnedCourses, searchTerm, sortMode])

  const filterTabs: Array<{ key: FilterMode; label: string; count: number; icon: React.ComponentType<{ className?: string }> }> = [
    { key: "all", label: t("mycourses_all", "Tất cả"), count: stats.total, icon: Layers3 },
    { key: "in-progress", label: t("mycourses_in_progress", "Đang học"), count: stats.inProgress, icon: PlayCircle },
    { key: "completed", label: t("mycourses_completed", "Hoàn thành"), count: stats.completed, icon: Trophy },
    { key: "not-started", label: t("mycourses_not_started", "Chưa bắt đầu"), count: stats.notStarted, icon: Clock3 },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-72 animate-pulse rounded-[2rem] bg-gradient-to-br from-slate-200 via-cyan-100 to-emerald-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-[540px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-[540px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <motion.div
        aria-hidden
        animate={{ y: [0, -12, 0], opacity: [0.2, 0.34, 0.2] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-500/10"
      />
      <motion.div
        aria-hidden
        animate={{ y: [0, 14, 0], opacity: [0.22, 0.3, 0.22] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        className="pointer-events-none absolute right-0 top-32 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/10"
      />

      <div className="relative mx-auto w-full max-w-[1600px] space-y-6 px-4 py-4 md:px-8 md:py-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
          className="relative overflow-hidden rounded-[2rem] border border-cyan-100/70 bg-white/85 p-6 shadow-[0_24px_60px_rgba(6,78,59,0.14)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 md:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(125%_100%_at_10%_0%,rgba(56,189,248,0.2),transparent_48%),radial-gradient(105%_100%_at_100%_0%,rgba(16,185,129,0.2),transparent_45%)]" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/70 bg-cyan-50/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-950/40 dark:text-cyan-200">
                <Sparkles className="h-4 w-4" />
                {t("mycourses_hero_badge", "Không gian học tập cá nhân")}
              </span>

              <div>
                <h1 className="text-3xl font-black leading-tight text-slate-900 dark:text-white md:text-5xl">
                  {t("mycourses_title", "Khóa học của tôi")}
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
                  {t(
                    "mycourses_hero_desc",
                    "Track progress, prioritize important courses, and continue learning with one tap.",
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    icon: Layers3,
                    label: t("mycourses_total_label", "Tổng cộng"),
                    value: stats.total,
                    color: "from-cyan-500/20 to-sky-500/20",
                  },
                  {
                    icon: PlayCircle,
                    label: t("mycourses_in_progress", "Đang học"),
                    value: stats.inProgress,
                    color: "from-blue-500/20 to-cyan-500/20",
                  },
                  {
                    icon: Trophy,
                    label: t("mycourses_completed", "Hoàn thành"),
                    value: stats.completed,
                    color: "from-emerald-500/20 to-green-500/20",
                  },
                  {
                    icon: Target,
                    label: t("mycourses_avg_progress", "Tiến độ TB"),
                    value: stats.avgProgress,
                    suffix: "%",
                    color: "from-amber-500/20 to-yellow-500/20",
                  },
                ].map((item, index) => (
                  <motion.article
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + index * 0.05 }}
                    whileHover={{ y: -3 }}
                    className={`rounded-xl border border-white/60 bg-gradient-to-br ${item.color} p-3 backdrop-blur dark:border-slate-700/60`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-600 dark:text-slate-300">{item.label}</p>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      <AnimatedNumber value={item.value} suffix={item.suffix} />
                    </p>
                  </motion.article>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white/65 p-5 backdrop-blur-lg dark:border-slate-700/60 dark:bg-slate-800/60">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t("mycourses_learning_pulse", "Nhịp học tuần này")}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-900/35 dark:text-orange-300">
                  <Flame className="h-3.5 w-3.5" />
                  {t("mycourses_on_fire", "Đang rất tốt")}
                </span>
              </div>

              <div className="mb-5 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completionRate}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500"
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-100/85 px-3 py-2 dark:bg-slate-900/70">
                  <span className="text-slate-600 dark:text-slate-300">{t("mycourses_completion_rate", "Tỉ lệ hoàn thành")}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{stats.completionRate}%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-100/85 px-3 py-2 dark:bg-slate-900/70">
                  <span className="text-slate-600 dark:text-slate-300">{t("mycourses_pinned_short", "Đang ghim")}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{pinnedList.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-100/85 px-3 py-2 dark:bg-slate-900/70">
                  <span className="text-slate-600 dark:text-slate-300">{t("mycourses_active_now", "Đang tiếp tục")}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{stats.inProgress}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_12px_35px_rgba(2,132,199,0.09)] backdrop-blur-lg dark:border-slate-800/70 dark:bg-slate-900/65"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t("mycourses_search", "Tìm kiếm khóa học hoặc giảng viên...")}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.2)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                    <Filter className="h-3.5 w-3.5" />
                    {t("mycourses_filter", "Bộ lọc")}
                  </span>
                  <UniversalSelect
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                    contentClassName="border-blue-500/30 bg-slate-950/92 text-slate-100 backdrop-blur-2xl shadow-[0_20px_50px_rgba(2,6,23,0.75)]"
                    portalled={true}
                  >
                    <option value="recent">{t("mycourses_sort_recent", "Mới nhất")}</option>
                    <option value="progress-desc">{t("mycourses_sort_progress_desc", "Tiến độ cao nhất")}</option>
                    <option value="progress-asc">{t("mycourses_sort_progress_asc", "Tiến độ thấp nhất")}</option>
                    <option value="title">{t("mycourses_sort_title", "Theo tên A-Z")}</option>
                  </UniversalSelect>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {filterTabs.map((tab) => {
                  const active = filter === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-cyan-500 bg-cyan-500 text-white shadow-[0_8px_24px_rgba(6,182,212,0.4)]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>

            {filteredCourses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-14 text-center dark:border-slate-800 dark:bg-slate-900/70"
              >
                <BookOpen size={52} className="mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 dark:text-slate-300">{t("mycourses_no_match", "Không có khóa học phù hợp")}</p>
                <Link
                  href="/courses"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                >
                  <Compass className="h-4 w-4" />
                  {t("mycourses_explore", "Khám phá khóa học")}
                </Link>
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredCourses.map((enrollment, idx) => {
                    const lessons = enrollment.course.lessons || []
                    const totalLessons = lessons.length
                    const completedLessons = Math.round((enrollment.progress / 100) * totalLessons)
                    const statusLabel = isCompletedEnrollment(enrollment)
                      ? t("mycourses_completed", "Hoàn thành")
                      : enrollment.progress === 0
                        ? t("mycourses_not_started", "Chưa bắt đầu")
                        : t("mycourses_in_progress", "Đang học")

                    const progressRing = {
                      background: `conic-gradient(#22c55e ${enrollment.progress * 3.6}deg, rgba(15,23,42,0.2) 0deg)`,
                    }

                    return (
                      <motion.article
                        layout
                        key={enrollment.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ delay: idx * 0.04, duration: 0.28 }}
                        whileHover={{ y: -7 }}
                        className="group relative z-10 overflow-visible rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.1)] transition-all hover:border-cyan-400/70 hover:shadow-[0_20px_45px_rgba(6,182,212,0.2)] dark:border-slate-800 dark:bg-slate-900/70"
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <motion.img
                            src={enrollment.course.thumbnail || "/image/logo-ics.jpg"}
                            alt={enrollment.course.title}
                            className="h-full w-full object-cover"
                            whileHover={{ scale: 1.06 }}
                            transition={{ duration: 0.45 }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/10 to-transparent" />

                          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/35 bg-black/35 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                            <Star className="h-3 w-3" />
                            {statusLabel}
                          </div>

                          <div className="absolute right-3 top-3 flex items-center gap-2">
                            {pinnedCourses.has(enrollment.id) ? (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-slate-900 shadow-md">
                                <Pin className="h-4 w-4 fill-current" />
                              </span>
                            ) : null}

                            <div className="relative h-10 w-10 rounded-full p-[3px]" style={progressRing}>
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-white/90 text-[11px] font-bold text-slate-900 dark:bg-slate-900 dark:text-white">
                                {enrollment.progress}
                              </div>
                            </div>
                          </div>

                          <p className="absolute bottom-3 left-3 text-xs font-medium text-white/95">
                            {t("mycourses_teacher", "Giảng viên")}: {enrollment.course.teacher?.name || t("mycourses_teacher", "Giảng viên")}
                          </p>
                        </div>

                        <div className="space-y-4 p-5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="line-clamp-2 text-base font-bold text-slate-900 dark:text-white">{enrollment.course.title}</h3>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="z-[100] w-48 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900/95"
                              >
                                <DropdownMenuItem
                                  onClick={() => togglePinCourse(enrollment.id)}
                                  className="gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                                >
                                  <Pin className="h-4 w-4" />
                                  {pinnedCourses.has(enrollment.id) ? t("mycourses_unpin", "Bỏ ghim") : t("mycourses_pin", "Ghim khóa học")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleShareCourse(enrollment.course.title)}
                                  className="gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                                >
                                  <Share2 className="h-4 w-4" />
                                  {t("mycourses_share", "Chia sẻ")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={handleRemoveCourse}
                                  variant="destructive"
                                  className="gap-2 rounded-lg px-3 py-2 text-sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {t("mycourses_delete", "Xóa")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50/85 p-3 dark:border-slate-800 dark:bg-slate-900/75">
                            <div className="mb-2 flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-500 dark:text-slate-400">{t("mycourses_progress", "Tiến độ")}</span>
                              <span className="font-bold text-slate-900 dark:text-white">{enrollment.progress}%</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${enrollment.progress}%` }}
                                transition={{ duration: 0.85, delay: 0.08 }}
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500"
                              />
                            </div>
                            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                              {completedLessons}/{totalLessons} {t("mycourses_lessons", "bài học")}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <Clock3 className="h-3.5 w-3.5" />
                              {new Date(enrollment.enrolledAt).toLocaleDateString("vi-VN")}
                            </div>
                            <Link
                              href={`/player/${getFirstLessonId(enrollment)}`}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(6,182,212,0.36)]"
                            >
                              <PlayCircle className="h-4 w-4" />
                              {t("mycourses_continue", "Tiếp tục học")}
                            </Link>
                          </div>
                        </div>
                      </motion.article>
                    )
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </section>

          <aside className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.1)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
            >
              <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">{t("mycourses_overview", "Tổng quan hoàn thành")}</h3>
              <div className="relative mx-auto mb-5 h-44 w-44">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="10" className="text-slate-200 dark:text-slate-700" fill="none" />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="url(#course-ring)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={314}
                    initial={{ strokeDashoffset: 314 }}
                    animate={{ strokeDashoffset: 314 - (314 * stats.completionRate) / 100 }}
                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <defs>
                    <linearGradient id="course-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    <AnimatedNumber value={stats.completionRate} suffix="%" />
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("mycourses_completed", "Hoàn thành")}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-900/80">
                  <span className="text-slate-600 dark:text-slate-300">{t("mycourses_total_label", "Tổng cộng")}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-cyan-50 px-3 py-2 dark:bg-cyan-900/25">
                  <span className="text-cyan-700 dark:text-cyan-300">{t("mycourses_in_progress", "Đang học")}</span>
                  <span className="font-bold text-cyan-700 dark:text-cyan-200">{stats.inProgress}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/25">
                  <span className="text-emerald-700 dark:text-emerald-300">{t("mycourses_completed", "Hoàn thành")}</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-200">{stats.completed}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 }}
              className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.1)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
            >
              <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">{t("mycourses_pinned_list", "Khóa học đã ghim")}</h3>
              <div className="space-y-2">
                {pinnedList.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {t("mycourses_no_pinned", "Chưa ghim khóa học nào")}
                  </p>
                ) : (
                  pinnedList.map((course) => (
                    <Link
                      key={`pinned-${course.id}`}
                      href={`/player/${getFirstLessonId(course)}`}
                      className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 transition hover:border-cyan-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-900"
                    >
                      <Pin className="h-4 w-4 text-amber-500" />
                      <p className="line-clamp-1 flex-1 text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white">
                        {course.course.title}
                      </p>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  ))
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.1)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
            >
              <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">{t("mycourses_recent", "Mới tham gia")}</h3>
              <div className="space-y-2">
                {recentlyJoined.map((course) => (
                  <Link
                    key={`recent-${course.id}`}
                    href={`/player/${getFirstLessonId(course)}`}
                    className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 transition hover:border-emerald-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:hover:bg-slate-900"
                  >
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white">
                        {course.course.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(course.enrolledAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  )
}
