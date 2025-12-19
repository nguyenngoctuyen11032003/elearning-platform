"use client"

import { useState } from "react"
import { Edit, Trash2, Eye, Search, MoreVertical, CheckCircle, Clock, XCircle, BookOpen, Users, DollarSign, Star, X, AlertCircle } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/admin-modals"
import { formatStudentCount, formatPrice } from "@/lib/format"

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  instructorEmail: string
  students: number
  revenue: number
  price: number
  status: "pending" | "approved" | "rejected" | "published"
  createdAt: string
  category: string
  thumbnail: string
  lessons: number
  duration: string
  rating: number
  reviewCount: number
  rejectionReason?: string
}

const initialCourses: Course[] = [
  {
    id: "1",
    title: "Lập trình Next.js từ cơ bản đến nâng cao",
    description: "Khóa học toàn diện về Next.js, App Router, Server Components và deployment",
    instructor: "Nguyễn Ngọc Tuyền",
    instructorEmail: "tuyen@example.com",
    students: 1250,
    revenue: 624500000,
    price: 499000,
    status: "published",
    createdAt: "2024-01-15",
    category: "Lập trình",
    thumbnail: "/placeholder.jpg",
    lessons: 45,
    duration: "40 giờ",
    rating: 4.8,
    reviewCount: 320
  },
  {
    id: "2",
    title: "React Hooks Advanced & State Management",
    description: "Học sâu về React Hooks, Context API, Redux và các patterns nâng cao",
    instructor: "Trần Minh Tuấn",
    instructorEmail: "tuan@example.com",
    students: 890,
    revenue: 445000000,
    price: 399000,
    status: "published",
    createdAt: "2024-02-20",
    category: "Lập trình",
    thumbnail: "/placeholder.jpg",
    lessons: 35,
    duration: "30 giờ",
    rating: 4.7,
    reviewCount: 245
  },
  {
    id: "3",
    title: "AI & Machine Learning cho người mới bắt đầu",
    description: "Nhập môn trí tuệ nhân tạo với Python, TensorFlow và các dự án thực tế",
    instructor: "Phạm Thị Hương",
    instructorEmail: "huong@example.com",
    students: 0,
    revenue: 0,
    price: 599000,
    status: "pending",
    createdAt: "2024-03-10",
    category: "AI & Data",
    thumbnail: "/placeholder.jpg",
    lessons: 50,
    duration: "45 giờ",
    rating: 0,
    reviewCount: 0
  },
  {
    id: "4",
    title: "UI/UX Design Masterclass với Figma",
    description: "Từ wireframe đến prototype chuyên nghiệp với Figma và design systems",
    instructor: "Lê Thị Hương",
    instructorEmail: "huongle@example.com",
    students: 1567,
    revenue: 783500000,
    price: 449000,
    status: "published",
    createdAt: "2024-01-05",
    category: "Thiết kế",
    thumbnail: "/placeholder.jpg",
    lessons: 60,
    duration: "50 giờ",
    rating: 4.9,
    reviewCount: 456
  },
  {
    id: "5",
    title: "Python cho Data Science",
    description: "Phân tích dữ liệu với Python, Pandas, NumPy và visualization",
    instructor: "Trần Văn Đức",
    instructorEmail: "duc@example.com",
    students: 0,
    revenue: 0,
    price: 549000,
    status: "rejected",
    createdAt: "2024-03-15",
    category: "AI & Data",
    thumbnail: "/placeholder.jpg",
    lessons: 40,
    duration: "35 giờ",
    rating: 0,
    reviewCount: 0,
    rejectionReason: "Nội dung khóa học chưa đầy đủ, cần bổ sung thêm các bài tập thực hành và dự án cuối khóa."
  },
]

