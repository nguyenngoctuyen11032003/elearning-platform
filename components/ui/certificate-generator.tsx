"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { Download } from "lucide-react"

interface CertificateGeneratorProps {
  studentName: string
  courseName: string
  instructorName: string
  completionDate: string
  certificateNumber: string
}

export function CertificateGenerator({
  studentName,
  courseName,
  instructorName,
  completionDate,
  certificateNumber,
}: CertificateGeneratorProps) {
  const certificateRef = useRef<HTMLDivElement>(null)

  const handleDownload = () => {
    if (certificateRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = 1200
      canvas.height = 800

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Background
      ctx.fillStyle = "#0F172A"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Border
      ctx.strokeStyle = "#2563EB"
      ctx.lineWidth = 8
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80)

      // Title
      ctx.fillStyle = "#2563EB"
      ctx.font = "bold 60px Arial"
      ctx.textAlign = "center"
      ctx.fillText("CHỨNG CHỈ HOÀN THÀNH", canvas.width / 2, 150)

      // Subtitle
      ctx.fillStyle = "#94a3b8"
      ctx.font = "20px Arial"
      ctx.fillText("Chững chỉ Hoàn Thành", canvas.width / 2, 200)

      // Student name
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 40px Arial"
      ctx.fillText(studentName, canvas.width / 2, 320)

      // Course info
      ctx.fillStyle = "#cbd5e1"
      ctx.font = "18px Arial"
      ctx.fillText(`đã hoàn thành khóa học`, canvas.width / 2, 380)

      ctx.fillStyle = "#2563EB"
      ctx.font = "bold 24px Arial"
      ctx.fillText(courseName, canvas.width / 2, 430)

      // Instructor
      ctx.fillStyle = "#cbd5e1"
      ctx.font = "16px Arial"
      ctx.fillText(`Giảng viên: ${instructorName}`, canvas.width / 2, 500)

      // Date and Certificate Number
      ctx.fillStyle = "#94a3b8"
      ctx.font = "14px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`Ngày cấp: ${completionDate}`, 100, 650)
      ctx.textAlign = "right"
      ctx.fillText(`Số chứng chỉ: ${certificateNumber}`, canvas.width - 100, 650)

      // Download
      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = `certificate-${certificateNumber}.png`
      link.click()
    }
  }

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <motion.div
        ref={certificateRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-lg p-12 text-center border-4 border-blue-600 aspect-video flex flex-col items-center justify-center"
      >
        <h1 className="text-4xl font-bold text-blue-400 mb-2">CHỨNG CHỈ HOÀN THÀNH</h1>
        <p className="text-slate-400 mb-8">Chững chỉ Hoàn Thành</p>

        <p className="text-slate-300 mb-4">Chứng nhận rằng</p>
        <h2 className="text-3xl font-bold text-white mb-6">{studentName}</h2>

        <p className="text-slate-300 mb-2">đã hoàn thành khóa học</p>
        <h3 className="text-2xl font-bold text-blue-400 mb-8">{courseName}</h3>

        <p className="text-slate-400 mb-12">Giảng viên: {instructorName}</p>

        <div className="flex justify-between w-full text-sm text-slate-400">
          <span>Ngày cấp: {completionDate}</span>
          <span>Số chứng chỉ: {certificateNumber}</span>
        </div>
      </motion.div>

      {/* Download Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDownload}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/50 transition"
      >
        <Download size={20} />
        Tải xuống chứng chỉ
      </motion.button>
    </div>
  )
}
