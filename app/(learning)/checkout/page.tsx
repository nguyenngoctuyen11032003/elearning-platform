"use client"

import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { CreditCard, Wallet, QrCode, Check } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { formatPrice } from "@/lib/format"

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet" | "qr">("card")
  const [isProcessing, setIsProcessing] = useState(false)

  const course = {
    title: "Lập trình Next.js từ cơ bản đến nâng cao",
    price: 499000,
    image: "/placeholder.jpg",
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    window.location.href = "/enrollment/success"
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-8">Thanh toán</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 sticky top-8">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-4">Tóm tắt đơn hàng</h2>
                <img
                  src={course.image || "/placeholder.svg"}
                  alt={course.title}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
                <p className="font-semibold text-foreground dark:text-white mb-4">{course.title}</p>
                <div className="border-t border-border dark:border-slate-800 pt-4 space-y-2">
                  <div className="flex justify-between text-foreground dark:text-white">
                    <span>Giá khóa học</span>
                    <span>₫{formatPrice(course.price)}</span>
                  </div>
                  <div className="flex justify-between text-foreground dark:text-white">
                    <span>Phí xử lý</span>
                    <span>₫0</span>
                  </div>
                  <div className="border-t border-border dark:border-slate-800 pt-2 flex justify-between font-bold text-lg text-foreground dark:text-white">
                    <span>Tổng cộng</span>
                    <span>₫{formatPrice(course.price)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-6">Phương thức thanh toán</h2>

                <div className="space-y-4 mb-8">
                  {[
                    { id: "card", icon: CreditCard, label: "Thẻ tín dụng / Ghi nợ", desc: "Visa, Mastercard, JCB" },
                    { id: "wallet", icon: Wallet, label: "Ví điện tử", desc: "VNPay, Momo, ZaloPay" },
                    { id: "qr", icon: QrCode, label: "Mã QR", desc: "Quét mã QR để thanh toán" },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`w-full p-4 border-2 rounded-lg transition-smooth text-left flex items-center gap-4 ${
                        paymentMethod === method.id
                          ? "border-primary dark:border-accent bg-primary/5 dark:bg-accent/5"
                          : "border-border dark:border-slate-800 hover:border-primary dark:hover:border-accent"
                      }`}
                    >
                      <method.icon
                        size={24}
                        className={
                          paymentMethod === method.id
                            ? "text-primary dark:text-accent"
                            : "text-muted-foreground dark:text-slate-400"
                        }
                      />
                      <div>
                        <p className="font-semibold text-foreground dark:text-white">{method.label}</p>
                        <p className="text-sm text-muted-foreground dark:text-slate-400">{method.desc}</p>
                      </div>
                      {paymentMethod === method.id && (
                        <Check size={20} className="ml-auto text-primary dark:text-accent" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Payment Form */}
                {paymentMethod === "card" && (
                  <div className="space-y-4 mb-8 p-4 bg-background dark:bg-slate-950 rounded-lg">
                    <div>
                      <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Số thẻ</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full bg-card dark:bg-slate-900 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                          Hạn sử dụng
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full bg-card dark:bg-slate-900 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full bg-card dark:bg-slate-900 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Coupon */}
                <div className="mb-8 p-4 bg-background dark:bg-slate-950 rounded-lg">
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">
                    Mã coupon (nếu có)
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập mã coupon"
                    className="w-full bg-card dark:bg-slate-900 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-semibold disabled:opacity-50"
                >
                  {isProcessing ? "Đang xử lý..." : `Thanh toán ₫${formatPrice(course.price)}`}
                </button>

                <p className="text-center text-xs text-muted-foreground dark:text-slate-400 mt-4">
                  Bằng cách thanh toán, bạn đồng ý với{" "}
                  <Link href="/terms" className="hover:underline">
                    Điều khoản sử dụng
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
