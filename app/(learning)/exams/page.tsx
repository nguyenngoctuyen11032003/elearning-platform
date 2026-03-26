"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Clock, FileText, Trophy, Award, ClipboardList } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"

interface ExamItem {
  id: string
  title: string
  description?: string
  type: "practice" | "official"
  timeLimit: number
  passingScore: number
  maxAttempts: number
  availableFrom?: string | null
  availableUntil?: string | null
  course?: { id: string; title: string }
}

interface ExamAttemptsSummary {
  count: number
}

export default function StudentExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([])
  const [attemptsByExam, setAttemptsByExam] = useState<Record<string, ExamAttemptsSummary>>({})
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const list = await apiClient.getAvailableExtractedExams()
        const normalized = Array.isArray(list) ? list : []
        setExams(normalized)

        const historyEntries = await Promise.all(
          normalized.map(async (exam) => {
            try {
              const payload = await apiClient.getMyExtractedExamAttempts(exam.id)
              const attempts = Array.isArray(payload?.attempts) ? payload.attempts : []
              return [exam.id, { count: attempts.length }] as const
            } catch {
              return [exam.id, { count: 0 }] as const
            }
          }),
        )

        setAttemptsByExam(Object.fromEntries(historyEntries))
      } catch (error) {
        const message = error instanceof Error ? error.message : t("exam_load_error", "Không thể tải danh sách bài thi")
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const now = new Date()

  const getAttemptCount = (examId: string) => attemptsByExam[examId]?.count || 0

  const stats = useMemo(() => {
    return {
      total: exams.length,
      official: exams.filter((e) => e.type === "official").length,
      practice: exams.filter((e) => e.type === "practice").length,
    }
  }, [exams])

  const canStart = (exam: ExamItem) => {
    if (exam.availableFrom && now < new Date(exam.availableFrom)) return false
    if (exam.availableUntil && now > new Date(exam.availableUntil)) return false
    return true
  }

  const isExpired = (exam: ExamItem) => {
    if (!exam.availableUntil) return false
    return now > new Date(exam.availableUntil)
  }

  const hasRemainingAttempts = (exam: ExamItem) => getAttemptCount(exam.id) < Number(exam.maxAttempts || 0)

  const hasHistory = (exam: ExamItem) => getAttemptCount(exam.id) > 0

  const timeNotice = (exam: ExamItem) => {
    if (exam.availableFrom && now < new Date(exam.availableFrom)) {
      return `${t("exam_open_at", "Mở thi lúc")} ${new Date(exam.availableFrom).toLocaleString("vi-VN")}`
    }
    if (exam.availableUntil && now > new Date(exam.availableUntil)) {
      return t("exam_time_expired", "Đã hết thời gian làm bài")
    }
    if (exam.availableUntil) {
      return `${t("exam_until", "Đến hạn")} ${new Date(exam.availableUntil).toLocaleString("vi-VN")}`
    }
    return t("exam_can_start", "Có thể vào thi ngay")
  }

  if (loading) {
    return <div className="p-6">{t("exam_loading", "Đang tải danh sách bài thi...")}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/exam2.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
        <div className="relative z-10 space-y-8">
          <div className="animate-slideDown" style={{ animationDelay: "0.15s" }}>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("exam_title", "Bài thi của tôi")}</h1>
            <p className="text-black/70 dark:text-white/80 drop-shadow">{t("exam_desc", "Quản lý các bài thi bạn có thể tham gia.")}</p>
          </div>

          <div className="rounded-2xl border border-white/40 dark:border-slate-700/60 bg-white/15 dark:bg-slate-900/30 backdrop-blur-sm p-4 md:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
              <div className="group flex items-center justify-between p-6 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                <div>
                  <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("exam_total", "Tổng bài thi")}</p>
                  <p className="text-3xl font-bold text-foreground dark:text-white mt-2">{stats.total}</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <FileText size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
              <div className="group flex items-center justify-between p-6 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                <div>
                  <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("exam_official", "Thi thật")}</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.official}</p>
                </div>
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Award size={28} className="text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
            <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
              <div className="group flex items-center justify-between p-6 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                <div>
                  <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("exam_practice", "Thi thử")}</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.practice}</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <ClipboardList size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {exams.map((exam) => (
          <div key={exam.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{exam.title}</h2>
                <p className="text-sm text-muted-foreground">{exam.course?.title || t("exam_course", "Khóa học")}</p>
                {exam.description && <p className="text-sm text-muted-foreground">{exam.description}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock size={14} /> {exam.timeLimit} {t("exam_minutes", "phút")}</span>
                  <span className="inline-flex items-center gap-1"><FileText size={14} /> {t("exam_pass_from", "Đạt từ")} {exam.passingScore}%</span>
                  <span className="inline-flex items-center gap-1"><Trophy size={14} /> {exam.type === "official" ? t("exam_official", "Thi thật") : t("exam_practice", "Thi thử")}</span>
                  <span className="inline-flex items-center gap-1"><ClipboardList size={14} /> {t("exam_attempts", "Lượt thi")}: {getAttemptCount(exam.id)}/{exam.maxAttempts}</span>
                </div>
                <p className={`text-sm ${canStart(exam) ? "text-green-600" : "text-amber-600"}`}>{timeNotice(exam)}</p>
              </div>

              {canStart(exam) && hasRemainingAttempts(exam) ? (
                <Link
                  href={`/exams/${exam.id}/take?source=extracted`}
                  className="rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-primary/90"
                >
                  {t("exam_enter", "Vào thi")}
                </Link>
              ) : hasHistory(exam) || !hasRemainingAttempts(exam) ? (
                <Link
                  href={`/exams/${exam.id}/history`}
                  className="rounded-lg border border-primary px-4 py-2 text-center text-sm font-medium text-primary hover:bg-primary/5"
                >
                  {t("exam_history", "Lịch sử")}
                </Link>
              ) : isExpired(exam) ? (
                <button
                  disabled
                  className="rounded-lg border px-4 py-2 text-sm text-muted-foreground"
                >
                  {t("exam_no_history", "Bạn không có lịch sử thi")}
                </button>
              ) : (
                <button
                  disabled
                  className="rounded-lg border px-4 py-2 text-sm text-muted-foreground"
                >
                  {t("exam_not_available_yet", "Chưa thể vào thi")}
                </button>
              )}
            </div>
          </div>
        ))}

        {exams.length === 0 && (
          <div className="rounded-xl border p-8 text-center text-muted-foreground">
            {t("exam_empty_enrolled", "Chưa có bài thi nào cho các khóa bạn đã đăng ký.")}
          </div>
        )}
      </div>
    </div>
  )
}
