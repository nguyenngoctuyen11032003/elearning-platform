"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Award,
  Timer,
  ClipboardList,
  BookOpen,
  Users,
  BarChart3,
  Trophy,
  Target,
  Brain
} from "lucide-react"
import Link from "next/link"

interface Question {
  id: string
  question: string
  image?: string // Thêm trường image giống trang teacher
  type: "multiple-choice" | "true-false" | "essay"
  options?: string[]
  correctAnswer: string | number
  explanation?: string
  points: number
  order: number
}

interface ExamDetail {
  id: string
  title: string
  description: string
  course: string
  courseId: string
  teacher: string
  teacherEmail: string
  teacherId: string
  type: "practice" | "official"
  status: "pending" | "approved" | "rejected" | "draft"
  createdAt: string
  updatedAt: string
  timeLimit: number
  passingScore: number
  maxAttempts: number
  questionsCount: number
  totalPoints: number
  certificateTemplate?: string
  rejectionReason?: string
  attemptCount: number
  questions: Question[]
  instructions: string[]
  passRate: number
  averageScore: number
}

// Mock data
const mockExamDetail: ExamDetail = {
  id: "1",
  title: "Bài thi cuối khóa Next.js",
  description: "Bài thi đánh giá kiến thức toàn diện về Next.js, App Router và Server Components",
  course: "Lập trình Next.js từ cơ bản đến nâng cao",
  courseId: "COURSE001",
  teacher: "Nguyễn Ngọc Tuyền",
  teacherEmail: "tuyen@example.com",
  teacherId: "INST001",
  type: "official",
  status: "approved",
  createdAt: "2024-01-20T10:30:00",
  updatedAt: "2024-03-15T14:20:00",
  timeLimit: 90,
  passingScore: 70,
  maxAttempts: 2,
  questionsCount: 50,
  totalPoints: 100,
  certificateTemplate: "Chứng chỉ Next.js Master",
  attemptCount: 245,
  passRate: 78,
  averageScore: 75.5,
  instructions: [
    "Đọc kỹ từng câu hỏi trước khi trả lời",
    "Bạn có 90 phút để hoàn thành bài thi",
    "Mỗi câu hỏi có một đáp án đúng duy nhất",
    "Bạn phải đạt ít nhất 70% để vượt qua bài thi",
    "Bạn có thể làm lại bài thi tối đa 2 lần"
  ],
  questions: [
    {
      id: "q1",
      question: "Next.js là gì?",
      type: "multiple-choice",
      options: [
        "Một thư viện JavaScript để xây dựng giao diện người dùng",
        "Một framework React để xây dựng ứng dụng web full-stack",
        "Một công cụ CSS-in-JS",
        "Một database NoSQL"
      ],
      correctAnswer: 1,
      explanation: "Next.js là một framework React mạnh mẽ, cung cấp các tính năng như SSR, SSG, và API routes để xây dựng ứng dụng web full-stack.",
      points: 2,
      order: 1
    },
    {
      id: "q2",
      question: "App Router trong Next.js 14 sử dụng cấu trúc thư mục nào?",
      type: "multiple-choice",
      options: [
        "pages/",
        "app/",
        "src/",
        "routes/"
      ],
      correctAnswer: 1,
      explanation: "App Router mới trong Next.js 13+ sử dụng thư mục 'app/' thay vì 'pages/' của Pages Router.",
      points: 2,
      order: 2
    },
    {
      id: "q3",
      question: "Server Components có thể sử dụng React hooks như useState và useEffect không?",
      type: "true-false",
      options: ["Đúng", "Sai"],
      correctAnswer: 1,
      explanation: "Server Components không thể sử dụng React hooks như useState, useEffect vì chúng chỉ chạy trên server, không có khả năng tương tác.",
      points: 2,
      order: 3
    },
    {
      id: "q4",
      question: "Để tạo một route động trong App Router, bạn cần đặt tên thư mục như thế nào?",
      type: "multiple-choice",
      options: [
        "[id]",
        "{id}",
        ":id",
        "$id"
      ],
      correctAnswer: 0,
      explanation: "Trong App Router, dynamic routes được tạo bằng cách đặt tên thư mục trong dấu ngoặc vuông như [id] hoặc [slug].",
      points: 2,
      order: 4
    },
    {
      id: "q5",
      question: "Server Actions trong Next.js được khai báo bằng directive nào?",
      type: "multiple-choice",
      options: [
        "'use client'",
        "'use server'",
        "'use action'",
        "'use async'"
      ],
      correctAnswer: 1,
      explanation: "Server Actions được đánh dấu bằng directive 'use server' ở đầu function hoặc file.",
      points: 2,
      order: 5
    },
    {
      id: "q6",
      question: "File layout.tsx trong App Router có tác dụng gì?",
      type: "multiple-choice",
      options: [
        "Định nghĩa các API routes",
        "Định nghĩa bố cục chung cho các trang con",
        "Xử lý lỗi 404",
        "Cấu hình metadata"
      ],
      correctAnswer: 1,
      explanation: "File layout.tsx định nghĩa UI chung được chia sẻ giữa các route, giúp tránh re-render không cần thiết.",
      points: 2,
      order: 6
    },
    {
      id: "q7",
      question: "Next.js hỗ trợ những phương pháp rendering nào?",
      type: "multiple-choice",
      options: [
        "Chỉ SSR",
        "Chỉ SSG",
        "SSR, SSG, ISR, và CSR",
        "Chỉ CSR"
      ],
      correctAnswer: 2,
      explanation: "Next.js linh hoạt hỗ trợ nhiều phương pháp rendering: SSR (Server-Side Rendering), SSG (Static Site Generation), ISR (Incremental Static Regeneration), và CSR (Client-Side Rendering).",
      points: 2,
      order: 7
    },
    {
      id: "q8",
      question: "Để tối ưu hóa hình ảnh trong Next.js, bạn nên sử dụng component nào?",
      type: "multiple-choice",
      options: [
        "<img>",
        "<Image>",
        "<Picture>",
        "<Photo>"
      ],
      correctAnswer: 1,
      explanation: "Next.js cung cấp component <Image> từ 'next/image' để tự động tối ưu hóa hình ảnh với lazy loading, responsive images, và format hiện đại như WebP.",
      points: 2,
      order: 8
    }
  ]
}

