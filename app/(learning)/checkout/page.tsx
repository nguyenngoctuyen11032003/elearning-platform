"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Ticket, CreditCard, QrCode, Wallet, Copy, ShieldCheck, Sparkles, Clock3 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { formatCurrencyByLanguage } from "@/lib/format"
import { getPaymentStatusInfo } from "@/lib/payment-status-utils"
import { useLanguage } from "@/lib/i18n/language-context"

interface CheckoutCourse {
  id: string
  title: string
  teacher?: string
  price: number
  image?: string
}

interface CouponPreview {
  valid: boolean
  discount?: number
  message?: string
}

type PaymentMode = "wallet" | "sepay_qr"

interface SepayCheckoutState {
  paymentId: string
  transactionId: string
  transactionCode: string
  amount: number
  status: string
  qrImageUrl: string
  bankName: string
  accountNumber: string
  expiresAt?: string
  createdAt?: string
  paidAt?: string | null
  referenceCode?: string | null
}

function parsePriceValue(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value !== "string") {
    return 0
  }

  const raw = value.trim()
  if (!raw) {
    return 0
  }

  const cleaned = raw.replace(/[^\d.,-]/g, "")
  if (!cleaned) {
    return 0
  }

  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned)) {
    const parsed = Number(cleaned.replace(/\./g, "").replace(",", "."))
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleaned)) {
    const parsed = Number(cleaned.replace(/,/g, ""))
    return Number.isFinite(parsed) ? parsed : 0
  }

  const normalized =
    cleaned.includes(",") && !cleaned.includes(".")
      ? cleaned.replace(",", ".")
      : cleaned.replace(/,/g, "")

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeMessage(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function isWalletInsufficientMessage(message: string): boolean {
  const normalized = normalizeMessage(message)
  return (
    normalized.includes("insufficient wallet balance") ||
    normalized.includes("so du vi cua ban khong du") ||
    normalized.includes("so du vi khong du")
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [courses, setCourses] = useState<CheckoutCourse[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [paymentCode, setPaymentCode] = useState("")
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null)
  const [isCheckingCode, setIsCheckingCode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("sepay_qr")
  const [sepayCheckout, setSepayCheckout] = useState<SepayCheckoutState | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const pendingTransactionCodeRef = useRef<string>("")
  const pendingStatusRef = useRef<string>("idle")

  useEffect(() => {
    let isMounted = true

    ;(async () => {
      try {
        try {
          const rawUser = localStorage.getItem("user")
          const rawRole = localStorage.getItem("userRole")
          const parsedRole = rawUser ? JSON.parse(rawUser)?.role : null
          const role = parsedRole || rawRole
          if (role === "admin") {
            toast.error(t("checkout_admin_forbidden", "Admin không thể thanh toán khóa học"))
            router.replace("/courses")
            return
          }
        } catch {
          // ignore invalid local storage shape
        }

        const resolvedCourses: CheckoutCourse[] = []
        const singleCourse = localStorage.getItem("checkoutCourse")
        if (singleCourse) {
          try {
            const parsed = JSON.parse(singleCourse)
            if (parsed) {
              resolvedCourses.push({
                ...parsed,
                price: parsePriceValue(parsed.price),
              })
            }
          } catch {
            // continue to fallback
          }
        }

        if (resolvedCourses.length === 0) {
          const itemsRaw = localStorage.getItem("checkoutItems")
          if (itemsRaw) {
            try {
              const items = JSON.parse(itemsRaw)
              if (Array.isArray(items) && items.length > 0) {
                resolvedCourses.push(
                  ...items.map((item: any) => ({
                    ...item,
                    price: parsePriceValue(item.price),
                  })),
                )
              }
            } catch {
              // ignore invalid localStorage shape
            }
          }
        }

        let fetchedWalletBalance = 0
        try {
          const balanceResult = await apiClient.getMyWalletBalance()
          fetchedWalletBalance = Number(balanceResult?.balance || 0)
        } catch {
          fetchedWalletBalance = 0
        }

        if (isMounted) {
          setCourses(resolvedCourses)
          setWalletBalance(fetchedWalletBalance)
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [router, t])

  const firstCourse = courses[0] || null
  const isMultiCourseCheckout = courses.length > 1
  const baseAmount = useMemo(() => {
    let total = 0
    for (const item of courses) {
      const price = parsePriceValue(item?.price)
      if (isNaN(price)) {
        total += 0
      } else {
        total += price
      }
    }
    return total
  }, [courses])

  const discount = useMemo(() => {
    if (!couponPreview?.valid) return 0
    if (isMultiCourseCheckout) return 0
    return Number(couponPreview.discount || 0)
  }, [couponPreview, isMultiCourseCheckout])

  const finalAmount = useMemo(() => {
    return Math.max(0, Number(baseAmount || 0) - discount)
  }, [baseAmount, discount])

  const isSepayPending = sepayCheckout?.status === "pending"
  const checkoutExpiresAtMs = sepayCheckout?.expiresAt ? new Date(sepayCheckout.expiresAt).getTime() : NaN
  const isCheckoutCountdownExpired = Number.isFinite(checkoutExpiresAtMs) && checkoutExpiresAtMs <= Date.now()
  const isSepayExpired = sepayCheckout?.status === "expired" || (isSepayPending && isCheckoutCountdownExpired)

  const statusInfo = useMemo(() => {
    return getPaymentStatusInfo(sepayCheckout?.status, t)
  }, [sepayCheckout?.status, t])

  useEffect(() => {
    pendingTransactionCodeRef.current = sepayCheckout?.transactionCode || ""
    pendingStatusRef.current = String(sepayCheckout?.status || "idle").toLowerCase()
  }, [sepayCheckout?.transactionCode, sepayCheckout?.status])

  useEffect(() => {
    return () => {
      const transactionCode = pendingTransactionCodeRef.current
      const status = pendingStatusRef.current

      if (!transactionCode || status !== "pending") {
        return
      }

      void apiClient.cancelSepayPayment(transactionCode, "left_checkout_before_transfer").catch(() => {
        // Silent cleanup call on unmount.
      })
    }
  }, [])

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleString(language === "en" ? "en-US" : "vi-VN")
  }

  const formatCountdown = (seconds: number) => {
    const safe = Math.max(0, seconds)
    const mins = Math.floor(safe / 60)
    const secs = safe % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  useEffect(() => {
    if (!sepayCheckout?.expiresAt || sepayCheckout.status !== "pending") {
      setRemainingSeconds(0)
      return
    }

    const updateRemaining = () => {
      const expiresAtMs = new Date(sepayCheckout.expiresAt as string).getTime()
      if (!Number.isFinite(expiresAtMs)) {
        setRemainingSeconds(0)
        return
      }

      const nextSeconds = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
      setRemainingSeconds(nextSeconds)
    }

    updateRemaining()
    const timerId = setInterval(updateRemaining, 1000)
    return () => clearInterval(timerId)
  }, [sepayCheckout?.expiresAt, sepayCheckout?.status])

  useEffect(() => {
    if (!sepayCheckout?.transactionCode) return
    if (sepayCheckout.status !== "pending") return

    const intervalId = setInterval(async () => {
      try {
        const statusResult = await apiClient.getSepayPaymentStatus(sepayCheckout.transactionCode)
        const payment = statusResult?.payment
        if (!payment) return

        const nextStatus = String(payment.status || "pending")
        setSepayCheckout((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            status: nextStatus,
            expiresAt: statusResult?.checkout?.expiresAt || prev.expiresAt,
            createdAt: payment.createdAt || prev.createdAt,
            paidAt: payment.paidAt || prev.paidAt,
            referenceCode: payment.sepayTransactionId || payment.gatewayTransactionId || prev.referenceCode || null,
          }
        })

        if (nextStatus === "completed") {
          clearInterval(intervalId)
          localStorage.removeItem("checkoutCourse")
          localStorage.removeItem("checkoutItems")
          localStorage.removeItem("checkoutTotal")
          if (courses.length > 1) {
            toast.success(t("checkout_multi_success", "Đã thanh toán thành công cho các khóa học đã chọn"))
            router.push("/my-courses")
          } else {
            toast.success(t("checkout_success", "Thanh toán thành công, bạn đã được vào khóa học"))
            router.push(`/enrollment/success?courseId=${firstCourse?.id || ""}&paymentId=${payment.id}&status=success`)
          }
        }

        if (nextStatus === "failed" || nextStatus === "expired") {
          clearInterval(intervalId)
          toast.error(
            nextStatus === "expired"
              ? t("checkout_qr_expired", "Mã QR đã hết hạn sau 15 phút chờ, vui lòng tạo lại giao dịch")
              : t("checkout_failed", "Thanh toán thất bại"),
          )
        }
      } catch {
        // Keep polling, transient errors are expected.
      }
    }, 5000)

    return () => clearInterval(intervalId)
  }, [sepayCheckout?.transactionCode, sepayCheckout?.status, router, firstCourse?.id, t, courses.length])

  useEffect(() => {
    if (sepayCheckout?.status !== "pending") return
    if (!sepayCheckout?.expiresAt) return

    const expiresAtMs = new Date(sepayCheckout.expiresAt).getTime()
    if (!Number.isFinite(expiresAtMs)) return
    if (expiresAtMs > Date.now()) return

    toast.error(t("checkout_qr_expired", "Mã QR đã hết hạn sau 15 phút chờ, vui lòng tạo lại giao dịch"))
    setSepayCheckout((prev) => {
      if (!prev) return prev
      return { ...prev, status: "expired" }
    })
  }, [sepayCheckout?.status, sepayCheckout?.expiresAt, remainingSeconds])

  useEffect(() => {
    if (paymentMode !== "wallet") return
    if (!sepayCheckout) return
    setSepayCheckout(null)
    setRemainingSeconds(0)
  }, [paymentMode, sepayCheckout])

  const handleCheckCode = async () => {
    if (!firstCourse) return
    if (isMultiCourseCheckout) {
      toast.info(t("checkout_multi_coupon_disabled", "Mã giảm giá hiện chỉ áp dụng cho thanh toán 1 khóa học"))
      return
    }
    if (!paymentCode.trim()) {
      setCouponPreview(null)
      toast.error(t("checkout_enter_code", "Vui lòng nhập mã thanh toán"))
      return
    }

    setIsCheckingCode(true)
    try {
      const result = await apiClient.validateCoupon(
        paymentCode.trim().toUpperCase(),
        firstCourse.id,
      )
      setCouponPreview(result)

      if (result?.valid) {
        toast.success(t("checkout_code_valid", "Mã thanh toán hợp lệ"))
      } else {
        toast.error(result?.message || t("checkout_code_invalid", "Mã thanh toán không hợp lệ"))
      }
    } catch (error) {
      setCouponPreview({ valid: false, message: t("checkout_code_check_error", "Không thể kiểm tra mã") })
      const message = error instanceof Error ? error.message : t("checkout_code_check_error", "Không thể kiểm tra mã")
      toast.error(message)
    } finally {
      setIsCheckingCode(false)
    }
  }

  const handlePay = async () => {
    if (courses.length === 0) {
      toast.error(t("checkout_no_course", "Không tìm thấy khóa học để thanh toán"))
      return
    }

    setIsSubmitting(true)
    try {
      if (paymentMode === "sepay_qr" && isMultiCourseCheckout) {
        const response = await apiClient.createSepayCartPayment({
          courseIds: courses.map((item) => item.id),
        })

        const payment = response?.payment
        const checkout = response?.checkout

        if (payment?.status === "completed") {
          localStorage.removeItem("checkoutCourse")
          localStorage.removeItem("checkoutItems")
          localStorage.removeItem("checkoutTotal")
          toast.success(t("checkout_multi_success", "Đã thanh toán thành công cho các khóa học đã chọn"))
          router.push("/my-courses")
          return
        }

        if (checkout && payment) {
          setSepayCheckout({
            paymentId: String(payment.id || ""),
            transactionId: String(payment.transactionId || ""),
            transactionCode: String(checkout.transactionCode || payment.transactionCode || ""),
            amount: Number(payment.finalAmount || payment.amount || 0),
            status: String(payment.status || "pending"),
            qrImageUrl: String(checkout.qrImageUrl || ""),
            bankName: String(checkout.bankName || ""),
            accountNumber: String(checkout.accountNumber || ""),
            expiresAt: checkout.expiresAt,
            createdAt: payment.createdAt,
            paidAt: payment.paidAt,
            referenceCode: payment.sepayTransactionId || payment.gatewayTransactionId || null,
          })

          toast.success(t("checkout_qr_created", "Đã tạo mã QR SePay, vui lòng chuyển khoản đúng nội dung"))
          return
        }

        throw new Error(t("checkout_failed", "Thanh toán thất bại"))
      }

      const successes: Array<{ courseId: string; paymentId: string; status: string }> = []
      const failures: string[] = []

      for (const item of courses) {
        try {
          if (paymentMode === "wallet") {
            const payment = await apiClient.payCourseByWallet({
              courseId: item.id,
              couponCode: !isMultiCourseCheckout ? paymentCode.trim() || undefined : undefined,
            })

            successes.push({
              courseId: item.id,
              paymentId: String(payment?.id || ""),
              status: String(payment?.status || "pending"),
            })

            continue
          }

          const response = await apiClient.createSepayCoursePayment({
            courseId: item.id,
            couponCode: !isMultiCourseCheckout ? paymentCode.trim() || undefined : undefined,
          })

          const payment = response?.payment
          const checkout = response?.checkout

          if (payment?.status === "completed") {
            successes.push({
              courseId: item.id,
              paymentId: String(payment?.id || ""),
              status: "completed",
            })
            continue
          }

          if (checkout && payment) {
            setSepayCheckout({
              paymentId: String(payment.id || ""),
              transactionId: String(payment.transactionId || ""),
              transactionCode: String(checkout.transactionCode || payment.transactionCode || ""),
              amount: Number(payment.finalAmount || payment.amount || 0),
              status: String(payment.status || "pending"),
              qrImageUrl: String(checkout.qrImageUrl || ""),
              bankName: String(checkout.bankName || ""),
              accountNumber: String(checkout.accountNumber || ""),
              expiresAt: checkout.expiresAt,
              createdAt: payment.createdAt,
              paidAt: payment.paidAt,
              referenceCode: payment.sepayTransactionId || payment.gatewayTransactionId || null,
            })

            toast.success(t("checkout_qr_created", "Đã tạo mã QR SePay, vui lòng chuyển khoản đúng nội dung"))
            return
          }

          throw new Error(t("checkout_failed", "Thanh toán thất bại"))
        } catch (error) {
          const message = error instanceof Error ? error.message : `${t("checkout_failed_course", "Thanh toán thất bại cho khóa")}: ${item.title}`
          failures.push(message)
        }
      }

      if (successes.length === 0) {
        throw new Error(failures[0] || t("checkout_failed", "Thanh toán thất bại"))
      }

      localStorage.removeItem("checkoutCourse")
      localStorage.removeItem("checkoutItems")
      localStorage.removeItem("checkoutTotal")

      if (successes.length === 1) {
        const only = successes[0]
        const isCompleted = only.status === "completed"
        toast.success(
          isCompleted
            ? t("checkout_success", "Thanh toán thành công, bạn đã được vào khóa học")
            : t("checkout_pending", "Đã tạo giao dịch, vui lòng chờ xác nhận thanh toán"),
        )
        router.push(
          `/enrollment/success?courseId=${only.courseId}&paymentId=${only.paymentId}&status=${isCompleted ? "success" : "pending"}`,
        )
        return
      }

      if (failures.length > 0) {
        toast.warning(
          `${t("checkout_partial_success", "Đã thanh toán thành công")}: ${successes.length}/${courses.length}. ${t("checkout_view_my_courses", "Vui lòng vào Khóa học của tôi để kiểm tra")}`,
        )
      } else {
        toast.success(t("checkout_multi_success", "Đã tạo giao dịch cho tất cả khóa học đã chọn"))
      }

      router.push("/my-courses")
    } catch (error) {
      const message = error instanceof Error ? error.message : t("checkout_failed", "Thanh toán thất bại")

      if (paymentMode === "wallet" && isWalletInsufficientMessage(message)) {
        let currentBalance = 0

        try {
          const balanceResult = await apiClient.getMyWalletBalance()
          currentBalance = Number(balanceResult?.balance || 0)
        } catch {
          currentBalance = 0
        }

        const prompt = t(
          "checkout_wallet_insufficient_prompt",
          "Số dư ví của bạn không đủ. Bạn có muốn nạp thêm tiền vào ví không?",
        )
        toast.error(
          `${t("checkout_wallet_insufficient", "Số dư ví của bạn không đủ")}. ${t("checkout_wallet_current_balance", "Số dư hiện tại")}: ${formatCurrencyByLanguage(currentBalance, language)}`,
        )

        if (typeof window !== "undefined" && window.confirm(prompt)) {
          router.push("/top-up")
        }
        return
      }

      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyTransferContent = async () => {
    if (!sepayCheckout?.transactionCode) return
    try {
      await navigator.clipboard.writeText(sepayCheckout.transactionCode)
      toast.success(t("checkout_copied", "Đã sao chép nội dung chuyển khoản"))
    } catch {
      toast.error(t("checkout_copy_failed", "Không thể sao chép, vui lòng copy thủ công"))
    }
  }

  if (isBootstrapping) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-36 animate-pulse rounded-3xl border border-border/60 bg-card/60" />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="h-[560px] animate-pulse rounded-3xl border border-border/60 bg-card/60" />
          <div className="h-[560px] animate-pulse rounded-3xl border border-border/60 bg-card/60" />
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold">{t("checkout_empty_title", "Chưa có khóa học để thanh toán")}</h1>
        <p className="text-muted-foreground">{t("checkout_empty_desc", "Hãy chọn khóa học trước khi checkout.")}</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-8 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-20 top-44 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-6 rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-blue-500/5 p-6 shadow-sm"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            <Sparkles size={14} />
            Course Checkout
          </p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{t("checkout_title", "Thanh toán khóa học")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("checkout_subtitle", "Thanh toán nhanh với ví hoặc SePay QR, trạng thái được đồng bộ theo thời gian thực")}
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
            className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-sm backdrop-blur-sm"
          >
            <h2 className="mb-4 text-lg font-semibold">{t("checkout_courses", "Khóa học đã chọn")}</h2>
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course.id} className="rounded-xl border border-border/70 bg-background/70 p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-secondary/40">
                      {course.image ? (
                        <img
                          src={course.image}
                          alt={course.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-base font-semibold leading-snug">{course.title}</p>
                      {course.teacher && (
                        <p className="mt-1 text-sm text-muted-foreground">{t("checkout_instructor", "Giảng viên")}: {course.teacher}</p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("checkout_original_price", "Giá gốc")}: {formatCurrencyByLanguage(Number(course.price || 0), language)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-border/70 bg-secondary/20 p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t("checkout_discount", "Giảm giá")}</span>
                <span>{formatCurrencyByLanguage(discount, language)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-lg font-bold text-primary">
                <span>{t("checkout_total", "Cần thanh toán")}</span>
                <span>{formatCurrencyByLanguage(finalAmount, language)}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" }}
            className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-sm backdrop-blur-sm"
          >
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold">{t("checkout_payment_method", "Phương thức thanh toán")}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => setPaymentMode("sepay_qr")}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                    paymentMode === "sepay_qr"
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/70 hover:bg-secondary"
                  }`}
                >
                  <span className="inline-flex items-center gap-2 font-semibold"><QrCode size={16} />SePay QR</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{t("checkout_mode_qr_desc", "Tạo QR và chuyển khoản theo nội dung hệ thống")}</span>
                </button>
                <button
                  onClick={() => setPaymentMode("wallet")}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                    paymentMode === "wallet"
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/70 hover:bg-secondary"
                  }`}
                >
                  <span className="inline-flex items-center gap-2 font-semibold"><Wallet size={16} />{t("checkout_wallet", "Số dư ví")}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{t("checkout_mode_wallet_desc", "Thanh toán ngay nếu số dư ví đủ")}</span>
                  <span className="mt-1 block text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                    {t("checkout_wallet_current_balance", "Số dư hiện tại")}: {formatCurrencyByLanguage(walletBalance, language)}
                  </span>
                </button>
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-base font-semibold">
                <Ticket size={18} />
                {t("checkout_code_label", "Mã thanh toán")}
              </div>

              <div className="flex gap-2">
                <input
                  value={paymentCode}
                  onChange={(e) => setPaymentCode(e.target.value.toUpperCase())}
                  placeholder={t("checkout_code_placeholder", "Nhập mã do admin cung cấp")}
                  disabled={isMultiCourseCheckout}
                  className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={handleCheckCode}
                  disabled={isCheckingCode || isMultiCourseCheckout}
                  className="rounded-lg border border-border/70 px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-60"
                >
                  {isCheckingCode ? t("checkout_checking", "Đang kiểm tra") : t("checkout_check", "Kiểm tra")}
                </button>
              </div>

              {isMultiCourseCheckout && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("checkout_multi_coupon_note", "Thanh toán nhiều khóa học đang tắt mã giảm giá để tránh áp sai khóa học.")}
                </p>
              )}

              {couponPreview && (
                <p className={`mt-3 text-sm ${couponPreview.valid ? "text-emerald-600" : "text-red-500"}`}>
                  {couponPreview.message || (couponPreview.valid ? "Mã thanh toán hợp lệ" : t("checkout_code_invalid", "Mã thanh toán không hợp lệ"))}
                </p>
              )}
            </div>

            <div className="grid gap-2 rounded-2xl border border-border/70 bg-secondary/20 p-3 text-xs text-muted-foreground sm:grid-cols-2">
              <p className="inline-flex items-center gap-1.5"><ShieldCheck size={14} />{t("checkout_secure_note", "Giao dịch được đối soát tự động")}</p>
              <p className="inline-flex items-center gap-1.5"><Clock3 size={14} />{t("checkout_expire_note", "Mã QR hết hạn sau 15 phút")}</p>
            </div>

            {paymentMode === "sepay_qr" && sepayCheckout && (
              <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-semibold">{t("checkout_sepay_info", "Thông tin thanh toán SePay")}</p>
                <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <span>{t("checkout_sepay_status", "Trạng thái")}:</span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusInfo.badgeClass}`}>
                      {statusInfo.text}
                    </span>
                  </p>
                  <p>{t("checkout_transaction_id", "Mã giao dịch")}: {sepayCheckout.transactionId || "-"}</p>
                  <p>{t("checkout_bank", "Ngân hàng")}: {sepayCheckout.bankName} - {sepayCheckout.accountNumber}</p>
                  <p>{t("checkout_transfer_content", "Nội dung")}: {sepayCheckout.transactionCode}</p>
                  <p>{t("checkout_reference_code", "Mã tham chiếu")}: {sepayCheckout.referenceCode || "-"}</p>
                  <p>{t("checkout_created_at", "Thời gian tạo")}: {formatDateTime(sepayCheckout.createdAt)}</p>
                  <p>{t("checkout_paid_at", "Thời gian thanh toán")}: {formatDateTime(sepayCheckout.paidAt)}</p>
                </div>

                {isSepayPending && (
                  <p className={`mt-2 text-xs font-semibold ${isSepayExpired ? "text-rose-600" : "text-amber-600"}`}>
                    {t("checkout_time_left", "Thời gian còn lại")}: {isSepayExpired ? "00:00" : formatCountdown(remainingSeconds)}
                  </p>
                )}
                {isSepayExpired && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">
                    {t("checkout_qr_expired", "Mã QR đã hết hạn sau 15 phút chờ, vui lòng tạo lại giao dịch")}
                  </p>
                )}

                <button
                  onClick={handleCopyTransferContent}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Copy size={14} />
                  {t("checkout_copy_transfer", "Sao chép nội dung chuyển khoản")}
                </button>

                {sepayCheckout.qrImageUrl && !isSepayExpired && (
                  <div className="mt-3 rounded-xl border border-border/70 bg-card p-3">
                    <img src={sepayCheckout.qrImageUrl} alt="SePay QR" className="mx-auto h-52 w-52 object-contain" />
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : paymentMode === "wallet" ? <Wallet size={16} /> : <CreditCard size={16} />}
              {isSubmitting
                ? t("checkout_processing", "Đang xử lý")
                : paymentMode === "wallet"
                  ? t("checkout_pay_wallet", "Thanh toán bằng ví")
                  : t("checkout_pay_sepay", "Tạo mã SePay QR")}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
