"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Search, Star, MoreVertical, Pin, Trash2, Share2, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { UniversalSelect } from "@/components/ui/universal-select"

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
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [pinnedCourses, setPinnedCourses] = useState<Set<string>>(new Set())
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const fetchEnrollments = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const enrollments = await apiClient.getMyEnrollments()
      const normalized = Array.isArray(enrollments)
        ? enrollments.map((item: any) => ({
            ...item,
            progress: normalizeProgress(item?.progress),
            status: normalizeStatus(item?.status),
          }))
        : []
      setCourses(normalized)
    } catch (error) {
      console.error("Error fetching enrollments:", error)
      setCourses([])
      // Don't show error toast if it's just empty data
      if (error instanceof Error && !error.message.includes('status: 404')) {
        toast.error(t("mycourses_load_error", "Không thể tải danh sách khóa học"))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnrollments()
  }, [user?.id])

  // Handle click outside menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Refetch enrollments when page becomes visible (user returns from player/other pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchEnrollments()
      }
    }

    const handleFocus = () => {
      fetchEnrollments()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user?.id, t])

  const filteredCourses = courses.filter(enrollment => {
    const matchesFilter =
      filter === "all" ||
      (filter === "in-progress" && isInProgressEnrollment(enrollment)) ||
      (filter === "completed" && isCompletedEnrollment(enrollment)) ||
      (filter === "not-started" && enrollment.progress === 0 && !isCompletedEnrollment(enrollment))

    const matchesSearch = enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  }).sort((a, b) => {
    // Pinned courses first
    const aIsPinned = pinnedCourses.has(a.id)
    const bIsPinned = pinnedCourses.has(b.id)
    
    if (aIsPinned && !bIsPinned) return -1
    if (!aIsPinned && bIsPinned) return 1
    return 0
  })

  // Reset to page 1 when filter or search changes
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
  }

  const togglePinCourse = (courseId: string) => {
    setPinnedCourses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
        toast.success(t("mycourses_unpinned", "Bỏ ghim khóa học"))
      } else {
        newSet.add(courseId)
        toast.success(t("mycourses_pinned", "Đã ghim khóa học"))
      }
      return newSet
    })
    setOpenMenuId(null)
  }

  const handleRemoveCourse = () => {
    toast.info(t("mycourses_coming_soon", "Chức năng này sẽ được thêm sớm"))
    setOpenMenuId(null)
  }

  const handleShareCourse = (courseTitle: string) => {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: t("mycourses_share_title", "Khóa học ICS"),
        text: `${t("mycourses_share_text", "Hãy check out khóa học này")}: ${courseTitle}`,
        url: window.location.href
      })
    } else {
      toast.info(t("mycourses_coming_soon", "Chức năng này sẽ được thêm sớm"))
    }
    setOpenMenuId(null)
  }

  const stats = {
    total: courses.length,
    inProgress: courses.filter((course) => isInProgressEnrollment(course)).length,
    completed: courses.filter((course) => isCompletedEnrollment(course)).length,
    notStarted: courses.filter((course) => course.progress === 0 && !isCompletedEnrollment(course)).length,
  }

  const completedRatio = stats.total > 0 ? stats.completed / stats.total : 0

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm md:p-6 dark:border-slate-800 dark:bg-[#0b1223]/90"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl dark:text-white">{t("mycourses_title", "Khóa học của tôi")}</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("mycourses_total", "Tổng cộng")} <AnimatedNumber value={courses.length} /> {t("mycourses_courses_unit", "khóa học")}
              </p>
            </div>
            <div className="flex w-full items-center gap-3 md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder={t("mycourses_search", "Tìm kiếm...")}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <button className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-px hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white">
                <Star size={18} />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between md:p-6 dark:border-slate-800 dark:bg-[#0f172a]">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("mycourses_active", "Khóa học đang học")}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("mycourses_total", "Tổng cộng")} {filteredCourses.length} {t("mycourses_courses_unit", "khóa học")}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("mycourses_sort", "Sắp xếp theo")}</span>
                <UniversalSelect
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="border-0 bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
                  contentClassName="border-blue-500/30 bg-slate-950/92 text-slate-100 backdrop-blur-2xl shadow-[0_20px_50px_rgba(2,6,23,0.75)]"
                  portalled={true}
                >
                  <option value="all">{t("mycourses_all", "Tất cả")}</option>
                  <option value="in-progress">{t("mycourses_in_progress", "Đang học")}</option>
                  <option value="completed">{t("mycourses_completed", "Hoàn thành")}</option>
                  <option value="not-started">{t("mycourses_not_started", "Chưa bắt đầu")}</option>
                </UniversalSelect>
              </div>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((enrollment, idx) => {
                  const lessons = enrollment.course.lessons || []
                  const courseImage = enrollment.course.thumbnail || "/image/logo-ics.jpg"

                  return (
                    <motion.div
                      key={enrollment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.28, delay: idx * 0.04 }}
                      whileHover={{ y: -6 }}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:border-blue-500/60 dark:border-slate-800 dark:bg-[#0f172a] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
                    >
                      <motion.div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900" whileHover={{ scale: 1.03 }}>
                        <img src={courseImage} alt={enrollment.course.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-transparent to-transparent dark:from-[#0f172a]" />
                        {pinnedCourses.has(enrollment.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-3 top-3 rounded-full border border-yellow-400/40 bg-white/90 p-2 dark:bg-slate-900/85"
                          >
                            <Pin size={16} className="fill-yellow-400 text-yellow-400" />
                          </motion.div>
                        )}
                      </motion.div>

                      <div className="p-6">
                        <div className="mb-4 flex items-start justify-between gap-2">
                          <div>
                            <h3 className="line-clamp-2 text-base font-bold text-slate-900 dark:text-white">{enrollment.course.title}</h3>
                            <p className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                              {isCompletedEnrollment(enrollment)
                                ? t("mycourses_completed", "Hoàn thành")
                                : enrollment.progress === 0
                                  ? t("mycourses_not_started", "Chưa bắt đầu")
                                  : t("mycourses_in_progress", "Đang học")}
                            </p>
                          </div>
                          <div className="relative flex-shrink-0">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === enrollment.id ? null : enrollment.id)}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                              <MoreVertical size={16} />
                            </button>

                            <AnimatePresence>
                              {openMenuId === enrollment.id && (
                                <motion.div
                                  ref={menuRef}
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-xl dark:border-slate-700 dark:bg-slate-900/95"
                                >
                                  <button
                                    onClick={() => togglePinCourse(enrollment.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    {pinnedCourses.has(enrollment.id) ? t("mycourses_unpin", "Bỏ ghim") : t("mycourses_pin", "Ghim khóa học")}
                                  </button>
                                  <button
                                    onClick={() => handleShareCourse(enrollment.course.title)}
                                    className="w-full border-t border-slate-200 px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    {t("mycourses_share", "Chia sẻ")}
                                  </button>
                                  <button
                                    onClick={() => handleRemoveCourse()}
                                    className="w-full border-t border-slate-200 px-4 py-2 text-left text-sm text-red-500 transition hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-900/25"
                                  >
                                    {t("mycourses_delete", "Xóa")}
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("mycourses_progress", "Tiến độ")}</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{enrollment.progress}%</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#22c55e]"
                              initial={{ width: 0 }}
                              animate={{ width: `${enrollment.progress}%` }}
                              transition={{ duration: 0.7 }}
                            />
                          </div>
                          {lessons.length > 0 && (
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">+{lessons.length} {t("mycourses_more_lessons", "bài khác")}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-xs font-bold text-white">
                              {enrollment.course.teacher?.name?.charAt(0) || "T"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {enrollment.course.teacher?.name?.split(" ")[0] || t("mycourses_teacher", "Giảng viên")}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500">{t("mycourses_teacher", "Giảng viên")}</p>
                            </div>
                          </div>
                          <Link
                            href={`/player/${getFirstLessonId(enrollment)}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-px hover:shadow-[0_10px_25px_rgba(59,130,246,0.35)]"
                          >
                            ▶ {t("mycourses_continue", "Tiếp tục học")}
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-[#0f172a]">
                <BookOpen size={48} className="mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                <p className="text-slate-600 dark:text-slate-400">{t("mycourses_no_match", "Không có khóa học phù hợp")}</p>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-[#0f172a] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <h3 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">{t("mycourses_total_courses", "Tổng khóa học")}</h3>
              <div className="relative mb-6 flex items-center justify-center">
                <div className="h-44 w-44">
                  <svg viewBox="0 0 100 100" className="h-full w-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="8"
                      strokeDasharray="282.7"
                      strokeDashoffset={282.7 * (1 - completedRatio)}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      initial={{ strokeDashoffset: 282.7 }}
                      animate={{ strokeDashoffset: 282.7 * (1 - completedRatio) }}
                      transition={{ duration: 1 }}
                    />
                  </svg>
                </div>
                <div className="absolute text-center">
                  <p className="text-4xl font-bold text-slate-900 dark:text-white">{stats.completed}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t("mycourses_completed", "Hoàn thành")}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                  <span>{t("mycourses_total_label", "Tổng cộng")}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-blue-900/20 px-3 py-2 text-blue-300">
                  <span>{t("mycourses_in_progress", "Đang học")}</span>
                  <span className="font-semibold">{stats.inProgress}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-900/20 px-3 py-2 text-emerald-300">
                  <span>{t("mycourses_completed", "Hoàn thành")}</span>
                  <span className="font-semibold">{stats.completed}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
                  <span>{t("mycourses_not_started", "Chưa bắt đầu")}</span>
                  <span className="font-semibold">{stats.notStarted}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-[#0f172a] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">{t("mycourses_completed_list", "Đã hoàn thành")}</h3>
              <div className="space-y-3">
                {courses
                  .filter((course) => isCompletedEnrollment(course))
                  .slice(0, 5)
                  .map((enrollment) => (
                    <Link
                      key={enrollment.id}
                      href={`/player/${getFirstLessonId(enrollment)}`}
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-emerald-500/40 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                    >
                      <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white">{enrollment.course.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">{enrollment.course.teacher?.name?.split(" ")[0] || t("mycourses_teacher", "Giảng viên")}</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 transition group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-200" />
                    </Link>
                  ))}
                {courses.filter((course) => isCompletedEnrollment(course)).length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-500">{t("mycourses_none_completed", "Chưa hoàn thành khóa học nào")}</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
