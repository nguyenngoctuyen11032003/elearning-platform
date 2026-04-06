"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  BookOpen,
  Users,
  DollarSign,
  Star,
  Clock,
  FileText,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  BarChart3,
  Calendar,
  Clipboard
} from "lucide-react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"
import { ScientificText } from "@/components/scientific-text"
import { AnimatedNumber } from "@/components/ui/rolling-number"

interface Lesson {
  id: string
  title: string
  type: "video" | "reading" | "quiz"
  duration: string
  order: number
  isPublished: boolean
  videoUrl?: string
  content?: string
  resources?: { name: string; url: string; type?: string }[]
  quizCount?: number
  quizQuestions?: {
    question: string
    image?: string
    options?: string[]
    type?: string
    correctAnswer?: number
    correctAnswers?: number[]
    correctAnswerText?: string
    explanation?: string
    difficulty?: number
    topic?: string
    learningObj?: string
    globalObj?: string
  }[]
  writingDueDate?: string
  writingPrompt?: string
  writingCriteria?: string[]
  writingMaxScore?: number
}

interface Section {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

interface CourseDetail {
  id: string
  title: string
  description: string
  instructor: string
  instructorEmail: string
  instructorId: string
  students: number
  revenue: number
  price: number
  status: "pending" | "rejected" | "published" | "draft" | "archived"
  createdAt: string
  updatedAt: string
  category: string
  thumbnail: string
  duration: string
  rating: number
  reviewCount: number
  level: "beginner" | "intermediate" | "advanced"
  language: "vi" | "en"
  requirements: string[]
  learningOutcomes: string[]
  sections: Section[]
  totalLessons: number
  totalVideoDuration: string
  enrollmentCount: number
  completionRate: number
  averageProgress: number
  ratingDistribution: { stars: number; count: number; percentage: number }[]
  rejectionReason?: string
}

interface EnrolledStudentRow {
  id: string
  name: string
  email: string
  progress: number
  status: string
  enrolledAt?: string
  lastAccessedAt?: string
}

const getAuth = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function MiniSparkline({
  values,
  lineClass,
}: {
  values: number[]
  lineClass: string
}) {
  if (!values.length) {
    return <div className="h-10 w-24 rounded-lg bg-slate-100/80 dark:bg-slate-800/70" />
  }

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(1, max - min)
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className="h-10 w-24">
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
        <polyline
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className={lineClass}
        />
      </svg>
    </div>
  )
}

