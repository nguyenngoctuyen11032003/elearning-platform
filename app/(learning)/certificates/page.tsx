"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Download, Share2, Award, Calendar, User, FileText, CheckCircle, ExternalLink, Loader2 } from "lucide-react"
import { PremiumCard } from "@/components/ui/premium-card"
import { PageHero } from "@/components/ui/page-hero"
import { useLanguage } from "@/lib/i18n/language-context"

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
  return {
    id: raw?.id || "",
    certificateNumber: raw?.certificateNumber || "",
    issueDate: raw?.issueDate || raw?.createdAt || new Date().toISOString(),
    pdfUrl: raw?.pdfUrl || undefined,
    imageUrl: raw?.imageUrl || undefined,
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
  const { t } = useLanguage()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
        if (!token) return
        const res = await fetch("/api/certificates/my-certificates", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Failed")
        const payload = await res.json()
        const raw: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : []
        setCertificates(raw.map(mapCertificate))
      } catch {
        setCertificates([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const getInstructorName = (cert: Certificate) => {
    const t = cert.course?.teacher
    if (!t) return ""
    return t.name || [t.firstName, t.lastName].filter(Boolean).join(" ") || "Giảng viên"
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
      alert(`Link chứng chỉ: ${url}`)
    }
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
        <div className="grid md:grid-cols-2 gap-6">
          {certificates.map((cert, idx) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <PremiumCard className="overflow-hidden">
                {/* Certificate Preview */}
                <div className="h-40 bg-gradient-to-br from-primary/30 to-purple-600/30 flex items-center justify-center relative overflow-hidden">
                  {cert.imageUrl ? (
                    <img src={cert.imageUrl} alt={t("cert_image_alt", "Chứng chỉ")} className="w-full h-full object-cover" />
                  ) : (
                    <Award size={64} className="text-white/50" />
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs rounded-full border ${
                      cert.status === "approved"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : cert.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}>
                      {cert.status === "approved" ? t("cert_approved", "Đã xác nhận") : cert.status === "pending" ? t("cert_pending", "Chờ duyệt") : t("cert_rejected", "Từ chối")}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground dark:text-white mb-1">
                    {cert.course?.title || t("cert_course_cert", "Chứng chỉ khóa học")}
                  </h3>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-4">
                    {t("cert_completion", "Chứng nhận hoàn thành xuất sắc khóa học")}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground dark:text-slate-500 flex items-center gap-1">
                        <User size={14} /> {t("cert_instructor", "Giảng viên")}
                      </p>
                      <p className="text-foreground dark:text-white font-medium">{getInstructorName(cert)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground dark:text-slate-500 flex items-center gap-1">
                        <Calendar size={14} /> {t("cert_issue_date", "Ngày cấp")}
                      </p>
                      <p className="text-foreground dark:text-white font-medium">{formatDate(cert.issueDate)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground dark:text-slate-500">{t("cert_number", "Số chứng chỉ")}</p>
                      <p className="text-foreground dark:text-white font-medium font-mono text-xs">{cert.certificateNumber}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border dark:border-slate-700">
                    <button
                      onClick={() => handleDownload(cert)}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      {t("cert_download", "Tải xuống")}
                    </button>
                    <button
                      onClick={() => handleShare(cert)}
                      className="px-4 py-2 border border-border dark:border-slate-700 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <Share2 size={16} />
                      {t("cert_share", "Chia sẻ")}
                    </button>
                    {cert.courseId && (
                      <Link
                        href={`/courses/${cert.courseId}`}
                        className="px-4 py-2 border border-border dark:border-slate-700 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
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
