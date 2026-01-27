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
  Award,
  AlertCircle,
  X,
  BookOpen,
  Users,
  FileText
} from "lucide-react"

interface CertificateTemplate {
  id: number
  title: string
  description: string
  courseId: string
  courseName: string
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt: string
  validityPeriod: string
  templateImageUrl?: string
  rejectionReason?: string
  issuedCount: number
}

const initialTemplates: CertificateTemplate[] = [
  {
    id: 1,
    title: "Chứng chỉ Next.js Master",
    description: "Chứng nhận học viên đã hoàn thành và đạt yêu cầu khóa học Next.js",
    courseId: "1",
    courseName: "Lập trình Next.js từ cơ bản đến nâng cao",
    status: "approved",
    createdAt: "2024-01-20",
    validityPeriod: "Vĩnh viễn",
    templateImageUrl: "/placeholder.jpg",
    issuedCount: 245
  },
  {
    id: 2,
    title: "Chứng chỉ React Expert",
    description: "Chứng nhận thành thạo React Hooks và State Management",
    courseId: "2",
    courseName: "React Hooks Advanced & State Management",
    status: "approved",
    createdAt: "2024-02-25",
    validityPeriod: "2 năm",
    templateImageUrl: "/placeholder.jpg",
    issuedCount: 189
  },
  {
    id: 3,
    title: "Chứng chỉ TypeScript Advanced",
    description: "Chứng nhận kiến thức nâng cao về TypeScript",
    courseId: "3",
    courseName: "Advanced TypeScript Patterns",
    status: "pending",
    createdAt: "2025-01-10",
    validityPeriod: "Vĩnh viễn",
    templateImageUrl: "/placeholder.jpg",
    issuedCount: 0
  },
  {
    id: 4,
    title: "Chứng chỉ Node.js Developer",
    description: "Chứng nhận kỹ năng phát triển Backend với Node.js",
    courseId: "4",
    courseName: "Node.js Backend Development",
    status: "rejected",
    createdAt: "2025-01-08",
    validityPeriod: "3 năm",
    templateImageUrl: "/placeholder.jpg",
    issuedCount: 0,
    rejectionReason: "Mẫu chứng chỉ chưa đạt tiêu chuẩn. Cần bổ sung logo và watermark bảo mật."
  },
]

export default function TeacherCertificatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "delete" | null>(null)

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

  const handleEdit = (templateId: number) => {
    router.push(`/teacher/certificates/${templateId}/edit`)
    setOpenMenu(null)
  }

  const handleDeleteClick = (template: CertificateTemplate) => {
    setSelectedTemplate(template)
    setViewMode("delete")
    setOpenMenu(null)
  }

  const handleDeleteConfirm = () => {
    if (!selectedTemplate) return
    setTemplates(templates.filter(t => t.id !== selectedTemplate.id))
    setViewMode(null)
    setSelectedTemplate(null)
  }

  const handleSubmitForReview = (templateId: number) => {
    setTemplates(templates.map(t =>
      t.id === templateId ? { ...t, status: "pending" as const, rejectionReason: undefined } : t
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

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bg_certificate.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/10 dark:bg-black/10 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2 drop-shadow-lg">Quản lý Chứng chỉ</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Tạo và quản lý mẫu chứng chỉ cho khóa học</p>
              </div>
              <Link
                href="/teacher/certificates/create"
                className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-fit backdrop-blur-sm"
              >
                <Plus size={20} /> Tạo mẫu chứng chỉ
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Tổng mẫu</p>
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
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Chờ duyệt</p>
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
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Hoạt động</p>
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
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Đã cấp</p>
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
              placeholder="Tìm kiếm mẫu chứng chỉ..."
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
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-visible hover:shadow-lg transition-shadow"
            >
              {/* Certificate Preview */}
              <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Award size={48} className="text-primary/40" />
                <div className="absolute top-3 right-3">
                  {getStatusBadge(template.status)}
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-foreground dark:text-white text-lg mb-2">{template.title}</h3>
                <p className="text-muted-foreground dark:text-slate-400 text-sm mb-3 line-clamp-2">{template.description}</p>

                <div className="space-y-2 text-sm text-muted-foreground dark:text-slate-400">
                  <p className="flex items-center gap-2">
                    <BookOpen size={14} /> {template.courseName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock size={14} /> Hiệu lực: {template.validityPeriod}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users size={14} /> Đã cấp: {template.issuedCount} chứng chỉ
                  </p>
                </div>

                {template.status === "rejected" && template.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-500 flex items-start gap-2">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{template.rejectionReason}</span>
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border dark:border-slate-700">
                  {(template.status === "draft" || template.status === "rejected") && (
                    <button
                      onClick={() => handleSubmitForReview(template.id)}
                      className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send size={14} />
                      Gửi duyệt
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedTemplate(template)
                      setViewMode("view")
                    }}
                    className="p-2 hover:bg-secondary dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Xem chi tiết"
                  >
                    <Eye size={18} className="text-muted-foreground" />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === template.id ? null : template.id)}
                      className="p-2 hover:bg-secondary dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <MoreVertical size={18} className="text-muted-foreground" />
                    </button>
                    {openMenu === template.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl shadow-lg z-50">
                        {template.status !== "approved" && (
                          <button
                            onClick={() => handleEdit(template.id)}
                            className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 rounded-t-xl"
                          >
                            <Edit2 size={16} />
                            Chỉnh sửa
                          </button>
                        )}
                        {template.status !== "approved" && (
                          <button
                            onClick={() => handleDeleteClick(template)}
                            className="w-full px-4 py-3 text-left hover:bg-secondary dark:hover:bg-slate-700 flex items-center gap-2 text-red-500 rounded-b-xl"
                          >
                            <Trash2 size={16} />
                            Xóa
                          </button>
                        )}
                        {template.status === "approved" && (
                          <p className="px-4 py-3 text-sm text-muted-foreground dark:text-slate-400">
                            Không thể chỉnh sửa mẫu đã duyệt
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-12 text-center">
              <Award size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">Chưa có mẫu chứng chỉ nào</h3>
              <p className="text-muted-foreground dark:text-slate-400 mb-4">
                Bắt đầu tạo mẫu chứng chỉ đầu tiên cho khóa học của bạn
              </p>
              <Link
                href="/teacher/certificates/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus size={20} />
                Tạo mẫu chứng chỉ
              </Link>
            </div>
          )}
        </div>

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

