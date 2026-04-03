"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { authFetch } from "@/lib/authfetch"
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Award,
  AlertCircle,
  X,
  BookOpen,
  Users,
  FileText,
  Filter,
  Download,
  Share2,
  TrendingUp
} from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { UniversalSelect } from "@/components/ui/universal-select"

interface CertificateTemplate {
  id: string
  title: string
  description: string
  courseId: string
  courseName?: string
  teacherId?: string
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt: string
  updatedAt?: string
  validityPeriod: string
  templateImageUrl?: string
  logoUrl?: string
  signatureUrl?: string
  rejectionReason?: string
  issuedCount: number
  templateStyle: string
  badgeStyle?: string
  backgroundColor: string
  borderColor: string
  borderStyle?: string
  textColor: string
}

interface ExamItem {
  id: string
  title: string
  type?: string
  status?: string
  course?: {
    title?: string
  }
}

interface IssuedCertificate {
  id: string
  certificateNumber: string
  issueDate: string
  status: "approved" | "pending" | "rejected"
  pdfUrl?: string
  imageUrl?: string
  course?: { id?: string; title?: string }
  student?: { id?: string; name?: string }
  metadata?: {
    studentName?: string
    courseName?: string
    snapshot?: {
      template?: {
        title?: string
        description?: string
        backgroundColor?: string
        borderColor?: string
        borderStyle?: string
        textColor?: string
        templateImageUrl?: string
        logoUrl?: string
      }
    }
  }
}

