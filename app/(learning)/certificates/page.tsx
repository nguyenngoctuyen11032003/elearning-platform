"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle,
  Copy,
  Download,
  X,
  Eye,
  ExternalLink,
  FileText,
  Loader2,
  Minus,
  Maximize2,
  Plus,
  Search,
  Share2,
  Sparkles,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { apiClient } from "@/lib/api/client"
import { AnimatedNumber } from "@/components/ui/rolling-number"

interface Certificate {
  id: string
  certificateNumber: string
  issueDate: string
  pdfUrl?: string
  imageUrl?: string
  status: string
  courseId: string
  title: string
  description?: string
  validityPeriod: string
  courseTitle: string
  studentName: string
  studentEmail?: string
  instructorName: string
  template?: {
    title?: string
    description?: string
    templateStyle?: string
    badgeStyle?: string
    backgroundColor?: string
    borderColor?: string
    borderStyle?: string
    textColor?: string
    templateImageUrl?: string
    logoUrl?: string
    signatureUrl?: string
    validityPeriod?: string
  } | null
  metadata?: {
    studentName?: string
    courseName?: string
    certificateTitle?: string
    title?: string
    snapshot?: {
      studentName?: string
      courseName?: string
      certificateTitle?: string
      title?: string
      issuedAt?: string
      template?: {
        title?: string
        description?: string
        templateStyle?: string
        badgeStyle?: string
        backgroundColor?: string
        borderColor?: string
        borderStyle?: string
        textColor?: string
        templateImageUrl?: string
        logoUrl?: string
        signatureUrl?: string
        validityPeriod?: string
      } | null
    } | null
  } | null
  course?: {
    id: string
    title: string
    teacher?: { name?: string; firstName?: string; lastName?: string }
  }
  student?: {
    name?: string
    firstName?: string
    lastName?: string
  }
}

