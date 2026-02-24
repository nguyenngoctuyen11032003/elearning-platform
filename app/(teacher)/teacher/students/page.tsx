"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Award,
  BookOpen,
  Calendar,
  Download,
  Eye,
  Mail,
  MoreVertical,
  Search,
  TrendingUp,
  UserX,
  Users,
} from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "sonner"

import { apiClient } from "@/lib/api/client"

interface Student {
  id: string
  studentId: string
  name: string
  email: string
  phone: string
  avatar: string
  course: string
  courseId: string
  progress: number
  joinDate: string
  lastActive: string
  status: "active" | "completed" | "inactive"
  lessonsCompleted: number
  totalLessons: number
  quizScore: number
}

const normalizeStatus = (status?: string): Student["status"] => {
  const s = (status || "").toString().trim().toLowerCase()
  if (s === "completed") return "completed"
  if (s === "active" || s === "in_progress" || s === "progress") return "active"
  return "inactive"
}

const formatDate = (dateString: string) => {
  if (!dateString) return ""
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function TeacherStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCourse, setFilterCourse] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "remove" | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true)
      try {
        const res = await apiClient.getTeacherStudents()
        const rows = Array.isArray(res?.data) ? res.data : []
        const mapped: Student[] = rows.map((s: any) => ({
          id: s.id,
          studentId: s.studentId || s.id,
          name: s.name || "Không rõ",
          email: s.email || "",
          phone: s.phone || "",
          avatar: s.avatar || "/placeholder-user.jpg",
          course: s.courseName || "",
          courseId: s.courseId || "",
          progress: Number(s.progress ?? 0),
          joinDate: s.joinDate ? new Date(s.joinDate).toISOString() : "",
          lastActive: s.lastActive ? new Date(s.lastActive).toISOString() : "",
          status: normalizeStatus(s.status),
          lessonsCompleted: 0,
          totalLessons: 0,
          quizScore: 0,
        }))
        setStudents(mapped)
      } catch (error) {
        console.error("Failed to load students", error)
        toast.error("Không thể tải danh sách học viên")
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [])

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>()
    students.forEach((s) => {
      if (s.courseId) map.set(s.courseId, s.course || s.courseId)
    })
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [students])

  const filteredStudents = students.filter((student) => {
    const matchSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCourse = filterCourse === "all" || student.courseId === filterCourse
    const matchStatus = filterStatus === "all" || student.status === filterStatus
    return matchSearch && matchCourse && matchStatus
  })

  const totalStudents = useMemo(() => {
    const seen = new Set<string>()
    filteredStudents.forEach((student) => {
      const key = `${student.studentId || student.id || ""}::${student.name || ""}`
      seen.add(key)
    })
    return seen.size
  }, [filteredStudents])
  const activeStudents = filteredStudents.filter((s) => s.status === "active").length
  const completedStudents = filteredStudents.filter((s) => s.status === "completed").length
  const avgProgress =
    filteredStudents.length > 0
      ? Math.round(filteredStudents.reduce((sum, s) => sum + s.progress, 0) / filteredStudents.length)
      : 0

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student)
    setViewMode("view")
    setOpenMenu(null)
  }

  const handleRemoveClick = (student: Student) => {
    setSelectedStudent(student)
    setViewMode("remove")
    setOpenMenu(null)
  }

  const handleRemoveConfirm = () => {
    if (!selectedStudent) return
    setStudents(students.filter((student) => student.id !== selectedStudent.id))
    setViewMode(null)
    setSelectedStudent(null)
  }

  const handleExport = () => {
    try {
      const statusLabel = (status: Student["status"]) => {
        if (status === "completed") return "Hoàn thành"
        if (status === "active") return "Đang học"
        return "Không hoạt động"
      }

      const headers = ["Mã học viên", "Học viên", "Email", "Khóa học", "Tiến độ", "Điểm Quiz", "Ngày tham gia", "Trạng thái"]
      const exportDate = new Date().toLocaleDateString("vi-VN")
      const bannerLines = [["Báo cáo: Danh sách học viên"], [`Ngày xuất: ${exportDate}`]]
      const groups = new Map<string, Student[]>()

      filteredStudents.forEach((student) => {
        const key = `${student.studentId || student.id || ""}::${student.name || ""}`
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(student)
      })

      const rows: Array<Array<string | number>> = []
      const merges: XLSX.Range[] = []
      let rowIndex = bannerLines.length + 1

      groups.forEach((group) => {
        group.forEach((student, index) => {
          rows.push([
            index === 0 ? student.studentId : "",
            index === 0 ? student.name : "",
            index === 0 ? student.email : "",
            student.course,
            `${student.progress}%`,
            `${student.quizScore}%`,
            formatDate(student.joinDate),
            statusLabel(student.status),
          ])
        })

        if (group.length > 1) {
          ;[0, 1, 2].forEach((col) => {
            merges.push({
              s: { r: rowIndex, c: col },
              e: { r: rowIndex + group.length - 1, c: col },
            })
          })
        }

        rowIndex += group.length
      })

      const aoa = [...bannerLines, headers, ...rows]
      const worksheet = XLSX.utils.aoa_to_sheet(aoa)
      worksheet["!merges"] = merges

      const lastCol = headers.length - 1
      bannerLines.forEach((_, index) => {
        merges.push({
          s: { r: index, c: 0 },
          e: { r: index, c: lastCol },
        })
      })

      aoa.forEach((row, r) => {
        row.forEach((_, c) => {
          const cellAddress = XLSX.utils.encode_cell({ r, c })
          const cell = worksheet[cellAddress]
          if (!cell) return
          cell.s = {
            font: { name: "Times New Roman" },
            alignment: { horizontal: "center", vertical: "center" },
          }
        })
      })

      const colCount = Math.max(...aoa.map((row) => row.length))
      worksheet["!cols"] = Array.from({ length: colCount }, (_, colIndex) => {
        const maxLen = Math.max(
          ...aoa.map((row) => {
            const value = row[colIndex]
            return value === undefined || value === null ? 0 : String(value).length
          })
        )
        return { wch: Math.min(60, Math.max(10, maxLen + 2)) }
      })

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Hoc vien")
      XLSX.writeFile(workbook, `students_report_${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      console.error("Failed to export students", error)
      toast.error("Xuất danh sách thất bại")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            Hoàn thành
          </span>
        )
      case "active":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            Đang học
          </span>
        )
      case "inactive":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
            Không hoạt động
          </span>
        )
      default:
        return null
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest("[data-dropdown]")) {
        setOpenMenu(null)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen w-full space-y-6">
        <div className="h-40 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-[400px] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        <div
          className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn"
          style={{ backgroundImage: "url('/image/bg_students.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl" />
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Quản lý học viên</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Theo dõi và quản lý học viên trong các khóa học của bạn</p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-fit backdrop-blur-sm"
              >
                <Download size={20} /> Xuất danh sách
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Tổng học viên</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalStudents}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Users size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Đang học</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{activeStudents}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Hoàn thành</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{completedStudents}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Award size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Tiến độ TB</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{avgProgress}%</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm học viên theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả khóa học</option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang học</option>
            <option value="completed">Hoàn thành</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>

        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Học viên</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Khóa học</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Tiến độ</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Điểm Quiz</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Ngày tham gia</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Trạng thái</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={`border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth relative ${
                      openMenu === student.id ? "z-20" : "z-0"
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover bg-secondary" />
                        <div>
                          <p className="font-medium text-foreground dark:text-white">{student.name}</p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white">{student.course}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              student.progress === 100 ? "bg-green-500" : student.progress >= 50 ? "bg-blue-500" : "bg-yellow-500"
                            }`}
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-foreground dark:text-white text-xs font-medium">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`font-medium ${
                          student.quizScore >= 80
                            ? "text-green-600 dark:text-green-400"
                            : student.quizScore >= 60
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {student.quizScore}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{formatDate(student.joinDate)}</td>
                    <td className="py-4 px-6">{getStatusBadge(student.status)}</td>
                    <td className="py-4 px-6 relative" data-dropdown>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenu(openMenu === student.id ? null : student.id)
                        }}
                        className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                      >
                        <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                      </button>
                      {openMenu === student.id && (
                        <div className="absolute right-0 top-full mt-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-xl z-50 min-w-40" data-dropdown>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetails(student)
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white rounded-t-lg"
                          >
                            <Eye size={16} /> Xem chi tiết
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveClick(student)
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 text-destructive rounded-b-lg"
                          >
                            <UserX size={16} /> Xóa học viên
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground dark:text-slate-400">
                      Chưa có học viên nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {viewMode === "view" && selectedStudent && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground dark:text-white">Thông tin học viên</h2>
                <button onClick={() => { setViewMode(null); setSelectedStudent(null) }} className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth">
                  <UserX size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-20 h-20 rounded-full object-cover bg-secondary" />
                  <div>
                    <h3 className="text-xl font-bold text-foreground dark:text-white">{selectedStudent.name}</h3>
                    <p className="text-muted-foreground dark:text-slate-400">{selectedStudent.course}</p>
                    <div className="mt-2">{getStatusBadge(selectedStudent.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Mail size={16} />
                      <span className="text-sm">Email</span>
                    </div>
                    <p className="text-foreground dark:text-white font-medium text-sm">{selectedStudent.email}</p>
                  </div>
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Calendar size={16} />
                      <span className="text-sm">Ngày tham gia</span>
                    </div>
                    <p className="text-foreground dark:text-white font-medium">{formatDate(selectedStudent.joinDate)}</p>
                  </div>
                </div>

                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <h4 className="font-semibold text-foreground dark:text-white mb-3">Tiến độ học tập</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground dark:text-slate-400">Hoàn thành khóa học</span>
                        <span className="text-sm font-medium text-foreground dark:text-white">{selectedStudent.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${selectedStudent.progress}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground dark:text-slate-400">Bài học đã hoàn thành</span>
                      <span className="text-sm font-medium text-foreground dark:text-white">
                        {selectedStudent.lessonsCompleted}/{selectedStudent.totalLessons}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground dark:text-slate-400">Điểm Quiz trung bình</span>
                      <span className={`text-sm font-medium ${selectedStudent.quizScore >= 80 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                        {selectedStudent.quizScore}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground dark:text-slate-400">Hoạt động gần nhất</span>
                      <span className="text-sm font-medium text-foreground dark:text-white">{formatDate(selectedStudent.lastActive)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === "remove" && selectedStudent && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserX size={32} className="text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-2">Xóa học viên?</h2>
                <p className="text-muted-foreground dark:text-slate-400 mb-6">
                  Bạn có chắc chắn muốn xóa học viên "<strong>{selectedStudent.name}</strong>" khỏi khóa học này?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setViewMode(null)
                      setSelectedStudent(null)
                    }}
                    className="flex-1 py-3 rounded-lg font-medium border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                  >
                    Hủy
                  </button>
                  <button onClick={handleRemoveConfirm} className="flex-1 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white">
                    Xóa học viên
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
