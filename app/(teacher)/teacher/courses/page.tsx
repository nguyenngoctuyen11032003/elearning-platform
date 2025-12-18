"use client"

import { Plus, Edit2, Trash2, Eye, MoreVertical } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CourseDetailModal, ConfirmDeleteModal } from "@/components/ui/course-modals"
import { formatPrice } from "@/lib/format"

const courses = [
  {
    id: 1,
    title: "Lập trình Next.js từ cơ bản đến nâng cao",
    students: 1250,
    rating: 4.9,
    price: 499000,
    status: "published",
    createdAt: "2024-12-01",
  },
  {
    id: 2,
    title: "React Hooks & State Management",
    students: 890,
    rating: 4.8,
    price: 399000,
    status: "published",
    createdAt: "2024-11-15",
  },
  {
    id: 3,
    title: "Advanced TypeScript Patterns",
    students: 0,
    rating: 0,
    price: 349000,
    status: "draft",
    createdAt: "2025-01-10",
  },
]

export default function TeacherCoursesPage() {
  const router = useRouter()
  const [courses_, setCourses] = useState(courses)
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleViewDetails = (course: any) => {
    setSelectedCourse(course)
    setIsDetailModalOpen(true)
    setOpenMenu(null)
  }

  const handleEdit = (courseId: number) => {
    router.push(`/teacher/courses/${courseId}/edit`)
    setOpenMenu(null)
  }

  const handleDeleteClick = (course: any) => {
    setSelectedCourse(course)
    setIsDeleteModalOpen(true)
    setOpenMenu(null)
  }

  const handleDeleteConfirm = (courseId: number) => {
    setCourses(courses_.filter(course => course.id !== courseId))
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-dropdown]')) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Khóa học của tôi</h1>
            <p className="text-muted-foreground dark:text-slate-400">Quản lý và tạo khóa học mới</p>
          </div>
          <Link
            href="/teacher/courses/create"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-smooth"
          >
            <Plus size={20} /> Tạo khóa học
          </Link>
        </div>

        {/* Courses Table */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Tên khóa học</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Học viên</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Đánh giá</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Giá</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Trạng thái</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {courses_.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-foreground dark:text-white line-clamp-1">{course.title}</p>
                        <p className="text-xs text-muted-foreground dark:text-slate-400">Tạo: {course.createdAt}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white">{course.students}</td>
                    <td className="py-4 px-6">
                      {course.rating > 0 ? (
                        <span className="text-foreground dark:text-white">{course.rating}★</span>
                      ) : (
                        <span className="text-muted-foreground dark:text-slate-400">Chưa có</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white">₫{formatPrice(course.price)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          course.status === "published"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                        }`}
                      >
                        {course.status === "published" ? "Đã xuất bản" : "Nháp"}
                      </span>
                    </td>
                    <td className="py-4 px-6 relative" data-dropdown>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('Clicked course menu:', course.id, 'Current open:', openMenu)
                          setOpenMenu(openMenu === course.id ? null : course.id)
                        }}
                        className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                      >
                        <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                      </button>
                      {openMenu === course.id && (
                        <div className="absolute right-0 top-full mt-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-xl z-50 min-w-48" data-dropdown>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedCourse && (
        <>
          <CourseDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            course={selectedCourse}
          />
          <ConfirmDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            course={selectedCourse}
            onConfirm={handleDeleteConfirm}
          />
        </>
      )}
    </main>
  )
}
