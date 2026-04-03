"use client"

import { Plus, Edit2, Trash2, Eye, MoreVertical, Search, BookOpen, Users, DollarSign, Clock, CheckCircle, XCircle, Send, AlertCircle, Video, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { formatPrice, formatCurrencyByLanguage } from "@/lib/format"
import { authFetch } from "@/lib/authfetch"
import { createPortal } from "react-dom"
import React from "react"
import { useLanguage } from "@/lib/i18n/language-context"
import { ScientificText } from "@/components/scientific-text"
interface Course {
  id: string
  title: string
  description: string
  students: number
  rating: number
  price: number
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt: string
  thumbnail: string
  lessons: number
  duration: string
  category: string
  rejectionReason?: string | null
}

interface BackendCourse {
  id: string
  title: string
  description?: string
  price?: number
  status?: "draft" | "pending" | "published" | "rejected"
  createdAt?: string
  thumbnail?: string
  duration?: number
  enrollmentCount?: number
  rating?: number
  rejectionReason?: string | null
  category?: {
    name?: string
  } | null
  lessons?: Array<{ id: string }>
}

interface BackendLesson {
  id: string
  title: string
  videoUrl?: string
  resources?: unknown
}

interface LessonPreview {
  id: string
  title: string
  videoUrl?: string
  documents?: Array<{ url: string; name?: string }>
  quizQuestions?: { question: string; options?: string[]; type?: string; correctAnswer?: number; correctAnswers?: number[] }[]
}

interface CourseStudentProgress {
  studentId: string
  studentName: string
  studentEmail: string
  progress: number
  scorePercentage: number | null
  gradedAssignments: number
  submittedAssignments: number
  totalAssignments: number
}

function parseLessonResources(resources: unknown): Array<{ url: string; name?: string }> {
  let normalized: unknown = resources
  let attempts = 0

  while (typeof normalized === "string" && attempts < 2) {
    try {
      normalized = JSON.parse(normalized)
    } catch {
      return []
    }
    attempts += 1
  }

  const list = Array.isArray(normalized)
    ? normalized
    : normalized && typeof normalized === "object"
    ? [normalized]
    : []

  const documents: Array<{ url: string; name?: string }> = []
  for (const item of list) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const url = (item as Record<string, unknown>).url
      if (typeof url === "string" && url) {
        documents.push(item as { url: string; name?: string })
      }
    }
    if (Array.isArray(item)) {
      for (const nested of item) {
        if (nested && typeof nested === "object" && !Array.isArray(nested)) {
          const url = (nested as Record<string, unknown>).url
          if (typeof url === "string" && url) {
            documents.push(nested as { url: string; name?: string })
          }
        }
      }
    }
  }

  return documents
}
const InfoItem = ({ icon, label, value }: any) => (
  <div className="bg-secondary rounded-xl p-3 text-center">
    <div className="flex justify-center mb-1">{icon}</div>
    <div className="text-lg font-bold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
)
export default function TeacherCoursesPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "delete" | null>(null)
  const [menuCourse, setMenuCourse] = useState<Course | null>(null)
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null)
  const [menuAnchorId, setMenuAnchorId] = useState<string | null>(null)
  const [selectedCourseLessons, setSelectedCourseLessons] = useState<LessonPreview[]>([])
  const [isLessonsLoading, setIsLessonsLoading] = useState(false)
  const [showStudentsProgressModal, setShowStudentsProgressModal] = useState(false)
  const [studentsProgressLoading, setStudentsProgressLoading] = useState(false)
  const [courseStudentsProgress, setCourseStudentsProgress] = useState<CourseStudentProgress[]>([])
  const [studentsProgressSummary, setStudentsProgressSummary] = useState<{
    averageProgress: number
    averageScore: number
    totalStudents: number
  } | null>(null)
  const menuButtonRefs = React.useRef<Map<string, React.RefObject<HTMLButtonElement>>>(new Map())
  const filterContainerRef = React.useRef<HTMLDivElement | null>(null)
  const filterButtonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})
  const [activeFilterStyle, setActiveFilterStyle] = useState({ left: 0, width: 0, ready: false })

  const normalizeList = (data: any): BackendCourse[] => {
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.data)) return data.data
    if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data
    return []
  }

  const mapCourse = (course: BackendCourse): Course => {
    const statusMap: Record<string, Course["status"]> = {
      published: "approved",
      draft: "draft",
      pending: "pending",
      rejected: "rejected",
    }
    const durationHours = course.duration ? Math.round(course.duration / 60) : 0
    return {
      id: course.id,
      title: course.title,
      description: course.description || "",
      students: course.enrollmentCount || 0,
      rating: course.rating || 0,
      price: course.price || 0,
      status: statusMap[course.status || "draft"] || "draft",
      createdAt: course.createdAt || "",
      thumbnail: course.thumbnail || "/placeholder.jpg",
      lessons: course.lessons?.length || 0,
      duration: durationHours > 0 ? `${durationHours} ${t("tc_hours", "giờ")}` : "—",
      category: course.category?.name || "—",
      rejectionReason: course.rejectionReason || null,
    }
  }

  const normalizeLessonList = (data: any): BackendLesson[] => {
    if (Array.isArray(data)) return data
    if (data?.data && Array.isArray(data.data)) return data.data
    if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data
    return []
  }

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await authFetch("/courses/my-courses")
        if (!response.ok) {
          throw new Error(t("tc_fetch_courses_failed", "Failed to fetch courses"))
        }

        const data = await response.json()
        const list = normalizeList(data).map(mapCourse)
        setCourses(list)
      } catch (error) {
        console.error("Error fetching courses:", error)
        setCourses([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    if (viewMode !== "view" || !selectedCourse?.id) {
      setSelectedCourseLessons([])
      return
    }

    const fetchLessons = async () => {
      setIsLessonsLoading(true)
      try {
        const [res, quizRes] = await Promise.all([
          authFetch(`/lessons/course/${selectedCourse.id}`),
          authFetch(`/quizzes/course/${selectedCourse.id}`),
        ])
        if (!res.ok) {
          throw new Error(t("tc_fetch_lessons_failed", "Failed to fetch lessons"))
        }
        const json = await res.json()
        const list = normalizeLessonList(json)
        const quizJson = quizRes.ok ? await quizRes.json() : []
        const quizUnwrapped = quizJson?.data ?? quizJson
        const quizList = Array.isArray(quizUnwrapped)
          ? quizUnwrapped
          : Array.isArray(quizUnwrapped?.data)
          ? quizUnwrapped.data
          : []
        const quizByLesson: Record<string, any> = quizList.reduce((acc: Record<string, any>, quiz: any) => {
          if (quiz?.lessonId) {
            acc[quiz.lessonId] = quiz
          }
          return acc
        }, {})
        const mapped = list.map((lesson) => {
          const documents = parseLessonResources(lesson.resources)
          const linkedQuiz = quizByLesson[lesson.id]
          const questions = Array.isArray(linkedQuiz?.questions) ? linkedQuiz.questions : []
          return {
            id: lesson.id,
            title: lesson.title,
            videoUrl: lesson.videoUrl,
            documents,
            quizQuestions: questions.map((q: Record<string, unknown>) => ({
              question: (q.question as string) || "",
              options: Array.isArray(q.options) ? (q.options as string[]) : undefined,
              type: (q.type as string) || undefined,
              correctAnswer: typeof q.correctAnswer === "number" ? (q.correctAnswer as number) : undefined,
              correctAnswers: Array.isArray(q.correctAnswers) ? (q.correctAnswers as number[]) : undefined,
            })),
          }
        })
        setSelectedCourseLessons(mapped)
      } catch (error) {
        console.error("Error fetching lessons:", error)
        setSelectedCourseLessons([])
      } finally {
        setIsLessonsLoading(false)
      }
    }

    fetchLessons()
  }, [viewMode, selectedCourse?.id])

  // Stats
  const totalCourses = courses.length
  const draftCourses = courses.filter(c => c.status === "draft").length
  const pendingCourses = courses.filter(c => c.status === "pending").length
  const approvedCourses = courses.filter(c => c.status === "approved").length
  const rejectedCourses = courses.filter(c => c.status === "rejected").length

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" || course.status === statusFilter),
  )

  const filterOptions = useMemo(
    () => [
      { value: "all", label: t("tc_filter_all", "Tất cả") },
      { value: "draft", label: t("tc_filter_draft", "Nháp") },
      { value: "pending", label: t("tc_filter_pending", "Chờ duyệt") },
      { value: "approved", label: t("tc_filter_approved", "Đã duyệt") },
      { value: "rejected", label: t("tc_filter_rejected", "Từ chối") },
    ],
    [t],
  )

  useEffect(() => {
    const updateActiveFilter = () => {
      const container = filterContainerRef.current
      const activeButton = filterButtonRefs.current[statusFilter]
      if (!container || !activeButton) {
        setActiveFilterStyle((prev) => ({ ...prev, ready: false }))
        return
      }

      const containerRect = container.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      setActiveFilterStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
        ready: true,
      })
    }

    updateActiveFilter()
    window.addEventListener("resize", updateActiveFilter)
    return () => window.removeEventListener("resize", updateActiveFilter)
  }, [statusFilter, filterOptions])

  const handleViewDetails = (course: Course) => {
    setSelectedCourse(course)
    setViewMode("view")
  }

  const handleEdit = (courseId: string) => {
    router.push(`/teacher/courses/${courseId}/edit`)
  }

  const canEditCourse = (status: Course["status"]) => status !== "approved"

  const handleDeleteClick = (course: Course) => {
    setSelectedCourse(course)
    setViewMode("delete")
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCourse) return
    try {
      const res = await authFetch(`/courses/${selectedCourse.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(t("tc_delete_failed", "Delete failed"))
      setCourses(courses.filter(course => course.id !== selectedCourse.id))
    } catch (error) {
      console.error("Error deleting course:", error)
    } finally {
      setViewMode(null)
      setSelectedCourse(null)
    }
  }

  const handleSubmitForReview = async (courseId: string) => {
    try {
      const res = await authFetch(`/courses/${courseId}/submit`, {
        method: "PATCH",
      })
      if (!res.ok) throw new Error(t("tc_submit_failed", "Submit failed"))
      setCourses(courses.map(c =>
        c.id === courseId ? { ...c, status: "pending" as const } : c
      ))
    } catch (error) {
      console.error("Error submitting course:", error)
    } finally {
      setMenuCourse(null)
      setMenuRect(null)
      setMenuAnchorId(null)
    }
  }

  const handleViewStudentsProgress = async (course: Course) => {
    setSelectedCourse(course)
    setShowStudentsProgressModal(true)
    setStudentsProgressLoading(true)
    setCourseStudentsProgress([])
    setStudentsProgressSummary(null)
    setMenuCourse(null)
    setMenuRect(null)
    setMenuAnchorId(null)

    try {
      const response = await authFetch(`/teacher/courses/${course.id}/students-progress`)
      if (!response.ok) {
        throw new Error(t("tc_students_progress_load_failed", "Không thể tải tiến độ và điểm của học viên"))
      }
      const json = await response.json()
      const payload = json?.data ?? json
      const students = Array.isArray(payload?.students) ? payload.students : []
      setCourseStudentsProgress(
        students.map((item: any) => ({
          studentId: String(item.studentId || ""),
          studentName: String(item.studentName || "N/A"),
          studentEmail: String(item.studentEmail || ""),
          progress: Number(item.progress || 0),
          scorePercentage: typeof item.scorePercentage === "number" ? Number(item.scorePercentage) : null,
          gradedAssignments: Number(item.gradedAssignments || 0),
          submittedAssignments: Number(item.submittedAssignments || 0),
          totalAssignments: Number(item.totalAssignments || 0),
        })),
      )
      setStudentsProgressSummary({
        averageProgress: Number(payload?.summary?.averageProgress || 0),
        averageScore: Number(payload?.summary?.averageScore || 0),
        totalStudents: Number(payload?.summary?.totalStudents || students.length || 0),
      })
    } catch (error) {
      console.error("Error loading students progress:", error)
      setCourseStudentsProgress([])
      setStudentsProgressSummary({ averageProgress: 0, averageScore: 0, totalStudents: 0 })
    } finally {
      setStudentsProgressLoading(false)
    }
  }

// Recalculate menuRect only once when menu is open (mobile)
useEffect(() => {
  if (!menuCourse || !menuAnchorId || window.innerWidth >= 768) return

  const ref = menuButtonRefs.current.get(menuAnchorId)
  if (!ref?.current) return

  setMenuRect(ref.current.getBoundingClientRect())
}, [menuCourse, menuAnchorId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <CheckCircle size={14} /> {t("tc_status_approved", "Đã duyệt")}
          </span>
        )
      case "pending":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            <Clock size={14} /> {t("tc_status_pending", "Chờ duyệt")}
          </span>
        )
      case "rejected":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            <XCircle size={14} /> {t("tc_status_rejected", "Bị từ chối")}
          </span>
        )
      case "draft":
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
            <Edit2 size={14} /> {t("tc_status_draft", "Nháp")}
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100/70 bg-white/85 p-6 shadow-[0_24px_60px_rgba(3,105,161,0.16)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(120%_110%_at_0%_0%,rgba(59,130,246,0.25),transparent_45%),radial-gradient(100%_90%_at_90%_0%,rgba(34,211,238,0.22),transparent_48%)]" />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/70 bg-cyan-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-900/30 dark:text-cyan-200">
                  <BookOpen className="h-4 w-4" />
                  {t("tc_teacher_center", "Trung tâm khóa học")}
                </p>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white md:text-5xl">{t("tc_my_courses", "Khóa học của tôi")}</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 md:text-base">{t("tc_manage_courses", "Quản lý và tạo khóa học mới")}</p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/teacher/courses/create"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white transition hover:bg-cyan-500"
                >
                  <Plus size={17} /> {t("tc_create_course", "Tạo khóa học mới")}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                { label: t("tc_stat_total", "Tổng"), value: totalCourses, icon: BookOpen, tone: "border-cyan-200 bg-cyan-50/75 text-cyan-700 dark:border-cyan-700/60 dark:bg-cyan-900/30 dark:text-cyan-200" },
                { label: t("tc_filter_draft", "Nháp"), value: draftCourses, icon: Edit2, tone: "border-slate-200 bg-slate-50/85 text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/55 dark:text-slate-200" },
                { label: t("tc_filter_pending", "Chờ duyệt"), value: pendingCourses, icon: Clock, tone: "border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200" },
                { label: t("tc_filter_approved", "Đã duyệt"), value: approvedCourses, icon: CheckCircle, tone: "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-200" },
                { label: t("tc_filter_rejected", "Từ chối"), value: rejectedCourses, icon: XCircle, tone: "border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-200" },
              ].map((item) => (
                <article key={item.label} className={`rounded-xl border p-3 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${item.tone}`}>
                  <div className="mb-1 flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em]">{item.label}</p>
                  </div>
                  <p className="text-2xl font-black">{item.value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div>
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_12px_35px_rgba(2,132,199,0.09)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/65">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t("tc_search_placeholder", "Tìm kiếm khóa học...")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.2)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
                  />
                </div>

                <div ref={filterContainerRef} className="relative inline-flex w-full flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/70 md:w-auto md:flex-nowrap">
                  <div
                    className="pointer-events-none absolute inset-y-1 rounded-md bg-cyan-600 shadow-[0_8px_20px_rgba(8,145,178,0.35)] transition-all duration-300"
                    style={{
                      left: `${activeFilterStyle.left}px`,
                      width: `${activeFilterStyle.width}px`,
                      opacity: activeFilterStyle.ready ? 1 : 0,
                    }}
                  />
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      ref={(node) => {
                        filterButtonRefs.current[option.value] = node
                      }}
                      onClick={() => setStatusFilter(option.value)}
                      className={`relative z-10 inline-flex min-w-fit items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                        statusFilter === option.value
                          ? "text-white"
                          : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                {t("tc_loading_courses", "Đang tải khóa học...")}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                <BookOpen size={42} className="mx-auto mb-3 opacity-60" />
                {t("tc_no_courses_found", "Không tìm thấy khóa học nào")}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course) => (
                  <article
                    key={course.id}
                    data-course-card-id={course.id}
                    className={`relative rounded-xl border border-slate-200 bg-slate-50/85 p-4 transition hover:border-cyan-400/60 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/45 ${menuCourse?.id === course.id ? "z-[9999]" : "z-0"}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-white">{course.title}</h3>
                      <button
                        ref={(() => {
                          if (!menuButtonRefs.current.has(course.id)) {
                            menuButtonRefs.current.set(course.id, React.createRef<HTMLButtonElement>())
                          }
                          return menuButtonRefs.current.get(course.id)
                        })()}
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          setMenuRect(rect)
                          setMenuCourse(course)
                          setMenuAnchorId(course.id)
                        }}
                        className="rounded-lg bg-white p-2 text-slate-500 hover:bg-slate-100 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    <img src={course.thumbnail} alt={course.title} className="mb-3 h-28 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700" />

                    <p className="mb-3 line-clamp-2 min-h-[36px] text-xs text-slate-500 dark:text-slate-400">
                      {course.description || t("tc_course_no_description", "Không có mô tả chi tiết")}
                    </p>

                    <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-white px-2 py-1.5 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration}</span>
                      </div>
                      <div className="rounded-lg bg-white px-2 py-1.5 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                        {course.lessons} {t("tc_lessons", "bài học")}
                      </div>
                    </div>

                    <div className="mb-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{t("tc_students_label", "Học viên")}: {course.students}</span>
                      <span>{course.rating > 0 ? `${course.rating}★` : t("tc_no_rating", "Chưa có")}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatCurrencyByLanguage(course.price, language)}</span>
                      {getStatusBadge(course.status)}
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{course.category}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>

      {/* View Course Detail Modal */}
      {viewMode === "view" && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 p-4 border-b border-border dark:border-slate-800">
              <h2 className="text-xl font-bold text-foreground dark:text-white">{t("tc_course_details", "Chi tiết khóa học")}</h2>
              <button
                onClick={() => { setViewMode(null); setSelectedCourse(null); }}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <XCircle size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex gap-4 mb-4">
                <img
                  src={selectedCourse.thumbnail}
                  alt={selectedCourse.title}
                  className="w-24 h-16 rounded-lg object-cover bg-secondary"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground dark:text-white">{selectedCourse.title}</h3>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mt-1">{selectedCourse.description}</p>
                  <div className="mt-2">{getStatusBadge(selectedCourse.status)}</div>
                </div>
              </div>
              {selectedCourse.status === "rejected" && selectedCourse.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                    <AlertCircle size={18} />
                    <span className="font-semibold">{t("tc_rejection_reason", "Lý do từ chối từ Admin")}</span>
                  </div>
                  <p className="text-red-600 dark:text-red-300 text-sm">{selectedCourse.rejectionReason}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4 text-center">
                  <Users size={24} className="mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <p className="text-2xl font-bold text-foreground dark:text-white">{selectedCourse.students}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{t("tc_info_students", "Học viên")}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4 text-center">
                  <BookOpen size={24} className="mx-auto mb-2 text-green-600 dark:text-green-400" />
                  <p className="text-2xl font-bold text-foreground dark:text-white">{selectedCourse.lessons}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{t("tc_info_lessons", "Bài học")}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4 text-center">
                  <Clock size={24} className="mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                  <p className="text-2xl font-bold text-foreground dark:text-white">{selectedCourse.duration}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{t("tc_info_duration", "Thời lượng")}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4 text-center">
                  <DollarSign size={24} className="mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-2xl font-bold text-foreground dark:text-white">{formatCurrencyByLanguage(selectedCourse.price, language)}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{t("tc_info_price", "Giá")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">{t("tc_th_category", "Danh mục")}</p>
                  <p className="text-foreground dark:text-white font-medium">{selectedCourse.category}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">{t("tc_created_date", "Ngày tạo")}</p>
                  <p className="text-foreground dark:text-white font-medium">{formatDate(selectedCourse.createdAt)}</p>
                </div>
              </div>

              <div className="border-t border-border dark:border-slate-800 pt-4 mb-4">
                <h3 className="text-base font-semibold text-foreground dark:text-white">{t("tc_course_content", "Nội dung khóa học")}</h3>
                {isLessonsLoading ? (
                  <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">{t("tc_loading_lessons", "Đang tải bài học...")}</p>
                ) : selectedCourseLessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">{t("tc_no_lessons", "Chưa có bài học nào")}</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {selectedCourseLessons.map((lesson, idx) => (
                      <div key={lesson.id} className="rounded-xl border border-border dark:border-slate-800 bg-secondary/40 dark:bg-slate-900/40 p-3">
                        <p className="text-sm font-medium text-foreground dark:text-white">
                          {idx + 1}. {lesson.title}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {lesson.videoUrl && (
                            <a
                              href={lesson.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 dark:bg-blue-500/20 px-2 py-1 text-xs text-blue-600 dark:text-blue-400"
                            >
                              <Video size={14} /> Video
                            </a>
                          )}
                          {(lesson.documents || []).map((doc, docIdx) => (
                            <a
                              key={`${lesson.id}-doc-modal-${docIdx}`}
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              download={doc.name || true}
                              className="inline-flex items-center gap-1 rounded-md bg-red-500/10 dark:bg-red-500/20 px-2 py-1 text-xs text-red-600 dark:text-red-400"
                            >
                              <FileText size={14} /> {doc.name || t("tc_document", "Tài liệu")}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t border-border dark:border-slate-800">
                <button
                  onClick={() => handleEdit(selectedCourse.id)}
                  className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-secondary dark:bg-slate-800 text-foreground dark:text-white hover:bg-secondary/80"
                >
                  <Edit2 size={18} /> {t("tc_edit", "Chỉnh sửa")}
                </button>
                {(selectedCourse.status === "draft" || selectedCourse.status === "rejected") && (
                  <button
                    onClick={() => {
                      handleSubmitForReview(selectedCourse.id)
                      setViewMode(null)
                      setSelectedCourse(null)
                    }}
                    className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg"
                  >
                    <Send size={18} /> {selectedCourse.status === "rejected" ? t("tc_resubmit", "Gửi duyệt lại") : t("tc_submit", "Gửi duyệt")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showStudentsProgressModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border dark:border-slate-800 sticky top-0 bg-card dark:bg-slate-900">
              <div>
                <h2 className="text-xl font-bold text-foreground dark:text-white">
                  {t("tc_students_progress_title", "Tiến độ & điểm học viên")}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{selectedCourse.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowStudentsProgressModal(false)
                  setCourseStudentsProgress([])
                  setStudentsProgressSummary(null)
                }}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <XCircle size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border dark:border-slate-800 bg-secondary/40 dark:bg-slate-800/30 p-3">
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{t("tc_total_students", "Tổng học viên")}</p>
                  <p className="text-xl font-bold text-foreground dark:text-white">{studentsProgressSummary?.totalStudents ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border dark:border-slate-800 bg-secondary/40 dark:bg-slate-800/30 p-3">
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{t("tc_avg_progress", "Tiến độ trung bình")}</p>
                  <p className="text-xl font-bold text-foreground dark:text-white">{studentsProgressSummary?.averageProgress ?? 0}%</p>
                </div>
                <div className="rounded-xl border border-border dark:border-slate-800 bg-secondary/40 dark:bg-slate-800/30 p-3">
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{t("tc_avg_writing_score", "Điểm writing trung bình")}</p>
                  <p className="text-xl font-bold text-foreground dark:text-white">{studentsProgressSummary?.averageScore ?? 0}%</p>
                </div>
              </div>

              {studentsProgressLoading ? (
                <p className="text-sm text-muted-foreground dark:text-slate-400 py-8 text-center">
                  {t("tc_loading_students_progress", "Đang tải dữ liệu học viên...")}
                </p>
              ) : courseStudentsProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground dark:text-slate-400 py-8 text-center">
                  {t("tc_no_students_progress", "Chưa có dữ liệu học viên cho khóa học này")}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary dark:bg-slate-800/50 border-b border-border dark:border-slate-800">
                        <th className="text-left px-4 py-3 font-semibold text-foreground dark:text-white">{t("tc_student", "Học viên")}</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground dark:text-white">{t("tc_progress", "Tiến độ")}</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground dark:text-white">{t("tc_writing_score", "Điểm writing")}</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground dark:text-white">{t("tc_writing_submission", "Bài writing")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStudentsProgress.map((student) => (
                        <tr key={student.studentId} className="border-b border-border dark:border-slate-800/70 last:border-b-0">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground dark:text-white">{student.studentName}</p>
                            <p className="text-xs text-muted-foreground dark:text-slate-400">{student.studentEmail}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-36">
                              <div className="h-2 rounded-full bg-secondary dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${Math.max(0, Math.min(100, student.progress))}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">{student.progress}%</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-foreground dark:text-white font-medium">
                            {typeof student.scorePercentage === "number" ? `${student.scorePercentage}%` : t("tc_not_graded_yet", "Chưa có điểm")}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground dark:text-slate-400">
                            {student.submittedAssignments}/{student.totalAssignments} • {t("tc_graded_short", "Đã chấm")}: {student.gradedAssignments}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {viewMode === "delete" && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground dark:text-white mb-2">{t("tc_delete_title", "Xóa khóa học?")}</h2>
              <p className="text-muted-foreground dark:text-slate-400 mb-6">
                {t("tc_delete_confirm", "Bạn có chắc chắn muốn xóa khóa học")} "<strong>{selectedCourse.title}</strong>"? {t("tc_delete_warning", "Hành động này không thể hoàn tác.")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setViewMode(null); setSelectedCourse(null); }}
                  className="flex-1 py-3 rounded-lg font-medium border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                >
                  {t("tc_cancel", "Hủy")}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white"
                >
                  {t("tc_delete_course", "Xóa khóa học")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
{menuCourse && menuRect && typeof window !== "undefined" &&
  (() => {
    // Find the card element
    const card = document.querySelector(`[data-course-card-id="${menuCourse.id}"]`)
    if (!card || !menuRect) return null
    const cardRect = card.getBoundingClientRect()
    // Tính vị trí tương đối to card (card có position: relative)
    const buttonRight = menuRect.right - cardRect.left
    const menuLeft = Math.max(0, buttonRight - 220)  // 220px = menu width, align right vs button
    const top = menuRect.bottom - cardRect.top + 6
    return createPortal(
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 z-[100000]"
          onClick={() => { setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null); }}
        />
        {/* Menu */}
        <div
          className="absolute z-[100001] w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          style={{ left: menuLeft, top, minWidth: 220 }}
        >
          <button
            onClick={() => {
              handleViewDetails(menuCourse)
              setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
            }}
            className="w-full border-b border-gray-100 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <Eye size={18} /> {t("tc_view_details", "Xem chi tiết")}
            </div>
          </button>
          <button
            onClick={() => {
              handleViewStudentsProgress(menuCourse)
              setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
            }}
            className="w-full border-b border-gray-100 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <BarChart3 size={18} /> {t("tc_view_students_progress_score", "Xem điểm & tiến độ")}
            </div>
          </button>
          <button
            onClick={() => {
              router.push(`/teacher/assignments?courseId=${menuCourse.id}`)
              setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
            }}
            className="w-full border-b border-gray-100 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} /> {t("tc_grade_writing", "Chấm writing")}
            </div>
          </button>
          {canEditCourse(menuCourse.status) && (
            <button
              onClick={() => {
                handleEdit(menuCourse.id)
                setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
              }}
              className="w-full border-b border-gray-100 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Edit2 size={18} /> {t("tc_edit", "Chỉnh sửa")}
              </div>
            </button>
          )}
          {(menuCourse.status === "draft" || menuCourse.status === "rejected") && (
            <button
              onClick={() => {
                handleSubmitForReview(menuCourse.id)
                setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
              }}
              className="w-full border-b border-gray-100 px-4 py-3 text-left text-sm text-primary transition-colors hover:bg-blue-50 dark:border-slate-700 dark:text-accent dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Send size={18} /> {menuCourse.status === "rejected" ? t("tc_resubmit", "Gửi duyệt lại") : t("tc_submit", "Gửi duyệt")}
              </div>
            </button>
          )}
          <button
            onClick={() => {
              handleDeleteClick(menuCourse)
              setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
            }}
            className="w-full px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={18} /> {t("tc_delete_course", "Xóa khóa học")}
            </div>
          </button>
        </div>
      </>,
      card
    )
  })()}
    </div>     
  )
}