"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authFetch } from "@/lib/authfetch"
import { useLanguage } from "@/lib/i18n/language-context"
import { ScientificText } from "@/components/scientific-text"
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Award,
  Timer,
  ClipboardList,
  AlertCircle,
  X,
  BookOpen,
  Users
  ,ChevronRight
  ,ChevronDown
  ,Send
} from "lucide-react"
import React from "react"
import { toast } from "sonner"

interface Exam {
  id: string
  title: string
  description: string
  courseId: string
  courseName?: string
  type: "practice" | "official"
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt: string
  timeLimit: number
  passingScore: number
  maxAttempts: number
  questionsCount?: number
  questions?: ExamQuestion[]
  certificateTemplateId?: string
  certificateTemplateName?: string
  rejectionReason?: string
  attemptCount?: number
  course?: {
    title?: string
  }
}

interface ExamQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: string | string[]
}
interface CertificateTemplate {
  id: string
  title: string
}

interface GroupedExamBank {
  key: string
  title: string
  variants: Exam[]
  isTypeGroup: boolean
}

const extractTypeFromTitle = (title: string): { baseTitle: string; typeLabel: string | null } => {
  const text = String(title || "").trim()
  const match = text.match(/^(.*?)\s*-\s*type\s*([A-Z0-9]+)\s*$/i)
  if (!match) {
    return { baseTitle: text, typeLabel: null }
  }
  return {
    baseTitle: String(match[1] || "").trim(),
    typeLabel: `Type ${String(match[2] || "").toUpperCase()}`,
  }
}

const normalizeExamSetBaseTitle = (title: string): string => {
  let value = String(title || "").trim()

  value = value.replace(/\s*-\s*type\s*[A-Z0-9]+\s*$/i, "").trim()
  value = value.replace(/\s*-\s*(?:mã\s*đề|ma\s*de|code|variant)\s*[A-Z0-9_-]+\s*$/i, "").trim()
  value = value.replace(/\s*\((?:mã\s*đề|ma\s*de|code|variant)\s*[A-Z0-9_-]+\)\s*$/i, "").trim()

  return value || String(title || "").trim()
}

const parseExamQuestions = (value: any): ExamQuestion[] => {
  let data = value
  while (typeof data === "string") {
    try {
      data = JSON.parse(data)
    } catch {
      break
    }
  }

  if (Array.isArray(data)) {
    return data
      .map((item: any, index: number) => ({
        id: String(item?.id || `question-${index + 1}`),
        question: String(item?.question || item?.questionText || item?.content || item?.text || "").trim(),
        options: Array.isArray(item?.options)
          ? item.options
              .map((option: any) => {
                if (typeof option === "string") return option.trim()
                if (option && typeof option === "object") {
                  return String(option.text || option.content || option.label || "").trim()
                }
                return String(option || "").trim()
              })
              .filter(Boolean)
          : [],
        correctAnswer: Array.isArray(item?.correctAnswer)
          ? item.correctAnswer.map((answer: any) => String(answer || "").trim()).filter(Boolean)
          : String(item?.correctAnswer ?? item?.answer ?? item?.correct ?? "").trim(),
      }))
      .filter((item) => item.question || item.options.length > 0)
  }

  if (!data || typeof data !== "object") return []

  if (Array.isArray((data as any).questions)) {
    return parseExamQuestions((data as any).questions)
  }

  const numericEntries = Object.entries(data as Record<string, any>)
    .filter(([key]) => /^\d+$/.test(key))
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, item]) => item)

  if (numericEntries.length > 0) {
    return parseExamQuestions(numericEntries)
  }

  const looksLikeQuestion =
    "question" in (data as Record<string, any>) ||
    "text" in (data as Record<string, any>) ||
    "content" in (data as Record<string, any>) ||
    "prompt" in (data as Record<string, any>) ||
    "options" in (data as Record<string, any>) ||
    "correctAnswer" in (data as Record<string, any>)

  if (looksLikeQuestion) {
    return parseExamQuestions([data])
  }

  return []
}

const toAnswerList = (answer: string | string[]): string[] => {
  if (Array.isArray(answer)) return answer.map((item) => String(item || "").trim()).filter(Boolean)
  const normalized = String(answer || "").trim()
  return normalized ? [normalized] : []
}

