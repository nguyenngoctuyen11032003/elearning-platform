"use client"

import { useEffect, useState } from "react"
import { Search, MoreVertical, CheckCircle, Clock, XCircle, Award, Eye, X, AlertCircle, User, BookOpen, Calendar, Download } from "lucide-react"
import { Modal } from "@/components/ui/admin-modals"

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

export default function AdminCertificatesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [certificates, setCertificates] = useState<CertificateTemplate[]>([])
  const [exams, setExams] = useState<ExamSummary[]>([])
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateTemplate | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [approveTarget, setApproveTarget] = useState<CertificateTemplate | null>(null)
  const [selectedExamId, setSelectedExamId] = useState("")
  const [isApproving, setIsApproving] = useState(false)

  const getAuthToken = () => localStorage.getItem("auth_token") || localStorage.getItem("token") || ""

  const normalizeList = (data: any): any[] => {
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.data)) return data.data
    if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data
    return []
  }

  const fetchCertificates = async () => {
    try {
      const response = await fetch("/api/admin/certificate-templates", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })

      if (!response.ok) return
      const data = await response.json()
      setCertificates(normalizeList(data))
    } catch (error) {
      console.error("Error fetching certificates:", error)
    }
  }

  const fetchExams = async () => {
    try {
      const response = await fetch("/api/admin/exams", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })

      if (!response.ok) return
      const data = await response.json()
      setExams(normalizeList(data))
    } catch (error) {
      console.error("Error fetching exams:", error)
    }
  }

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      await Promise.all([fetchCertificates(), fetchExams()])
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

  // Stats
  const totalCertificates = certificates.length
  const pendingCertificates = certificates.filter(c => c.status === "pending").length
  const approvedCertificates = certificates.filter(c => c.status === "approved").length
  const rejectedCertificates = certificates.filter(c => c.status === "rejected").length
  const totalIssued = certificates.reduce((sum, c) => sum + c.issuedCount, 0)

  const handleAction = (action: string, certificateId: string, certificate?: CertificateTemplate) => {
    setSelectedCertificate(certificate || null)
    if (action === "view") {
      setViewMode("view")
    } else if (action === "reject") {
      setViewMode("reject")
      setRejectionReason("")
    } else if (action === "approve") {
      setApproveTarget(certificate || null)
      setApproveModalOpen(true)
      const defaultExam = exams.find(
        (exam) =>
          exam.type === "official" &&
          exam.courseId === (certificate?.courseId || ""),
      )
      setSelectedExamId(defaultExam?.id || "")
    }
    setOpenMenu(null)
  }

  const handleReject = async () => {
    if (!selectedCertificate || !rejectionReason.trim()) return
    try {
      const response = await fetch(`/api/admin/certificate-templates/${selectedCertificate.id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      if (!response.ok) {
        throw new Error("Reject failed")
      }

      await fetchCertificates()
      setViewMode(null)
      setSelectedCertificate(null)
      setRejectionReason("")
    } catch (error) {
      console.error("Reject error:", error)
      alert("Không thể từ chối chứng chỉ. Vui lòng thử lại.")
    }
  }

  const handleApprove = async () => {
    if (!approveTarget || !selectedExamId) return
    setIsApproving(true)
    try {
      const response = await fetch(`/api/admin/certificate-templates/${approveTarget.id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ examId: selectedExamId }),
      })

      if (!response.ok) {
        throw new Error("Approve failed")
      }

      await fetchCertificates()
      setApproveModalOpen(false)
      setApproveTarget(null)
      setSelectedExamId("")
    } catch (error) {
      console.error("Approve error:", error)
      alert("Không thể duyệt chứng chỉ. Vui lòng thử lại.")
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
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <CheckCircle size={14} /> Đã duyệt
          </span>
        )
      case "pending":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            <Clock size={14} /> Chờ duyệt
          </span>
        )
      case "rejected":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            <XCircle size={14} /> Từ chối
          </span>
        )
      case "draft":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
            <Clock size={14} /> Nháp
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bg_certificate3.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/10 dark:bg-black/10 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2 drop-shadow-lg">Quản lý chứng chỉ</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Xem xét, duyệt và quản lý các mẫu chứng chỉ từ giảng viên</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Tổng mẫu</p>
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
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Chờ duyệt</p>
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
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Đã duyệt</p>
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
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Từ chối</p>
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
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Đã cấp</p>
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
              placeholder="Tìm kiếm chứng chỉ, khóa học hoặc giảng viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Chờ duyệt" },
              { value: "approved", label: "Đã duyệt" },
              { value: "rejected", label: "Từ chối" },
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
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center">
              <Award size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">Đang tải chứng chỉ...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                    <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Chứng chỉ</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Khóa học</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Giảng viên</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Hiệu lực</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Đã cấp</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Trạng thái</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map((cert) => (
                    <tr
                      key={cert.id}
                      className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                            <Award size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-foreground dark:text-white font-medium line-clamp-1">{cert.title}</p>
                            <p className="text-muted-foreground dark:text-slate-400 text-xs">Tạo: {formatDate(cert.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground dark:text-slate-400 max-w-[200px] truncate">
                        {cert.course?.title || "—"}
                      </td>
                      <td className="py-4 px-6 text-foreground dark:text-white">{cert.teacher?.name || "—"}</td>
                      <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{cert.validityPeriod}</td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                          {cert.issuedCount}
                        </span>
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(cert.status)}</td>
                      <td className="py-4 px-6 relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === cert.id ? null : cert.id)}
                          className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                        >
                          <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                        </button>
                        {openMenu === cert.id && (
                          <div className="absolute right-0 top-full mt-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-lg z-10 min-w-48">
                            <button
                              onClick={() => handleAction("view", cert.id, cert)}
                              className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                            >
                              <Eye size={16} /> Xem chi tiết
                            </button>
                            {cert.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleAction("approve", cert.id, cert)}
                                  className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-green-600 dark:text-green-400"
                                >
                                  <CheckCircle size={16} /> Duyệt chứng chỉ
                                </button>
                                <button
                                  onClick={() => handleAction("reject", cert.id, cert)}
                                  className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-red-600 dark:text-red-400"
                                >
                                  <XCircle size={16} /> Từ chối
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filteredCertificates.length === 0 && (
            <div className="py-12 text-center">
              <Award size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy chứng chỉ nào</p>
            </div>
          )}
        </div>
      </div>

      {/* View Certificate Detail Modal */}
      {viewMode === "view" && selectedCertificate && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Chi tiết chứng chỉ</h2>
              <button
                onClick={() => { setViewMode(null); setSelectedCertificate(null); }}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Certificate Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground dark:text-white">{selectedCertificate.title}</h3>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mt-1">{selectedCertificate.description}</p>
                  <div className="mt-2">{getStatusBadge(selectedCertificate.status)}</div>
                </div>
              </div>

              {/* Rejection Reason if rejected */}
              {selectedCertificate.status === "rejected" && selectedCertificate.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                    <AlertCircle size={18} />
                    <span className="font-semibold">Lý do từ chối</span>
                  </div>
                  <p className="text-red-600 dark:text-red-300 text-sm">{selectedCertificate.rejectionReason}</p>
                </div>
              )}

              {/* Certificate Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                    <BookOpen size={16} />
                    <span className="text-sm">Khóa học</span>
                  </div>
                    <p className="text-foreground dark:text-white font-medium">{selectedCertificate.course?.title || "—"}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                    <User size={16} />
                    <span className="text-sm">Giảng viên</span>
                  </div>
                  <p className="text-foreground dark:text-white font-medium">{selectedCertificate.teacher?.name || "—"}</p>
                  <p className="text-muted-foreground dark:text-slate-400 text-xs">{selectedCertificate.teacher?.email || "—"}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                    <Calendar size={16} />
                    <span className="text-sm">Thời hạn hiệu lực</span>
                  </div>
                  <p className="text-foreground dark:text-white font-medium">{selectedCertificate.validityPeriod}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                    <Download size={16} />
                    <span className="text-sm">Số lượng đã cấp</span>
                  </div>
                  <p className="text-foreground dark:text-white font-medium">{selectedCertificate.issuedCount} chứng chỉ</p>
                </div>
              </div>

              {/* Actions */}
              {selectedCertificate.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-border dark:border-slate-800">
                  <button
                    onClick={() => {
                      handleAction("approve", selectedCertificate.id, selectedCertificate)
                      setViewMode(null)
                      setSelectedCertificate(null)
                    }}
                    className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                  >
                    <CheckCircle size={18} /> Duyệt chứng chỉ
                  </button>
                  <button
                    onClick={() => setViewMode("reject")}
                    className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    <XCircle size={18} /> Từ chối
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={approveModalOpen && !!approveTarget}
        onClose={() => {
          setApproveModalOpen(false)
          setApproveTarget(null)
          setSelectedExamId("")
        }}
        title="Duyệt chứng chỉ và gắn bài thi"
        size="md"
      >
        <div className="space-y-5">
          <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
            <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">Chứng chỉ</p>
            <p className="text-foreground dark:text-white font-medium">{approveTarget?.title}</p>
            <p className="text-muted-foreground dark:text-slate-400 text-xs mt-1">
              Khóa học: {approveTarget?.course?.title || "—"}
            </p>
          </div>

          <div>
            <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
              Chọn bài thi thật <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Chọn bài thi</option>
              {availableExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} • {exam.course?.title || ""}
                </option>
              ))}
            </select>
            {availableExams.length === 0 && (
              <p className="text-xs text-muted-foreground dark:text-slate-500 mt-2">
                Không có bài thi thật phù hợp cho khóa học này.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setApproveModalOpen(false)
                setApproveTarget(null)
                setSelectedExamId("")
              }}
              className="flex-1 py-3 rounded-lg font-medium border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={!selectedExamId || isApproving}
              className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle size={18} /> {isApproving ? "Đang duyệt..." : "Duyệt và lưu"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Certificate Modal */}
      {viewMode === "reject" && selectedCertificate && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-border dark:border-slate-800">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <XCircle size={24} className="text-red-500" /> Từ chối chứng chỉ
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 text-sm mt-1">
                Vui lòng nhập lý do từ chối để giảng viên biết cần cải thiện điều gì
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">Chứng chỉ</p>
                <p className="text-foreground dark:text-white font-medium">{selectedCertificate.title}</p>
                <p className="text-muted-foreground dark:text-slate-400 text-xs mt-1">Giảng viên: {selectedCertificate.teacher?.name || "—"}</p>
              </div>

              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối chứng chỉ này..."
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 h-32 resize-none"
                />
                <p className="text-xs text-muted-foreground dark:text-slate-500 mt-1">
                  Lý do này sẽ được gửi đến email của giảng viên
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setViewMode("view"); setRejectionReason(""); }}
                  className="flex-1 py-3 rounded-lg font-medium border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle size={18} /> Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

