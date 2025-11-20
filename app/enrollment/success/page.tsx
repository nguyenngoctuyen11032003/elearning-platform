"use client"

import { motion } from "framer-motion"
import { CheckCircle, Download } from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"

export default function EnrollmentSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full px-6"
      >
        <PremiumCard className="text-center space-y-6">
          {/* Success Icon */}
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.6 }} className="flex justify-center">
            <CheckCircle size={80} className="text-green-500" />
          </motion.div>

          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Đăng ký thành công!</h1>
            <p className="text-slate-300 text-lg">Bạn đã được thêm vào khóa học</p>
          </div>

          {/* Course Info */}
          <div className="bg-slate-800/50 rounded-lg p-6 text-left">
            <h2 className="text-white font-semibold mb-4">Thông tin khóa học</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Khóa học</span>
                <span className="text-white font-semibold">Lập trình Next.js</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Giảng viên</span>
                <span className="text-white font-semibold">Nguyễn Ngọc Tuyền</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ngày bắt đầu</span>
                <span className="text-white font-semibold">Ngay bây giờ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời lượng</span>
                <span className="text-white font-semibold">40 giờ</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AnimatedButton className="flex items-center justify-center gap-2">Bắt đầu học ngay</AnimatedButton>
            <button className="px-6 py-3 border-2 border-blue-600 text-blue-400 rounded-full hover:bg-blue-600/10 transition flex items-center justify-center gap-2">
              <Download size={20} />
              Tải hóa đơn
            </button>
          </div>

          {/* Next Steps */}
          <div className="pt-6 border-t border-slate-800">
            <p className="text-slate-400 text-sm mb-4">Các bước tiếp theo:</p>
            <ul className="space-y-2 text-left">
              <li className="flex items-center gap-3 text-slate-300">
                <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                  1
                </span>
                Truy cập khóa học từ dashboard
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                  2
                </span>
                Xem bài học đầu tiên
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                  3
                </span>
                Hoàn thành khóa học để nhận chứng chỉ
              </li>
            </ul>
          </div>
        </PremiumCard>
      </motion.div>
    </div>
  )
}
