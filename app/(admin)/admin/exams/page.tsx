"use client"

import { useState, useEffect, useRef, useMemo, Fragment } from "react"
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
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-context"
import { toast } from "sonner"

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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuButtonRect, setMenuButtonRect] = useState<{ top: number; right: number } | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; action: string; examId?: string }>({ isOpen: false, action: "" })
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([])

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  const getTemplateName = (templateId?: string) => {
    if (!templateId) return ""
    return certificateTemplates.find((t) => t.id === templateId)?.title || templateId
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
        throw new Error(t("adm_exam_templates_load_fail", "Failed to fetch certificate templates"))
      }

      const payload = await res.json()
      const templates = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
      setCertificateTemplates(templates)
      return templates
    } catch (error) {
      console.error("Failed to fetch certificate templates", error)
      return []
    }
  }

  const fetchExams = async (templates: CertificateTemplate[] = certificateTemplates) => {
    setIsLoading(true)
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
      setIsLoading(false)
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
        setMenuButtonRect(null)
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
      setCertificateTemplates(templates)
      await fetchExams(templates)
    }
    initialize()
  }, [])

  useEffect(() => {
    const closeMenu = () => { setOpenMenu(null); setMenuButtonRect(null) }
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
      (typeFilter === "all" || exam.type === typeFilter)
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

  const canModerateExam = (status: Exam["status"]) => status === "pending"

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
      setMenuButtonRect(null)
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
      setMenuButtonRect(null)
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
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      approved: "bg-green-500/10 text-green-500 border-green-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
      draft: "bg-gray-500/10 text-gray-500 border-gray-500/20",
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
      practice: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      official: "bg-purple-500/10 text-purple-500 border-purple-500/20",
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
  return (
    <div className="w-full space-y-8">
      {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/Bg_course1.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
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
            <div className="rounded-2xl border border-white/40 dark:border-slate-700/60 bg-white/15 dark:bg-slate-900/30 backdrop-blur-sm p-4 md:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_exam_stat_total", "Tổng bài thi")}</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalExams}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <FileText size={20} className="text-primary" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_exam_status_pending", "Chờ duyệt")}</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingExams}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_exam_status_approved", "Đã duyệt")}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{approvedExams}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_exam_status_rejected", "Từ chối")}</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{rejectedExams}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <XCircle size={20} className="text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.65s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_exam_type_practice", "Thi thử")}</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{practiceExams}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <ClipboardList size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.75s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_exam_type_official", "Thi thật")}</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{officialExams}</p>
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
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder={t("adm_exam_search", "Tìm kiếm bài thi, giáo viên, khóa học...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
          >
            <option value="all">{t("adm_exam_filter_all_status", "Tất cả trạng thái")}</option>
            <option value="pending">{t("adm_exam_status_pending", "Chờ duyệt")}</option>
            <option value="approved">{t("adm_exam_status_approved", "Đã duyệt")}</option>
            <option value="rejected">{t("adm_exam_status_rejected", "Từ chối")}</option>
            <option value="draft">{t("adm_exam_status_draft", "Nháp")}</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
          >
            <option value="all">{t("adm_exam_filter_all_type", "Tất cả loại")}</option>
            <option value="practice">{t("adm_exam_type_practice", "Thi thử")}</option>
            <option value="official">{t("adm_exam_type_official", "Thi thật")}</option>
          </select>
        </div>

        {/* Exams Table (Desktop only - xl+) */}
        <div className="hidden xl:block bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-border dark:border-slate-800 rounded-2xl animate-slideUp" style={{ animationDelay: "0.2s" }}>
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full">
              <thead className="bg-white/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground dark:text-white">{t("adm_exam_th_exam", "Bài thi")}</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-foreground dark:text-white">{t("adm_exam_th_type", "Loại")}</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-foreground dark:text-white">{t("adm_exam_th_teacher", "Giáo viên")}</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-foreground dark:text-white">{t("adm_exam_th_settings", "Cài đặt")}</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-foreground dark:text-white">{t("adm_exam_th_status", "Trạng thái")}</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-foreground dark:text-white">{t("adm_exam_th_attempts", "Lượt thi")}</th>
                  <th className="px-3 py-3 text-right text-sm font-semibold text-foreground dark:text-white">{t("adm_exam_th_actions", "Thao tác")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground dark:text-slate-400">
                      {t("adm_exam_loading", "Đang tải dữ liệu bài thi...")}
                    </td>
                  </tr>
                ) : (
                  groupedExams.map((group, groupIndex) => (
                    <Fragment key={group.key}>
                      {groupIndex > 0 && (
                        <tr className="bg-transparent">
                          <td colSpan={7} className="h-2 p-0 border-0"></td>
                        </tr>
                      )}
                      <tr className="bg-slate-200/80 dark:bg-slate-700/60">
                        <td colSpan={7} className="px-4 py-3">
                          {(() => {
                            const approvedCount = group.variants.filter((exam) => exam.status === "approved").length
                            const unapprovedCount = group.variants.length - approvedCount
                            const isExpanded = expandedGroups[group.key] ?? false

                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedGroups((prev) => ({ ...prev, [group.key]: !(prev[group.key] ?? false) }))
                                }}
                                className="w-full text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-300/50 dark:hover:bg-slate-600/40 rounded-lg px-2 py-1"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 dark:text-white truncate">{group.title}</p>
                                  <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
                                    {group.variants[0]?.course || t("adm_exam_course_label", "Khóa học")} • {group.variants.length} {t("adm_exam_group_variants", "biến thể")}
                                  </p>
                                  <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
                                    {t("adm_exam_status_approved", "Đã duyệt")}: {approvedCount} • {t("adm_exam_group_unapproved", "Chưa duyệt")}: {unapprovedCount}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs px-2 py-1 rounded-full border border-slate-400 dark:border-slate-500 bg-slate-300/70 dark:bg-slate-600/70 text-slate-800 dark:text-slate-100">
                                    {group.isTypeGroup ? t("adm_exam_group_type_variants", "Nhóm biến thể type") : t("adm_exam_group_title_variants", "Nhóm cùng bộ đề")}
                                  </span>
                                  <span className="text-slate-700 dark:text-slate-100">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                                </div>
                              </button>
                            )
                          })()}
                        </td>
                      </tr>
                      {(expandedGroups[group.key] ?? false) && group.variants.map((exam) => (
                        <tr key={exam.id} className="hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300" data-exam-card>
                          <td className="px-4 py-3 max-w-[280px]">
                            <div>
                              <p className="font-medium text-foreground dark:text-white truncate">{exam.title}</p>
                              <p className="text-sm text-muted-foreground dark:text-slate-400 flex items-center gap-1 mt-1 truncate">
                                <BookOpen size={14} className="shrink-0" /> <span className="truncate">{exam.course}</span>
                              </p>
                              {exam.type === "official" && exam.certificateTemplate && (
                                <p className="text-xs text-purple-500 flex items-center gap-1 mt-1 truncate">
                                  <Award size={12} className="shrink-0" /> <span className="truncate">{exam.certificateTemplate}</span>
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            {getTypeBadge(exam.type)}
                          </td>
                          <td className="px-3 py-3">
                            <div>
                              <p className="font-medium text-foreground dark:text-white text-sm">{exam.teacher}</p>
                              <p className="text-xs text-muted-foreground dark:text-slate-400 truncate max-w-[120px]">{exam.teacherEmail}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="space-y-0.5 text-xs">
                              <p className="text-muted-foreground dark:text-slate-400">
                                <Timer size={12} className="inline mr-1" /> {exam.timeLimit} {t("adm_exam_minutes", "phút")}
                              </p>
                              <p className="text-muted-foreground dark:text-slate-400">
                                {exam.questionsCount} {t("adm_exam_questions_short", "câu")} • {exam.passingScore}%
                              </p>
                              <p className="text-muted-foreground dark:text-slate-400">
                                {t("adm_exam_max", "Tối đa")} {exam.maxAttempts} {t("adm_exam_times", "lần")}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            {getStatusBadge(exam.status)}
                            {exam.status === "rejected" && exam.rejectionReason && (
                              <button
                                onClick={() => {
                                  setSelectedExam(exam)
                                  setViewMode("view")
                                }}
                                className="block mt-1 text-xs text-red-500 hover:underline"
                              >
                                {t("adm_exam_view_reason", "Xem lý do")}
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="text-foreground dark:text-white font-medium">
                              {exam.attemptCount}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  const card = e.currentTarget.closest('[data-exam-card]') as HTMLElement
                                  if (card) {
                                    setAnchorRect(card.getBoundingClientRect())
                                  }
                                  setSelectedExam(exam)
                                  setViewMode("view")
                                }}
                                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary dark:text-accent rounded-lg transition-colors text-sm font-medium"
                                title={t("adm_exam_preview", "Xem trước")}
                              >
                                {t("adm_exam_preview", "Xem trước")}
                              </button>
                              <Link
                                href={`/admin/exams/${exam.id}`}
                                className="p-2 hover:bg-secondary dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title={t("adm_exam_full_detail", "Chi tiết đầy đủ")}
                              >
                                <Eye size={18} className="text-muted-foreground" />
                              </Link>
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    if (openMenu === exam.id) {
                                      setOpenMenu(null)
                                      setMenuButtonRect(null)
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect()
                                      setMenuButtonRect({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                                      setOpenMenu(exam.id)
                                    }
                                  }}
                                  className="p-2 hover:bg-secondary dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                  <MoreVertical size={18} className="text-muted-foreground" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && groupedExams.length === 0 && (
            <div className="p-12 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
              <p className="text-muted-foreground dark:text-slate-400">{t("adm_exam_empty", "Không tìm thấy bài thi nào")}</p>
            </div>
          )}
        </div>

        {/* Exams Card Layout (Tablet & Mobile - below xl) */}
        <div className="block xl:hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground dark:text-slate-400">{t("adm_exam_loading", "Đang tải dữ liệu bài thi...")}</p>
            </div>
          ) : groupedExams.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
              <p className="text-muted-foreground dark:text-slate-400">{t("adm_exam_empty", "Không tìm thấy bài thi nào")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedExams.map(group => (
                <div key={group.key} className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-3 space-y-3">
                  {(() => {
                    const approvedCount = group.variants.filter((exam) => exam.status === "approved").length
                    const unapprovedCount = group.variants.length - approvedCount
                    const isExpanded = expandedGroups[group.key] ?? false

                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedGroups((prev) => ({ ...prev, [group.key]: !(prev[group.key] ?? false) }))
                        }}
                        className="w-full px-1 text-left flex items-start justify-between gap-2 cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-white leading-snug line-clamp-2">{group.title}</p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <BookOpen size={12} /> {group.variants[0]?.course} • {group.variants.length} {t("adm_exam_group_variants", "biến thể")}
                          </p>
                          <p className="text-xs text-slate-300 mt-1">
                            {t("adm_exam_status_approved", "Đã duyệt")}: {approvedCount} • {t("adm_exam_group_unapproved", "Chưa duyệt")}: {unapprovedCount}
                          </p>
                        </div>
                        <span className="text-slate-300 mt-1">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                      </button>
                    )
                  })()}

                  {(expandedGroups[group.key] ?? false) && <div className="space-y-3">
                    {group.variants.map(exam => (
                      <div
                        key={exam.id}
                        data-exam-card
                        ref={openMenu === exam.id || (selectedExam && viewMode === "view" && selectedExam.id === exam.id) ? cardRef : null}
                        className="bg-slate-800/80 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-white leading-snug line-clamp-2">{exam.title}</p>
                            <p className="text-xs text-slate-400 mt-1">{exam.teacher}</p>
                          </div>
                          <div className="flex flex-col gap-1 items-end shrink-0">
                            {getTypeBadge(exam.type)}
                            {getStatusBadge(exam.status)}
                          </div>
                        </div>

                        <div className="text-sm text-slate-300 flex items-center gap-2">
                          <span className="text-slate-500 text-xs truncate">{exam.teacherEmail}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                          <div className="flex items-center gap-2">
                            <Timer size={14} className="text-blue-400" />
                            <span>{exam.timeLimit} {t("adm_exam_minutes", "phút")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClipboardList size={14} className="text-green-400" />
                            <span>{exam.questionsCount} {t("adm_exam_questions_short", "câu")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-yellow-400" />
                            <span>{exam.passingScore}% {t("adm_exam_pass", "đạt")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award size={14} className="text-purple-400" />
                            <span>{exam.maxAttempts} {t("adm_exam_attempts_unit", "lần thi")}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                          <span className="text-sm text-slate-400">{exam.attemptCount} {t("adm_exam_th_attempts", "Lượt thi")}</span>
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm"
                              onClick={e => {
                                const rect = (e.currentTarget.closest('[data-exam-card]') as HTMLElement)?.getBoundingClientRect();
                                if (rect) setAnchorRect(rect);
                                setSelectedExam(exam);
                                setViewMode("view");
                              }}
                            >
                              {t("adm_exam_preview", "Xem trước")}
                            </button>
                            <button
                              className="p-2 rounded-lg bg-slate-700"
                              onClick={() => setOpenMenu(openMenu === exam.id ? null : exam.id)}
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </div>

                        {openMenu === exam.id && (
                          <>
                            {openMenu && (
                              <div
                                className="fixed inset-0 z-[9998] bg-black/10"
                                onClick={() => setOpenMenu(null)}
                              />
                            )}
                            <div
                              ref={menuRef}
                              className="relative right-0 bottom-0 z-[9999] w-52 bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl shadow-lg"
                            >
                              {canModerateExam(exam.status) && (
                                <button
                                  onClick={() => {
                                    handleApproveAndPublish(exam.id)
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-green-600 dark:text-green-400"
                                >
                                  <CheckCircle size={16} />
                                  <span className="font-medium">{t("adm_exam_approve_publish", "Duyệt & xuất bản")}</span>
                                </button>
                              )}
                              {canModerateExam(exam.status) && (
                                <button
                                  onClick={() => {
                                    setSelectedExam(exam)
                                    setViewMode("reject")
                                    setRejectionReason("")
                                    setOpenMenu(null)
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-amber-600 dark:text-amber-400"
                                >
                                  <AlertCircle size={16} />
                                  <span className="font-medium">{t("adm_exam_reject", "Từ chối")}</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setConfirmDialog({ isOpen: true, action: "delete", examId: exam.id })
                                  setOpenMenu(null)
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-red-500 rounded-b-xl"
                              >
                                <XCircle size={16} />
                                <span className="font-medium">{t("adm_exam_delete", "Xóa bài thi")}</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>}
                </div>
              ))
          }
          </div>
          )}
        </div>

        {/* View/Reject Modal */}
        {selectedExam && viewMode && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-2xl bg-card dark:bg-slate-900 border border-border dark:border-slate-800 shadow-2xl">
              <div className="sticky top-0 z-10 px-4 py-3 sm:p-6 flex items-center justify-between border-b border-border dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <FileText className="text-white" size={20} />
                  </div>
                  <span className="text-xl font-bold text-foreground dark:text-white">{viewMode === "reject" ? t("adm_exam_reject_title", "Từ chối bài thi") : t("adm_exam_preview_title", "Xem trước bài thi")}</span>
                </div>
                <button
                  onClick={() => {
                    setViewMode(null)
                    setSelectedExam(null)
                    setRejectionReason("")
                  }}
                  className="p-2 rounded-full hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-6">
                {viewMode === "view" && (
                  <>
                    {/* Exam Header */}
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 p-4 sm:p-6 rounded-xl border border-border dark:border-slate-800">
                      <div className="space-y-3">
                        <h3 className="text-xl sm:text-2xl font-bold leading-snug break-words line-clamp-2 text-foreground dark:text-white">
                          {selectedExam.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {getTypeBadge(selectedExam.type)}
                          {getStatusBadge(selectedExam.status)}
                        </div>
                        <p className="text-muted-foreground dark:text-slate-400 leading-relaxed">{selectedExam.description}</p>
                      </div>
                      {/* Course & Teacher Info */}
                      <div className="flex items-center gap-4 pt-4 border-t border-border dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen size={16} className="text-primary dark:text-accent" />
                          <span className="text-muted-foreground dark:text-slate-400">{t("adm_exam_course_label", "Khóa học:")}</span>
                          <span className="font-medium text-foreground dark:text-white">{selectedExam.course}</span>
                        </div>
                        <div className="w-px h-4 bg-border dark:bg-slate-700"></div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground dark:text-slate-400">{t("adm_exam_teacher_label", "Giáo viên:")}</span>
                          <span className="font-medium text-foreground dark:text-white">{selectedExam.teacher}</span>
                        </div>
                      </div>
                    </div>
                    {/* Exam Configuration */}
                    <div>
                      <h4 className="text-lg font-semibold text-foreground dark:text-white mb-4 flex items-center gap-2">
                        <Timer size={20} className="text-primary dark:text-accent" />
                        {t("adm_exam_config_title", "Cấu hình bài thi")}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Timer size={18} className="text-blue-500" />
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t("adm_exam_config_time", "Thời gian")}</p>
                          </div>
                          <p className="text-2xl font-bold text-foreground dark:text-white">{selectedExam.timeLimit}</p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{t("adm_exam_minutes", "phút")}</p>
                        </div>
                        <div className="bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <ClipboardList size={18} className="text-green-500" />
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">{t("adm_exam_config_questions", "Câu hỏi")}</p>
                          </div>
                          <p className="text-2xl font-bold text-foreground dark:text-white">{selectedExam.questionsCount}</p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{t("adm_exam_questions_short", "câu")}</p>
                        </div>
                        <div className="bg-yellow-500/5 dark:bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={18} className="text-yellow-500" />
                            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{t("adm_exam_config_pass_score", "Điểm đạt")}</p>
                          </div>
                          <p className="text-2xl font-bold text-foreground dark:text-white">{selectedExam.passingScore}%</p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{t("adm_exam_minimum", "tối thiểu")}</p>
                        </div>
                        <div className="bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={18} className="text-purple-500" />
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{t("adm_exam_config_attempts", "Lần thi")}</p>
                          </div>
                          <p className="text-2xl font-bold text-foreground dark:text-white">{selectedExam.maxAttempts}</p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{t("adm_exam_maximum", "tối đa")}</p>
                        </div>
                      </div>
                    </div>
                    {/* Certificate Info */}
                    {selectedExam.type === "official" && selectedExam.certificateTemplate && (
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 p-6 rounded-xl">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Award className="text-white" size={24} />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-foreground dark:text-white mb-1">{t("adm_exam_cert_issued", "Chứng chỉ được cấp")}</h5>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-2">{selectedExam.certificateTemplate}</p>
                            <p className="text-sm text-muted-foreground dark:text-slate-400">
                              {t("adm_exam_cert_pass_desc", "Học viên đạt từ")} {selectedExam.passingScore}% {t("adm_exam_cert_pass_desc2", "trở lên sẽ được cấp chứng chỉ này")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Attempt Statistics */}
                    <div className="bg-secondary/30 dark:bg-slate-800/30 p-6 rounded-xl border border-border dark:border-slate-800">
                      <h4 className="text-lg font-semibold text-foreground dark:text-white mb-4">{t("adm_exam_statistics", "Thống kê")}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary dark:text-accent">{selectedExam.attemptCount}</p>
                          <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">{t("adm_exam_th_attempts", "Lượt thi")}</p>
                        </div>
                        <div className="text-center border-x border-border dark:border-slate-700">
                          <p className="text-3xl font-bold text-foreground dark:text-white">
                            {new Date(selectedExam.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                          <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">{t("adm_exam_created_date", "Ngày tạo")}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-foreground dark:text-white">{selectedExam.courseId}</p>
                          <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">{t("adm_exam_course_id", "Mã khóa học")}</p>
                        </div>
                      </div>
                    </div>
                    {/* Rejection Reason */}
                    {selectedExam.status === "rejected" && selectedExam.rejectionReason && (
                      <div className="bg-red-500/10 border-2 border-red-500/30 p-6 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-semibold text-red-600 dark:text-red-400 mb-2">{t("adm_exam_rejection_reason", "Lý do từ chối")}</h5>
                            <p className="text-red-500 dark:text-red-300 leading-relaxed">{selectedExam.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* View Full Details Link */}
                    <Link
                      href={`/admin/exams/${selectedExam.id}`}
                      className="block w-full text-center px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary dark:text-accent rounded-xl font-medium transition-all"
                    >
                      {t("adm_exam_view_full_detail", "Xem chi tiết đầy đủ (câu hỏi, đáp án)")} →
                    </Link>
                    {canModerateExam(selectedExam.status) && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleApproveAndPublish(selectedExam.id)}
                          className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                        >
                          {t("adm_exam_approve_publish", "Duyệt & xuất bản")}
                        </button>
                        <button
                          onClick={() => {
                            setViewMode("reject")
                            setRejectionReason("")
                          }}
                          className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                        >
                          {t("adm_exam_reject", "Từ chối")}
                        </button>
                      </div>
                    )}
                  </>
                )}
                {viewMode === "reject" && (
                  <>
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
                        onClick={() => handleApproveAndPublish(selectedExam.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                      >
                        {t("adm_exam_approve_publish", "Duyệt & xuất bản")}
                      </button>
                      <button
                        onClick={() => {
                          setViewMode(null)
                          setSelectedExam(null)
                          setRejectionReason("")
                        }}
                        className="px-4 py-2 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                      >
                        {t("adm_exam_cancel", "Hủy")}
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={!rejectionReason.trim()}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("adm_exam_confirm_reject", "Xác nhận từ chối")}
                      </button>
                    </div>
                  </>
                )}
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
                  className="px-4 py-2 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                >
                  {t("adm_exam_cancel", "Hủy")}
                </button>
                <button
                  onClick={() => handleDelete(confirmDialog.examId!)}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  {t("adm_exam_delete", "Xóa bài thi")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fixed dropdown for desktop table — rendered outside overflow-x-auto to avoid clip */}
        {openMenu && menuButtonRect && (() => {
          const activeExam = filteredExams.find(e => e.id === openMenu)
          if (!activeExam) return null
          return (
            <div
              ref={menuRef}
              style={{ top: menuButtonRect.top, right: menuButtonRect.right }}
              className="hidden xl:block fixed w-52 bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl shadow-lg z-[9999]"
            >
              {canModerateExam(activeExam.status) && (
                <button
                  onClick={() => { handleApproveAndPublish(activeExam.id) }}
                  className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-green-600 dark:text-green-400"
                >
                  <CheckCircle size={16} />
                  <span className="font-medium">{t("adm_exam_approve_publish", "Duyệt & xuất bản")}</span>
                </button>
              )}
              {canModerateExam(activeExam.status) && (
                <button
                  onClick={() => {
                    setSelectedExam(activeExam)
                    setViewMode("reject")
                    setRejectionReason("")
                    setOpenMenu(null)
                    setMenuButtonRect(null)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-amber-600 dark:text-amber-400"
                >
                  <AlertCircle size={16} />
                  <span className="font-medium">{t("adm_exam_reject", "Từ chối")}</span>
                </button>
              )}
              <button
                onClick={() => { setConfirmDialog({ isOpen: true, action: "delete", examId: activeExam.id }); setOpenMenu(null); setMenuButtonRect(null) }}
                className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-red-500 rounded-b-xl"
              >
                <XCircle size={16} />
                <span className="font-medium">{t("adm_exam_delete", "Xóa bài thi")}</span>
              </button>
            </div>
          )
        })()}
    </div>
  )
}