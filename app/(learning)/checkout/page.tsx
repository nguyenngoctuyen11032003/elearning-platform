"use client"

import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { QrCode, Clock, CheckCircle, ArrowLeft, User } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { formatPrice } from "@/lib/format"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

interface CheckoutItem {
  id: string
  title: string
  teacher: string
  teacherId: string
  teacherQR: string
  price: number
  rating: number
  students: number
  image: string
}

interface CheckoutTotal {
  subtotal: number
  discount: number
  total: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [countdown, setCountdown] = useState(600) // 10 phút
  const [qrGenerated, setQrGenerated] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CheckoutItem | null>(null)
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([])
  const [checkoutTotal, setCheckoutTotal] = useState<CheckoutTotal>({ subtotal: 0, discount: 0, total: 0 })

  useEffect(() => {
    // Lấy thông tin từ localStorage
    const items = JSON.parse(localStorage.getItem("checkoutItems") || "[]")
    const total = JSON.parse(
      localStorage.getItem("checkoutTotal") || '{"subtotal":0,"discount":0,"total":0}'
    )
    setCheckoutItems(items)
    setCheckoutTotal(total)

    // Nếu chỉ có 1 khóa học, tự động chọn
    if (items.length === 1) {
      setSelectedCourse(items[0])
    }
  }, [])

  useEffect(() => {
    if (countdown > 0 && qrGenerated) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown, qrGenerated])

  const handleGenerateQR = () => {
    if (!selectedCourse) {
      alert("Vui lòng chọn khóa học để thanh toán")
      return
    }
    setQrGenerated(true)
  }

