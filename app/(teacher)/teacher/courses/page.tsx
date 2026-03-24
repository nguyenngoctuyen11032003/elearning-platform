"use client"

import { Plus, Edit2, Trash2, Eye, MoreVertical, Search, BookOpen, Users, DollarSign, Clock, CheckCircle, XCircle, Send, AlertCircle, Video, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
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
  const menuButtonRefs = React.useRef<Map<string, React.RefObject<HTMLButtonElement>>>(new Map());

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

  const handleViewDetails = (course: Course) => {
    setSelectedCourse(course)
    setViewMode("view")
    setMenuOpenId(null)
  }

  const handleEdit = (courseId: string) => {
    router.push(`/teacher/courses/${courseId}/edit`)
    setMenuOpenId(null)
  }

  const canEditCourse = (status: Course["status"]) => status !== "approved"

  const handleDeleteClick = (course: Course) => {
    setSelectedCourse(course)
    setViewMode("delete")
    setMenuOpenId(null)
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
      setMenuOpenId(null)
    }
  }

  const handleViewStudentsProgress = async (course: Course) => {
    setSelectedCourse(course)
    setShowStudentsProgressModal(true)
    setStudentsProgressLoading(true)
    setCourseStudentsProgress([])
    setStudentsProgressSummary(null)
    setMenuOpenId(null)
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

// Close dropdown when clicking outside
// Only close dropdown on desktop, not mobile
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (window.innerWidth < 768) return // ⬅️ CHỐT CHẶN MOBILE

    const target = event.target as Element
    if (!target.closest('[data-dropdown]')) {
      setMenuOpenId(null)
    }
  }

  document.addEventListener("click", handleClickOutside)
  return () => document.removeEventListener("click", handleClickOutside)
}, [])

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
      <div className="w-full space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bg_mycourses.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("tc_my_courses", "Khóa học của tôi")}</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">{t("tc_manage_courses", "Quản lý và tạo khóa học mới")}</p>
              </div>
              <Link
                href="/teacher/courses/create"
                className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-fit backdrop-blur-sm"
              >
                <Plus size={20} /> {t("tc_create_course", "Tạo khóa học mới")}
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("tc_stat_total", "Tổng")}</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalCourses}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("tc_stat_draft", "Nháp")}</p>
                    <p className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-1">{draftCourses}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Edit2 size={20} className="text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("tc_stat_pending", "Chờ duyệt")}</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingCourses}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("tc_stat_approved", "Đã duyệt")}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{approvedCourses}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.65s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("tc_stat_rejected", "Từ chối")}</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{rejectedCourses}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <XCircle size={20} className="text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder={t("tc_search_placeholder", "Tìm kiếm khóa học...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: t("tc_filter_all", "Tất cả") },
              { value: "draft", label: t("tc_filter_draft", "Nháp") },
              { value: "pending", label: t("tc_filter_pending", "Chờ duyệt") },
              { value: "approved", label: t("tc_filter_approved", "Đã duyệt") },
              { value: "rejected", label: t("tc_filter_rejected", "Từ chối") },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-3 rounded-lg transition-smooth font-medium ${
                  statusFilter === option.value
                    ? "bg-primary text-white"
                    : "bg-card dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Courses List - Mobile/Tablet: Cards, Desktop: Table */}
        {/* Mobile & Tablet: Cards */}
        <div className="block xl:hidden">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground dark:text-slate-400">
              {t("tc_loading_courses", "Đang tải khóa học...")}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">{t("tc_no_courses_found", "Không tìm thấy khóa học nào")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  data-course-card-id={course.id}
                  className={`relative border border-border dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-2 animate-fadeIn ${menuCourse?.id === course.id ? "z-[9999]" : "z-0"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-16 h-16 rounded-lg object-cover bg-secondary"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-foreground dark:text-white text-base">{course.title}</div>
                      <div className="text-xs text-muted-foreground dark:text-slate-400">{course.lessons} {t("tc_lessons", "bài học")} • {course.duration}</div>
                    </div>
                    <button
                      ref={(() => {
                        if (!menuButtonRefs.current.has(course.id)) {
                          menuButtonRefs.current.set(course.id, React.createRef<HTMLButtonElement>())
                        }
                        return menuButtonRefs.current.get(course.id);
                      })()}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.innerWidth < 768) {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setMenuRect(rect)
                          setMenuCourse(course)
                          setMenuAnchorId(course.id)
                        } else {
                          setMenuOpenId(menuOpenId === course.id ? null : course.id)
                        }
                      }}
                      className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                    >
                      <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground dark:text-slate-400">{t("tc_category_label", "Danh mục:")}</span>
                    <span className="text-sm text-foreground dark:text-white">{course.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground dark:text-slate-400">{t("tc_students_label", "Học viên:")}</span>
                    <span className="text-sm text-foreground dark:text-white">{course.students}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground dark:text-slate-400">{t("tc_rating_label", "Đánh giá:")}</span>
                    <span className="text-sm text-yellow-500">{course.rating > 0 ? `${course.rating}★` : t("tc_no_rating", "Chưa có")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground dark:text-slate-400">{t("tc_price_label", "Giá:")}</span>
                    <span className="text-sm text-foreground dark:text-white">{formatCurrencyByLanguage(course.price, language)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground dark:text-slate-400">{t("tc_status_label", "Trạng thái:")}</span>
                    {getStatusBadge(course.status)}
                  </div>
                  {/* INLINE DETAIL – NEO THEO CARD */}
{viewMode === "view" && selectedCourse?.id === course.id && (
  <div className="mt-4 rounded-xl border border-border bg-secondary p-4 animate-slideDown">

    {/* Header */}
    <div className="flex items-start gap-3 mb-3">
      <img
        src={course.thumbnail}
        alt={course.title || t("tc_course_thumbnail_alt", "Ảnh khóa học")}
        className="w-20 h-14 rounded-lg object-cover"
      />

      <div className="flex-1">
        <h3 className="font-semibold text-sm">
          {course.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {course.description}
        </p>
        <div className="mt-1">
          {getStatusBadge(course.status)}
        </div>
      </div>

      <button
        onClick={() => {
          setViewMode(null)
          setSelectedCourse(null)
        }}
        className="text-muted-foreground"
      >
        <XCircle size={18} />
      </button>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-2 mb-3">
      <InfoItem icon={<Users size={14} />} label={t("tc_info_students", "Học viên")} value={course.students} />
      <InfoItem icon={<BookOpen size={14} />} label={t("tc_info_lessons", "Bài học")} value={course.lessons} />
      <InfoItem icon={<Clock size={14} />} label={t("tc_info_duration", "Thời lượng")} value={course.duration} />
      <InfoItem
        icon={<DollarSign size={14} />}
        label={t("tc_info_price", "Giá")}
        value={formatCurrencyByLanguage(course.price, language)}
      />
    </div>

    <div className="border-t border-border pt-3 mb-3">
      <p className="text-xs font-semibold text-foreground">{t("tc_course_content", "Nội dung khóa học")}</p>
      {isLessonsLoading ? (
        <p className="text-xs text-muted-foreground mt-2">{t("tc_loading_lessons", "Đang tải bài học...")}</p>
      ) : selectedCourseLessons.length === 0 ? (
        <p className="text-xs text-muted-foreground mt-2">{t("tc_no_lessons", "Chưa có bài học nào")}</p>
      ) : (
        <div className="mt-2 space-y-2">
          {selectedCourseLessons.map((lesson, idx) => (
            <div key={lesson.id} className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-xs font-medium text-foreground">
                {idx + 1}. {lesson.title}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {lesson.videoUrl && (
                  <a
                    href={lesson.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-[11px] text-blue-600"
                  >
                    <Video size={12} /> Video
                  </a>
                )}
                {(lesson.documents || []).map((doc, docIdx) => (
                  <a
                    key={`${lesson.id}-doc-${docIdx}`}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    download={doc.name || true}
                    className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[11px] text-red-600"
                  >
                    <FileText size={12} /> {doc.name || t("tc_document", "Tài liệu")}
                  </a>
                ))}
                {lesson.quizQuestions && lesson.quizQuestions.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] text-amber-600">
                     {lesson.quizQuestions.length} {t("tc_questions", "câu hỏi")}
                  </span>
                )}
              </div>
              {lesson.quizQuestions && lesson.quizQuestions.length > 0 && (
                <div className="mt-2 space-y-2 rounded-lg border border-amber-100 bg-amber-50/60 p-2">
                  {lesson.quizQuestions.map((quiz, qIdx) => (
                    <div key={`${lesson.id}-quiz-${qIdx}`}>
                      <p className="text-[11px] font-semibold text-foreground">
                        {qIdx + 1}. <ScientificText text={quiz.question || t("tc_no_content", "(Chưa có nội dung)")} />
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {quiz.type === "true-false"
                          ? t("tc_true_false", "Đúng/Sai")
                          : quiz.type === "multiple-select"
                          ? t("tc_multiple_answers", "Nhiều đáp án")
                          : t("tc_single_answer", "1 đáp án")}
                      </p>
                      {quiz.options && quiz.options.length > 0 && (
                        <div className="mt-1 grid gap-1 text-[11px]">
                          {quiz.options.map((opt, optIdx) => {
                            const isMulti = quiz.type === "multiple-select"
                            const isCorrect = isMulti
                              ? (quiz.correctAnswers || []).includes(optIdx)
                              : quiz.correctAnswer === optIdx
                            return (
                              <label key={`${lesson.id}-quiz-${qIdx}-opt-${optIdx}`} className="flex items-center gap-2 text-muted-foreground">
                                <input
                                  type={isMulti ? "checkbox" : "radio"}
                                  checked={isCorrect}
                                  readOnly
                                  className="h-3 w-3"
                                />
                                <span className={isCorrect ? "font-semibold text-foreground" : undefined}>
                                  <ScientificText text={opt} />
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Actions */}
    <div className="flex gap-2">
      {canEditCourse(course.status) && (
        <button
          onClick={() => handleEdit(course.id)}
          className="flex-1 py-2 rounded-lg bg-background border text-sm"
        >
          {t("tc_edit", "Chỉnh sửa")}
        </button>
      )}

      {(course.status === "draft" || course.status === "rejected") && (
        <button
          onClick={() => handleSubmitForReview(course.id)}
          className="flex-1 py-2 rounded-lg bg-primary text-white text-sm"
        >
          {course.status === "rejected"
            ? t("tc_resubmit", "Gửi duyệt lại")
            : t("tc_submit", "Gửi duyệt")}
        </button>
      )}
    </div>
  </div>
)}
                  {viewMode === "delete" && selectedCourse && selectedCourse.id === course.id && (
                    <div className="fixed inset-0 z-[9999] bg-black/0 backdrop-blur-sm" style={{pointerEvents: 'auto'}}>
                      <div
                        className="absolute max-w-xs w-full bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl p-6 animate-fadeIn"
                        style={menuRect ? {
                          left: `calc(${menuRect.left + menuRect.width / 2}px - 160px)`,
                          top: `calc(${menuRect.top + menuRect.height / 2}px - 180px)`,
                        } : {left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}
                      >
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Trash2 size={32} className="text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground dark:text-white mb-2 text-center">{t("tc_delete_title", "Xóa khóa học?")}</h2>
                        <p className="text-muted-foreground dark:text-slate-400 mb-6 text-center">
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
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Desktop: Table */}
        <div className="hidden xl:block bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("tc_th_course", "Khóa học")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("tc_th_category", "Danh mục")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("tc_th_students", "Học viên")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("tc_th_rating", "Đánh giá")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("tc_th_price", "Giá")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("tc_th_status", "Trạng thái")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("tc_th_actions", "Hành động")}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground dark:text-slate-400">
                      {t("tc_loading_courses", "Đang tải khóa học...")}
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr
                      key={course.id}
                      className={`border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth relative ${
                        menuOpenId === course.id ? "z-20" : "z-0"
                      }`}
                    >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-12 h-12 rounded-lg object-cover bg-secondary"
                        />
                        <div>
                          <p className="font-medium text-foreground dark:text-white line-clamp-1">{course.title}</p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{course.lessons} {t("tc_lessons", "bài học")} • {course.duration}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-secondary dark:bg-slate-800 rounded text-foreground dark:text-white text-xs">
                        {course.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white">{course.students}</td>
                    <td className="py-4 px-6">
                      {course.rating > 0 ? (
                        <span className="text-foreground dark:text-white flex items-center gap-1">
                          {course.rating}
                          <span className="text-yellow-500">★</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground dark:text-slate-400">{t("tc_no_rating", "Chưa có")}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white font-medium">{formatCurrencyByLanguage(course.price, language)}</td>
                    <td className="py-4 px-6">{getStatusBadge(course.status)}</td>
                    <td className="py-4 px-6" data-dropdown>
                      <div className="relative inline-flex" data-dropdown>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpenId(menuOpenId === course.id ? null : course.id)
                          }}
                          className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                        >
                          <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                        </button>
                        {menuOpenId === course.id && (
                          <div
                            className="absolute right-0 top-full mt-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-xl z-[99999] min-w-48"
                            data-dropdown
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetails(course)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white rounded-t-lg"
                            >
                              <Eye size={16} /> {t("tc_view_details", "Xem chi tiết")}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewStudentsProgress(course)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                            >
                              <BarChart3 size={16} /> {t("tc_view_students_progress_score", "Xem điểm & tiến độ")}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/teacher/assignments?courseId=${course.id}`)
                                setMenuOpenId(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                            >
                              <FileText size={16} /> {t("tc_grade_writing", "Chấm writing")}
                            </button>
                            {canEditCourse(course.status) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(course.id)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                              >
                                <Edit2 size={16} /> {t("tc_edit", "Chỉnh sửa")}
                              </button>
                            )}
                            {course.status === "draft" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSubmitForReview(course.id)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-primary dark:text-accent"
                              >
                                <Send size={16} /> {t("tc_submit", "Gửi duyệt")}
                              </button>
                            )}
                            {course.status === "rejected" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSubmitForReview(course.id)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-primary dark:text-accent"
                              >
                                <Send size={16} /> {t("tc_resubmit", "Gửi duyệt lại")}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(course)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 text-destructive rounded-b-lg"
                            >
                              <Trash2 size={16} /> {t("tc_delete_course", "Xóa khóa học")}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && filteredCourses.length === 0 && (
            <div className="py-12 text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">{t("tc_no_courses_found", "Không tìm thấy khóa học nào")}</p>
            </div>
          )}
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
    // Tính vị trí tương đối
    const left = menuRect.left - cardRect.left
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
          className="absolute z-[100001] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
          style={{ right: window.innerWidth - menuRect.right, top, width: 220 }}
        >
          <button
            onClick={() => {
              handleViewDetails(menuCourse)
              setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
            }}
            className="w-full px-4 py-4 flex items-center gap-3 hover:bg-secondary"
          >
            <Eye size={18} /> {t("tc_view_details", "Xem chi tiết")}
          </button>
          <button
            onClick={() => {
              handleViewStudentsProgress(menuCourse)
              setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
            }}
            className="w-full px-4 py-4 flex items-center gap-3 hover:bg-secondary"
          >
            <BarChart3 size={18} /> {t("tc_view_students_progress_score", "Xem điểm & tiến độ")}
          </button>
          <button
            onClick={() => {
              router.push(`/teacher/assignments?courseId=${menuCourse.id}`)
              setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
            }}
            className="w-full px-4 py-4 flex items-center gap-3 hover:bg-secondary"
          >
            <FileText size={18} /> {t("tc_grade_writing", "Chấm writing")}
          </button>
          {canEditCourse(menuCourse.status) && (
            <button
              onClick={() => {
                handleEdit(menuCourse.id)
                setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
              }}
              className="w-full px-4 py-4 flex items-center gap-3 hover:bg-secondary"
            >
              <Edit2 size={18} /> {t("tc_edit", "Chỉnh sửa")}
            </button>
          )}
          {(menuCourse.status === "draft" || menuCourse.status === "rejected") && (
            <button
              onClick={() => {
                handleSubmitForReview(menuCourse.id)
                setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
              }}
              className="w-full px-4 py-4 flex items-center gap-3 text-primary hover:bg-secondary"
            >
              <Send size={18} /> {menuCourse.status === "rejected" ? t("tc_resubmit", "Gửi duyệt lại") : t("tc_submit", "Gửi duyệt")}
            </button>
          )}
          <button
            onClick={() => {
              handleDeleteClick(menuCourse)
              setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
            }}
            className="w-full px-4 py-4 flex items-center gap-3 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={18} /> {t("tc_delete_course", "Xóa khóa học")}
          </button>
        </div>
      </>,
      card
    )
  })()}
    </div>     
  )
}