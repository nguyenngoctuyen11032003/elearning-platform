"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  X,
  AlertCircle,
  FileText,
  Award,
  Timer,
  ClipboardList,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-context"
import { toast } from "sonner"
import { UniversalSelect } from "@/components/ui/universal-select"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { useMetricChangeHighlight } from "@/hooks/use-metric-change-highlight"
import { MetricTrendBadge } from "@/components/ui/metric-trend-badge"

interface Exam {
  id: string
  title: string
  description: string
  course: string
  courseId: string
  teacher: string
  teacherEmail: string
  type: "practice" | "official"
  status: "pending" | "approved" | "rejected" | "draft"
  createdAt: string
  timeLimit: number
  passingScore: number
  maxAttempts: number
  questionsCount: number
  certificateTemplate?: string
  certificateTemplateId?: string
  rejectionReason?: string
  attemptCount: number
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

export default function AdminExamsPage() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [viewMode, setViewMode] = useState<"reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; action: string; examId?: string }>({ isOpen: false, action: "" })
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([])

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  const mapExam = (item: any, templates: CertificateTemplate[] = []): Exam => {
    const parseQuestions = (value: any): any[] => {
      let data = value
      while (typeof data === "string") {
        try { data = JSON.parse(data) } catch { break }
      }
      if (Array.isArray(data)) return data
      return []
    }

    const questions = parseQuestions(item?.questions)
    const course = item?.course || {}
    const teacher = item?.teacher || {}
    const teacherName =
      teacher?.name ||
      [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ") ||
      ""

    const templateId = item?.certificateTemplate?.id || item?.certificateTemplateId
    const templateName = item?.certificateTemplate?.name || templates.find((t) => t.id === templateId)?.title || undefined

    return {
      id: item?.id,
      title: item?.title || "",
      description: item?.description || "",
      course: course?.title || "",
      courseId: item?.courseId || course?.id || "",
      teacher: teacherName,
      teacherEmail: teacher?.email || "",
      type: item?.type,
      status: item?.status,
      createdAt: item?.createdAt || "",
      timeLimit: item?.timeLimit || 0,
      passingScore: item?.passingScore || 0,
      maxAttempts: item?.maxAttempts || 0,
      questionsCount: questions.length,
      certificateTemplate: templateName || undefined,
      certificateTemplateId: templateId || undefined,
      rejectionReason: item?.rejectionReason || undefined,
      attemptCount: Array.isArray(item?.attempts) ? item.attempts.length : 0,
    }
  }

  const fetchCertificateTemplates = async () => {
    try {
      const res = await fetch("/api/certificate-templates", {
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        const message = t("adm_exam_templates_load_fail", "Failed to fetch certificate templates")
        toast.error(message)
        setCertificateTemplates([])
        return []
      }

      const payload = await res.json()
      const templates = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
      setCertificateTemplates(templates)
      return templates
    } catch (error) {
      console.error("Failed to fetch certificate templates", error)
      toast.error(t("adm_exam_templates_load_fail", "Failed to fetch certificate templates"))
      setCertificateTemplates([])
      return []
    }
  }

  const fetchExams = async (templates: CertificateTemplate[] = certificateTemplates, silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const res = await fetch("/api/admin/exams", {
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error(t("adm_exam_list_load_fail", "Failed to fetch exams"))
      }

      const payload = await res.json()
      const unwrapped = payload?.data ?? payload
      const examList = Array.isArray(unwrapped)
        ? unwrapped
        : Array.isArray(unwrapped?.data)
        ? unwrapped.data
        : []

      setExams(examList.map((item: any) => mapExam(item, templates)))
    } catch (error) {
      console.error("Failed to fetch admin exams", error)
      setExams([])
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openMenu])

  useEffect(() => {
    const initialize = async () => {
      const templates = await fetchCertificateTemplates()
      await fetchExams(templates)
    }
    initialize()
    const timer = setInterval(() => {
      void fetchExams(certificateTemplates, true)
    }, 45000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const closeMenu = () => { setOpenMenu(null) }
    window.addEventListener("scroll", closeMenu)
    window.addEventListener("resize", closeMenu)
    return () => {
      window.removeEventListener("scroll", closeMenu)
      window.removeEventListener("resize", closeMenu)
    }
  }, [])

  const filteredExams = exams.filter(
    (exam) =>
      (exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.course.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || exam.status === statusFilter) &&
      (typeFilter === "all" || exam.type === typeFilter) &&
      (activeTab === "all" || exam.status === activeTab)
  )

  const groupedExams = useMemo<GroupedExamBank[]>(() => {
    const map = new Map<string, GroupedExamBank>()

    for (const exam of filteredExams) {
      const parsed = extractTypeFromTitle(exam.title)
      const baseTitle = normalizeExamSetBaseTitle(parsed.baseTitle || exam.title)
      const courseKey = String(exam.courseId || exam.course || "")
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

  // Stats
  const totalExams = exams.length
  const pendingExams = exams.filter(e => e.status === "pending").length
  const approvedExams = exams.filter(e => e.status === "approved").length
  const rejectedExams = exams.filter(e => e.status === "rejected").length
  const practiceExams = exams.filter(e => e.type === "practice").length
  const officialExams = exams.filter(e => e.type === "official").length

  const examOverviewMetrics = {
    totalExams,
    pendingExams,
    approvedExams,
    rejectedExams,
    practiceExams,
    officialExams,
  }

  const { isChanged: isOverviewChanged, getTrend: getOverviewTrend } = useMetricChangeHighlight(examOverviewMetrics, {
    flashDurationMs: 1300,
  })

  const canModerateExam = (status: Exam["status"]) => status === "pending"

  const allVisibleVariantIds = groupedExams.flatMap((group) => group.variants.map((variant) => variant.id))
  const selectedCount = selectedIds.length

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      if (allVisibleVariantIds.length > 0 && allVisibleVariantIds.every((id) => prev.includes(id))) {
        return prev.filter((id) => !allVisibleVariantIds.includes(id))
      }
      const merged = new Set([...prev, ...allVisibleVariantIds])
      return Array.from(merged)
    })
  }

  const handleApproveAndPublish = async (examId: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      })

      if (!res.ok) {
        throw new Error(t("adm_exam_approve_fail", "Failed to approve exam"))
      }

      await fetchExams()
      setOpenMenu(null)
      setConfirmDialog({ isOpen: false, action: "" })
      toast.success(t("adm_exam_approve_publish_ok", "Đã duyệt và xuất bản bài thi"))
    } catch (error) {
      console.error("Approve failed", error)
      toast.error(t("adm_exam_approve_fail", "Không thể duyệt bài thi"))
    }
  }

