"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Search,
  Clock,
  Award,
  ClipboardList,
  BookOpen,
  Timer,
  CheckCircle,
  PlayCircle,
  Trophy,
  Target,
  FileText,
  AlertCircle,
  Calendar,
  Flame
} from "lucide-react"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, BarChart, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { PremiumCard } from "@/components/ui/premium-card"
import { PageHero } from "@/components/ui/page-hero"
import { useAuth } from "@/lib/auth/auth-context"

interface Course {
  id: string
  name: string
  icon: string
  bgColor: string
}

interface Exam {
  id: string
  title: string
  description: string
  courseName: string
  courseId: string
  teacherName: string
  type: "practice" | "official"
  timeLimit: number
  passingScore: number
  maxAttempts: number
  questionsCount: number
  myAttempts: number
  bestScore: number | null
  passed: boolean
  certificateName?: string
  deadline?: Date
}

const mockExams: Exam[] = [
  {
    id: "1",
    title: "Bài thi cuối khóa Next.js",
    description: "Bài thi đánh giá kiến thức toàn diện về Next.js, App Router và Server Components",
    courseName: "Lập trình Next.js từ cơ bản đến nâng cao",
    courseId: "course-1",
    teacherName: "Nguyễn Ngọc Tuyền",
    type: "official",
    timeLimit: 90,
    passingScore: 70,
    maxAttempts: 2,
    questionsCount: 50,
    myAttempts: 1,
    bestScore: 85,
    passed: true,
    certificateName: "Chứng chỉ Next.js Master",
    deadline: new Date(2026, 1, 15)
  },
  {
    id: "2",
    title: "Bài thi thử React Hooks",
    description: "Bài thi luyện tập về React Hooks và State Management",
    courseName: "React Hooks Advanced & State Management",
    courseId: "course-2",
    teacherName: "Trần Minh Tuấn",
    type: "practice",
    timeLimit: 60,
    passingScore: 60,
    maxAttempts: 5,
    questionsCount: 30,
    myAttempts: 3,
    bestScore: 72,
    passed: true,
    deadline: new Date(2026, 1, 28)
  },
  {
    id: "3",
    title: "Bài thi UI/UX Design",
    description: "Đánh giá kiến thức thiết kế UI/UX với Figma",
    courseName: "UI/UX Design Masterclass với Figma",
    courseId: "course-3",
    teacherName: "Lê Thị Hương",
    type: "official",
    timeLimit: 120,
    passingScore: 75,
    maxAttempts: 1,
    questionsCount: 60,
    myAttempts: 0,
    bestScore: null,
    passed: false,
    certificateName: "Chứng chỉ UI/UX Designer",
    deadline: new Date(2026, 1, 10)
  },
  {
    id: "4",
    title: "Bài thi thử TypeScript",
    description: "Luyện tập các pattern nâng cao trong TypeScript",
    courseName: "Advanced TypeScript Patterns",
    courseId: "course-4",
    teacherName: "Phạm Văn Đức",
    type: "practice",
    timeLimit: 45,
    passingScore: 50,
    maxAttempts: 10,
    questionsCount: 25,
    myAttempts: 0,
    bestScore: null,
    passed: false,
    deadline: new Date(2026, 2, 5)
  },
  {
    id: "5",
    title: "Bài thi Node.js Backend",
    description: "Đánh giá kỹ năng phát triển Backend với Node.js, Express và MongoDB",
    courseName: "Node.js Backend Development",
    courseId: "course-5",
    teacherName: "Nguyễn Văn An",
    type: "official",
    timeLimit: 100,
    passingScore: 70,
    maxAttempts: 2,
    questionsCount: 45,
    myAttempts: 1,
    bestScore: 65,
    passed: false,
    certificateName: "Chứng chỉ Node.js Developer",
    deadline: new Date(2026, 1, 8)
  },
]

