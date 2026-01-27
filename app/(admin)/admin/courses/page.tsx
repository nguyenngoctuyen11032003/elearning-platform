"use client"

import { useState } from "react"
import { Edit, Trash2, Eye, Search, MoreVertical, CheckCircle, Clock, XCircle, BookOpen, Users, DollarSign, Star, X, AlertCircle, BarChart3 } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/admin-modals"
import { formatStudentCount, formatPrice } from "@/lib/format"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bg_mycourses.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/10 dark:bg-black/10 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2 drop-shadow-lg">Quản lý khóa học</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Xem xét, duyệt và quản lý các khóa học từ giảng viên</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Tổng khóa học</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalCourses}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Chờ duyệt</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingCourses}</p>
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
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{publishedCourses}</p>
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
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{rejectedCourses}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <XCircle size={20} className="text-red-600 dark:text-red-400" />
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
        <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-border dark:border-slate-800 rounded-2xl overflow-hidden animate-slideUp" style={{ animationDelay: "0.2s" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-white/50 dark:bg-slate-800/50">
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
                    className="border-b border-border dark:border-slate-800 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300"
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCourseAction("view", course.id, course)}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary dark:text-accent rounded-lg transition-colors text-sm font-medium"
                        >
                          Xem trước
                        </button>
                        <button
                          onClick={() => setOpenMenu(openMenu === course.id ? null : course.id)}
                          className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                        >
                          <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                        </button>
                      </div>
                      {openMenu === course.id && (
                        <div className="absolute right-0 top-full mt-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-lg z-10 min-w-52">
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="w-full text-left px-4 py-3 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white rounded-t-lg"
                            onClick={() => setOpenMenu(null)}
                          >
                            <Eye size={16} /> <span className="font-medium">Chi tiết đầy đủ</span>
                          </Link>
                          <button
                            onClick={() => handleCourseAction("edit", course.id, course)}
                            className="w-full text-left px-4 py-3 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white border-t border-border dark:border-slate-800"
                          >
                            <Edit size={16} /> <span className="font-medium">Chỉnh sửa</span>
                          </button>
                          {course.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleCourseAction("approve", course.id, course)}
                                className="w-full text-left px-4 py-3 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-green-600 dark:text-green-400 border-t border-border dark:border-slate-800"
                              >
                                <CheckCircle size={16} /> <span className="font-medium">Duyệt khóa học</span>
                              </button>
                              <button
                                onClick={() => handleCourseAction("reject", course.id, course)}
                                className="w-full text-left px-4 py-3 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-yellow-600 dark:text-yellow-400 border-t border-border dark:border-slate-800"
                              >
                                <XCircle size={16} /> <span className="font-medium">Từ chối</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleCourseAction("delete", course.id, course)}
                            className="w-full text-left px-4 py-3 hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 text-destructive border-t border-border dark:border-slate-800 rounded-b-lg"
                          >
                            <Trash2 size={16} /> <span className="font-medium">Xóa khóa học</span>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <BookOpen className="text-white" size={20} />
                </div>
                <h2 className="text-xl font-bold text-foreground dark:text-white">Xem trước khóa học</h2>
              </div>
              <button
                onClick={() => { setViewMode(null); setSelectedCourse(null); }}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Course Header */}
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 p-6 rounded-xl border border-border dark:border-slate-800">
                <div className="flex gap-6">
                  <img
                    src={selectedCourse.thumbnail}
                    alt={selectedCourse.title}
                    className="w-48 h-32 rounded-xl object-cover bg-secondary shadow-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground dark:text-white mb-2">{selectedCourse.title}</h3>
                        <p className="text-muted-foreground dark:text-slate-400 leading-relaxed">{selectedCourse.description}</p>
                      </div>
                      {getStatusBadge(selectedCourse.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm pt-3 border-t border-border dark:border-slate-700">
                      <span className="px-3 py-1 bg-secondary dark:bg-slate-800 rounded-lg font-medium text-foreground dark:text-white">
                        {selectedCourse.category}
                      </span>
                      <span className="text-muted-foreground dark:text-slate-400">
                        {selectedCourse.lessons} bài học • {selectedCourse.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection Reason if rejected */}
              {selectedCourse.status === "rejected" && selectedCourse.rejectionReason && (
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-red-600 dark:text-red-400 mb-2">Lý do từ chối</h5>
                      <p className="text-red-500 dark:text-red-300 leading-relaxed">{selectedCourse.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Course Performance */}
              <div>
                <h4 className="text-lg font-semibold text-foreground dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-primary dark:text-accent" />
                  Hiệu quả khóa học
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl">
                    <Users size={24} className="text-blue-500 mb-3" />
                    <p className="text-3xl font-bold text-foreground dark:text-white">{formatStudentCount(selectedCourse.students)}</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Học viên</p>
                  </div>
                  <div className="bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 p-5 rounded-xl">
                    <BookOpen size={24} className="text-green-500 mb-3" />
                    <p className="text-3xl font-bold text-foreground dark:text-white">{selectedCourse.lessons}</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Bài học</p>
                  </div>
                  <div className="bg-yellow-500/5 dark:bg-yellow-500/10 border border-yellow-500/20 p-5 rounded-xl">
                    <Star size={24} className="text-yellow-500 mb-3" />
                    <p className="text-3xl font-bold text-foreground dark:text-white">{selectedCourse.rating || "N/A"}</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">{selectedCourse.reviewCount} đánh giá</p>
                  </div>
                  <div className="bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 p-5 rounded-xl">
                    <DollarSign size={24} className="text-purple-500 mb-3" />
                    <p className="text-3xl font-bold text-foreground dark:text-white">₫{(selectedCourse.revenue / 1000000).toFixed(1)}M</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Doanh thu</p>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div>
                <h4 className="text-lg font-semibold text-foreground dark:text-white mb-4">Thông tin chi tiết</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-secondary/50 dark:bg-slate-800/50 rounded-xl p-4 border border-border dark:border-slate-700">
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2 flex items-center gap-2">
                      <Users size={16} />
                      Giảng viên
                    </p>
                    <p className="text-foreground dark:text-white font-semibold">{selectedCourse.instructor}</p>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{selectedCourse.instructorEmail}</p>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 rounded-xl p-4 border border-border dark:border-slate-700">
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2 flex items-center gap-2">
                      <DollarSign size={16} />
                      Giá khóa học
                    </p>
                    <p className="text-foreground dark:text-white font-semibold text-xl">₫{formatPrice(selectedCourse.price)}</p>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 rounded-xl p-4 border border-border dark:border-slate-700">
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2 flex items-center gap-2">
                      <Clock size={16} />
                      Thời lượng
                    </p>
                    <p className="text-foreground dark:text-white font-semibold">{selectedCourse.duration}</p>
                  </div>
                  <div className="bg-secondary/50 dark:bg-slate-800/50 rounded-xl p-4 border border-border dark:border-slate-700">
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2">Ngày tạo</p>
                    <p className="text-foreground dark:text-white font-semibold">{formatDate(selectedCourse.createdAt)}</p>
                  </div>
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle size={20} />
                    Duyệt khóa học
                  </button>
                  <button
                    onClick={() => setViewMode("reject")}
                    className="flex-1 px-6 py-3 bg-secondary hover:bg-secondary/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground dark:text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-border dark:border-slate-700"
                  >
                    <XCircle size={20} />
                    Từ chối
                  </button>
                </div>
              )}

              {/* View Full Details Link */}
              <Link
                href={`/admin/courses/${selectedCourse.id}`}
                className="block w-full text-center px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary dark:text-accent rounded-xl font-medium transition-all"
              >
                Xem chi tiết đầy đủ (nội dung, bài học) →
              </Link>
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
    </div>
  )
}

