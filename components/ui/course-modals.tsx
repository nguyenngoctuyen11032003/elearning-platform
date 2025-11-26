"use client"

import { useState } from "react"
import { X, Eye, Calendar, Users, Star, DollarSign, Book, Clock, Tag, FileText, Video, Edit2, Trash2 } from "lucide-react"

interface Course {
  id: number
  title: string
  students: number
  rating: number
  price: number
  status: string
  createdAt: string
  description?: string
  category?: string
  duration?: string
  lessons?: number
  instructor?: string
}

interface CourseDetailModalProps {
  isOpen: boolean
  onClose: () => void
  course: Course
}

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  course: Course
  onConfirm: (courseId: number) => void
}

export function CourseDetailModal({ isOpen, onClose, course }: CourseDetailModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
              <Eye size={20} className="text-primary dark:text-accent" />
            </div>
            <h2 className="text-xl font-bold text-foreground dark:text-white">Chi tiết khóa học</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
          >
            <X size={20} className="text-muted-foreground dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Course Title & Status */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground dark:text-white">{course.title}</h1>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  course.status === "published"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                }`}
              >
                {course.status === "published" ? "Đã xuất bản" : "Nháp"}
              </span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground dark:text-slate-400">
                <Calendar size={16} />
                Tạo: {course.createdAt}
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-primary dark:text-accent" />
                <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">Học viên</span>
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-white">{course.students}</p>
            </div>
            
            <div className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-primary dark:text-accent" />
                <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">Đánh giá</span>
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-white">
                {course.rating > 0 ? `${course.rating}⭐` : "Chưa có"}
              </p>
            </div>

            <div className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-primary dark:text-accent" />
                <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">Giá</span>
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-white">₫{course.price.toLocaleString()}</p>
            </div>

            <div className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Book size={16} className="text-primary dark:text-accent" />
                <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">Bài học</span>
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-white">{course.lessons || 12}</p>
            </div>
          </div>

          {/* Course Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground dark:text-white">Thông tin khóa học</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Tag size={16} className="text-muted-foreground dark:text-slate-400" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Danh mục</p>
                    <p className="font-medium text-foreground dark:text-white">
                      {course.category || "Lập trình"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-muted-foreground dark:text-slate-400" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Thời lượng</p>
                    <p className="font-medium text-foreground dark:text-white">
                      {course.duration || "8 giờ 30 phút"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Video size={16} className="text-muted-foreground dark:text-slate-400" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Video</p>
                    <p className="font-medium text-foreground dark:text-white">
                      {course.lessons || 12} bài giảng HD
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-muted-foreground dark:text-slate-400" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Tài liệu</p>
                    <p className="font-medium text-foreground dark:text-white">8 tài liệu PDF</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Description */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground dark:text-white">Mô tả khóa học</h3>
            <div className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg p-4">
              <p className="text-muted-foreground dark:text-slate-400 leading-relaxed">
                {course.description || `Khóa học ${course.title} được thiết kế để cung cấp kiến thức toàn diện về lập trình hiện đại. Học viên sẽ được hướng dẫn từ những kiến thức cơ bản đến nâng cao với nhiều ví dụ thực tế và dự án hands-on. Khóa học phù hợp cho cả người mới bắt đầu và những ai muốn nâng cao kỹ năng lập trình.`}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-border dark:border-slate-800 rounded-lg font-medium text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
          >
            Đóng
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth">
            <Edit2 size={16} />
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmDeleteModal({ isOpen, onClose, course, onConfirm }: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      onConfirm(course.id)
      onClose()
    } catch (error) {
      console.error("Error deleting course:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <Trash2 size={20} className="text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground dark:text-white">Xác nhận xóa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
          >
            <X size={20} className="text-muted-foreground dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-foreground dark:text-white">
              Bạn có chắc chắn muốn xóa khóa học:
            </p>
            <p className="font-semibold text-foreground dark:text-white bg-secondary dark:bg-slate-800 p-3 rounded-lg">
              "{course.title}"
            </p>
          </div>
          
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">⚠️ Cảnh báo:</p>
            <ul className="text-sm text-destructive mt-2 space-y-1">
              <li>• Khóa học sẽ bị xóa vĩnh viễn</li>
              <li>• Tất cả {course.students} học viên sẽ mất quyền truy cập</li>
              <li>• Dữ liệu không thể khôi phục</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2 border border-border dark:border-slate-800 rounded-lg font-medium text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-6 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-medium transition-smooth disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Xóa khóa học
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}