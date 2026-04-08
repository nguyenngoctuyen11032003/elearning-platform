"use client"

import { useState, useRef, useEffect } from "react"
import { Edit, Trash2, Eye, Search, MoreVertical, CheckCircle, Clock, XCircle, BookOpen, Users, DollarSign, Star, X, AlertCircle, BarChart3, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/admin-modals"
import { formatStudentCount, formatPrice, formatCurrencyByLanguage } from "@/lib/format"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authFetch } from "@/lib/authfetch"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"
import { UniversalSelect } from "@/components/ui/universal-select"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { useMetricChangeHighlight } from "@/hooks/use-metric-change-highlight"
import { MetricTrendBadge } from "@/components/ui/metric-trend-badge"

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  instructorEmail: string
  students: number
  revenue: number
  price: number
  status: "draft" | "pending" | "rejected" | "published" | "archived"
  createdAt: string
  category: string
  thumbnail: string
  lessons: number
  duration: string
  rating: number
  reviewCount: number
  rejectionReason?: string
  sourceCourseId?: string
}

export default function AdminCoursesPage() {
  const MAX_REJECTION_REASON_LENGTH = 400
  const { t, language } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "edit" | "reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [editStatus, setEditStatus] = useState<Course["status"]>("pending")
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const rejectReasonRef = useRef<HTMLTextAreaElement | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    action: string
    courseId?: string
  }>({ isOpen: false, action: "" })

  const normalizeDateValue = (value: unknown): string | undefined => {
    if (value == null) return undefined

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? undefined : value.toISOString()
    }

    if (typeof value === "number") {
      const ms = value > 1_000_000_000_000 ? value : value * 1000
      const d = new Date(ms)
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
    }

    if (typeof value === "string") {
      const trimmed = value.trim()
      if (!trimmed) return undefined

      if (/^\d+$/.test(trimmed)) {
        const numeric = Number(trimmed)
        const ms = numeric > 1_000_000_000_000 ? numeric : numeric * 1000
        const d = new Date(ms)
        if (!Number.isNaN(d.getTime())) return d.toISOString()
      }

      const d = new Date(trimmed)
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
    }

    if (typeof value === "object") {
      const maybeDate = (value as { $date?: unknown }).$date
      if (maybeDate !== undefined) {
        return normalizeDateValue(maybeDate)
      }
    }

    return undefined
  }

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true)
      try {
        const res = await authFetch("/admin/courses")
        if (!res.ok) throw new Error()
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.data || []
        const mapped: Course[] = list.map((c: Record<string, unknown>) => ({
          status: (c.status === "approved" ? "published" : c.status) as Course["status"],
          id: c.id as string,
          title: c.title as string,
          description: (c.description as string) || "",
          instructor: (c.teacher as Record<string, unknown>)
            ? `${(c.teacher as Record<string, unknown>).firstName || ""} ${(c.teacher as Record<string, unknown>).lastName || ""}`.trim()
            : "—",
          instructorEmail: ((c.teacher as Record<string, unknown>)?.email as string) || "",
          students: (c.enrollmentCount as number) || 0,
          revenue: (c.revenue as number) || 0,
          price: (c.price as number) || 0,
          createdAt:
            normalizeDateValue(
              c.createdAt ?? c.created_at ?? c.publishedAt ?? c.updatedAt,
            ) || "",
          category: ((c.category as Record<string, unknown>)?.name as string) || "",
          thumbnail: (c.thumbnail as string) || "",
          lessons: (c.lessonCount as number) || 0,
          duration: "",
          rating: (c.averageRating as number) || 0,
          reviewCount: (c.reviewCount as number) || 0,
          rejectionReason: (c.rejectionReason as string) || undefined,
          sourceCourseId: (c.sourceCourseId as string) || undefined,
        }))
        setCourses(mapped)
      } catch {
        toast.error(t("adm_courses_load_err", "Không thể tải danh sách khóa học"))
      } finally {
        setIsLoading(false)
      }
    }
    fetchCourses()
    const timer = setInterval(() => {
      void fetchCourses()
    }, 45000)
    return () => clearInterval(timer)
  }, [])

  const filteredCourses = courses.filter(
    (course) =>
      (course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || course.status === statusFilter),
  )

  const canModerateCourse = (status: Course["status"]) => status === "pending"

  const getEditableStatusOptions = (currentStatus: Course["status"]) => {
    const statusText = {
      pending: t("adm_courses_pending", "Chờ duyệt"),
      published: t("adm_courses_approved_label", "Đã duyệt"),
      rejected: t("adm_courses_rejected_label", "Từ chối"),
    }

    const transitionMap: Record<Course["status"], Array<"pending" | "published" | "rejected">> = {
      pending: ["published", "rejected"],
      published: ["rejected", "pending"],
      rejected: ["published", "pending"],
      draft: ["pending", "rejected"],
      archived: ["pending", "rejected"],
    }

    return (transitionMap[currentStatus] || ["pending", "rejected"]).map((value) => ({
      value,
      label: statusText[value],
    }))
  }

  useEffect(() => {
    if (viewMode !== "edit" || editStatus !== "rejected") return
    const timer = window.setTimeout(() => {
      rejectReasonRef.current?.focus()
    }, 30)
    return () => window.clearTimeout(timer)
  }, [viewMode, editStatus])

  // Stats
  const totalCourses = courses.length
  const pendingCourses = courses.filter(c => canModerateCourse(c.status)).length
  const publishedCourses = courses.filter(c => c.status === "published").length
  const rejectedCourses = courses.filter(c => c.status === "rejected").length

  const courseOverviewMetrics = {
    totalCourses,
    pendingCourses,
    publishedCourses,
    rejectedCourses,
  }

  const { isChanged: isOverviewChanged, getTrend: getOverviewTrend } = useMetricChangeHighlight(courseOverviewMetrics, {
    flashDurationMs: 1300,
  })

  const handleCourseAction = (action: string, courseId: string, course?: Course) => {
    setSelectedCourse(course || null)
    if (action === "view") {
      setViewMode("view")
    } else if (action === "edit") {
      setViewMode("edit")
      setRejectionReason(course?.rejectionReason || "")
      const nextOptions = getEditableStatusOptions(course?.status || "pending")
      setEditStatus(nextOptions[0]?.value || "pending")
    } else if (action === "reject") {
      setViewMode("reject")
      setRejectionReason("")
    } else {
      setConfirmDialog({ isOpen: true, action, courseId })
    }
    setOpenMenu(null)
  }

  const executeCourseAction = async () => {
    const { action, courseId } = confirmDialog
    try {
      if (action === "approve") {
        const res = await authFetch(`/courses/${courseId}/approve`, { method: "PATCH" })
        if (!res.ok) throw new Error()
        setCourses(courses.map((c) => (c.id === courseId ? { ...c, status: "published" as const } : c)))
        toast.success(t("adm_courses_approved", "Đã duyệt khóa học!"))
      } else if (action === "delete") {
        const res = await authFetch(`/courses/${courseId}`, { method: "DELETE" })
        if (!res.ok) throw new Error()
        setCourses(courses.filter((c) => c.id !== courseId))
        toast.success(t("adm_courses_deleted", "Đã xóa khóa học!"))
      }
    } catch {
      toast.error(t("adm_courses_action_fail", "Thao tác thất bại"))
    }
    setConfirmDialog({ isOpen: false, action: "" })
  }

  const handleReject = async () => {
    if (!selectedCourse || !rejectionReason.trim()) return
    try {
      const res = await authFetch(`/courses/${selectedCourse.id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason: rejectionReason }),
      })
      if (!res.ok) throw new Error()
      setCourses(courses.map(c =>
        c.id === selectedCourse.id
          ? { ...c, status: "rejected" as const, rejectionReason }
          : c
      ))
      toast.success(t("adm_courses_rejected", "Đã từ chối khóa học"))
    } catch {
      toast.error(t("adm_courses_action_fail", "Thao tác thất bại"))
    }
    setViewMode(null)
    setSelectedCourse(null)
    setRejectionReason("")
  }

  const handleSaveEdit = async () => {
    if (!selectedCourse) return

    const normalizedStatus = editStatus
    const allowedStatuses: Course["status"][] = ["pending", "rejected", "published"]

    if (!allowedStatuses.includes(normalizedStatus)) {
      toast.error(t("adm_courses_status_invalid", "Trạng thái không hợp lệ"))
      return
    }

    const reason = rejectionReason.trim()
    if (normalizedStatus === "rejected" && !reason) {
      toast.error(t("adm_courses_reject_reason_required", "Vui lòng nhập lý do từ chối"))
      return
    }

    setIsSavingEdit(true)
    try {
      if (normalizedStatus === "rejected") {
        const rejectRes = await authFetch(`/courses/${selectedCourse.id}/reject`, {
          method: "PATCH",
          body: JSON.stringify({ reason }),
        })
        if (!rejectRes.ok) throw new Error()
      } else if (normalizedStatus === "published") {
        const approveRes = await authFetch(`/courses/${selectedCourse.id}/approve`, { method: "PATCH" })
        if (!approveRes.ok) throw new Error()
      } else {
        await apiClient.updateCourse(selectedCourse.id, { status: normalizedStatus })
      }

      setCourses((prev) =>
        prev.map((course) =>
          course.id === selectedCourse.id
            ? {
                ...course,
                status: normalizedStatus,
                rejectionReason: normalizedStatus === "rejected" ? reason : undefined,
              }
            : course,
        ),
      )

      toast.success(t("adm_courses_status_updated", "Đã cập nhật trạng thái khóa học"))
      setViewMode(null)
      setSelectedCourse(null)
      setRejectionReason("")
      setEditStatus("pending")
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : t("adm_courses_action_fail", "Thao tác thất bại")
      toast.error(message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const formatDate = (dateString: string) => {
    const normalized = normalizeDateValue(dateString)
    if (!normalized) return t("common_not_updated", "Chưa cập nhật")

    const parsed = new Date(normalized)
    if (Number.isNaN(parsed.getTime())) {
      return t("common_not_updated", "Chưa cập nhật")
    }

    return parsed.toLocaleDateString(language === "en" ? "en-US" : "vi-VN", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  useEffect(() => {
    if (!openMenu) return

    const handlePointerDownOutside = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return

      if (menuRef.current?.contains(target)) return

      const targetElement = target as HTMLElement
      if (targetElement.closest('[data-course-menu-trigger="true"]')) return

      setOpenMenu(null)
      setMenuPos(null)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpenMenu(null)
      setMenuPos(null)
    }

    document.addEventListener("mousedown", handlePointerDownOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [openMenu])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-700/40">
            <CheckCircle size={14} /> {t("adm_courses_approved_label", "Đã duyệt")}
          </span>
        )
      case "pending":
        return (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/40">
            <Clock size={14} /> {t("adm_courses_pending", "Chờ duyệt")}
          </span>
        )
      case "draft":
        return (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock size={14} /> {t("adm_courses_draft", "Nháp")}
          </span>
        )
      case "archived":
        return (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <XCircle size={14} /> {t("adm_courses_archived", "Đã lưu trữ")}
          </span>
        )
      case "rejected":
        return (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit bg-rose-50 dark:bg-rose-900/25 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-700/40">
            <XCircle size={14} /> {t("adm_courses_rejected_label", "Từ chối")}
          </span>
        )
      default:
        return (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bgr_course.jpg?v=20260406-1')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("adm_courses_title", "Quản lý khóa học")}</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">{t("adm_courses_subtitle", "Xem xét, duyệt và quản lý các khóa học từ giảng viên")}</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="rounded-2xl border border-white/40 dark:border-slate-700/60 bg-white/15 dark:bg-slate-900/30 backdrop-blur-sm p-4 md:p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("totalCourses") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_courses_total", "Tổng khóa học")}</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white mt-1"><AnimatedNumber value={totalCourses} disableAnimation={!isOverviewChanged("totalCourses")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("totalCourses")} />
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("pendingCourses") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_courses_pending", "Chờ duyệt")}</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1"><AnimatedNumber value={pendingCourses} disableAnimation={!isOverviewChanged("pendingCourses")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("pendingCourses")} />
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("publishedCourses") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_courses_approved_label", "Đã duyệt")}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1"><AnimatedNumber value={publishedCourses} disableAnimation={!isOverviewChanged("publishedCourses")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("publishedCourses")} />
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("rejectedCourses") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_courses_rejected_label", "Từ chối")}</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1"><AnimatedNumber value={rejectedCourses} disableAnimation={!isOverviewChanged("rejectedCourses")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("rejectedCourses")} />
                  </div>
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <XCircle size={20} className="text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="relative z-50 bg-white/85 dark:bg-slate-900/55 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/70 rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400" size={20} />
            <input
              type="text"
              placeholder={t("adm_courses_search", "Tìm kiếm khóa học hoặc giảng viên...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary dark:focus:border-accent transition-all duration-300 text-foreground dark:text-white placeholder:text-muted-foreground/60 shadow-sm"
            />
          </div>
          <div className="filter-row gap-y-3 sm:gap-y-4">
            <span className="text-sm font-semibold text-foreground dark:text-white">{t("common_filter_by", "Lọc theo")}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select h-[46px] w-full sm:w-auto min-w-[220px] md:min-w-[240px] lg:min-w-[260px] rounded-xl px-4 text-sm"
            >
              <option value="all">{t("adm_courses_all", "Tất cả")}</option>
              <option value="pending">{t("adm_courses_pending", "Chờ duyệt")}</option>
              <option value="published">{t("adm_courses_approved_label", "Đã duyệt")}</option>
              <option value="rejected">{t("adm_courses_rejected_label", "Từ chối")}</option>
            </select>
            {(searchTerm.trim() || statusFilter !== "all") ? (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                }}
                className="h-[46px] w-full sm:w-auto md:min-w-[132px] lg:min-w-[148px] inline-flex items-center justify-center px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {t("common_reset", "Đặt lại")}
              </button>
            ) : null}
          </div>
        </div>

        {/* Courses Table (Desktop) */}
        <div className="hidden xl:block bg-white/90 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden animate-slideUp shadow-[0_10px_28px_rgba(15,23,42,0.12)] w-full" style={{ animationDelay: "0.2s" }}>
          <div className="relative w-full">
            <table className="w-full min-w-[500px] text-sm table-fixed">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-white/50 dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("adm_courses_col_course", "Khóa học")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("adm_courses_col_instructor", "Giảng viên")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("adm_courses_col_category", "Danh mục")}</th>
                  <th className="px-6 py-4 min-w-[120px]">{t("adm_courses_col_price", "Giá")}</th>
                  <th className="px-6 py-4 min-w-[100px]">{t("adm_courses_col_students", "Học viên")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("adm_courses_col_status", "Trạng thái")}</th>
                  <th className="px-6 py-4 min-w-[100px]">{t("adm_courses_col_date", "Ngày tạo")}</th>
                  <th className="min-w-[140px] bg-slate-50/90 dark:bg-slate-900/90 text-left py-4 px-6 font-semibold text-slate-700 dark:text-slate-200">
                    {t("adm_courses_actions", "Hành động")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/55 transition-colors duration-300"
                  >
                    <td className="py-5 px-6" data-label={t("adm_courses_col_course", "Khóa học")}>
                      <div className="flex items-center gap-4">
                        <img
                          src={course.thumbnail || "/image/course-placeholder.png"}
                          alt={course.title}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-800"
                        />
                        <div>
                          <p className="text-foreground dark:text-white font-medium leading-7 line-clamp-2 break-words">{course.title}</p>
                          {course.sourceCourseId && (
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-600 dark:text-amber-300">
                              {t("adm_courses_revision_label", "Phiên bản chỉnh sửa")}
                            </p>
                          )}
                          <p className="text-muted-foreground dark:text-slate-400 text-xs"><AnimatedNumber value={course.lessons} durationMs={320} /> {t("adm_courses_lessons_unit", "bài học")} • {course.duration}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-muted-foreground dark:text-slate-400" data-label={t("adm_courses_col_instructor", "Giảng viên")}>{course.instructor}</td>
                    <td className="py-5 px-6" data-label={t("adm_courses_col_category", "Danh mục")}> 
                      <span className="px-2.5 py-1.5 bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800/60 rounded-lg text-sky-700 dark:text-sky-300 text-xs font-medium">
                        {course.category}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-foreground dark:text-white font-medium" data-label={t("adm_courses_col_price", "Giá")}>
                      <AnimatedNumber value={course.price} formatter={(value: number) => formatCurrencyByLanguage(value, language)} durationMs={360} />
                    </td>
                    <td className="py-5 px-6 text-foreground dark:text-white" data-label={t("adm_courses_col_students", "Học viên")}><AnimatedNumber value={course.students} formatter={formatStudentCount} durationMs={340} /></td>
                    <td className="py-5 px-6" data-label={t("adm_courses_col_status", "Trạng thái")}>{getStatusBadge(course.status)}</td>
                    <td className="py-5 px-6 text-muted-foreground dark:text-slate-400" data-label={t("adm_courses_col_date", "Ngày tạo")}>{formatDate(course.createdAt)}</td>
                    <td className="py-5 px-6 relative">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="p-2 rounded-xl border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/35 transition-colors"
                          title={t("adm_courses_view_details", "Xem chi tiết khóa học")}
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          data-course-menu-trigger="true"
                          onClick={e => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const menuWidth = 208; // min-w-52 = 13rem = 208px
                            let left = rect.right - menuWidth;
                            if (left < 8) left = 8;
                            if (left + menuWidth > window.innerWidth - 8) {
                              left = window.innerWidth - menuWidth - 8;
                            }
                            setMenuPos({
                              x: left + window.scrollX,
                              y: rect.bottom + window.scrollY,
                            });
                            setOpenMenu(course.id);
                          }}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <MoreVertical size={18} className="text-slate-500 dark:text-slate-300" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="py-12 text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">{t("adm_courses_not_found", "Không tìm thấy khóa học nào")}</p>
            </div>
          )}
        </div>

        {/* Courses Card Layout (Mobile/Tablet) */}
        <div className="block xl:hidden space-y-5">
          {filteredCourses.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">{t("adm_courses_not_found", "Không tìm thấy khóa học nào")}</p>
            </div>
          ) : (
            filteredCourses.map(course => (
              <div key={course.id} className="bg-white/95 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
                <div className="flex gap-3">
                  <img className="w-12 h-12 rounded-lg object-cover" src={course.thumbnail || "/image/course-placeholder.png"} alt={course.title} />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white line-clamp-2">{course.title}</p>
                    {course.sourceCourseId && (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-600 dark:text-amber-300">
                        {t("adm_courses_revision_label", "Phiên bản chỉnh sửa")}
                      </p>
                    )}
                    <p className="text-xs text-slate-500/80 dark:text-slate-500/80">{course.instructor}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500/80 dark:text-slate-500/80">{t("adm_courses_col_price", "Giá")}</p>
                    <p className="font-medium text-slate-800 dark:text-slate-100"><AnimatedNumber value={course.price} formatter={(value: number) => formatCurrencyByLanguage(value, language)} durationMs={340} /></p>
                  </div>
                  <div>
                    <p className="text-slate-500/80 dark:text-slate-500/80">{t("adm_courses_students", "Học viên")}</p>
                    <p className="text-slate-800 dark:text-slate-100"><AnimatedNumber value={course.students} formatter={formatStudentCount} durationMs={340} /></p>
                  </div>
                  <div>
                    <p className="text-slate-500/80 dark:text-slate-500/80">{t("adm_courses_col_status", "Trạng thái")}</p>
                    {getStatusBadge(course.status)}
                  </div>
                  <div>
                    <p className="text-slate-500/80 dark:text-slate-500/80">{t("adm_courses_col_date", "Ngày tạo")}</p>
                    <p className="text-slate-700 dark:text-slate-200">{formatDate(course.createdAt)}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="flex-1 bg-blue-50 dark:bg-blue-900/25 border border-blue-100 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 py-2 rounded-xl flex items-center justify-center gap-1 font-medium"
                    title={t("adm_courses_view_details", "Xem chi tiết khóa học")}
                  >
                    <Eye size={16} />
                    {t("adm_courses_view_details", "Chi tiết")}
                  </Link>
                  <button
                    data-course-menu-trigger="true"
                    className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const menuWidth = 208;
                      let left = rect.right - menuWidth;
                      if (left < 8) left = 8;
                      if (left + menuWidth > window.innerWidth - 8) {
                        left = window.innerWidth - menuWidth - 8;
                      }
                      setMenuPos({
                        x: left + window.scrollX,
                        y: rect.bottom + window.scrollY,
                      });
                      setOpenMenu(course.id);
                    }}
                  >
                    <MoreVertical size={18} className="text-slate-600 dark:text-slate-300" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Menu rendered OUTSIDE table for correct overlay */}
      {openMenu && menuPos && (
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-white/95 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_18px_44px_rgba(15,23,42,0.18)] min-w-52 overflow-hidden"
          style={{ top: menuPos.y + 8, left: menuPos.x }}
        >
          <Link
            href={`/admin/courses/${openMenu}`}
            className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-white"
            onClick={() => { setOpenMenu(null); setMenuPos(null); }}
          >
            <Eye size={16} /> <span className="font-medium">{t("adm_courses_full_detail", "Chi tiết đầy đủ")}</span>
          </Link>
          <button
            onClick={() => {
              const course = filteredCourses.find(c => c.id === openMenu)
              if (course) {
                handleCourseAction("edit", course.id, course)
              }
              setOpenMenu(null)
              setMenuPos(null)
            }}
            className="w-full text-left px-4 py-3 hover:bg-sky-50 dark:hover:bg-sky-900/20 flex items-center gap-2 text-sky-700 dark:text-sky-300 border-t border-slate-200 dark:border-slate-800"
          >
            <Edit size={16} /> <span className="font-medium">{t("adm_courses_edit_status", "Sửa trạng thái")}</span>
          </button>
          {(() => {
            const course = filteredCourses.find(c => c.id === openMenu);
            if (course && canModerateCourse(course.status)) return <>
              <button
                onClick={() => {
                  handleCourseAction("approve", course.id, course);
                  setOpenMenu(null);
                  setMenuPos(null);
                }}
                className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2 text-emerald-600 dark:text-emerald-300 border-t border-slate-200 dark:border-slate-800"
              >
                <CheckCircle size={16} /> <span className="font-medium">{t("adm_courses_approve", "Duyệt khóa học")}</span>
              </button>
              <button
                onClick={() => {
                  handleCourseAction("reject", course.id, course);
                  setOpenMenu(null);
                  setMenuPos(null);
                }}
                className="w-full text-left px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2 text-amber-600 dark:text-amber-300 border-t border-slate-200 dark:border-slate-800"
              >
                <XCircle size={16} /> <span className="font-medium">{t("adm_courses_rejected_label", "Từ chối")}</span>
              </button>
            </>;
            return null;
          })()}
          <button
            onClick={() => {
              const course = filteredCourses.find(c => c.id === openMenu);
              if (course) handleCourseAction("delete", course.id, course);
              setOpenMenu(null);
              setMenuPos(null);
            }}
            className="w-full text-left px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 text-rose-600 dark:text-rose-300 border-t border-slate-200 dark:border-slate-800"
          >
            <Trash2 size={16} /> <span className="font-medium">{t("adm_courses_delete", "Xóa khóa học")}</span>
          </button>
        </div>
      )}

      {viewMode === "view" && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_30px_70px_rgba(15,23,42,0.24)] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 md:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-[0_10px_25px_rgba(14,165,233,0.35)]">
                  <BookOpen className="text-white" size={20} />
                </div>
                <h2 className="text-xl font-bold text-foreground dark:text-white">{t("adm_courses_preview_title", "Xem trước khóa học")}</h2>
              </div>
              <button
                onClick={() => { setViewMode(null); setSelectedCourse(null); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Course Header */}
              <div className="bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-slate-800/70 dark:to-slate-800/50 border border-sky-100 dark:border-slate-700 p-4 md:p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  <img
                    src={selectedCourse.thumbnail || "/image/course-placeholder.png"}
                    alt={selectedCourse.title}
                    className="w-full md:w-48 h-40 md:h-32 rounded-xl object-cover bg-slate-100 dark:bg-slate-800"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold break-words mb-2 text-foreground dark:text-white">
                      {selectedCourse.title}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground dark:text-slate-400 leading-relaxed">
                      {selectedCourse.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejection Reason if rejected */}
              {selectedCourse.status === "rejected" && selectedCourse.rejectionReason && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-red-600 dark:text-red-400 mb-2">{t("adm_courses_reject_reason", "Lý do từ chối")}</h5>
                      <p className="text-red-500 dark:text-red-300 leading-relaxed">{selectedCourse.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Course Performance */}
              <div>
                <h4 className="text-lg font-semibold text-foreground dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-sky-600 dark:text-sky-300" />
                  {t("adm_courses_performance", "Hiệu quả khóa học")}
                </h4>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/45 p-5 rounded-2xl">
                    <Users size={24} className="text-blue-500 mb-3" />
                    <p className="text-3xl font-bold text-foreground dark:text-white"><AnimatedNumber value={selectedCourse.students} formatter={formatStudentCount} durationMs={420} /></p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">{t("adm_courses_students", "Học viên")}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/45 p-5 rounded-2xl">
                    <BookOpen size={24} className="text-green-500 mb-3" />
                    <p className="text-3xl font-bold text-foreground dark:text-white"><AnimatedNumber value={selectedCourse.lessons} durationMs={420} /></p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">{t("adm_courses_lessons", "Bài học")}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/45 p-5 rounded-2xl">
                    <Star size={24} className="text-yellow-500 mb-3" />
                    <p className="text-3xl font-bold text-foreground dark:text-white">{selectedCourse.rating ? <AnimatedNumber value={selectedCourse.rating} formatter={(value: number) => value.toFixed(1)} durationMs={420} /> : "N/A"}</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1"><AnimatedNumber value={selectedCourse.reviewCount} durationMs={340} /> {t("adm_courses_reviews", "đánh giá")}</p>
                  </div>
                  <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/45 p-5 rounded-2xl">
                    <DollarSign size={24} className="text-purple-500 mb-3" />
                    <p className="text-3xl font-bold text-foreground dark:text-white">₫<AnimatedNumber value={selectedCourse.revenue / 1000000} formatter={(value: number) => value.toFixed(1)} durationMs={420} />M</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">{t("adm_courses_revenue", "Doanh thu")}</p>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div>
                <h4 className="text-lg font-semibold text-foreground dark:text-white mb-4">{t("adm_courses_detail_info", "Thông tin chi tiết")}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2 flex items-center gap-2">
                      <Users size={16} />
                      {t("adm_courses_col_instructor", "Giảng viên")}
                    </p>
                    <p className="text-foreground dark:text-white font-semibold">{selectedCourse.instructor}</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{selectedCourse.instructorEmail}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2 flex items-center gap-2">
                      <DollarSign size={16} />
                      {t("adm_courses_price_label", "Giá khóa học")}
                    </p>
                    <p className="text-foreground dark:text-white font-semibold text-xl"><AnimatedNumber value={selectedCourse.price} formatter={(value: number) => formatCurrencyByLanguage(value, language)} durationMs={420} /></p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2 flex items-center gap-2">
                      <Clock size={16} />
                      {t("adm_courses_duration", "Thời lượng")}
                    </p>
                    <p className="text-foreground dark:text-white font-semibold">{selectedCourse.duration}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2">{ t("adm_courses_col_date", "Ngày tạo")}</p>
                    <p className="text-foreground dark:text-white font-semibold">{formatDate(selectedCourse.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedCourse.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => {
                      handleCourseAction("approve", selectedCourse.id, selectedCourse)
                      setViewMode(null)
                      setSelectedCourse(null)
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-[0_12px_24px_rgba(16,185,129,0.35)]"
                  >
                    <CheckCircle size={20} />
                    {t("adm_courses_approve", "Duyệt khóa học")}
                  </button>
                  <button
                    onClick={() => setViewMode("reject")}
                    className="flex-1 px-6 py-3 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-900/25 text-rose-600 dark:text-rose-300 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-800/50"
                  >
                    <XCircle size={20} />
                    {t("adm_courses_rejected_label", "Từ chối")}
                  </button>
                </div>
              )}

              {/* View Full Details Link */}
              <Link
                href={`/admin/courses/${selectedCourse.id}`}
                className="block w-full text-center px-6 py-3 bg-sky-50 dark:bg-sky-900/25 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-2xl font-medium transition-all border border-sky-100 dark:border-sky-800/50"
              >
                {t("adm_courses_view_full_detail", "Xem chi tiết đầy đủ (nội dung, bài học)")} →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {viewMode === "edit" && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_26px_62px_rgba(15,23,42,0.24)] max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-sky-50/95 via-cyan-50/95 to-white/95 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">{t("adm_courses_edit_status", "Sửa trạng thái")}</h2>
              <button
                onClick={() => { setViewMode(null); setSelectedCourse(null); setRejectionReason(""); setEditStatus("pending") }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-sky-100/90 dark:border-slate-700 bg-gradient-to-br from-white via-sky-50/50 to-cyan-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4">
                <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-cyan-200/35 blur-2xl dark:bg-cyan-700/20" />
                <div className="flex items-center gap-4">
                  <img
                    src={selectedCourse.thumbnail || "/image/course-placeholder.png"}
                    alt={selectedCourse.title}
                    className="h-16 w-16 rounded-2xl object-cover border border-white/80 shadow-[0_8px_22px_rgba(14,165,233,0.25)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedCourse.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("adm_courses_col_category", "Danh mục")}: {selectedCourse.category || "-"}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("adm_courses_col_instructor", "Giảng viên")}: {selectedCourse.instructor || "-"}</p>
                  </div>
                  <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold shadow-[0_10px_24px_rgba(14,165,233,0.35)]">
                    {(selectedCourse.instructor || "G").trim().charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("adm_courses_current_status", "Trạng thái hiện tại")}
                </p>
                <div className="mt-2">{getStatusBadge(selectedCourse.status)}</div>
              </div>

              <div className="relative z-30 rounded-2xl border border-sky-200/80 dark:border-sky-700/40 bg-gradient-to-br from-sky-50 to-cyan-50/70 dark:from-sky-900/20 dark:to-cyan-900/15 p-4 shadow-[0_10px_24px_rgba(14,165,233,0.12)]">
                <label className="block text-slate-800 dark:text-slate-100 text-sm font-semibold mb-2">{t("adm_courses_status_label", "Trạng thái")}</label>
                <UniversalSelect
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Course["status"])}
                  className="relative z-30 w-full bg-white dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border border-sky-200 dark:border-sky-700/40 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
                  contentSide="auto"
                  portalled={true}
                >
                  {getEditableStatusOptions(selectedCourse.status).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </UniversalSelect>
              </div>

              {editStatus === "rejected" && (
                <div className="relative z-10">
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    {t("adm_courses_reject_reason", "Lý do từ chối")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    ref={rejectReasonRef}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value.slice(0, MAX_REJECTION_REASON_LENGTH))}
                    className="w-full bg-white dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400/60 h-28 resize-none"
                    placeholder={t("adm_courses_reject_placeholder", "Nhập lý do từ chối khóa học này...")}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("adm_courses_reject_email_note", "Lý do này sẽ được gửi đến email của giảng viên")}
                    </p>
                    <span className={`text-xs font-medium ${rejectionReason.length > MAX_REJECTION_REASON_LENGTH - 40 ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
                      {rejectionReason.length}/{MAX_REJECTION_REASON_LENGTH}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => void handleSaveEdit()}
                disabled={isSavingEdit}
                className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-2xl font-semibold hover:shadow-[0_16px_30px_rgba(14,165,233,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSavingEdit ? <Loader2 size={18} className="animate-spin" /> : <Edit size={18} />} {t("adm_courses_save", "Lưu thay đổi")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Course Modal */}
      {viewMode === "reject" && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_26px_62px_rgba(15,23,42,0.24)] max-w-lg w-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <XCircle size={24} className="text-red-500" /> {t("adm_courses_reject_title", "Từ chối khóa học")}
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 text-sm mt-1">
                {t("adm_courses_reject_hint", "Vui lòng nhập lý do từ chối để giảng viên biết cần cải thiện điều gì")}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-rose-50 dark:bg-rose-900/15 border border-rose-100 dark:border-rose-800/40 rounded-2xl p-4">
                <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">{t("adm_courses_col_course", "Khóa học")}</p>
                <p className="text-foreground dark:text-white font-medium">{selectedCourse.title}</p>
                <p className="text-muted-foreground dark:text-slate-400 text-xs mt-1">{t("adm_courses_col_instructor", "Giảng viên")}: {selectedCourse.instructor}</p>
              </div>

              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                  {t("adm_courses_reject_reason", "Lý do từ chối")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t("adm_courses_reject_placeholder", "Nhập lý do từ chối khóa học này...")}
                  className="w-full bg-white dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400/70 h-32 resize-none"
                />
                <p className="text-xs text-muted-foreground dark:text-slate-500 mt-1">
                  {t("adm_courses_reject_email_note", "Lý do này sẽ được gửi đến email của giảng viên")}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setViewMode(null); setSelectedCourse(null); setRejectionReason(""); }}
                  className="flex-1 py-3 rounded-xl font-medium border border-slate-200 dark:border-slate-700 text-foreground dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t("common_cancel", "Hủy")}
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-[0_10px_24px_rgba(225,29,72,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle size={18} /> {t("adm_courses_confirm_reject", "Xác nhận từ chối")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: "" })}
        onConfirm={executeCourseAction}
        title={confirmDialog.action === "approve" ? t("adm_courses_approve", "Duyệt khóa học") : t("adm_courses_delete", "Xóa khóa học")}
        message={
          confirmDialog.action === "approve"
            ? `Bạn có chắc chắn muốn duyệt khóa học "${selectedCourse?.title || ''}" không? ${t("adm_courses_confirm_approve_msg_end", "Khóa học sẽ được công khai và học viên có thể đăng ký.")}`
            : `Bạn có chắc chắn muốn xóa khóa học "${selectedCourse?.title || ''}" không? ${t("adm_courses_confirm_delete_msg_end", "Hành động này không thể hoàn tác.")}`
        }
        isDangerous={confirmDialog.action === "delete"}
      />
    </div>
  )
}



