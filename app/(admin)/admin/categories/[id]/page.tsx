"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  MoreVertical,
  Search,
  Users,
  XCircle,
} from "lucide-react"
import { authFetch } from "@/lib/authfetch"
import { useLanguage } from "@/lib/i18n/language-context"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { useMetricChangeHighlight } from "@/hooks/use-metric-change-highlight"
import { MetricTrendBadge } from "@/components/ui/metric-trend-badge"

type CourseStatus = "draft" | "pending" | "published" | "approved" | "rejected" | "archived"

interface CategoryCourse {
  id: string
  title: string
  description?: string
  shortDescription?: string
  thumbnail?: string
  price?: number | string
  enrollmentCount?: number
  studentsCount?: number
  status?: CourseStatus
  createdAt?: string
}

interface CategoryDetail {
  id: string
  name: string
  description?: string
  icon?: string
  image?: string
  courses?: CategoryCourse[]
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

export default function AdminCategoryCoursesPage() {
  const params = useParams()
  const { t } = useLanguage()

  const categoryId = useMemo(() => {
    const raw = params.id
    return Array.isArray(raw) ? raw[0] : (raw as string)
  }, [params.id])

  const [category, setCategory] = useState<CategoryDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [listMotionKey, setListMotionKey] = useState(0)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchCategoryDetail = async () => {
      if (!categoryId) return

      setIsLoading(true)
      setErrorMessage("")

      try {
        const res = await authFetch(`/categories/${categoryId}`)
        if (!res.ok) throw new Error("CATEGORY_FETCH_FAILED")

        const json = await res.json()
        const payload = json?.data ?? json

        setCategory({
          ...payload,
          courses: Array.isArray(payload?.courses) ? payload.courses : [],
        })
      } catch {
        setErrorMessage(t("adm_cat_detail_load_fail", "Khong the tai du lieu danh muc"))
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCategoryDetail()
  }, [categoryId, t])

  useEffect(() => {
    setListMotionKey((prev) => prev + 1)
  }, [searchTerm, statusFilter])

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

  const getStatusText = (status?: CourseStatus) => {
    switch (status) {
      case "approved":
      case "published":
        return t("adm_courses_approved_label", "Da duyet")
      case "pending":
        return t("adm_courses_pending", "Cho duyet")
      case "rejected":
        return t("adm_courses_rejected_label", "Tu choi")
      case "archived":
        return t("adm_courses_archived", "Da luu tru")
      case "draft":
        return t("adm_courses_draft", "Nhap")
      default:
        return t("adm_courses_unknown", "Khong ro")
    }
  }

  const getStatusBadge = (status?: CourseStatus) => {
    switch (status) {
      case "approved":
      case "published":
        return (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-700/40">
            <CheckCircle size={14} /> {getStatusText(status)}
          </span>
        )
      case "pending":
        return (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/40">
            <Clock size={14} /> {getStatusText(status)}
          </span>
        )
      case "rejected":
        return (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit bg-rose-50 dark:bg-rose-900/25 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-700/40">
            <XCircle size={14} /> {getStatusText(status)}
          </span>
        )
      case "archived":
        return (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock size={14} /> {getStatusText(status)}
          </span>
        )
      default:
        return (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {getStatusText(status)}
          </span>
        )
    }
  }

  const courses = category?.courses ?? []

  const filteredCourses = courses.filter((course) => {
    const keyword = searchTerm.trim().toLowerCase()
    const matchSearch =
      keyword.length === 0 ||
      course.title?.toLowerCase().includes(keyword) ||
      course.shortDescription?.toLowerCase().includes(keyword) ||
      course.description?.toLowerCase().includes(keyword)

    if (!matchSearch) return false

    if (statusFilter === "all") return true
    if (statusFilter === "pending") return course.status === "pending"
    if (statusFilter === "approved") return course.status === "approved" || course.status === "published"
    if (statusFilter === "rejected") return course.status === "rejected"
    return true
  })

  const totalCourses = courses.length
  const pendingCourses = courses.filter((course) => course.status === "pending").length
  const approvedCourses = courses.filter((course) => course.status === "approved" || course.status === "published").length
  const rejectedCourses = courses.filter((course) => course.status === "rejected").length

  const categoryOverviewMetrics = {
    totalCourses,
    pendingCourses,
    approvedCourses,
    rejectedCourses,
  }

  const { isChanged: isOverviewChanged, getTrend: getOverviewTrend } = useMetricChangeHighlight(categoryOverviewMetrics, {
    flashDurationMs: 1300,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen w-full">
        <div className="w-full space-y-6">
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} /> {t("adm_cat_back_to_list", "Quay ve danh muc")}
          </Link>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-destructive">{errorMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn bg-gradient-to-r from-sky-600/90 to-cyan-500/90">
          <div className="absolute inset-0 bg-black/10 rounded-3xl" />
          <div className="relative z-10 space-y-4">
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"
            >
              <ArrowLeft size={16} /> {t("adm_cat_back_to_list", "Quay ve danh muc")}
            </Link>

            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-white/20">
                {category?.image ? (
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{category?.icon || "📚"}</span>
                )}
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">{category?.name || t("adm_cat_unknown", "Danh muc")}</h1>
                <p className="text-white/85 mt-2 max-w-3xl">{category?.description || t("adm_cat_no_desc", "Chua co mo ta")}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm text-white">
              <BookOpen size={16} />
              <AnimatedNumber value={courses.length} durationMs={340} /> {t("adm_cat_courses_unit", "khoa hoc")}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className={`group flex items-center justify-between cursor-pointer h-full bg-white/85 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 hover:bg-white/95 dark:hover:bg-slate-900 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out border ${isOverviewChanged("totalCourses") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">{t("adm_cat_total_courses", "Tong khoa hoc")}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1"><AnimatedNumber value={totalCourses} disableAnimation={!isOverviewChanged("totalCourses")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("totalCourses")} />
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <BookOpen size={20} className="text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
              </div>

              <div className={`group flex items-center justify-between cursor-pointer h-full bg-white/85 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 hover:bg-white/95 dark:hover:bg-slate-900 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out border ${isOverviewChanged("pendingCourses") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">{t("adm_courses_pending", "Cho duyet")}</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300 mt-1"><AnimatedNumber value={pendingCourses} disableAnimation={!isOverviewChanged("pendingCourses")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("pendingCourses")} />
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Clock size={20} className="text-yellow-600 dark:text-yellow-300" />
                  </div>
                </div>
              </div>

              <div className={`group flex items-center justify-between cursor-pointer h-full bg-white/85 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 hover:bg-white/95 dark:hover:bg-slate-900 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out border ${isOverviewChanged("approvedCourses") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">{t("adm_courses_approved_label", "Da duyet")}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-300 mt-1"><AnimatedNumber value={approvedCourses} disableAnimation={!isOverviewChanged("approvedCourses")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("approvedCourses")} />
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-300" />
                  </div>
                </div>
              </div>

              <div className={`group flex items-center justify-between cursor-pointer h-full bg-white/85 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 hover:bg-white/95 dark:hover:bg-slate-900 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out border ${isOverviewChanged("rejectedCourses") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">{t("adm_courses_rejected_label", "Tu choi")}</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-300 mt-1"><AnimatedNumber value={rejectedCourses} disableAnimation={!isOverviewChanged("rejectedCourses")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("rejectedCourses")} />
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <XCircle size={20} className="text-red-600 dark:text-red-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground dark:text-white px-1">
            {t("adm_cat_courses_list_title", "Danh sach khoa hoc trong danh muc")}
          </h2>

          <div className="relative z-40 bg-white/85 dark:bg-slate-900/55 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/70 rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400" size={20} />
              <input
                type="text"
                placeholder={t("adm_courses_search", "Tim kiem khoa hoc hoac giang vien...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary dark:focus:border-accent transition-all duration-300 text-foreground dark:text-white placeholder:text-muted-foreground/60 shadow-sm"
              />
            </div>

            <div className="filter-row gap-y-3 sm:gap-y-4">
              <span className="text-sm font-semibold text-foreground dark:text-white">{t("common_filter_by", "Loc theo")}:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "approved" | "rejected")}
                className="filter-select h-[46px] w-full sm:w-auto min-w-[220px] md:min-w-[240px] lg:min-w-[260px] rounded-xl px-4 text-sm"
              >
                <option value="all">{t("adm_courses_all", "Tat ca")}</option>
                <option value="pending">{t("adm_courses_pending", "Cho duyet")}</option>
                <option value="approved">{t("adm_courses_approved_label", "Da duyet")}</option>
                <option value="rejected">{t("adm_courses_rejected_label", "Tu choi")}</option>
              </select>

              {(searchTerm.trim() || statusFilter !== "all") ? (
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                  }}
                  className="h-[46px] w-full sm:w-auto md:min-w-[132px] lg:min-w-[148px] inline-flex items-center justify-center px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  {t("common_reset", "Dat lai")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <div className="px-6 py-4 border-b border-border dark:border-slate-800 bg-white/50 dark:bg-slate-800/50">
              <p className="text-sm text-muted-foreground dark:text-slate-300">
                {t("adm_courses_result_count", "So ket qua")}: <span className="font-semibold text-foreground dark:text-white">{filteredCourses.length}</span>
              </p>
            </div>

            {courses.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground dark:text-slate-400">
                {t("adm_cat_courses_empty", "Danh muc nay hien chua co khoa hoc nao")}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground dark:text-slate-400">
                {t("adm_cat_courses_filter_empty", "Khong co khoa hoc phu hop voi bo loc")}
              </div>
            ) : (
              <>
                <div key={`desktop-${listMotionKey}`} className="hidden xl:block">
                  <div className="relative w-full">
                    <table className="w-full min-w-[500px] text-sm table-fixed">
                      <thead>
                        <tr className="border-b border-border dark:border-slate-800 bg-white/50 dark:bg-slate-800/50">
                          <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("adm_courses_col_course", "Khoa hoc")}</th>
                          <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("adm_courses_col_category", "Danh muc")}</th>
                          <th className="px-6 py-4 min-w-[120px] text-left font-semibold text-foreground dark:text-white">{t("adm_courses_col_price", "Gia")}</th>
                          <th className="px-6 py-4 min-w-[100px] text-left font-semibold text-foreground dark:text-white">{t("adm_courses_col_students", "Hoc vien")}</th>
                          <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("adm_courses_col_status", "Trang thai")}</th>
                          <th className="px-6 py-4 min-w-[100px] text-left font-semibold text-foreground dark:text-white">{t("adm_courses_col_date", "Ngay tao")}</th>
                          <th className="min-w-[140px] bg-slate-50/90 dark:bg-slate-900/90 text-left py-4 px-6 font-semibold text-slate-700 dark:text-slate-200">
                            {t("adm_courses_actions", "Hanh dong")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCourses.map((course, index) => {
                          const rawPrice = Number(course.price ?? 0)
                          const safePrice = Number.isFinite(rawPrice) ? rawPrice : 0
                          const studentCount = Number(course.enrollmentCount ?? course.studentsCount ?? 0)

                          return (
                            <tr
                              key={course.id}
                              className="border-b border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/55 transition-colors duration-300 animate-slideUp"
                              style={{ animationDelay: `${Math.min(index * 0.045, 0.42)}s` }}
                            >
                              <td className="py-5 px-6">
                                <div className="flex items-center gap-4">
                                  <img
                                    src={course.thumbnail || "/image/course-placeholder.png"}
                                    alt={course.title}
                                    className="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-800"
                                  />
                                  <div>
                                    <p className="text-foreground dark:text-white font-medium leading-7 line-clamp-2 break-words">{course.title}</p>
                                    <p className="text-muted-foreground dark:text-slate-400 text-xs line-clamp-1">
                                      {course.shortDescription || course.description || t("adm_cat_no_course_desc", "Chua co mo ta")}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-5 px-6">
                                <span className="px-2.5 py-1.5 bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800/60 rounded-lg text-sky-700 dark:text-sky-300 text-xs font-medium">
                                  {category?.name || t("adm_cat_unknown", "Danh muc")}
                                </span>
                              </td>
                              <td className="py-5 px-6 text-foreground dark:text-white font-medium">
                                {safePrice > 0 ? currencyFormatter.format(safePrice) : t("adm_courses_free", "Mien phi")}
                              </td>
                              <td className="py-5 px-6 text-foreground dark:text-white">
                                <AnimatedNumber value={studentCount} formatter={(value: number) => Math.round(value).toLocaleString("en-US")} durationMs={340} />
                              </td>
                              <td className="py-5 px-6" title={getStatusText(course.status)}>{getStatusBadge(course.status)}</td>
                              <td className="py-5 px-6 text-muted-foreground dark:text-slate-400">
                                {course.createdAt ? new Date(course.createdAt).toLocaleDateString("vi-VN") : "--/--/----"}
                              </td>
                              <td className="py-5 px-6 relative">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/admin/courses/${course.id}`}
                                    className="p-2 rounded-xl border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/35 transition-colors"
                                    title={t("adm_courses_view_details", "Xem chi tiet khoa hoc")}
                                  >
                                    <Eye size={18} />
                                  </Link>
                                  <button
                                    data-course-menu-trigger="true"
                                    onClick={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect()
                                      const menuWidth = 208
                                      let left = rect.right - menuWidth
                                      if (left < 8) left = 8
                                      if (left + menuWidth > window.innerWidth - 8) {
                                        left = window.innerWidth - menuWidth - 8
                                      }
                                      setMenuPos({
                                        x: left + window.scrollX,
                                        y: rect.bottom + window.scrollY,
                                      })
                                      setOpenMenu(course.id)
                                    }}
                                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title={t("adm_courses_actions", "Hanh dong")}
                                  >
                                    <MoreVertical size={18} className="text-slate-500 dark:text-slate-300" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div key={`mobile-${listMotionKey}`} className="block xl:hidden space-y-5 p-4 sm:p-5">
                  {filteredCourses.map((course, index) => {
                    const rawPrice = Number(course.price ?? 0)
                    const safePrice = Number.isFinite(rawPrice) ? rawPrice : 0
                    const studentCount = Number(course.enrollmentCount ?? course.studentsCount ?? 0)

                    return (
                      <div
                        key={course.id}
                        className="bg-white/95 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.14)] animate-slideUp"
                        style={{ animationDelay: `${Math.min(index * 0.045, 0.42)}s` }}
                      >
                        <div className="flex gap-3">
                          <img className="w-12 h-12 rounded-lg object-cover" src={course.thumbnail || "/image/course-placeholder.png"} alt={course.title} />
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white line-clamp-2">{course.title}</p>
                            <p className="text-xs text-slate-500/80 dark:text-slate-500/80 line-clamp-1">{category?.name || t("adm_cat_unknown", "Danh muc")}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-500/80 dark:text-slate-500/80">{t("adm_courses_col_price", "Gia")}</p>
                            <p className="font-medium text-slate-800 dark:text-slate-100">{safePrice > 0 ? currencyFormatter.format(safePrice) : t("adm_courses_free", "Mien phi")}</p>
                          </div>
                          <div>
                            <p className="text-slate-500/80 dark:text-slate-500/80">{t("adm_courses_students", "Hoc vien")}</p>
                            <p className="text-slate-800 dark:text-slate-100"><AnimatedNumber value={studentCount} formatter={(value: number) => Math.round(value).toLocaleString("en-US")} durationMs={340} /></p>
                          </div>
                          <div>
                            <p className="text-slate-500/80 dark:text-slate-500/80">{t("adm_courses_col_status", "Trang thai")}</p>
                            <div title={getStatusText(course.status)}>{getStatusBadge(course.status)}</div>
                          </div>
                          <div>
                            <p className="text-slate-500/80 dark:text-slate-500/80">{t("adm_courses_col_date", "Ngay tao")}</p>
                            <p className="text-slate-700 dark:text-slate-200">{course.createdAt ? new Date(course.createdAt).toLocaleDateString("vi-VN") : "--/--/----"}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3">
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="flex-1 bg-blue-50 dark:bg-blue-900/25 border border-blue-100 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 py-2 rounded-xl flex items-center justify-center gap-1 font-medium"
                            title={t("adm_courses_view_details", "Xem chi tiet khoa hoc")}
                          >
                            <Eye size={16} />
                            {t("adm_courses_view_detail", "Chi tiet")}
                          </Link>
                          <button
                            data-course-menu-trigger="true"
                            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const menuWidth = 208
                              let left = rect.right - menuWidth
                              if (left < 8) left = 8
                              if (left + menuWidth > window.innerWidth - 8) {
                                left = window.innerWidth - menuWidth - 8
                              }
                              setMenuPos({
                                x: left + window.scrollX,
                                y: rect.bottom + window.scrollY,
                              })
                              setOpenMenu(course.id)
                            }}
                            title={t("adm_courses_actions", "Hanh dong")}
                          >
                            <MoreVertical size={18} className="text-slate-600 dark:text-slate-300" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {openMenu && menuPos && (
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-white/95 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_18px_44px_rgba(15,23,42,0.18)] min-w-52 overflow-hidden"
          style={{ top: menuPos.y + 8, left: menuPos.x }}
        >
          <Link
            href={`/admin/courses/${openMenu}`}
            className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-white"
            onClick={() => {
              setOpenMenu(null)
              setMenuPos(null)
            }}
          >
            <Eye size={16} /> <span className="font-medium">{t("adm_courses_full_detail", "Chi tiet day du")}</span>
          </Link>
        </div>
      )}
    </div>
  )
}