export default function AdminCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "students" | "analytics">("overview")
  const [expandedQuizLessonId, setExpandedQuizLessonId] = useState<string | null>(null)
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudentRow[]>([])
  const [isSavingRejectReason, setIsSavingRejectReason] = useState(false)
  const [sparklineTick, setSparklineTick] = useState(0)
  const [rejectReasonDraft, setRejectReasonDraft] = useState("")

  const durationToMinutes = (value?: string) => {
    if (!value) return 0
    const text = String(value).trim().toLowerCase()
    if (!text) return 0

    const hourMatch = text.match(/(\d+)\s*(h|gio|hour)/i)
    const minuteMatch = text.match(/(\d+)\s*(m|phut|min|minute)/i)
    if (hourMatch || minuteMatch) {
      const hours = hourMatch ? Number(hourMatch[1]) : 0
      const minutes = minuteMatch ? Number(minuteMatch[1]) : 0
      return hours * 60 + minutes
    }

    const colonMatch = text.match(/^(\d{1,2}):(\d{1,2})$/)
    if (colonMatch) {
      return Number(colonMatch[1]) * 60 + Number(colonMatch[2])
    }

    const parsed = Number(text.replace(/[^\d.]/g, ""))
    return Number.isFinite(parsed) ? parsed : 0
  }

  const formatMinutes = (totalMinutes: number) => {
    if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
      return t("adm_cd_not_available", "Chưa có")
    }
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h`
    return `${minutes}m`
  }

  const normalizeRatingDistribution = (
    raw: unknown,
  ): { stars: number; count: number; percentage: number }[] => {
    const byStar = new Map<number, number>([
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
    ])

    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (!item || typeof item !== "object") continue
        const record = item as Record<string, unknown>
        const stars = Number(record.stars)
        const count = Number(record.count)
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) continue
        if (!Number.isFinite(count) || count < 0) continue
        byStar.set(stars, Math.round(count))
      }
    }

    const total = Array.from(byStar.values()).reduce((sum, count) => sum + count, 0)

    return [5, 4, 3, 2, 1].map((stars) => {
      const count = byStar.get(stars) || 0
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0
      return { stars, count, percentage }
    })
  }

  const calculateAverageRatingFromDistribution = (
    distribution: { stars: number; count: number; percentage: number }[],
  ) => {
    const totals = distribution.reduce(
      (acc, item) => {
        acc.count += item.count
        acc.weighted += item.stars * item.count
        return acc
      },
      { count: 0, weighted: 0 },
    )

    if (totals.count <= 0) return 0
    return Math.round((totals.weighted / totals.count) * 10) / 10
  }

  const parseWritingCriteria = (instructions: unknown): string[] => {
    if (!instructions) return []

    if (typeof instructions === "string") {
      try {
        const parsed = JSON.parse(instructions)
        if (Array.isArray(parsed?.gradingCriteria)) {
          return parsed.gradingCriteria.map((item: unknown) => String(item || "").trim()).filter(Boolean)
        }
        if (Array.isArray(parsed?.criteria)) {
          return parsed.criteria.map((item: unknown) => String(item || "").trim()).filter(Boolean)
        }
      } catch {
        return []
      }
    }

    return []
  }

  const toPlainText = (value: unknown): string => {
    if (value == null) return ""
    const raw = String(value)
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim()

    if (typeof window === "undefined") return raw
    const textarea = document.createElement("textarea")
    textarea.innerHTML = raw
    return textarea.value
  }

  const normalizeOptionText = (option: unknown): string => {
    if (option == null) return ""
    if (typeof option === "string") return toPlainText(option)
    if (typeof option === "object") {
      const opt = option as Record<string, unknown>
      return toPlainText(opt.content ?? opt.text ?? opt.label ?? opt.value)
    }
    return toPlainText(option)
  }

  const normalizeQuizQuestion = (q: Record<string, unknown>) => {
    const answerRows = Array.isArray(q.answers) ? (q.answers as Record<string, unknown>[]) : []
    const optionsFromQuestion = Array.isArray(q.options)
      ? (q.options as unknown[]).map(normalizeOptionText).filter(Boolean)
      : []
    const optionsFromAnswers = answerRows
      .map((answer) => normalizeOptionText(answer?.content ?? answer?.text ?? answer))
      .filter(Boolean)
    const options = optionsFromQuestion.length > 0 ? optionsFromQuestion : optionsFromAnswers

    let correctAnswers: number[] = []
    if (Array.isArray(q.correctAnswers)) {
      correctAnswers = (q.correctAnswers as unknown[])
        .map((index) => Number(index))
        .filter((index) => Number.isInteger(index) && index >= 0)
    } else if (typeof q.correctAnswer === "number") {
      correctAnswers = [q.correctAnswer as number]
    }

    if (correctAnswers.length === 0 && answerRows.length > 0) {
      correctAnswers = answerRows
        .map((answer, index) => {
          const rawFlag = answer?.is_correct ?? answer?.isCorrect
          const isCorrect =
            rawFlag === true ||
            rawFlag === 1 ||
            String(rawFlag).toLowerCase() === "true"
          return isCorrect ? index : -1
        })
        .filter((index) => index >= 0)
    }

    const rawType = toPlainText(q.type).toLowerCase()
    let type = rawType
    if (!type) {
      if (correctAnswers.length > 1) {
        type = "multiple-select"
      } else if (options.length === 0) {
        type = "fill_in"
      } else if (
        options.length === 2 &&
        options.some((option) => /^(đúng|true)$/i.test(option)) &&
        options.some((option) => /^(sai|false)$/i.test(option))
      ) {
        type = "true-false"
      } else {
        type = "multiple-choice"
      }
    }

    const question = toPlainText(
      q.question ?? q.content ?? q.contentHtml ?? q.content_html,
    )

    const fallbackFillAnswer =
      answerRows
        .map((answer) => {
          const rawFlag = answer?.is_correct ?? answer?.isCorrect
          const isCorrect =
            rawFlag === true ||
            rawFlag === 1 ||
            String(rawFlag).toLowerCase() === "true"
          return isCorrect ? toPlainText(answer?.content ?? answer?.text ?? answer?.value) : ""
        })
        .find(Boolean) || ""

    const correctAnswerText =
      type === "fill_in"
        ? (toPlainText(q.correctAnswer ?? q.answer ?? q.expectedAnswer) || fallbackFillAnswer || undefined)
        : undefined

    return {
      question,
      image: toPlainText(q.image) || undefined,
      options: options.length > 0 ? options : undefined,
      type,
      correctAnswer: correctAnswers.length > 0 ? correctAnswers[0] : undefined,
      correctAnswers: correctAnswers.length > 1 ? correctAnswers : undefined,
      correctAnswerText,
      explanation: toPlainText(q.explanation ?? q.reason ?? q.rationale) || undefined,
      difficulty:
        typeof q.difficulty === "number"
          ? (q.difficulty as number)
          : Number.isFinite(Number(q.difficulty))
          ? Number(q.difficulty)
          : undefined,
      topic: toPlainText(q.topic) || undefined,
      learningObj: toPlainText(q.learningObj ?? q.learning_obj) || undefined,
      globalObj: toPlainText(q.globalObj ?? q.global_obj) || undefined,
    }
  }

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true)
      try {
        const auth = getAuth()
        const [courseRes, lessonsRes, quizzesRes, assignments, enrollments] = await Promise.all([
          fetch(`/api/courses/${params.id}`, { headers: auth }),
          fetch(`/api/lessons/course/${params.id}`, { headers: auth }),
          fetch(`/api/quizzes/course/${params.id}`, { headers: auth }),
          apiClient.getAssignments(String(params.id)),
          apiClient.getCourseEnrollments(String(params.id)).catch(() => []),
        ])
        if (!courseRes.ok) throw new Error()
        const courseJson = await courseRes.json()
        // Unwrap {success, data} envelope
        const c = courseJson?.data ?? courseJson
        if (c?.status === "draft") {
          throw new Error("Draft course is not available for admin review")
        }
        const lessonsJson = lessonsRes.ok ? await lessonsRes.json() : []
        // Unwrap lessons: {success, data: {data: [...]} } or {success, data: [...]}
        const lessonsUnwrapped = lessonsJson?.data ?? lessonsJson
        const lessonArr = Array.isArray(lessonsUnwrapped)
          ? lessonsUnwrapped
          : Array.isArray(lessonsUnwrapped?.data)
          ? lessonsUnwrapped.data
          : []
        const quizzesJson = quizzesRes.ok ? await quizzesRes.json() : []
        const quizzesUnwrapped = quizzesJson?.data ?? quizzesJson
        const quizList = Array.isArray(quizzesUnwrapped)
          ? quizzesUnwrapped
          : Array.isArray(quizzesUnwrapped?.data)
          ? quizzesUnwrapped.data
          : []
        const quizByLesson: Record<string, any> = quizList.reduce((acc: Record<string, any>, quiz: any) => {
          if (quiz?.lessonId) {
            acc[quiz.lessonId] = quiz
          }
          return acc
        }, {})
        const assignmentByLesson: Record<string, any> = (Array.isArray(assignments) ? assignments : []).reduce(
          (acc: Record<string, any>, assignment: any) => {
            const lessonKey = String(assignment?.lessonId || "")
            if (lessonKey && !acc[lessonKey]) {
              acc[lessonKey] = assignment
            }
            return acc
          },
          {},
        )

        const lessonList: Lesson[] = lessonArr.map((l: Record<string, unknown>) => {
          const linkedQuiz = quizByLesson[l.id as string]
          const linkedAssignment = assignmentByLesson[l.id as string]
          const questions = Array.isArray(linkedQuiz?.questions) ? linkedQuiz.questions : []
          return {
          id: l.id as string,
          title: l.title as string,
          type: (l.type === "article" || l.type === "assignment" ? "reading" : l.type) as Lesson["type"],
          duration: l.duration ? String(l.duration) : "",
          order: (l.order as number) || 0,
          isPublished: (l.isPublished as boolean) || false,
          videoUrl: l.videoUrl as string | undefined,
          content: l.content as string | undefined,
          resources: (l.resources as Lesson["resources"]) || [],
            quizCount: questions.length,
            quizQuestions: questions.map((q: Record<string, unknown>) =>
              normalizeQuizQuestion(q),
            ),
            writingDueDate: linkedAssignment?.dueDate,
            writingPrompt: linkedAssignment?.description,
            writingCriteria: parseWritingCriteria(linkedAssignment?.instructions),
            writingMaxScore: typeof linkedAssignment?.maxScore === "number" ? linkedAssignment.maxScore : undefined,
          }
        })
        const teacher = (c.teacher as Record<string, unknown>) || {}
        const studentRows: EnrolledStudentRow[] = (Array.isArray(enrollments) ? enrollments : []).map((item: any) => {
          const student = item?.student || {}
          const name = String(student?.name || "").trim()
          const email = String(student?.email || "").trim()
          const rawProgress = item?.progress ?? item?.completionRate ?? item?.progressPercent ?? 0
          const progress = Number.isFinite(Number(rawProgress)) ? Math.max(0, Math.min(100, Number(rawProgress))) : 0
          return {
            id: String(item?.id || `${student?.id || ""}-${item?.courseId || ""}`),
            name: name || t("adm_cd_student_fallback", "Học viên"),
            email,
            progress,
            status: String(item?.status || "active"),
            enrolledAt: item?.createdAt ? String(item.createdAt) : undefined,
            lastAccessedAt: item?.lastAccessedAt ? String(item.lastAccessedAt) : undefined,
          }
        })

        setEnrolledStudents(studentRows)

        const totalMinutes = lessonList.reduce(
          (sum, lesson) => sum + durationToMinutes(lesson.duration),
          0,
        )
        const totalVideoMinutes = lessonList
          .filter((lesson) => lesson.type === "video")
          .reduce((sum, lesson) => sum + durationToMinutes(lesson.duration), 0)
        const ratingDistribution = normalizeRatingDistribution(c.ratingDistribution)
        const reviewCountFromDistribution = ratingDistribution.reduce(
          (sum, item) => sum + item.count,
          0,
        )
        const averageRatingFromDistribution = calculateAverageRatingFromDistribution(
          ratingDistribution,
        )

        const enrollmentCount = studentRows.length || Number(c.enrollmentCount) || 0
        const completedCount = studentRows.filter((student) => {
          const status = String(student.status || "").toLowerCase()
          return status === "completed" || student.progress >= 100
        }).length
        const completionRate = enrollmentCount > 0 ? Math.round((completedCount / enrollmentCount) * 100) : 0
        const averageProgress = enrollmentCount > 0
          ? Math.round(
              studentRows.reduce((sum, student) => sum + Number(student.progress || 0), 0) /
                enrollmentCount,
            )
          : 0
        const normalizedPrice = Number(c.price) || 0
        const normalizedRevenue = Number(c.revenue) || (normalizedPrice > 0 ? normalizedPrice * enrollmentCount : 0)

        setCourse({
          id: c.id,
          title: c.title,
          description: c.description || "",
          instructor: (teacher.name as string) || `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || "",
          instructorEmail: (teacher.email as string) || "",
          instructorId: (teacher.id as string) || "",
          students: enrollmentCount,
          revenue: normalizedRevenue,
          price: normalizedPrice,
          status: c.status,
          createdAt: c.createdAt || "",
          updatedAt: c.updatedAt || "",
          category: (c.category as Record<string, unknown>)?.name as string || "",
          thumbnail: c.thumbnail || "",
          duration: formatMinutes(totalMinutes),
          rating: Number(c.averageRating) || Number(c.rating) || averageRatingFromDistribution,
          reviewCount: reviewCountFromDistribution || Number(c.reviewCount) || 0,
          level: c.level || "beginner",
          language: c.language || "vi",
          requirements: c.requirements || [],
          learningOutcomes: c.learningOutcomes || [],
          sections: [{ id: "main", title: t("adm_cd_course_content", "Nội dung khóa học"), order: 1, lessons: lessonList }],
          totalLessons: lessonList.length,
          totalVideoDuration: formatMinutes(totalVideoMinutes),
          enrollmentCount,
          completionRate,
          averageProgress,
          ratingDistribution,
          rejectionReason: c.rejectionReason,
        })
        setRejectReasonDraft(String(c.rejectionReason || ""))
      } catch {
        toast.error(t("adm_cd_load_err", "Không thể tải thông tin khóa học"))
      } finally {
        setIsLoading(false)
      }
    }
    if (params.id) fetchCourse()
  }, [params.id])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSparklineTick((prev) => prev + 1)
    }, 9000)
    return () => window.clearInterval(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t("adm_cd_not_found", "Không tìm thấy khóa học")}</p>
      </div>
    )
  }

  const courseThumbnail = course.thumbnail?.trim() || "/image/logo-ics.jpg"

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { label: t("adm_cd_published", "Đã xuất bản"), icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
      approved: { label: t("adm_cd_approved", "Đã duyệt"), icon: CheckCircle, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
      pending: { label: t("adm_cd_pending", "Chờ duyệt"), icon: Clock, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" },
      rejected: { label: t("adm_cd_rejected", "Từ chối"), icon: XCircle, color: "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
      draft: { label: t("adm_cd_draft", "Nháp"), icon: Clock, color: "text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800" },
      archived: { label: t("adm_courses_archived", "Đã lưu trữ"), icon: XCircle, color: "text-slate-600 bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] ?? { label: status, icon: Clock, color: "text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800" }
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon size={16} />
        {config.label}
      </span>
    )
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video": return <Video size={18} className="text-blue-500" />
      case "reading": return <FileText size={18} className="text-green-500" />
      case "quiz": return <Clipboard size={18} className="text-purple-500" />
      default: return <BookOpen size={18} />
    }
  }

  const normalizeUploadedText = (value?: string) => {
    if (!value) return ""
    let text = value
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")

    if (typeof window !== "undefined") {
      const textarea = document.createElement("textarea")
      textarea.innerHTML = text
      text = textarea.value
    }

    return text
  }

  const formatDate = (value?: string) => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleDateString('vi-VN')
  }

  const formatLastAccess = (value?: string) => {
    if (!value) return t("adm_cd_never_accessed", "Chưa truy cập")
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleString('vi-VN')
  }

  const handleSaveRejectReason = async () => {
    if (!course || course.status !== "rejected" || isSavingRejectReason) return

    const reason = rejectReasonDraft.trim()
    if (!reason) {
      toast.error(t("adm_cd_edit_reason_required", "Vui lòng nhập lý do từ chối"))
      return
    }

    setIsSavingRejectReason(true)
    try {
      await apiClient.updateCourse(course.id, {
        status: "rejected",
        rejectionReason: reason,
      })
      setCourse((prev) => (prev ? { ...prev, rejectionReason: reason } : prev))
      toast.success(t("adm_cd_edit_saved", "Đã cập nhật khóa học"))
    } catch (error) {
      console.error("Failed to save rejection reason:", error)
      toast.error(t("adm_cd_edit_failed", "Không thể cập nhật khóa học"))
    } finally {
      setIsSavingRejectReason(false)
    }
  }

  const getMonthlyEnrollmentStats = () => {
    const now = new Date()
    const stats = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: `T${date.getMonth() + 1}`,
        enrollments: 0,
      }
    })

    const indexMap = new Map(stats.map((item, index) => [item.key, index]))
    enrolledStudents.forEach((student) => {
      if (!student.enrolledAt) return
      const d = new Date(student.enrolledAt)
      if (Number.isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const idx = indexMap.get(key)
      if (idx === undefined) return
      stats[idx].enrollments += 1
    })

    return stats.map((item) => ({
      ...item,
      revenue: item.enrollments * (Number(course?.price) || 0),
    }))
  }

  const qualityScore = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        Number(course.rating || 0) * 15 + Number(course.completionRate || 0) * 0.45,
      ),
    ),
  )

  const revenueEfficiency = course.students > 0 ? Math.round(course.revenue / course.students) : 0
  const reviewDensity = course.students > 0 ? Math.round((course.reviewCount / course.students) * 100) : 0
  const monthlyStats = getMonthlyEnrollmentStats()

  const realtimePulse = (seed: number, index: number) => {
    const base = Math.sin((sparklineTick + index + seed) / 2.4)
    const mix = Math.cos((sparklineTick + seed) / 3.7)
    return base * 0.08 + mix * 0.05
  }

  const studentSpark = monthlyStats.map((item, index) => Math.max(1, item.enrollments + item.enrollments * realtimePulse(2, index) + index + 1))
  const revenueSpark = monthlyStats.map((item, index) => Math.max(1, item.revenue + item.revenue * realtimePulse(4, index) + (index + 1) * 18000))
  const ratingSpark = Array.from({ length: 6 }).map((_, index) => Math.max(1, Number(course.rating || 0) + realtimePulse(6, index) + 0.05 * index))
  const durationBase = Math.max(1, durationToMinutes(course.duration))
  const durationSpark = Array.from({ length: 6 }).map((_, index) => Math.max(1, durationBase + durationBase * realtimePulse(8, index) + index * 2))

  const readinessTone =
    course.status === "published"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/25 dark:border-emerald-700/40"
      : course.status === "pending"
      ? "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/25 dark:border-amber-700/40"
      : "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-900/25 dark:border-rose-700/40"

  const readinessLabel =
    course.status === "published"
      ? t("adm_cd_ready_for_scale", "Sẵn sàng mở rộng")
      : course.status === "pending"
      ? t("adm_cd_waiting_review", "Đang chờ kiểm duyệt")
      : t("adm_cd_needs_improve", "Cần tối ưu trước khi phát hành")

  return (
    <div className="p-6 md:p-8">
      <div className="w-full space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-sky-500/20 via-cyan-500/10 to-indigo-500/15 p-6 shadow-[0_14px_44px_rgba(15,23,42,0.12)] md:p-8 dark:border-slate-800 dark:from-sky-900/25 dark:via-cyan-900/15 dark:to-indigo-900/20">
          <div className="absolute -right-14 -top-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-10 left-16 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <button
                onClick={() => router.back()}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-300/70 bg-white/70 px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <ArrowLeft size={18} />
                <span>{t("adm_cd_back", "Quay lại")}</span>
              </button>

              <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${readinessTone}`}>
                <BarChart3 size={14} />
                {readinessLabel}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="xl:col-span-8">
                <div className="flex flex-col gap-5 md:flex-row">
                  <img
                    src={courseThumbnail}
                    alt={course.title}
                    className="h-52 w-full rounded-2xl border border-white/40 object-cover shadow-[0_10px_28px_rgba(15,23,42,0.18)] md:h-56 md:w-96 dark:border-slate-700/50"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {getStatusBadge(course.status)}
                      <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-200">
                        {course.category || t("adm_cd_category", "Danh mục")}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">{course.title}</h1>
                    <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{course.description}</p>
                    <div className="grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-3 dark:text-slate-400">
                      <span>{t("adm_cd_level", "Trình độ")}: <strong className="text-slate-700 dark:text-slate-200 capitalize">{course.level}</strong></span>
                      <span>{t("adm_cd_language", "Ngôn ngữ")}: <strong className="text-slate-700 dark:text-slate-200">{course.language === 'vi' ? t('adm_cd_lang_vi', 'Tiếng Việt') : t('adm_cd_lang_en', 'Tiếng Anh')}</strong></span>
                      <span>{t("adm_cd_updated_at", "Cập nhật")}: <strong className="text-slate-700 dark:text-slate-200">{new Date(course.updatedAt).toLocaleDateString('vi-VN')}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-4">
                <div className="h-full rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/65">
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                    {t("adm_cd_intelligence_panel", "Bảng thông minh")}
                  </h3>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/70 p-3 dark:border-indigo-700/40 dark:bg-indigo-900/20">
                      <p className="text-xs text-indigo-700 dark:text-indigo-300">{t("adm_cd_quality_score", "Chỉ số chất lượng")}</p>
                      <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">{qualityScore}/100</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-200/70 dark:bg-indigo-900/40">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${qualityScore}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300">{t("adm_cd_revenue_per_student", "Doanh thu / HV")}</p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-200">
                          <AnimatedNumber value={revenueEfficiency} formatter={(value: number) => `${Math.round(value).toLocaleString("vi-VN")}đ`} durationMs={420} />
                        </p>
                      </div>
                      <div className="rounded-xl bg-sky-50 p-3 dark:bg-sky-900/20">
                        <p className="text-[11px] text-sky-700 dark:text-sky-300">{t("adm_cd_review_density", "Mật độ đánh giá")}</p>
                        <p className="text-sm font-bold text-sky-700 dark:text-sky-200"><AnimatedNumber value={reviewDensity} durationMs={420} />%</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                      {t("adm_cd_smart_hint", "Hệ thống đề xuất tăng tỉ lệ hoàn thành bằng cách rút gọn đoạn video dài và thêm checkpoint quiz cho mỗi chương.")}
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/65">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        {t("adm_cd_reject_reason_studio", "Rejection Reason Studio")}
                      </p>
                      {course.status === "rejected" ? (
                        <>
                          <textarea
                            value={rejectReasonDraft}
                            onChange={(e) => setRejectReasonDraft(e.target.value)}
                            rows={4}
                            className="mt-2 w-full rounded-xl border border-rose-200/80 bg-rose-50/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-rose-400 dark:border-rose-700/50 dark:bg-rose-900/20 dark:text-slate-200"
                            placeholder={t("adm_cd_rejection_reason_placeholder", "Nhập lý do từ chối...")}
                          />
                          <button
                            onClick={() => void handleSaveRejectReason()}
                            disabled={isSavingRejectReason}
                            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-700/50 dark:bg-rose-900/20 dark:text-rose-300"
                          >
                            {isSavingRejectReason ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {t("adm_cd_save_reject_reason", "Lưu lý do từ chối")}
                          </button>
                        </>
                      ) : (
                        <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">
                          {t("adm_cd_reject_reason_hint", "Lý do từ chối sẽ được nhập tại đây khi khóa học ở trạng thái Từ chối.")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="group rounded-2xl border border-white/35 bg-white/80 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/70 dark:bg-slate-900/70">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-300">{t("adm_cd_students", "Học viên")}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={course.students} durationMs={420} /></p>
                  </div>
                  <Users size={18} className="text-blue-500" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Realtime</span>
                  <MiniSparkline values={studentSpark} lineClass="text-blue-500" />
                </div>
              </div>
              <div className="group rounded-2xl border border-white/35 bg-white/80 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/70 dark:bg-slate-900/70">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-300">{t("adm_cd_revenue", "Doanh thu")}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={course.revenue / 1000000} formatter={(value: number) => value.toFixed(1)} durationMs={420} />M</p>
                  </div>
                  <DollarSign size={18} className="text-emerald-500" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Realtime</span>
                  <MiniSparkline values={revenueSpark} lineClass="text-emerald-500" />
                </div>
              </div>
              <div className="group rounded-2xl border border-white/35 bg-white/80 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/70 dark:bg-slate-900/70">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-300">{t("adm_cd_rating", "Đánh giá")}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={course.rating} formatter={(value: number) => value.toFixed(1)} durationMs={420} /></p>
                  </div>
                  <Star size={18} className="text-amber-500" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Realtime</span>
                  <MiniSparkline values={ratingSpark} lineClass="text-amber-500" />
                </div>
              </div>
              <div className="group rounded-2xl border border-white/35 bg-white/80 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/70 dark:bg-slate-900/70">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-300">{t("adm_cd_duration", "Thời lượng")}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{course.duration}</p>
                  </div>
                  <Clock size={18} className="text-violet-500" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Realtime</span>
                  <MiniSparkline values={durationSpark} lineClass="text-violet-500" />
                </div>
              </div>
            </div>

            <div className="pt-1" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/65">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {["overview", "content", "students", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_10px_22px_rgba(59,130,246,0.35)]"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
                }`}
              >
                {tab === "overview" && t("adm_cd_tab_overview", "Tổng quan")}
                {tab === "content" && t("adm_cd_tab_content", "Nội dung")}
                {tab === "students" && t("adm_cd_tab_students", "Học viên")}
                {tab === "analytics" && t("adm_cd_tab_analytics", "Thống kê")}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" key="tab-overview">
            <div className="lg:col-span-2 space-y-6 animate-slideUp" style={{ animationDelay: "0.06s" }}>
              {/* Instructor Info */}
              <div className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.1)]">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-4">{t("adm_cd_instructor", "Giảng viên")}</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
                    {course.instructor.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground dark:text-white">{course.instructor}</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{course.instructorEmail}</p>
                    <p className="text-sm text-primary dark:text-accent">ID: {course.instructorId}</p>
                  </div>
                </div>
              </div>

              {/* Learning Outcomes */}
              <div className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.1)]">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-4">{t("adm_cd_outcomes", "Học viên sẽ học được gì")}</h2>
                <ul className="space-y-3">
                  {course.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground dark:text-slate-400">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.1)]">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-4">{t("adm_cd_requirements", "Yêu cầu")}</h2>
                <ul className="space-y-3">
                  {course.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground dark:text-slate-400">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 animate-slideUp" style={{ animationDelay: "0.14s" }}>
              {/* Course Stats */}
              <div className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.1)]">
                <h2 className="text-xl font-bold text-foreground dark:text-white">{t("adm_cd_stats", "Thống kê")}</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_total_lessons", "Tổng bài học")}</span>
                    <span className="font-semibold text-foreground dark:text-white"><AnimatedNumber value={course.totalLessons} durationMs={380} /></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_video_duration", "Thời lượng video")}</span>
                    <span className="font-semibold text-foreground dark:text-white">{course.totalVideoDuration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_enrollments", "Số lượt đăng ký")}</span>
                    <span className="font-semibold text-foreground dark:text-white"><AnimatedNumber value={course.enrollmentCount} durationMs={380} /></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_completion_rate", "Tỷ lệ hoàn thành")}</span>
                    <span className="font-semibold text-green-600"><AnimatedNumber value={course.completionRate} formatter={(value: number) => value.toFixed(1)} durationMs={380} />%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_avg_progress", "Tiến độ TB")}</span>
                    <span className="font-semibold text-foreground dark:text-white"><AnimatedNumber value={course.averageProgress} formatter={(value: number) => value.toFixed(1)} durationMs={380} />%</span>
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <div className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.1)]">
                <h2 className="text-xl font-bold text-foreground dark:text-white">{t("adm_cd_info", "Thông tin")}</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_price", "Giá")}</span>
                    <span className="font-semibold text-foreground dark:text-white"><AnimatedNumber value={course.price} formatter={(value: number) => `${Math.round(value).toLocaleString("vi-VN")}đ`} durationMs={400} /></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_category", "Danh mục")}</span>
                    <span className="font-semibold text-foreground dark:text-white">{course.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_level", "Trình độ")}</span>
                    <span className="font-semibold text-foreground dark:text-white capitalize">{course.level}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_language", "Ngôn ngữ")}</span>
                    <span className="font-semibold text-foreground dark:text-white">{course.language === 'vi' ? t('adm_cd_lang_vi', 'Tiếng Việt') : t('adm_cd_lang_en', 'Tiếng Anh')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_created_at", "Tạo lúc")}</span>
                    <span className="font-semibold text-foreground dark:text-white">
                      {new Date(course.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_updated_at", "Cập nhật")}</span>
                    <span className="font-semibold text-foreground dark:text-white">
                      {new Date(course.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.1)] animate-fadeIn" key="tab-content">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">{t("adm_cd_course_content", "Nội dung khóa học")}</h2>
            <div className="space-y-4 animate-slideUp" style={{ animationDelay: "0.08s" }}>
              {course.sections.map((section) => (
                <div key={section.id} className="border border-border dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4">
                    <h3 className="font-semibold text-foreground dark:text-white">
                      {section.order}. {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                      <AnimatedNumber value={section.lessons.length} durationMs={320} /> {t("adm_cd_lessons_unit", "bài học")}
                    </p>
                  </div>
                  <div className="divide-y divide-border dark:divide-slate-800">
                    {section.lessons.map((lesson) => (
                      <div key={lesson.id} className="p-4 hover:bg-secondary/30 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {getLessonIcon(lesson.type)}
                            <div className="flex-1">
                              <p className="font-medium text-foreground dark:text-white">{lesson.title}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground dark:text-slate-400 capitalize">
                                  {lesson.type === 'video' && 'Video'}
                                  {lesson.type === 'reading' && t('adm_cd_type_reading', 'Đọc')}
                                  {lesson.type === 'quiz' && t('adm_cd_type_quiz', 'Bài tập')}
                                </span>
                                <span className="text-xs text-muted-foreground dark:text-slate-400">•</span>
                                <span className="text-xs text-muted-foreground dark:text-slate-400">{lesson.duration}</span>
                              </div>
                              {lesson.resources && lesson.resources.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {lesson.resources.map((resource, index) => (
                                    <a
                                      key={`${lesson.id}-resource-${index}`}
                                      href={resource.url}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                                      target="_blank"
                                      rel="noreferrer"
                                      download={resource.name || true}
                                    >
                                      <FileText size={12} />
                                      {resource.name}
                                    </a>
                                  ))}
                                </div>
                              )}
                              {lesson.quizCount && lesson.quizCount > 0 && (
                                <div className="mt-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedQuizLessonId(
                                        expandedQuizLessonId === lesson.id ? null : lesson.id,
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                                  >
                                    <Clipboard size={12} />
                                    <AnimatedNumber value={lesson.quizCount} durationMs={320} /> {t("adm_cd_questions", "câu hỏi")}
                                  </button>
                                </div>
                              )}
                              {(lesson.writingPrompt || lesson.writingDueDate || (lesson.writingCriteria && lesson.writingCriteria.length > 0)) && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700">
                                    <FileText size={12} />
                                    Writing
                                  </span>
                                </div>
                              )}
                              {expandedQuizLessonId === lesson.id &&
                                lesson.quizQuestions &&
                                lesson.quizQuestions.length > 0 && (
                                  <div className="mt-3 space-y-2 rounded-lg border border-amber-100 bg-amber-50/60 p-3">
                                    {lesson.quizQuestions.map((quiz, idx) => (
                                      <div key={`${lesson.id}-q-${idx}`}>
                                        <p className="text-xs font-semibold text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                          {idx + 1}. <ScientificText text={normalizeUploadedText(quiz.question) || t("adm_cd_no_content", "(Chưa có nội dung)")} />
                                        </p>
                                        {quiz.image && (
                                          <img
                                            src={quiz.image}
                                            alt={`${t("adm_cd_question_img", "Ảnh câu hỏi")} ${idx + 1}`}
                                            className="mt-2 max-w-xs rounded border border-amber-200"
                                          />
                                        )}
                                        <p className="text-[11px] text-muted-foreground">
                                          {quiz.type === "true-false"
                                            ? t("adm_cd_true_false", "Đúng/Sai")
                                            : quiz.type === "multiple-select"
                                            ? t("adm_cd_multi_answer", "Nhiều đáp án")
                                            : t("adm_cd_single_answer", "1 đáp án")}
                                        </p>
                                        {quiz.options && quiz.options.length > 0 && (
                                          <div className="mt-2 grid gap-1 text-xs">
                                            {quiz.options.map((opt, optIdx) => {
                                              const isMulti = quiz.type === "multiple-select"
                                              const isCorrect = isMulti
                                                ? (quiz.correctAnswers || []).includes(optIdx)
                                                : quiz.correctAnswer === optIdx
                                              return (
                                                <label
                                                  key={`${lesson.id}-q-${idx}-o-${optIdx}`}
                                                  className="flex items-center gap-2 text-muted-foreground"
                                                >
                                                  <input
                                                    type={isMulti ? "checkbox" : "radio"}
                                                    checked={isCorrect}
                                                    readOnly
                                                    className="h-3.5 w-3.5"
                                                  />
                                                  <span
                                                    className={`${isCorrect ? "font-semibold text-foreground" : ""} whitespace-pre-wrap break-words leading-relaxed`}
                                                  >
                                                    <ScientificText text={normalizeUploadedText(opt)} />
                                                  </span>
                                                </label>
                                              )
                                            })}
                                          </div>
                                        )}
                                        {quiz.type === "fill_in" && quiz.correctAnswerText && (
                                          <p className="mt-2 text-xs text-emerald-700">
                                            <strong>{t("adm_cd_fill_answer", "Đáp án điền khuyết")}:</strong> <ScientificText text={normalizeUploadedText(quiz.correctAnswerText)} />
                                          </p>
                                        )}
                                        {quiz.explanation && (
                                          <p className="mt-1 text-xs text-blue-700 whitespace-pre-wrap break-words leading-relaxed">
                                            <strong>{t("adm_cd_explanation", "Giải thích")}:</strong> <ScientificText text={normalizeUploadedText(quiz.explanation)} />
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {(lesson.writingPrompt || lesson.writingDueDate || (lesson.writingCriteria && lesson.writingCriteria.length > 0)) && (
                                  <div className="mt-3 space-y-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50/60 p-3">
                                    {lesson.writingDueDate && (
                                      <p className="text-xs text-fuchsia-800">
                                        <strong>{t("adm_cd_due_date", "Hạn nộp")}:</strong> {new Date(lesson.writingDueDate).toLocaleString('vi-VN')}
                                      </p>
                                    )}
                                    {typeof lesson.writingMaxScore === "number" && (
                                      <p className="text-xs text-fuchsia-800">
                                        <strong>{t("adm_cd_max_score", "Điểm tối đa")}:</strong> {lesson.writingMaxScore}
                                      </p>
                                    )}
                                    {lesson.writingPrompt && (
                                      <p className="text-xs text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                        <ScientificText text={normalizeUploadedText(lesson.writingPrompt)} />
                                      </p>
                                    )}
                                    {Array.isArray(lesson.writingCriteria) && lesson.writingCriteria.length > 0 && (
                                      <ul className="space-y-1 text-xs text-fuchsia-900">
                                        {lesson.writingCriteria.map((criterion, idx) => (
                                          <li key={`${lesson.id}-criteria-${idx}`}>{idx + 1}. {criterion}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {lesson.isPublished ? (
                              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle size={14} />
                                {t("adm_cd_published", "Đã xuất bản")}
                              </span>
                            ) : (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                <Clock size={14} />
                                {t("adm_cd_draft", "Bản nháp")}
                              </span>
                            )}
                            {lesson.videoUrl ? (
                              <a
                                href={lesson.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 hover:bg-secondary dark:hover:bg-slate-700 rounded-lg transition-colors"
                                aria-label={`${t("adm_cd_open_video", "Mở video bài học")} ${lesson.title}`}
                              >
                                <PlayCircle size={18} className="text-primary dark:text-accent" />
                              </a>
                            ) : (
                              <button
                                className="p-2 rounded-lg text-muted-foreground cursor-not-allowed"
                                aria-label={`${t("adm_cd_no_video", "Bài học chưa có video")} ${lesson.title}`}
                                disabled
                              >
                                <PlayCircle size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.1)] animate-fadeIn" key="tab-students">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">{t("adm_cd_enrolled_students", "Học viên đăng ký")}</h2>
            <p className="text-muted-foreground dark:text-slate-400 mb-6">{t("adm_cd_student_list", "Danh sách")} <AnimatedNumber value={course.students} durationMs={420} /> {t("adm_cd_students_enrolled", "học viên đã đăng ký khóa học này.")}</p>
            
            <div className="overflow-x-auto animate-slideUp" style={{ animationDelay: "0.08s" }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground dark:text-white">{t("adm_cd_col_student", "Học viên")}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Email</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground dark:text-white">{t("adm_cd_col_progress", "Tiến độ")}</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground dark:text-white">{t("adm_cd_col_status", "Trạng thái")}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground dark:text-white">{t("adm_cd_col_enrolled_date", "Ngày đăng ký")}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground dark:text-white">{t("adm_cd_col_last_access", "Lần cuối truy cập")}</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((student) => (
                    <tr key={student.id} className="border-b border-border dark:border-slate-800 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-foreground dark:text-white font-medium">{student.name}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-400">{student.email || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-semibold text-foreground dark:text-white"><AnimatedNumber value={student.progress} durationMs={320} />%</span>
                          <div className="w-20 bg-muted dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-primary to-blue-400 h-full rounded-full transition-all"
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {String(student.status).toLowerCase() === 'completed' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t("adm_cd_completed", "Hoàn thành")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {t("adm_cd_studying", "Đang học")}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-400">{formatDate(student.enrolledAt)}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-400">{formatLastAccess(student.lastAccessedAt)}</td>
                    </tr>
                  ))}
                  {enrolledStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground dark:text-slate-400">
                        {t("adm_cd_no_enrolled_students", "Chưa có học viên đăng ký khóa học này")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground dark:text-slate-400">
                {t("adm_cd_showing", "Hiển thị")} <AnimatedNumber value={enrolledStudents.length} durationMs={320} /> / <AnimatedNumber value={course.students} durationMs={320} /> {t("adm_cd_students", "học viên")}
              </p>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.1)] animate-fadeIn" key="tab-analytics">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">{t("adm_cd_analytics_title", "Phân tích & Thống kê")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slideUp" style={{ animationDelay: "0.05s" }}>
              <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl">
                <BarChart3 className="text-blue-500 mb-3" size={32} />
                <p className="text-2xl font-bold text-foreground dark:text-white"><AnimatedNumber value={course.enrollmentCount} durationMs={420} /></p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_cd_total_enrollments", "Tổng đăng ký")}</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl">
                <CheckCircle className="text-green-500 mb-3" size={32} />
                <p className="text-2xl font-bold text-foreground dark:text-white"><AnimatedNumber value={course.completionRate} formatter={(value: number) => value.toFixed(1)} durationMs={420} />%</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_cd_completion_rate", "Tỷ lệ hoàn thành")}</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl">
                <Star className="text-purple-500 mb-3" size={32} />
                <p className="text-2xl font-bold text-foreground dark:text-white"><AnimatedNumber value={course.rating} formatter={(value: number) => value.toFixed(1)} durationMs={420} />/5</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_cd_avg_rating", "Đánh giá trung bình")}</p>
              </div>
            </div>
            
            {/* Revenue Over Time Chart */}
            <div className="mt-6 bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 animate-slideUp" style={{ animationDelay: "0.12s" }}>
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">{t("adm_cd_revenue_over_time", "Doanh thu theo thời gian")}</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {getMonthlyEnrollmentStats().map((data, index, arr) => {
                  const maxRevenue = Math.max(...arr.map((item) => item.revenue), 1)
                  return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs text-muted-foreground dark:text-slate-400 mb-1">
                      {(data.revenue / 1000000).toFixed(0)}M
                    </div>
                    <div 
                      className="w-full bg-gradient-to-t from-green-500 to-emerald-400 dark:from-green-600 dark:to-emerald-400 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                      style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                      title={`${data.enrollments} ${t("adm_cd_enrollments_unit", "đăng ký")}, ${(data.revenue / 1000000).toFixed(1)}M VNĐ`}
                    ></div>
                    <div className="text-xs font-medium text-foreground dark:text-white">{data.month}</div>
                    <div className="text-xs text-muted-foreground dark:text-slate-400">{data.enrollments}</div>
                  </div>
                )})}
              </div>
              <div className="mt-4 pt-4 border-t border-border dark:border-slate-800 flex justify-between text-sm">
                <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_enrollment_count", "Số lượng đăng ký")}</span>
                <span className="text-muted-foreground dark:text-slate-400">{t("adm_cd_revenue_million", "Doanh thu (triệu VNĐ)")}</span>
              </div>
            </div>
            
            {/* Completion Rate by Section */}
            <div className="mt-6 bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 animate-slideUp" style={{ animationDelay: "0.16s" }}>
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">{t("adm_cd_completion_by_section", "Tỷ lệ hoàn thành theo chương")}</h3>
              <div className="space-y-4">
                {course.sections.map((section, index) => {
                  const completion = course.averageProgress
                  const lessons = section.lessons.length
                  return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground dark:text-white font-medium">{section.title}</span>
                      <span className="text-muted-foreground dark:text-slate-400">{lessons} {t("adm_cd_lessons_unit_short", "bài")} • {completion}%</span>
                    </div>
                    <div className="w-full bg-muted dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${completion}%`,
                          background: `linear-gradient(to right, ${completion > 70 ? '#10b981' : completion > 50 ? '#f59e0b' : '#ef4444'}, ${completion > 70 ? '#34d399' : completion > 50 ? '#fbbf24' : '#f87171'})`
                        }}
                      ></div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
            
            {/* Rating Distribution */}
            <div className="mt-6 bg-white/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 animate-slideUp" style={{ animationDelay: "0.2s" }}>
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">{t("adm_cd_rating_dist", "Phân bố đánh giá")}</h3>
              <div className="space-y-3">
                {course.ratingDistribution.map((rating) => (
                  <div key={rating.stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium text-foreground dark:text-white">{rating.stars}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-muted dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full"
                          style={{ width: `${rating.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-slate-400 w-20 text-right">
                      {rating.count} ({rating.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
