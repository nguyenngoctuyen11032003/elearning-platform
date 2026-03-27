"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Award,
  Timer,
  ClipboardList,
  BookOpen,
  Users,
  BarChart3,
  Trophy,
  Target,
  Brain
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-context"
import { autoTranslateData } from "@/lib/i18n/dynamic-translate"
import { ScientificText } from "@/components/scientific-text"
import { toast } from "sonner"

interface Question {
  id: string
  question: string
  image?: string
  type: "multiple_choice" | "true_false" | "fill_in" | "multiple-choice" | "true-false"
  options?: string[]
  correctAnswer: string | string[] | number
  explanation?: string
  points: number
  order: number
}

interface ExamDetail {
  id: string
  title: string
  description: string
  course: string
  courseId: string
  teacher: string
  teacherEmail: string
  teacherId: string
  type: "practice" | "official"
  status: "pending" | "approved" | "rejected" | "draft"
  createdAt: string
  updatedAt: string
  timeLimit: number
  passingScore: number
  maxAttempts: number
  questionsCount: number
  totalPoints: number
  certificateTemplate?: string
  rejectionReason?: string
  attemptCount: number
  questions: Question[]
  instructions: string[]
  passRate: number
  averageScore: number
}

// Mock data
const mockExamDetail: ExamDetail = {
  id: "1",
  title: "Bài thi cuối khóa Next.js",
  description: "Bài thi đánh giá kiến thức toàn diện về Next.js, App Router và Server Components",
  course: "Lập trình Next.js từ cơ bản đến nâng cao",
  courseId: "COURSE001",
  teacher: "Nguyễn Ngọc Tuyền",
  teacherEmail: "tuyen@example.com",
  teacherId: "INST001",
  type: "official",
  status: "approved",
  createdAt: "2024-01-20T10:30:00",
  updatedAt: "2024-03-15T14:20:00",
  timeLimit: 90,
  passingScore: 70,
  maxAttempts: 2,
  questionsCount: 50,
  totalPoints: 100,
  certificateTemplate: "Chứng chỉ Next.js Master",
  attemptCount: 245,
  passRate: 78,
  averageScore: 75.5,
  instructions: [
    "Đọc kỹ từng câu hỏi trước khi trả lời",
    "Bạn có 90 phút để hoàn thành bài thi",
    "Mỗi câu hỏi có một đáp án đúng duy nhất",
    "Bạn phải đạt ít nhất 70% để vượt qua bài thi",
    "Bạn có thể làm lại bài thi tối đa 2 lần"
  ],
  questions: [
    {
      id: "q1",
      question: "Next.js là gì?",
      type: "multiple-choice",
      options: [
        "Một thư viện JavaScript để xây dựng giao diện người dùng",
        "Một framework React để xây dựng ứng dụng web full-stack",
        "Một công cụ CSS-in-JS",
        "Một database NoSQL"
      ],
      correctAnswer: 1,
      explanation: "Next.js là một framework React mạnh mẽ, cung cấp các tính năng như SSR, SSG, và API routes để xây dựng ứng dụng web full-stack.",
      points: 2,
      order: 1
    },
    {
      id: "q2",
      question: "App Router trong Next.js 14 sử dụng cấu trúc thư mục nào?",
      type: "multiple-choice",
      options: [
        "pages/",
        "app/",
        "src/",
        "routes/"
      ],
      correctAnswer: 1,
      explanation: "App Router mới trong Next.js 13+ sử dụng thư mục 'app/' thay vì 'pages/' của Pages Router.",
      points: 2,
      order: 2
    },
    {
      id: "q3",
      question: "Server Components có thể sử dụng React hooks như useState và useEffect không?",
      type: "true-false",
      options: ["Đúng", "Sai"],
      correctAnswer: 1,
      explanation: "Server Components không thể sử dụng React hooks như useState, useEffect vì chúng chỉ chạy trên server, không có khả năng tương tác.",
      points: 2,
      order: 3
    },
    {
      id: "q4",
      question: "Để tạo một route động trong App Router, bạn cần đặt tên thư mục như thế nào?",
      type: "multiple-choice",
      options: [
        "[id]",
        "{id}",
        ":id",
        "$id"
      ],
      correctAnswer: 0,
      explanation: "Trong App Router, dynamic routes được tạo bằng cách đặt tên thư mục trong dấu ngoặc vuông như [id] hoặc [slug].",
      points: 2,
      order: 4
    },
    {
      id: "q5",
      question: "Server Actions trong Next.js được khai báo bằng directive nào?",
      type: "multiple-choice",
      options: [
        "'use client'",
        "'use server'",
        "'use action'",
        "'use async'"
      ],
      correctAnswer: 1,
      explanation: "Server Actions được đánh dấu bằng directive 'use server' ở đầu function hoặc file.",
      points: 2,
      order: 5
    },
    {
      id: "q6",
      question: "File layout.tsx trong App Router có tác dụng gì?",
      type: "multiple-choice",
      options: [
        "Định nghĩa các API routes",
        "Định nghĩa bố cục chung cho các trang con",
        "Xử lý lỗi 404",
        "Cấu hình metadata"
      ],
      correctAnswer: 1,
      explanation: "File layout.tsx định nghĩa UI chung được chia sẻ giữa các route, giúp tránh re-render không cần thiết.",
      points: 2,
      order: 6
    },
    {
      id: "q7",
      question: "Next.js hỗ trợ những phương pháp rendering nào?",
      type: "multiple-choice",
      options: [
        "Chỉ SSR",
        "Chỉ SSG",
        "SSR, SSG, ISR, và CSR",
        "Chỉ CSR"
      ],
      correctAnswer: 2,
      explanation: "Next.js linh hoạt hỗ trợ nhiều phương pháp rendering: SSR (Server-Side Rendering), SSG (Static Site Generation), ISR (Incremental Static Regeneration), và CSR (Client-Side Rendering).",
      points: 2,
      order: 7
    },
    {
      id: "q8",
      question: "Để tối ưu hóa hình ảnh trong Next.js, bạn nên sử dụng component nào?",
      type: "multiple-choice",
      options: [
        "<img>",
        "<Image>",
        "<Picture>",
        "<Photo>"
      ],
      correctAnswer: 1,
      explanation: "Next.js cung cấp component <Image> từ 'next/image' để tự động tối ưu hóa hình ảnh với lazy loading, responsive images, và format hiện đại như WebP.",
      points: 2,
      order: 8
    }
  ]
}

