"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  Circle,
  Send,
  Volume2,
  VolumeX
} from "lucide-react"

interface Question {
  id: string
  type: "multiple_choice" | "true_false" | "fill_in"
  question: string
  options: string[]
  points: number
}

interface ExamData {
  id: string
  title: string
  timeLimit: number
  questionsCount: number
  passingScore: number
  questions: Question[]
}

// Mock exam data
const mockExamData: ExamData = {
  id: "1",
  title: "Bài thi cuối khóa Next.js",
  timeLimit: 90,
  questionsCount: 10,
  passingScore: 70,
  questions: [
    {
      id: "q1",
      type: "multiple_choice",
      question: "Next.js 13+ sử dụng hệ thống routing nào mặc định?",
      options: ["Pages Router", "App Router", "React Router", "Express Router"],
      points: 10
    },
    {
      id: "q2",
      type: "multiple_choice",
      question: "Server Components trong Next.js giúp làm gì?",
      options: [
        "Render trên client",
        "Giảm bundle size và cải thiện performance",
        "Chỉ dùng cho form",
        "Không có tác dụng gì"
      ],
      points: 10
    },
    {
      id: "q3",
      type: "true_false",
      question: "'use client' directive bắt buộc phải có ở mọi component trong Next.js App Router",
      options: ["Đúng", "Sai"],
      points: 10
    },
    {
      id: "q4",
      type: "multiple_choice",
      question: "File nào dùng để định nghĩa layout trong App Router?",
      options: ["_app.tsx", "layout.tsx", "page.tsx", "template.tsx"],
      points: 10
    },
    {
      id: "q5",
      type: "multiple_choice",
      question: "Cách fetch data phổ biến trong Server Components là gì?",
      options: ["useEffect", "SWR", "async/await trực tiếp", "Redux"],
      points: 10
    },
    {
      id: "q6",
      type: "true_false",
      question: "Next.js hỗ trợ Static Site Generation (SSG)",
      options: ["Đúng", "Sai"],
      points: 10
    },
    {
      id: "q7",
      type: "multiple_choice",
      question: "Middleware trong Next.js chạy ở đâu?",
      options: ["Client-side", "Edge Runtime", "Node.js Runtime only", "Browser"],
      points: 10
    },
    {
      id: "q8",
      type: "fill_in",
      question: "Hook để lấy search params trong Client Component là: use______Params()",
      options: [],
      points: 10
    },
    {
      id: "q9",
      type: "multiple_choice",
      question: "Cách tạo API route trong App Router là gì?",
      options: [
        "Tạo file api.ts trong app/",
        "Tạo file route.ts trong thư mục api/",
        "Tạo file handler.ts",
        "Không hỗ trợ API routes"
      ],
      points: 10
    },
    {
      id: "q10",
      type: "true_false",
      question: "Image component của Next.js tự động tối ưu hóa hình ảnh",
      options: ["Đúng", "Sai"],
      points: 10
    },
  ]
}

