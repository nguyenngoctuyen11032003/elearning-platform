"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CreditCard,
  Wallet,
  Building2,
  QrCode,
  Check,
  ChevronRight,
  Loader2,
  X,
  Shield,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Button } from "./button"
import { apiClient } from "@/lib/api/client"
import Image from "next/image"

interface PaymentCheckoutProps {
  courseId: string
  courseName: string
  coursePrice: number
  courseThumbnail?: string
  discountAmount?: number
  onSuccess?: (paymentData: any) => void
  onCancel?: () => void
}

type PaymentMethod = "vnpay" | "momo" | "bank_transfer"

interface Bank {
  code: string
  name: string
  logo?: string
}

export function PaymentCheckout({
  courseId,
  courseName,
  coursePrice,
  courseThumbnail,
  discountAmount = 0,
  onSuccess,
  onCancel,
}: PaymentCheckoutProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("vnpay")
  const [selectedBank, setSelectedBank] = useState<string>("")
  const [banks, setBanks] = useState<Bank[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showBankList, setShowBankList] = useState(false)

  const finalAmount = coursePrice - discountAmount

  // Load VNPay banks on mount
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const data = await apiClient.getVNPayBanks()
        setBanks(data)
      } catch {
        console.error("Failed to load banks")
      }
    }
    loadBanks()
  }, [])

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  // Handle payment
  const handlePayment = async () => {
    setIsLoading(true)
    setError("")

    try {
      let response

      if (selectedMethod === "vnpay") {
        response = await apiClient.createVNPayPayment({
          courseId,
          amount: finalAmount,
          orderInfo: `Thanh toán khóa học: ${courseName}`,
          bankCode: selectedBank || undefined,
        })

        if (response.paymentUrl) {
          window.location.href = response.paymentUrl
          return
        }
      } else if (selectedMethod === "momo") {
        response = await apiClient.createMomoPayment({
          courseId,
          amount: finalAmount,
          orderInfo: `Thanh toán khóa học: ${courseName}`,
        })

        if (response.payUrl) {
          window.location.href = response.payUrl
          return
        }
      } else {
        // Bank transfer - create pending payment
        response = await apiClient.createPayment({
          courseId,
          amount: finalAmount,
          paymentMethod: "bank_transfer",
        })
        onSuccess?.(response)
        return
      }

      setError("Không thể tạo giao dịch. Vui lòng thử lại.")
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  const paymentMethods = [
    {
      id: "vnpay" as PaymentMethod,
      name: "VNPay",
      description: "Thanh toán qua cổng VNPay",
      icon: <CreditCard className="w-6 h-6" />,
      color: "bg-blue-500",
    },
    {
      id: "momo" as PaymentMethod,
      name: "Momo",
      description: "Ví điện tử Momo",
      icon: <Wallet className="w-6 h-6" />,
      color: "bg-pink-500",
    },
    {
      id: "bank_transfer" as PaymentMethod,
      name: "Chuyển khoản",
      description: "Chuyển khoản ngân hàng",
      icon: <Building2 className="w-6 h-6" />,
      color: "bg-green-500",
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-5 gap-6">
        {/* Payment methods */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-border dark:border-slate-700">
              <h2 className="text-xl font-semibold text-foreground dark:text-white">
                Phương thức thanh toán
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {paymentMethods.map((method) => (
                <motion.button
                  key={method.id}
                  onClick={() => {
                    setSelectedMethod(method.id)
                    if (method.id !== "vnpay") {
                      setSelectedBank("")
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    selectedMethod === method.id
                      ? "border-primary dark:border-accent bg-primary/5 dark:bg-accent/5"
                      : "border-border dark:border-slate-700 hover:border-primary/50 dark:hover:border-accent/50"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${method.color} text-white`}>
                      {method.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground dark:text-white">
                        {method.name}
                      </p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400">
                        {method.description}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedMethod === method.id
                          ? "border-primary dark:border-accent bg-primary dark:bg-accent"
                          : "border-gray-300 dark:border-slate-600"
                      }`}
                    >
                      {selectedMethod === method.id && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Bank selection for VNPay */}
            <AnimatePresence>
              {selectedMethod === "vnpay" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-6">
                    <button
                      onClick={() => setShowBankList(!showBankList)}
                      className="w-full flex items-center justify-between p-4 bg-secondary/50 dark:bg-slate-700/50 rounded-xl hover:bg-secondary dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-primary dark:text-accent" />
                        <span className="text-foreground dark:text-white">
                          {selectedBank
                            ? banks.find((b) => b.code === selectedBank)?.name || "Chọn ngân hàng"
                            : "Chọn ngân hàng (tùy chọn)"}
                        </span>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                          showBankList ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {showBankList && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 max-h-60 overflow-y-auto space-y-2"
                        >
                          <button
                            onClick={() => {
                              setSelectedBank("")
                              setShowBankList(false)
                            }}
                            className={`w-full p-3 rounded-lg text-left transition-colors ${
                              !selectedBank
                                ? "bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent"
                                : "hover:bg-secondary dark:hover:bg-slate-700"
                            }`}
                          >
                            <span className="font-medium">Tự động chọn ngân hàng</span>
                          </button>
                          {banks.map((bank) => (
                            <button
                              key={bank.code}
                              onClick={() => {
                                setSelectedBank(bank.code)
                                setShowBankList(false)
                              }}
                              className={`w-full p-3 rounded-lg text-left transition-colors ${
                                selectedBank === bank.code
                                  ? "bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent"
                                  : "hover:bg-secondary dark:hover:bg-slate-700"
                              }`}
                            >
                              <span className="text-foreground dark:text-white">{bank.name}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bank transfer info */}
            <AnimatePresence>
              {selectedMethod === "bank_transfer" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">
                            Thông tin chuyển khoản
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                            <p><strong>Ngân hàng:</strong> Vietcombank</p>
                            <p><strong>Số TK:</strong> 0123456789</p>
                            <p><strong>Chủ TK:</strong> CÔNG TY ICS ELEARNING</p>
                            <p><strong>Nội dung:</strong> [Mã đơn hàng] - [Email của bạn]</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">
                      Sau khi chuyển khoản, vui lòng đợi 1-24h để xác nhận thanh toán.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Security badges */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Bảo mật SSL 256-bit</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Xử lý tức thì</span>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden sticky top-4">
            <div className="p-6 border-b border-border dark:border-slate-700">
              <h2 className="text-lg font-semibold text-foreground dark:text-white">
                Đơn hàng
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Course info */}
              <div className="flex gap-4">
                {courseThumbnail ? (
                  <div className="w-20 h-14 rounded-lg overflow-hidden bg-secondary dark:bg-slate-700 flex-shrink-0">
                    <Image
                      src={courseThumbnail}
                      alt={courseName}
                      width={80}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-primary to-accent flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground dark:text-white line-clamp-2 text-sm">
                    {courseName}
                  </p>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="pt-4 border-t border-border dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground dark:text-slate-400">Giá gốc</span>
                  <span className="text-foreground dark:text-white">
                    {formatPrice(coursePrice)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground dark:text-slate-400">Giảm giá</span>
                    <span className="text-green-500">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border dark:border-slate-700">
                  <span className="font-semibold text-foreground dark:text-white">Tổng cộng</span>
                  <span className="font-bold text-xl text-primary dark:text-accent">
                    {formatPrice(finalAmount)}
                  </span>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full h-12"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      {selectedMethod === "vnpay" && <CreditCard className="w-4 h-4 mr-2" />}
                      {selectedMethod === "momo" && <QrCode className="w-4 h-4 mr-2" />}
                      {selectedMethod === "bank_transfer" && <Building2 className="w-4 h-4 mr-2" />}
                      Thanh toán {formatPrice(finalAmount)}
                    </>
                  )}
                </Button>

                {onCancel && (
                  <Button variant="outline" onClick={onCancel} className="w-full">
                    Hủy bỏ
                  </Button>
                )}
              </div>

              {/* Terms */}
              <p className="text-xs text-center text-muted-foreground dark:text-slate-400">
                Bằng việc thanh toán, bạn đồng ý với{" "}
                <a href="/terms" className="text-primary dark:text-accent hover:underline">
                  Điều khoản dịch vụ
                </a>{" "}
                và{" "}
                <a href="/privacy" className="text-primary dark:text-accent hover:underline">
                  Chính sách bảo mật
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Payment Success component
export function PaymentSuccess({
  orderId,
  courseName,
  onContinue,
}: {
  orderId: string
  courseName: string
  onContinue: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto text-center p-8"
    >
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
        <Check className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-foreground dark:text-white mb-2">
        Thanh toán thành công!
      </h1>
      <p className="text-muted-foreground dark:text-slate-400 mb-6">
        Bạn đã đăng ký thành công khóa học <strong>{courseName}</strong>
      </p>
      <div className="p-4 bg-secondary/50 dark:bg-slate-700/50 rounded-xl mb-6">
        <p className="text-sm text-muted-foreground dark:text-slate-400">
          Mã đơn hàng
        </p>
        <p className="font-mono font-bold text-foreground dark:text-white">{orderId}</p>
      </div>
      <Button onClick={onContinue} className="w-full">
        Bắt đầu học ngay
      </Button>
    </motion.div>
  )
}

// Payment Failed component
export function PaymentFailed({
  message,
  onRetry,
  onCancel,
}: {
  message?: string
  onRetry: () => void
  onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto text-center p-8"
    >
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
        <X className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-foreground dark:text-white mb-2">
        Thanh toán thất bại
      </h1>
      <p className="text-muted-foreground dark:text-slate-400 mb-6">
        {message || "Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại."}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Hủy bỏ
        </Button>
        <Button onClick={onRetry} className="flex-1">
          Thử lại
        </Button>
      </div>
    </motion.div>
  )
}