export default function AdminExamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const examId = Array.isArray(params.id) ? params.id[0] : (params.id as string)
  const [exam, setExam] = useState<ExamDetail>(mockExamDetail)
  const [usingMockData, setUsingMockData] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "attempts" | "analytics">("overview")
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectDialog, setRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  const mapExam = (item: any): ExamDetail => {
    const coerceString = (value: any): string => {
      if (value === undefined || value === null) return ""
      if (typeof value === "string") return value.trim()
      if (typeof value === "number" || typeof value === "boolean") return String(value)
      return ""
    }

    const extractOptionText = (option: any): string => {
      if (typeof option === "string") return option
      if (typeof option === "number" || typeof option === "boolean") return String(option)
      if (!option || typeof option !== "object") return ""
      return (
        coerceString(option.text) ||
        coerceString(option.label) ||
        coerceString(option.content) ||
        coerceString(option.value) ||
        ""
      )
    }

    const findFirstMeaningfulText = (source: any): string => {
      if (!source || typeof source !== "object") return ""

      const preferredKeys = [
        "question",
        "questionText",
        "text",
        "content",
        "prompt",
        "stem",
        "title",
        "name",
      ]

      for (const key of preferredKeys) {
        const candidate = source[key]
        if (typeof candidate === "string" && candidate.trim()) {
          return candidate.trim()
        }
      }

      const ignoredKeys = new Set([
        "id",
        "type",
        "questionType",
        "correctAnswer",
        "answer",
        "correct",
        "options",
        "points",
        "score",
        "mark",
        "weight",
        "image",
        "imageUrl",
      ])

      for (const [key, value] of Object.entries(source)) {
        if (ignoredKeys.has(key)) continue
        if (typeof value === "string" && value.trim()) {
          return value.trim()
        }
      }

      for (const value of Object.values(source)) {
        if (value && typeof value === "object") {
          const nested = findFirstMeaningfulText(value)
          if (nested) return nested
        }
      }

      return ""
    }

    const normalizeQuestionType = (value: any): Question["type"] => {
      const normalized = String(value || "multiple_choice").toLowerCase().trim()
      if (["multiple-choice", "multiple_choice", "mcq", "choice"].includes(normalized)) return "multiple_choice"
      if (["true-false", "true_false", "boolean"].includes(normalized)) return "true_false"
      if (["fill_in", "fill-in", "fillblank", "fill_blank"].includes(normalized)) return "fill_in"
      return "multiple_choice"
    }

    const parseRawQuestions = (value: any): any[] => {
      if (Array.isArray(value)) return value
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return []
    }

    const parseQuestionFromArray = (raw: any[], index: number): Question => {
      const cells = raw.map((cell) => coerceString(cell))
      const options = cells.slice(1, 7).filter(Boolean)
      const questionText = cells[0] || ""
      const answerValue = cells[7] || cells[cells.length - 1] || ""
      const pointsValue = Number(cells[8])
      const explanation = cells[9] || ""
      const isTrueFalse =
        options.length === 2 &&
        options.map((o) => o.toLowerCase()).includes("đúng") &&
        options.map((o) => o.toLowerCase()).includes("sai")

      return {
        id: `${index + 1}`,
        question: questionText,
        image: undefined,
        type: options.length >= 2 ? (isTrueFalse ? "true_false" : "multiple_choice") : "fill_in",
        options: options.length >= 2 ? options : [],
        correctAnswer: answerValue,
        explanation,
        points: Number.isFinite(pointsValue) && pointsValue > 0 ? pointsValue : 1,
        order: index + 1,
      }
    }

    const rawQuestions = parseRawQuestions(item?.questions)
    const normalizedQuestions: Question[] = rawQuestions.map((rawQuestion: any, index: number) => {
      let q = rawQuestion

      if (typeof q === "string") {
        try {
          q = JSON.parse(q)
        } catch {
          q = {
            question: rawQuestion,
            type: "fill_in",
            options: [],
            correctAnswer: "",
            points: 1,
          }
        }
      }

      if (Array.isArray(q)) {
        return parseQuestionFromArray(q, index)
      }

      const questionText = findFirstMeaningfulText(q)
      const questionType = normalizeQuestionType(q?.type || q?.questionType)
      const answerValue = q?.correctAnswer ?? q?.answer ?? q?.correct ?? ""
      const options = Array.isArray(q?.options)
        ? q.options.map((option: any) => extractOptionText(option)).filter(Boolean)
        : Array.isArray(q?.answers)
        ? q.answers.map((option: any) => extractOptionText(option)).filter(Boolean)
        : Array.isArray(q?.choices)
        ? q.choices.map((option: any) => extractOptionText(option)).filter(Boolean)
        : []
      const points = Number(q?.points ?? q?.score ?? q?.mark ?? q?.weight)
      const image =
        q?.image || q?.imageUrl || q?.imageURL || q?.img || q?.media?.url || undefined

      return {
        id: q?.id || `${index + 1}`,
        question: String(questionText),
        image,
        type: questionType,
        options,
        correctAnswer: answerValue,
        explanation: q?.explanation || q?.explain || "",
        points: Number.isFinite(points) && points > 0 ? points : 1,
        order: index + 1,
      }
    })

    const totalPoints = normalizedQuestions.reduce((sum: number, q: Question) => sum + (Number(q?.points) || 0), 0)
    const teacherName =
      item?.teacher?.name ||
      [item?.teacher?.firstName, item?.teacher?.lastName].filter(Boolean).join(" ") ||
      t("adm_examd_no_teacher", "Chưa có giảng viên")

    return {
      id: item?.id || "",
      title: item?.title || "",
      description: item?.description || "",
      course: item?.course?.title || "",
      courseId: item?.courseId || item?.course?.id || "",
      teacher: teacherName,
      teacherEmail: item?.teacher?.email || "",
      teacherId: item?.teacherId || item?.teacher?.id || "",
      type: item?.type || "practice",
      status: item?.status || "draft",
      createdAt: item?.createdAt || new Date().toISOString(),
      updatedAt: item?.updatedAt || item?.createdAt || new Date().toISOString(),
      timeLimit: Number(item?.timeLimit) || 60,
      passingScore: Number(item?.passingScore) || 70,
      maxAttempts: Number(item?.maxAttempts) || 3,
      questionsCount: normalizedQuestions.length,
      totalPoints,
      certificateTemplate: item?.certificateTemplate?.name || item?.certificateTemplateId || undefined,
      rejectionReason: item?.rejectionReason || undefined,
      attemptCount: Array.isArray(item?.attempts) ? item.attempts.length : Number(item?.attemptCount) || 0,
      questions: normalizedQuestions,
      instructions: [
        t("adm_examd_instr_1", "Đọc kỹ từng câu hỏi trước khi trả lời"),
        `${t("adm_examd_instr_2a", "Bạn có")} ${Number(item?.timeLimit) || 60} ${t("adm_examd_instr_2b", "phút để hoàn thành bài thi")}`,
        `${t("adm_examd_instr_3a", "Bạn phải đạt ít nhất")} ${Number(item?.passingScore) || 70}% ${t("adm_examd_instr_3b", "để vượt qua bài thi")}`,
        `${t("adm_examd_instr_4a", "Bạn có thể làm lại bài thi tối đa")} ${Number(item?.maxAttempts) || 3} ${t("adm_examd_instr_4b", "lần")}`,
      ],
      passRate: Number(item?.passRate) || 0,
      averageScore: Number(item?.averageScore) || 0,
    }
  }

  const handleApprove = async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/exams/${examId}/approve`, {
        method: "POST",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error(t("adm_examd_approve_fail", "Failed to approve exam"))
      toast.success(t("adm_examd_approve_ok", "Đã duyệt bài thi thành công"))
      await fetchExamDetail()
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t("adm_examd_approve_fail", "Không thể duyệt bài thi")
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim() || actionLoading) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/exams/${examId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      })
      if (!res.ok) throw new Error(t("adm_examd_reject_fail", "Failed to reject exam"))
      toast.success(t("adm_examd_reject_ok", "Đã từ chối bài thi"))
      setRejectDialog(false)
      setRejectionReason("")
      await fetchExamDetail()
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t("adm_examd_reject_fail", "Không thể từ chối bài thi")
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error(t("adm_examd_delete_fail", "Failed to delete exam"))
      toast.success(t("adm_examd_delete_ok", "Đã xóa bài thi thành công"))
      setConfirmDelete(false)
      setTimeout(() => router.push("/admin/exams"), 900)
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t("adm_examd_delete_fail", "Không thể xóa bài thi")
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  const fetchExamDetail = async () => {
    if (!examId) return
    setIsLoading(true)
    setLoadError("")

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error(t("adm_examd_load_fail", "Không thể tải chi tiết bài thi"))
      }

      const payload = await res.json()
      const item = payload?.data ?? payload
      setExam(mapExam(item))
      setUsingMockData(false)
    } catch (error) {
      console.error("Failed to fetch exam detail", error)
      setLoadError(t("adm_examd_load_fail", "Không thể tải chi tiết bài thi"))
      setUsingMockData(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!usingMockData) return

    let cancelled = false

    const localizeMock = async () => {
      // Don't translate exam data - keep original language
      if (!cancelled) {
        setExam(mockExamDetail)
      }
    }

    void localizeMock()

    return () => {
      cancelled = true
    }
  }, [language, usingMockData])

  useEffect(() => {
    fetchExamDetail()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, language])

  const isOptionCorrect = (question: Question, option: string, optionIndex: number) => {
    const answer = question.correctAnswer
    const optionText = option.trim().toLowerCase()
    const normalizedOptions = (question.options || []).map((item) => String(item || "").trim().toLowerCase())
    const isSelectorToken = (token: string) => {
      const normalizedToken = token.trim().toLowerCase()

      if (/^[a-f]$/.test(normalizedToken)) {
        const letter = String.fromCharCode(65 + optionIndex).toLowerCase()
        return normalizedToken === letter
      }

      if (/^\d+$/.test(normalizedToken) && !normalizedOptions.includes(normalizedToken)) {
        const numeric = Number.parseInt(normalizedToken, 10)
        return numeric === optionIndex + 1 || numeric === optionIndex
      }

      return false
    }

    if (typeof answer === "number") {
      return answer === optionIndex
    }

    if (Array.isArray(answer)) {
      const normalizedAnswers = answer.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean)
      if (normalizedAnswers.includes(optionText)) return true
      return normalizedAnswers.some((token) => isSelectorToken(token))
    }

    const normalized = String(answer || "").trim().toLowerCase()
    if (!normalized) return false
    if (normalized === optionText) return true
    return isSelectorToken(normalized)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { label: t("adm_examd_status_approved", "Đã duyệt"), icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
      pending: { label: t("adm_examd_status_pending", "Chờ duyệt"), icon: Clock, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" },
      rejected: { label: t("adm_examd_status_rejected", "Từ chối"), icon: XCircle, color: "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
      draft: { label: t("adm_examd_status_draft", "Bản nháp"), icon: FileText, color: "text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800" },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon size={16} />
        {config.label}
      </span>
    )
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple_choice": return t("adm_examd_qtype_mc", "Trắc nghiệm")
      case "multiple-choice": return t("adm_examd_qtype_mc", "Trắc nghiệm")
      case "true_false": return t("adm_examd_qtype_tf", "Đúng/Sai")
      case "true-false": return t("adm_examd_qtype_tf", "Đúng/Sai")
      case "fill_in": return t("adm_examd_qtype_fill", "Điền khuyết")
      default: return type
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

  const getVisibleQuestionText = (question: Question) => {
    const normalized = normalizeUploadedText(question.question)
    if (normalized.trim()) return normalized
    return `${t("adm_examd_question_prefix", "Câu hỏi")} #${question.order}: ${t("adm_examd_no_content", "chưa có nội dung hiển thị từ dữ liệu nguồn.")}`
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="w-full rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground dark:border-slate-800 dark:bg-slate-900/60">
          {t("adm_examd_loading", "Đang tải chi tiết bài thi...")}
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-6 md:p-8">
        <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="mb-4 text-red-600 dark:text-red-300">{loadError}</p>
          <button
            onClick={fetchExamDetail}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            {t("adm_examd_retry", "Thử lại")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{t("adm_examd_back", "Quay lại")}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={actionLoading}
              className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 disabled:opacity-50 text-destructive rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 size={18} />
              {t("adm_examd_delete", "Xóa")}
            </button>
          </div>
        </div>

        {/* Exam Header */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground dark:text-white">{exam.title}</h1>
                {exam.type === "official" && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-full">
                    {t("adm_examd_official", "Chính thức")}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground dark:text-slate-400 mb-3">{exam.description}</p>
              <Link href={`/admin/courses/${exam.courseId}`} className="text-primary dark:text-accent hover:underline text-sm">
                📚 {exam.course}
              </Link>
            </div>
            {getStatusBadge(exam.status)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
              <ClipboardList size={20} className="text-primary dark:text-accent" />
              <div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_examd_num_questions", "Số câu hỏi")}</p>
                <p className="font-semibold text-foreground dark:text-white">{exam.questionsCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
              <Timer size={20} className="text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_examd_time", "Thời gian")}</p>
                <p className="font-semibold text-foreground dark:text-white">{exam.timeLimit} {t("adm_examd_minutes", "phút")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
              <Target size={20} className="text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_examd_pass_score", "Điểm đạt")}</p>
                <p className="font-semibold text-foreground dark:text-white">{exam.passingScore}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
              <Users size={20} className="text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_examd_attempts", "Lượt thi")}</p>
                <p className="font-semibold text-foreground dark:text-white">{exam.attemptCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
              <Trophy size={20} className="text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_examd_pass_rate", "Tỷ lệ đạt")}</p>
                <p className="font-semibold text-foreground dark:text-white">{exam.passRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border dark:border-slate-800">
          <div className="flex gap-6">
            {["overview", "questions", "attempts", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary dark:border-accent text-primary dark:text-accent font-semibold"
                    : "border-transparent text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                }`}
              >
                {tab === "overview" && t("adm_examd_tab_overview", "Tổng quan")}
                {tab === "questions" && t("adm_examd_tab_questions", "Câu hỏi")}
                {tab === "attempts" && t("adm_examd_tab_attempts", "Bài thi")}
                {tab === "analytics" && t("adm_examd_tab_analytics", "Phân tích")}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Teacher Info */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-4">{t("adm_examd_teacher", "Giảng viên")}</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
                    {exam.teacher.split(" ").filter(Boolean).map(n => n[0]).join("") || "GV"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground dark:text-white">{exam.teacher}</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{exam.teacherEmail}</p>
                    <p className="text-sm text-primary dark:text-accent">ID: {exam.teacherId}</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={24} className="text-primary dark:text-accent" />
                  {t("adm_examd_instructions", "Hướng dẫn làm bài")}
                </h2>
                <ul className="space-y-3">
                  {exam.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground dark:text-slate-400">{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rejection Reason */}
              {exam.status === "rejected" && exam.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-3">
                    <AlertCircle size={24} />
                    <h3 className="font-semibold text-lg">{t("adm_examd_rejection_reason", "Lý do từ chối")}</h3>
                  </div>
                  <p className="text-red-600 dark:text-red-300">{exam.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Exam Settings */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-foreground dark:text-white">{t("adm_examd_settings", "Cài đặt")}</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_examd_exam_type", "Loại bài thi")}</span>
                    <span className="font-semibold text-foreground dark:text-white capitalize">{exam.type === 'official' ? t("adm_examd_official", "Chính thức") : t("adm_examd_practice", "Luyện tập")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_examd_max_attempts", "Số lần làm tối đa")}</span>
                    <span className="font-semibold text-foreground dark:text-white">{exam.maxAttempts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_examd_total_points", "Tổng điểm")}</span>
                    <span className="font-semibold text-foreground dark:text-white">{exam.totalPoints}</span>
                  </div>
                  {exam.certificateTemplate && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground dark:text-slate-400">{t("adm_examd_certificate", "Chứng chỉ")}</span>
                      <Award size={20} className="text-yellow-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Exam Info */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-foreground dark:text-white">{t("adm_examd_info", "Thông tin")}</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_examd_created_at", "Tạo lúc")}</span>
                    <span className="font-semibold text-foreground dark:text-white text-sm">
                      {new Date(exam.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_examd_updated_at", "Cập nhật")}</span>
                    <span className="font-semibold text-foreground dark:text-white text-sm">
                      {new Date(exam.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">{t("adm_examd_avg_score", "Điểm TB")}</span>
                    <span className="font-semibold text-foreground dark:text-white">{exam.averageScore.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground dark:text-white">{t("adm_examd_question_list", "Danh sách câu hỏi")} ({exam.questions.length})</h2>
              <span className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_examd_total_points_label", "Tổng điểm:")}{" "}{exam.totalPoints}</span>
            </div>
            <div className="space-y-6">
              {exam.questions.map((question, index) => (
                <div key={question.id} className="border border-border dark:border-slate-800 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 dark:bg-accent/10 flex items-center justify-center">
                      <span className="text-primary dark:text-accent font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex flex-col gap-2">
                          <h3 className="text-lg font-semibold text-foreground dark:text-white whitespace-pre-wrap break-words leading-relaxed">
                            <ScientificText text={getVisibleQuestionText(question)} />
                          </h3>
                          {/* Render ảnh nếu có */}
                          {question.image && (
                            <img src={question.image} alt={t("adm_examd_question_img", "Minh họa câu hỏi")} className="max-w-full rounded border border-border dark:border-slate-800 mt-2" />
                          )}  
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                            {getQuestionTypeLabel(question.type)}
                          </span>
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                            {question.points} {t("adm_examd_points", "điểm")}
                          </span>
                        </div>
                      </div>

                      {question.options && question.options.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, optionIndex) => (
                            <label
                              key={optionIndex}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none ${
                                isOptionCorrect(question, option, optionIndex)
                                  ? "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700"
                                  : "bg-secondary/30 dark:bg-slate-800/30 border-border dark:border-slate-800"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question_${index}`}
                                checked={isOptionCorrect(question, option, optionIndex)}
                                readOnly
                                className="form-radio h-5 w-5 text-green-600 focus:ring-green-500"
                              />
                              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                                isOptionCorrect(question, option, optionIndex)
                                  ? "bg-green-500 text-white"
                                  : "bg-secondary dark:bg-slate-700 text-muted-foreground dark:text-slate-400"
                              }`}>
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                                <span
                                  className={`${isOptionCorrect(question, option, optionIndex) ? "text-foreground dark:text-white font-medium" : "text-muted-foreground dark:text-slate-400"} whitespace-pre-wrap break-words leading-relaxed`}
                                >
                                  <ScientificText text={normalizeUploadedText(option)} />
                              </span>
                              {isOptionCorrect(question, option, optionIndex) && (
                                <CheckCircle size={18} className="ml-auto text-green-500" />
                              )}
                            </label>
                          ))}
                        </div>
                      )}

                      {question.type === "fill_in" && (
                        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                          <p className="mb-1 text-sm font-semibold text-green-700 dark:text-green-300">{t("adm_examd_fill_answer", "Đáp án điền khuyết")}</p>
                          <p className="text-sm text-green-700 dark:text-green-200">
                            {Array.isArray(question.correctAnswer)
                              ? <ScientificText text={question.correctAnswer.map((item) => normalizeUploadedText(String(item))).join(", ")} />
                              : <ScientificText text={normalizeUploadedText(String(question.correctAnswer || ""))} />}
                          </p>
                        </div>
                      )}

                      {question.type !== "fill_in" && (!question.options || question.options.length === 0) && (
                        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                          <p className="mb-1 text-sm font-semibold text-amber-700 dark:text-amber-300">{t("adm_examd_correct_answer", "Đáp án đúng")}</p>
                          <p className="text-sm text-amber-700 dark:text-amber-200 whitespace-pre-wrap break-words leading-relaxed">
                            {Array.isArray(question.correctAnswer)
                              ? <ScientificText text={question.correctAnswer.map((item) => normalizeUploadedText(String(item))).join(", ")} />
                              : <ScientificText text={normalizeUploadedText(String(question.correctAnswer || ""))} />}
                          </p>
                        </div>
                      )}

                      {question.explanation && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <Brain size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">{t("adm_examd_explanation", "Giải thích")}</p>
                              <p className="text-sm text-blue-600 dark:text-blue-300 whitespace-pre-wrap break-words leading-relaxed">
                                <ScientificText text={normalizeUploadedText(question.explanation)} />
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "attempts" && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">{t("adm_examd_history", "Lịch sử làm bài")}</h2>
            <p className="text-muted-foreground dark:text-slate-400 mb-6">{t("adm_examd_has_attempts", "Có")} {exam.attemptCount} {t("adm_examd_attempts_count", "lượt làm bài thi này.")}</p>
            <div className="rounded-xl border border-border bg-secondary/30 p-6 text-sm text-muted-foreground dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-400">
              {t("adm_examd_attempts_note", "Dữ liệu chi tiết từng lượt thi chưa được backend trả về ở endpoint chi tiết bài thi. Hiện trang đang hiển thị đúng tổng số lượt thi thực tế.")}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <Users className="text-blue-500 mb-3" size={32} />
                <p className="text-3xl font-bold text-foreground dark:text-white">{exam.attemptCount}</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_examd_total_attempts", "Tổng lượt thi")}</p>
              </div>
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <Trophy className="text-green-500 mb-3" size={32} />
                <p className="text-3xl font-bold text-foreground dark:text-white">{exam.passRate}%</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_examd_pass_rate", "Tỷ lệ đạt")}</p>
              </div>
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <BarChart3 className="text-purple-500 mb-3" size={32} />
                <p className="text-3xl font-bold text-foreground dark:text-white">{exam.averageScore.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_examd_average_score", "Điểm trung bình")}</p>
              </div>
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <Target className="text-orange-500 mb-3" size={32} />
                <p className="text-3xl font-bold text-foreground dark:text-white">{exam.passingScore}%</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_examd_benchmark", "Điểm chuẩn")}</p>
              </div>
            </div>

            <div className="mt-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">{t("adm_examd_chart_title", "Biểu đồ phân tích")}</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-400">
                {t("adm_examd_analytics_note", "Endpoint hiện tại chưa trả về dữ liệu phân bố điểm và xu hướng theo thời gian, nên trang chỉ hiển thị các chỉ số tổng quan thực tế ở phía trên.")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      {rejectDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-yellow-500 mb-4">
              <XCircle size={24} />
              <h3 className="text-lg font-bold">{t("adm_examd_reject_title", "Từ chối bài thi")}</h3>
            </div>
            <p className="text-sm text-muted-foreground dark:text-slate-400 mb-4">
              {t("adm_examd_reject_subtitle", "Nhập lý do từ chối bài thi")} <span className="font-medium text-foreground dark:text-white">&ldquo;{exam.title}&rdquo;</span>
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary mb-4"
              placeholder={t("adm_examd_reject_placeholder", "Nhập lý do từ chối bài thi...")}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRejectDialog(false); setRejectionReason("") }}
                className="px-4 py-2 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
              >
                {t("adm_examd_cancel", "Hủy")}
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? t("adm_examd_processing", "Đang xử lý...") : t("adm_examd_confirm_reject", "Xác nhận từ chối")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md p-6 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">{t("adm_examd_confirm_delete", "Xác nhận xóa")}</h3>
            </div>
            <p className="text-muted-foreground dark:text-slate-400 mb-6">
              {t("adm_examd_delete_msg", "Bạn có chắc chắn muốn xóa bài thi")} <span className="font-medium text-foreground dark:text-white">&ldquo;{exam.title}&rdquo;</span>? {t("adm_examd_cannot_undo", "Hành động này không thể hoàn tác.")}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
              >
                {t("adm_examd_cancel", "Hủy")}
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? t("adm_examd_deleting", "Đang xóa...") : t("adm_examd_delete_btn", "Xóa bài thi")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
