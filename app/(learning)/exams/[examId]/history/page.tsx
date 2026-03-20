"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  FileText,
  Trophy
} from "lucide-react"
import { PremiumCard } from "@/components/ui/premium-card"
import { useLanguage } from "@/lib/i18n/language-context"
import { autoTranslateData, getLocaleByLanguage } from "@/lib/i18n/dynamic-translate"

interface ExamAttempt {
  id: string
  attemptNumber: number
  score: number
  passed: boolean
  timeSpent: number
  correctAnswers: number
  totalQuestions: number
  completedAt: string
}

interface ExamInfo {
  id: string
  title: string
  courseName: string
  passingScore: number
  maxAttempts: number
}

// Mock data
const mockExamInfo: ExamInfo = {
  id: "1",
  title: "Bài thi cuối khóa Next.js",
  courseName: "Lập trình Next.js từ cơ bản đến nâng cao",
  passingScore: 70,
  maxAttempts: 2
}

const mockAttempts: ExamAttempt[] = [
  {
    id: "attempt-1",
    attemptNumber: 1,
    score: 65,
    passed: false,
    timeSpent: 4200,
    correctAnswers: 32,
    totalQuestions: 50,
    completedAt: "2025-01-10T10:30:00"
  },
  {
    id: "attempt-2",
    attemptNumber: 2,
    score: 85,
    passed: true,
    timeSpent: 4520,
    correctAnswers: 42,
    totalQuestions: 50,
    completedAt: "2025-01-15T14:45:00"
  },
]

export default function ExamHistoryPage() {
  const params = useParams()
  const examId = params.examId as string
  const { language } = useLanguage()
  const [examInfo, setExamInfo] = useState<ExamInfo>(mockExamInfo)
  const [attempts, setAttempts] = useState<ExamAttempt[]>(mockAttempts)

  useEffect(() => {
    let active = true

    const localize = async () => {
      const [localizedExamInfo, localizedAttempts] = await Promise.all([
        autoTranslateData(mockExamInfo, language),
        autoTranslateData(mockAttempts, language),
      ])

      if (!active) return
      setExamInfo(localizedExamInfo)
      setAttempts(localizedAttempts)
    }

    localize()

    return () => {
      active = false
    }
  }, [language])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs} giờ ${mins} phút`
    }
    return `${mins} phút ${secs} giây`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(getLocaleByLanguage(language), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const bestAttempt = attempts.reduce((best, current) =>
    current.score > (best?.score || 0) ? current : best
  , attempts[0])

  return (
    <div className="space-y-8">
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
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Lịch sử thi</h1>
          <p className="text-muted-foreground dark:text-slate-400">{examInfo.title}</p>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PremiumCard className="p-6">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{attempts.length}</p>
              <p className="text-sm text-muted-foreground">Lượt thi</p>
            </div>
            <div className="text-center">
              <p className={`text-4xl font-bold ${bestAttempt?.passed ? "text-green-500" : "text-red-500"}`}>
                {bestAttempt?.score || 0}%
              </p>
              <p className="text-sm text-muted-foreground">Điểm cao nhất</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground dark:text-white">
                {examInfo.maxAttempts - attempts.length}
              </p>
              <p className="text-sm text-muted-foreground">Lượt còn lại</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                {attempts.some(a => a.passed) ? (
                  <>
                    <Trophy size={32} className="text-green-500" />
                    <span className="text-lg font-semibold text-green-500">Đã đạt</span>
                  </>
                ) : (
                  <>
                    <XCircle size={32} className="text-red-500" />
                    <span className="text-lg font-semibold text-red-500">Chưa đạt</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Trạng thái</p>
            </div>
          </div>
        </PremiumCard>
      </motion.div>

      {/* Attempts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold text-foreground dark:text-white">Chi tiết các lần thi</h2>

        {attempts.map((attempt, idx) => (
          <motion.div
            key={attempt.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * idx }}
          >
            <PremiumCard className={`p-6 ${attempt.passed ? "border-green-500/30" : "border-red-500/30"}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    attempt.passed ? "bg-green-500/20" : "bg-red-500/20"
                  }`}>
                    {attempt.passed ? (
                      <CheckCircle size={24} className="text-green-500" />
                    ) : (
                      <XCircle size={24} className="text-red-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-white">
                      Lần thi #{attempt.attemptNumber}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Calendar size={14} />
                      {formatDate(attempt.completedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${attempt.passed ? "text-green-500" : "text-red-500"}`}>
                      {attempt.score}%
                    </p>
                    <p className="text-xs text-muted-foreground">Điểm</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground dark:text-white">
                      {attempt.correctAnswers}/{attempt.totalQuestions}
                    </p>
                    <p className="text-xs text-muted-foreground">Đúng</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-1">
                      <Clock size={16} />
                      {formatTime(attempt.timeSpent)}
                    </p>
                    <p className="text-xs text-muted-foreground">Thời gian</p>
                  </div>
                  <Link
                    href={`/exams/${examId}/result?attemptId=${attempt.id}`}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        ))}

        {attempts.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có lịch sử thi nào</p>
          </div>
        )}
      </motion.div>

      {/* Action */}
      {attempts.length < examInfo.maxAttempts && !attempts.some(a => a.passed) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Link
            href={`/exams/${examId}/take`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Thi lại
          </Link>
        </motion.div>
      )}
    </div>
  )
}