const isCorrectOption = (option: string, correctAnswers: string[]): boolean => {
  const normalizedOption = String(option || "").trim().toLowerCase()
  return correctAnswers.some((answer) => String(answer || "").trim().toLowerCase() === normalizedOption)
}
export default function TeacherExamsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const getAuthToken = () => localStorage.getItem("auth_token") || localStorage.getItem("token") || ""
  const [exams, setExams] = useState<Exam[]>([])
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "pending" | "approved" | "rejected">("all")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "delete" | null>(null)
  const [modalPos, setModalPos] = useState<{ top: number; left: number } | null>(null)
  const detailBtnRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const tabContainerRef = React.useRef<HTMLDivElement | null>(null)
  const tabButtonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})
  const [activeTabStyle, setActiveTabStyle] = useState({ left: 0, width: 0, ready: false })

  useEffect(() => {
    fetchExams()
    fetchTemplates()
  }, [])

  const normalizeList = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload
    if (payload?.data && Array.isArray(payload.data)) return payload.data
    if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data
    return []
  }

  const fetchExams = async () => {
    try {
      setIsLoading(true)
      const response = await authFetch("/exams/my-exams")

      if (response.ok) {
        const data = await response.json()
        const list = normalizeList<Exam>(data).map((exam) => {
          const parsedQuestions = parseExamQuestions((exam as any).questions)
          const variantQuestions = parseExamQuestions((exam as any).variants?.[0]?.questions)
          const resolvedQuestions = parsedQuestions.length > 0 ? parsedQuestions : variantQuestions

          return {
            ...exam,
            type: String(exam.type || "practice").toLowerCase() as Exam["type"],
            courseName: exam.course?.title || exam.courseName,
            questionsCount: resolvedQuestions.length || exam.questionsCount || 0,
            questions: resolvedQuestions,
            attemptCount: (exam as any).attemptCount || exam.attemptCount || 0,
          }
        })
        setExams(list)
      } else {
        setExams([])
      }
    } catch (error) {
      console.error("❌ Error fetching exams:", error)
      setExams([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await authFetch("/certificate-templates")

      if (response.ok) {
        const data = await response.json()
        setTemplates(normalizeList<CertificateTemplate>(data))
      } else {
        setTemplates([])
      }
    } catch (error) {
      console.error("❌ Error fetching templates:", error)
      setTemplates([])
    }
  }

  // Stats
  const totalExams = exams.length
  const draftExams = exams.filter(e => e.status === "draft").length
  const pendingExams = exams.filter(e => e.status === "pending").length
  const approvedExams = exams.filter(e => e.status === "approved").length
  const rejectedExams = exams.filter(e => e.status === "rejected").length
  const practiceExams = exams.filter(e => e.type === "practice").length
  const officialExams = exams.filter(e => e.type === "official").length
  const usedExams = exams.filter(e => (e.attemptCount || 0) > 0).length

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(exam.courseName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(exam.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === "all" || exam.status === activeTab
    return matchesSearch && matchesTab
  })

  const groupedExams = useMemo<GroupedExamBank[]>(() => {
    const map = new Map<string, GroupedExamBank>()

    for (const exam of filteredExams) {
      const parsed = extractTypeFromTitle(exam.title)
      const baseTitle = normalizeExamSetBaseTitle(parsed.baseTitle || exam.title)
      const courseKey = String(exam.courseId || exam.courseName || "")
      const key = `${courseKey}::${baseTitle || exam.id}`
      const current = map.get(key)
      if (!current) {
        map.set(key, {
          key,
          title: baseTitle || exam.title,
          variants: [exam],
          isTypeGroup: Boolean(parsed.typeLabel),
        })
        continue
      }
      current.variants.push(exam)
      current.isTypeGroup = current.isTypeGroup || Boolean(parsed.typeLabel)
    }

    return Array.from(map.values())
      .map((group) => ({
        ...group,
        variants: group.variants.sort((a, b) => {
          const ta = extractTypeFromTitle(a.title).typeLabel || ""
          const tb = extractTypeFromTitle(b.title).typeLabel || ""
          return ta.localeCompare(tb) || (a.createdAt < b.createdAt ? 1 : -1)
        }),
      }))
      .sort((a, b) => {
        const ad = a.variants[0]?.createdAt || ""
        const bd = b.variants[0]?.createdAt || ""
        return ad < bd ? 1 : -1
      })
  }, [filteredExams])

  const tabOptions = useMemo(
    () => [
      { key: "all", label: t("common_all", "Tất cả"), count: totalExams },
      { key: "draft", label: t("te_status_draft", "Nháp"), count: draftExams },
      { key: "pending", label: t("te_status_pending", "Chờ duyệt"), count: pendingExams },
      { key: "approved", label: t("te_status_approved", "Đã duyệt"), count: approvedExams },
      { key: "rejected", label: t("te_status_rejected", "Từ chối"), count: rejectedExams },
    ],
    [t, totalExams, draftExams, pendingExams, approvedExams, rejectedExams],
  )

  useEffect(() => {
    const updateActiveTabIndicator = () => {
      const container = tabContainerRef.current
      const activeButton = tabButtonRefs.current[activeTab]
      if (!container || !activeButton) {
        setActiveTabStyle((prev) => ({ ...prev, ready: false }))
        return
      }

      const containerRect = container.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()
      setActiveTabStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
        ready: true,
      })
    }

    updateActiveTabIndicator()
    window.addEventListener("resize", updateActiveTabIndicator)
    return () => window.removeEventListener("resize", updateActiveTabIndicator)
  }, [activeTab, tabOptions])

  const getTemplateName = (templateId?: string) => {
    if (!templateId) return ""
    return templates.find((t) => t.id === templateId)?.title || ""
  }

  const handleEdit = (examId: string) => {
    router.push(`/teacher/exams/${examId}/edit`)
    setOpenMenu(null)
  }

  const handleDeleteClick = (exam: Exam) => {
    setSelectedExam(exam)
    setViewMode("delete")
    setOpenMenu(null)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedExam) return
    try {
      const response = await authFetch(`/exams/${selectedExam.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setExams(exams.filter(exam => exam.id !== selectedExam.id))
        setViewMode(null)
        setSelectedExam(null)
      }
    } catch (error) {
      console.error("Error deleting exam:", error)
    }
  }

  const handleRemoveCertificate = async (examId: string) => {
    try {
      const response = await authFetch(`/exams/${examId}`, {
        method: "PATCH",
        body: JSON.stringify({ certificateTemplateId: null }),
      })

      if (response.ok) {
        setExams(exams.map(e =>
          e.id === examId ? { ...e, certificateTemplateId: undefined, certificateTemplateName: undefined } : e
        ))
      }
    } catch (error) {
      console.error("Error removing certificate:", error)
    }
    setOpenMenu(null)
  }

  const submitGroupForApproval = async (variants: Exam[]) => {
    const candidates = variants.filter((exam) => ["draft", "rejected"].includes(String(exam.status || "")))

    if (candidates.length === 0) {
      toast.info("Không có đề nào cần gửi duyệt")
      return
    }

    try {
      const results = await Promise.all(
        candidates.map(async (exam) => {
          const response = await authFetch(`/exams/${exam.id}/submit-for-approval`, {
            method: "POST",
          })
          return { examId: exam.id, ok: response.ok }
        }),
      )

      const successCount = results.filter((item) => item.ok).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        toast.success(`Đã gửi duyệt ${successCount} đề trong ngân hàng`) 
      }
      if (failCount > 0) {
        toast.warning(`${failCount} đề gửi duyệt thất bại, vui lòng kiểm tra lại`) 
      }

      await fetchExams()
    } catch (error) {
      console.error("Error submitting group for approval:", error)
      toast.error("Gửi duyệt ngân hàng đề thất bại")
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      approved: "bg-green-500/10 text-green-500 border-green-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    }
    const labels = {
      draft: t("te_status_draft", "Nháp"),
      pending: t("te_status_pending", "Chờ duyệt"),
      approved: t("te_status_approved", "Đã duyệt"),
      rejected: t("te_status_rejected", "Từ chối"),
    }
    const icons = {
      draft: FileText,
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
    }
    const Icon = icons[status as keyof typeof icons]
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <Icon size={12} />
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-6">
        <section
          className="relative overflow-hidden rounded-[2rem] border border-blue-100/70 p-6 shadow-[0_24px_60px_rgba(3,105,161,0.16)] md:p-8"
          style={{
            backgroundImage: "url('/image/bg_exams.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-slate-900/35 dark:bg-slate-950/55" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_110%_at_0%_0%,rgba(59,130,246,0.24),transparent_45%),radial-gradient(100%_90%_at_90%_0%,rgba(34,211,238,0.2),transparent_48%)]" />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/45 bg-cyan-100/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-100">
                  <FileText className="h-4 w-4" />
                  {t("te_title", "Ngân hàng đề thi")}
                </p>
                <h1 className="text-3xl font-black text-white md:text-5xl">{t("te_title", "Ngân hàng đề thi")}</h1>
                <p className="mt-2 text-sm text-slate-200 md:text-base">{t("te_subtitle", "Quản lý kho câu hỏi và cấu hình đề thi cho khóa học của bạn")}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 dark:border-cyan-700/60 dark:bg-cyan-900/30 dark:text-cyan-200">
                  {t("te_total_count", "Đã có:")} {totalExams}
                </span>
                <span className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 dark:border-violet-700/60 dark:bg-violet-900/30 dark:text-violet-200">
                  {t("te_used_count", "Đã sử dụng:")} {usedExams}
                </span>
                <Link
                  href="/teacher/exams/create"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white transition hover:bg-cyan-500"
                >
                  <Plus size={18} /> {t("te_create_exam", "Tạo ngân hàng đề thi")}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                { label: t("te_stat_total", "Tổng bài thi"), value: totalExams, icon: FileText, tone: "border-cyan-200 bg-cyan-50/75 text-cyan-700 dark:border-cyan-700/60 dark:bg-cyan-900/30 dark:text-cyan-200" },
                { label: t("te_stat_draft", "Nháp"), value: draftExams, icon: FileText, tone: "border-slate-200 bg-slate-50/85 text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/55 dark:text-slate-200" },
                { label: t("te_stat_practice", "Thi thử"), value: practiceExams, icon: ClipboardList, tone: "border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-700/60 dark:bg-blue-900/30 dark:text-blue-200" },
                { label: t("te_stat_active", "Hoạt động"), value: approvedExams, icon: CheckCircle, tone: "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-200" },
                { label: t("te_stat_official", "Thi thật"), value: officialExams, icon: Award, tone: "border-violet-200 bg-violet-50/80 text-violet-700 dark:border-violet-700/60 dark:bg-violet-900/30 dark:text-violet-200" },
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

        <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_12px_35px_rgba(2,132,199,0.09)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/65">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t("te_search_placeholder", "Tìm kiếm bài thi...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.2)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
              />
            </div>

            <div ref={tabContainerRef} className="relative inline-flex w-full flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/70 md:w-auto md:flex-nowrap">
              <div
                className="pointer-events-none absolute inset-y-1 rounded-md bg-cyan-600 shadow-[0_8px_20px_rgba(8,145,178,0.35)] transition-all duration-300"
                style={{
                  left: `${activeTabStyle.left}px`,
                  width: `${activeTabStyle.width}px`,
                  opacity: activeTabStyle.ready ? 1 : 0,
                }}
              />
              {tabOptions.map((tab) => (
                <button
                  key={tab.key}
                  ref={(node) => {
                    tabButtonRefs.current[tab.key] = node
                  }}
                  onClick={() => setActiveTab(tab.key as "all" | "draft" | "pending" | "approved" | "rejected")}
                  className={`relative z-10 inline-flex min-w-fit items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.key
                      ? "text-white"
                      : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${activeTab === tab.key ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Exams List */}
        <div className="space-y-4">
          {isLoading && (
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 text-sm text-muted-foreground">
              {t("te_loading", "Đang tải bài thi...")}
            </div>
          )}

          {!isLoading && groupedExams.map((group) => {
            const isExpanded = expandedGroups[group.key] ?? false
            const approvedCount = group.variants.filter((exam) => exam.status === "approved").length
            const unapprovedCount = group.variants.length - approvedCount
            const totalQuestions = group.variants.reduce((sum, exam) => sum + Number(exam.questionsCount || 0), 0)

            return (
              <div key={group.key} className="rounded-[14px] p-4 border border-border/70 dark:border-white/5 bg-card dark:bg-[#0f172a] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="w-full text-left flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedGroups((prev) => ({ ...prev, [group.key]: !(prev[group.key] ?? false) }))
                    }}
                    className="flex-1 text-left"
                    aria-label={isExpanded ? "Thu gọn cụm đề" : "Mở rộng cụm đề"}
                  >
                    <h3 className="text-xl font-semibold text-foreground dark:text-white">{group.title}</h3>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                      {group.variants.length} {group.variants.length > 1 ? "type" : "đề"} • {totalQuestions} {t("te_questions", "câu hỏi")}
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                      {t("te_status_approved", "Đã duyệt")}: {approvedCount} • {t("te_unapproved", "Chưa duyệt")}: {unapprovedCount}
                    </p>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        submitGroupForApproval(group.variants)
                      }}
                      className="px-4 h-9 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-400 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/50 text-sm font-medium inline-flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                      title="Gửi duyệt toàn bộ đề con trong ngân hàng này"
                    >
                      <Send size={14} /> Gửi duyệt
                    </button>
                    <span className="p-2 rounded-lg text-muted-foreground dark:text-slate-300">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </span>
                  </div>
                </div>

                <div className={`mt-4 space-y-3 transition-all duration-300 ease-in-out ${
                  isExpanded ? 'max-h-[2000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
                }`}>
                    {group.variants.map((exam) => {
                      const parsed = extractTypeFromTitle(exam.title)
                      const typeTitle = parsed.typeLabel || exam.title
                      const templateName = exam.certificateTemplateName || getTemplateName(exam.certificateTemplateId)

                      return (
                        <div key={exam.id} data-exam-card className="rounded-xl border border-border/70 dark:border-slate-800 bg-background/40 dark:bg-slate-900/50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h4 className="font-semibold text-foreground dark:text-white text-lg">{typeTitle}</h4>
                                {getStatusBadge(exam.status)}
                              </div>
                              <p className="text-muted-foreground dark:text-slate-400 text-sm mb-3">{exam.description}</p>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground dark:text-slate-300">
                                <span className="flex items-center gap-1"><BookOpen size={14} /> {exam.courseName}</span>
                                <span className="flex items-center gap-1"><Timer size={14} /> {exam.timeLimit} {t("te_minutes", "phút")}</span>
                                <span className="flex items-center gap-1"><FileText size={14} /> {exam.questionsCount} {t("te_questions", "câu hỏi")}</span>
                                <span className="flex items-center gap-1"><Users size={14} /> {exam.attemptCount} {t("te_attempts", "lượt thi")}</span>
                                {exam.type === "official" && templateName && (
                                  <span className="flex items-center gap-1 text-purple-500"><Award size={14} /> {templateName}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  const card = (e.currentTarget as HTMLElement).closest("[data-exam-card]")
                                  if (card) {
                                    const rect = card.getBoundingClientRect()
                                    setModalPos({ top: rect.top + window.scrollY, left: rect.right + 16 })
                                  }
                                  setSelectedExam(exam)
                                  setViewMode("view")
                                }}
                                className="px-3 h-9 rounded-lg border border-border dark:border-slate-700 text-foreground dark:text-slate-200 hover:bg-secondary dark:hover:bg-slate-800 text-sm inline-flex items-center"
                                title={t("te_view_details", "Xem chi tiết")}
                              >
                                <Eye size={16} className="text-foreground dark:text-slate-200" />
                              </button>

                              <div className="relative">
                                <button
                                  onClick={() => setOpenMenu(openMenu === exam.id ? null : exam.id)}
                                  className="px-3 h-9 rounded-lg border border-border dark:border-slate-700 text-foreground dark:text-slate-200 hover:bg-secondary dark:hover:bg-slate-800 text-sm inline-flex items-center"
                                >
                                  <MoreVertical size={16} className="text-foreground dark:text-slate-200" />
                                </button>
                                {openMenu === exam.id && (
                                  <div className="fixed inset-0 z-50 flex items-end justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setOpenMenu(null)}>
                                    <div className="w-full max-w-xs mx-auto mb-6 bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl shadow-lg" onClick={e => e.stopPropagation()}>
                                      <button onClick={() => handleEdit(exam.id)} className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 rounded-t-xl">
                                        <Edit2 size={16} />{t("te_edit", "Chỉnh sửa")}
                                      </button>
                                      {exam.type === "official" && exam.certificateTemplateId && (
                                        <button onClick={() => handleRemoveCertificate(exam.id)} className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-amber-600">
                                          <Award size={16} />{t("te_remove_certificate", "Bỏ chứng chỉ")}
                                        </button>
                                      )}
                                      <button onClick={() => handleDeleteClick(exam)} className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-red-500 rounded-b-xl">
                                        <Trash2 size={16} />{t("te_delete_exam_bank", "Xóa ngân hàng đề")}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )
          })}

          {!isLoading && filteredExams.length === 0 && (
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-12 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">{t("te_no_exams", "Chưa có ngân hàng đề thi")}</h3>
              <p className="text-muted-foreground dark:text-slate-400 mb-4">
                {t("te_no_exams_desc", "Bắt đầu tạo ngân hàng câu hỏi đầu tiên cho khóa học của bạn")}
              </p>
              <Link
                href="/teacher/exams/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus size={20} />
                {t("te_create_bank", "Tạo ngân hàng")}
              </Link>
            </div>
          )}
        </div>

        {/* View Modal */}
        <div className="hidden md:flex">
  {selectedExam && viewMode === "view" && (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={() => {
        setViewMode(null)
        setSelectedExam(null)
      }}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("te_exam_detail", "Chi tiết bài thi")}</h2>
          <button
          ref={el => { detailBtnRefs.current[selectedExam.id] = el }}
            onClick={() => {
              setViewMode(null)
              setSelectedExam(null)
            }}
            className="p-2 hover:bg-secondary rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">{selectedExam.title}</h3>
                  <p className="text-muted-foreground dark:text-slate-400">{selectedExam.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{t("te_status", "Trạng thái")}</p>
                    <div className="mt-1">{getStatusBadge(selectedExam.status)}</div>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{t("te_course", "Khóa học")}</p>
                    <p className="text-foreground dark:text-white font-medium">{selectedExam.courseName}</p>
                  </div>
                </div>

                {selectedExam.type === "official" && (selectedExam.certificateTemplateName || getTemplateName(selectedExam.certificateTemplateId)) && (
                  <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-purple-500">
                      <Award size={20} />
                      <span className="font-medium">
                        {t("te_certificate", "Chứng chỉ")}:{" "}{selectedExam.certificateTemplateName || getTemplateName(selectedExam.certificateTemplateId)}
                      </span>
                    </div>
                    <p className="text-sm text-purple-400 mt-1">
                      {t("te_certificate_desc", "Học viên đạt điểm sẽ được cấp chứng chỉ này")}
                    </p>
                  </div>
                )}

                {selectedExam.status === "rejected" && selectedExam.rejectionReason && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                      <AlertCircle size={20} />
                      <span className="font-medium">{t("te_rejection_reason", "Lý do từ chối")}</span>
                    </div>
                    <p className="text-red-400">{selectedExam.rejectionReason}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-foreground dark:text-white">
                      Chi tiết câu hỏi và đáp án
                    </h4>
                    <span className="text-xs font-semibold rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {selectedExam.questions?.length || 0} câu
                    </span>
                  </div>

                  {selectedExam.questions && selectedExam.questions.length > 0 ? (
                    <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1">
                      {selectedExam.questions.map((question, questionIndex) => {
                        const correctAnswers = toAnswerList(question.correctAnswer)
                        return (
                          <article
                            key={question.id || `${selectedExam.id}-${questionIndex}`}
                            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/60"
                          >
                            <div className="mb-3 flex items-start gap-2">
                              <span className="mt-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                                Câu {questionIndex + 1}.
                              </span>
                              <ScientificText
                                as="p"
                                className="text-sm font-medium text-foreground dark:text-white whitespace-pre-wrap"
                                text={question.question || "-"}
                              />
                            </div>

                            {question.options.length > 0 && (
                              <div className="space-y-2 pl-5">
                                {question.options.map((option, optionIndex) => {
                                  const isCorrect = isCorrectOption(option, correctAnswers)
                                  return (
                                    <div
                                      key={`${question.id}-option-${optionIndex}`}
                                      className={`rounded-lg border px-3 py-2 text-sm ${
                                        isCorrect
                                          ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                          : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                      }`}
                                    >
                                      <span className="mr-1 font-semibold">{String.fromCharCode(65 + optionIndex)}.</span>
                                      <ScientificText as="span" text={option || "-"} />
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            <p className="mt-3 pl-5 text-xs text-emerald-600 dark:text-emerald-400">
                              Đáp án đúng: {correctAnswers.length > 0 ? correctAnswers.join(", ") : "-"}
                            </p>
                          </article>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-muted-foreground dark:border-slate-700 dark:text-slate-400">
                      Chưa có dữ liệu chi tiết câu hỏi cho ngân hàng đề này.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Delete Confirm Modal */}
        {selectedExam && viewMode === "delete" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <AlertCircle size={24} />
                <h3 className="text-lg font-bold">{t("te_delete_title", "Xác nhận xóa")}</h3>
              </div>
              <p className="text-muted-foreground dark:text-slate-400 mb-6">
                {t("te_delete_confirm", "Bạn có chắc chắn muốn xóa bài thi")} "{selectedExam.title}"? {t("te_delete_warning", "Hành động này không thể hoàn tác.")}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setViewMode(null)
                    setSelectedExam(null)
                  }}
                  className="px-4 py-2 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                >
                  {t("te_cancel", "Hủy")}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  {t("te_delete_exam", "Xóa bài thi")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}