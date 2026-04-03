"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { authFetch } from "@/lib/authfetch"
import { BarChart3, ChevronDown, ChevronRight, Clock, FileText, Loader2, Pencil, Plus, Search, ShieldCheck, Trash2, Users } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { ScientificText } from "@/components/scientific-text"
import * as XLSX from "xlsx"

type Exam = {
  id: string
  title: string
  courseId: string
  courseName?: string
  type: "practice" | "official"
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt?: string
  questions?: any
  questionsCount?: number
  attemptCount?: number
  timeLimit?: number
  variantCount?: number
  variants?: Array<{ code: number; questions: any[] }>
}

type ExtractedExamAttempt = {
  id: string
  studentId: string
  student?: {
    id: string
    name?: string
    email?: string
    avatar?: string
  } | null
  score: number
  passed: boolean
  earnedPoints: number
  totalPoints: number
  variantCode?: number | null
  questionResults?: Array<{
    id: string
    type: string
    question: string
    options: string[]
    userAnswer: any
    correctAnswer: any
    isCorrect: boolean
    explanation?: string
    image?: string
  }>
  submittedAt?: string
  createdAt?: string
}

const normalizeList = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data
  return []
}

const parseQuestionsCount = (value: any): number => {
  let data = value
  while (typeof data === "string") {
    try {
      data = JSON.parse(data)
    } catch {
      break
    }
  }
  if (Array.isArray(data)) return data.length
  return Number(data?.length) || 0
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

interface ExamCardProps {
  exam: Exam
  compactMode?: boolean
  onEdit: (examId: string) => void
  onViewAttempts: (exam: Exam) => void
  onDelete: (examId: string, title: string) => void
  onViewVariantQuestions: (exam: Exam, variant: any) => void
}

function ExamCard({ exam, compactMode = false, onEdit, onViewAttempts, onDelete, onViewVariantQuestions }: ExamCardProps) {
  const [isCardExpanded, setIsCardExpanded] = useState(!compactMode)
  const [isVariantsExpanded, setIsVariantsExpanded] = useState(false)

  useEffect(() => {
    setIsCardExpanded(!compactMode)
  }, [compactMode, exam.id])
  
  const variants = (exam.variants || []).sort((a, b) => a.code - b.code)
  const displayVariants = variants.slice(0, 3)
  const hasMoreVariants = variants.length > 3

  const getStatusColor = (status: Exam["status"]) => {
    const map = {
      draft: "bg-slate-500/10 text-slate-500 border-slate-500/30",
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
      approved: "bg-green-500/10 text-green-600 border-green-500/30",
      rejected: "bg-red-500/10 text-red-600 border-red-500/30",
    } as const
    return map[status]
  }

  const getStatusLabel = (status: Exam["status"]) => {
    const map = {
      draft: "Nháp",
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Từ chối",
    } as const
    return map[status]
  }
  
  return (
    <>
      <div className="rounded-[14px] p-5 border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f172a] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        {/* Header - Clickable to expand */}
        <div 
          onClick={() => compactMode && setIsCardExpanded((prev) => !prev)}
          className={`flex items-start justify-between gap-4 mb-4 ${compactMode ? 'cursor-pointer group' : ''}`}
        >
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-semibold text-slate-900 dark:text-white truncate ${compactMode ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors' : ''}`}>{exam.title}</h3>
            <p className={`text-sm text-slate-600 dark:text-slate-400 mt-1 ${compactMode ? 'group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors' : ''}`}>{exam.courseName || "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 whitespace-nowrap ${getStatusColor(exam.status)}`}>
              {getStatusLabel(exam.status)}
            </div>
            {compactMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCardExpanded((prev) => !prev)
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-all duration-200"
                aria-label={isCardExpanded ? "Thu gọn đề" : "Mở rộng đề"}
              >
                {isCardExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Compact summary for All tab */}
        {compactMode && !isCardExpanded && (
          <div className="flex flex-wrap gap-3 text-sm text-slate-700 dark:text-slate-300 animate-in fade-in duration-200">
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
              exam.type === "official" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
            }`}>
              {exam.type === "official" ? "📋 Thi thật" : "📝 Thi thử"}
            </span>
            <span className="flex items-center gap-1"><FileText size={14} /> {exam.questionsCount ?? "—"} câu</span>
            <span className="flex items-center gap-1"><Users size={14} /> {exam.attemptCount ?? 0} lượt thi</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200/50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300">
                {variants.length}
              </span>
              Đề con
            </span>
          </div>
        )}

        {isCardExpanded && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
            {/* Type badge */}
            <div className="mb-3">
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                exam.type === "official" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
              }`}>
                {exam.type === "official" ? "📋 Thi thật" : "📝 Thi thử"}
              </span>
            </div>

            {/* Info stats */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-700 dark:text-slate-300 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-1"><FileText size={14} /> {exam.questionsCount ?? "—"} câu</span>
              <span className="flex items-center gap-1"><Users size={14} /> {exam.attemptCount ?? 0} lượt thi</span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200/50 dark:bg-slate-700/50 text-xs text-slate-700 dark:text-slate-300">
                  {variants.length}
                </span>
                Đề con
              </span>
            </div>

            {/* Variants section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Danh sách đề con ({variants.length})</span>
                {hasMoreVariants && (
                  <button
                    onClick={() => setIsVariantsExpanded(!isVariantsExpanded)}
                    className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition"
                  >
                    {isVariantsExpanded ? "▼ Thu gọn" : "▶ Xem"}
                  </button>
                )}
              </div>

              {/* Show variants: first 3 always when collapsed, all when expanded */}
              <div className="space-y-2">
                {(isVariantsExpanded ? variants : displayVariants).map((variant) => (
                  <div key={variant.code} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium text-blue-600 dark:text-blue-400">Đề {variant.code}</span>
                      <span className="text-slate-500 ml-2">• {variant.questions?.length || 0} câu</span>
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onViewVariantQuestions(exam, variant)}
                        className="px-2 py-1 text-xs rounded border border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => onEdit(exam.id)}
                        className="px-2 py-1 text-xs rounded border border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                      >
                        Sửa
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show more indicator */}
              {hasMoreVariants && !isVariantsExpanded && (
                <div className="text-xs text-slate-600 dark:text-slate-500 text-center py-2 mt-2">
                  +{variants.length - 3} đề con khác
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => onEdit(exam.id)}
                className="flex-1 px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 text-sm font-medium transition"
              >
                ✏️ Chỉnh sửa
              </button>
              <button
                onClick={() => onViewAttempts(exam)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-sm font-medium transition"
              >
                👥 Kết quả thi
              </button>
              <button
                onClick={() => onDelete(exam.id, exam.title)}
                className="flex-1 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/20 text-sm font-medium transition"
              >
                🗑️ Xóa
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function TeacherExamsListPage() {
  const { t } = useLanguage()
  const router = useRouter()

  /* ===== STATE MANAGEMENT ===== */
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const typeContainerRef = useRef<HTMLDivElement | null>(null)
  const typeButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [activeTypeStyle, setActiveTypeStyle] = useState({ left: 0, width: 0, ready: false })

  // Variant questions modal
  const [variantQuestionsOpen, setVariantQuestionsOpen] = useState(false)
  const [currentExam, setCurrentExam] = useState<Exam | null>(null)
  const [currentVariant, setCurrentVariant] = useState<any>(null)

  // Attempt history modal
  const [attemptHistoryExam, setAttemptHistoryExam] = useState<Exam | null>(null)
  const [attemptHistory, setAttemptHistory] = useState<ExtractedExamAttempt[]>([])
  const [attemptHistoryLoading, setAttemptHistoryLoading] = useState(false)
  const [selectedAttempt, setSelectedAttempt] = useState<ExtractedExamAttempt | null>(null)
  const [attemptDetailLoading, setAttemptDetailLoading] = useState(false)

  const handleExportAttemptHistoryExcel = () => {
    if (!attemptHistoryExam || attemptHistory.length === 0) return

    const rows = attemptHistory.map((attempt, index) => ({
      STT: index + 1,
      "Học sinh": attempt.student?.name || t("tch_exg_attempt_unknown", "Không rõ"),
      Email: attempt.student?.email || "",
      "Mã đề": attempt.variantCode ?? "—",
      "Điểm (%)": Number(attempt.score || 0).toFixed(2),
      "Điểm đạt": attempt.passed ? t("tch_exg_attempt_pass", "Đạt") : t("tch_exg_attempt_fail", "Chưa đạt"),
      "Điểm số chi tiết": `${Number(attempt.earnedPoints || 0).toFixed(2)}/${Number(attempt.totalPoints || 0).toFixed(2)}`,
      "Thời gian nộp": new Date(attempt.submittedAt || attempt.createdAt || "").toLocaleString("vi-VN") || "—",
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bang diem")

    const safeTitle = String(attemptHistoryExam.title || "bang-diem")
      .trim()
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "bang-diem"

    XLSX.writeFile(workbook, `${safeTitle}-bang-diem.xlsx`)
  }

  const handleViewAttemptDetail = async (attempt: ExtractedExamAttempt) => {
    if (!attemptHistoryExam) return
    if (attempt.questionResults && attempt.questionResults.length > 0) {
      setSelectedAttempt(attempt)
      return
    }
    setAttemptDetailLoading(true)
    try {
      const res = await authFetch(`/extracted-exams/${attemptHistoryExam.id}/attempts/${attempt.id}`)
      if (!res.ok) throw new Error(t("tch_exg_detail_load_fail", "Unable to load attempt detail"))
      const data = await res.json().catch(() => null)
      setSelectedAttempt(data)
    } catch {
      setSelectedAttempt(attempt)
    } finally {
      setAttemptDetailLoading(false)
    }
  }

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true)
        // Use extracted exams only (đề thi đã cắt từ ngân hàng)
        const res = await authFetch("/extracted-exams/my")
        if (!res.ok) {
          setExams([])
          return
        }
        const payload = await res.json().catch(() => [])
        const list = normalizeList<Exam>(payload).map((item: any) => ({
          ...item,
          courseName: item.course?.title || item.courseName,
          type: String(item.type || "practice").toLowerCase() as Exam["type"],
          status: String(item.status || "draft").toLowerCase() as Exam["status"],
          questionsCount: item.questionsCount || parseQuestionsCount(item.questions),
          attemptCount: item.attemptCount || 0,
          variantCount: item.variantCount || 1,
          variants: Array.isArray(item.variants) ? item.variants : [],
        }))
        setExams(list)
      } catch {
        setExams([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchExams()
  }, [])

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest("[data-exam-menu]")) {
        // menu handling removed
      }
    }

    // Listeners removed
  }, [])

  const handleEdit = (examId: string) => {
    router.push(`/teacher/exams/generate/create?editId=${examId}`)
  }

  const handleDelete = async (examId: string, examTitle: string) => {
    const message = `Bạn có chắc muốn xóa đề thi "${examTitle}"?`
    const ok = window.confirm(message)
    if (!ok) return

    try {
      const response = await authFetch(`/extracted-exams/${examId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(t("tch_exg_del_fail", "Xóa đề thi thất bại"))
      }

      setExams((prev) => prev.filter((item) => item.id !== examId))
    } catch {
      window.alert(t("tch_exg_del_error", "Không thể xóa đề thi"))
    }
  }

  const handleViewVariantQuestions = (exam: Exam, variant: any) => {
    setCurrentExam(exam)
    setCurrentVariant(variant)
    setVariantQuestionsOpen(true)
  }

  const handleViewAttempts = async (exam: Exam) => {
    setAttemptHistoryExam(exam)
    setAttemptHistoryLoading(true)

    try {
      const response = await authFetch(`/extracted-exams/${exam.id}/attempts`)
      if (!response.ok) {
        throw new Error(t("tch_exg_attempt_load_fail", "Không thể tải danh sách học sinh đã làm"))
      }

      const payload = await response.json().catch(() => [])
      const list = normalizeList<ExtractedExamAttempt>(payload)
      setAttemptHistory(Array.isArray(list) ? list : [])
    } catch {
      setAttemptHistory([])
      window.alert(t("tch_exg_attempt_load_fail", "Không thể tải danh sách học sinh đã làm"))
    } finally {
      setAttemptHistoryLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch = exam.title.toLowerCase().includes(search.toLowerCase()) ||
        (exam.courseName || "").toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === "all" || exam.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [exams, search, typeFilter])

  const stats = useMemo(() => {
    const total = exams.length
    const practice = exams.filter((e) => e.type === "practice").length
    const official = exams.filter((e) => e.type === "official").length
    const draft = exams.filter((e) => e.status === "draft").length
    const pending = exams.filter((e) => e.status === "pending").length
    const approved = exams.filter((e) => e.status === "approved").length
    const rejected = exams.filter((e) => e.status === "rejected").length
    const totalAttempts = exams.reduce((sum, e) => sum + (e.attemptCount || 0), 0)
    return { total, practice, official, draft, pending, approved, rejected, totalAttempts }
  }, [exams])

  const cards = [
    { title: t("tch_exg_total", "Tổng đề thi"), value: stats.total, icon: FileText, accent: "text-primary" },
    { title: t("tch_exg_practice", "Thi thử"), value: stats.practice, icon: Clock, accent: "text-blue-500" },
    { title: t("tch_exg_official", "Thi thật"), value: stats.official, icon: ShieldCheck, accent: "text-purple-500" },
    { title: t("tch_exg_attempts", "Lượt đã thi"), value: stats.totalAttempts, icon: BarChart3, accent: "text-cyan-500" },
  ]

  const typeOptions = [
    { value: "all", label: t("tch_exg_all_type", "Tất cả loại") },
    { value: "practice", label: t("tch_exg_practice", "Thi thử") },
    { value: "official", label: t("tch_exg_official", "Thi thật") },
  ]

  useEffect(() => {
    const updateFilterIndicators = () => {
      const typeContainer = typeContainerRef.current
      const activeTypeButton = typeButtonRefs.current[typeFilter]
      if (typeContainer && activeTypeButton) {
        const containerRect = typeContainer.getBoundingClientRect()
        const buttonRect = activeTypeButton.getBoundingClientRect()
        setActiveTypeStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
          ready: true,
        })
      }
    }

    updateFilterIndicators()
    window.addEventListener("resize", updateFilterIndicators)
    return () => window.removeEventListener("resize", updateFilterIndicators)
  }, [typeFilter])

  return (
    <div className="space-y-6">
      <section 
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white"
        style={{
          backgroundImage: "url('/image/bgr_exams_teacher.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-900/45 to-slate-950/60" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#22c55e,transparent_35%),radial-gradient(circle_at_80%_0%,#0ea5e9,transparent_30%),radial-gradient(circle_at_50%_80%,#6366f1,transparent_35%)]" />
        <div className="relative p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight drop-shadow-[0_2px_10px_rgba(15,23,42,0.55)]">{t("tch_exg_title", "Đề thi đã sinh")}</h1>
              <p className="text-white/90 max-w-2xl drop-shadow-[0_1px_8px_rgba(15,23,42,0.5)]">{t("tch_exg_subtitle", "Theo dõi đề thi được trích xuất, quản lý mã đề và kết quả thi trong một bảng điều khiển duy nhất.")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push("/teacher/exams/generate/create")}
                className="inline-flex items-center gap-2 rounded-full bg-white/18 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/28"
              >
                <Plus size={16} /> {t("tch_exg_create", "Tạo đề thi")}
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/25 bg-slate-900/45 p-4 backdrop-blur shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <card.icon size={18} className={`${card.accent} drop-shadow`} />
                  </div>
                  <div>
                    <p className="text-sm text-white/90">{card.title}</p>
                    <p className="text-2xl font-semibold text-white">{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-2xl border bg-card p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg w-full md:w-80 bg-background">
            <Search size={16} className="text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("tch_exg_search", "Tìm đề thi theo tiêu đề hoặc khóa học")}
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto">
            <div ref={typeContainerRef} className="relative inline-flex w-full flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/70 md:w-auto md:flex-nowrap">
              <div
                className="pointer-events-none absolute inset-y-1 rounded-md bg-cyan-600 shadow-[0_8px_20px_rgba(8,145,178,0.35)] transition-all duration-300"
                style={{
                  left: `${activeTypeStyle.left}px`,
                  width: `${activeTypeStyle.width}px`,
                  opacity: activeTypeStyle.ready ? 1 : 0,
                }}
              />
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  ref={(node) => {
                    typeButtonRefs.current[option.value] = node
                  }}
                  onClick={() => setTypeFilter(option.value)}
                  className={`relative z-10 inline-flex min-w-fit items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    typeFilter === option.value
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

        <div className="space-y-3">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              <Loader2 className="animate-spin inline-block mr-2" size={16} /> {t("tch_exg_loading", "Đang tải...")}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">{t("tch_exg_empty", "Chưa có đề thi nào")}</div>
          ) : (
            filtered.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                compactMode
                onEdit={handleEdit}
                onViewAttempts={handleViewAttempts}
                onDelete={handleDelete}
                onViewVariantQuestions={handleViewVariantQuestions}
              />
            ))
          )}
        </div>
      </div>

      {/* Variant Questions Modal */}
      {variantQuestionsOpen && currentVariant && currentExam && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4" onClick={() => setVariantQuestionsOpen(false)}>
          <div className="w-full max-w-3xl rounded-2xl border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold">{currentExam.title}</h3>
                <p className="text-sm text-muted-foreground">Đề {currentVariant.code} - {currentVariant.questions?.length || 0} câu hỏi</p>
              </div>
              <button
                className="rounded-lg border px-3 py-1 text-sm hover:bg-secondary"
                onClick={() => setVariantQuestionsOpen(false)}
              >
                Đóng
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-auto p-5">
              {!currentVariant.questions || currentVariant.questions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Không có câu hỏi</div>
              ) : (
                <div className="space-y-4">
                  {currentVariant.questions.map((question: any, idx: number) => (
                    <div key={question.id || idx} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-primary shrink-0">Câu {idx + 1}:</span>
                        <ScientificText
                          as="p"
                          className="text-sm whitespace-pre-wrap"
                          text={normalizeUploadedText(question.question) || "—"}
                        />
                      </div>
                      {question.options && question.options.length > 0 && (
                        <div className="pl-8 space-y-1">
                          {question.options.map((option: string, optIdx: number) => (
                            <div key={optIdx} className="text-sm text-muted-foreground">
                              {String.fromCharCode(65 + optIdx)}. <ScientificText text={normalizeUploadedText(option)} />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="pl-8 text-xs text-green-600">
                        Đáp án: <ScientificText text={Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attempt History Modal */}
      {attemptHistoryExam && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4" onClick={() => { setAttemptHistoryExam(null); setSelectedAttempt(null) }}>
          <div className="w-full max-w-4xl rounded-2xl border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold">{t("tch_exg_attempt_modal_title", "Học sinh đã làm bài")}</h3>
                <p className="text-sm text-muted-foreground">{attemptHistoryExam?.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleExportAttemptHistoryExcel}
                  disabled={attemptHistoryLoading || attemptHistory.length === 0}
                >
                  {t("tch_exg_export_excel", "Xuất Excel")}
                </button>
                <button
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-secondary"
                  onClick={() => { setAttemptHistoryExam(null); setSelectedAttempt(null) }}
                >
                  {t("common_close", "Đóng")}
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-auto p-5">
              {attemptHistoryLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Loader2 className="mr-2 inline-block animate-spin" size={16} />
                  {t("tch_exg_loading", "Đang tải...")}
                </div>
              ) : attemptHistory.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {t("tch_exg_attempt_empty", "Chưa có học sinh nào nộp bài thi này")}
                </div>
              ) : selectedAttempt ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      className="rounded-lg border px-3 py-1 text-sm hover:bg-secondary"
                      onClick={() => setSelectedAttempt(null)}
                    >
                      ← Quay lại
                    </button>
                    <div>
                      <span className="font-semibold">{selectedAttempt.student?.name || "Học sinh"}</span>
                      {selectedAttempt.variantCode && (
                        <span className="ml-2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs font-semibold px-2 py-0.5">
                          Mã đề: {selectedAttempt.variantCode}
                        </span>
                      )}
                      <span className="ml-3 text-sm text-muted-foreground">
                        {Number(selectedAttempt.score || 0).toFixed(2)}% — {selectedAttempt.passed ? "Đạt" : "Chưa đạt"}
                      </span>
                    </div>
                  </div>
                  {attemptDetailLoading ? (
                    <div className="py-6 text-center text-muted-foreground">
                      <Loader2 className="mr-2 inline-block animate-spin" size={16} /> Đang tải...
                    </div>
                  ) : (selectedAttempt.questionResults || []).length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">Không có chi tiết câu trả lời</div>
                  ) : (
                    <div className="space-y-3">
                      {(selectedAttempt.questionResults || []).map((qr, idx) => (
                        <div
                          key={qr.id || idx}
                          className={`rounded-xl border p-4 ${qr.isCorrect ? "border-green-400/40 bg-green-500/5" : "border-red-400/40 bg-red-500/5"}`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-xs font-semibold text-muted-foreground mt-0.5 shrink-0">Câu {idx + 1}.</span>
                            <ScientificText
                              as="p"
                              className="text-sm font-medium whitespace-pre-wrap"
                              text={normalizeUploadedText(qr.question)}
                            />
                            <span className={`ml-auto shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${qr.isCorrect ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
                              {qr.isCorrect ? "Đúng" : "Sai"}
                            </span>
                          </div>
                          <div className="text-xs space-y-1 pl-5">
                            <div><span className="text-muted-foreground">Học sinh chọn: </span><span className="font-medium"><ScientificText text={Array.isArray(qr.userAnswer) ? qr.userAnswer.join(", ") : (qr.userAnswer ?? "—")} /></span></div>
                            <div><span className="text-muted-foreground">Đáp án đúng: </span><span className="font-medium text-green-600"><ScientificText text={Array.isArray(qr.correctAnswer) ? qr.correctAnswer.join(", ") : (qr.correctAnswer ?? "—")} /></span></div>
                            {qr.explanation && (
                              <div className="text-muted-foreground italic">
                                Giải thích: <ScientificText text={normalizeUploadedText(qr.explanation)} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-3">{t("tch_exg_attempt_student", "Học sinh")}</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Mã đề</th>
                      <th className="py-2 pr-3">{t("tch_exg_attempt_score", "Điểm")}</th>
                      <th className="py-2 pr-3">{t("tch_exg_attempt_result", "Kết quả")}</th>
                      <th className="py-2 pr-3">{t("tch_exg_attempt_submitted", "Thời gian nộp")}</th>
                      <th className="py-2 pr-3">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attemptHistory.map((attempt) => (
                      <tr key={attempt.id} className="border-t">
                        <td className="py-3 pr-3 font-medium">{attempt.student?.name || t("tch_exg_attempt_unknown", "Không rõ")}</td>
                        <td className="py-3 pr-3 text-muted-foreground">{attempt.student?.email || "—"}</td>
                        <td className="py-3 pr-3">
                          {attempt.variantCode ? (
                            <span className="rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs font-semibold px-2 py-0.5">
                              {attempt.variantCode}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 pr-3">{Number(attempt.score || 0).toFixed(2)}%</td>
                        <td className="py-3 pr-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${attempt.passed ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                            {attempt.passed ? t("tch_exg_attempt_pass", "Đạt") : t("tch_exg_attempt_fail", "Chưa đạt")}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {attempt.submittedAt || attempt.createdAt
                            ? new Date(attempt.submittedAt || attempt.createdAt || "").toLocaleString("vi-VN")
                            : "—"}
                        </td>
                        <td className="py-3 pr-3">
                          <button
                            className="rounded-lg border px-2 py-1 text-xs hover:bg-secondary"
                            onClick={() => handleViewAttemptDetail(attempt)}
                          >
                            Xem đáp án
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