export default function TeacherCertificatesPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const getAuthToken = () => localStorage.getItem("auth_token") || localStorage.getItem("token") || ""
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [anchorStyle, setAnchorStyle] = useState<React.CSSProperties | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "delete" | null>(null)
  const [exams, setExams] = useState<ExamItem[]>([])
  const [isLoadingExams, setIsLoadingExams] = useState(false)
  const [useTemplate, setUseTemplate] = useState<CertificateTemplate | null>(null)
  const [selectedExamId, setSelectedExamId] = useState("")
  const [assignError, setAssignError] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [activeTab, setActiveTab] = useState<"templates" | "issued">("templates")
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>([])
  const [issuedLoading, setIssuedLoading] = useState(false)
  const [verifyInput, setVerifyInput] = useState("")
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const tabContainerRef = useRef<HTMLDivElement | null>(null)
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [activeTabStyle, setActiveTabStyle] = useState({ left: 0, width: 0, ready: false })
  const statusContainerRef = useRef<HTMLDivElement | null>(null)
  const statusButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [activeStatusStyle, setActiveStatusStyle] = useState({ left: 0, width: 0, ready: false })

  // Fetch templates from API
  useEffect(() => {
    fetchTemplates()
    fetchExams()
    fetchIssuedCertificates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await authFetch('/certificates/templates/my')
      
      if (response.ok) {
        const data = await response.json()
        
        // Handle array response
        if (Array.isArray(data)) {
          setTemplates(data.map((t: any) => ({
            ...t,
            courseName: t.course?.title || 'N/A'
          })))
        } 
        // Handle object with data property
        else if (data && Array.isArray(data.data)) {
          setTemplates(data.data.map((t: any) => ({
            ...t,
            courseName: t.course?.title || 'N/A'
          })))
        }
        // Handle empty or invalid response
        else {
          console.warn('⚠️ Unexpected API response format:', data)
          setTemplates([])
        }
      } else {
        console.error('❌ API Error:', response.status, response.statusText)
        const errorData = await response.text()
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('❌ Error fetching templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const fetchExams = async () => {
    try {
      setIsLoadingExams(true)
      const response = await authFetch("/exams/my-exams")

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setExams(data)
        } else if (data && Array.isArray(data.data)) {
          setExams(data.data)
        } else {
          setExams([])
        }
      } else {
        setExams([])
      }
    } catch (error) {
      console.error("❌ Error fetching exams:", error)
      setExams([])
    } finally {
      setIsLoadingExams(false)
    }
  }

  const fetchIssuedCertificates = async () => {
    try {
      setIssuedLoading(true)
      const response = await authFetch("/certificates/teacher/my-issued")
      if (!response.ok) {
        setIssuedCertificates([])
        return
      }

      const payload = await response.json()
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : []

      setIssuedCertificates(list)
    } catch (error) {
      console.error("Error fetching teacher issued certificates:", error)
      setIssuedCertificates([])
    } finally {
      setIssuedLoading(false)
    }
  }

  const formatDateTime = (value?: string) => {
    if (!value) return "-"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleString("vi-VN")
  }

  // Stats
  const totalTemplates = templates.length
  const pendingTemplates = templates.filter(t => t.status === "pending").length
  const approvedTemplates = templates.filter(t => t.status === "approved").length
  const totalIssued = templates.reduce((sum, t) => sum + t.issuedCount, 0)

  const heroCards = [
    {
      title: t("teacher_cert_total_templates", "Tổng mẫu"),
      value: totalTemplates,
      badge: t("teacher_cert_ready", "Đủ kho"),
      tone: "border-cyan-200 bg-cyan-50/75 text-cyan-700 dark:border-cyan-700/60 dark:bg-cyan-900/30 dark:text-cyan-200",
    },
    {
      title: t("teacher_cert_pending", "Chờ duyệt"),
      value: pendingTemplates,
      badge: t("teacher_cert_reviewing", "Review"),
      tone: "border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200",
    },
    {
      title: t("teacher_cert_active", "Hoạt động"),
      value: approvedTemplates,
      badge: t("teacher_cert_live", "Live"),
      tone: "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-200",
    },
    {
      title: t("teacher_cert_issued", "Đã cấp"),
      value: totalIssued,
      badge: t("teacher_cert_trusted", "Trusted"),
      tone: "border-violet-200 bg-violet-50/80 text-violet-700 dark:border-violet-700/60 dark:bg-violet-900/30 dark:text-violet-200",
    },
  ]

  const statusFilterOptions = [
    { value: "all", label: t("teacher_cert_all_status", "Tất cả trạng thái") },
    { value: "draft", label: t("status_draft", "Nháp") },
    { value: "pending", label: t("status_pending", "Chờ duyệt") },
    { value: "approved", label: t("status_approved", "Đã duyệt") },
    { value: "rejected", label: t("status_rejected", "Từ chối") },
  ]

  const filteredTemplates = templates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" || template.status === statusFilter)
  )

  const filteredIssued = issuedCertificates.filter((certificate) => {
    const title = String(certificate.course?.title || certificate.metadata?.courseName || "").toLowerCase()
    const student = String(certificate.student?.name || certificate.metadata?.studentName || "").toLowerCase()
    const certNo = String(certificate.certificateNumber || "").toLowerCase()
    const term = searchTerm.toLowerCase()
    const statusMatched = statusFilter === "all" || certificate.status === statusFilter
    return statusMatched && (title.includes(term) || student.includes(term) || certNo.includes(term))
  })

  const officialExams = exams.filter(
    (exam) => String(exam.type || "").toLowerCase() === "official"
  )

  useEffect(() => {
    const updateIndicators = () => {
      const tabContainer = tabContainerRef.current
      const activeTabButton = tabButtonRefs.current[activeTab]
      if (tabContainer && activeTabButton) {
        const containerRect = tabContainer.getBoundingClientRect()
        const buttonRect = activeTabButton.getBoundingClientRect()
        setActiveTabStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
          ready: true,
        })
      }

      const statusContainer = statusContainerRef.current
      const activeStatusButton = statusButtonRefs.current[statusFilter]
      if (statusContainer && activeStatusButton) {
        const containerRect = statusContainer.getBoundingClientRect()
        const buttonRect = activeStatusButton.getBoundingClientRect()
        setActiveStatusStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
          ready: true,
        })
      }
    }

    updateIndicators()
    window.addEventListener("resize", updateIndicators)
    return () => window.removeEventListener("resize", updateIndicators)
  }, [activeTab, statusFilter])

  const handleEdit = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId)
    if (template) {
      const draft = {
        title: template.title || "",
        description: template.description || "",
        courseId: template.courseId || "",
        validityPeriod: template.validityPeriod || "Vĩnh viễn",
        backgroundColor: template.backgroundColor || "#1a1a2e",
        borderColor: template.borderColor || "#d4af37",
        borderStyle: "double",
        textColor: template.textColor || "#ffffff",
        logoUrl: template.templateImageUrl || "",
        signatureUrl: "",
        templateImageUrl: template.templateImageUrl || "",
        templateStyle: template.templateStyle || "classic",
        badgeStyle: "star",
      }
      localStorage.setItem("certificate_template_draft", JSON.stringify(draft))
      localStorage.setItem("certificate_template_edit_id", templateId)
    }
    router.push("/teacher/certificates/create")
    setOpenMenu(null)
  }

  const handleDeleteClick = (template: CertificateTemplate) => {
    setSelectedTemplate(template)
    setViewMode("delete")
    setOpenMenu(null)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTemplate) return
    
    try {
      const response = await authFetch(`/certificates/templates/${selectedTemplate.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== selectedTemplate.id))
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
    
    setViewMode(null)
    setSelectedTemplate(null)
  }

  const handleSubmitForReview = async (templateId: string) => {
    try {
      const response = await authFetch(`/certificates/templates/${templateId}/submit`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setTemplates(templates.map(t =>
          t.id === templateId ? { ...t, status: "pending" as const, rejectionReason: undefined } : t
        ))
      }
    } catch (error) {
      console.error('Error submitting template:', error)
    }
    
    setOpenMenu(null)
  }

  const handleOpenUseModal = (template: CertificateTemplate) => {
    setUseTemplate(template)
    setSelectedExamId("")
    setAssignError(null)
    // Anchor modal above the 'Sử dụng' button (top of card)
    const card = cardRefs.current[template.id]
    if (card) {
      const rect = card.getBoundingClientRect()
      setAnchorStyle({
        position: "absolute",
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX,
        zIndex: 100,
        width: rect.width,
        maxWidth: 400,
      })
    } else {
      setAnchorStyle(null)
    }
  }

  const handleAssignTemplate = async () => {
    if (!useTemplate || !selectedExamId) {
      setAssignError(t("teacher_cert_select_official_exam", "Vui lòng chọn bài thi thật để gán chứng chỉ."))
      return
    }

    try {
      setIsAssigning(true)
      setAssignError(null)
      const response = await authFetch(`/exams/${selectedExamId}`, {
        method: "PATCH", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ certificateTemplateId: useTemplate.id }),
      })

      if (!response.ok) {
        const message = t("teacher_cert_assign_failed", "Không thể gán chứng chỉ cho bài thi. Vui lòng thử lại.")
        setAssignError(message)
        toast.error(message)
        return
      }

      toast.success(t("teacher_cert_assign_success", "Gán chứng chỉ thành công."))
      setUseTemplate(null)
      setSelectedExamId("")
    } catch (error) {
      const message = t("teacher_cert_assign_failed", "Không thể gán chứng chỉ cho bài thi. Vui lòng thử lại.")
      console.error("Error assigning template:", error)
      setAssignError(message)
      toast.error(message)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleDownloadIssued = (certificate: IssuedCertificate) => {
    if (certificate.pdfUrl) {
      window.open(certificate.pdfUrl, "_blank")
      return
    }
    if (certificate.imageUrl) {
      window.open(certificate.imageUrl, "_blank")
      return
    }
    toast.error(t("teacher_cert_download_unavailable", "Chưa có file để tải xuống"))
  }

  const handleShareIssued = async (certificate: IssuedCertificate) => {
    const verifyUrl = `${window.location.origin}/verify?certificate=${encodeURIComponent(certificate.certificateNumber || "")}`
    try {
      await navigator.clipboard.writeText(verifyUrl)
      toast.success(t("teacher_cert_share_copied", "Đã sao chép liên kết xác minh"))
    } catch {
      toast.error(t("teacher_cert_share_failed", "Không thể sao chép liên kết"))
    }
  }

  const handleVerifyCertificate = async (certificateNumber?: string) => {
    const value = String(certificateNumber || verifyInput).trim()
    if (!value) return

    try {
      setIsVerifying(true)
      const response = await authFetch(`/certificates/verify/${encodeURIComponent(value)}`)
      if (!response.ok) {
        setVerifyResult(false)
        return
      }
      const payload = await response.json()
      setVerifyResult(Boolean(payload))
    } catch {
      setVerifyResult(false)
    } finally {
      setIsVerifying(false)
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
      draft: t("status_draft", "Nháp"),
      pending: t("status_pending", "Chờ duyệt"),
      approved: t("status_approved", "Đã duyệt"),
      rejected: t("status_rejected", "Từ chối"),
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
          className="relative overflow-hidden rounded-[2rem] border border-blue-100/70 bg-white/85 p-6 shadow-[0_24px_60px_rgba(3,105,161,0.16)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 md:p-8"
          style={{
            backgroundImage: "radial-gradient(120% 110% at 0% 0%, rgba(59,130,246,0.25), transparent 45%), radial-gradient(100% 90% at 90% 0%, rgba(34,211,238,0.22), transparent 48%)",
          }}
        >
          <div className="relative space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/70 bg-cyan-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-900/30 dark:text-cyan-200">{t("teacher_cert_label", "Chứng chỉ & mẫu")}</p>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white md:text-5xl leading-tight">{t("teacher_cert_manage_title", "Quản lý Chứng chỉ")}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">{t("teacher_cert_manage_subtitle", "Thiết kế mẫu chứng chỉ, theo dõi trạng thái duyệt và gán cho bài thi chính thức.")}</p>
              </div>
              <Link
                href="/teacher/certificates/create"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white transition hover:bg-cyan-500"
              >
                <Plus size={18} /> {t("teacher_cert_create_template", "Tạo mẫu chứng chỉ")}
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {heroCards.map((card) => (
                <div key={card.title} className={`rounded-xl border p-3 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${card.tone}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em]">{card.title}</p>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-white/70 text-current dark:bg-slate-800/70">{card.badge}</span>
                  </div>
                  <p className="text-2xl font-black mt-2">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div ref={tabContainerRef} className="relative inline-flex w-full flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/70 md:w-auto md:flex-nowrap">
          <div
            className="pointer-events-none absolute inset-y-1 rounded-md bg-cyan-600 shadow-[0_8px_20px_rgba(8,145,178,0.35)] transition-all duration-300"
            style={{
              left: `${activeTabStyle.left}px`,
              width: `${activeTabStyle.width}px`,
              opacity: activeTabStyle.ready ? 1 : 0,
            }}
          />
          <div className="relative z-10 flex w-full flex-wrap gap-1 md:w-auto md:flex-nowrap">
            <button
              type="button"
              ref={(node) => {
                tabButtonRefs.current.templates = node
              }}
              onClick={() => setActiveTab("templates")}
              className={`inline-flex min-w-fit items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                activeTab === "templates"
                  ? "text-white"
                  : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {t("teacher_cert_tab_templates", "Template Library")}
            </button>
            <button
              type="button"
              ref={(node) => {
                tabButtonRefs.current.issued = node
              }}
              onClick={() => setActiveTab("issued")}
              className={`inline-flex min-w-fit items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                activeTab === "issued"
                  ? "text-white"
                  : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {t("teacher_cert_tab_issued", "Issued Certificates (Locked)")}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_12px_35px_rgba(2,132,199,0.09)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/65 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder={
                activeTab === "templates"
                  ? t("teacher_cert_search_placeholder", "Tìm kiếm mẫu chứng chỉ...")
                  : t("teacher_cert_search_issued_placeholder", "Tìm theo học viên, khóa học, mã chứng chỉ...")
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.2)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
            />
          </div>

          <div ref={statusContainerRef} className="relative inline-flex w-full flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/70 md:w-auto md:flex-nowrap">
            <div
              className="pointer-events-none absolute inset-y-1 rounded-md bg-cyan-600 shadow-[0_8px_20px_rgba(8,145,178,0.35)] transition-all duration-300"
              style={{
                left: `${activeStatusStyle.left}px`,
                width: `${activeStatusStyle.width}px`,
                opacity: activeStatusStyle.ready ? 1 : 0,
              }}
            />
            {statusFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                ref={(node) => {
                  statusButtonRefs.current[option.value] = node
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

        {/* Templates Grid */}
        {activeTab === "templates" && (
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-10">
              <Award size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">{t("teacher_cert_empty_title", "Chưa có mẫu chứng chỉ nào")}</h3>
              <p className="text-muted-foreground dark:text-slate-400 mb-4">
                {t("teacher_cert_empty_desc", "Bắt đầu tạo mẫu chứng chỉ đầu tiên cho khóa học của bạn")}
              </p>
              <Link
                href="/teacher/certificates/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus size={20} />
                {t("teacher_cert_create_template", "Tạo mẫu chứng chỉ")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white/90 dark:bg-slate-900/70 border border-border dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow"
                  ref={el => { cardRefs.current[template.id] = el }}
                >
                  <div className="flex items-start justify-end gap-3">
                    <div>{getStatusBadge(template.status)}</div>
                  </div>

                    <div className="mt-4">
                      <div
                        className="relative w-full rounded-xl overflow-hidden shadow-md"
                        style={{
                          aspectRatio: "3 / 4",
                          backgroundColor: template.backgroundColor || "#1a1a2e",
                          backgroundImage: template.templateImageUrl ? `url(${template.templateImageUrl})` : "none",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          color: template.textColor || "#ffffff",
                        }}
                      >
                        {template.templateImageUrl && (
                          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/10" />
                        )}

                        <div
                          className="absolute inset-3 rounded-lg"
                          style={{
                            border: `2px ${template.borderStyle || "double"} ${template.borderColor || "#d4af37"}`,
                          }}
                        />

                        <div className="absolute top-3 left-3 z-10">
                          {template.logoUrl ? (
                            <img
                              src={template.logoUrl}
                              alt="Logo"
                              className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-md bg-white/90 p-1"
                            />
                          ) : (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white/80" />
                          )}
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 sm:px-4 pt-10 pb-9 sm:pt-10 sm:pb-10 text-center">
                          <p
                            className="text-[9px] sm:text-[10px] font-semibold tracking-[0.25em] uppercase"
                            style={{ color: template.borderColor || "#d4af37" }}
                          >
                            {t("teacher_cert_preview_title", "Chứng chỉ hoàn thành")}
                          </p>
                          <div
                            className="w-10 h-px my-2"
                            style={{ backgroundColor: template.borderColor || "#d4af37" }}
                          />

                          <div
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2"
                            style={{
                              backgroundColor: template.textColor || "#ffffff",
                              color: template.borderColor || "#d4af37",
                              border: `2px solid ${template.borderColor || "#d4af37"}`,
                            }}
                          >
                            <Award size={18} />
                          </div>

                          <h4 className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2 max-w-[90%]">
                            {template.title}
                          </h4>
                          <div
                            className="w-10 h-px my-2"
                            style={{ backgroundColor: template.borderColor || "#d4af37" }}
                          />
                          <p className="text-[9px] sm:text-[11px] opacity-70">{t("teacher_cert_preview_certify", "Chứng nhận rằng")}</p>
                          <p className="text-xs sm:text-sm font-semibold italic mt-1 line-clamp-1 max-w-[90%]">[Tên học viên]</p>
                          <div
                            className="w-24 h-px mt-2"
                            style={{ backgroundColor: template.borderColor || "#d4af37" }}
                          />
                          <p className="text-[9px] sm:text-[11px] mt-2 sm:mt-3 opacity-80 line-clamp-3 max-w-[90%]">
                            {template.description}
                          </p>
                          <p
                            className="text-[9px] sm:text-[11px] font-semibold mt-2 line-clamp-2 max-w-[90%]"
                            style={{ color: template.borderColor || "#d4af37" }}
                          >
                            {template.courseName || "[Tên khóa học]"}
                          </p>
                        </div>

                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 text-[9px] sm:text-[10px]">
                          <span
                            className="px-2 py-1 rounded-md"
                            style={{
                              color: template.borderColor || "#d4af37",
                              border: `1px solid ${template.borderColor || "#d4af37"}`,
                              backgroundColor: `${template.borderColor || "#d4af37"}20`,
                            }}
                          >
                            {template.validityPeriod}
                          </span>
                        </div>
                      </div>
                    </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-foreground dark:text-white">{template.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{template.description}</p>
                  </div>

                  {template.status === "approved" && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleOpenUseModal(template)}
                        className="w-full px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                      >
                        {t("teacher_cert_use", "Sử dụng")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {activeTab === "issued" && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            {issuedLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {t("teacher_cert_loading_issued", "Đang tải chứng chỉ đã cấp...")}
              </div>
            ) : filteredIssued.length === 0 ? (
              <div className="py-10 text-center">
                <FileText size={42} className="mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground dark:text-white">
                  {t("teacher_cert_issued_empty_title", "Chưa có chứng chỉ nào được cấp")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground dark:text-slate-400">
                  {t("teacher_cert_issued_empty_desc", "Khi học viên vượt qua bài thi chính thức, chứng chỉ sẽ xuất hiện tại đây dưới dạng snapshot không chỉnh sửa.")}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="rounded-xl border border-border bg-background/70 p-4 dark:border-slate-700 dark:bg-slate-950/50">
                  <h3 className="text-sm font-semibold text-foreground dark:text-white">
                    {t("teacher_cert_verify_title", "Verify Certificate")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                    {t("teacher_cert_verify_subtitle", "Nhập Certificate ID để kiểm tra tính hợp lệ.")}
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={verifyInput}
                      onChange={(e) => {
                        setVerifyInput(e.target.value)
                        setVerifyResult(null)
                      }}
                      placeholder="CERT-XXXX"
                      className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={() => handleVerifyCertificate()}
                      disabled={isVerifying || !verifyInput.trim()}
                      className="h-10 rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary disabled:opacity-60"
                    >
                      {isVerifying ? t("common_loading", "Đang kiểm tra...") : t("common_verify", "Verify")}
                    </button>
                  </div>
                  {verifyResult !== null && (
                    <p className={`mt-2 text-xs font-medium ${verifyResult ? "text-emerald-600" : "text-red-500"}`}>
                      {verifyResult
                        ? t("teacher_cert_verify_valid", "Certificate hợp lệ")
                        : t("teacher_cert_verify_invalid", "Certificate không hợp lệ")}
                    </p>
                  )}
                </div>

                {filteredIssued.map((certificate) => {
                  const studentName = certificate.student?.name || certificate.metadata?.studentName || "-"
                  const courseName = certificate.course?.title || certificate.metadata?.courseName || "-"
                  const issueDate = formatDateTime(certificate.issueDate)
                  const snapshotTemplate = certificate.metadata?.snapshot?.template
                  const previewImage = certificate.imageUrl || snapshotTemplate?.templateImageUrl

                  return (
                    <article key={certificate.id} className="mx-auto w-full max-w-5xl rounded-2xl border border-border bg-background/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/50">
                      <div className="rounded-xl border border-border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                        <div
                          className="relative mx-auto w-full max-w-3xl overflow-hidden border border-border bg-white"
                          style={{ aspectRatio: "4 / 3" }}
                        >
                          {previewImage ? (
                            <img
                              src={previewImage}
                              alt={certificate.certificateNumber}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div
                              className="absolute inset-6 flex items-center justify-center border"
                              style={{
                                borderColor: snapshotTemplate?.borderColor || "#d4af37",
                                borderStyle: (snapshotTemplate?.borderStyle as any) || "double",
                                backgroundColor: snapshotTemplate?.backgroundColor || "#1a1a2e",
                                color: snapshotTemplate?.textColor || "#ffffff",
                              }}
                            >
                              <div className="text-center px-6">
                                <p className="text-xs uppercase tracking-[0.2em] opacity-80">Certificate Snapshot</p>
                                <h4 className="mt-3 text-lg font-semibold">{snapshotTemplate?.title || t("teacher_cert_snapshot_title", "Certificate")}</h4>
                                <p className="mt-2 text-sm opacity-80">{studentName}</p>
                                <p className="mt-1 text-xs opacity-70">{courseName}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-gray-600 dark:text-slate-300 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">Student</div>
                          <div className="mt-1 font-medium text-foreground dark:text-white">{studentName}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">Course</div>
                          <div className="mt-1 font-medium text-foreground dark:text-white">{courseName}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">Date</div>
                          <div className="mt-1 font-medium text-foreground dark:text-white">{issueDate}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">Certificate ID</div>
                          <div className="mt-1 font-mono font-medium text-foreground dark:text-white">{certificate.certificateNumber || "-"}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadIssued(certificate)}
                          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Download size={16} /> {t("teacher_cert_download_pdf", "Download PDF")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyInput(certificate.certificateNumber || "")
                            handleVerifyCertificate(certificate.certificateNumber)
                          }}
                          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <CheckCircle size={16} /> {t("common_verify", "Verify")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareIssued(certificate)}
                          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Share2 size={16} /> {t("common_share", "Share link")}
                        </button>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {t("teacher_cert_locked_notice", "Issued certificate is locked and cannot be edited")}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Use Template Modal */}
        {useTemplate && (
          <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setUseTemplate(null)} />
            {/* Anchored modal */}
            <div
              className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl p-6 shadow-xl"
              style={anchorStyle || { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 50, width: "100%", maxWidth: 400 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground dark:text-white">
                  {t("teacher_cert_assign_title", "Gán chứng chỉ cho bài thi")}
                </h3>
                <button
                  onClick={() => setUseTemplate(null)}
                  className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg"
                  style={{ zIndex: 101 }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {t("teacher_cert_assign_only_official", "Chỉ hiển thị các bài thi thật (official).")}
                </div>
                <UniversalSelect
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                  disabled={isLoadingExams}
                >
                  <option value="">{t("teacher_cert_select_official_exam_option", "Chọn bài thi thật")}</option>
                  {officialExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}{exam.course?.title ? ` - ${exam.course.title}` : ""}
                    </option>
                  ))}
                </UniversalSelect>
                {!isLoadingExams && officialExams.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("teacher_cert_no_official_exams", "Chưa có bài thi thật nào để gán chứng chỉ.")}
                  </p>
                )}
                {assignError && (
                  <p className="text-sm text-red-500">{assignError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setUseTemplate(null)}
                  className="px-4 py-2 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                  disabled={isAssigning}
                >
                  {t("common_cancel", "Hủy")}
                </button>
                <button
                  type="button"
                  onClick={handleAssignTemplate}
                  className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                  disabled={isAssigning || officialExams.length === 0}
                >
                  {isAssigning ? t("teacher_cert_assigning", "Đang gán...") : t("teacher_cert_assign", "Gán chứng chỉ")}
                </button>
              </div>
            </div>
          </>
        )}
        {/* View Modal */}
        {selectedTemplate && viewMode === "view" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground dark:text-white">Chi tiết mẫu chứng chỉ</h2>
                <button
                  onClick={() => {
                    setViewMode(null)
                    setSelectedTemplate(null)
                  }}
                  className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Preview */}
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  <Award size={64} className="text-primary/40" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">{selectedTemplate.title}</h3>
                  <p className="text-muted-foreground dark:text-slate-400">{selectedTemplate.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Trạng thái</p>
                    <div className="mt-1">{getStatusBadge(selectedTemplate.status)}</div>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Khóa học</p>
                    <p className="text-foreground dark:text-white font-medium">{selectedTemplate.courseName}</p>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Hiệu lực</p>
                    <p className="text-foreground dark:text-white font-medium">{selectedTemplate.validityPeriod}</p>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Đã cấp</p>
                    <p className="text-foreground dark:text-white font-medium">{selectedTemplate.issuedCount} chứng chỉ</p>
                  </div>
                </div>

                {selectedTemplate.status === "rejected" && selectedTemplate.rejectionReason && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                      <AlertCircle size={20} />
                      <span className="font-medium">Lý do từ chối</span>
                    </div>
                    <p className="text-red-400">{selectedTemplate.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {selectedTemplate && viewMode === "delete" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <AlertCircle size={24} />
                <h3 className="text-lg font-bold">Xác nhận xóa</h3>
              </div>
              <p className="text-muted-foreground dark:text-slate-400 mb-6">
                Bạn có chắc chắn muốn xóa mẫu chứng chỉ "{selectedTemplate.title}"? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setViewMode(null)
                    setSelectedTemplate(null)
                  }}
                  className="px-4 py-2 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  Xóa mẫu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

