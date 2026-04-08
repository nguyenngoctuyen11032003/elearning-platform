"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  AlarmClock,
  CalendarClock,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { UniversalSelect } from "@/components/ui/universal-select"

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
  remaining?: number
}

interface CourseExamGroup {
  courseId: string
  courseTitle: string
  exams: ExamItem[]
}

type ExamFilter = "all" | "official" | "practice" | "available" | "locked"

export default function StudentExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([])
  const [attemptsByExam, setAttemptsByExam] = useState<Record<string, ExamAttemptsSummary>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<ExamFilter>("all")
  const { t } = useLanguage()

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
              const attemptCount = Number(payload?.attemptCount ?? attempts.length)
              const remaining = Number(payload?.remainingAttempts)
              return [exam.id, { count: attemptCount, remaining: Number.isFinite(remaining) ? remaining : undefined }] as const
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
  }, [t])

  const now = new Date()

  const getAttemptCount = (examId: string) => attemptsByExam[examId]?.count || 0
  const getRemainingAttempts = (examId: string) => attemptsByExam[examId]?.remaining

  const canStart = (exam: ExamItem) => {
    if (exam.availableFrom && now < new Date(exam.availableFrom)) return false
    if (exam.availableUntil && now > new Date(exam.availableUntil)) return false
    return true
  }

  const isExpired = (exam: ExamItem) => {
    if (!exam.availableUntil) return false
    return now > new Date(exam.availableUntil)
  }

  const hasRemainingAttempts = (exam: ExamItem) => {
    const remaining = getRemainingAttempts(exam.id)
    if (typeof remaining === "number") return remaining > 0
    return getAttemptCount(exam.id) < Number(exam.maxAttempts || 0)
  }

  const hasHistory = (exam: ExamItem) => getAttemptCount(exam.id) > 0

  const timeNotice = (exam: ExamItem) => {
    if (!hasRemainingAttempts(exam)) {
      return t(
        "exam_attempt_limit_reached",
        "Đã đạt giới hạn của bài thi không thể tiếp tục tham gia thi",
      )
    }
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

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-"
    return new Date(value).toLocaleString("vi-VN")
  }

  const stats = useMemo(() => {
    const total = exams.length
    const official = exams.filter((e) => e.type === "official").length
    const practice = exams.filter((e) => e.type === "practice").length
    const availableNow = exams.filter((exam) => canStart(exam) && hasRemainingAttempts(exam)).length
    const locked = exams.filter((exam) => !canStart(exam) || !hasRemainingAttempts(exam)).length

    return { total, official, practice, availableNow, locked }
  }, [exams, attemptsByExam])

  const filteredExams = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return exams.filter((exam) => {
      const title = String(exam.title || "").toLowerCase()
      const courseName = String(exam.course?.title || "").toLowerCase()

      const matchKeyword = !keyword || title.includes(keyword) || courseName.includes(keyword)
      if (!matchKeyword) return false

      if (filter === "all") return true
      if (filter === "official") return exam.type === "official"
      if (filter === "practice") return exam.type === "practice"
      if (filter === "available") return canStart(exam) && hasRemainingAttempts(exam)
      if (filter === "locked") return !canStart(exam) || !hasRemainingAttempts(exam)
      return true
    })
  }, [exams, filter, searchTerm, attemptsByExam])

  const groupedExamsByCourse = useMemo<CourseExamGroup[]>(() => {
    const bucket = new Map<string, CourseExamGroup>()

    for (const exam of filteredExams) {
      const courseId = exam.course?.id || "unknown-course"
      const courseTitle = exam.course?.title || t("exam_course_unknown", "Khóa học chưa xác định")
      const existing = bucket.get(courseId)

      if (!existing) {
        bucket.set(courseId, {
          courseId,
          courseTitle,
          exams: [exam],
        })
        continue
      }

      existing.exams.push(exam)
    }

    return Array.from(bucket.values())
      .map((group) => ({
        ...group,
        exams: [...group.exams].sort((a, b) => a.title.localeCompare(b.title, "vi")),
      }))
      .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle, "vi"))
  }, [filteredExams, t])

  const upcomingExams = useMemo(
    () =>
      exams
        .filter((exam) => exam.availableUntil && new Date(exam.availableUntil) > now)
        .sort((a, b) => new Date(a.availableUntil || 0).getTime() - new Date(b.availableUntil || 0).getTime())
        .slice(0, 4),
    [exams],
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-72 animate-pulse rounded-[2rem] bg-gradient-to-br from-slate-200 via-blue-100 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34 }}
        className="relative overflow-hidden rounded-[2rem] border border-blue-100/70 bg-white/85 p-6 shadow-[0_24px_60px_rgba(3,105,161,0.16)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 md:p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_110%_at_0%_0%,rgba(59,130,246,0.25),transparent_45%),radial-gradient(100%_90%_at_90%_0%,rgba(34,211,238,0.22),transparent_48%)]" />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/70 bg-cyan-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-900/30 dark:text-cyan-200">
                <Sparkles className="h-4 w-4" />
                {t("exam_title_badge", "Exam Command Center")}
              </p>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white md:text-5xl">{t("exam_title", "Bài thi của tôi")}</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 md:text-base">
                {t("exam_desc", "Quản lý các bài thi bạn có thể tham gia.")}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/60">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("exam_available_now", "Có thể thi ngay")}</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  <AnimatedNumber value={stats.availableNow} /> / <AnimatedNumber value={stats.total} />
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: t("exam_total", "Tổng bài thi"), value: stats.total, icon: FileText },
              { label: t("exam_official", "Thi thật"), value: stats.official, icon: Trophy },
              { label: t("exam_practice", "Thi thử"), value: stats.practice, icon: ClipboardList },
              { label: t("exam_available_now", "Sẵn sàng"), value: stats.availableNow, icon: AlarmClock },
              { label: t("exam_locked", "Đang khóa"), value: stats.locked, icon: Lock },
            ].map((item, idx) => (
              <motion.article
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + idx * 0.05 }}
                whileHover={{ y: -3 }}
                className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60"
              >
                <div className="mb-1 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <item.icon className="h-4 w-4" />
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em]">{item.label}</p>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  <AnimatedNumber value={item.value} />
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_12px_35px_rgba(2,132,199,0.09)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/65"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("exam_search", "Tìm bài thi hoặc tên khóa học...")}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.2)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                  <Filter className="h-3.5 w-3.5" />
                  {t("exam_filter", "Bộ lọc")}
                </span>
                <UniversalSelect
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as ExamFilter)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                  contentClassName="border-blue-500/30 bg-slate-950/92 text-slate-100 backdrop-blur-2xl shadow-[0_20px_50px_rgba(2,6,23,0.75)]"
                  portalled={true}
                >
                  <option value="all">{t("exam_filter_all", "Tất cả")}</option>
                  <option value="official">{t("exam_official", "Thi thật")}</option>
                  <option value="practice">{t("exam_practice", "Thi thử")}</option>
                  <option value="available">{t("exam_filter_available", "Có thể thi")}</option>
                  <option value="locked">{t("exam_filter_locked", "Đang khóa")}</option>
                </UniversalSelect>
              </div>
            </div>
          </motion.div>

          {groupedExamsByCourse.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
              {t("exam_empty_enrolled", "Chưa có bài thi nào cho các khóa bạn đã đăng ký.")}
            </div>
          ) : (
            <div className="space-y-5">
              {groupedExamsByCourse.map((group, groupIdx) => (
                <motion.section
                  key={group.courseId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + groupIdx * 0.04 }}
                  className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-[0_8px_26px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{group.courseTitle}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t("exam_course_group_desc", "Danh sách bài thi thuộc khóa học này")}
                      </p>
                    </div>

                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {group.exams.length} {t("exam_total", "bài thi")}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {group.exams.map((exam, idx) => {
                      const attempts = getAttemptCount(exam.id)
                      const remaining = Math.max(0, Number(exam.maxAttempts || 0) - attempts)
                      const attemptProgress = exam.maxAttempts > 0 ? Math.min(100, Math.round((attempts / exam.maxAttempts) * 100)) : 0

                      return (
                        <motion.article
                          key={exam.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.08 + idx * 0.04 }}
                          whileHover={{ y: -4 }}
                          className="rounded-xl border border-slate-200 bg-slate-50/85 p-4 transition hover:border-cyan-400/60 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/45"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <h3 className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-white">{exam.title}</h3>
                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                                exam.type === "official"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                  : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
                              }`}
                            >
                              {exam.type === "official" ? t("exam_official", "Thi thật") : t("exam_practice", "Thi thử")}
                            </span>
                          </div>

                          <p className="mb-3 line-clamp-2 min-h-[36px] text-xs text-slate-500 dark:text-slate-400">
                            {exam.description || t("exam_no_description", "Không có mô tả chi tiết")}
                          </p>

                          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-white px-2 py-1.5 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {exam.timeLimit} {t("exam_minutes", "phút")}
                              </span>
                            </div>
                            <div className="rounded-lg bg-white px-2 py-1.5 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                              {t("exam_pass_from", "Đạt từ")} {exam.passingScore}%
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{t("exam_attempts", "Lượt thi")}</span>
                              <span className="font-semibold">
                                {attempts}/{exam.maxAttempts}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${attemptProgress}%` }}
                                transition={{ duration: 0.7 }}
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                              />
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              {t("exam_remaining_attempts", "Còn lại")}: {remaining}
                            </p>
                          </div>

                          <div className="mb-3 space-y-1 rounded-lg border border-dashed border-slate-300 bg-white/75 p-2 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                            <p>
                              {t("exam_open_from", "Từ")} {formatDateTime(exam.availableFrom)}
                            </p>
                            <p>
                              {t("exam_until", "Đến hạn")} {formatDateTime(exam.availableUntil)}
                            </p>
                            <p className={`font-medium ${canStart(exam) ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300"}`}>
                              {timeNotice(exam)}
                            </p>
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            {canStart(exam) && hasRemainingAttempts(exam) ? (
                              <Link
                                href={`/exams/${exam.id}/take?source=extracted`}
                                className="inline-flex items-center rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-500"
                              >
                                {t("exam_enter", "Vào thi")}
                              </Link>
                            ) : hasHistory(exam) || !hasRemainingAttempts(exam) ? (
                              <Link
                                href={`/exams/${exam.id}/history`}
                                className="inline-flex items-center rounded-lg border border-cyan-500 px-3 py-2 text-xs font-semibold text-cyan-600 transition hover:bg-cyan-50 dark:text-cyan-300 dark:hover:bg-cyan-900/20"
                              >
                                {t("exam_history", "Lịch sử")}
                              </Link>
                            ) : isExpired(exam) ? (
                              <button disabled className="inline-flex items-center rounded-lg border px-3 py-2 text-xs text-slate-500">
                                {t("exam_no_history", "Bạn không có lịch sử thi")}
                              </button>
                            ) : (
                              <button disabled className="inline-flex items-center rounded-lg border px-3 py-2 text-xs text-slate-500">
                                {t("exam_not_available_yet", "Chưa thể vào thi")}
                              </button>
                            )}
                          </div>
                        </motion.article>
                      )
                    })}
                  </div>
                </motion.section>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-[0_8px_26px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/70"
          >
            <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-white">{t("exam_upcoming", "Sắp đến hạn")}</h3>
            <div className="space-y-2">
              {upcomingExams.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {t("exam_no_upcoming", "Không có bài thi gần hạn")}
                </p>
              ) : (
                upcomingExams.map((exam) => (
                  <div key={`upcoming-${exam.id}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/45">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{exam.title}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDateTime(exam.availableUntil)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  )
}