export default function AdminExamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [exam] = useState<ExamDetail>(mockExamDetail)
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "attempts" | "analytics">("overview")
  // Chỉ cho phép xem, không cho phép chỉnh sửa/xóa
  const isReadonly = true;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { label: "Đã duyệt", icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
      pending: { label: "Chờ duyệt", icon: Clock, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" },
      rejected: { label: "Từ chối", icon: XCircle, color: "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
      draft: { label: "Bản nháp", icon: FileText, color: "text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800" },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon size={16} />
        {config.label}
      </span>
    )
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple-choice": return "Trắc nghiệm"
      case "true-false": return "Đúng/Sai"
      case "essay": return "Tự luận"
      default: return type
    }
  }

  const normalizeUploadedText = (value?: string) => {
    if (!value) return ""
    let text = value
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")

    if (typeof window !== "undefined") {
      const textarea = document.createElement("textarea")
      textarea.innerHTML = text
      text = textarea.value
    }

    return text
  }

  return (
    <div className="p-6 md:p-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          {/* Ẩn nút chỉnh sửa/xóa nếu chỉ xem */}
          {!isReadonly && (
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-secondary dark:bg-slate-800 hover:bg-secondary/80 dark:hover:bg-slate-700 text-foreground dark:text-white rounded-lg transition-smooth flex items-center gap-2">
                <Edit size={18} />
                Chỉnh sửa
              </button>
              <button className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-smooth flex items-center gap-2">
                <Trash2 size={18} />
                Xóa
              </button>
            </div>
          )}
        </div>

        {/* Exam Header */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground dark:text-white">{exam.title}</h1>
                {exam.type === "official" && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-full">
                    Chính thức
                  </span>
                )}
              </div>
              <p className="text-muted-foreground dark:text-slate-400 mb-3">{exam.description}</p>
              <Link href={`/admin/courses/${exam.courseId}`} className="text-primary dark:text-accent hover:underline text-sm">
                📚 {exam.course}
              </Link>
            </div>
            {getStatusBadge(exam.status)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
              <ClipboardList size={20} className="text-primary dark:text-accent" />
              <div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Số câu hỏi</p>
                <p className="font-semibold text-foreground dark:text-white">{exam.questionsCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
              <Timer size={20} className="text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Thời gian</p>
                <p className="font-semibold text-foreground dark:text-white">{exam.timeLimit} phút</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
              <Target size={20} className="text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Điểm đạt</p>
                <p className="font-semibold text-foreground dark:text-white">{exam.passingScore}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
              <Users size={20} className="text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Lượt thi</p>
                <p className="font-semibold text-foreground dark:text-white">{exam.attemptCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
              <Trophy size={20} className="text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Tỷ lệ đạt</p>
                <p className="font-semibold text-foreground dark:text-white">{exam.passRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border dark:border-slate-800">
          <div className="flex gap-6">
            {["overview", "questions", "attempts", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary dark:border-accent text-primary dark:text-accent font-semibold"
                    : "border-transparent text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                }`}
              >
                {tab === "overview" && "Tổng quan"}
                {tab === "questions" && "Câu hỏi"}
                {tab === "attempts" && "Bài thi"}
                {tab === "analytics" && "Phân tích"}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Teacher Info */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-4">Giảng viên</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
                    {exam.teacher.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground dark:text-white">{exam.teacher}</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{exam.teacherEmail}</p>
                    <p className="text-sm text-primary dark:text-accent">ID: {exam.teacherId}</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={24} className="text-primary dark:text-accent" />
                  Hướng dẫn làm bài
                </h2>
                <ul className="space-y-3">
                  {exam.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground dark:text-slate-400">{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rejection Reason */}
              {exam.status === "rejected" && exam.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-3">
                    <AlertCircle size={24} />
                    <h3 className="font-semibold text-lg">Lý do từ chối</h3>
                  </div>
                  <p className="text-red-600 dark:text-red-300">{exam.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Exam Settings */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-foreground dark:text-white">Cài đặt</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Loại bài thi</span>
                    <span className="font-semibold text-foreground dark:text-white capitalize">{exam.type === 'official' ? 'Chính thức' : 'Luyện tập'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Số lần làm tối đa</span>
                    <span className="font-semibold text-foreground dark:text-white">{exam.maxAttempts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Tổng điểm</span>
                    <span className="font-semibold text-foreground dark:text-white">{exam.totalPoints}</span>
                  </div>
                  {exam.certificateTemplate && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground dark:text-slate-400">Chứng chỉ</span>
                      <Award size={20} className="text-yellow-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Exam Info */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-foreground dark:text-white">Thông tin</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Tạo lúc</span>
                    <span className="font-semibold text-foreground dark:text-white text-sm">
                      {new Date(exam.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Cập nhật</span>
                    <span className="font-semibold text-foreground dark:text-white text-sm">
                      {new Date(exam.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Điểm TB</span>
                    <span className="font-semibold text-foreground dark:text-white">{exam.averageScore.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground dark:text-white">Danh sách câu hỏi ({exam.questions.length})</h2>
              <span className="text-sm text-muted-foreground dark:text-slate-400">Tổng điểm: {exam.totalPoints}</span>
            </div>
            <div className="space-y-6">
              {exam.questions.map((question, index) => (
                <div key={question.id} className="border border-border dark:border-slate-800 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 dark:bg-accent/10 flex items-center justify-center">
                      <span className="text-primary dark:text-accent font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex flex-col gap-2">
                          <h3 className="text-lg font-semibold text-foreground dark:text-white whitespace-pre-wrap break-words leading-relaxed">
                            {normalizeUploadedText(question.question)}
                          </h3>
                          {/* Render ảnh nếu có */}
                          {question.image && (
                            <img src={question.image} alt="Minh họa câu hỏi" className="max-w-full rounded border border-border dark:border-slate-800 mt-2" />
                          )}  
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                            {getQuestionTypeLabel(question.type)}
                          </span>
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                            {question.points} điểm
                          </span>
                        </div>
                      </div>

                      {question.options && (
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, optionIndex) => (
                            <label
                              key={optionIndex}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none ${
                                question.correctAnswer === optionIndex
                                  ? "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700"
                                  : "bg-secondary/30 dark:bg-slate-800/30 border-border dark:border-slate-800"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question_${index}`}
                                checked={question.correctAnswer === optionIndex}
                                readOnly
                                className="form-radio h-5 w-5 text-green-600 focus:ring-green-500"
                              />
                              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                                question.correctAnswer === optionIndex
                                  ? "bg-green-500 text-white"
                                  : "bg-secondary dark:bg-slate-700 text-muted-foreground dark:text-slate-400"
                              }`}>
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                                <span
                                  className={`${question.correctAnswer === optionIndex ? "text-foreground dark:text-white font-medium" : "text-muted-foreground dark:text-slate-400"} whitespace-pre-wrap break-words leading-relaxed`}
                                >
                                  {normalizeUploadedText(option)}
                              </span>
                              {question.correctAnswer === optionIndex && (
                                <CheckCircle size={18} className="ml-auto text-green-500" />
                              )}
                            </label>
                          ))}
                        </div>
                      )}

                      {question.explanation && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <Brain size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">Giải thích</p>
                              <p className="text-sm text-blue-600 dark:text-blue-300 whitespace-pre-wrap break-words leading-relaxed">
                                {normalizeUploadedText(question.explanation)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "attempts" && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">Lịch sử làm bài</h2>
            <p className="text-muted-foreground dark:text-slate-400 mb-6">Có {exam.attemptCount} lượt làm bài thi này.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Học viên</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Email</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Điểm</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Kết quả</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Thời gian</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Ngày làm</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 1, student: 'Nguyễn Văn A', email: 'nguyenvana@email.com', score: 85, passed: true, duration: 75, date: '2024-03-20 14:30' },
                    { id: 2, student: 'Trần Thị B', email: 'tranthib@email.com', score: 92, passed: true, duration: 68, date: '2024-03-20 10:15' },
                    { id: 3, student: 'Lê Văn C', email: 'levanc@email.com', score: 65, passed: false, duration: 88, date: '2024-03-19 16:45' },
                    { id: 4, student: 'Phạm Thị D', email: 'phamthid@email.com', score: 78, passed: true, duration: 70, date: '2024-03-19 09:20' },
                    { id: 5, student: 'Hoàng Văn E', email: 'hoangvane@email.com', score: 88, passed: true, duration: 65, date: '2024-03-18 15:30' },
                    { id: 6, student: 'Vũ Thị F', email: 'vuthif@email.com', score: 55, passed: false, duration: 90, date: '2024-03-18 11:00' },
                    { id: 7, student: 'Đặng Văn G', email: 'dangvang@email.com', score: 94, passed: true, duration: 62, date: '2024-03-17 14:15' },
                    { id: 8, student: 'Bùi Thị H', email: 'buithih@email.com', score: 72, passed: true, duration: 82, date: '2024-03-17 10:30' },
                  ].map((attempt) => (
                    <tr key={attempt.id} className="border-b border-border dark:border-slate-800 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-foreground dark:text-white">{attempt.student}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-400">{attempt.email}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          {attempt.score}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {attempt.passed ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Đạt
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            <XCircle className="w-3 h-3 mr-1" />
                            Không đạt
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-muted-foreground dark:text-slate-400">
                        {attempt.duration} phút
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-400">{attempt.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground dark:text-slate-400">Hiển thị 8 / {exam.attemptCount} kết quả</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm border border-border dark:border-slate-700 rounded-lg hover:bg-muted dark:hover:bg-slate-800 transition-colors">Trước</button>
                <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">1</button>
                <button className="px-4 py-2 text-sm border border-border dark:border-slate-700 rounded-lg hover:bg-muted dark:hover:bg-slate-800 transition-colors">2</button>
                <button className="px-4 py-2 text-sm border border-border dark:border-slate-700 rounded-lg hover:bg-muted dark:hover:bg-slate-800 transition-colors">3</button>
                <button className="px-4 py-2 text-sm border border-border dark:border-slate-700 rounded-lg hover:bg-muted dark:hover:bg-slate-800 transition-colors">Sau</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <Users className="text-blue-500 mb-3" size={32} />
                <p className="text-3xl font-bold text-foreground dark:text-white">{exam.attemptCount}</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Tổng lượt thi</p>
              </div>
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <Trophy className="text-green-500 mb-3" size={32} />
                <p className="text-3xl font-bold text-foreground dark:text-white">{exam.passRate}%</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Tỷ lệ đạt</p>
              </div>
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <BarChart3 className="text-purple-500 mb-3" size={32} />
                <p className="text-3xl font-bold text-foreground dark:text-white">{exam.averageScore.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Điểm trung bình</p>
              </div>
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <Target className="text-orange-500 mb-3" size={32} />
                <p className="text-3xl font-bold text-foreground dark:text-white">{exam.passingScore}%</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Điểm chuẩn</p>
              </div>
            </div>
            
            {/* Score Distribution Chart */}
            <div className="mt-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">Phân bố điểm số</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground dark:text-slate-400">90-100 điểm</span>
                    <span className="text-foreground dark:text-white font-semibold">32 học viên (13%)</span>
                  </div>
                  <div className="w-full bg-muted dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full" style={{ width: '13%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground dark:text-slate-400">80-89 điểm</span>
                    <span className="text-foreground dark:text-white font-semibold">78 học viên (32%)</span>
                  </div>
                  <div className="w-full bg-muted dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground dark:text-slate-400">70-79 điểm</span>
                    <span className="text-foreground dark:text-white font-semibold">81 học viên (33%)</span>
                  </div>
                  <div className="w-full bg-muted dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full" style={{ width: '33%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground dark:text-slate-400">60-69 điểm</span>
                    <span className="text-foreground dark:text-white font-semibold">39 học viên (16%)</span>
                  </div>
                  <div className="w-full bg-muted dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full" style={{ width: '16%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground dark:text-slate-400">Dưới 60 điểm</span>
                    <span className="text-foreground dark:text-white font-semibold">15 học viên (6%)</span>
                  </div>
                  <div className="w-full bg-muted dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 to-red-700 h-full rounded-full" style={{ width: '6%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Over Time */}
            <div className="mt-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">Xu hướng làm bài theo thời gian</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {[
                  { month: 'T1', attempts: 25, avgScore: 68 },
                  { month: 'T2', attempts: 32, avgScore: 72 },
                  { month: 'T3', attempts: 45, avgScore: 75 },
                  { month: 'T4', attempts: 38, avgScore: 74 },
                  { month: 'T5', attempts: 52, avgScore: 76 },
                  { month: 'T6', attempts: 53, avgScore: 75.5 },
                ].map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs text-muted-foreground dark:text-slate-400 mb-1">{data.avgScore}%</div>
                    <div 
                      className="w-full bg-gradient-to-t from-primary to-blue-400 dark:from-blue-600 dark:to-blue-400 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                      style={{ height: `${(data.attempts / 53) * 100}%` }}
                      title={`${data.attempts} lượt thi, điểm TB: ${data.avgScore}%`}
                    ></div>
                    <div className="text-xs font-medium text-foreground dark:text-white">{data.month}</div>
                    <div className="text-xs text-muted-foreground dark:text-slate-400">{data.attempts}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border dark:border-slate-800 flex justify-between text-sm">
                <span className="text-muted-foreground dark:text-slate-400">Số lượng lượt thi</span>
                <span className="text-muted-foreground dark:text-slate-400">Điểm trung bình</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