  const handlePayment = async () => {
    if (!selectedCourse) {
      alert("Vui lòng chọn khóa học để thanh toán")
      return
    }
    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    window.location.href = "/enrollment/success"
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12 px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">Chưa có khóa học nào</h2>
            <p className="text-muted-foreground dark:text-slate-400 mb-6">
              Vui lòng chọn khóa học từ danh sách yêu thích để thanh toán
            </p>
            <Link
              href="/wishlist"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-full font-semibold hover:shadow-xl transition-all"
            >
              <ArrowLeft size={20} />
              Quay lại danh sách yêu thích
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white mb-2">Thanh toán khóa học</h1>
            <p className="text-muted-foreground dark:text-slate-400">Chọn khóa học và quét mã QR của giảng viên</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Course Selection - Bên trái */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-4"
            >
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle size={22} className="text-primary dark:text-accent" />
                  Chọn khóa học thanh toán
                </h2>
                <div className="space-y-3">
                  {checkoutItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedCourse(item)
                        setQrGenerated(false)
                        setCountdown(600)
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedCourse?.id === item.id
                          ? "border-primary dark:border-accent bg-primary/5 dark:bg-accent/5"
                          : "border-border dark:border-slate-800 hover:border-primary/50 dark:hover:border-accent/50"
                      }`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.title}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground dark:text-white mb-1 line-clamp-2 text-sm">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-slate-400 mb-1">
                            <User size={12} />
                            <span>{item.teacher}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-primary dark:text-accent font-bold text-sm">
                              ₫{formatPrice(item.price)}
                            </span>
                            <span className="text-xs text-yellow-400">
                              {item.rating} ⭐
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected Course Summary */}
                {selectedCourse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 pt-6 border-t border-border dark:border-slate-800"
                  >
                    <h3 className="text-sm font-semibold text-foreground dark:text-white mb-3">Khóa học đã chọn:</h3>
                    <div className="bg-background dark:bg-slate-950 rounded-xl p-4">
                      <p className="font-semibold text-foreground dark:text-white mb-2 line-clamp-2 text-sm">
                        {selectedCourse.title}
                      </p>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground dark:text-slate-400">Giảng viên:</span>
                        <span className="text-primary dark:text-accent font-medium">{selectedCourse.teacher}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-border dark:border-slate-800">
                        <span className="text-muted-foreground dark:text-slate-400">Số tiền:</span>
                        <span className="text-xl font-bold text-primary dark:text-accent">
                          ₫{formatPrice(selectedCourse.price)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Coupon */}
                <div className="mt-6 pt-6 border-t border-border dark:border-slate-800">
                  <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">
                    Mã giảm giá (nếu có)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã coupon"
                      className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-sm"
                    />
                    <button className="px-4 py-2 bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent rounded-lg hover:bg-primary/20 dark:hover:bg-accent/20 transition font-medium text-sm">
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* QR Payment - Bên phải */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3"
            >
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                    <QrCode size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground dark:text-white">Thanh toán QR Code</h2>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Nhanh chóng & An toàn</p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!qrGenerated ? (
                    <motion.div
                      key="generate"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 dark:from-primary/20 dark:via-accent/20 dark:to-primary/10 rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-foreground dark:text-white">Hướng dẫn thanh toán:</h3>
                        <ol className="space-y-3 text-sm text-muted-foreground dark:text-slate-300">
                          <li className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary dark:bg-accent text-white text-xs font-bold flex-shrink-0">
                              1
                            </span>
                            <span>Nhấn nút "Tạo mã QR" để sinh mã thanh toán</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary dark:bg-accent text-white text-xs font-bold flex-shrink-0">
                              2
                            </span>
                            <span>Mở ứng dụng ngân hàng hoặc ví điện tử của bạn</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary dark:bg-accent text-white text-xs font-bold flex-shrink-0">
                              3
                            </span>
                            <span>Quét mã QR và xác nhận thanh toán</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary dark:bg-accent text-white text-xs font-bold flex-shrink-0">
                              4
                            </span>
                            <span>Đợi xác nhận và bắt đầu học ngay!</span>
                          </li>
                        </ol>
                      </div>

                      <button
                        onClick={handleGenerateQR}
                        className="w-full px-6 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-2xl transition-all font-semibold text-lg hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Tạo mã QR thanh toán
                      </button>

                      <p className="text-center text-xs text-muted-foreground dark:text-slate-400">
                        Hỗ trợ tất cả ngân hàng và ví điện tử tại Việt Nam
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Countdown Timer */}
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center gap-3">
                        <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Mã QR hết hạn sau:</p>
                          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatTime(countdown)}</p>
                        </div>
                      </div>

                      {/* QR Code Display - QR của giảng viên */}
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 flex flex-col items-center">
                        <div className="mb-4 text-center">
                          <p className="text-sm text-muted-foreground dark:text-slate-400 mb-1">Thanh toán cho giảng viên</p>
                          <p className="text-lg font-bold text-foreground dark:text-white">{selectedCourse.teacher}</p>
                        </div>
                        
                        <div className="w-72 h-72 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center mb-4 p-4 border-4 border-primary/20 dark:border-accent/20">
                          {selectedCourse.teacherQR ? (
                            <img
                              src={selectedCourse.teacherQR}
                              alt={`QR ${selectedCourse.teacher}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-center">
                              <QrCode size={180} className="text-slate-800 dark:text-slate-200 mx-auto mb-4" />
                              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                QR Code giảng viên
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-center w-full">
                          <p className="text-lg font-bold text-foreground dark:text-white mb-1">
                            ₫{formatPrice(selectedCourse.price)}
                          </p>
                          <p className="text-sm text-muted-foreground dark:text-slate-400">
                            Mã GD: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
                          </p>
                          <div className="mt-4 pt-4 border-t border-border dark:border-slate-700">
                            <p className="text-xs text-muted-foreground dark:text-slate-400">
                              {selectedCourse.title}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Status */}
                      <div className="bg-background dark:bg-slate-950 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground dark:text-slate-400">Trạng thái</span>
                          <span className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-medium">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                            Đang chờ thanh toán
                          </span>
                        </div>
                      </div>

                      {/* Demo: Confirm Payment Button */}
                      <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? "Đang xác nhận..." : "✓ Xác nhận đã thanh toán (Demo)"}
                      </button>

                      <p className="text-center text-xs text-muted-foreground dark:text-slate-400">
                        Bằng cách thanh toán, bạn đồng ý với{" "}
                        <Link href="/terms" className="hover:underline text-primary dark:text-accent">
                          Điều khoản sử dụng
                        </Link>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
