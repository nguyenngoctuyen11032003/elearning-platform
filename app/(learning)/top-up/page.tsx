"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Copy, Loader2, QrCode, RefreshCw, Wallet } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { formatCurrencyByLanguage } from "@/lib/format"
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
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [checkout, setCheckout] = useState<TopupCheckout | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>("idle")
  const [paymentInfo, setPaymentInfo] = useState<TopupPaymentInfo | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([])

  const amountText = useMemo(() => String(amount || ""), [amount])
  const topupBasePath = pathname.startsWith("/teacher/wallet-membership/top-up")
    ? "/teacher/wallet-membership/top-up"
    : "/top-up"
  const isPending = paymentStatus === "pending"
  const paymentExpiresAtMs = paymentInfo?.expiresAt ? new Date(paymentInfo.expiresAt).getTime() : NaN
  const isCountdownExpired = Number.isFinite(paymentExpiresAtMs) && paymentExpiresAtMs <= Date.now()
  const isExpired = paymentStatus === "expired" || (isPending && isCountdownExpired)

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
    loadWalletData()
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

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("topup_title", "Nạp tiền vào ví")}</h1>
          <button
            onClick={loadWalletData}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-secondary"
          >
            <RefreshCw size={14} />
            {t("topup_refresh", "Làm mới")}
          </button>
        </div>

        <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm text-muted-foreground">{t("topup_wallet_balance", "Số dư hiện tại")}</p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {isLoading ? "..." : formatCurrencyByLanguage(balance, language)}
          </p>
        </div>

        <p className="mb-2 text-sm font-semibold">{t("topup_choose_amount", "Chọn số tiền nạp")}</p>
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TOPUP_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                amount === preset ? "border-primary bg-primary/10 text-primary" : "hover:bg-secondary"
              }`}
            >
              {formatCurrencyByLanguage(preset, language)}
            </button>
          ))}
        </div>

        <input
          value={amountText}
          onChange={(e) => setAmount(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
          className="w-full rounded-lg border bg-background px-3 py-2"
          placeholder="100000"
        />

        <button
          onClick={handleCreateTopup}
          disabled={isCreating}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-primary/90 disabled:opacity-70"
        >
          {isCreating ? <Loader2 className="animate-spin" size={16} /> : <QrCode size={16} />}
          {isCreating ? t("topup_creating", "Đang tạo giao dịch") : t("topup_create_qr", "Tạo mã SePay QR")}
        </button>

        {checkout && (
          <div className="mt-5 rounded-xl border p-4">
            <p className="text-sm font-semibold">{t("topup_transfer_info", "Thông tin chuyển khoản")}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("topup_status", "Trạng thái")}: {paymentStatus}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("checkout_transaction_id", "Mã giao dịch")}: {paymentInfo?.transactionId || "-"}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("checkout_transfer_content", "Nội dung")}: {paymentInfo?.transactionCode || checkout.transactionCode}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("checkout_reference_code", "Mã tham chiếu")}: {paymentInfo?.sepayTransactionId || paymentInfo?.gatewayTransactionId || "-"}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("checkout_created_at", "Thời gian tạo")}: {formatDateTime(paymentInfo?.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("checkout_paid_at", "Thời gian thanh toán")}: {formatDateTime(paymentInfo?.paidAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("topup_bank", "Ngân hàng")}: {checkout.bankName} - {checkout.accountNumber}
            </p>
            {isPending && (
              <p className={`text-xs font-semibold ${isExpired ? "text-red-600" : "text-amber-600"}`}>
                {t("checkout_time_left", "Thời gian còn lại")}: {isExpired ? "00:00" : formatCountdown(remainingSeconds)}
              </p>
            )}
            {isExpired && (
              <p className="text-xs font-semibold text-red-600">
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
              <div className="mt-3 rounded-lg border p-2">
                <img src={checkout.qrImageUrl} alt="Topup SePay QR" className="mx-auto h-56 w-56 object-contain" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Wallet size={18} />
          {t("topup_history", "Lịch sử ví")}
        </div>

        <div className="space-y-2">
          {transactions.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("topup_no_transactions", "Chưa có giao dịch")}</p>
          )}

          {transactions.slice(0, 20).map((tx) => {
            const delta = Number(tx.changeAmount || 0)
            const isCredit = delta > 0
            return (
              <div key={tx.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{tx.description || tx.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <p className={`text-sm font-bold ${isCredit ? "text-green-600" : "text-red-500"}`}>
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
      </div>
    </div>
  )
}
