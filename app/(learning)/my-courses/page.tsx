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
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900/60 border-b border-border dark:border-slate-800 px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">{t("mycourses_title", "Khóa học của tôi")}</h1>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("mycourses_search", "Tìm kiếm...")}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full md:w-auto pl-10 pr-4 py-2 bg-secondary dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0">
              <Star size={18} />
            </button>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="flex flex-col lg:flex-row gap-4 p-3 sm:p-4 md:p-6">
            {/* Courses Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 "
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 mb-8">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-foreground dark:text-white mb-1 md:mb-2">{t("mycourses_active", "Khóa học đang học")}</h2>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-slate-400">{t("mycourses_total", "Tổng cộng")} <AnimatedNumber value={courses.length} /> {t("mycourses_courses_unit", "khóa học")}</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg px-3 md:px-4 py-2 text-sm md:text-base">
                  <span className="text-sm font-medium text-foreground dark:text-white">{t("mycourses_sort", "Sắp xếp theo")}</span>
                  <UniversalSelect
                    value={filter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="bg-transparent border-0 focus:outline-none text-sm font-medium text-muted-foreground dark:text-slate-400"
                  >
                    <option value="all">{t("mycourses_all", "Tất cả")}</option>
                    <option value="in-progress">{t("mycourses_in_progress", "Đang học")}</option>
                    <option value="completed">{t("mycourses_completed", "Hoàn thành")}</option>
                    <option value="not-started">{t("mycourses_not_started", "Chưa bắt đầu")}</option>
                  </UniversalSelect>
                </div>
              </div>

              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredCourses.map((enrollment, idx) => {
                    const lessons = enrollment.course.lessons || []
                    const courseImage = enrollment.course.thumbnail || "/image/logo-ics.jpg"

                    return (
                      <motion.div
                        key={enrollment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ y: -4 }}
                        className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
                      >
                        {/* Header with image */}
                        <motion.div
                          className="relative aspect-video bg-gray-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden"
                          whileHover={{ scale: 1.05 }}
                        >
                          <img 
                            src={courseImage} 
                            alt={enrollment.course.title}
                            className="w-full h-full object-cover"
                          />
                          {pinnedCourses.has(enrollment.id) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-3 right-3 bg-white dark:bg-slate-900 rounded-full p-2 shadow-lg"
                            >
                              <Pin size={16} className="text-yellow-500 fill-yellow-500" />
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Card Content */}
                        <div className="p-4 md:p-6">
                          <div className="flex items-start justify-between mb-4 gap-2">
                            <div>
                              <h3 className="font-bold text-sm md:text-base text-foreground dark:text-white line-clamp-2 mb-1">
                                {enrollment.course.title}
                              </h3>
                              <p className="text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded inline-block">
                                {isCompletedEnrollment(enrollment)
                                  ? t("mycourses_completed", "Hoàn thành")
                                  : enrollment.progress === 0
                                    ? t("mycourses_not_started", "Chưa bắt đầu")
                                    : t("mycourses_in_progress", "Đang học")}
                              </p>
                            </div>
                            <div className="relative group flex-shrink-0">
                              <button 
                                onClick={() => setOpenMenuId(openMenuId === enrollment.id ? null : enrollment.id)}
                                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                              >
                                <MoreVertical size={16} />
                              </button>
                              
                              {/* Dropdown Menu */}
                              <AnimatePresence>
                                {openMenuId === enrollment.id && (
                                  <motion.div
                                    ref={menuRef}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 mt-1 bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden w-48"
                                  >
                                    <button
                                      onClick={() => togglePinCourse(enrollment.id)}
                                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-secondary dark:hover:bg-slate-700 transition-colors text-sm text-foreground dark:text-white"
                                    >
                                      <Pin size={16} />
                                      {pinnedCourses.has(enrollment.id) ? t("mycourses_unpin", "Bỏ ghim") : t("mycourses_pin", "Ghim khóa học")}
                                    </button>
                                    <button
                                      onClick={() => handleShareCourse(enrollment.course.title)}
                                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-secondary dark:hover:bg-slate-700 transition-colors text-sm text-foreground dark:text-white border-t border-border dark:border-slate-700"
                                    >
                                      <Share2 size={16} />
                                      {t("mycourses_share", "Chia sẻ")}
                                    </button>
                                    <button
                                      onClick={() => handleRemoveCourse()}
                                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm text-red-600 dark:text-red-400 border-t border-border dark:border-slate-700"
                                    >
                                      <Trash2 size={16} />
                                      {t("mycourses_delete", "Xóa")}
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          {/* Lessons Preview */}
                          <div className="space-y-2 mb-4">
                            {lessons.length > 0 && (
                              <p className="text-xs text-primary dark:text-accent font-medium">+{lessons.length} {t("mycourses_more_lessons", "bài khác")}</p>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-foreground dark:text-white">{t("mycourses_progress", "Tiến độ")}</span>
                              <span className="text-xs font-bold text-primary dark:text-accent">{enrollment.progress}%</span>
                            </div>
                            <div className="h-2 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${enrollment.progress}%` }}
                                transition={{ duration: 0.6 }}
                              />
                            </div>
                          </div>

                          {/* Teacher and Avatars */}
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-4 border-t border-border dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {enrollment.course.teacher?.name?.charAt(0) || "T"}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground dark:text-white">
                                  {enrollment.course.teacher?.name?.split(" ")[0] || t("mycourses_teacher", "Giảng viên")}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-slate-400">{t("mycourses_teacher", "Giảng viên")}</p>
                              </div>
                            </div>
                            <Link
                              href={`/player/${getFirstLessonId(enrollment)}`}
                              className="flex items-center gap-1 text-primary dark:text-accent hover:gap-2 transition-all text-xs font-medium whitespace-nowrap"
                            >
                              {t("mycourses_continue", "Tiếp tục")}
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
                  <p className="text-muted-foreground dark:text-slate-400">{t("mycourses_no_match", "Không có khóa học phù hợp")}</p>
                </div>
              )}
            </motion.div>

            {/* Right Sidebar - Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full lg:w-80 space-y-4 lg:space-y-6 flex flex-col"
            >
              {/* Total Project Card */}
              <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-lg">
                <h3 className="text-base md:text-lg font-bold text-foreground dark:text-white mb-4 md:mb-6">{t("mycourses_total_courses", "Tổng khóa học")}</h3>
                <div className="flex items-center justify-center mb-4 md:mb-6 relative">
                  <div className="w-32 h-32 md:w-48 md:h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="8"
                        strokeDasharray={`${completedRatio * 282.7} 282.7`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <circle cx="50" cy="50" r="35" fill="white" className="dark:fill-slate-900" />
                    </svg>
                  </div>
                  <div className="absolute text-center">
                    <p className="text-2xl md:text-4xl font-bold text-foreground dark:text-white">{stats.completed}</p>
                    <p className="text-xs md:text-sm text-muted-foreground dark:text-slate-400">{t("mycourses_completed", "Hoàn thành")}</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs md:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground dark:text-slate-400">{t("mycourses_total_label", "Tổng cộng")}: {stats.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground dark:text-slate-400">{t("mycourses_in_progress", "Đang học")}: {stats.inProgress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground dark:text-slate-400">{t("mycourses_not_started", "Chưa bắt đầu")}: {stats.notStarted}</span>
                  </div>
                </div>
              </div>

              {/* Completed Courses List */}
              <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-lg min-h-auto lg:min-h-[350px]">
                <h3 className="text-base md:text-lg font-bold text-foreground dark:text-white mb-4 md:mb-6">{t("mycourses_completed_list", "Đã hoàn thành")}</h3>
                <div className="space-y-3 md:space-y-4">
                  {courses
                    .filter((course) => isCompletedEnrollment(course))
                    .map((enrollment) => (
                      <Link
                        key={enrollment.id}
                        href={`/player/${getFirstLessonId(enrollment)}`}
                        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                            {enrollment.course.title}
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">
                            {enrollment.course.teacher?.name?.split(" ")[0] || t("mycourses_teacher", "Giảng viên")}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  {courses.filter((course) => isCompletedEnrollment(course)).length === 0 && (
                    <p className="text-sm text-muted-foreground dark:text-slate-400 text-center py-6">{t("mycourses_none_completed", "Chưa hoàn thành khóa học nào")}</p>
                  )}
                </div>
              </div>

              {/* Buy More Courses */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 md:p-8 shadow-lg text-white flex flex-col justify-center">
                <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-3">{t("mycourses_buy_more", "Mua thêm khóa học")}</h3>
                <p className="text-sm md:text-base text-white/90 mb-4 md:mb-6">{t("mycourses_buy_desc", "Khám phá các khóa học mới và nâng cao kỹ năng của bạn")}</p>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-all w-full text-sm md:text-base"
                >
                  <BookOpen size={16} className="md:w-[18px] md:h-[18px]" />
                  {t("mycourses_discover_courses", "Khám phá khóa học")}
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