  const handleReject = async () => {
    if (!selectedExam || !rejectionReason.trim()) return
    try {
      const res = await fetch(`/api/exams/${selectedExam.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      })

      if (!res.ok) {
        throw new Error(t("adm_exam_reject_fail", "Failed to reject exam"))
      }

      await fetchExams()
      setOpenMenu(null)
      setViewMode(null)
      setSelectedExam(null)
      setRejectionReason("")
      toast.success(t("adm_exam_reject_ok", "Đã từ chối bài thi"))
    } catch (error) {
      console.error("Reject failed", error)
      toast.error(t("adm_exam_reject_fail", "Không thể từ chối bài thi"))
    }
  }

  const handleDelete = async (examId: string) => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error(t("adm_exam_delete_fail", "Failed to delete exam"))
      }

      setExams((prev) => prev.filter((exam) => exam.id !== examId))
      setConfirmDialog({ isOpen: false, action: "" })
      toast.success(t("adm_exam_delete_ok", "Đã xóa bài thi thành công"))

      // Refresh background data without overriding successful delete notification.
      fetchExams().catch((refreshError) => {
        console.warn("Refresh exams after delete failed", refreshError)
      })
    } catch (error) {
      console.error("Delete failed", error)
      const message =
        error instanceof Error && error.message
          ? error.message
          : t("adm_exam_delete_fail", "Không thể xóa bài thi")
      toast.error(message)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
      rejected: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
      draft: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20",
    }
    const labels = {
      pending: t("adm_exam_status_pending", "Chờ duyệt"),
      approved: t("adm_exam_status_approved", "Đã duyệt"),
      rejected: t("adm_exam_status_rejected", "Từ chối"),
      draft: t("adm_exam_status_draft", "Nháp"),
    }
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      draft: FileText,
    }
    const Icon = icons[status as keyof typeof icons]
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <Icon size={12} />
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const styles = {
      practice: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
      official: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
    }
    const labels = {
      practice: t("adm_exam_type_practice", "Thi thử"),
      official: t("adm_exam_type_official", "Thi thật"),
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[type as keyof typeof styles]}`}>
        {type === "official" ? <Award size={12} /> : <ClipboardList size={12} />}
        {labels[type as keyof typeof labels]}
      </span>
    )
  }

  const handleBulkApprove = async () => {
    const pendingIds = selectedIds.filter((id) => exams.find((e) => e.id === id)?.status === "pending")
    if (pendingIds.length === 0) {
      toast.error(t("adm_exam_bulk_no_pending", "Không có bài thi chờ duyệt trong lựa chọn"))
      return
    }
    await Promise.all(pendingIds.map((id) => handleApproveAndPublish(id)))
    setSelectedIds([])
  }

