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

  // Fetch templates from API
  useEffect(() => {
    fetchTemplates()
    fetchExams()
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

  const filteredTemplates = templates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" || template.status === statusFilter)
  )

  const officialExams = exams.filter(
    (exam) => String(exam.type || "").toLowerCase() === "official"
  )

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
      <div className="w-full space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bg_certificate.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("teacher_cert_manage_title", "Quản lý Chứng chỉ")}</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">{t("teacher_cert_manage_subtitle", "Tạo và quản lý mẫu chứng chỉ cho khóa học")}</p>
              </div>
              <Link
                href="/teacher/certificates/create"
                className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-fit backdrop-blur-sm"
              >
                <Plus size={20} /> {t("teacher_cert_create_template", "Tạo mẫu chứng chỉ")}
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("teacher_cert_total_templates", "Tổng mẫu")}</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalTemplates}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Award size={20} className="text-primary" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("teacher_cert_pending", "Chờ duyệt")}</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingTemplates}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("teacher_cert_active", "Hoạt động")}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{approvedTemplates}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("teacher_cert_issued", "Đã cấp")}</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{totalIssued}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Users size={20} className="text-purple-600 dark:text-purple-400" />
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
              placeholder={t("teacher_cert_search_placeholder", "Tìm kiếm mẫu chứng chỉ...")}
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
            <option value="all">{t("teacher_cert_all_status", "Tất cả trạng thái")}</option>
            <option value="draft">{t("status_draft", "Nháp")}</option>
            <option value="pending">{t("status_pending", "Chờ duyệt")}</option>
            <option value="approved">{t("status_approved", "Đã duyệt")}</option>
            <option value="rejected">{t("status_rejected", "Từ chối")}</option>
          </select>
        </div>

        {/* Templates Grid */}
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
                <select
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
                </select>
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

