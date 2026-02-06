"use client"

import { useState, useEffect } from "react"
import { Search, Download, MoreVertical, Eye, UserX, Users, BookOpen, TrendingUp, Award, X, Mail, Calendar, Clock, CheckCircle } from "lucide-react"

interface Student {
  id: string
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

const initialStudents: Student[] = [
  {
    id: "1",
    name: "Trần Minh Anh",
    email: "minh.anh@email.com",
    phone: "0901234567",
    avatar: "/placeholder-user.jpg",
    course: "Next.js Advanced",
    courseId: "COURSE001",
    progress: 85,
    joinDate: "2024-01-15",
    lastActive: "2025-01-18",
    status: "active",
    lessonsCompleted: 38,
    totalLessons: 45,
    quizScore: 92,
  },
  {
    id: "2",
    name: "Nguyễn Văn Bình",
    email: "van.binh@email.com",
    phone: "0912345678",
    avatar: "/placeholder-user.jpg",
    course: "React Hooks Mastery",
    courseId: "COURSE002",
    progress: 60,
    joinDate: "2024-02-20",
    lastActive: "2025-01-17",
    status: "active",
    lessonsCompleted: 21,
    totalLessons: 35,
    quizScore: 78,
  },
  {
    id: "3",
    name: "Phạm Thị Cẩm",
    email: "thi.cam@email.com",
    phone: "0923456789",
    avatar: "/placeholder-user.jpg",
    course: "Next.js Advanced",
    courseId: "COURSE001",
    progress: 100,
    joinDate: "2024-01-10",
    lastActive: "2025-01-15",
    status: "completed",
    lessonsCompleted: 45,
    totalLessons: 45,
    quizScore: 95,
  },
  {
    id: "4",
    name: "Lê Hoàng Dũng",
    email: "hoang.dung@email.com",
    phone: "0934567890",
    avatar: "/placeholder-user.jpg",
    course: "React Hooks Mastery",
    courseId: "COURSE002",
    progress: 25,
    joinDate: "2024-03-01",
    lastActive: "2025-01-10",
    status: "inactive",
    lessonsCompleted: 9,
    totalLessons: 35,
    quizScore: 65,
  },
  {
    id: "5",
    name: "Võ Thị E",
    email: "thi.e@email.com",
    phone: "0945678901",
    avatar: "/placeholder-user.jpg",
    course: "Next.js Advanced",
    courseId: "COURSE001",
    progress: 45,
    joinDate: "2024-02-28",
    lastActive: "2025-01-18",
    status: "active",
    lessonsCompleted: 20,
    totalLessons: 45,
    quizScore: 82,
  },
]

const courses = [
  { id: "COURSE001", title: "Next.js Advanced" },
  { id: "COURSE002", title: "React Hooks Mastery" },
]

export default function TeacherStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCourse, setFilterCourse] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "remove" | null>(null)
  const [students, setStudents] = useState(initialStudents)

  // Stats
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.status === "active").length
  const completedStudents = students.filter(s => s.status === "completed").length
  const avgProgress = Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)

  const filteredStudents = students.filter((student) => {
    const matchSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCourse = filterCourse === "all" || student.courseId === filterCourse
    const matchStatus = filterStatus === "all" || student.status === filterStatus
    return matchSearch && matchCourse && matchStatus
  })

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
    setStudents(students.filter(student => student.id !== selectedStudent.id))
    setViewMode(null)
    setSelectedStudent(null)
  }

  const handleExport = () => {
    const headers = ["Tên", "Email", "SĐT", "Khóa học", "Tiến độ", "Ngày tham gia", "Trạng thái"]
    const rows = filteredStudents.map(s => [
      s.name,
      s.email,
      s.phone,
      s.course,
      `${s.progress}%`,
      s.joinDate,
      s.status === "active" ? "Đang học" : s.status === "completed" ? "Hoàn thành" : "Không hoạt động"
    ])
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `students_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
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
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bg_students.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/10 dark:bg-black/10 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2 drop-shadow-lg">Quản lý học viên</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Theo dõi và quản lý học viên trong các khóa học của bạn</p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-fit backdrop-blur-sm"
              >
                <Download size={20} /> Xuất danh sách
              </button>
            </div>

            {/* Stats Cards */}
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

        {/* Main Content - 2 Column Layout (Responsive) */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Right Sidebar - Filters & Summary (Top on Mobile, Right on Desktop) */}
          <div className="w-full lg:w-72 lg:flex-shrink-0 lg:order-2">
            <div className="space-y-6">
              {/* Filters Card */}
              <div className="animate-slideUp bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 sticky top-6" style={{ animationDelay: "0.2s" }}>
                <h3 className="font-semibold text-foreground dark:text-white mb-4">Bộ lọc</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground dark:text-slate-400 block mb-2">Khóa học</label>
                    <select
                      value={filterCourse}
                      onChange={(e) => setFilterCourse(e.target.value)}
                      className="w-full px-3 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg text-sm text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Tất cả</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground dark:text-slate-400 block mb-2">Trạng thái</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg text-sm text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Tất cả</option>
                      <option value="active">Đang học</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="inactive">Không hoạt động</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="animate-slideUp bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 sticky top-6" style={{ animationDelay: "0.35s" }}>
                <h3 className="font-semibold text-foreground dark:text-white mb-6">Tổng quan</h3>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-slate-400 mb-2">Tỷ lệ hoàn thành</p>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-2">
                        {totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0}%
                      </div>
                      <div className="w-full h-2 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border dark:border-slate-800">
                    <p className="text-xs font-semibold text-foreground dark:text-white mb-3 uppercase text-muted-foreground">Thống kê</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground dark:text-slate-400">Đang học:</span>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{activeStudents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground dark:text-slate-400">Hoàn thành:</span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">{completedStudents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground dark:text-slate-400">Không hoạt động:</span>
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          {totalStudents - activeStudents - completedStudents}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Left - Students Grid (Main Content) */}
          <div className="flex-1 lg:order-1 space-y-4">
            {/* Search Bar */}
            <div className="animate-slideUp relative" style={{ animationDelay: "0.15s" }}>
              <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm học viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              />
            </div>

            {/* Students Grid */}
            {filteredStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className="animate-slideUp bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                    style={{ animationDelay: `${0.25 + index * 0.08}s` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-12 h-12 rounded-full object-cover bg-secondary"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground dark:text-white truncate">{student.name}</h4>
                          <p className="text-xs text-muted-foreground dark:text-slate-400 truncate">{student.email}</p>
                        </div>
                      </div>
                      <div className="relative" data-dropdown>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenu(openMenu === student.id ? null : student.id)
                          }}
                          className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical size={16} className="text-muted-foreground dark:text-slate-400" />
                        </button>
                        {openMenu === student.id && (
                          <div className="absolute right-0 top-full mt-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-xl z-50 min-w-40" data-dropdown>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetails(student)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white rounded-t-lg text-sm"
                            >
                              <Eye size={16} /> Xem chi tiết
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveClick(student)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 text-destructive rounded-b-lg text-sm"
                            >
                              <UserX size={16} /> Xóa học viên
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Course & Status */}
                    <div className="mb-4 pb-4 border-b border-border dark:border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-slate-400 mb-1">Khóa học</p>
                          <p className="text-sm font-medium text-foreground dark:text-white">{student.course}</p>
                        </div>
                        {getStatusBadge(student.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-slate-400">
                        <Calendar size={14} />
                        <span>Tham gia: {formatDate(student.joinDate)}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-2 items-center">
                          <span className="text-xs text-muted-foreground dark:text-slate-400">Tiến độ</span>
                          <span className="text-sm font-semibold text-foreground dark:text-white">{student.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              student.progress === 100 
                                ? "bg-green-500" 
                                : student.progress >= 50 
                                  ? "bg-blue-500" 
                                  : "bg-yellow-500"
                            }`}
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">Điểm Quiz</p>
                          <p className={`text-sm font-semibold ${
                            student.quizScore >= 80 
                              ? "text-green-600 dark:text-green-400" 
                              : student.quizScore >= 60 
                                ? "text-yellow-600 dark:text-yellow-400" 
                                : "text-red-600 dark:text-red-400"
                          }`}>
                            {student.quizScore}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">Bài học</p>
                          <p className="text-sm font-semibold text-foreground dark:text-white">{student.lessonsCompleted}/{student.totalLessons}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl py-12 text-center">
                <Users size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy học viên nào</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {viewMode === "view" && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Thông tin học viên</h2>
              <button
                onClick={() => { setViewMode(null); setSelectedStudent(null); }}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Header */}
              <div className="flex items-center gap-4">
                <img
                  src={selectedStudent.avatar}
                  alt={selectedStudent.name}
                  className="w-20 h-20 rounded-full object-cover bg-secondary"
                />
                <div>
                  <h3 className="text-xl font-bold text-foreground dark:text-white">{selectedStudent.name}</h3>
                  <p className="text-muted-foreground dark:text-slate-400">{selectedStudent.course}</p>
                  <div className="mt-2">{getStatusBadge(selectedStudent.status)}</div>
                </div>
              </div>

              {/* Contact Info */}
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

              {/* Progress Stats */}
              <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                <h4 className="font-semibold text-foreground dark:text-white mb-3">Tiến độ học tập</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground dark:text-slate-400">Hoàn thành khóa học</span>
                      <span className="text-sm font-medium text-foreground dark:text-white">{selectedStudent.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${selectedStudent.progress}%` }}
                      />
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
                    <span className={`text-sm font-medium ${
                      selectedStudent.quizScore >= 80 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-yellow-600 dark:text-yellow-400"
                    }`}>
                      {selectedStudent.quizScore}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground dark:text-slate-400">Hoạt động gần nhất</span>
                    <span className="text-sm font-medium text-foreground dark:text-white">
                      {formatDate(selectedStudent.lastActive)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Student Modal */}
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
                  onClick={() => { setViewMode(null); setSelectedStudent(null); }}
                  className="flex-1 py-3 rounded-lg font-medium border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleRemoveConfirm}
                  className="flex-1 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white"
                >
                  Xóa học viên
                </button>
              </div>
            </div>
          </div>
        </div>
      )}    </div>
  )
}

