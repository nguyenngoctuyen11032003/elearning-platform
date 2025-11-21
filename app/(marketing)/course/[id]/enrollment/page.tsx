"use client"

import { useState, use } from "react"
import { motion } from "framer-motion"
import { CreditCard, Wallet, QrCode } from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"

export default function EnrollmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet" | "qr">("card")
  const [isProcessing, setIsProcessing] = useState(false)

  const course = {
    title: "Lập trình Next.js từ Cơ bản đến Nâng cao",
    price: 499000,
    thumbnail: "/next-js-course.jpg",
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsProcessing(false)
    // Redirect to success page
    window.location.href = "/enrollment/success"
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Hoàn tất thanh toán</h1>
          <p className="text-slate-400">Chọn phương thức thanh toán để đăng ký khóa học</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
            <PremiumCard>
              <h2 className="text-xl font-bold text-white mb-4">Tóm tắt đơn hàng</h2>

              <div className="mb-6">
                <img
                  src={course.thumbnail || "/placeholder.svg"}
                  alt={course.title}
                  className="w-full rounded-lg mb-4"
                />
                <h3 className="text-white font-semibold">{course.title}</h3>
              </div>

              <div className="space-y-3 py-4 border-y border-slate-800">
                <div className="flex justify-between text-slate-300">
                  <span>Giá khóa học</span>
                  <span>{(course.price / 1000).toLocaleString()}K</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Giảm giá</span>
                  <span className="text-green-400">-50K</span>
                </div>
              </div>

              <div className="flex justify-between text-white font-bold text-lg mt-4">
                <span>Tổng cộng</span>
                <span className="text-blue-400">{((course.price - 50000) / 1000).toLocaleString()}K</span>
              </div>
            </PremiumCard>
          </motion.div>

          {/* Payment Methods */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
            <div className="space-y-6">
              {/* Card Payment */}
              <PremiumCard
                className={`cursor-pointer transition-all ${
                  paymentMethod === "card" ? "border-blue-500 bg-blue-500/5" : ""
                }`}
                onClick={() => setPaymentMethod("card")}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === "card" ? "border-blue-500 bg-blue-500" : "border-slate-600"
                    }`}
                  >
                    {paymentMethod === "card" && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard size={20} className="text-blue-400" />
                      <h3 className="text-white font-semibold">Thẻ tín dụng / Ghi nợ</h3>
                    </div>
                    <p className="text-slate-400 text-sm">Visa, Mastercard, JCB</p>
                  </div>
                </div>

                {paymentMethod === "card" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 space-y-4"
                  >
                    <input
                      type="text"
                      placeholder="Số thẻ"
                      className="w-full bg-slate-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="bg-slate-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        className="bg-slate-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </motion.div>
                )}
              </PremiumCard>

              {/* Wallet Payment */}
              <PremiumCard
                className={`cursor-pointer transition-all ${
                  paymentMethod === "wallet" ? "border-blue-500 bg-blue-500/5" : ""
                }`}
                onClick={() => setPaymentMethod("wallet")}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === "wallet" ? "border-blue-500 bg-blue-500" : "border-slate-600"
                    }`}
                  >
                    {paymentMethod === "wallet" && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet size={20} className="text-green-400" />
                      <h3 className="text-white font-semibold">Ví điện tử</h3>
                    </div>
                    <p className="text-slate-400 text-sm">Momo, ZaloPay, VNPay</p>
                  </div>
                </div>
              </PremiumCard>

              {/* QR Payment */}
              <PremiumCard
                className={`cursor-pointer transition-all ${
                  paymentMethod === "qr" ? "border-blue-500 bg-blue-500/5" : ""
                }`}
                onClick={() => setPaymentMethod("qr")}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === "qr" ? "border-blue-500 bg-blue-500" : "border-slate-600"
                    }`}
                  >
                    {paymentMethod === "qr" && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode size={20} className="text-purple-400" />
                      <h3 className="text-white font-semibold">Mã QR</h3>
                    </div>
                    <p className="text-slate-400 text-sm">Quét mã QR để thanh toán</p>
                  </div>
                </div>
              </PremiumCard>

              {/* Payment Button */}
              <AnimatedButton className="w-full py-4 text-lg" onClick={handlePayment} disabled={isProcessing}>
                {isProcessing ? "Đang xử lý..." : "Thanh toán ngay"}
              </AnimatedButton>

              <p className="text-center text-slate-400 text-sm">
                Bằng cách nhấp "Thanh toán ngay", bạn đồng ý với Điều khoản dịch vụ
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
