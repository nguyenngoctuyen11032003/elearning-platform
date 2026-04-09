"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, Clock3, Copy, Loader2, QrCode, RefreshCw, ShieldCheck, Sparkles, Wallet } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { formatCurrencyByLanguage } from "@/lib/format"
import { getPaymentStatusInfo } from "@/lib/payment-status-utils"
import { useLanguage } from "@/lib/i18n/language-context"

type WalletTransactionItem = {
  id: string
  changeAmount: number
  balanceAfter: number
  type: string
  description?: string | null
  createdAt: string
}

type TopupCheckout = {
  transactionCode: string
  qrImageUrl: string
  bankName: string
  accountNumber: string
  expiresAt?: string
}

type TopupPaymentInfo = {
  id: string
  transactionId: string
  transactionCode: string
  status: string
  createdAt?: string
  paidAt?: string | null
  expiresAt?: string | null
  sepayTransactionId?: string | null
  gatewayTransactionId?: string | null
}

const TOPUP_PRESETS = [100000, 200000, 500000, 1000000, 2000000]

export default function TopUpPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { language, t } = useLanguage()
  const [balance, setBalance] = useState(0)
  const [amount, setAmount] = useState(500000)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [checkout, setCheckout] = useState<TopupCheckout | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>("idle")
  const [paymentInfo, setPaymentInfo] = useState<TopupPaymentInfo | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([])
  const pendingTransactionCodeRef = useRef<string>("")
  const pendingStatusRef = useRef<string>("idle")

  const amountText = useMemo(() => String(amount || ""), [amount])
  const topupBasePath = pathname.startsWith("/teacher/wallet-membership/top-up")
    ? "/teacher/wallet-membership/top-up"
    : "/top-up"
  const backHref = pathname.startsWith("/teacher/wallet-membership/top-up")
    ? "/teacher/wallet-membership/payment-history"
    : "/payment-history"
  const isPending = paymentStatus === "pending"
  const paymentExpiresAtMs = paymentInfo?.expiresAt ? new Date(paymentInfo.expiresAt).getTime() : NaN
  const isCountdownExpired = Number.isFinite(paymentExpiresAtMs) && paymentExpiresAtMs <= Date.now()
  const isExpired = paymentStatus === "expired" || (isPending && isCountdownExpired)

  const statusInfo = useMemo(() => {
    return getPaymentStatusInfo(paymentStatus, t)
  }, [paymentStatus, t])

  useEffect(() => {
    pendingTransactionCodeRef.current = checkout?.transactionCode || ""
    pendingStatusRef.current = String(paymentStatus || "idle").toLowerCase()
  }, [checkout?.transactionCode, paymentStatus])

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

  const normalizeWalletDescription = (value: string) => {
    const raw = value.trim()
    const normalized = raw.toLowerCase()

    if (normalized.startsWith("nap tien vao vi duoc admin xac nhan")) {
      return "Nạp tiền vào ví được admin xác nhận"
    }

    if (normalized.startsWith("nap tien vao vi qua sepay")) {
      return "Nạp tiền vào ví qua SePay"
    }

    if (normalized.startsWith("thanh toan goi giang vien")) {
      return raw.replace(/thanh toan goi giang vien/i, "Thanh toán gói giảng viên")
    }

    if (normalized.startsWith("thanh toan khoa hoc")) {
      return raw.replace(/thanh toan khoa hoc/i, "Thanh toán khóa học")
    }

    return raw
  }

  const loadWalletData = async () => {
    setIsLoading(true)
    try {
      const [balanceResult, txResult] = await Promise.all([
        apiClient.getMyWalletBalance(),
        apiClient.getMyWalletTransactions(),
      ])

      setBalance(Number(balanceResult?.balance || 0))
      setTransactions(Array.isArray(txResult) ? txResult : [])
    } catch (error) {
      const message = error instanceof Error ? error.message : t("topup_load_failed", "Không thể tải dữ liệu ví")
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        await loadWalletData()
      } finally {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!paymentInfo?.expiresAt || paymentStatus !== "pending") {
      setRemainingSeconds(0)
      return
    }

    const updateRemaining = () => {
      const expiresAtMs = new Date(paymentInfo.expiresAt as string).getTime()
      if (!Number.isFinite(expiresAtMs)) {
        setRemainingSeconds(0)
        return
      }
      const seconds = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
      setRemainingSeconds(seconds)
    }

    updateRemaining()
    const timerId = setInterval(updateRemaining, 1000)
    return () => clearInterval(timerId)
  }, [paymentInfo?.expiresAt, paymentStatus])

  useEffect(() => {
    if (!checkout?.transactionCode) return
    if (paymentStatus !== "pending") return

    const intervalId = setInterval(async () => {
      try {
        const result = await apiClient.getSepayPaymentStatus(checkout.transactionCode)
        const payment = result?.payment
        const nextStatus = String(payment?.status || "pending")
        setPaymentStatus(nextStatus)
        setPaymentInfo((prev) => {
          const mapped: TopupPaymentInfo | null = payment
            ? {
                id: String(payment.id || prev?.id || ""),
                transactionId: String(payment.transactionId || prev?.transactionId || ""),
                transactionCode: String(payment.transactionCode || prev?.transactionCode || checkout.transactionCode),
                status: nextStatus,
                createdAt: payment.createdAt || prev?.createdAt,
                paidAt: payment.paidAt || prev?.paidAt || null,
                expiresAt: payment.expiresAt || result?.checkout?.expiresAt || prev?.expiresAt || null,
                sepayTransactionId: payment.sepayTransactionId || prev?.sepayTransactionId || null,
                gatewayTransactionId: payment.gatewayTransactionId || prev?.gatewayTransactionId || null,
              }
            : prev
          return mapped
        })

        if (nextStatus === "completed") {
          clearInterval(intervalId)
          await loadWalletData()
          const paidAmount = Number(payment?.finalAmount ?? payment?.amount ?? amount)
          const txCode = String(payment?.transactionCode || checkout.transactionCode || "")
          toast.success(t("topup_success_title", "Nạp tiền thành công"))
          router.push(`${topupBasePath}/success?amount=${encodeURIComponent(String(paidAmount))}&transactionCode=${encodeURIComponent(txCode)}&paymentId=${encodeURIComponent(String(payment?.id || ""))}`)
        }

        if (nextStatus === "expired" || nextStatus === "failed") {
          clearInterval(intervalId)
          toast.error(
            nextStatus === "expired"
              ? t("topup_expired", "Mã nạp tiền đã hết hạn sau 15 phút chờ, vui lòng tạo giao dịch mới")
              : t("topup_failed", "Nạp tiền thất bại"),
          )
        }
      } catch {
        // continue polling
      }
    }, 4000)

    return () => clearInterval(intervalId)
  }, [checkout?.transactionCode, paymentStatus, t, router, amount, topupBasePath])

  useEffect(() => {
    if (paymentStatus !== "pending") return
    if (!paymentInfo?.expiresAt) return

    const expiresAtMs = new Date(paymentInfo.expiresAt).getTime()
    if (!Number.isFinite(expiresAtMs)) return
    if (expiresAtMs > Date.now()) return

    toast.error(t("topup_expired", "Mã nạp tiền đã hết hạn sau 15 phút chờ, vui lòng tạo giao dịch mới"))
    setPaymentStatus("expired")
    setPaymentInfo((prev) => (prev ? { ...prev, status: "expired" } : prev))
  }, [paymentStatus, remainingSeconds, paymentInfo?.expiresAt])

  const handleCreateTopup = async () => {
    if (amount < 10000) {
      toast.error(t("topup_min_amount", "Số tiền tối thiểu là 10.000 VND"))
      return
    }

    setIsCreating(true)
    try {
      const result = await apiClient.createWalletTopupSepay({ amount })
      const checkoutData = result?.checkout
      const payment = result?.payment

      if (!checkoutData || !payment) {
        throw new Error(t("topup_failed", "Không thể tạo giao dịch nạp tiền"))
      }

      setCheckout({
        transactionCode: String(checkoutData.transactionCode || ""),
        qrImageUrl: String(checkoutData.qrImageUrl || ""),
        bankName: String(checkoutData.bankName || ""),
        accountNumber: String(checkoutData.accountNumber || ""),
        expiresAt: checkoutData.expiresAt,
      })
      setPaymentStatus(String(payment.status || "pending"))
      setPaymentInfo({
        id: String(payment.id || ""),
        transactionId: String(payment.transactionId || ""),
        transactionCode: String(payment.transactionCode || checkoutData.transactionCode || ""),
        status: String(payment.status || "pending"),
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        expiresAt: payment.expiresAt || checkoutData.expiresAt || null,
        sepayTransactionId: payment.sepayTransactionId || null,
        gatewayTransactionId: payment.gatewayTransactionId || null,
      })
      toast.success(t("topup_qr_created", "Đã tạo mã nạp tiền SePay"))
    } catch (error) {
      const message = error instanceof Error ? error.message : t("topup_failed", "Không thể tạo giao dịch nạp tiền")
      toast.error(message)
    } finally {
      setIsCreating(false)
    }
  }

  const copyTransferContent = async () => {
    if (!checkout?.transactionCode) return
    try {
      await navigator.clipboard.writeText(checkout.transactionCode)
      toast.success(t("topup_copy_success", "Đã sao chép nội dung chuyển khoản"))
    } catch {
      toast.error(t("topup_copy_failed", "Không thể sao chép nội dung"))
    }
  }

  const handleBackNavigation = async () => {
    if (checkout?.transactionCode && paymentStatus === "pending") {
      try {
        await apiClient.cancelSepayPayment(checkout.transactionCode, "left_checkout_before_transfer")
      } catch {
        // Best-effort cancellation before leaving page.
      }
    }

    router.push(backHref)
  }

  if (isBootstrapping) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-36 animate-pulse rounded-3xl border border-border/60 bg-card/60" />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="h-[560px] animate-pulse rounded-3xl border border-border/60 bg-card/60" />
          <div className="h-[560px] animate-pulse rounded-3xl border border-border/60 bg-card/60" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-8 h-60 w-60 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-6 rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-sky-500/5 p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                <Sparkles size={14} />
                Wallet Top-up
              </p>
              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{t("topup_title", "Nạp tiền vào ví")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("topup_subtitle", "Tạo mã SePay để nạp tiền nhanh, an toàn và đồng bộ theo thời gian thực")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t("topup_wallet_balance", "Số dư hiện tại")}
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  {isLoading ? "..." : formatCurrencyByLanguage(balance, language)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleBackNavigation()}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3.5 text-sm font-semibold text-foreground transition hover:bg-secondary"
              >
                <ArrowLeft size={15} />
                {t("topup_back", "Quay lại")}
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
            className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-sm backdrop-blur-sm"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{t("topup_choose_amount", "Chọn số tiền nạp")}</p>
                <p className="text-xs text-muted-foreground">{t("topup_hint", "Bạn có thể dùng preset hoặc nhập thủ công")}</p>
              </div>
              <button
                onClick={loadWalletData}
                className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-1.5 text-sm hover:bg-secondary"
              >
                <RefreshCw size={14} />
                {t("topup_refresh", "Làm mới")}
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TOPUP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    amount === preset
                      ? "border-primary bg-primary/15 text-primary shadow-sm"
                      : "border-border/70 bg-background/70 hover:bg-secondary"
                  }`}
                >
                  {formatCurrencyByLanguage(preset, language)}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("topup_custom_amount", "Số tiền tùy chỉnh")}
              </label>
              <input
                value={amountText}
                onChange={(e) => setAmount(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
                className="w-full rounded-lg border border-border/70 bg-background px-3 py-2"
                placeholder="100000"
              />
            </div>

            <button
              onClick={handleCreateTopup}
              disabled={isCreating}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-semibold text-white hover:bg-primary/90 disabled:opacity-70"
            >
              {isCreating ? <Loader2 className="animate-spin" size={16} /> : <QrCode size={16} />}
              {isCreating ? t("topup_creating", "Đang tạo giao dịch") : t("topup_create_qr", "Tạo mã SePay QR")}
            </button>

            <div className="mt-4 grid gap-2 rounded-2xl border border-border/70 bg-secondary/20 p-3 text-xs text-muted-foreground sm:grid-cols-2">
              <p className="inline-flex items-center gap-1.5"><ShieldCheck size={14} />{t("topup_secure_note", "Thanh toán được đối soát tự động")}</p>
              <p className="inline-flex items-center gap-1.5"><Clock3 size={14} />{t("topup_expire_note", "Mỗi mã QR có thời hạn 15 phút")}</p>
            </div>

            {checkout && (
              <div className="mt-5 rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-sm font-semibold">{t("topup_transfer_info", "Thông tin chuyển khoản")}</p>
                <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <span>{t("topup_status", "Trạng thái")}:</span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusInfo.badgeClass}`}>
                      {statusInfo.text}
                    </span>
                  </p>
                  <p>{t("checkout_transaction_id", "Mã giao dịch")}: {paymentInfo?.transactionId || "-"}</p>
                  <p>{t("checkout_transfer_content", "Nội dung")}: {paymentInfo?.transactionCode || checkout.transactionCode}</p>
                  <p>{t("checkout_reference_code", "Mã tham chiếu")}: {paymentInfo?.sepayTransactionId || paymentInfo?.gatewayTransactionId || "-"}</p>
                  <p>{t("checkout_created_at", "Thời gian tạo")}: {formatDateTime(paymentInfo?.createdAt)}</p>
                  <p>{t("checkout_paid_at", "Thời gian thanh toán")}: {formatDateTime(paymentInfo?.paidAt)}</p>
                  <p>{t("topup_bank", "Ngân hàng")}: {checkout.bankName} - {checkout.accountNumber}</p>
                </div>

                {isPending && (
                  <p className={`mt-2 text-xs font-semibold ${isExpired ? "text-rose-600" : "text-amber-600"}`}>
                    {t("checkout_time_left", "Thời gian còn lại")}: {isExpired ? "00:00" : formatCountdown(remainingSeconds)}
                  </p>
                )}
                {isExpired && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">
                    {t("topup_expired", "Mã nạp tiền đã hết hạn sau 15 phút chờ, vui lòng tạo giao dịch mới")}
                  </p>
                )}

                <button
                  onClick={copyTransferContent}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Copy size={14} />
                  {t("topup_copy_content", "Sao chép nội dung chuyển khoản")}
                </button>

                {checkout.qrImageUrl && !isExpired && (
                  <div className="mt-3 rounded-xl border border-border/70 bg-card p-3">
                    <img src={checkout.qrImageUrl} alt="Topup SePay QR" className="mx-auto h-56 w-56 object-contain" />
                  </div>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" }}
            className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-sm backdrop-blur-sm"
          >
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Wallet size={18} />
              {t("topup_history", "Lịch sử ví")}
            </div>

            <div className="max-h-[650px] space-y-2 overflow-auto pr-1">
              {transactions.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("topup_no_transactions", "Chưa có giao dịch")}</p>
              )}

              {transactions.slice(0, 20).map((tx) => {
                const delta = Number(tx.changeAmount || 0)
                const isCredit = delta > 0
                return (
                  <div key={tx.id} className="rounded-xl border border-border/70 bg-background/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {tx.description ? normalizeWalletDescription(tx.description) : tx.type}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
                      </div>
                      <p className={`text-sm font-bold ${isCredit ? "text-emerald-600" : "text-red-500"}`}>
                        {isCredit ? "+" : ""}{formatCurrencyByLanguage(Math.abs(delta), language)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("topup_balance_after", "Số dư sau giao dịch")}: {formatCurrencyByLanguage(Number(tx.balanceAfter || 0), language)}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
