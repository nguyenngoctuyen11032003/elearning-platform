"use client"

import { useEffect, useRef, useState } from "react"
import { Search, MoreVertical, CheckCircle, Clock, XCircle, Award, Eye, X, AlertCircle, User, BookOpen, Calendar, Download } from "lucide-react"
import { Modal } from "@/components/ui/admin-modals"
import { authFetch } from "@/lib/authfetch"
import { useLanguage } from "@/lib/i18n/language-context"

interface CertificateTemplate {
  id: string
  title: string
  description: string
  courseId: string
  course?: {
    id: string
    title: string
  } | null
  teacher?: {
    id: string
    name: string
    email: string
  } | null
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt: string
  validityPeriod: string
  rejectionReason?: string
  issuedCount: number
  templateImageUrl?: string
  logoUrl?: string
  backgroundColor?: string
  borderColor?: string
  borderStyle?: string
  textColor?: string
}

interface ExamSummary {
  id: string
  title: string
  type: "practice" | "official"
  status: "draft" | "pending" | "approved" | "rejected"
  courseId: string
  course?: {
    id: string
    title: string
  } | null
}

interface IssuedCertificate {
  id: string
  certificateNumber?: string
  status: "pending" | "approved" | "rejected"
  issueDate?: string
  createdAt?: string
  rejectionReason?: string | null
  imageUrl?: string | null
  metadata?: {
    courseName?: string
  } | null
  course?: {
    id: string
    title: string
  } | null
  student?: {
    id: string
    name: string
    email: string
  } | null
}

