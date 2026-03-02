"use client"

import { Plus, Edit2, Trash2, Eye, MoreVertical, Search, BookOpen, Users, DollarSign, Clock, CheckCircle, XCircle, Send, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatPrice } from "@/lib/format"
import { createPortal } from "react-dom"
import React from "react"
interface Course {
  id: string
  title: string
  description: string
  students: number
  rating: number
  price: number
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt: string
  thumbnail: string
  lessons: number
  duration: string
  category: string
  rejectionReason?: string | null
}

interface BackendCourse {
  id: string
  title: string
  description?: string
  price?: number
  status?: "draft" | "pending" | "published" | "rejected"
  createdAt?: string
  thumbnail?: string
  duration?: number
  enrollmentCount?: number
  rating?: number
  rejectionReason?: string | null
  category?: {
    name?: string
  } | null
  lessons?: Array<{ id: string }>
}
const InfoItem = ({ icon, label, value }: any) => (
  <div className="bg-secondary rounded-xl p-3 text-center">
    <div className="flex justify-center mb-1">{icon}</div>
    <div className="text-lg font-bold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
)
export default function TeacherCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "delete" | null>(null)
  const [menuCourse, setMenuCourse] = useState<Course | null>(null)
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null)
  const [menuAnchorId, setMenuAnchorId] = useState<string | null>(null)
  const menuButtonRefs = React.useRef<Map<string, React.RefObject<HTMLButtonElement>>>(new Map());

  const normalizeList = (data: any): BackendCourse[] => {
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.data)) return data.data
    if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data
    return []
  }

  const mapCourse = (course: BackendCourse): Course => {
    const statusMap: Record<string, Course["status"]> = {
      published: "approved",
      draft: "draft",
      pending: "pending",
      rejected: "rejected",
    }
    const durationHours = course.duration ? Math.round(course.duration / 60) : 0
    return {
      id: course.id,
      title: course.title,
      description: course.description || "",
      students: course.enrollmentCount || 0,
      rating: course.rating || 0,
      price: course.price || 0,
      status: statusMap[course.status || "draft"] || "draft",
      createdAt: course.createdAt || "",
      thumbnail: course.thumbnail || "/placeholder.jpg",
      lessons: course.lessons?.length || 0,
      duration: durationHours > 0 ? `${durationHours} giờ` : "—",
      category: course.category?.name || "—",
      rejectionReason: course.rejectionReason || null,
    }
  }

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        const response = await fetch("/courses/teacher/my-courses", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!response.ok) {
          throw new Error("Failed to fetch courses")
        }

        const data = await response.json()
        const list = normalizeList(data).map(mapCourse)
        setCourses(list)
      } catch (error) {
        console.error("Error fetching courses:", error)
        setCourses([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [])

  // Stats
  const totalCourses = courses.length
  const draftCourses = courses.filter(c => c.status === "draft").length
  const pendingCourses = courses.filter(c => c.status === "pending").length
  const approvedCourses = courses.filter(c => c.status === "approved").length
  const rejectedCourses = courses.filter(c => c.status === "rejected").length

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" || course.status === statusFilter),
  )

  const handleViewDetails = (course: Course) => {
    setSelectedCourse(course)
    setViewMode("view")
    setMenuOpenId(null)
  }

  const handleEdit = (courseId: string) => {
    router.push(`/teacher/courses/${courseId}/edit`)
    setMenuOpenId(null)
  }

  const handleDeleteClick = (course: Course) => {
    setSelectedCourse(course)
    setViewMode("delete")
    setMenuOpenId(null)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCourse) return
    try {
      const token = localStorage.getItem("auth_token")
      const res = await fetch(`/courses/${selectedCourse.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Delete failed")
      setCourses(courses.filter(course => course.id !== selectedCourse.id))
    } catch (error) {
      console.error("Error deleting course:", error)
    } finally {
      setViewMode(null)
      setSelectedCourse(null)
    }
  }

  const handleSubmitForReview = async (courseId: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      const res = await fetch(`/courses/${courseId}/submit`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Submit failed")
      setCourses(courses.map(c =>
        c.id === courseId ? { ...c, status: "pending" as const } : c
      ))
    } catch (error) {
      console.error("Error submitting course:", error)
    } finally {
      setMenuOpenId(null)
    }
  }

// Close dropdown when clicking outside
// Only close dropdown on desktop, not mobile
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (window.innerWidth < 768) return // ⬅️ CHỐT CHẶN MOBILE

    const target = event.target as Element
    if (!target.closest('[data-dropdown]')) {
      setMenuOpenId(null)
    }
  }

  document.addEventListener("click", handleClickOutside)
  return () => document.removeEventListener("click", handleClickOutside)
}, [])

// Recalculate menuRect only once when menu is open (mobile)
useEffect(() => {
  if (!menuCourse || !menuAnchorId || window.innerWidth >= 768) return

  const ref = menuButtonRefs.current.get(menuAnchorId)
  if (!ref?.current) return

  setMenuRect(ref.current.getBoundingClientRect())
}, [menuCourse, menuAnchorId])

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
            <XCircle size={14} /> Bị từ chối
          </span>
        )
      case "draft":
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
            <Edit2 size={14} /> Nháp
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bg_mycourses.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Khóa học của tôi</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Quản lý và tạo khóa học mới</p>
              </div>
              <Link
                href="/teacher/courses/create"
                className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-fit backdrop-blur-sm"
              >
                <Plus size={20} /> Tạo khóa học mới
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Tổng</p>
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
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Nháp</p>
                    <p className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-1">{draftCourses}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Edit2 size={20} className="text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
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
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Đã duyệt</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{approvedCourses}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.65s" }}>
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
              placeholder="Tìm kiếm khóa học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "Tất cả" },
              { value: "draft", label: "Nháp" },
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

        {/* Courses List - Mobile: Cards, Desktop: Table */}
        {/* Mobile: Cards */}
        <div className="block md:hidden">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground dark:text-slate-400">
              Đang tải khóa học...
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy khóa học nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  data-course-card-id={course.id}
                  className={`relative border border-border dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-2 animate-fadeIn ${menuCourse?.id === course.id ? "z-[9999]" : "z-0"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-16 h-16 rounded-lg object-cover bg-secondary"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-foreground dark:text-white text-base">{course.title}</div>
                      <div className="text-xs text-muted-foreground dark:text-slate-400">{course.lessons} bài học • {course.duration}</div>
                    </div>
                    <button
                      ref={(() => {
                        if (!menuButtonRefs.current.has(course.id)) {
                          menuButtonRefs.current.set(course.id, React.createRef<HTMLButtonElement>())
                        }
                        return menuButtonRefs.current.get(course.id);
                      })()}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.innerWidth < 768) {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setMenuRect(rect)
                          setMenuCourse(course)
                          setMenuAnchorId(course.id)
                        } else {
                          setMenuOpenId(menuOpenId === course.id ? null : course.id)
                        }
                      }}
                      className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                    >
                      <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground dark:text-slate-400">Danh mục:</span>
                    <span className="text-sm text-foreground dark:text-white">{course.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground dark:text-slate-400">Học viên:</span>
                    <span className="text-sm text-foreground dark:text-white">{course.students}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground dark:text-slate-400">Đánh giá:</span>
                    <span className="text-sm text-yellow-500">{course.rating > 0 ? `${course.rating}★` : "Chưa có"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground dark:text-slate-400">Giá:</span>
                    <span className="text-sm text-foreground dark:text-white">₫{formatPrice(course.price)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground dark:text-slate-400">Trạng thái:</span>
                    {getStatusBadge(course.status)}
                  </div>
                  {/* INLINE DETAIL – NEO THEO CARD */}
{viewMode === "view" && selectedCourse?.id === course.id && (
  <div className="mt-4 rounded-xl border border-border bg-secondary p-4 animate-slideDown">

    {/* Header */}
    <div className="flex items-start gap-3 mb-3">
      <img
        src={course.thumbnail}
        className="w-20 h-14 rounded-lg object-cover"
      />

      <div className="flex-1">
        <h3 className="font-semibold text-sm">
          {course.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {course.description}
        </p>
        <div className="mt-1">
          {getStatusBadge(course.status)}
        </div>
      </div>

      <button
        onClick={() => {
          setViewMode(null)
          setSelectedCourse(null)
        }}
        className="text-muted-foreground"
      >
        <XCircle size={18} />
      </button>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-2 mb-3">
      <InfoItem icon={<Users size={14} />} label="Học viên" value={course.students} />
      <InfoItem icon={<BookOpen size={14} />} label="Bài học" value={course.lessons} />
      <InfoItem icon={<Clock size={14} />} label="Thời lượng" value={course.duration} />
      <InfoItem
        icon={<DollarSign size={14} />}
        label="Giá"
        value={`₫${formatPrice(course.price)}`}
      />
    </div>

    {/* Actions */}
    <div className="flex gap-2">
      <button
        onClick={() => handleEdit(course.id)}
        className="flex-1 py-2 rounded-lg bg-background border text-sm"
      >
        Chỉnh sửa
      </button>

      {(course.status === "draft" || course.status === "rejected") && (
        <button
          onClick={() => handleSubmitForReview(course.id)}
          className="flex-1 py-2 rounded-lg bg-primary text-white text-sm"
        >
          {course.status === "rejected"
            ? "Gửi duyệt lại"
            : "Gửi duyệt"}
        </button>
      )}
    </div>
  </div>
)}
                  {viewMode === "delete" && selectedCourse && selectedCourse.id === course.id && (
                    <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm" style={{pointerEvents: 'auto'}}>
                      <div
                        className="absolute max-w-xs w-full bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl p-6 animate-fadeIn"
                        style={menuRect ? {
                          left: `calc(${menuRect.left + menuRect.width / 2}px - 160px)`,
                          top: `calc(${menuRect.top + menuRect.height / 2}px - 180px)`,
                        } : {left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}
                      >
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Trash2 size={32} className="text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground dark:text-white mb-2 text-center">Xóa khóa học?</h2>
                        <p className="text-muted-foreground dark:text-slate-400 mb-6 text-center">
                          Bạn có chắc chắn muốn xóa khóa học "<strong>{selectedCourse.title}</strong>"? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setViewMode(null); setSelectedCourse(null); }}
                            className="flex-1 py-3 rounded-lg font-medium border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleDeleteConfirm}
                            className="flex-1 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white"
                          >
                            Xóa khóa học
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Desktop: Table */}
        <div className="hidden md:block bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Khóa học</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Danh mục</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Học viên</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Đánh giá</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Giá</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Trạng thái</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground dark:text-slate-400">
                      Đang tải khóa học...
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr
                      key={course.id}
                      className={`border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth relative ${
                        menuOpenId === course.id ? "z-20" : "z-0"
                      }`}
                    >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-12 h-12 rounded-lg object-cover bg-secondary"
                        />
                        <div>
                          <p className="font-medium text-foreground dark:text-white line-clamp-1">{course.title}</p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{course.lessons} bài học • {course.duration}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-secondary dark:bg-slate-800 rounded text-foreground dark:text-white text-xs">
                        {course.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white">{course.students}</td>
                    <td className="py-4 px-6">
                      {course.rating > 0 ? (
                        <span className="text-foreground dark:text-white flex items-center gap-1">
                          {course.rating}
                          <span className="text-yellow-500">★</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground dark:text-slate-400">Chưa có</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white font-medium">₫{formatPrice(course.price)}</td>
                    <td className="py-4 px-6">{getStatusBadge(course.status)}</td>
                    <td className="py-4 px-6" data-dropdown>
                      <div className="relative inline-flex" data-dropdown>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpenId(menuOpenId === course.id ? null : course.id)
                          }}
                          className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                        >
                          <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                        </button>
                        {menuOpenId === course.id && (
                          <div
                            className="absolute right-0 top-full mt-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-xl z-[99999] min-w-48"
                            data-dropdown
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetails(course)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white rounded-t-lg"
                            >
                              <Eye size={16} /> Xem chi tiết
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(course.id)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                            >
                              <Edit2 size={16} /> Chỉnh sửa
                            </button>
                            {course.status === "draft" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSubmitForReview(course.id)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-primary dark:text-accent"
                              >
                                <Send size={16} /> Gửi duyệt
                              </button>
                            )}
                            {course.status === "rejected" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSubmitForReview(course.id)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-primary dark:text-accent"
                              >
                                <Send size={16} /> Gửi duyệt lại
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(course)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 text-destructive rounded-b-lg"
                            >
                              <Trash2 size={16} /> Xóa khóa học
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && filteredCourses.length === 0 && (
            <div className="py-12 text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy khóa học nào</p>
            </div>
          )}
        </div>
      </div>

      {/* View Course Detail Modal */}
      {viewMode === "view" && selectedCourse && (
        <div className="hidden md:flex fixed inset-0 bg-black/60 z-[9999] items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 p-4 border-b border-border dark:border-slate-800">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Chi tiết khóa học</h2>
              <button
                onClick={() => { setViewMode(null); setSelectedCourse(null); }}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <XCircle size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex gap-4 mb-4">
                <img
                  src={selectedCourse.thumbnail}
                  alt={selectedCourse.title}
                  className="w-24 h-16 rounded-lg object-cover bg-secondary"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground dark:text-white">{selectedCourse.title}</h3>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mt-1">{selectedCourse.description}</p>
                  <div className="mt-2">{getStatusBadge(selectedCourse.status)}</div>
                </div>
              </div>
              {selectedCourse.status === "rejected" && selectedCourse.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                    <AlertCircle size={18} />
                    <span className="font-semibold">Lý do từ chối từ Admin</span>
                  </div>
                  <p className="text-red-600 dark:text-red-300 text-sm">{selectedCourse.rejectionReason}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mb-4">
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
                  <Clock size={24} className="mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                  <p className="text-2xl font-bold text-foreground dark:text-white">{selectedCourse.duration}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">Thời lượng</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4 text-center">
                  <DollarSign size={24} className="mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-2xl font-bold text-foreground dark:text-white">₫{formatPrice(selectedCourse.price)}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">Giá</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">Danh mục</p>
                  <p className="text-foreground dark:text-white font-medium">{selectedCourse.category}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">Ngày tạo</p>
                  <p className="text-foreground dark:text-white font-medium">{formatDate(selectedCourse.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-border dark:border-slate-800">
                <button
                  onClick={() => handleEdit(selectedCourse.id)}
                  className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-secondary dark:bg-slate-800 text-foreground dark:text-white hover:bg-secondary/80"
                >
                  <Edit2 size={18} /> Chỉnh sửa
                </button>
                {(selectedCourse.status === "draft" || selectedCourse.status === "rejected") && (
                  <button
                    onClick={() => {
                      handleSubmitForReview(selectedCourse.id)
                      setViewMode(null)
                      setSelectedCourse(null)
                    }}
                    className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg"
                  >
                    <Send size={18} /> {selectedCourse.status === "rejected" ? "Gửi duyệt lại" : "Gửi duyệt"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {viewMode === "delete" && selectedCourse && (
        <div className="hidden md:flex fixed inset-0 bg-black/60 z-[9999] items-center justify-center p-4">
        <div className="md:flex inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground dark:text-white mb-2">Xóa khóa học?</h2>
              <p className="text-muted-foreground dark:text-slate-400 mb-6">
                Bạn có chắc chắn muốn xóa khóa học "<strong>{selectedCourse.title}</strong>"? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setViewMode(null); setSelectedCourse(null); }}
                  className="flex-1 py-3 rounded-lg font-medium border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white"
                >
                  Xóa khóa học
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}    
{menuCourse && menuRect && typeof window !== "undefined" &&
  (() => {
    // Find the card element
    const card = document.querySelector(`[data-course-card-id="${menuCourse.id}"]`)
    if (!card || !menuRect) return null
    const cardRect = card.getBoundingClientRect()
    // Tính vị trí tương đối
    const left = menuRect.left - cardRect.left
    const top = menuRect.bottom - cardRect.top + 6
    return createPortal(
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 z-[100000]"
          onClick={() => { setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null); }}
        />
        {/* Menu */}
        <div
          className="absolute z-[100001] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
          style={{ right: window.innerWidth - menuRect.right, top, width: 220 }}
        >
          <button
            onClick={() => {
              handleViewDetails(menuCourse)
              setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
            }}
            className="w-full px-4 py-4 flex items-center gap-3 hover:bg-secondary"
          >
            <Eye size={18} /> Xem chi tiết
          </button>
          <button
            onClick={() => {
              handleEdit(menuCourse.id)
              setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
            }}
            className="w-full px-4 py-4 flex items-center gap-3 hover:bg-secondary"
          >
            <Edit2 size={18} /> Chỉnh sửa
          </button>
          {(menuCourse.status === "draft" || menuCourse.status === "rejected") && (
            <button
              onClick={() => {
                handleSubmitForReview(menuCourse.id)
                setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
              }}
              className="w-full px-4 py-4 flex items-center gap-3 text-primary hover:bg-secondary"
            >
              <Send size={18} /> {menuCourse.status === "rejected" ? "Gửi duyệt lại" : "Gửi duyệt"}
            </button>
          )}
          <button
            onClick={() => {
              handleDeleteClick(menuCourse)
              setMenuCourse(null); setMenuRect(null); setMenuAnchorId(null);
            }}
            className="w-full px-4 py-4 flex items-center gap-3 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={18} /> Xóa khóa học
          </button>
        </div>
      </>,
      card
    )
  })()}
    </div>     
  )
}