  const handleBulkReject = async () => {
    const pendingIds = selectedIds.filter((id) => exams.find((e) => e.id === id)?.status === "pending")
    if (pendingIds.length === 0) {
      toast.error(t("adm_exam_bulk_no_pending", "Không có bài thi chờ duyệt trong lựa chọn"))
      return
    }
    const reason = window.prompt(t("adm_exam_bulk_reject_reason", "Nhập lý do từ chối cho các bài đã chọn"), "")
    if (!reason || !reason.trim()) return
    await Promise.all(
      pendingIds.map(async (id) => {
        const res = await fetch(`/api/exams/${id}/reject`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ reason: reason.trim() }),
        })
        if (!res.ok) throw new Error("Reject failed")
      })
    )
    await fetchExams()
    setSelectedIds([])
    toast.success(t("adm_exam_bulk_reject_ok", "Đã từ chối các bài thi đã chọn"))
  }
  return (
    <div className="w-full space-y-8">
      {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bg_analytics.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("adm_exam_title", "Quản lý Bài thi")}</h1>
                  <p className="text-black/70 dark:text-white/80 drop-shadow">{t("adm_exam_subtitle", "Xem xét, duyệt và quản lý các bài thi từ giảng viên")}</p>
              </div>
            </div>

            {/* Stats Cards: grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 */}
            <div className="rounded-2xl border border-white/40 dark:border-slate-700/60 bg-white/15 dark:bg-slate-900/30 backdrop-blur-sm p-4 md:p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("totalExams") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_exam_stat_total", "Tổng bài thi")}</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white mt-1"><AnimatedNumber value={totalExams} disableAnimation={!isOverviewChanged("totalExams")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("totalExams")} />
                  </div>
                  <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <FileText size={20} className="text-primary" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("pendingExams") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_exam_status_pending", "Chờ duyệt")}</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1"><AnimatedNumber value={pendingExams} disableAnimation={!isOverviewChanged("pendingExams")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("pendingExams")} />
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("approvedExams") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_exam_status_approved", "Đã duyệt")}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1"><AnimatedNumber value={approvedExams} disableAnimation={!isOverviewChanged("approvedExams")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("approvedExams")} />
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("rejectedExams") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_exam_status_rejected", "Từ chối")}</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1"><AnimatedNumber value={rejectedExams} disableAnimation={!isOverviewChanged("rejectedExams")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("rejectedExams")} />
                  </div>
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <XCircle size={20} className="text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.65s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("practiceExams") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_exam_type_practice", "Thi thử")}</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1"><AnimatedNumber value={practiceExams} disableAnimation={!isOverviewChanged("practiceExams")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("practiceExams")} />
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <ClipboardList size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.75s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("officialExams") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_exam_type_official", "Thi thật")}</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1"><AnimatedNumber value={officialExams} disableAnimation={!isOverviewChanged("officialExams")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("officialExams")} />
                  </div>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Award size={20} className="text-purple-600 dark:text-purple-400" />
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
              placeholder={t("adm_exam_search", "Search exams...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary dark:focus:border-accent transition-all duration-300 text-foreground dark:text-white placeholder:text-muted-foreground/60 shadow-sm"
            />
          </div>

          <div className="filter-row gap-y-3 sm:gap-y-4">
            <span className="text-sm font-semibold text-foreground dark:text-white">{t("common_filter_by", "Lọc theo")}:</span>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as "all" | "pending" | "approved" | "rejected")}
              className="filter-select h-[46px] w-full sm:w-auto min-w-[220px] md:min-w-[240px] lg:min-w-[260px] rounded-xl px-4 text-sm"
            >
              <option value="all">{t("common_all", "All")}</option>
              <option value="pending">{t("adm_exam_status_pending", "Pending")}</option>
              <option value="approved">{t("adm_exam_status_approved", "Approved")}</option>
              <option value="rejected">{t("adm_exam_status_rejected", "Rejected")}</option>
            </select>

            <span className="rounded-full border border-emerald-200/80 dark:border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <AnimatedNumber value={filteredExams.length} durationMs={320} />
            </span>

            {(searchTerm.trim() || activeTab !== "all") ? (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setActiveTab("all")
                }}
                className="h-[46px] w-full sm:w-auto md:min-w-[132px] lg:min-w-[148px] inline-flex items-center justify-center px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {t("common_reset", "Đặt lại")}
              </button>
            ) : null}
          </div>
        </div>

        {/* Status Notes */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 rounded-2xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 p-3 flex items-center gap-3">
            <Clock size={18} className="text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-200"><AnimatedNumber value={pendingExams} durationMs={340} /> {t("adm_exam_status_pending", "bài thi chờ duyệt")}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-300/70">{t("adm_exam_pending_note", "Chờ xem xét từ quản trị viên")}</p>
            </div>
          </div>
          <div className="flex-1 rounded-2xl border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 p-3 flex items-center gap-3">
            <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-200"><AnimatedNumber value={approvedExams} durationMs={340} /> {t("adm_exam_status_approved", "bài thi đã duyệt")}</p>
              <p className="text-xs text-green-600 dark:text-green-300/70">{t("adm_exam_approved_note", "Sẵn sàng cho học viên")}</p>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <div className="rounded-2xl border border-primary/30 dark:border-accent/35 bg-primary/5 dark:bg-accent/10 p-3 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-sm text-primary dark:text-accent"><AnimatedNumber value={selectedCount} durationMs={320} /> {t("adm_exam_selected", "selected")}</span>
            <button
              onClick={handleBulkApprove}
              className="h-9 px-3.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30 dark:hover:bg-green-500/30 text-sm font-semibold transition-all duration-200 hover:scale-105"
            >
              {t("adm_exam_approve_all", "Approve all")}
            </button>
            <button
              onClick={handleBulkReject}
              className="h-9 px-3.5 rounded-lg bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30 dark:hover:bg-red-500/30 text-sm font-semibold transition-all duration-200 hover:scale-105"
            >
              {t("adm_exam_reject_all", "Reject all")}
            </button>
          </div>
        )}

        {/* Card List */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allVisibleVariantIds.length > 0 && allVisibleVariantIds.every((id) => selectedIds.includes(id))}
              onChange={toggleSelectAllVisible}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">{t("adm_exam_select_all_visible", "Chọn tất cả trong danh sách")}</span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/72 animate-pulse shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-4" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : groupedExams.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/72">
              <FileText size={48} className="mx-auto text-slate-400 dark:text-slate-600 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">{t("adm_exam_empty", "Không tìm thấy bài thi nào")}</p>
            </div>
          ) : (
            groupedExams.map((group) => {
              const isExpanded = expandedGroups[group.key] ?? false
              return (
                <div key={group.key} className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/72 transition-all duration-200 hover:-translate-y-[2px] shadow-[0_10px_28px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
                  <button
                    type="button"
                    onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.key]: !isExpanded }))}
                    className="w-full flex items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{group.title}</p>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                        <span>📘 {group.title} (<AnimatedNumber value={group.variants.length} durationMs={320} /> versions)</span>
                        {(() => {
                          const pendingCount = group.variants.filter(v => v.status === "pending").length
                          const approvedCount = group.variants.filter(v => v.status === "approved").length
                          const rejectedCount = group.variants.filter(v => v.status === "rejected").length
                          return (
                            <>
                              {pendingCount > 0 && <span className="text-yellow-400 text-xs">• <AnimatedNumber value={pendingCount} durationMs={320} /> chưa duyệt</span>}
                              {approvedCount > 0 && <span className="text-green-400 text-xs">• <AnimatedNumber value={approvedCount} durationMs={320} /> đã duyệt</span>}
                              {rejectedCount > 0 && <span className="text-red-400 text-xs">• <AnimatedNumber value={rejectedCount} durationMs={320} /> từ chối</span>}
                            </>
                          )
                        })()}
                      </div>
                    </div>
                    <span className="text-slate-500 dark:text-slate-300 flex-shrink-0">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                  </button>

                  <div className={`mt-5 space-y-4 transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}>
                      {group.variants.map((exam, index) => (
                        <div key={exam.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(exam.id)}
                                onChange={() => toggleSelectOne(exam.id)}
                                className="mt-1 w-4 h-4"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white truncate">{exam.title}</h3>
                                  {getTypeBadge(exam.type)}
                                </div>
                                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400 mt-1">{exam.description || exam.course}</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">👨‍🏫 {exam.teacher || t("adm_exam_no_teacher", "Chưa có giảng viên")}</p>
                                <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-700 dark:text-slate-300">
                                  <span className="inline-flex items-center gap-1"><Timer size={14} /> {exam.timeLimit}m</span>
                                  <span className="inline-flex items-center gap-1"><ClipboardList size={14} /> <AnimatedNumber value={exam.questionsCount} durationMs={320} /> {t("adm_exam_questions_short", "câu")}</span>
                                  <span className="inline-flex items-center gap-1"><Award size={14} /> <AnimatedNumber value={exam.passingScore} durationMs={320} />%</span>
                                  <span className="inline-flex items-center gap-1">🔁 <AnimatedNumber value={exam.maxAttempts} durationMs={320} /> {t("adm_exam_times", "lần")}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">{t("adm_exam_version", "Version")}: {String.fromCharCode(65 + index)}</p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              {getStatusBadge(exam.status)}
                              <div className="flex items-center gap-2 flex-wrap justify-end">
                                <Link
                                  href={`/admin/exams/${exam.id}`}
                                  className="h-9 w-9 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center"
                                  title={t("adm_exam_preview", "Xem")}
                                >
                                  <Eye size={16} />
                                </Link>
                                <div className="relative">
                                  <button
                                    onClick={() => setOpenMenu(openMenu === exam.id ? null : exam.id)}
                                    className="h-9 w-9 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                  {openMenu === exam.id && (
                                    <div ref={menuRef} className="absolute right-0 mt-1 w-52 bg-white/95 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
                                      {exam.status === "pending" && (
                                        <button
                                          onClick={() => {
                                            void handleApproveAndPublish(exam.id)
                                            setOpenMenu(null)
                                          }}
                                          className="w-full px-4 py-2.5 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm inline-flex items-center gap-2"
                                        >
                                          <CheckCircle size={14} />
                                          {t("adm_exam_approve_publish", "Duyệt & xuất bản")}
                                        </button>
                                      )}
                                      {exam.status === "pending" && (
                                        <button
                                          onClick={() => {
                                            setSelectedExam(exam)
                                            setViewMode("reject")
                                            setRejectionReason("")
                                            setOpenMenu(null)
                                          }}
                                          className="w-full px-4 py-2.5 text-left text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-sm inline-flex items-center gap-2 border-t border-slate-200 dark:border-slate-800"
                                        >
                                          <XCircle size={14} />
                                          {t("adm_exam_reject", "Từ chối")}
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setConfirmDialog({ isOpen: true, action: "delete", examId: exam.id })
                                          setOpenMenu(null)
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-red-500 dark:text-red-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-sm inline-flex items-center gap-2 border-t border-slate-200 dark:border-slate-800"
                                      >
                                        <Trash2 size={14} />
                                        {t("adm_exam_delete", "Xóa bài thi")}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
              )
            })
          )}
        </div>

        {/* Reject Modal */}
        {selectedExam && viewMode === "reject" && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-card dark:bg-slate-900 border border-border dark:border-slate-800 shadow-2xl">
              <div className="sticky top-0 z-10 px-4 py-3 sm:p-6 flex items-center justify-between border-b border-border dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <FileText className="text-white" size={20} />
                  </div>
                  <span className="text-xl font-bold text-foreground dark:text-white">{t("adm_exam_reject_title", "Từ chối bài thi")}</span>
                </div>
                <button
                  onClick={() => {
                    setViewMode(null)
                    setSelectedExam(null)
                    setRejectionReason("")
                  }}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-border/60 dark:border-slate-700 hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-yellow-500 mb-2">
                    <AlertCircle size={20} />
                    <span className="font-medium">{t("adm_exam_rejecting", "Bạn đang từ chối bài thi")}</span>
                  </div>
                  <p className="text-yellow-400 text-sm">
                    "{selectedExam.title}" {t("adm_exam_of_teacher", "của giáo viên")} {selectedExam.teacher}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                    {t("adm_exam_rejection_reason", "Lý do từ chối")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder={t("adm_exam_reject_placeholder", "Nhập lý do từ chối bài thi...")}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setViewMode(null)
                      setSelectedExam(null)
                      setRejectionReason("")
                    }}
                    className="h-10 px-4 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors text-sm font-semibold"
                  >
                    {t("adm_exam_cancel", "Hủy")}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                    className="h-10 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("adm_exam_confirm_reject", "Xác nhận từ chối")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Dialog */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md p-6 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl">
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <AlertCircle size={24} />
                <h3 className="text-lg font-bold">{t("adm_exam_confirm_delete_title", "Xác nhận xóa")}</h3>
              </div>
              <p className="text-muted-foreground dark:text-slate-400 mb-6">
                {t("adm_exam_delete_confirm_msg", "Bạn có chắc chắn muốn xóa bài thi này? Hành động này không thể hoàn tác.")}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDialog({ isOpen: false, action: "" })}
                  className="h-10 px-4 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  {t("adm_exam_cancel", "Hủy")}
                </button>
                <button
                  onClick={() => handleDelete(confirmDialog.examId!)}
                  className="h-10 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-semibold"
                >
                  {t("adm_exam_delete", "Xóa bài thi")}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

