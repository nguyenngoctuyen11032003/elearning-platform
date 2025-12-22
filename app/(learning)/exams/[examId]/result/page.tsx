"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  ArrowLeft,
  Target,
  FileText,
  Trophy,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { PremiumCard } from "@/components/ui/premium-card"

interface QuestionResult {
  id: string
  question: string
  type: string
  yourAnswer: string
  correctAnswer: string
  isCorrect: boolean
  points: number
  earnedPoints: number
  explanation?: string
}

interface ExamResult {
  examId: string
  examTitle: string
  courseName: string
  teacherName: string
  type: "practice" | "official"
  score: number
  passingScore: number
  passed: boolean
  earnedPoints: number
  totalPoints: number
  timeSpent: number // seconds
  questionsCount: number
  correctAnswers: number
  attemptNumber: number
  maxAttempts: number
  completedAt: string
  certificateId?: string
  certificateName?: string
  questions: QuestionResult[]
}

// Mock result data
const mockResult: ExamResult = {
  examId: "1",
  examTitle: "Bài thi cuối khóa Next.js",
  courseName: "Lập trình Next.js từ cơ bản đến nâng cao",
  teacherName: "Nguyễn Ngọc Tuyền",
  type: "official",
  score: 85,
  passingScore: 70,
  passed: true,
  earnedPoints: 85,
  totalPoints: 100,
  timeSpent: 4520, // 75 minutes 20 seconds
  questionsCount: 10,
  correctAnswers: 8,
  attemptNumber: 1,
  maxAttempts: 2,
  completedAt: "2025-01-15T10:30:00",
  certificateId: "cert-001",
  certificateName: "Chứng chỉ Next.js Master",
  questions: [
    {
      id: "q1",
      question: "Next.js 13+ sử dụng hệ thống routing nào mặc định?",
      type: "multiple_choice",
      yourAnswer: "App Router",
      correctAnswer: "App Router",
      isCorrect: true,
      points: 10,
      earnedPoints: 10,
      explanation: "App Router là hệ thống routing mới trong Next.js 13+, thay thế Pages Router cũ."
    },
    {
      id: "q2",
      question: "Server Components trong Next.js giúp làm gì?",
      type: "multiple_choice",
      yourAnswer: "Giảm bundle size và cải thiện performance",
      correctAnswer: "Giảm bundle size và cải thiện performance",
      isCorrect: true,
      points: 10,
      earnedPoints: 10,
      explanation: "Server Components render trên server, không gửi JavaScript xuống client."
    },
    {
      id: "q3",
      question: "'use client' directive bắt buộc phải có ở mọi component trong Next.js App Router",
      type: "true_false",
      yourAnswer: "Sai",
      correctAnswer: "Sai",
      isCorrect: true,
      points: 10,
      earnedPoints: 10,
      explanation: "Chỉ Client Components mới cần 'use client', Server Components là mặc định."
    },
    {
      id: "q4",
      question: "File nào dùng để định nghĩa layout trong App Router?",
      type: "multiple_choice",
      yourAnswer: "layout.tsx",
      correctAnswer: "layout.tsx",
      isCorrect: true,
      points: 10,
      earnedPoints: 10
    },
    {
      id: "q5",
      question: "Cách fetch data phổ biến trong Server Components là gì?",
      type: "multiple_choice",
      yourAnswer: "useEffect",
      correctAnswer: "async/await trực tiếp",
      isCorrect: false,
      points: 10,
      earnedPoints: 0,
      explanation: "Trong Server Components, bạn có thể dùng async/await trực tiếp để fetch data."
    },
    {
      id: "q6",
      question: "Next.js hỗ trợ Static Site Generation (SSG)",
      type: "true_false",
      yourAnswer: "Đúng",
      correctAnswer: "Đúng",
      isCorrect: true,
      points: 10,
      earnedPoints: 10
    },
    {
      id: "q7",
      question: "Middleware trong Next.js chạy ở đâu?",
      type: "multiple_choice",
      yourAnswer: "Edge Runtime",
      correctAnswer: "Edge Runtime",
      isCorrect: true,
      points: 10,
      earnedPoints: 10
    },
    {
      id: "q8",
      question: "Hook để lấy search params trong Client Component là: use______Params()",
      type: "fill_in",
      yourAnswer: "Search",
      correctAnswer: "Search",
      isCorrect: true,
      points: 10,
      earnedPoints: 10,
      explanation: "useSearchParams() hook được dùng để đọc query string trong URL."
    },
    {
      id: "q9",
      question: "Cách tạo API route trong App Router là gì?",
      type: "multiple_choice",
      yourAnswer: "Tạo file api.ts trong app/",
      correctAnswer: "Tạo file route.ts trong thư mục api/",
      isCorrect: false,
      points: 10,
      earnedPoints: 0,
      explanation: "Trong App Router, API routes được tạo bằng file route.ts trong app/api/."
    },
    {
      id: "q10",
      question: "Image component của Next.js tự động tối ưu hóa hình ảnh",
      type: "true_false",
      yourAnswer: "Đúng",
      correctAnswer: "Đúng",
      isCorrect: true,
      points: 10,
      earnedPoints: 10
    },
  ]
}

