"use client"

import { useState } from "react"
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
  FileText
} from "lucide-react"
import { PremiumCard } from "@/components/ui/premium-card"
import { PageHero } from "@/components/ui/page-hero"

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
    certificateName: "Chứng chỉ Next.js Master"
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
    passed: true
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
    certificateName: "Chứng chỉ UI/UX Designer"
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
    passed: false
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
    certificateName: "Chứng chỉ Node.js Developer"
  },
]

export default function StudentExamsPage() {
  const [exams] = useState<Exam[]>(mockExams)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

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

    return matchesSearch && matchesType && matchesStatus
  })

  // Stats
  const stats = {
    total: exams.length,
    passed: exams.filter(e => e.passed).length,
    inProgress: exams.filter(e => e.myAttempts > 0 && !e.passed && e.myAttempts < e.maxAttempts).length,
    notStarted: exams.filter(e => e.myAttempts === 0).length,
    certificates: exams.filter(e => e.passed && e.type === "official").length,
  }

  return (
    <div className="space-y-8">
      <PageHero
        title="Bài thi"
        subtitle="Làm bài thi để kiểm tra kiến thức và nhận chứng chỉ"
        bgImage="/image/bg_exams.png"
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <FileText size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground dark:text-white">{stats.total}</p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Tổng bài thi</p>
                </div>
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground dark:text-white">{stats.passed}</p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Đã đạt</p>
                </div>
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground dark:text-white">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Đang làm</p>
                </div>
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Target size={20} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground dark:text-white">{stats.notStarted}</p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Chưa thi</p>
                </div>
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.65s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Trophy size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground dark:text-white">{stats.certificates}</p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Chứng chỉ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageHero>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4"
      >
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

      {/* Exams List */}
      <div className="space-y-4">
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
    </div>
  )
}

