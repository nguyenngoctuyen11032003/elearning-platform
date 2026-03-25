"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Ticket, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { formatPrice, formatCurrencyByLanguage } from "@/lib/format"
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

export default function CheckoutPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [course, setCourse] = useState<CheckoutCourse | null>(null)
  const [paymentCode, setPaymentCode] = useState("")
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null)
  const [isCheckingCode, setIsCheckingCode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
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

    const singleCourse = localStorage.getItem("checkoutCourse")
    if (singleCourse) {
      try {
        const parsed = JSON.parse(singleCourse)
        setCourse(parsed)
        return
      } catch {
        // continue to fallback
      }
    }

    const itemsRaw = localStorage.getItem("checkoutItems")
    if (!itemsRaw) return

    try {
      const items = JSON.parse(itemsRaw)
      if (Array.isArray(items) && items.length > 0) {
        setCourse(items[0])
      }
    } catch {
      // ignore invalid localStorage shape
    }
  }, [router, t])

  const discount = useMemo(() => {
    if (!couponPreview?.valid) return 0
    return Number(couponPreview.discount || 0)
  }, [couponPreview])

  const finalAmount = useMemo(() => {
    if (!course) return 0
    return Math.max(0, Number(course.price || 0) - discount)
  }, [course, discount])

  const handleCheckCode = async () => {
    if (!course) return
    if (!paymentCode.trim()) {
      setCouponPreview(null)
      toast.error(t("checkout_enter_code", "Vui lòng nhập mã thanh toán"))
      return
    }

    setIsCheckingCode(true)
    try {
      const result = await apiClient.validateCoupon(
        paymentCode.trim().toUpperCase(),
        course.id,
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
    if (!course) {
      toast.error(t("checkout_no_course", "Không tìm thấy khóa học để thanh toán"))
      return
    }

    setIsSubmitting(true)
    try {
      const payment = await apiClient.createPayment({
        courseId: course.id,
        amount: Number(course.price || 0),
        paymentMethod: "bank_transfer",
        couponCode: paymentCode.trim() || undefined,
      })

      if (payment?.status === "completed") {
        localStorage.removeItem("checkoutCourse")
        localStorage.removeItem("checkoutItems")
        localStorage.removeItem("checkoutTotal")
        toast.success(t("checkout_success", "Thanh toán thành công, bạn đã được vào khóa học"))
        router.push(
          `/enrollment/success?courseId=${course.id}&paymentId=${payment.id}&status=success`,
        )
        return
      }

      toast.info(t("checkout_pending", "Đã tạo giao dịch, vui lòng chờ xác nhận thanh toán"))
      router.push(
        `/enrollment/success?courseId=${course.id}&paymentId=${payment?.id || ""}&status=pending`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : t("checkout_failed", "Thanh toán thất bại")
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold">{t("checkout_empty_title", "Chưa có khóa học để thanh toán")}</h1>
        <p className="text-muted-foreground">{t("checkout_empty_desc", "Hãy chọn khóa học trước khi checkout.")}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-8 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card p-6">
        <h1 className="mb-4 text-2xl font-bold">{t("checkout_title", "Thanh toán khóa học")}</h1>
        <div className="space-y-3">
          <p className="text-lg font-semibold">{course.title}</p>
          {course.teacher && (
            <p className="text-sm text-muted-foreground">{t("checkout_instructor", "Giảng viên")}: {course.teacher}</p>
          )}
          <p className="text-sm text-muted-foreground">{t("checkout_original_price", "Giá gốc")}: {formatCurrencyByLanguage(Number(course.price || 0), language)}</p>
          <p className="text-sm text-muted-foreground">{t("checkout_discount", "Giảm giá")}: {formatCurrencyByLanguage(discount, language)}</p>
          <p className="text-xl font-bold text-primary">{t("checkout_total", "Cần thanh toán")}: {formatCurrencyByLanguage(finalAmount, language)}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Ticket size={18} />
          {t("checkout_code_label", "Mã thanh toán")}
        </div>

        <div className="flex gap-2">
          <input
            value={paymentCode}
            onChange={(e) => setPaymentCode(e.target.value.toUpperCase())}
            placeholder={t("checkout_code_placeholder", "Nhập mã do admin cung cấp")}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={handleCheckCode}
            disabled={isCheckingCode}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-60"
          >
            {isCheckingCode ? t("checkout_checking", "Đang kiểm tra") : t("checkout_check", "Kiểm tra")}
          </button>
        </div>

        {couponPreview && (
          <p className={`mt-3 text-sm ${couponPreview.valid ? "text-green-600" : "text-red-500"}`}>
            {couponPreview.message || (couponPreview.valid ? "Mã thanh toán hợp lệ" : t("checkout_code_invalid", "Mã thanh toán không hợp lệ"))}
          </p>
        )}

        <button
          onClick={handlePay}
          disabled={isSubmitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
          {isSubmitting ? t("checkout_processing", "Đang xử lý") : t("checkout_pay", "Thanh toán và đăng ký khóa học")}
        </button>
      </div>
    </div>
  )
}
