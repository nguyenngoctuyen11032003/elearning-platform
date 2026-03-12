"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  FileText,
  Award,
  Timer,
  ClipboardList,
  AlertCircle,
  X,
  BookOpen,
  Users
} from "lucide-react"
import React from "react"

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
  certificateTemplateId?: string
  certificateTemplateName?: string
  rejectionReason?: string
  attemptCount?: number
  course?: {
    title?: string
  }
}

interface CertificateTemplate {
  id: string
  title: string
}

export default function TeacherExamsPage() {
  const router = useRouter()
  const getAuthToken = () => localStorage.getItem("auth_token") || localStorage.getItem("token") || ""
  const [exams, setExams] = useState<Exam[]>([])
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "delete" | null>(null)
  const [modalPos, setModalPos] = useState<{ top: number; left: number } | null>(null)
  const detailBtnRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({})

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
        const parseQuestions = (value: any): any[] => {
          let data = value
          while (typeof data === "string") {
            try { data = JSON.parse(data) } catch { break }
          }
          if (Array.isArray(data)) return data
          return []
        }

        const list = normalizeList<Exam>(data).map((exam) => {
          const parsedQuestions = parseQuestions((exam as any).questions)

          return {
            ...exam,
            type: String(exam.type || "practice").toLowerCase() as Exam["type"],
            courseName: exam.course?.title || exam.courseName,
            questionsCount: parsedQuestions.length || exam.questionsCount || 0,
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

  const filteredExams = exams.filter(
    (exam) =>
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" || exam.status === statusFilter) &&
      (typeFilter === "all" || exam.type === typeFilter)
  )

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

  const handleSubmitForReview = async (examId: string) => {
    try {
      const response = await authFetch(`/exams/${examId}/submit-for-approval`, {
        method: "POST",
      })

      if (response.ok) {
        setExams(exams.map(e =>
          e.id === examId ? { ...e, status: "pending" as const, rejectionReason: undefined } : e
        ))
      }
    } catch (error) {
      console.error("Error submitting exam:", error)
    }
    setOpenMenu(null)
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

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      approved: "bg-green-500/10 text-green-500 border-green-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    }
    const labels = {
      draft: "Nháp",
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Từ chối",
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

  const getTypeBadge = (type: string) => {
    const styles = {
      practice: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      official: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    }
    const labels = {
      practice: "Thi thử",
      official: "Thi thật",
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[type as keyof typeof styles]}`}>
        {type === "official" ? <Award size={12} /> : <ClipboardList size={12} />}
        {labels[type as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bg_exams.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Quản lý Bài thi</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Tạo và quản lý các bài thi cho khóa học của bạn</p>
              </div>
              <Link
                href="/teacher/exams/create"
                className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-fit backdrop-blur-sm"
              >
                <Plus size={20} /> Tạo bài thi mới
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Tổng bài thi</p>
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
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Nháp</p>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">{draftExams}</p>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <FileText size={20} className="text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Chờ duyệt</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingExams}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Hoạt động</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{approvedExams}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.65s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Bị từ chối</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{rejectedExams}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <XCircle size={20} className="text-red-600 dark:text-red-400" />
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
              placeholder="Tìm kiếm bài thi..."
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
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
          >
            <option value="all">Tất cả loại</option>
            <option value="practice">Thi thử</option>
            <option value="official">Thi thật</option>
          </select>
        </div>

        {/* Exams List */}
        <div className="grid gap-4">
          {isLoading && (
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 text-sm text-muted-foreground">
              Đang tải bài thi...
            </div>
          )}

          {!isLoading && filteredExams.map((exam) => {
            const templateName = exam.certificateTemplateName || getTemplateName(exam.certificateTemplateId)
            return (
            <div
              key={exam.id}
              data-exam-card
              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground dark:text-white text-lg">{exam.title}</h3>
                    {getTypeBadge(exam.type)}
                    {getStatusBadge(exam.status)}
                  </div>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-3">{exam.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} /> {exam.courseName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer size={14} /> {exam.timeLimit} phút
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} /> {exam.questionsCount} câu hỏi
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {exam.attemptCount} lượt thi
                    </span>
                    {exam.type === "official" && templateName && (
                      <span className="flex items-center gap-1 text-purple-500">
                        <Award size={14} /> {templateName}
                      </span>
                    )}
                  </div>

                  {exam.status === "rejected" && exam.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-500 flex items-start gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span><strong>Lý do từ chối:</strong> {exam.rejectionReason}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(exam.status === "draft" || exam.status === "rejected") && (
                    <button
                      onClick={() => handleSubmitForReview(exam.id)}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <Send size={16} />
                      Gửi duyệt
                    </button>
                  )}

                  <button
                    onClick={(e) => {
  const card = (e.currentTarget as HTMLElement).closest("[data-exam-card]")
  if (card) {
    const rect = card.getBoundingClientRect()

    setModalPos({
      top: rect.top + window.scrollY,
      left: rect.right + 16, // cách card 16px
    })
  }

  setSelectedExam(exam)
  setViewMode("view")
}}
                    className="p-2 hover:bg-secondary dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Xem chi tiết"
                  >
                    <Eye size={18} className="text-muted-foreground" />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === exam.id ? null : exam.id)}
                      className="p-2 hover:bg-secondary dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <MoreVertical size={18} className="text-muted-foreground" />
                    </button>
                    {openMenu === exam.id && (
                      <div className="fixed inset-0 z-50 flex items-end justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setOpenMenu(null)}>
                        <div className="w-full max-w-xs mx-auto mb-6 bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl shadow-lg" onClick={e => e.stopPropagation()}>
                          {exam.status !== "approved" && (
                            <button
                              onClick={() => handleEdit(exam.id)}
                              className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 rounded-t-xl"
                            >
                              <Edit2 size={16} />
                              Chỉnh sửa
                            </button>
                          )}
                          {exam.type === "official" && exam.certificateTemplateId && exam.status !== "approved" && (
                            <button
                              onClick={() => handleRemoveCertificate(exam.id)}
                              className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-amber-600"
                            >
                              <Award size={16} />
                              Bỏ chứng chỉ
                            </button>
                          )}
                          {exam.status !== "approved" && (
                            <button
                              onClick={() => handleDeleteClick(exam)}
                              className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-red-500 rounded-b-xl"
                            >
                              <Trash2 size={16} />
                              Xóa bài thi
                            </button>
                          )}
                          {exam.status === "approved" && (
                            <p className="px-4 py-3 text-sm text-muted-foreground dark:text-slate-400">
                              Không thể chỉnh sửa bài thi đã duyệt
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* INLINE DETAIL – MOBILE – NEO THEO CARD */}
              <div className="md:hidden">
{viewMode === "view" && selectedExam?.id === exam.id && (
  <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-4 animate-slideDown">

    {/* Header */}
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h4 className="font-semibold text-sm">{exam.title}</h4>
        <p className="text-xs text-muted-foreground">{exam.description}</p>
      </div>

      <button
        onClick={() => {
          setViewMode(null)
          setSelectedExam(null)
        }}
        className="text-muted-foreground"
      >
        <X size={18} />
      </button>
    </div>

    {/* Info grid */}
    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
      <div className="bg-background rounded-lg p-2">
        <p className="text-xs text-muted-foreground">Khóa học</p>
        <p className="font-medium">{exam.courseName}</p>
      </div>

      <div className="bg-background rounded-lg p-2">
        <p className="text-xs text-muted-foreground">Thời gian</p>
        <p className="font-medium">{exam.timeLimit} phút</p>
      </div>

      <div className="bg-background rounded-lg p-2">
        <p className="text-xs text-muted-foreground">Câu hỏi</p>
        <p className="font-medium">{exam.questionsCount} câu</p>
      </div>

      <div className="bg-background rounded-lg p-2">
        <p className="text-xs text-muted-foreground">Điểm đạt</p>
        <p className="font-medium">{exam.passingScore}%</p>
      </div>

      <div className="bg-background rounded-lg p-2">
        <p className="text-xs text-muted-foreground">Số lần thi</p>
        <p className="font-medium">{exam.maxAttempts} lần</p>
      </div>

      <div className="bg-background rounded-lg p-2">
        <p className="text-xs text-muted-foreground">Lượt thi</p>
        <p className="font-medium">{exam.attemptCount}</p>
      </div>
    </div>
    </div>
)}
  </div>
            </div>
          )})}

          {!isLoading && filteredExams.length === 0 && (
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-12 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">Chưa có bài thi nào</h3>
              <p className="text-muted-foreground dark:text-slate-400 mb-4">
                Bắt đầu tạo bài thi đầu tiên cho khóa học của bạn
              </p>
              <Link
                href="/teacher/exams/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus size={20} />
                Tạo bài thi mới
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
          <h2 className="text-xl font-bold">Chi tiết bài thi</h2>
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
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Loại bài thi</p>
                    <div className="mt-1">{getTypeBadge(selectedExam.type)}</div>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Trạng thái</p>
                    <div className="mt-1">{getStatusBadge(selectedExam.status)}</div>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Khóa học</p>
                    <p className="text-foreground dark:text-white font-medium">{selectedExam.courseName}</p>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Thời gian làm bài</p>
                    <p className="text-foreground dark:text-white font-medium">{selectedExam.timeLimit} phút</p>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Số câu hỏi</p>
                    <p className="text-foreground dark:text-white font-medium">{selectedExam.questionsCount} câu</p>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Điểm đạt</p>
                    <p className="text-foreground dark:text-white font-medium">{selectedExam.passingScore}%</p>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Số lần thi tối đa</p>
                    <p className="text-foreground dark:text-white font-medium">{selectedExam.maxAttempts} lần</p>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Lượt thi</p>
                    <p className="text-foreground dark:text-white font-medium">{selectedExam.attemptCount}</p>
                  </div>
                </div>

                {selectedExam.type === "official" && (selectedExam.certificateTemplateName || getTemplateName(selectedExam.certificateTemplateId)) && (
                  <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-purple-500">
                      <Award size={20} />
                      <span className="font-medium">
                        Chứng chỉ: {selectedExam.certificateTemplateName || getTemplateName(selectedExam.certificateTemplateId)}
                      </span>
                    </div>
                    <p className="text-sm text-purple-400 mt-1">
                      Học viên đạt điểm sẽ được cấp chứng chỉ này
                    </p>
                  </div>
                )}

                {selectedExam.status === "rejected" && selectedExam.rejectionReason && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                      <AlertCircle size={20} />
                      <span className="font-medium">Lý do từ chối</span>
                    </div>
                    <p className="text-red-400">{selectedExam.rejectionReason}</p>
                  </div>
                )}
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
                <h3 className="text-lg font-bold">Xác nhận xóa</h3>
              </div>
              <p className="text-muted-foreground dark:text-slate-400 mb-6">
                Bạn có chắc chắn muốn xóa bài thi "{selectedExam.title}"? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setViewMode(null)
                    setSelectedExam(null)
                  }}
                  className="px-4 py-2 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  Xóa bài thi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}