function normalizeComparableMediaPath(value?: string): string {
  const raw = String(value || "").trim()
  if (!raw) return ""

  return raw
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/api\/uploads\//i, "/uploads/")
    .replace(/\?.*$/, "")
    .replace(/#.*$/, "")
}

function shouldUseCertificateImage(cert: Certificate): boolean {
  const certificateImage = normalizeComparableMediaPath(cert.imageUrl)
  if (!certificateImage) return false

  const templateImage = normalizeComparableMediaPath(cert.template?.templateImageUrl)
  if (templateImage && certificateImage === templateImage) {
    return false
  }

  return true
}

interface ExamAttemptItem {
  id: string
  source: "regular" | "extracted"
  examId: string
  examTitle: string
  score: number
  passed: boolean
  createdAt: string
  totalQuestions: number
  correctCount: number
  incorrectCount: number
}

interface ExamAttemptSummary {
  examId: string
  examTitle: string
  attemptUsed: number
  latestScore: number
  latestPassed: boolean
  latestDate: string
  latestCorrectCount: number
  latestIncorrectCount: number
}

function normalizeMediaUrl(value: unknown): string | undefined {
  const raw = String(value || "").trim()
  if (!raw) return undefined
  if (/^(data:image\/|blob:)/i.test(raw)) return raw

  let normalized = raw
    .replace(/(^|\s)\/api\/uploads\//g, "$1/uploads/")
    .replace(/^(https?:\/\/[^/]+)\/api\/uploads\//i, "$1/uploads/")

  const backendBase = String(process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "")
  if (backendBase && normalized.startsWith(`${backendBase}/uploads/`)) {
    normalized = normalized.slice(backendBase.length)
  }

  if (/^https?:\/\/[^/]+\/uploads\//i.test(normalized)) {
    normalized = normalized.replace(/^https?:\/\/[^/]+/i, "")
  }

  if (/^(uploads|images|image)\//i.test(normalized)) {
    normalized = `/${normalized}`
  }

  return normalized
}

function mapCertificate(raw: any): Certificate {
  const snapshot = raw?.metadata?.snapshot || null
  const templateSource = snapshot?.template || raw?.metadata?.template || raw?.template || null

  const imageUrl =
    raw?.imageUrl ||
    raw?.certificateImageUrl ||
    raw?.metadata?.previewImageUrl ||
    raw?.metadata?.thumbnailUrl ||
    raw?.metadata?.imageUrl ||
    raw?.metadata?.previewUrl ||
    raw?.metadata?.certificateUrl

  const pdfUrl =
    raw?.pdfUrl ||
    raw?.metadata?.pdfUrl ||
    raw?.metadata?.certificatePdfUrl ||
    raw?.metadata?.downloadUrl

  const courseTitle =
    raw?.course?.title ||
    raw?.metadata?.snapshot?.courseName ||
    raw?.metadata?.courseName ||
    ""

  const studentName =
    raw?.student?.name ||
    [raw?.student?.firstName, raw?.student?.lastName].filter(Boolean).join(" ") ||
    raw?.metadata?.snapshot?.studentName ||
    raw?.metadata?.studentName ||
    ""

  const studentEmail = raw?.student?.email || ""

  const instructorName =
    raw?.course?.teacher?.name ||
    [raw?.course?.teacher?.firstName, raw?.course?.teacher?.lastName].filter(Boolean).join(" ") ||
    raw?.metadata?.teacherName ||
    ""

  const title =
    templateSource?.title ||
    raw?.metadata?.snapshot?.certificateTitle ||
    raw?.metadata?.certificateTitle ||
    raw?.metadata?.snapshot?.examTitle ||
    raw?.metadata?.examTitle ||
    raw?.metadata?.snapshot?.title ||
    raw?.metadata?.title ||
    raw?.title ||
    ""

  const description =
    templateSource?.description ||
    raw?.metadata?.snapshot?.description ||
    raw?.metadata?.description ||
    raw?.description ||
    ""

  const validityPeriod =
    templateSource?.validityPeriod ||
    raw?.validityPeriod ||
    "Vĩnh viễn"

  return {
    id: raw?.id || "",
    certificateNumber: raw?.certificateNumber || "",
    issueDate: raw?.issueDate || raw?.createdAt || snapshot?.issuedAt || new Date().toISOString(),
    pdfUrl: normalizeMediaUrl(pdfUrl),
    imageUrl: normalizeMediaUrl(imageUrl),
    status: raw?.status || "approved",
    courseId: raw?.courseId || raw?.course?.id || "",
    title,
    description,
    validityPeriod,
    courseTitle,
    studentName,
    studentEmail,
    instructorName,
    template: templateSource
      ? {
          ...templateSource,
          templateImageUrl: normalizeMediaUrl(templateSource?.templateImageUrl),
          logoUrl: normalizeMediaUrl(templateSource?.logoUrl),
          signatureUrl: normalizeMediaUrl(templateSource?.signatureUrl),
        }
      : null,
    metadata: raw?.metadata,
    course: raw?.course
      ? {
          id: raw.course.id || "",
          title: raw.course.title || "",
          teacher: raw.course.teacher,
        }
      : undefined,
    student: raw?.student,
  }
}

export default function CertificatesPage() {
  const { t, language } = useLanguage()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewerCert, setViewerCert] = useState<Certificate | null>(null)
  const [viewerZoom, setViewerZoom] = useState(1)
  const [attemptModalOpen, setAttemptModalOpen] = useState(false)
  const [attemptModalLoading, setAttemptModalLoading] = useState(false)
  const [attemptSummaries, setAttemptSummaries] = useState<ExamAttemptSummary[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const initial = await apiClient.getMyCertificates()
        let raw: any[] = Array.isArray(initial) ? initial : []

        if (raw.length === 0) {
          try {
            const attemptsRaw = await apiClient.get("/exams/my-attempts")
            const attempts = Array.isArray(attemptsRaw)
              ? attemptsRaw
              : Array.isArray((attemptsRaw as any)?.data)
                ? (attemptsRaw as any).data
                : []

            const passedAttemptIds = attempts
              .filter((attempt: any) => {
                const score = Number(attempt?.score || 0)
                const passingScore = Number(attempt?.exam?.passingScore || attempt?.passingScore || 70)
                const status = String(attempt?.status || "").toLowerCase()
                return Boolean(attempt?.isPassed) || status === "passed" || score >= passingScore
              })
              .map((attempt: any) => String(attempt?.id || ""))
              .filter(Boolean)

            if (passedAttemptIds.length > 0) {
              await Promise.allSettled(
                passedAttemptIds.slice(0, 10).map((attemptId: string) => apiClient.retryIssueCertificate(attemptId)),
              )
              const refreshed = await apiClient.getMyCertificates()
              raw = Array.isArray(refreshed) ? refreshed : []
            }
          } catch {
            // ignore fallback errors and keep empty state
          }
        }

        setCertificates(raw.map(mapCertificate))
      } catch {
        setCertificates([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [t])

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(language === "en" ? "en-US" : "vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const getInstructorName = (cert: Certificate) => {
    return cert.instructorName || t("cert_instructor", "Giảng viên")
  }

  const handleDownload = (cert: Certificate) => {
    window.open(`/certificate-print/${cert.id}?print=1`, "_blank")
  }

  const openViewer = (cert: Certificate) => {
    setViewerCert(cert)
    setViewerZoom(1)
  }

  const closeViewer = () => {
    setViewerCert(null)
    setViewerZoom(1)
  }

  const handleShare = async (cert: Certificate) => {
    const url = `${window.location.origin}/certificates/${cert.id}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: cert.title || t("cert_completed_name_default", "Chứng chỉ hoàn thành"),
          text: t("cert_share_message", "Xem chứng chỉ của tôi"),
          url,
        })
        return
      }

      await navigator.clipboard.writeText(url)
      toast.success(t("cert_copied", "Đã sao chép link chứng chỉ"))
    } catch {
      toast.info(`${t("cert_link_prefix", "Certificate link")}: ${url}`)
    }
  }

  const copyCertificateNumber = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(t("cert_code_copied", "Đã sao chép mã chứng chỉ"))
    } catch {
      toast.error(t("cert_copy_error", "Không thể sao chép"))
    }
  }

  const loadExamAttempts = async () => {
    setAttemptModalLoading(true)
    try {
      const regularAttemptsTask = apiClient.get("/exams/my-attempts")
      const extractedExamsTask = apiClient.getAvailableExtractedExams()
      const [regularAttemptsResult, extractedExamsResult] = await Promise.allSettled([
        regularAttemptsTask,
        extractedExamsTask,
      ])

      const regularAttemptsRaw =
        regularAttemptsResult.status === "fulfilled" ? regularAttemptsResult.value : []
      const regularAttempts = Array.isArray(regularAttemptsRaw)
        ? regularAttemptsRaw
        : Array.isArray((regularAttemptsRaw as any)?.data)
          ? (regularAttemptsRaw as any).data
          : []

      const regularMapped: ExamAttemptItem[] = regularAttempts
        .map((attempt: any) => {
          const questionResults = Array.isArray(attempt?.questionResults) ? attempt.questionResults : []
          const totalQuestions = questionResults.length
          const correctCount = questionResults.filter((result: any) => Boolean(result?.isCorrect)).length
          const incorrectCount = Math.max(totalQuestions - correctCount, 0)

          return {
            id: String(attempt?.id || ""),
            source: "regular" as const,
            examId: String(attempt?.exam?.id || attempt?.examId || ""),
            examTitle: String(attempt?.exam?.title || t("exam_result", "Bài thi")),
            score: Number(attempt?.score || 0),
            passed: Boolean(attempt?.passed),
            createdAt: String(attempt?.createdAt || attempt?.submittedAt || new Date().toISOString()),
            totalQuestions,
            correctCount,
            incorrectCount,
          }
        })
        .filter((item: ExamAttemptItem) => Boolean(item.id && item.examId))

      const extractedExams =
        extractedExamsResult.status === "fulfilled" && Array.isArray(extractedExamsResult.value)
          ? extractedExamsResult.value
          : []

      const extractedAttemptsResponses = await Promise.allSettled(
        extractedExams.map((exam: any) => apiClient.getMyExtractedExamAttempts(String(exam?.id || ""))),
      )

      const extractedMapped: ExamAttemptItem[] = []
      for (const response of extractedAttemptsResponses) {
        if (response.status !== "fulfilled") continue
        const examData = response.value?.exam
        const examId = String(examData?.id || "")
        const examTitle = String(examData?.title || t("exam_result", "Bài thi"))
        const attempts = Array.isArray(response.value?.attempts) ? response.value.attempts : []
        if (!examId || attempts.length === 0) continue

        const latestAttemptId = String(attempts[0]?.id || "")
        let latestQuestionResults: any[] = []
        if (latestAttemptId) {
          try {
            const detail = await apiClient.getMyExtractedExamAttemptDetail(examId, latestAttemptId)
            latestQuestionResults = Array.isArray(detail?.questionResults) ? detail.questionResults : []
          } catch {
            latestQuestionResults = []
          }
        }

        const latestTotalQuestions = latestQuestionResults.length
        const latestCorrectCount = latestQuestionResults.filter((result: any) => Boolean(result?.isCorrect)).length
        const latestIncorrectCount = Math.max(latestTotalQuestions - latestCorrectCount, 0)

        attempts.forEach((attempt: any, index: number) => {
          const isLatest = index === 0
          extractedMapped.push({
            id: String(attempt?.id || ""),
            source: "extracted",
            examId,
            examTitle,
            score: Number(attempt?.score || 0),
            passed: Boolean(attempt?.passed),
            createdAt: String(attempt?.completedAt || attempt?.submittedAt || attempt?.createdAt || new Date().toISOString()),
            totalQuestions: isLatest ? latestTotalQuestions : 0,
            correctCount: isLatest ? latestCorrectCount : 0,
            incorrectCount: isLatest ? latestIncorrectCount : 0,
          })
        })
      }

      const mapped: ExamAttemptItem[] = [...regularMapped, ...extractedMapped]

      const grouped = new Map<string, ExamAttemptItem[]>()
      mapped.forEach((item) => {
        const groupKey = `${item.source}:${item.examId}`
        const list = grouped.get(groupKey) || []
        list.push(item)
        grouped.set(groupKey, list)
      })

      const summaries: ExamAttemptSummary[] = Array.from(grouped.entries())
        .map(([examId, items]) => {
          const sorted = [...items].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          const latest = sorted[0]

          return {
            examId,
            examTitle: latest.examTitle,
            attemptUsed: items.length,
            latestScore: latest.score,
            latestPassed: latest.passed,
            latestDate: latest.createdAt,
            latestCorrectCount: latest.correctCount,
            latestIncorrectCount: latest.incorrectCount,
          }
        })
        .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())

      setAttemptSummaries(summaries)
    } catch (error) {
      console.error("Unable to load exam attempts", error)
      setAttemptSummaries([])
      toast.error(t("exam_attempt_load_failed", "Không thể tải danh sách bài thi đã thực hiện"))
    } finally {
      setAttemptModalLoading(false)
    }
  }

  const openAttemptModal = () => {
    setAttemptModalOpen(true)
    loadExamAttempts()
  }

  useEffect(() => {
    if (!viewerCert) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer()
      if (event.key === "+" || event.key === "=") {
        setViewerZoom((prev) => Math.min(2.5, Number((prev + 0.1).toFixed(2))))
      }
      if (event.key === "-") {
        setViewerZoom((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))))
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [viewerCert])

  const normalized = (value: string | undefined) => String(value || "pending").toLowerCase()
  const isPdfLike = (url?: string) => Boolean(url && /\.pdf(\?|#|$)/i.test(url))

  const filteredCertificates = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return certificates.filter((cert) => {
      if (!keyword) return true

      const courseName = String(cert.courseTitle || cert.course?.title || "").toLowerCase()
      const certificateTitle = String(cert.title || "").toLowerCase()
      const code = String(cert.certificateNumber || "").toLowerCase()
      const teacher = getInstructorName(cert).toLowerCase()

      return (
        courseName.includes(keyword) ||
        certificateTitle.includes(keyword) ||
        code.includes(keyword) ||
        teacher.includes(keyword)
      )
    })
  }, [certificates, searchTerm])

  const stats = useMemo(() => {
    const courses = new Set(certificates.map((c) => c.courseId).filter(Boolean)).size

    return {
      total: certificates.length,
      courses,
    }
  }, [certificates])

  const renderStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string; icon: JSX.Element }> = {
      approved: {
        label: t("cert_approved", "Đã xác nhận"),
        className: "bg-emerald-100/85 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
        icon: <CheckCircle size={14} />,
      },
      pending: {
        label: t("cert_pending", "Chờ duyệt"),
        className: "bg-amber-100/85 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
        icon: <AlertCircle size={14} />,
      },
      rejected: {
        label: t("cert_rejected", "Từ chối"),
        className: "bg-rose-100/85 text-rose-700 border border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
        icon: <AlertCircle size={14} />,
      },
    }

    const cfg = map[normalized(status)] || map.pending
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${cfg.className}`}>
        {cfg.icon}
        {cfg.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={34} className="animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-cyan-100/70 bg-white/85 p-6 shadow-[0_24px_60px_rgba(14,165,233,0.14)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 md:p-8"
      style={{ backgroundImage: "url('/image/bg_certificate.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(34,211,238,0.22),transparent_45%),radial-gradient(100%_95%_at_95%_0%,rgba(59,130,246,0.2),transparent_45%)]" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/70 bg-cyan-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-900/30 dark:text-cyan-200">
                <Sparkles className="h-4 w-4" />
                {t("cert_badge", "Hall of Achievement")}
              </p>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white md:text-5xl">{t("cert_title", "Chứng chỉ của tôi")}</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 md:text-base">
                {t("cert_hero_desc", "Theo dõi thành tựu đã đạt, tải hoặc chia sẻ chứng chỉ chỉ trong vài giây.")}
              </p>
            </div>

            <button
              type="button"
              onClick={openAttemptModal}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
            >
              <FileText className="h-4 w-4" />
              {t("cert_view_exam_list", "Xem danh sách bài thi đã làm")}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
            {[
              { label: t("cert_total_label", "Tổng chứng chỉ"), value: stats.total, icon: Award },
              { label: t("cert_courses_label", "Khóa học"), value: stats.courses, icon: FileText },
            ].map((item, idx) => (
              <motion.article
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + idx * 0.05 }}
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("cert_search", "Tìm theo khóa học, giảng viên hoặc mã chứng chỉ...")}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.2)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
            />
          </div>
        </div>
      </motion.div>

      {filteredCertificates.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCertificates.map((cert, idx) => (
            <motion.article
              key={cert.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              whileHover={{ y: -5 }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.1)] transition-all hover:border-cyan-400/60 hover:shadow-[0_18px_40px_rgba(14,165,233,0.2)] dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                {shouldUseCertificateImage(cert) ? (
                  <img src={cert.imageUrl} alt={t("cert_image_alt", "Chứng chỉ")} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="relative h-full w-full overflow-hidden bg-[#0d1b2e]">
                    <div className="absolute inset-3 rounded-lg border border-[#b8860b]/45" />
                    <div className="absolute left-0 top-0 h-16 w-full bg-gradient-to-b from-[#b8860b]/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 h-12 w-full bg-gradient-to-t from-[#b8860b]/15 to-transparent" />
                    <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f1d27a]/90">ICS E-LEARNING</p>
                      <p className="mt-1 text-sm font-extrabold uppercase tracking-[0.06em] text-[#ffd700]">{cert.title || t("cert_completed_name_default", "Chứng chỉ hoàn thành")}</p>
                      <p className="mt-2 line-clamp-1 text-xs font-semibold text-[#f8fafc]">{cert.courseTitle || cert.course?.title || t("cert_course_cert", "Chứng chỉ khóa học")}</p>
                      <p className="mt-1 line-clamp-1 text-[11px] text-[#cbd5e1]">{cert.studentName || t("cert_student", "Học viên")}</p>
                      <p className="mt-2 max-w-[90%] truncate rounded-full border border-[#b8860b]/45 bg-[#b8860b]/10 px-2 py-0.5 font-mono text-[10px] text-[#f1d27a]">
                        {cert.certificateNumber || "CERT-XXXX"}
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

                <div className="absolute left-3 top-3">{renderStatusBadge(cert.status)}</div>
                <p className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-semibold text-white">
                  {cert.title || t("cert_completed_name_default", "Chứng chỉ hoàn thành")}
                </p>
                <button
                  type="button"
                  onClick={() => openViewer(cert)}
                  className="absolute inset-0 z-10"
                  aria-label={t("cert_view", "Xem chứng chỉ")}
                />
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                    {t("cert_completed_name_label", "Tên chứng chỉ hoàn thành")}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                    {cert.title || t("cert_completed_name_default", "Chứng chỉ hoàn thành")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-100 px-2 py-1.5 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                    <p className="mb-1 inline-flex items-center gap-1 font-medium">
                      <User className="h-3.5 w-3.5" /> {t("cert_instructor", "Giảng viên")}
                    </p>
                    <p className="line-clamp-1 text-slate-800 dark:text-slate-100">{getInstructorName(cert)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-100 px-2 py-1.5 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                    <p className="mb-1 inline-flex items-center gap-1 font-medium">
                      <Calendar className="h-3.5 w-3.5" /> {t("cert_issue_date", "Ngày cấp")}
                    </p>
                    <p className="line-clamp-1 text-slate-800 dark:text-slate-100">{formatDate(cert.issueDate)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/50">
                  <p className="line-clamp-1 text-xs font-mono text-slate-700 dark:text-slate-200">{cert.certificateNumber || "-"}</p>
                  <button
                    onClick={() => copyCertificateNumber(cert.certificateNumber)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t("cert_copy", "Copy")}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleDownload(cert)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-500"
                  >
                    <Download className="h-4 w-4" />
                    {t("cert_download", "Tải xuống")}
                  </button>

                  <button
                    type="button"
                    onClick={() => openViewer(cert)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Eye className="h-4 w-4" />
                    {t("cert_view", "Xem")}
                  </button>

                  <button
                    onClick={() => handleShare(cert)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Share2 className="h-4 w-4" />
                    {t("cert_share", "Chia sẻ")}
                  </button>

                  {cert.courseId ? (
                    <Link
                      href={`/courses/${cert.courseId}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("cert_course_link", "Khóa học")}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400 dark:border-slate-700">
                      {t("cert_course_link", "Khóa học")}
                    </span>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/70">
          <Award className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("cert_empty", "Chưa có chứng chỉ nào")}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t("cert_empty_desc", "Hoàn thành các bài thi chính thức để nhận chứng chỉ")}
          </p>
        </motion.div>
      )}

      {viewerCert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={closeViewer}
        >
          <div
            className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
              <div>
                <p className="line-clamp-1 text-sm font-semibold text-white">
                  {viewerCert.title || t("cert_completed_name_default", "Chứng chỉ hoàn thành")}
                </p>
                <p className="mt-0.5 text-xs text-slate-300">
                  {t("cert_issue_date", "Ngày cấp")}: {formatDate(viewerCert.issueDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewerZoom((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))))}
                  className="rounded-lg border border-slate-700 p-2 text-slate-100 transition hover:bg-slate-800"
                  aria-label={t("cert_zoom_out", "Thu nhỏ")}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewerZoom(1)}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-800"
                >
                  {Math.round(viewerZoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setViewerZoom((prev) => Math.min(2.5, Number((prev + 0.1).toFixed(2))))}
                  className="rounded-lg border border-slate-700 p-2 text-slate-100 transition hover:bg-slate-800"
                  aria-label={t("cert_zoom_in", "Phóng to")}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={closeViewer}
                  className="rounded-lg border border-slate-700 p-2 text-slate-100 transition hover:bg-slate-800"
                  aria-label={t("close", "Đóng")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[72vh] overflow-auto bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.55),rgba(2,6,23,1))] p-4 md:p-6">
              {shouldUseCertificateImage(viewerCert) ? (
                <div className="mx-auto w-fit rounded-xl border border-slate-700 bg-white p-2 shadow-[0_18px_40px_rgba(2,6,23,0.6)]">
                  <img
                    src={viewerCert.imageUrl}
                    alt={t("cert_image_alt", "Chứng chỉ")}
                    className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain transition-transform duration-200"
                    style={{ transform: `scale(${viewerZoom})`, transformOrigin: "center center" }}
                  />
                </div>
              ) : viewerCert.pdfUrl && isPdfLike(viewerCert.pdfUrl) ? (
                <iframe
                  src={viewerCert.pdfUrl}
                  title={t("cert_title", "Chứng chỉ")}
                  className="h-[70vh] w-full rounded-xl border border-slate-700 bg-white"
                />
              ) : (
                <iframe
                  src={`/certificate-print/${viewerCert.id}?embed=1`}
                  title={t("cert_title", "Chứng chỉ")}
                  className="h-[70vh] w-full rounded-xl border border-slate-700 bg-white"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 bg-slate-900/90 px-4 py-3">
              <button
                type="button"
                onClick={() => handleShare(viewerCert)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-800"
              >
                <Share2 className="h-4 w-4" />
                {t("cert_share", "Chia sẻ")}
              </button>
              <button
                type="button"
                onClick={() => handleDownload(viewerCert)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                {t("cert_download", "Tải xuống")}
              </button>
              <Link
                href={`/certificate-print/${viewerCert.id}?print=1`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-500"
              >
                <Maximize2 className="h-4 w-4" />
                {t("cert_view", "Xem chứng chỉ")}
              </Link>
            </div>
          </div>
        </div>
      )}

      {attemptModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setAttemptModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-cyan-200/30 bg-white shadow-[0_28px_80px_rgba(2,132,199,0.26)] dark:border-slate-700 dark:bg-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative border-b border-cyan-100 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(34,211,238,0.2),transparent_45%),radial-gradient(100%_95%_at_95%_0%,rgba(59,130,246,0.16),transparent_45%)] px-5 py-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/70 bg-cyan-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-900/20 dark:text-cyan-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("cert_exam_attempt_badge", "Lịch sử thực hiện")}
                  </p>
                  <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white md:text-2xl">
                    {t("cert_exam_attempt_title", "Chi tiết bài thi đã thực hiện")}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {t("cert_exam_attempt_desc", "Theo dõi số lần làm bài, điểm số và số câu đúng/sai theo từng đề thi.")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAttemptModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  aria-label={t("close", "Đóng")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[74vh] space-y-5 overflow-auto p-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  {
                    label: t("cert_exam_total", "Số đề đã làm"),
                    value: attemptSummaries.length,
                    icon: FileText,
                  },
                  {
                    label: t("cert_exam_attempt_total", "Tổng attempt"),
                    value: attemptSummaries.reduce((sum, item) => sum + item.attemptUsed, 0),
                    icon: Calendar,
                  },
                  {
                    label: t("cert_exam_avg_score", "Điểm TB lần gần nhất"),
                    value:
                      attemptSummaries.length > 0
                        ? `${(
                            attemptSummaries.reduce((sum, item) => sum + item.latestScore, 0) /
                            attemptSummaries.length
                          ).toFixed(1)}%`
                        : "0%",
                    icon: Award,
                  },
                  {
                    label: t("cert_exam_passed", "Đạt lần gần nhất"),
                    value: attemptSummaries.filter((item) => item.latestPassed).length,
                    icon: CheckCircle,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-[0_8px_20px_rgba(14,165,233,0.08)] dark:border-slate-800 dark:bg-slate-900/70"
                  >
                    <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              {attemptModalLoading ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70">
                  <Loader2 className="h-7 w-7 animate-spin text-cyan-500" />
                </div>
              ) : attemptSummaries.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {attemptSummaries.map((item, idx) => (
                    <motion.article
                      key={item.examId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-base font-bold text-slate-900 dark:text-white">{item.examTitle}</h3>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            item.latestPassed
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                          }`}
                        >
                          {item.latestPassed ? t("exam_result_passed", "Đạt") : t("exam_result_failed", "Chưa đạt")}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-cyan-50 px-2.5 py-2 dark:bg-cyan-950/30">
                          <p className="text-slate-500 dark:text-slate-400">{t("cert_exam_attempt_used", "Attempt đã dùng")}</p>
                          <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300">{item.attemptUsed}</p>
                        </div>
                        <div className="rounded-lg bg-slate-100 px-2.5 py-2 dark:bg-slate-800/70">
                          <p className="text-slate-500 dark:text-slate-400">{t("cert_exam_score", "Điểm")}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.latestScore.toFixed(1)}%</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 px-2.5 py-2 dark:bg-emerald-950/30">
                          <p className="text-slate-500 dark:text-slate-400">{t("cert_exam_correct", "Câu đúng")}</p>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{item.latestCorrectCount}</p>
                        </div>
                        <div className="rounded-lg bg-rose-50 px-2.5 py-2 dark:bg-rose-950/30">
                          <p className="text-slate-500 dark:text-slate-400">{t("cert_exam_incorrect", "Câu sai")}</p>
                          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{item.latestIncorrectCount}</p>
                        </div>
                      </div>

                      <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                        {t("cert_exam_latest_attempt", "Lần làm gần nhất")}: {formatDate(item.latestDate)}
                      </p>
                    </motion.article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900/70">
                  <FileText className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {t("cert_exam_attempt_empty", "Bạn chưa thực hiện bài thi nào")}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t("cert_exam_attempt_empty_desc", "Hãy hoàn thành bài thi để xem chi tiết lịch sử tại đây.")}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