const courses: Course[] = [
  {
    id: "course-1",
    name: "Next.js",
    icon: "🚀",
    bgColor: "from-blue-500 to-cyan-500"
  },
  {
    id: "course-2",
    name: "React",
    icon: "⚛️",
    bgColor: "from-orange-500 to-red-500"
  },
  {
    id: "course-3",
    name: "UI/UX Design",
    icon: "🎨",
    bgColor: "from-pink-500 to-purple-500"
  },
  {
    id: "course-4",
    name: "TypeScript",
    icon: "📘",
    bgColor: "from-blue-600 to-indigo-600"
  },
  {
    id: "course-5",
    name: "Node.js",
    icon: "🟢",
    bgColor: "from-green-500 to-teal-500"
  },
]

export default function StudentExamsPage() {
  const { user } = useAuth()
  const [exams] = useState<Exam[]>(mockExams)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Chào buổi sáng")
    else if (hour < 18) setGreeting("Chào buổi chiều")
    else setGreeting("Chào buổi tối")
  }, [])

  // Helper functions
  const isOverdue = (exam: Exam) => {
    if (!exam.deadline) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(exam.deadline)
    deadline.setHours(0, 0, 0, 0)
    return today > deadline && exam.myAttempts === 0
  }

  const daysUntilDeadline = (exam: Exam) => {
    if (!exam.deadline) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(exam.deadline)
    deadline.setHours(0, 0, 0, 0)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  const filteredExams = exams.filter(exam => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.courseName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || exam.type === typeFilter

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "not-started" && exam.myAttempts === 0) ||
      (statusFilter === "in-progress" && exam.myAttempts > 0 && !exam.passed && exam.myAttempts < exam.maxAttempts) ||
      (statusFilter === "passed" && exam.passed) ||
      (statusFilter === "failed" && !exam.passed && exam.myAttempts >= exam.maxAttempts)

    const matchesCourse = courseFilter === "all" || exam.courseId === courseFilter

    const matchesMonth = exam.deadline && 
      exam.deadline.getMonth() === selectedMonth.getMonth() &&
      exam.deadline.getFullYear() === selectedMonth.getFullYear()

    return matchesSearch && matchesType && matchesStatus && matchesCourse && matchesMonth
  })

  // Stats
  const stats = {
    total: exams.length,
    passed: exams.filter(e => e.passed).length,
    inProgress: exams.filter(e => e.myAttempts > 0 && !e.passed && e.myAttempts < e.maxAttempts).length,
    notStarted: exams.filter(e => e.myAttempts === 0).length,
    certificates: exams.filter(e => e.passed && e.type === "official").length,
  }

  const statsData = [
    { name: "Tổng bài thi", value: stats.total, color: "#1E90FF" },
    { name: "Đã đạt", value: stats.passed, color: "#22c55e" },
    { name: "Đang làm", value: stats.inProgress, color: "#f59e0b" },
    { name: "Chưa thi", value: stats.notStarted, color: "#6b7280" },
    { name: "Chứng chỉ", value: stats.certificates, color: "#9333ea" },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8" 
        style={{ backgroundImage: "url('/image/bg_exams.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/10 dark:bg-black/10"></div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-black/70 dark:text-white/80 drop-shadow mb-1">{greeting}</p>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2 drop-shadow-lg">
                {user?.name || "Học viên"}! 👋
              </h1>
              <p className="text-black/70 dark:text-white/80 drop-shadow">
                Làm bài thi để kiểm tra kiến thức và nhận chứng chỉ
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Month Filter & Other Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
            className="px-3 py-2 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
          >
            ←
          </button>
          <select
            value={`${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-')
              setSelectedMonth(new Date(parseInt(year), parseInt(month)))
            }}
            className="px-4 py-2 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white"
          >
            {[...Array(12)].map((_, i) => {
              const date = new Date(new Date().getFullYear(), i)
              return (
                <option key={i} value={`${date.getFullYear()}-${i}`}>
                  {date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                </option>
              )
            })}
          </select>
          <button
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
            className="px-3 py-2 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
          >
            →
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm bài thi, khóa học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-3 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl text-foreground dark:text-white"
        >
          <option value="all">Tất cả loại</option>
          <option value="practice">Thi thử</option>
          <option value="official">Thi thật</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl text-foreground dark:text-white"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="not-started">Chưa thi</option>
          <option value="in-progress">Đang làm</option>
          <option value="passed">Đã đạt</option>
          <option value="failed">Không đạt</option>
        </select>
      </motion.div>

      {/* Course Filter Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground dark:text-slate-400 mb-4">Lọc theo môn học</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setCourseFilter("all")}
            className={`px-4 py-3 rounded-2xl font-medium transition-all ${
              courseFilter === "all"
                ? "bg-card dark:bg-slate-700 border-2 border-primary"
                : "bg-card dark:bg-slate-900/60 border-2 border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800"
            }`}
          >
            Tất cả
          </button>
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => setCourseFilter(course.id)}
              className={`group relative px-4 py-3 rounded-2xl font-medium transition-all overflow-hidden ${
                courseFilter === course.id
                  ? `bg-gradient-to-r ${course.bgColor} text-white border-2 border-white`
                  : "bg-card dark:bg-slate-900/60 border-2 border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800"
              }`}
            >
              <span className="text-xl mr-2">{course.icon}</span>
              {course.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exams List */}
        <div className="lg:col-span-2 space-y-4">
        {filteredExams.map((exam, idx) => (
          <motion.div
            key={exam.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx }}
          >
            <PremiumCard className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground dark:text-white">{exam.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                      exam.type === "official" 
                        ? "bg-purple-500/10 text-purple-500 border-purple-500/20" 
                        : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    }`}>
                      {exam.type === "official" ? <Award size={12} /> : <ClipboardList size={12} />}
                      {exam.type === "official" ? "Thi thật" : "Thi thử"}
                    </span>
                    {exam.passed && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                        <CheckCircle size={12} />
                        Đã đạt
                      </span>
                    )}
                    {isOverdue(exam) && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                        <AlertCircle size={12} />
                        Muộn
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-3">{exam.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} /> {exam.courseName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer size={14} /> {exam.timeLimit} phút
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} /> {exam.questionsCount} câu
                    </span>
                    <span className="flex items-center gap-1">
                      <Target size={14} /> Cần {exam.passingScore}% để đạt
                    </span>
                    {exam.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> Hạn: {formatDate(exam.deadline)}
                        {daysUntilDeadline(exam) !== null && (
                          <span className={daysUntilDeadline(exam)! < 0 ? "text-red-500 font-medium" : daysUntilDeadline(exam)! < 3 ? "text-orange-500 font-medium" : ""}>
                            {daysUntilDeadline(exam)! < 0 ? `(${Math.abs(daysUntilDeadline(exam)!)} ngày trước)` : `(${daysUntilDeadline(exam)} ngày nữa)`}
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {exam.type === "official" && exam.certificateName && (
                    <p className="mt-2 text-sm text-purple-500 flex items-center gap-1">
                      <Award size={14} />
                      {exam.passed ? "Đã nhận: " : "Nhận khi đạt: "}{exam.certificateName}
                    </p>
                  )}

                  {/* Progress Info */}
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground dark:text-slate-400">
                      Đã thi: {exam.myAttempts}/{exam.maxAttempts} lần
                    </span>
                    {exam.bestScore !== null && (
                      <span className={`font-medium ${exam.passed ? "text-green-500" : "text-red-500"}`}>
                        Điểm cao nhất: {exam.bestScore}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[140px]">
                  {exam.myAttempts < exam.maxAttempts && !exam.passed && (
                    <Link
                      href={`/exams/${exam.id}/take`}
                      className="px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <PlayCircle size={18} />
                      {exam.myAttempts === 0 ? "Bắt đầu thi" : "Thi lại"}
                    </Link>
                  )}
                  {exam.passed && (
                    <Link
                      href={`/exams/${exam.id}/result`}
                      className="px-4 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Xem kết quả
                    </Link>
                  )}
                  {!exam.passed && exam.myAttempts >= exam.maxAttempts && (
                    <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-center text-sm">
                      Hết lượt thi
                    </div>
                  )}
                  {exam.myAttempts > 0 && (
                    <Link
                      href={`/exams/${exam.id}/history`}
                      className="px-4 py-2 border border-border dark:border-slate-700 rounded-xl text-sm hover:bg-secondary dark:hover:bg-slate-800 transition-colors text-center"
                    >
                      Lịch sử thi
                    </Link>
                  )}
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        ))}

        {filteredExams.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FileText size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">Không tìm thấy bài thi</h3>
            <p className="text-muted-foreground dark:text-slate-400">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
          </motion.div>
        )}
        </div>

        {/* Sidebar - Upcoming Exams */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-foreground dark:text-white mb-6 flex items-center gap-2">
              <Calendar size={20} />
              Sắp tới
            </h3>
            <div className="space-y-4">
              {exams
                .filter(e => e.deadline && daysUntilDeadline(e) !== null && daysUntilDeadline(e)! >= 0)
                .sort((a, b) => {
                  const daysA = daysUntilDeadline(a) || 999
                  const daysB = daysUntilDeadline(b) || 999
                  return daysA - daysB
                })
                .slice(0, 6)
                .map((exam) => (
                  <Link
                    key={exam.id}
                    href={`/exams/${exam.id}`}
                    className="block p-3 bg-secondary/50 dark:bg-slate-800/50 border border-border/50 dark:border-slate-700/50 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-sm text-foreground dark:text-white line-clamp-2">{exam.title}</p>
                      {daysUntilDeadline(exam)! < 3 && daysUntilDeadline(exam)! >= 0 && (
                        <span className="flex-shrink-0 px-2 py-1 bg-orange-500/10 text-orange-500 text-xs font-medium rounded">
                          Sắp
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground dark:text-slate-400">
                        {formatDate(exam.deadline!)}
                      </span>
                      <span className="text-xs font-medium text-primary dark:text-accent">
                        {daysUntilDeadline(exam)} ngày
                      </span>
                    </div>
                  </Link>
                ))}
              
              {exams.filter(e => e.deadline && daysUntilDeadline(e) !== null && daysUntilDeadline(e)! >= 0).length === 0 && (
                <div className="text-center py-8">
                  <Calendar size={32} className="mx-auto text-muted-foreground dark:text-slate-600 mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    Không có bài thi sắp tới
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Overdue Exams */}
          <div className="bg-red-500/5 dark:bg-red-900/10 border border-red-500/20 rounded-2xl p-6 mt-6">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              Quá hạn
            </h3>
            <div className="space-y-3">
              {exams
                .filter(e => isOverdue(e))
                .map((exam) => (
                  <div
                    key={exam.id}
                    className="p-3 bg-red-500/10 rounded-lg border border-red-500/20"
                  >
                    <p className="font-medium text-sm text-red-600 dark:text-red-400 line-clamp-2">{exam.title}</p>
                    <p className="text-xs text-red-500/70 mt-1">
                      Hạn: {formatDate(exam.deadline!)}
                    </p>
                  </div>
                ))}
              
              {exams.filter(e => isOverdue(e)).length === 0 && (
                <p className="text-sm text-muted-foreground dark:text-slate-400 text-center py-4">
                  Không có bài thi quá hạn
                </p>
              )}
            </div>
          </div>

          {/* Stats Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 mt-6"
          >
            <h3 className="text-lg font-bold text-foreground dark:text-white mb-4">Thống kê tổng quát</h3>
            <ResponsiveContainer width="100%" height={380}>
              <PieChart>
                <Pie
                  data={statsData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value} />
                <Legend wrapperStyle={{ paddingTop: "30px", fontSize: "13px" }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

