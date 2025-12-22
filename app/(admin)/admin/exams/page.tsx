"use client"

import { useState } from "react"
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
  BookOpen
} from "lucide-react"

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
  rejectionReason?: string
  attemptCount: number
}

const initialExams: Exam[] = [
  {
    id: "1",
    title: "Bài thi cuối khóa Next.js",
    description: "Bài thi đánh giá kiến thức toàn diện về Next.js, App Router và Server Components",
    course: "Lập trình Next.js từ cơ bản đến nâng cao",
    courseId: "COURSE001",
    teacher: "Nguyễn Ngọc Tuyền",
    teacherEmail: "tuyen@example.com",
    type: "official",
    status: "approved",
    createdAt: "2024-01-20",
    timeLimit: 90,
    passingScore: 70,
    maxAttempts: 2,
    questionsCount: 50,
    certificateTemplate: "Chứng chỉ Next.js Master",
    attemptCount: 245
  },
  {
    id: "2",
    title: "Bài thi thử React Hooks",
    description: "Bài thi luyện tập về React Hooks và State Management",
    course: "React Hooks Advanced & State Management",
    courseId: "COURSE002",
    teacher: "Trần Minh Tuấn",
    teacherEmail: "tuan@example.com",
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
    id: "3",
    title: "Bài thi AI & Machine Learning",
    description: "Đánh giá kiến thức nền tảng về AI và Machine Learning",
    course: "AI & Machine Learning cho người mới bắt đầu",
    courseId: "COURSE003",
    teacher: "Phạm Thị Hương",
    teacherEmail: "huong@example.com",
    type: "official",
    status: "pending",
    createdAt: "2024-03-12",
    timeLimit: 120,
    passingScore: 75,
    maxAttempts: 1,
    questionsCount: 60,
    certificateTemplate: "Chứng chỉ AI Cơ bản",
    attemptCount: 0
  },
  {
    id: "4",
    title: "Bài thi thử UI/UX Design",
    description: "Luyện tập các kiến thức về thiết kế UI/UX với Figma",
    course: "UI/UX Design Masterclass với Figma",
    courseId: "COURSE004",
    teacher: "Lê Thị Hương",
    teacherEmail: "huongle@example.com",
    type: "practice",
    status: "approved",
    createdAt: "2024-01-10",
    timeLimit: 45,
    passingScore: 50,
    maxAttempts: 10,
    questionsCount: 25,
    attemptCount: 312
  },
  {
    id: "5",
    title: "Bài thi Python Data Science",
    description: "Đánh giá kỹ năng phân tích dữ liệu với Python",
    course: "Python cho Data Science",
    courseId: "COURSE005",
    teacher: "Trần Văn Đức",
    teacherEmail: "duc@example.com",
    type: "official",
    status: "rejected",
    createdAt: "2024-03-18",
    timeLimit: 100,
    passingScore: 70,
    maxAttempts: 2,
    questionsCount: 45,
    certificateTemplate: "Chứng chỉ Data Analyst",
    attemptCount: 0,
    rejectionReason: "Câu hỏi chưa đủ chất lượng, cần bổ sung thêm câu hỏi về pandas và visualization."
  },
]

