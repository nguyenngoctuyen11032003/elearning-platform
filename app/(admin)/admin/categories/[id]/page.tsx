"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, BookOpen, Calendar, CheckCircle, Clock, Loader2, Users, XCircle } from "lucide-react"
import { authFetch } from "@/lib/authfetch"
import { useLanguage } from "@/lib/i18n/language-context"

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
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")

  useEffect(() => {
    const fetchCategoryDetail = async () => {
      if (!categoryId) return

      setIsLoading(true)
      setErrorMessage("")

      try {
        const res = await authFetch(`/categories/${categoryId}`)

        if (!res.ok) {
          throw new Error("CATEGORY_FETCH_FAILED")
        }

        const json = await res.json()
        const payload = json?.data ?? json

        setCategory({
          ...payload,
          courses: Array.isArray(payload?.courses) ? payload.courses : [],
        })
      } catch {
        setErrorMessage(t("adm_cat_detail_load_fail", "Không thể tải dữ liệu danh mục"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoryDetail()
  }, [categoryId, t])

  const getStatusText = (status?: CourseStatus) => {
    switch (status) {
      case "approved":
      case "published":
        return t("adm_courses_approved_label", "Đã duyệt")
      case "pending":
        return t("adm_courses_pending", "Chờ duyệt")
      case "rejected":
        return t("adm_courses_rejected_label", "Từ chối")
      case "archived":
        return t("adm_courses_archived", "Đã lưu trữ")
      case "draft":
        return t("adm_courses_draft", "Nháp")
      default:
        return t("adm_courses_unknown", "Không rõ")
    }
  }

  const getStatusClass = (status?: CourseStatus) => {
    switch (status) {
      case "approved":
      case "published":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
      case "archived":
        return "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300"
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300"
    }
  }

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
            <ArrowLeft size={16} /> {t("adm_cat_back_to_list", "Quay về danh mục")}
          </Link>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-destructive">{errorMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  const courses = category?.courses ?? []
  const filteredCourses = courses.filter((course) => {
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
              <ArrowLeft size={16} /> {t("adm_cat_back_to_list", "Quay về danh mục")}
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
                <h1 className="text-3xl font-bold">{category?.name || t("adm_cat_unknown", "Danh mục")}</h1>
                <p className="text-white/85 mt-2 max-w-3xl">{category?.description || t("adm_cat_no_desc", "Chưa có mô tả")}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm text-white">
              <BookOpen size={16} />
              {courses.length} {t("adm_cat_courses_unit", "khóa học")}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="group flex items-center justify-between cursor-pointer h-full bg-white/85 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 hover:bg-white/95 dark:hover:bg-slate-900 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">{t("adm_cat_total_courses", "Tổng khóa học")}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalCourses}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <BookOpen size={20} className="text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
              </div>

              <div className="group flex items-center justify-between cursor-pointer h-full bg-white/85 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 hover:bg-white/95 dark:hover:bg-slate-900 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">{t("adm_courses_pending", "Chờ duyệt")}</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300 mt-1">{pendingCourses}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Clock size={20} className="text-yellow-600 dark:text-yellow-300" />
                  </div>
                </div>
              </div>

              <div className="group flex items-center justify-between cursor-pointer h-full bg-white/85 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 hover:bg-white/95 dark:hover:bg-slate-900 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">{t("adm_courses_approved_label", "Đã duyệt")}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-300 mt-1">{approvedCourses}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-300" />
                  </div>
                </div>
              </div>

              <div className="group flex items-center justify-between cursor-pointer h-full bg-white/85 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 hover:bg-white/95 dark:hover:bg-slate-900 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">{t("adm_courses_rejected_label", "Từ chối")}</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-300 mt-1">{rejectedCourses}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <XCircle size={20} className="text-red-600 dark:text-red-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-xl font-bold text-foreground dark:text-white">
                {t("adm_cat_courses_list_title", "Danh sách khóa học trong danh mục")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: t("adm_courses_all", "Tất cả") },
                  { value: "pending", label: t("adm_courses_pending", "Chờ duyệt") },
                  { value: "approved", label: t("adm_courses_approved_label", "Đã duyệt") },
                  { value: "rejected", label: t("adm_courses_rejected_label", "Từ chối") },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value as "all" | "pending" | "approved" | "rejected")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-smooth ${
                      statusFilter === option.value
                        ? "bg-primary text-white"
                        : "bg-secondary dark:bg-slate-800 text-foreground dark:text-white hover:bg-secondary/80 dark:hover:bg-slate-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground dark:text-slate-400">
              {t("adm_cat_courses_empty", "Danh mục này hiện chưa có khóa học nào")}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground dark:text-slate-400">
              {t("adm_cat_courses_filter_empty", "Không có khóa học phù hợp với bộ lọc")}
            </div>
          ) : (
            <div className="divide-y divide-border dark:divide-slate-800">
              {filteredCourses.map((course) => {
                const rawPrice = Number(course.price ?? 0)
                const safePrice = Number.isFinite(rawPrice) ? rawPrice : 0
                const studentCount = Number(course.enrollmentCount ?? course.studentsCount ?? 0)

                return (
                  <div key={course.id} className="p-5 md:p-6 hover:bg-secondary/40 dark:hover:bg-slate-800/40 transition-smooth">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
                      <div className="w-full lg:w-56 h-32 rounded-xl overflow-hidden bg-secondary dark:bg-slate-800 shrink-0">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <BookOpen size={24} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground dark:text-white break-words">{course.title}</h3>
                            <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1 line-clamp-2">
                              {course.shortDescription || course.description || t("adm_cat_no_course_desc", "Chưa có mô tả")}
                            </p>
                          </div>

                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium w-fit ${getStatusClass(course.status)}`}>
                            {getStatusText(course.status)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground dark:text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Users size={15} />
                            {studentCount.toLocaleString("en-US")}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={15} />
                            {course.createdAt ? new Date(course.createdAt).toLocaleDateString("vi-VN") : "--/--/----"}
                          </span>
                          <span className="font-medium text-foreground dark:text-white">
                            {safePrice > 0 ? currencyFormatter.format(safePrice) : t("adm_courses_free", "Miễn phí")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="px-4 py-2 rounded-lg border border-border dark:border-slate-700 text-sm font-medium hover:bg-secondary dark:hover:bg-slate-800 text-foreground dark:text-white"
                        >
                          {t("adm_courses_view_detail", "Xem chi tiết")}
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
