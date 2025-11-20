"use client"

import { motion } from "framer-motion"
import { Download, Share2 } from "lucide-react"
import { PremiumCard } from "@/components/ui/premium-card"
import { AnimatedButton } from "@/components/ui/animated-button"

export default function CertificatesPage() {
  const certificates = [
    {
      id: "1",
      course: "Lập trình Next.js từ Cơ bản đến Nâng cao",
      instructor: "Nguyễn Ngọc Tuyền",
      issuedDate: "2024-03-15",
      certificateNumber: "CERT-2024-001",
    },
    {
      id: "2",
      course: "React Hooks Advanced",
      instructor: "Trần Minh Tuấn",
      issuedDate: "2024-02-20",
      certificateNumber: "CERT-2024-002",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white">Chứng chỉ của tôi</h1>
        <p className="text-slate-400 mt-1">Tổng cộng {certificates.length} chứng chỉ đã đạt được</p>
      </motion.div>

      {/* Certificates */}
      <div className="space-y-6">
        {certificates.map((cert, idx) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <PremiumCard>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">{cert.course}</h3>
                  <p className="text-slate-400 mb-4">Giảng viên: {cert.instructor}</p>
                  <div className="flex flex-col md:flex-row gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Ngày cấp</p>
                      <p className="text-white font-semibold">{cert.issuedDate}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Số chứng chỉ</p>
                      <p className="text-white font-semibold">{cert.certificateNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto">
                  <AnimatedButton className="flex items-center justify-center gap-2">
                    <Download size={20} />
                    Tải xuống
                  </AnimatedButton>
                  <button className="px-6 py-3 border-2 border-blue-600 text-blue-400 rounded-full hover:bg-blue-600/10 transition flex items-center justify-center gap-2">
                    <Share2 size={20} />
                    Chia sẻ
                  </button>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
