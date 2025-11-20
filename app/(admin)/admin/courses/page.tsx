"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Eye, Search, MoreVertical, CheckCircle, Clock } from "lucide-react"
import { AddCourseModal, ConfirmDialog } from "@/components/ui/admin-modals"

const initialCourses = [
  {
    id: "1",
    title: "Lập trình Next.js",
    instructor: "Nguyễn Ngọc Tuyền",
    students: 1250,
    revenue: 624500000,
    status: "published",
    createdAt: "2024-01-15",
    category: "Lập trình",
  },
  {
    id: "2",
    title: "React Hooks Advanced",
    instructor: "Trần Minh Tuấn",
    students: 890,
    revenue: 445000000,
    status: "published",
    createdAt: "2024-02-20",
    category: "Lập trình",
  },
  {
    id: "3",
    title: "AI & Machine Learning",
    instructor: "Phạm Thị Hương",
    students: 450,
    revenue: 225000000,
    status: "draft",
    createdAt: "2024-03-10",
    category: "AI & Data",
  },
  {
    id: "4",
    title: "UI/UX Design Masterclass",
    instructor: "Lê Thị Hương",
    students: 1567,
    revenue: 783500000,
    status: "published",
    createdAt: "2024-01-05",
    category: "Thiết kế",
  },
]

export default function AdminCoursesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [courses, setCourses] = useState(initialCourses)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    action: string
    courseId?: string
  }>({ isOpen: false, action: "" })
  const [selectedCourse, setSelectedCourse] = useState<any>(null)

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddCourse = (newCourse: any) => {
    const course = {
      id: String(Math.max(...courses.map((c) => Number.parseInt(c.id)), 0) + 1),
      ...newCourse,
      students: 0,
      revenue: 0,
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
    }
    setCourses([...courses, course])
  }

  const handleCourseAction = (action: string, courseId: string, course?: any) => {
    setSelectedCourse(course)
    setConfirmDialog({ isOpen: true, action, courseId })
  }

  const executeCourseAction = () => {
    const { action, courseId } = confirmDialog
    if (action === "approve") {
      setCourses(courses.map((c) => (c.id === courseId ? { ...c, status: "published" } : c)))
    } else if (action === "delete") {
      setCourses(courses.filter((c) => c.id !== courseId))
    }
    setOpenMenu(null)
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Quản lý khóa học</h1>
            <p className="text-muted-foreground dark:text-slate-400">Tổng cộng {courses.length} khóa học</p>
          </div>
          <button
            onClick={() => setIsAddCourseOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center gap-2"
          >
            <Plus size={20} /> Tạo khóa học
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học hoặc giảng viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
          />
        </div>

        {/* Courses Table */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Tên khóa học</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Giảng viên</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Danh mục</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Học viên</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Doanh thu</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Trạng thái</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth"
                  >
                    <td className="py-4 px-6 text-foreground dark:text-white font-medium">{course.title}</td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{course.instructor}</td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{course.category}</td>
                    <td className="py-4 px-6 text-foreground dark:text-white">{course.students.toLocaleString()}</td>
                    <td className="py-4 px-6 text-primary dark:text-accent font-semibold">
                      ₫{(course.revenue / 1000000).toFixed(1)}M
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                          course.status === "published"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                        }`}
                      >
                        {course.status === "published" ? (
                          <>
                            <CheckCircle size={14} /> Đã xuất bản
                          </>
                        ) : (
                          <>
                            <Clock size={14} /> Chờ duyệt
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6 relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === course.id ? null : course.id)}
                        className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                      >
                        <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                      </button>
                      {openMenu === course.id && (
                        <div className="absolute right-0 top-full mt-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-lg z-10 min-w-48">
                          <button className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white">
                            <Eye size={16} /> Xem chi tiết
                          </button>
                          <button className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white">
                            <Edit size={16} /> Chỉnh sửa
                          </button>
                          {course.status === "draft" && (
                            <button
                              onClick={() => {
                                handleCourseAction("approve", course.id, course)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-green-600 dark:text-green-400"
                            >
                              <CheckCircle size={16} /> Duyệt khóa học
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleCourseAction("delete", course.id, course)
                            }}
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
        </div>
      </div>

      <AddCourseModal isOpen={isAddCourseOpen} onClose={() => setIsAddCourseOpen(false)} onAdd={handleAddCourse} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: "" })}
        onConfirm={executeCourseAction}
        title={confirmDialog.action === "approve" ? "Duyệt khóa học" : "Xóa khóa học"}
        message={
          confirmDialog.action === "approve"
            ? `Bạn có chắc chắn muốn duyệt khóa học "${selectedCourse?.title}" không?`
            : `Bạn có chắc chắn muốn xóa khóa học "${selectedCourse?.title}" không? Hành động này không thể hoàn tác.`
        }
        isDangerous={confirmDialog.action === "delete"}
      />
    </main>
  )
}