export default function AdminCertificatesPage() {
      const { t } = useLanguage()
      // Helper to set anchor for modal
      const openAnchoredModal = (cardId: string) => {
        const card = cardRefs.current[cardId]
        if (card) {
          const rect = card.getBoundingClientRect()
          setAnchorStyle({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
          })
        } else {
          setAnchorStyle(null)
        }
      }
    const [anchorStyle, setAnchorStyle] = useState<{ top: number; left: number; width: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [certificates, setCertificates] = useState<CertificateTemplate[]>([])
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>([])
  const [exams, setExams] = useState<ExamSummary[]>([])
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateTemplate | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "reject" | null>(null)
  const [viewDetailModalOpen, setViewDetailModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [approveTarget, setApproveTarget] = useState<CertificateTemplate | null>(null)
  const [selectedExamId, setSelectedExamId] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [viewTab, setViewTab] = useState<"templates" | "issued">("templates")
  const [activeCertId, setActiveCertId] = useState<string | null>(null)

  // Add cardRefs for certificate card element references
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const normalizeList = (data: any): any[] => {
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.data)) return data.data
    if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data
    return []
  }

  const fetchCertificates = async () => {
    try {
      const response = await authFetch("/admin/certificate-templates")

      if (!response.ok) return
      const data = await response.json()
      setCertificates(normalizeList(data))
    } catch (error) {
      console.error("Error fetching certificates:", error)
    }
  }

  const fetchExams = async () => {
    try {
      const response = await authFetch("/admin/exams")

      if (!response.ok) return
      const data = await response.json()
      setExams(normalizeList(data))
    } catch (error) {
      console.error("Error fetching exams:", error)
    }
  }

  const fetchIssuedCertificates = async () => {
    try {
      const response = await authFetch("/admin/certificates")

      if (!response.ok) return
      const data = await response.json()
      setIssuedCertificates(normalizeList(data))
    } catch (error) {
      console.error("Error fetching issued certificates:", error)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      await Promise.all([fetchCertificates(), fetchExams(), fetchIssuedCertificates()])
      if (isMounted) setIsLoading(false)
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredCertificates = certificates.filter((cert) => {
    const courseTitle = cert.course?.title || ""
    const teacherName = cert.teacher?.name || ""
    const matchesSearch =
      cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courseTitle.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch && (statusFilter === "all" || cert.status === statusFilter)
  })

  const filteredIssuedCertificates = issuedCertificates.filter((cert) => {
    const courseTitle = cert.course?.title || cert.metadata?.courseName || ""
    const studentName = cert.student?.name || ""
    const studentEmail = cert.student?.email || ""
    const certNumber = cert.certificateNumber || ""
    const matchesSearch =
      certNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courseTitle.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch && (statusFilter === "all" || cert.status === statusFilter)
  })

  // Stats
  const totalCertificates = certificates.length
  const pendingCertificates = certificates.filter(c => c.status === "pending").length
  const approvedCertificates = certificates.filter(c => c.status === "approved").length
  const rejectedCertificates = certificates.filter(c => c.status === "rejected").length
  const totalIssued = certificates.reduce((sum, c) => sum + c.issuedCount, 0)

  const handleAction = (action: string, certificateId: string, certificate?: CertificateTemplate) => {
    setSelectedCertificate(certificate || null)
    setActiveCertId(certificateId)
    if (action === "view") {
      openAnchoredModal(certificateId)
      setViewDetailModalOpen(true)
      setViewMode(null)
    } else if (action === "reject") {
      openAnchoredModal(certificateId)
      setViewMode("reject")
      setRejectionReason("")
    } else if (action === "approve") {
      openAnchoredModal(certificateId)
      setApproveTarget(certificate || null)
      setApproveModalOpen(true)
    }
    setOpenMenu(null)
  }

  const handleReject = async () => {
    if (!selectedCertificate || !rejectionReason.trim()) return
    try {
      const response = await authFetch(`/admin/certificate-templates/${selectedCertificate.id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason: rejectionReason }),
      })

      if (!response.ok) {
        throw new Error("Reject failed")
      }

      await fetchCertificates()
      setViewMode(null)
      setSelectedCertificate(null)
      setRejectionReason("")
      setActiveCertId(null)
    } catch (error) {
      console.error("Reject error:", error)
      alert(t("adm_cert_reject_err", "Không thể từ chối chứng chỉ. Vui lòng thử lại."))
    }
  }

  const handleApprove = async () => {
    if (!approveTarget) return
    setIsApproving(true)
    try {
      const response = await authFetch(`/admin/certificate-templates/${approveTarget.id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error("Approve failed")
      }

      await fetchCertificates()
      setApproveModalOpen(false)
      setApproveTarget(null)
      setStatusFilter("approved")
      setActiveCertId(null)
      setViewTab("templates")
    } catch (error) {
      console.error("Approve error:", error)
      alert(t("adm_cert_approve_err", "Không thể duyệt chứng chỉ. Vui lòng thử lại."))
    } finally {
      setIsApproving(false)
    }
  }

const formatDate = (date?: string) => {
  if (!date) return "—"
  const d = new Date(date)
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("vi-VN")
}

  const availableExams = approveTarget
    ? exams.filter(
        (exam) =>
          exam.type === "official" &&
          exam.courseId === approveTarget.courseId,
      )
    : []


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return [
          <span key="approved" className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <CheckCircle size={14} /> {t("adm_cert_approved", t("adm_cert_approved", "Đã duyệt"))}
          </span>
        ];
      case "pending":
        return [
          <span key="pending" className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            <Clock size={14} /> {t("adm_cert_pending", t("adm_cert_pending", "Chờ duyệt"))}
          </span>
        ];
      case "rejected":
        return [
          <span key="rejected" className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            <XCircle size={14} /> {t("adm_cert_rejected", t("adm_cert_rejected", "Từ chối"))}
          </span>
        ];
      case "draft":
        return [
          <span key="draft" className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
            <Clock size={14} /> {t("adm_cert_draft", "Nháp")}
          </span>
        ];
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bg_certificate3.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("adm_cert_title", "Quản lý chứng chỉ")}</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">{t("adm_cert_subtitle", "Xem xét, duyệt và quản lý các mẫu chứng chỉ từ giảng viên")}</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_cert_total", "Tổng mẫu")}</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalCertificates}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Award size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_cert_pending", t("adm_cert_pending", "Chờ duyệt"))}</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingCertificates}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_cert_approved", t("adm_cert_approved", "Đã duyệt"))}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{approvedCertificates}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_cert_rejected", "Từ chối")}</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{rejectedCertificates}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <XCircle size={20} className="text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.65s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_cert_issued", "Đã cấp")}</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{totalIssued}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Download size={20} className="text-purple-600 dark:text-purple-400" />
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
              placeholder={t("adm_cert_search", "Tìm kiếm chứng chỉ, khóa học hoặc giảng viên...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setViewTab("templates")}
              className={`px-4 py-3 rounded-lg transition-smooth font-medium ${
                viewTab === "templates"
                  ? "bg-primary text-white"
                  : "bg-card dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
              }`}
            >
              {t("adm_cert_tab_templates", "Mẫu chứng chỉ")}
            </button>
            <button
              onClick={() => setViewTab("issued")}
              className={`px-4 py-3 rounded-lg transition-smooth font-medium ${
                viewTab === "issued"
                  ? "bg-primary text-white"
                  : "bg-card dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
              }`}
            >
              {t("adm_cert_tab_issued", "Chứng chỉ đã cấp")}
            </button>
            {[
              { value: "all", label: t("adm_cert_all", "Tất cả") },
              { value: "pending", label: t("adm_cert_pending", "Chờ duyệt") },
              { value: "approved", label: t("adm_cert_approved", "Đã duyệt") },
              { value: "rejected", label: t("adm_cert_rejected", "Từ chối") },
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

        {/* Certificates Table */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-visible">
          {isLoading ? (
            <div className="py-12 text-center">
              <Award size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">{t("adm_cert_loading", "Đang tải chứng chỉ...")}</p>
            </div>
          ) : viewTab === "templates" ? (
            <div className="p-6">
              {filteredCertificates.length === 0 ? (
                <div className="py-12 text-center">
                  <Award size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground dark:text-slate-400">{t("adm_cert_empty", "Không tìm thấy chứng chỉ nào")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCertificates.map((cert) => (
                    <div
                      key={cert.id}
                      ref={(el) => { cardRefs.current[cert.id] = el; }}
                      className={`relative bg-white/90 dark:bg-slate-900/70 border border-border dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow ${openMenu === cert.id ? "z-20" : "z-0"} ${activeCertId === cert.id ? "ring-2 ring-green-500" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>{getStatusBadge(cert.status)}</div>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === cert.id ? null : cert.id)}
                            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                          >
                            <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                          </button>
                          {openMenu === cert.id && (
                            <div className="absolute right-0 top-full mt-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-lg z-30 min-w-48">
                              <button
                                onClick={() => handleAction("view", cert.id, cert)}
                                className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                              >
                                <Eye size={16} /> {t("adm_cert_view", "Xem chi tiết")}
                              </button>
                              {cert.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleAction("approve", cert.id, cert)}
                                    className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-green-600 dark:text-green-400"
                                  >
                                    <CheckCircle size={16} /> {t("adm_cert_approve_btn", "Duyệt chứng chỉ")}
                                  </button>
                                  <button
                                    onClick={() => handleAction("reject", cert.id, cert)}
                                    className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-red-600 dark:text-red-400"
                                  >
                                    <XCircle size={16} /> {t("adm_cert_rejected", t("adm_cert_rejected", "Từ chối"))}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div
                          className="relative w-full rounded-xl overflow-hidden shadow-md"
                          style={{
                            aspectRatio: "3 / 4",
                            backgroundColor: cert.backgroundColor || "#243447",
                            backgroundImage: cert.templateImageUrl ? `url(${cert.templateImageUrl})` : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            color: cert.textColor || "#ffffff",
                          }}
                        >
                          {cert.templateImageUrl && (
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/10" />
                          )}

                          <div
                            className="absolute inset-3 rounded-lg"
                            style={{
                              border: `2px ${cert.borderStyle || "double"} ${cert.borderColor || "#d4af37"}`,
                            }}
                          />

                          <div className="absolute top-3 left-3 z-10">
                            {cert.logoUrl ? (
                              <img
                                src={cert.logoUrl}
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
                              style={{ color: cert.borderColor || "#d4af37" }}
                            >
                              {t("adm_cert_completion", "Chứng chỉ hoàn thành")}
                            </p>
                            <div
                              className="w-10 h-px my-2"
                              style={{ backgroundColor: cert.borderColor || "#d4af37" }}
                            />

                            <div
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2"
                              style={{
                                backgroundColor: cert.textColor || "#ffffff",
                                color: cert.borderColor || "#d4af37",
                                border: `2px solid ${cert.borderColor || "#d4af37"}`,
                              }}
                            >
                              <Award size={18} />
                            </div>

                            <h4 className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2 max-w-[90%]">{cert.title}</h4>
                            <div
                              className="w-10 h-px my-2"
                              style={{ backgroundColor: cert.borderColor || "#d4af37" }}
                            />
                            <p className="text-[9px] sm:text-[11px] opacity-70">{t("adm_cert_certifies", "Chứng nhận rằng")}</p>
                            <p className="text-xs sm:text-sm font-semibold italic mt-1 line-clamp-1 max-w-[90%]">{t("adm_cert_student_name", "[Tên học viên]")}</p>
                            <div
                              className="w-24 h-px mt-2"
                              style={{ backgroundColor: cert.borderColor || "#d4af37" }}
                            />
                            <p className="text-[9px] sm:text-[11px] mt-2 sm:mt-3 opacity-80 line-clamp-3 max-w-[90%]">
                              {cert.description}
                            </p>
                            <p
                              className="text-[9px] sm:text-[11px] font-semibold mt-2 line-clamp-2 max-w-[90%]"
                              style={{ color: cert.borderColor || "#d4af37" }}
                            >
                              {cert.course?.title || t("adm_cert_course_name", "[Tên khóa học]")}
                            </p>
                          </div>

                          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 text-[9px] sm:text-[10px]">
                            <span
                              className="px-2 py-1 rounded-md"
                              style={{
                                color: cert.borderColor || "#d4af37",
                                border: `1px solid ${cert.borderColor || "#d4af37"}`,
                                backgroundColor: `${cert.borderColor || "#d4af37"}20`,
                              }}
                            >
                              {cert.validityPeriod}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <h3 className="text-lg font-semibold text-foreground dark:text-white line-clamp-2">{cert.title}</h3>
                        <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-2">{cert.description}</p>
                        <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-1">
                          {t("adm_cert_course_label", "Khóa học")}: <span className="text-foreground dark:text-white">{cert.course?.title || "—"}</span>
                        </p>
                        <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-1">
                          {t("adm_cert_teacher_label", "Giảng viên")}: <span className="text-foreground dark:text-white">{cert.teacher?.name || "—"}</span>
                        </p>

                        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground dark:text-slate-500">
                          <span>{t("adm_cert_created", "Tạo")}: {formatDate(cert.createdAt)}</span>
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-medium">
                            {t("adm_cert_issued_label", "Đã cấp")}: {cert.issuedCount}
                          </span>
                        </div>
                      </div>

                      {cert.status === "pending" && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAction("approve", cert.id, cert)}
                            className="py-2 rounded-lg font-medium flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                          >
                            <CheckCircle size={16} /> {t("adm_cert_approve", "Duyệt")}
                          </button>
                          <button
                            onClick={() => handleAction("reject", cert.id, cert)}
                            className="py-2 rounded-lg font-medium flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                          >
                            <XCircle size={16} /> {t("adm_cert_rejected", t("adm_cert_rejected", "Từ chối"))}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                    <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("adm_cert_col_number", "Số chứng chỉ")}</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("adm_cert_col_student", "Học viên")}</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("adm_cert_col_course", "Khóa học")}</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("adm_cert_col_issue_date", "Ngày cấp")}</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("adm_cert_col_status", "Trạng thái")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssuedCertificates.map((cert) => (
                    <tr
                      key={cert.id}
                      className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth"
                    >
                      <td className="py-4 px-6 text-foreground dark:text-white">
                        {cert.certificateNumber || "—"}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-foreground dark:text-white font-medium">{cert.student?.name || "—"}</p>
                          <p className="text-muted-foreground dark:text-slate-400 text-xs">{cert.student?.email || ""}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">
                        {cert.course?.title || cert.metadata?.courseName || "—"}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">
                        {formatDate(cert.issueDate || cert.createdAt)}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(cert.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isLoading && viewTab === "issued" && filteredIssuedCertificates.length === 0 && (
            <div className="py-12 text-center">
              <Award size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">{t("adm_cert_empty", "Không tìm thấy chứng chỉ nào")}</p>
            </div>
          )}
        </div>
      </div>

      {approveModalOpen && approveTarget && anchorStyle && (
        <div className="fixed inset-0 z-[999]" style={{ pointerEvents: 'auto' }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => {
            setApproveModalOpen(false)
            setApproveTarget(null)
            setAnchorStyle(null)
          }} />
          <div
            className="absolute flex flex-row items-center gap-8 bg-card border rounded-2xl shadow-2xl p-8 inline-block"
            style={{
              top: anchorStyle.top,
              left: anchorStyle.left,
              // Remove width: anchorStyle.width for tight fit
            }}
          >
            {/* Certificate Preview */}
            <div className="flex-1 flex flex-col items-center justify-center min-w-[260px]">
              <div
                className="w-full max-w-xs aspect-[3/4] rounded-xl overflow-hidden shadow-lg border relative"
                style={{
                  backgroundColor: approveTarget.backgroundColor || "#243447",
                  backgroundImage: approveTarget.templateImageUrl ? `url(${approveTarget.templateImageUrl})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  color: approveTarget.textColor || "#ffffff",
                  border: `2px ${approveTarget.borderStyle || "double"} ${approveTarget.borderColor || "#d4af37"}`,
                }}
              >
                {/* Logo */}
                <div className="absolute top-3 left-3 z-10">
                  {approveTarget.logoUrl ? (
                    <img
                      src={approveTarget.logoUrl}
                      alt="Logo"
                      className="w-10 h-10 object-contain rounded-md bg-white/90 p-1"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-white/80" />
                  )}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                  <p
                    className="text-xs font-semibold tracking-[0.25em] uppercase"
                    style={{ color: approveTarget.borderColor || "#d4af37" }}
                  >
                    {t("adm_cert_completion", "Chứng chỉ hoàn thành")}
                  </p>
                  <div
                    className="w-10 h-px my-2"
                    style={{ backgroundColor: approveTarget.borderColor || "#d4af37" }}
                  />
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{
                      backgroundColor: approveTarget.textColor || "#ffffff",
                      color: approveTarget.borderColor || "#d4af37",
                      border: `2px solid ${approveTarget.borderColor || "#d4af37"}`,
                    }}
                  >
                    <Award size={28} />
                  </div>
                  <h4 className="text-lg font-semibold leading-snug">
                    {approveTarget.title}
                  </h4>
                  <div
                    className="w-10 h-px my-2"
                    style={{ backgroundColor: approveTarget.borderColor || "#d4af37" }}
                  />
                  <p className="text-xs opacity-70">{t("adm_cert_certifies", "Chứng nhận rằng")}</p>
                  <p className="text-base font-semibold italic mt-1">{t("adm_cert_student_name", "[Tên học viên]")}</p>
                  <div
                    className="w-24 h-px mt-2"
                    style={{ backgroundColor: approveTarget.borderColor || "#d4af37" }}
                  />
                  <p className="text-xs mt-3 opacity-80 line-clamp-2">
                    {approveTarget.description}
                  </p>
                  <p
                    className="text-xs font-semibold mt-2"
                    style={{ color: approveTarget.borderColor || "#d4af37" }}
                  >
                    {approveTarget.course?.title || t("adm_cert_course_name", "[Tên khóa học]")}
                  </p>
                </div>
                <div className="absolute bottom-3 left-3 text-xs">
                  <span
                    className="px-2 py-1 rounded-md"
                    style={{
                      color: approveTarget.borderColor || "#d4af37",
                      border: `1px solid ${approveTarget.borderColor || "#d4af37"}`,
                      backgroundColor: `${approveTarget.borderColor || "#d4af37"}20`,
                    }}
                  >
                    {approveTarget.validityPeriod}
                  </span>
                </div>
              </div>
            </div>
            {/* Approve/Cancel Buttons */}
            <div className="flex flex-col items-center gap-6 flex-1 min-w-[220px]">
              <div className="w-full">
                <h3 className="text-lg font-bold text-foreground dark:text-white mb-2">{t("adm_cert_approve_title", "Duyệt chứng chỉ này?")}</h3>
                <p className="text-muted-foreground dark:text-slate-400 mb-4">{t("adm_cert_approve_msg", "Bạn có chắc chắn muốn duyệt mẫu chứng chỉ này không?")}</p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  <CheckCircle size={22} /> {isApproving ? t("adm_cert_approving", "Đang duyệt...") : t("adm_cert_approve_btn", "Duyệt chứng chỉ")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApproveModalOpen(false)
                    setApproveTarget(null)
                    setAnchorStyle(null)
                  }}
                  className="w-full py-3 rounded-lg font-medium border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 text-lg"
                >
                  {t("adm_cert_cancel", "Hủy")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCertificate && viewMode === null && viewDetailModalOpen && anchorStyle && (
        <div className="fixed inset-0 z-[999]" style={{ pointerEvents: 'auto' }}>
          <div className="absolute inset-0 bg-black/30" onClick={() => {
            setViewDetailModalOpen(false)
            setSelectedCertificate(null)
            setAnchorStyle(null)
          }} />
          <div
            className="absolute"
            style={{
              top: anchorStyle.top,
              left: anchorStyle.left,
              width: anchorStyle.width,
            }}
          >
            {/* Detail content (reuse from card) */}
            <div className="bg-card border rounded-2xl shadow-2xl p-5">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-foreground dark:text-white">{t("adm_cert_detail_title", "Chi tiết chứng chỉ")}</h4>
                    <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                      {t("adm_cert_detail_subtitle", "Xem nhanh thông tin của mẫu chứng chỉ này")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setViewDetailModalOpen(false)
                      setSelectedCertificate(null)
                      setAnchorStyle(null)
                    }}
                    className="p-2 rounded-lg hover:bg-secondary dark:hover:bg-slate-800"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                </div>
                {selectedCertificate.status === "rejected" && selectedCertificate.rejectionReason && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-1">
                      <AlertCircle size={16} />
                      <span className="font-semibold text-sm">{t("adm_cert_reject_reason", "Lý do từ chối")}</span>
                    </div>
                    <p className="text-red-600 dark:text-red-300 text-sm">{selectedCertificate.rejectionReason}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-card dark:bg-slate-900/60 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <BookOpen size={14} />
                      <span className="text-xs">{t("adm_cert_col_course", "Khóa học")}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground dark:text-white">{selectedCertificate.course?.title || "—"}</p>
                  </div>
                  <div className="bg-card dark:bg-slate-900/60 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <User size={14} />
                      <span className="text-xs">{t("adm_cert_teacher_label", "Giảng viên")}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground dark:text-white">{selectedCertificate.teacher?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground dark:text-slate-400">{selectedCertificate.teacher?.email || "—"}</p>
                  </div>
                  <div className="bg-card dark:bg-slate-900/60 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Calendar size={14} />
                      <span className="text-xs">{t("adm_cert_validity", "Thời hạn hiệu lực")}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground dark:text-white">{selectedCertificate.validityPeriod}</p>
                  </div>
                  <div className="bg-card dark:bg-slate-900/60 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Download size={14} />
                      <span className="text-xs">{t("adm_cert_issued_count", "Số lượng đã cấp")}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground dark:text-white">{selectedCertificate.issuedCount} {t("adm_cert_unit", "chứng chỉ")}</p>
                  </div>
                </div>
                {/* No approve/reject buttons in detail modal */}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCertificate && viewMode === "reject" && anchorStyle && (
        <div className="fixed inset-0 z-[999]" style={{ pointerEvents: 'auto' }}>
          <div className="absolute inset-0 bg-black/30" onClick={() => {
            setViewMode(null)
            setSelectedCertificate(null)
            setRejectionReason("")
            setAnchorStyle(null)
          }} />
          <div
            className="absolute"
            style={{
              top: anchorStyle.top,
              left: anchorStyle.left,
              width: anchorStyle.width,
            }}
          >
            <div className="bg-card border border-red-200 dark:border-red-800 rounded-2xl shadow-2xl p-5">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-red-700 dark:text-red-400">{t("adm_cert_reject_title", "Từ chối chứng chỉ")}</h4>
                    <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                      {t("adm_cert_reject_subtitle", "Nhập lý do để giảng viên nhận được phản hồi rõ ràng")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setViewMode(null)
                      setSelectedCertificate(null)
                      setRejectionReason("")
                      setAnchorStyle(null)
                    }}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                </div>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t("adm_cert_reject_ph", "Nhập lý do từ chối chứng chỉ này...")}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 h-28 resize-none"
                />
                <p className="text-xs text-muted-foreground dark:text-slate-500">
                  {t("adm_cert_reject_note", "Lý do này sẽ được gửi đến email của giảng viên.")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setViewMode(null)
                      setSelectedCertificate(null)
                      setRejectionReason("")
                      setAnchorStyle(null)
                    }}
                    className="py-2 rounded-lg font-medium border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                  >
                    {t("adm_cert_back", "Quay lại")}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                    className="py-2 rounded-lg font-medium flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle size={16} /> {t("adm_cert_reject_confirm", "Xác nhận từ chối")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function setDetailPopoverStyle(arg0: { top: any; left: any; width: any } | null) {
  throw new Error("Function not implemented.")
}

