"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

interface Exam {
  id: number
  title: string
  description: string
  courseId: string
  courseName: string
  type: "practice" | "official"
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt: string
  timeLimit: number
  passingScore: number
  maxAttempts: number
  questionsCount: number
  certificateTemplateId?: string
  certificateTemplateName?: string
  rejectionReason?: string
  attemptCount: number
}

const initialExams: Exam[] = [
  {
    id: 1,
    title: "Bài thi cuối khóa Next.js",
    description: "Bài thi đánh giá kiến thức toàn diện về Next.js, App Router và Server Components",
    courseId: "1",
    courseName: "Lập trình Next.js từ cơ bản đến nâng cao",
    type: "official",
    status: "approved",
    createdAt: "2024-01-20",
    timeLimit: 90,
    passingScore: 70,
    maxAttempts: 2,
    questionsCount: 50,
    certificateTemplateId: "cert-1",
    certificateTemplateName: "Chứng chỉ Next.js Master",
    attemptCount: 245
  },
  {
    id: 2,
    title: "Bài thi thử React Hooks",
    description: "Bài thi luyện tập về React Hooks và State Management",
    courseId: "2",
    courseName: "React Hooks Advanced & State Management",
    type: "practice",
    status: "approved",
    createdAt: "2024-02-25",
    timeLimit: 60,
    passingScore: 60,
    maxAttempts: 5,
    questionsCount: 30,
    attemptCount: 189
  },
  {
    id: 3,
    title: "Bài thi TypeScript Patterns",
    description: "Bài thi thử về các pattern nâng cao trong TypeScript",
    courseId: "3",
    courseName: "Advanced TypeScript Patterns",
    type: "practice",
    status: "draft",
    createdAt: "2025-01-10",
    timeLimit: 45,
    passingScore: 50,
    maxAttempts: 10,
    questionsCount: 20,
    attemptCount: 0
  },
  {
    id: 4,
    title: "Bài thi Node.js Backend",
    description: "Bài thi chính thức cho khóa Node.js Backend Development",
    courseId: "4",
    courseName: "Node.js Backend Development",
    type: "official",
    status: "pending",
    createdAt: "2025-01-12",
    timeLimit: 120,
    passingScore: 75,
    maxAttempts: 1,
    questionsCount: 60,
    certificateTemplateId: "cert-2",
    certificateTemplateName: "Chứng chỉ Node.js Developer",
    attemptCount: 0
  },
  {
    id: 5,
    title: "Bài thi GraphQL API",
    description: "Bài thi chính thức về thiết kế API với GraphQL",
    courseId: "5",
    courseName: "GraphQL API Design",
    type: "official",
    status: "rejected",
    createdAt: "2025-01-08",
    timeLimit: 80,
    passingScore: 70,
    maxAttempts: 2,
    questionsCount: 40,
    certificateTemplateId: "cert-3",
    certificateTemplateName: "Chứng chỉ GraphQL Expert",
    attemptCount: 0,
    rejectionReason: "Câu hỏi chưa đủ chất lượng. Cần bổ sung thêm câu hỏi về mutations và subscriptions."
  },
]

export default function TeacherExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState(initialExams)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "delete" | null>(null)

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

  const handleEdit = (examId: number) => {
    router.push(`/teacher/exams/${examId}/edit`)
    setOpenMenu(null)
  }

  const handleDeleteClick = (exam: Exam) => {
    setSelectedExam(exam)
    setViewMode("delete")
    setOpenMenu(null)
  }

  const handleDeleteConfirm = () => {
    if (!selectedExam) return
    setExams(exams.filter(exam => exam.id !== selectedExam.id))
    setViewMode(null)
    setSelectedExam(null)
  }

  const handleSubmitForReview = (examId: number) => {
    setExams(exams.map(e =>
      e.id === examId ? { ...e, status: "pending" as const, rejectionReason: undefined } : e
    ))
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
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">Quản lý Bài thi</h1>
            <p className="text-muted-foreground dark:text-slate-400">Tạo và quản lý các bài thi cho khóa học của bạn</p>
          </div>
          <Link
            href="/teacher/exams/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Tạo bài thi mới
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground dark:text-white">{totalExams}</p>
                <p className="text-xs text-muted-foreground dark:text-slate-400">Tổng bài thi</p>
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <FileText size={20} className="text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground dark:text-white">{draftExams}</p>
                <p className="text-xs text-muted-foreground dark:text-slate-400">Nháp</p>
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock size={20} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground dark:text-white">{pendingExams}</p>
                <p className="text-xs text-muted-foreground dark:text-slate-400">Chờ duyệt</p>
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle size={20} className="text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground dark:text-white">{approvedExams}</p>
                <p className="text-xs text-muted-foreground dark:text-slate-400">Hoạt động</p>
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle size={20} className="text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground dark:text-white">{rejectedExams}</p>
                <p className="text-xs text-muted-foreground dark:text-slate-400">Bị từ chối</p>
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
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
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
                    {exam.type === "official" && exam.certificateTemplateName && (
                      <span className="flex items-center gap-1 text-purple-500">
                        <Award size={14} /> {exam.certificateTemplateName}
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
                    onClick={() => {
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
                      <div className="absolute right-0 mt-2 w-48 bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl shadow-lg z-10">
                        {exam.status !== "approved" && (
                          <button
                            onClick={() => handleEdit(exam.id)}
                            className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 rounded-t-xl"
                          >
                            <Edit2 size={16} />
                            Chỉnh sửa
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredExams.length === 0 && (
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
        {selectedExam && viewMode === "view" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground dark:text-white">Chi tiết bài thi</h2>
                <button
                  onClick={() => {
                    setViewMode(null)
                    setSelectedExam(null)
                  }}
                  className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg"
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

                {selectedExam.type === "official" && selectedExam.certificateTemplateName && (
                  <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-purple-500">
                      <Award size={20} />
                      <span className="font-medium">Chứng chỉ: {selectedExam.certificateTemplateName}</span>
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