export default function ExamResultPage() {
  const params = useParams()
  const examId = params.examId as string
  const [result] = useState<ExamResult>(mockResult)
  const [showAnswers, setShowAnswers] = useState(false)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  // Log examId for debugging
  useEffect(() => {
    console.log("Viewing result for exam:", examId)
  }, [examId])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs} giờ ${mins} phút ${secs} giây`
    }
    return `${mins} phút ${secs} giây`
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link
          href="/exams"
          className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Kết quả bài thi</h1>
          <p className="text-muted-foreground dark:text-slate-400">{result.examTitle}</p>
        </div>
      </motion.div>

      {/* Result Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <PremiumCard className={`p-8 text-center ${result.passed ? "border-green-500/30" : "border-red-500/30"}`}>
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
            result.passed ? "bg-green-500/20" : "bg-red-500/20"
          }`}>
            {result.passed ? (
              <Trophy size={48} className="text-green-500" />
            ) : (
              <XCircle size={48} className="text-red-500" />
            )}
          </div>

          <h2 className={`text-4xl font-bold mb-2 ${result.passed ? "text-green-500" : "text-red-500"}`}>
            {result.score}%
          </h2>
          <p className={`text-lg font-medium mb-4 ${result.passed ? "text-green-500" : "text-red-500"}`}>
            {result.passed ? "Chúc mừng! Bạn đã đạt" : "Rất tiếc! Bạn chưa đạt"}
          </p>
          <p className="text-muted-foreground dark:text-slate-400 mb-6">
            Điểm cần đạt: {result.passingScore}% • Điểm của bạn: {result.earnedPoints}/{result.totalPoints}
          </p>

          {result.passed && result.type === "official" && result.certificateName && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-purple-500 mb-2">
                <Award size={24} />
                <span className="font-semibold">{result.certificateName}</span>
              </div>
              <p className="text-purple-400 text-sm">Chứng chỉ đã được cấp vào tài khoản của bạn</p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            {result.passed && result.certificateId && (
              <Link
                href={`/certificates/${result.certificateId}`}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <Award size={18} />
                Xem chứng chỉ
              </Link>
            )}
            <Link
              href="/exams"
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Quay lại danh sách
            </Link>
            {!result.passed && result.attemptNumber < result.maxAttempts && (
              <Link
                href={`/exams/${result.examId}/take`}
                className="px-6 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
              >
                Thi lại
              </Link>
            )}
          </div>
        </PremiumCard>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground dark:text-white">{result.questionsCount}</p>
              <p className="text-xs text-muted-foreground">Tổng câu hỏi</p>
            </div>
          </div>
        </div>
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground dark:text-white">{result.correctAnswers}</p>
              <p className="text-xs text-muted-foreground">Trả lời đúng</p>
            </div>
          </div>
        </div>
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground dark:text-white">{result.questionsCount - result.correctAnswers}</p>
              <p className="text-xs text-muted-foreground">Trả lời sai</p>
            </div>
          </div>
        </div>
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock size={20} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground dark:text-white">{formatTime(result.timeSpent)}</p>
              <p className="text-xs text-muted-foreground">Thời gian làm bài</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Review Answers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="w-full p-6 flex items-center justify-between hover:bg-secondary/50 dark:hover:bg-slate-800/50 transition-colors rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <Target size={24} className="text-primary" />
              <span className="font-semibold text-foreground dark:text-white">Xem lại đáp án</span>
            </div>
            {showAnswers ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {showAnswers && (
            <div className="px-6 pb-6 space-y-4">
              {result.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`border rounded-xl overflow-hidden ${
                    q.isCorrect ? "border-green-500/30" : "border-red-500/30"
                  }`}
                >
                  <button
                    onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        q.isCorrect ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-foreground dark:text-white text-left">{q.question}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${q.isCorrect ? "text-green-500" : "text-red-500"}`}>
                        {q.earnedPoints}/{q.points}
                      </span>
                      {q.isCorrect ? (
                        <CheckCircle size={18} className="text-green-500" />
                      ) : (
                        <XCircle size={18} className="text-red-500" />
                      )}
                    </div>
                  </button>

                  {expandedQuestion === q.id && (
                    <div className="px-4 pb-4 pt-0 space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className={`p-3 rounded-lg ${
                          q.isCorrect ? "bg-green-500/10" : "bg-red-500/10"
                        }`}>
                          <p className="text-xs text-muted-foreground mb-1">Câu trả lời của bạn</p>
                          <p className={`font-medium ${q.isCorrect ? "text-green-500" : "text-red-500"}`}>
                            {q.yourAnswer}
                          </p>
                        </div>
                        {!q.isCorrect && (
                          <div className="p-3 rounded-lg bg-green-500/10">
                            <p className="text-xs text-muted-foreground mb-1">Đáp án đúng</p>
                            <p className="font-medium text-green-500">{q.correctAnswer}</p>
                          </div>
                        )}
                      </div>
                      {q.explanation && (
                        <div className="p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Giải thích</p>
                          <p className="text-sm text-foreground dark:text-white">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