export default function AdminExamsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [exams, setExams] = useState(initialExams)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    action: string
    examId?: string
  }>({ isOpen: false, action: "" })

  const filteredExams = exams.filter(
    (exam) =>
      (exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.course.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || exam.status === statusFilter) &&
      (typeFilter === "all" || exam.type === typeFilter)
  )

  // Stats
  const totalExams = exams.length
  const pendingExams = exams.filter(e => e.status === "pending").length
  const approvedExams = exams.filter(e => e.status === "approved").length
  const rejectedExams = exams.filter(e => e.status === "rejected").length
  const practiceExams = exams.filter(e => e.type === "practice").length
  const officialExams = exams.filter(e => e.type === "official").length

  const handleApprove = (examId: string) => {
    setExams(exams.map(exam =>
      exam.id === examId ? { ...exam, status: "approved" as const, rejectionReason: undefined } : exam
    ))
    setOpenMenu(null)
  }

  const handleReject = () => {
    if (!selectedExam || !rejectionReason.trim()) return
    setExams(exams.map(exam =>
      exam.id === selectedExam.id
        ? { ...exam, status: "rejected" as const, rejectionReason }
        : exam
    ))
    setViewMode(null)
    setSelectedExam(null)
    setRejectionReason("")
  }

  const handleDelete = (examId: string) => {
    setExams(exams.filter(exam => exam.id !== examId))
    setConfirmDialog({ isOpen: false, action: "" })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      approved: "bg-green-500/10 text-green-500 border-green-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
      draft: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    }
    const labels = {
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Từ chối",
      draft: "Nháp",
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
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">Quản lý Bài thi</h1>
          <p className="text-muted-foreground dark:text-slate-400">Duyệt và quản lý các bài thi từ giáo viên</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                <p className="text-xs text-muted-foreground dark:text-slate-400">Đã duyệt</p>
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
                <p className="text-xs text-muted-foreground dark:text-slate-400">Từ chối</p>
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ClipboardList size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground dark:text-white">{practiceExams}</p>
                <p className="text-xs text-muted-foreground dark:text-slate-400">Thi thử</p>
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Award size={20} className="text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground dark:text-white">{officialExams}</p>
                <p className="text-xs text-muted-foreground dark:text-slate-400">Thi thật</p>
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
              placeholder="Tìm kiếm bài thi, giáo viên, khóa học..."
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
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
            <option value="draft">Nháp</option>
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

        {/* Exams Table */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground dark:text-white">Bài thi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground dark:text-white">Loại</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground dark:text-white">Giáo viên</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground dark:text-white">Cài đặt</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground dark:text-white">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground dark:text-white">Lượt thi</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground dark:text-white">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-slate-800">
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-secondary/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground dark:text-white">{exam.title}</p>
                        <p className="text-sm text-muted-foreground dark:text-slate-400 flex items-center gap-1 mt-1">
                          <BookOpen size={14} /> {exam.course}
                        </p>
                        {exam.type === "official" && exam.certificateTemplate && (
                          <p className="text-xs text-purple-500 flex items-center gap-1 mt-1">
                            <Award size={12} /> {exam.certificateTemplate}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(exam.type)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground dark:text-white">{exam.teacher}</p>
                        <p className="text-sm text-muted-foreground dark:text-slate-400">{exam.teacherEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground dark:text-slate-400">
                          <Timer size={14} className="inline mr-1" /> {exam.timeLimit} phút
                        </p>
                        <p className="text-muted-foreground dark:text-slate-400">
                          {exam.questionsCount} câu hỏi • {exam.passingScore}% đạt
                        </p>
                        <p className="text-muted-foreground dark:text-slate-400">
                          Tối đa {exam.maxAttempts} lần thi
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(exam.status)}
                      {exam.status === "rejected" && exam.rejectionReason && (
                        <button
                          onClick={() => {
                            setSelectedExam(exam)
                            setViewMode("view")
                          }}
                          className="block mt-1 text-xs text-red-500 hover:underline"
                        >
                          Xem lý do
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-foreground dark:text-white font-medium">
                        {exam.attemptCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
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
                              {exam.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleApprove(exam.id)}
                                    className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-green-500"
                                  >
                                    <CheckCircle size={16} />
                                    Duyệt bài thi
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedExam(exam)
                                      setViewMode("reject")
                                      setOpenMenu(null)
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-red-500"
                                  >
                                    <XCircle size={16} />
                                    Từ chối
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setConfirmDialog({ isOpen: true, action: "delete", examId: exam.id })
                                  setOpenMenu(null)
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-red-500"
                              >
                                <XCircle size={16} />
                                Xóa bài thi
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredExams.length === 0 && (
            <div className="p-12 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
              <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy bài thi nào</p>
            </div>
          )}
        </div>

        {/* View/Reject Modal */}
        {selectedExam && viewMode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground dark:text-white">
                  {viewMode === "reject" ? "Từ chối bài thi" : "Chi tiết bài thi"}
                </h2>
                <button
                  onClick={() => {
                    setViewMode(null)
                    setSelectedExam(null)
                    setRejectionReason("")
                  }}
                  className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {viewMode === "view" && (
                  <>
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
                        <p className="text-foreground dark:text-white font-medium">{selectedExam.course}</p>
                      </div>
                      <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                        <p className="text-sm text-muted-foreground dark:text-slate-400">Giáo viên</p>
                        <p className="text-foreground dark:text-white font-medium">{selectedExam.teacher}</p>
                      </div>
                      <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                        <p className="text-sm text-muted-foreground dark:text-slate-400">Thời gian</p>
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
                    </div>

                    {selectedExam.type === "official" && selectedExam.certificateTemplate && (
                      <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-purple-500">
                          <Award size={20} />
                          <span className="font-medium">Chứng chỉ: {selectedExam.certificateTemplate}</span>
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
                  </>
                )}

                {viewMode === "reject" && (
                  <>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-yellow-500 mb-2">
                        <AlertCircle size={20} />
                        <span className="font-medium">Bạn đang từ chối bài thi</span>
                      </div>
                      <p className="text-yellow-400 text-sm">
                        "{selectedExam.title}" của giáo viên {selectedExam.teacher}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                        Lý do từ chối <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Nhập lý do từ chối bài thi..."
                      />
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          setViewMode(null)
                          setSelectedExam(null)
                          setRejectionReason("")
                        }}
                        className="px-4 py-2 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={!rejectionReason.trim()}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Xác nhận từ chối
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
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <AlertCircle size={24} />
                <h3 className="text-lg font-bold">Xác nhận xóa</h3>
              </div>
              <p className="text-muted-foreground dark:text-slate-400 mb-6">
                Bạn có chắc chắn muốn xóa bài thi này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDialog({ isOpen: false, action: "" })}
                  className="px-4 py-2 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDelete(confirmDialog.examId!)}
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

