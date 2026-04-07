"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
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
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"
import { getLocaleByLanguage } from "@/lib/i18n/dynamic-translate"

interface ExamAttempt {
  id: string
  attemptNumber: number
  score: number
  passed: boolean
  timeSpent: number
  earnedPoints: number
  totalPoints: number
  completedAt: string
}

interface ExamInfo {
  id: string
  title: string
  courseName: string
  passingScore: number
  maxAttempts: number
}

export default function ExamHistoryPage() {
  const params = useParams()
  const examId = params.examId as string
  const { language, t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null)
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [attemptCount, setAttemptCount] = useState(0)
  const [remainingAttempts, setRemainingAttempts] = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const payload = await apiClient.getMyExtractedExamAttempts(examId)
        const exam = payload?.exam
        const rows = Array.isArray(payload?.attempts) ? payload.attempts : []

        setExamInfo({
          id: String(exam?.id || examId),
          title: String(exam?.title || t("exam_title", "Bài thi")),
          courseName: String(exam?.courseName || t("exam_course", "Khóa học")),
          passingScore: Number(exam?.passingScore || 0),
          maxAttempts: Number(exam?.maxAttempts || 0),
        })

        setAttempts(
          rows.map((item: any, index: number) => ({
            id: String(item?.id || `attempt-${index}`),
            attemptNumber: Number(item?.attemptNumber || index + 1),
            score: Number(item?.score || 0),
            passed: Boolean(item?.passed),
            timeSpent: Number(item?.timeSpent || 0),
            earnedPoints: Number(item?.earnedPoints || 0),
            totalPoints: Number(item?.totalPoints || 0),
            completedAt: String(item?.completedAt || item?.submittedAt || item?.createdAt || ""),
          })),
        )

        setAttemptCount(Number(payload?.attemptCount ?? rows.length))
        setRemainingAttempts(Number(payload?.remainingAttempts ?? Math.max(0, Number(exam?.maxAttempts || 0) - rows.length)))
      } catch (error) {
        const message = error instanceof Error ? error.message : t("exam_load_error", "Không thể tải danh sách bài thi")
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [examId, t])
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

  if (loading) {
    return <div className="p-6">{t("exam_loading", "Đang tải danh sách bài thi...")}</div>
  }

  if (!examInfo) {
    return (
      <div className="p-6">
        <p className="mb-3">{t("exam_not_found", "Không tìm thấy bài thi")}</p>
        <Link href="/exams" className="text-primary hover:underline">{t("exam_result_back_to_list", "Back to exam list")}</Link>
      </div>
    )
  }

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
              <p className="text-4xl font-bold text-primary">{attemptCount}</p>
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
                {remainingAttempts}
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
                      {attempt.earnedPoints}/{attempt.totalPoints}
                    </p>
                    <p className="text-xs text-muted-foreground">Điểm số</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-1">
                      <Clock size={16} />
                      {formatTime(attempt.timeSpent)}
                    </p>
                    <p className="text-xs text-muted-foreground">Thời gian</p>
                  </div>
                  <Link
                    href={`/exams/${examId}/result?attemptId=${attempt.id}&source=extracted`}
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
            href={`/exams/${examId}/take?source=extracted`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Thi lại
          </Link>
        </motion.div>
      )}
    </div>
  )
}