export default function TakeExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string

  const [examData] = useState<ExamData>(mockExamData)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(mockExamData.timeLimit * 60) // seconds
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReadingQuestion, setIsReadingQuestion] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    setSpeechSupported("speechSynthesis" in window)
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit(true)
          return 0
        }
        // Warning at 5 minutes
        if (prev === 300) {
          setShowTimeWarning(true)
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const handleSubmit = async (auto: boolean = false) => {
    setIsSubmitting(true)
    try {
      // API call to submit exam
      const submissionData = {
        examId,
        answers,
        timeSpent: examData.timeLimit * 60 - timeRemaining,
        autoSubmit: auto
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Navigate to result page
      router.push(`/exams/${examId}/result`)
    } catch (error) {
      console.error("Error submitting exam:", error)
      setIsSubmitting(false)
    }
  }

  const readFillInQuestion = () => {
    if (!speechSupported || question.type !== "fill_in") return

    const synth = window.speechSynthesis
    if (synth.speaking) {
      synth.cancel()
      setIsReadingQuestion(false)
      return
    }

    const readableText = question.question
      .replace(/_+/g, " chỗ trống ")
      .replace(/\s+/g, " ")
      .trim()

    const utterance = new SpeechSynthesisUtterance(readableText)
    utterance.lang = "vi-VN"
    utterance.rate = 0.95
    utterance.onstart = () => setIsReadingQuestion(true)
    utterance.onend = () => setIsReadingQuestion(false)
    utterance.onerror = () => setIsReadingQuestion(false)
    synth.speak(utterance)
  }

  const answeredCount = Object.keys(answers).length
  const totalQuestions = examData.questions.length
  const question = examData.questions[currentQuestion]

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 z-10">
        <div className="w-full px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-foreground dark:text-white">{examData.title}</h1>
            <p className="text-sm text-muted-foreground">
              Câu {currentQuestion + 1}/{totalQuestions} • Đã trả lời {answeredCount}/{totalQuestions}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold ${
              timeRemaining < 300 
                ? "bg-red-500/10 text-red-500" 
                : "bg-secondary dark:bg-slate-800 text-foreground dark:text-white"
            }`}>
              <Clock size={18} />
              {formatTime(timeRemaining)}
            </div>
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Send size={18} />
              Nộp bài
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8 grid lg:grid-cols-4 gap-8">
        {/* Question Navigation Sidebar */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sticky top-24">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Danh sách câu hỏi</h3>
            <div className="grid grid-cols-5 gap-2">
              {examData.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`relative w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                    currentQuestion === idx
                      ? "bg-primary text-white"
                      : answers[q.id]
                      ? "bg-green-500/20 text-green-500 border border-green-500/30"
                      : "bg-secondary dark:bg-slate-800 text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {idx + 1}
                  {flaggedQuestions.has(q.id) && (
                    <Flag size={10} className="absolute -top-1 -right-1 text-yellow-500 fill-yellow-500" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border dark:border-slate-700 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
                <span className="text-muted-foreground">Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-secondary dark:bg-slate-800" />
                <span className="text-muted-foreground">Chưa trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <Flag size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="text-muted-foreground">Đã đánh dấu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6"
          >
            {/* Question Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-sm text-primary font-medium">Câu {currentQuestion + 1}</span>
                <span className="text-sm text-muted-foreground ml-2">• {question.points} điểm</span>
              </div>
              <button
                onClick={() => toggleFlag(question.id)}
                className={`p-2 rounded-lg transition-colors ${
                  flaggedQuestions.has(question.id)
                    ? "bg-yellow-500/10 text-yellow-500"
                    : "hover:bg-secondary dark:hover:bg-slate-800 text-muted-foreground"
                }`}
                title={flaggedQuestions.has(question.id) ? "Bỏ đánh dấu" : "Đánh dấu xem lại"}
              >
                <Flag size={18} className={flaggedQuestions.has(question.id) ? "fill-current" : ""} />
              </button>
            </div>

            {/* Question Text */}
            <h2 className="text-lg font-medium text-foreground dark:text-white mb-6">
              {question.question}
            </h2>

            {question.type === "fill_in" && (
              <button
                type="button"
                onClick={readFillInQuestion}
                disabled={!speechSupported}
                className="mb-6 inline-flex items-center gap-2 rounded-lg border border-border dark:border-slate-700 px-3 py-2 text-sm text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isReadingQuestion ? <VolumeX size={16} /> : <Volume2 size={16} />}
                {isReadingQuestion ? "Dừng đọc câu" : "Đọc câu điền khuyết"}
              </button>
            )}

            {/* Answer Options */}
            <div className="space-y-3">
              {question.type === "multiple_choice" && question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(question.id, option)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                    answers[question.id] === option
                      ? "border-primary bg-primary/10"
                      : "border-border dark:border-slate-700 hover:border-primary/50"
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    answers[question.id] === option
                      ? "bg-primary text-white"
                      : "bg-secondary dark:bg-slate-800 text-muted-foreground"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-foreground dark:text-white">{option}</span>
                </button>
              ))}

              {question.type === "true_false" && question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(question.id, option)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                    answers[question.id] === option
                      ? "border-primary bg-primary/10"
                      : "border-border dark:border-slate-700 hover:border-primary/50"
                  }`}
                >
                  {answers[question.id] === option ? (
                    <CheckCircle size={24} className="text-primary" />
                  ) : (
                    <Circle size={24} className="text-muted-foreground" />
                  )}
                  <span className="text-foreground dark:text-white">{option}</span>
                </button>
              ))}

              {question.type === "fill_in" && (
                <input
                  type="text"
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="w-full p-4 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Nhập câu trả lời..."
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border dark:border-slate-700">
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="px-4 py-2 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft size={18} />
                Câu trước
              </button>
              <button
                onClick={() => setCurrentQuestion(prev => Math.min(totalQuestions - 1, prev + 1))}
                disabled={currentQuestion === totalQuestions - 1}
                className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Câu sau
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-md p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Send size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground dark:text-white">Xác nhận nộp bài</h3>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Đã trả lời</span>
                <span className="text-foreground dark:text-white font-medium">{answeredCount}/{totalQuestions} câu</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Đánh dấu xem lại</span>
                <span className="text-foreground dark:text-white font-medium">{flaggedQuestions.size} câu</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Thời gian còn lại</span>
                <span className="text-foreground dark:text-white font-medium">{formatTime(timeRemaining)}</span>
              </div>
            </div>

            {answeredCount < totalQuestions && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-6">
                <p className="text-yellow-500 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  Bạn còn {totalQuestions - answeredCount} câu chưa trả lời
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-4 py-3 border border-border dark:border-slate-700 rounded-xl hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Đang nộp..." : "Nộp bài"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Time Warning Modal */}
      {showTimeWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-md p-6"
          >
            <div className="flex items-center gap-3 text-yellow-500 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">Cảnh báo thời gian</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Bạn còn 5 phút để hoàn thành bài thi. Hãy kiểm tra lại các câu trả lời trước khi nộp bài.
            </p>
            <button
              onClick={() => setShowTimeWarning(false)}
              className="w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              Đã hiểu
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