export default function AdminCoursesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [courses, setCourses] = useState(initialCourses)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "edit" | "reject" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    action: string
    courseId?: string
  }>({ isOpen: false, action: "" })

  const filteredCourses = courses.filter(
    (course) =>
      (course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || course.status === statusFilter),
  )

  // Stats
  const totalCourses = courses.length
  const pendingCourses = courses.filter(c => c.status === "pending").length
  const publishedCourses = courses.filter(c => c.status === "published" || c.status === "approved").length
  const rejectedCourses = courses.filter(c => c.status === "rejected").length

  const handleCourseAction = (action: string, courseId: string, course?: Course) => {
    setSelectedCourse(course || null)
    if (action === "view") {
      setViewMode("view")
    } else if (action === "edit") {
      setViewMode("edit")
    } else if (action === "reject") {
      setViewMode("reject")
      setRejectionReason("")
    } else {
      setConfirmDialog({ isOpen: true, action, courseId })
    }
    setOpenMenu(null)
  }

  const executeCourseAction = () => {
    const { action, courseId } = confirmDialog
    if (action === "approve") {
      setCourses(courses.map((c) => (c.id === courseId ? { ...c, status: "published" as const } : c)))
    } else if (action === "delete") {
      setCourses(courses.filter((c) => c.id !== courseId))
    }
    setConfirmDialog({ isOpen: false, action: "" })
  }

  const handleReject = () => {
    if (!selectedCourse || !rejectionReason.trim()) return
    setCourses(courses.map(c =>
      c.id === selectedCourse.id
        ? { ...c, status: "rejected" as const, rejectionReason: rejectionReason }
        : c
    ))
    setViewMode(null)
    setSelectedCourse(null)
    setRejectionReason("")
  }

  const handleSaveEdit = () => {
    if (!selectedCourse) return
    setCourses(courses.map(c => c.id === selectedCourse.id ? selectedCourse : c))
    setViewMode(null)
    setSelectedCourse(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
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
      default:
        return null
    }
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Quản lý khóa học</h1>
          <p className="text-muted-foreground dark:text-slate-400">Xem xét, duyệt và quản lý các khóa học từ giảng viên</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng khóa học</p>
                <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalCourses}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingCourses}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{publishedCourses}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Từ chối</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{rejectedCourses}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <XCircle size={20} className="text-red-600 dark:text-red-400" />
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
              placeholder="Tìm kiếm khóa học hoặc giảng viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Chờ duyệt" },
              { value: "published", label: "Đã duyệt" },
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

        {/* Courses Table */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Khóa học</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Giảng viên</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Danh mục</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Giá</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Học viên</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Trạng thái</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Ngày tạo</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-12 h-12 rounded-lg object-cover bg-secondary"
                        />
                        <div>
                          <p className="text-foreground dark:text-white font-medium line-clamp-1">{course.title}</p>
                          <p className="text-muted-foreground dark:text-slate-400 text-xs">{course.lessons} bài học • {course.duration}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{course.instructor}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-secondary dark:bg-slate-800 rounded text-foreground dark:text-white text-xs">
                        {course.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white font-medium">
                      ₫{formatPrice(course.price)}
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white">{formatStudentCount(course.students)}</td>
                    <td className="py-4 px-6">{getStatusBadge(course.status)}</td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{formatDate(course.createdAt)}</td>
                    <td className="py-4 px-6 relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === course.id ? null : course.id)}
                        className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                      >
                        <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                      </button>
                      {openMenu === course.id && (
                        <div className="absolute right-0 top-full mt-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-lg z-10 min-w-48">
                          <button
                            onClick={() => handleCourseAction("view", course.id, course)}
                            className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                          >
                            <Eye size={16} /> Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleCourseAction("edit", course.id, course)}
                            className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                          >
                            <Edit size={16} /> Chỉnh sửa
                          </button>
                          {course.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleCourseAction("approve", course.id, course)}
                                className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-green-600 dark:text-green-400"
                              >
                                <CheckCircle size={16} /> Duyệt khóa học
                              </button>
                              <button
                                onClick={() => handleCourseAction("reject", course.id, course)}
                                className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-red-600 dark:text-red-400"
                              >
                                <XCircle size={16} /> Từ chối
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleCourseAction("delete", course.id, course)}
                            className="w-full text-left px-4 py-2 hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 text-destructive"
                          >
                            <Trash2 size={16} /> Xóa khóa học
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="py-12 text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy khóa học nào</p>
            </div>
          )}
        </div>
      </div>

      {/* View Course Detail Modal */}
      {viewMode === "view" && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Chi tiết khóa học</h2>
              <button
                onClick={() => { setViewMode(null); setSelectedCourse(null); }}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Course Header */}
              <div className="flex gap-4">
                <img
                  src={selectedCourse.thumbnail}
                  alt={selectedCourse.title}
                  className="w-32 h-24 rounded-lg object-cover bg-secondary"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground dark:text-white">{selectedCourse.title}</h3>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mt-1">{selectedCourse.description}</p>
                  <div className="mt-2">{getStatusBadge(selectedCourse.status)}</div>
                </div>
              </div>

              {/* Rejection Reason if rejected */}
              {selectedCourse.status === "rejected" && selectedCourse.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                    <AlertCircle size={18} />
                    <span className="font-semibold">Lý do từ chối</span>
                  </div>
                  <p className="text-red-600 dark:text-red-300 text-sm">{selectedCourse.rejectionReason}</p>
                </div>
              )}

              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4 text-center">
                  <Users size={24} className="mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <p className="text-2xl font-bold text-foreground dark:text-white">{selectedCourse.students}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">Học viên</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4 text-center">
                  <BookOpen size={24} className="mx-auto mb-2 text-green-600 dark:text-green-400" />
                  <p className="text-2xl font-bold text-foreground dark:text-white">{selectedCourse.lessons}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">Bài học</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4 text-center">
                  <Star size={24} className="mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold text-foreground dark:text-white">{selectedCourse.rating || "N/A"}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{selectedCourse.reviewCount} đánh giá</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4 text-center">
                  <DollarSign size={24} className="mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                  <p className="text-2xl font-bold text-foreground dark:text-white">₫{(selectedCourse.revenue / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">Doanh thu</p>
                </div>
              </div>

              {/* Course Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">Giảng viên</p>
                  <p className="text-foreground dark:text-white font-medium">{selectedCourse.instructor}</p>
                  <p className="text-muted-foreground dark:text-slate-400 text-xs">{selectedCourse.instructorEmail}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">Danh mục</p>
                  <p className="text-foreground dark:text-white font-medium">{selectedCourse.category}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">Giá</p>
                  <p className="text-foreground dark:text-white font-medium">₫{formatPrice(selectedCourse.price)}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">Thời lượng</p>
                  <p className="text-foreground dark:text-white font-medium">{selectedCourse.duration}</p>
                </div>
              </div>

              {/* Actions */}
              {selectedCourse.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-border dark:border-slate-800">
                  <button
                    onClick={() => {
                      handleCourseAction("approve", selectedCourse.id, selectedCourse)
                      setViewMode(null)
                      setSelectedCourse(null)
                    }}
                    className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                  >
                    <CheckCircle size={18} /> Duyệt khóa học
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

      {/* Edit Course Modal */}
      {viewMode === "edit" && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Chỉnh sửa khóa học</h2>
              <button
                onClick={() => { setViewMode(null); setSelectedCourse(null); }}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Tên khóa học</label>
                <input
                  type="text"
                  value={selectedCourse.title}
                  onChange={(e) => setSelectedCourse({ ...selectedCourse, title: e.target.value })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Mô tả</label>
                <textarea
                  value={selectedCourse.description}
                  onChange={(e) => setSelectedCourse({ ...selectedCourse, description: e.target.value })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Danh mục</label>
                  <select
                    value={selectedCourse.category}
                    onChange={(e) => setSelectedCourse({ ...selectedCourse, category: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Lập trình">Lập trình</option>
                    <option value="Thiết kế">Thiết kế</option>
                    <option value="AI & Data">AI & Data</option>
                    <option value="Kinh doanh">Kinh doanh</option>
                    <option value="Ngoại ngữ">Ngoại ngữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Giá (VND)</label>
                  <input
                    type="number"
                    value={selectedCourse.price}
                    onChange={(e) => setSelectedCourse({ ...selectedCourse, price: Number(e.target.value) })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Trạng thái</label>
                <select
                  value={selectedCourse.status}
                  onChange={(e) => setSelectedCourse({ ...selectedCourse, status: e.target.value as Course["status"] })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="pending">Chờ duyệt</option>
                  <option value="published">Đã duyệt</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>

              <button
                onClick={handleSaveEdit}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium hover:shadow-lg transition-smooth flex items-center justify-center gap-2"
              >
                <Edit size={18} /> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Course Modal */}
      {viewMode === "reject" && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-border dark:border-slate-800">
              <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                <XCircle size={24} className="text-red-500" /> Từ chối khóa học
              </h2>
              <p className="text-muted-foreground dark:text-slate-400 text-sm mt-1">
                Vui lòng nhập lý do từ chối để giảng viên biết cần cải thiện điều gì
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">Khóa học</p>
                <p className="text-foreground dark:text-white font-medium">{selectedCourse.title}</p>
                <p className="text-muted-foreground dark:text-slate-400 text-xs mt-1">Giảng viên: {selectedCourse.instructor}</p>
              </div>

              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối khóa học này..."
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: "" })}
        onConfirm={executeCourseAction}
        title={confirmDialog.action === "approve" ? "Duyệt khóa học" : "Xóa khóa học"}
        message={
          confirmDialog.action === "approve"
            ? `Bạn có chắc chắn muốn duyệt khóa học "${selectedCourse?.title}" không? Khóa học sẽ được công khai và học viên có thể đăng ký.`
            : `Bạn có chắc chắn muốn xóa khóa học "${selectedCourse?.title}" không? Hành động này không thể hoàn tác.`
        }
        isDangerous={confirmDialog.action === "delete"}
      />
    </main>
  )
}

