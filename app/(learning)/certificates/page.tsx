"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Download, Share2, Award, Calendar, User, FileText, CheckCircle, ExternalLink, Loader2, Clock, AlertCircle, Eye } from "lucide-react"
import { PremiumCard } from "@/components/ui/premium-card"
import { PageHero } from "@/components/ui/page-hero"
import { useLanguage } from "@/lib/i18n/language-context"
import { apiClient } from "@/lib/api/client"

interface Certificate {
  id: string
  certificateNumber: string
  issueDate: string
  pdfUrl?: string
  imageUrl?: string
  status: string
  courseId: string
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

function mapCertificate(raw: any): Certificate {
  const imageUrl =
    raw?.imageUrl ||
    raw?.certificateImageUrl ||
    raw?.templateImageUrl ||
    raw?.metadata?.imageUrl ||
    raw?.metadata?.previewUrl ||
    raw?.metadata?.certificateUrl

  return {
    id: raw?.id || "",
    certificateNumber: raw?.certificateNumber || "",
    issueDate: raw?.issueDate || raw?.createdAt || new Date().toISOString(),
    pdfUrl: raw?.pdfUrl || undefined,
    imageUrl: imageUrl || undefined,
    status: raw?.status || "approved",
    courseId: raw?.courseId || raw?.course?.id || "",
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
    const teacher = cert.course?.teacher
    if (!teacher) return ""
    return teacher.name || [teacher.firstName, teacher.lastName].filter(Boolean).join(" ") || t("cert_instructor", "Instructor")
  }

  const handleDownload = (cert: Certificate) => {
    window.open(`/certificates/${cert.id}?print=1`, "_blank")
  }

  const handleShare = async (cert: Certificate) => {
    const url = `${window.location.origin}/certificates/${cert.id}`
    try {
      await navigator.clipboard.writeText(url)
      alert(t("cert_copied", "Đã sao chép link chứng chỉ!"))
    } catch {
      alert(`${t("cert_link_prefix", "Certificate link")}: ${url}`)
    }
  }

  const renderStatusBadge = (status: string) => {
    const normalized = status?.toLowerCase()
    const map: Record<string, { label: string; className: string; icon: JSX.Element }> = {
      approved: {
        label: t("cert_approved", "Đã xác nhận"),
        className: "bg-emerald-100/80 text-emerald-700 border border-emerald-300 shadow-sm",
        icon: <CheckCircle size={14} />,
      },
      pending: {
        label: t("cert_pending", "Chờ duyệt"),
        className: "bg-amber-100/80 text-amber-700 border border-amber-300 shadow-sm",
        icon: <Clock size={14} />,
      },
      rejected: {
        label: t("cert_rejected", "Từ chối"),
        className: "bg-rose-100/80 text-rose-700 border border-rose-300 shadow-sm",
        icon: <AlertCircle size={14} />,
      },
    }

    const cfg = map[normalized] || map.pending
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur ${cfg.className}`}>
        {cfg.icon}
        {cfg.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHero
        title={t("cert_title", "Chứng chỉ của tôi")}
        subtitle={`${t("cert_total", "Tổng cộng")} ${certificates.length} ${t("cert_achieved", "chứng chỉ đã đạt được")}`}
        bgImage="/image/bg_certificate.png"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Award size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground dark:text-white">{certificates.length}</p>
                  <p className="text-xs text-muted-foreground">{t("cert_total_label", "Tổng chứng chỉ")}</p>
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
                  <p className="text-2xl font-bold text-foreground dark:text-white">
                    {certificates.filter(c => c.status === "approved").length}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("cert_approved_label", "Đã phê duyệt")}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <FileText size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground dark:text-white">
                    {certificates.filter(c => c.courseId).map(c => c.courseId).filter((v, i, a) => a.indexOf(v) === i).length}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("cert_courses_label", "Khóa học")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageHero>

      {/* Certificates Grid */}
      {certificates.length > 0 ? (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((cert, idx) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <PremiumCard className="overflow-hidden border border-border/70 dark:border-slate-800 shadow-xl bg-gradient-to-b from-white via-slate-50/70 to-slate-100/60 dark:from-slate-900/80 dark:via-slate-950/70 dark:to-slate-950">
                <div className="relative p-3 sm:p-4">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-white to-purple-50 dark:from-primary/15 dark:via-slate-900 dark:to-slate-950" />
                  <div className="relative rounded-2xl border border-white/70 dark:border-white/10 shadow-[0_20px_60px_rgba(59,130,246,0.12)] overflow-hidden">
                    <div className="absolute top-4 left-4 z-10">{renderStatusBadge(cert.status)}</div>
                    <div className="absolute inset-0 pointer-events-none rounded-2xl border border-white/60 dark:border-white/10" />
                    <div className="relative p-3 sm:p-4 bg-white/70 dark:bg-slate-900/80 backdrop-blur">
                      <div className="relative w-full aspect-[210/297] max-h-[320px] rounded-xl border border-border/70 dark:border-slate-700 bg-slate-950/80 dark:bg-slate-950 shadow-inner overflow-hidden flex items-center justify-center">
                        {cert.imageUrl ? (
                          <img
                            src={cert.imageUrl}
                            alt={t("cert_image_alt", "Chứng chỉ")}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center gap-3 text-white/70">
                            <Award size={56} className="text-white/70" />
                            <p className="text-sm font-medium">
                              {t("cert_preview_empty", "Chưa có ảnh chứng chỉ")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-4 space-y-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs uppercase tracking-[0.08em] text-primary font-semibold">
                      {t("cert_course_cert", "Chứng chỉ khóa học")}
                    </p>
                    <h3 className="text-lg font-bold text-foreground dark:text-white leading-tight">
                      {cert.course?.title || t("cert_course_cert", "Chứng chỉ khóa học")}
                    </h3>
                    <p className="text-muted-foreground dark:text-slate-400 text-[13px]">
                      {t("cert_completion", "Chứng nhận hoàn thành xuất sắc khóa học")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground dark:text-slate-500 flex items-center gap-2 font-medium text-sm">
                        <User size={14} /> {t("cert_instructor", "Giảng viên")}
                      </p>
                      <p className="text-foreground dark:text-white font-semibold text-sm">{getInstructorName(cert)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground dark:text-slate-500 flex items-center gap-2 font-medium text-sm">
                        <Calendar size={14} /> {t("cert_issue_date", "Ngày cấp")}
                      </p>
                      <p className="text-foreground dark:text-white font-semibold text-sm">{formatDate(cert.issueDate)}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-muted-foreground dark:text-slate-500 font-medium">{t("cert_number", "Số chứng chỉ")}</p>
                      <p className="text-foreground dark:text-white font-semibold font-mono text-xs bg-slate-100/80 dark:bg-slate-800/70 rounded-lg px-3 py-2 inline-block">
                        {cert.certificateNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-border dark:border-slate-800">
                    <button
                      onClick={() => handleDownload(cert)}
                      className="flex-1 min-w-[160px] px-4 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <Download size={16} />
                      {t("cert_download", "Tải xuống")}
                    </button>
                    <Link
                      href={`/certificates/${cert.id}`}
                      className="px-4 py-2.5 border border-border dark:border-slate-700 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <Eye size={16} />
                      {t("cert_view", "Xem chứng chỉ")}
                    </Link>
                    <button
                      onClick={() => handleShare(cert)}
                      className="px-4 py-2.5 border border-border dark:border-slate-700 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <Share2 size={16} />
                      {t("cert_share", "Chia sẻ")}
                    </button>
                    {cert.courseId && (
                      <Link
                        href={`/courses/${cert.courseId}`}
                        className="px-4 py-2.5 border border-border dark:border-slate-700 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2 font-semibold"
                      >
                        <ExternalLink size={16} />
                        {t("cert_course_link", "Khóa học")}
                      </Link>
                    )}
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Award size={64} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">{t("cert_empty", "Chưa có chứng chỉ nào")}</h3>
          <p className="text-muted-foreground dark:text-slate-400 mb-4">
            {t("cert_empty_desc", "Hoàn thành các bài thi chính thức để nhận chứng chỉ")}
          </p>
          <Link
            href="/exams"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <FileText size={18} />
            {t("cert_view_exam_list", "Xem danh sách bài thi")}
          </Link>
        </motion.div>
      )}
    </div>
  )
}
