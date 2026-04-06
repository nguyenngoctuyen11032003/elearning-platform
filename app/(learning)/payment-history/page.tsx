"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Clock3,
  CreditCard,
  Download,
  Eye,
  FileText,
  Plus,
  Search,
  Wallet,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"
import { getLocaleByLanguage } from "@/lib/i18n/dynamic-translate"
import { generateInvoicePdf } from "@/lib/utils/invoice-pdf"

interface PaymentHistory {
  id: string
  courseTitle: string
  courseSlug?: string
  courseThumbnail?: string
  amount: number
  discountAmount?: number
  finalAmount: number
  status: "completed" | "pending" | "failed"
  paymentMethod: string
  transactionId: string
  enrolledAt: string
  paymentType?: string
}

type StatusFilter = "all" | "completed" | "pending" | "failed"

export default function PaymentHistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { language, t } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentHistory[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null)

  const [balance, setBalance] = useState(0)

  const normalizeStatus = (status: string): PaymentHistory["status"] => {
    if (status === "completed") return "completed"
    if (status === "pending") return "pending"
    return "failed"
  }

  const mapPaymentMethod = (method: string, paymentType?: string) => {
    if (method === "wallet") return t("pay_method_wallet", "Ví số dư")
    if (method === "sepay_qr") return "SePay QR"
    if (method === "vnpay") return "VNPay"
    if (method === "momo") return "MoMo"
    if (method === "bank_transfer") return t("pay_method_bank_transfer", "Chuyển khoản")
    if (paymentType === "wallet_topup") return t("pay_method_topup", "Nạp ví")
    return method
  }

  useEffect(() => {
    let active = true

    const loadPaymentHistory = async () => {
      setLoading(true)
      try {
        const [paymentResult, balanceResult] = await Promise.all([
          apiClient.getPaymentHistory(),
          apiClient.getMyWalletBalance(),
        ])

        const paymentRows = Array.isArray(paymentResult)
          ? paymentResult
          : Array.isArray((paymentResult as any)?.data)
            ? (paymentResult as any).data
            : []

        const mappedPayments: PaymentHistory[] = paymentRows.map((row: any) => {
          const paymentType = String(row?.paymentType || "")
          const courseTitle = row?.course?.title
            ? String(row.course.title)
            : paymentType === "wallet_topup"
              ? t("pay_wallet_topup", "Nạp tiền vào ví")
              : t("pay_unknown_course", "Khóa học không xác định")

          return {
            id: String(row?.id || ""),
            courseTitle,
            courseSlug: row?.course?.slug ? String(row.course.slug) : undefined,
            courseThumbnail: row?.course?.thumbnail ? String(row.course.thumbnail) : "/image/logo-ics.jpg",
            amount: Number(row?.amount || 0),
            discountAmount: Number(row?.discountAmount || 0),
            finalAmount: Number(row?.finalAmount ?? row?.amount ?? 0),
            status: normalizeStatus(String(row?.status || "failed")),
            paymentMethod: mapPaymentMethod(String(row?.paymentMethod || ""), paymentType),
            transactionId: String(row?.transactionCode || row?.transactionId || ""),
            enrolledAt: String(row?.paidAt || row?.createdAt || new Date().toISOString()),
            paymentType,
          }
        })

        if (!active) return
        setPayments(mappedPayments)
        setBalance(Number((balanceResult as any)?.balance || 0))
      } catch (error) {
        console.error("Error loading payment history:", error)
        if (!active) return
        setPayments([])
        setBalance(0)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadPaymentHistory()

    return () => {
      active = false
    }
  }, [t])

  const locale = getLocaleByLanguage(language)

  const filteredPayments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return payments.filter((payment) => {
      const matchStatus = statusFilter === "all" || payment.status === statusFilter
      if (!matchStatus) return false

      if (!keyword) return true
      return (
        payment.courseTitle.toLowerCase().includes(keyword) ||
        payment.transactionId.toLowerCase().includes(keyword)
      )
    })
  }, [payments, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const completed = payments.filter((p) => p.status === "completed")
    const pending = payments.filter((p) => p.status === "pending").length
    const failed = payments.filter((p) => p.status === "failed").length

    const totalSpent = completed.reduce((sum, p) => sum + p.finalAmount, 0)

    const today = new Date().toDateString()
    const dailySpent = completed
      .filter((p) => new Date(p.enrolledAt).toDateString() === today)
      .reduce((sum, p) => sum + p.finalAmount, 0)

    return {
      total: payments.length,
      completed: completed.length,
      pending,
      failed,
      totalSpent,
      dailySpent,
    }
  }, [payments])

  const getStatusLabel = (status: PaymentHistory["status"]) => {
    if (status === "completed") return t("pay_status_completed", "Thành công")
    if (status === "pending") return t("pay_status_pending", "Đang xử lý")
    return t("pay_status_failed", "Thất bại")
  }

  const getStatusClass = (status: PaymentHistory["status"]) => {
    if (status === "completed") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300"
    if (status === "pending") return "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300"
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300"
  }

  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleDownloadInvoice = async (payment: PaymentHistory) => {
    try {
      const issueDate = new Date(payment.enrolledAt).toLocaleDateString("vi-VN")
      const discount = Number(payment.discountAmount || 0)
      const subtotal = Number(payment.amount || payment.finalAmount || 0)
      const tax = Math.max(0, Number(payment.finalAmount || 0) - subtotal + discount)

      await generateInvoicePdf({
        invoiceNumber: payment.transactionId,
        issueDate,
        customerName: user?.name || "N/A",
        customerEmail: user?.email || "N/A",
        courseTitle: payment.courseTitle,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.status,
        subtotal,
        discount,
        tax,
        total: Number(payment.finalAmount || 0),
      })
    } catch (error) {
      console.error("Error generating invoice:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center rounded-3xl border border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="text-center">
          <div className="mx-auto mb-3 h-11 w-11 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("pay_loading", "Đang tải...")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen space-y-6">
      <motion.div
        aria-hidden
        animate={{ opacity: [0.2, 0.34, 0.2], y: [0, -16, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-900/20"
      />
      <motion.div
        aria-hidden
        animate={{ opacity: [0.2, 0.3, 0.2], y: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-900/20"
      />

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-cyan-100/70 bg-white/85 p-6 shadow-[0_24px_60px_rgba(14,116,144,0.14)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 md:p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(34,211,238,0.2),transparent_45%),radial-gradient(100%_110%_at_100%_0%,rgba(16,185,129,0.2),transparent_42%)]" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-900/30 dark:text-cyan-200">
              <FileText className="h-3.5 w-3.5" />
              {t("pay_header_label", "Ví & giao dịch")}
            </p>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white md:text-5xl">{t("pay_header_title", "Lịch sử thanh toán")}</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
              {t("pay_header_subtitle", "Theo dõi số dư, chi tiêu và hóa đơn của bạn trên một bảng điều khiển tinh gọn.")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => router.push("/top-up")}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
              >
                <Plus className="h-4 w-4" />
                {t("pay_topup", "Nạp tiền")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            {[
              { label: t("pay_balance", "Số dư"), value: formatCurrency(balance), icon: Wallet },
              { label: t("pay_total_spent", "Tổng đã chi"), value: formatCurrency(stats.totalSpent), icon: CreditCard },
              { label: t("pay_daily_spend", "Chi tiêu hôm nay"), value: formatCurrency(stats.dailySpent), icon: Clock3 },
              { label: t("pay_completed", "Hoàn tất"), value: String(stats.completed), icon: FileText },
            ].map((item) => {
              const StatIcon = item.icon || CreditCard

              return (
                <div key={item.label} className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
                <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">
                    <StatIcon className="h-3.5 w-3.5" />
                  {item.label}
                </p>
                <p className="line-clamp-1 text-sm font-black text-slate-900 dark:text-white md:text-base">{item.value}</p>
              </div>
              )
            })}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200/75 bg-white/85 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800/75 dark:bg-slate-900/70"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("pay_search", "Tìm theo tên khóa học hoặc mã giao dịch...")}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.2)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: t("pay_all_status", "Tất cả") },
              { key: "completed", label: t("pay_status_completed", "Thành công") },
              { key: "pending", label: t("pay_status_pending", "Đang xử lý") },
              { key: "failed", label: t("pay_status_failed", "Thất bại") },
            ].map((tab) => {
              const active = statusFilter === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as StatusFilter)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-cyan-500 bg-cyan-500 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-cyan-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </motion.section>

      <section className="grid gap-3">
        {filteredPayments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/70">
            <CreditCard className="mx-auto mb-3 h-12 w-12 text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("pay_no_tx", "Không có giao dịch nào")}</p>
          </div>
        ) : (
          filteredPayments.map((payment, idx) => (
            <motion.article
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:border-cyan-400/60 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/75"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-base font-semibold text-slate-900 dark:text-white" title={payment.courseTitle}>
                    {payment.courseTitle}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">{payment.transactionId}</span>
                    <span>•</span>
                    <span>{formatDate(payment.enrolledAt)}</span>
                    <span>•</span>
                    <span>{payment.paymentMethod}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(payment.status)}`}>
                    {getStatusLabel(payment.status)}
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white md:text-base">{formatCurrency(payment.finalAmount)}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                <button
                  onClick={() => setSelectedPayment(payment)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {t("pay_detail_title", "Chi tiết")}
                </button>

                {payment.status === "completed" ? (
                  <button
                    onClick={() => handleDownloadInvoice(payment)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t("pay_download_invoice", "Tải hóa đơn")}
                  </button>
                ) : null}
              </div>
            </motion.article>
          ))
        )}
      </section>

      <AnimatePresence>
        {selectedPayment ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedPayment(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("pay_detail_title", "Chi tiết giao dịch")}</h3>
                <button onClick={() => setSelectedPayment(null)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{selectedPayment.courseTitle}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(selectedPayment.status)}`}>
                    {getStatusLabel(selectedPayment.status)}
                  </span>
                </div>

                <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/40">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 dark:text-slate-400">{t("pay_tx_id", "Mã giao dịch")}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-100">{selectedPayment.transactionId}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 dark:text-slate-400">{t("pay_tx_date", "Ngày giao dịch")}</span>
                    <span className="text-slate-800 dark:text-slate-100">{formatDate(selectedPayment.enrolledAt)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 dark:text-slate-400">{t("pay_method", "Phương thức")}</span>
                    <span className="text-slate-800 dark:text-slate-100">{selectedPayment.paymentMethod}</span>
                  </div>
                </div>

                <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/40">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t("pay_original_price", "Giá gốc")}</span>
                    <span className="text-slate-800 dark:text-slate-100">{formatCurrency(selectedPayment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t("pay_discount", "Giảm giá")}</span>
                    <span className="text-emerald-600 dark:text-emerald-300">-{formatCurrency(selectedPayment.discountAmount || 0)}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 font-bold dark:border-slate-700">
                    <span className="text-slate-700 dark:text-slate-200">{t("pay_total", "Tổng thanh toán")}</span>
                    <span className="text-slate-900 dark:text-white">{formatCurrency(selectedPayment.finalAmount)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {selectedPayment.courseSlug ? (
                    <Link
                      href={`/course/${selectedPayment.courseSlug}`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
                    >
                      {t("pay_view_course", "Xem khóa học")}
                    </Link>
                  ) : null}

                  {selectedPayment.status === "completed" ? (
                    <button
                      onClick={() => handleDownloadInvoice(selectedPayment)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Download className="h-4 w-4" />
                      {t("pay_download_invoice", "Tải hóa đơn")}
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
