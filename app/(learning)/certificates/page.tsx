"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Download, Share2, Award, Calendar, User, FileText, CheckCircle, ExternalLink } from "lucide-react"
import { PremiumCard } from "@/components/ui/premium-card"
import { PageHero } from "@/components/ui/page-hero"

interface Certificate {
  id: string
  title: string
  courseName: string
  courseId: string
  instructorName: string
  issuedDate: string
  certificateNumber: string
  examTitle: string
  examId: string
  score: number
  validityPeriod: string
  imageUrl?: string
}

// Mock data - sẽ được thay thế bằng API
const mockCertificates: Certificate[] = [
  {
    id: "cert-1",
    title: "Chứng chỉ Next.js Master",
    courseName: "Lập trình Next.js từ Cơ bản đến Nâng cao",
    courseId: "course-1",
    instructorName: "Nguyễn Ngọc Tuyền",
    issuedDate: "2025-01-15",
    certificateNumber: "CERT-2025-001",
    examTitle: "Bài thi cuối khóa Next.js",
    examId: "exam-1",
    score: 85,
    validityPeriod: "Vĩnh viễn"
  },
  {
    id: "cert-2",
    title: "Chứng chỉ React Expert",
    courseName: "React Hooks Advanced & State Management",
    courseId: "course-2",
    instructorName: "Trần Minh Tuấn",
    issuedDate: "2025-01-10",
    certificateNumber: "CERT-2025-002",
    examTitle: "Bài thi React Hooks",
    examId: "exam-2",
    score: 92,
    validityPeriod: "2 năm"
  },
]

export default function CertificatesPage() {
  const [certificates] = useState<Certificate[]>(mockCertificates)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-8">
      <PageHero
        title="Chứng chỉ của tôi"
        subtitle={`Tổng cộng ${certificates.length} chứng chỉ đã đạt được`}
        bgImage="/image/bg_certificate.png"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Award size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground dark:text-white">{certificates.length}</p>
                  <p className="text-xs text-muted-foreground">Chứng chỉ</p>
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
                    {certificates.filter(c => c.validityPeriod === "Vĩnh viễn").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Vĩnh viễn</p>
                </div>
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Calendar size={20} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground dark:text-white">
                    {certificates.filter(c => c.validityPeriod !== "Vĩnh viễn").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Có thời hạn</p>
                </div>
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <FileText size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground dark:text-white">
                    {Math.round(certificates.reduce((sum, c) => sum + c.score, 0) / certificates.length || 0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Điểm TB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageHero>

      {/* Certificates Grid */}
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
              <div
                className="h-40 bg-gradient-to-br from-primary/30 to-purple-600/30 flex items-center justify-center relative"
              >
                <Award size={64} className="text-white/50" />
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                    {cert.validityPeriod}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">{cert.title}</h3>
                <p className="text-muted-foreground dark:text-slate-400 text-sm mb-4">{cert.courseName}</p>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-500 flex items-center gap-1">
                      <User size={14} /> Giảng viên
                    </p>
                    <p className="text-foreground dark:text-white font-medium">{cert.instructorName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-500 flex items-center gap-1">
                      <Calendar size={14} /> Ngày cấp
                    </p>
                    <p className="text-foreground dark:text-white font-medium">{formatDate(cert.issuedDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-500">Số chứng chỉ</p>
                    <p className="text-foreground dark:text-white font-medium">{cert.certificateNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-500">Điểm thi</p>
                    <p className="text-green-500 font-bold">{cert.score}%</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-border dark:border-slate-700">
                  <button
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Tải xuống
                  </button>
                  <button className="px-4 py-2 border border-border dark:border-slate-700 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <Share2 size={16} />
                    Chia sẻ
                  </button>
                  <Link
                    href={`/exams/${cert.examId}/result`}
                    className="px-4 py-2 border border-border dark:border-slate-700 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Xem bài thi
                  </Link>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>

      {certificates.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Award size={64} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">Chưa có chứng chỉ nào</h3>
          <p className="text-muted-foreground dark:text-slate-400 mb-4">
            Hoàn thành các bài thi chính thức để nhận chứng chỉ
          </p>
          <Link
            href="/exams"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <FileText size={18} />
            Xem danh sách bài thi
          </Link>
        </motion.div>
      )}
    </div>
  )
}
