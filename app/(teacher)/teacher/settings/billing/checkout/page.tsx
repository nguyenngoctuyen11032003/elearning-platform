"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, QrCode, ShieldCheck, Wallet } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"
import { getCurrentClientLanguage, localizeMessage } from "@/lib/i18n/message-localizer"
import { UniversalSelect } from "@/components/ui/universal-select"

type Plan = {
  id: string
  name: string
  price: number
  durationMonths: number
}

type SavedMethod = {
  id: string
  type: "bank_card" | "e_wallet"
  provider?: string | null
  label: string
  isDefault: boolean
}

type CheckoutData = {
  transactionId: string
  status: string
  paymentChannel: "bank_card" | "e_wallet" | "qr" | "wallet" | "sepay_qr"
  amount: number
  qrImageUrl?: string
  qrPayload?: string
  bankName?: string
  accountNumber?: string
  expiresAt?: string
  createdAt?: string
  paidAt?: string | null
  referenceCode?: string | null
}

function TeacherPlanCheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [methods, setMethods] = useState<SavedMethod[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [selectedMethodId, setSelectedMethodId] = useState("")
  const [checkout, setCheckout] = useState<CheckoutData | null>(null)
  const [processing, setProcessing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [methodTab, setMethodTab] = useState<"saved" | "qr">("saved")
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const formatVnd = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0)

  const loadData = async () => {
    setLoading(true)
    try {
      const [planRes, methodRes] = await Promise.all([
        apiClient.getInstructorPlans(),
        apiClient.getTeacherPaymentMethods(),
      ])
      const activePlans = Array.isArray(planRes) ? planRes.filter((p) => Number(p.price || 0) >= 0) : []
      const savedMethods = Array.isArray(methodRes) ? methodRes : []

      setPlans(activePlans)
      setMethods(savedMethods)

      const fromQuery = searchParams.get("planId") || ""
      const fallbackPlan = activePlans.find((p: any) => Number(p.price || 0) > 0)?.id || activePlans[0]?.id || ""
      setSelectedPlanId(fromQuery || fallbackPlan)

      const defaultMethod = savedMethods.find((m: SavedMethod) => m.isDefault) || savedMethods[0]
      setSelectedMethodId(defaultMethod?.id || "")
    } catch (error: any) {
      toast.error(localizeMessage(error?.message || t("payment_load_failed", "Unable to load payment data"), getCurrentClientLanguage()))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!loading && methods.length === 0) {
      setSelectedMethodId("")
    }
  }, [loading, methods.length])

  useEffect(() => {
    if (!checkout?.transactionId) return
    if (checkout.paymentChannel !== "sepay_qr") return
    if (checkout.status !== "pending") return

    const intervalId = setInterval(async () => {
      try {
        const result = await apiClient.getTeacherCheckoutStatus(checkout.transactionId)
        const payment = result?.payment
        if (!payment) return

        const nextStatus = String(payment.status || "pending")
        setCheckout((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            status: nextStatus,
            qrImageUrl: result?.checkout?.qrImageUrl || prev.qrImageUrl,
            expiresAt: result?.checkout?.expiresAt || payment.expiresAt || prev.expiresAt,
            createdAt: payment.createdAt || prev.createdAt,
            paidAt: payment.paidAt || prev.paidAt,
            referenceCode: payment.sepayTransactionId || prev.referenceCode || null,
          }
        })

        if (nextStatus === "paid") {
          clearInterval(intervalId)
          toast.success(t("checkout_success", "Thanh toán thành công và gói đã được kích hoạt."))
          router.push("/teacher/wallet-membership")
        }

        if (nextStatus === "expired" || nextStatus === "failed") {
          clearInterval(intervalId)
          toast.error(
            nextStatus === "expired"
              ? t("checkout_qr_expired", "Mã thanh toán đã hết hạn sau 15 phút chờ, vui lòng tạo giao dịch mới")
              : t("checkout_confirm_failed", "Unable to confirm transaction"),
          )
        }
      } catch {
        // keep polling
      }
    }, 5000)

    return () => clearInterval(intervalId)
  }, [checkout?.transactionId, checkout?.paymentChannel, checkout?.status, router, t])

  useEffect(() => {
    if (checkout?.status !== "pending") return
    if (!checkout?.expiresAt) return

    const expiresAtMs = new Date(checkout.expiresAt).getTime()
    if (!Number.isFinite(expiresAtMs)) return
    if (expiresAtMs > Date.now()) return

    toast.error(t("checkout_qr_expired", "Mã thanh toán đã hết hạn sau 15 phút chờ, vui lòng tạo giao dịch mới"))
    setCheckout((prev) => {
      if (!prev) return prev
      return { ...prev, status: "expired" }
    })
  }, [checkout?.status, checkout?.expiresAt, remainingSeconds])

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId), [plans, selectedPlanId])
  const selectedMethod = useMemo(() => methods.find((m) => m.id === selectedMethodId), [methods, selectedMethodId])
  const totalAmount = Number(selectedPlan?.price || 0)
  const activeStep = !selectedPlanId ? 1 : checkout ? 3 : methods.length > 0 ? 2 : 3

  const summaryPlanName = useMemo(() => {
    if (!selectedPlan) return "Plan"
    return selectedPlan.name
  }, [selectedPlan])

  const qrPreviewUrl = useMemo(() => {
    if (checkout?.qrImageUrl) return checkout.qrImageUrl
    if (checkout?.qrPayload) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkout.qrPayload)}`
    }
    return ""
  }, [checkout])

  const isSepayPending = checkout?.paymentChannel === "sepay_qr" && checkout?.status === "pending"
  const checkoutExpiresAtMs = checkout?.expiresAt ? new Date(checkout.expiresAt).getTime() : NaN
  const isCheckoutCountdownExpired = Number.isFinite(checkoutExpiresAtMs) && checkoutExpiresAtMs <= Date.now()
  const isSepayExpired = checkout?.status === "expired" || (isSepayPending && isCheckoutCountdownExpired)

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleString(getCurrentClientLanguage() === "en" ? "en-US" : "vi-VN")
  }

  const formatCountdown = (seconds: number) => {
    const safe = Math.max(0, seconds)
    const mins = Math.floor(safe / 60)
    const secs = safe % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  useEffect(() => {
    if (!checkout?.expiresAt || checkout.status !== "pending") {
      setRemainingSeconds(0)
      return
    }

    const updateRemaining = () => {
      const expiresAtMs = new Date(checkout.expiresAt as string).getTime()
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
  }, [checkout?.expiresAt, checkout?.status])

  const createCheckoutByMethod = async () => {
    if (!selectedPlanId) {
      toast.error(t("checkout_select_plan_required", "Please select a plan"))
      return
    }
    if (!selectedMethodId) {
      toast.error(t("checkout_select_method_required", "Please select a payment method"))
      return
    }

    setProcessing(true)
    try {
      const data = await apiClient.createTeacherCheckout({
        planId: selectedPlanId,
        paymentMethodId: selectedMethodId,
        paymentChannel: selectedMethod?.type,
      })
      setCheckout(data)
      setMethodTab("saved")

      if (selectedMethod?.type === "e_wallet") {
        const provider = String(selectedMethod.provider || "").toLowerCase()
        const deeplink = provider === "momo" ? "momo://app" : provider === "zalopay" ? "zalopay://app" : ""
        if (deeplink) {
          window.location.href = deeplink
        }
      }

      toast.success(t("checkout_transaction_created", "Transaction created. Please confirm after payment."))
    } catch (error: any) {
      toast.error(localizeMessage(error?.message || t("checkout_create_failed", "Unable to create transaction"), getCurrentClientLanguage()))
    } finally {
      setProcessing(false)
    }
  }

  const createQrCheckout = async () => {
    if (!selectedPlanId) {
      toast.error(t("checkout_select_plan_required", "Please select a plan"))
      return
    }

    setProcessing(true)
    try {
      const data = await apiClient.createTeacherCheckout({
        planId: selectedPlanId,
        paymentChannel: "sepay_qr",
      })
      setCheckout({
        ...data,
        createdAt: data?.createdAt,
        paidAt: data?.paidAt || null,
        referenceCode: data?.sepayTransactionId || null,
      })
      setMethodTab("qr")
      toast.success(t("checkout_qr_created", "QR code has been generated"))
    } catch (error: any) {
      toast.error(localizeMessage(error?.message || t("checkout_qr_failed", "Unable to generate QR code"), getCurrentClientLanguage()))
    } finally {
      setProcessing(false)
    }
  }

  const createWalletCheckout = async () => {
    if (!selectedPlanId) {
      toast.error(t("checkout_select_plan_required", "Please select a plan"))
      return
    }

    setProcessing(true)
    try {
      const data = await apiClient.createTeacherCheckout({
        planId: selectedPlanId,
        paymentChannel: "wallet",
      })
      setCheckout(data)
      toast.success(t("checkout_wallet_paid", "Đã thanh toán gói bằng số dư ví"))

      if (String(data?.status || "") === "paid") {
        router.push("/teacher/wallet-membership")
      }
    } catch (error: any) {
      toast.error(localizeMessage(error?.message || t("checkout_create_failed", "Unable to create transaction"), getCurrentClientLanguage()))
    } finally {
      setProcessing(false)
    }
  }

  const confirmPaid = async () => {
    if (!checkout?.transactionId) {
      toast.error(t("checkout_transaction_not_found", "Transaction not found"))
      return
    }

    setConfirming(true)
    try {
      await apiClient.confirmTeacherCheckout(checkout.transactionId)
      toast.success(t("checkout_success", "Thanh toán thành công và gói đã được kích hoạt."))
      router.push("/teacher/wallet-membership")
    } catch (error: any) {
      toast.error(localizeMessage(error?.message || t("checkout_confirm_failed", "Unable to confirm transaction"), getCurrentClientLanguage()))
    } finally {
      setConfirming(false)
    }
  }

  const setDefaultMethod = async (id: string) => {
    try {
      await apiClient.setDefaultTeacherPaymentMethod(id)
      await loadData()
      toast.success(t("payment_set_default_success", "Default payment method updated"))
    } catch (error: any) {
      toast.error(localizeMessage(error?.message || t("payment_set_default_failed", "Unable to update default payment method"), getCurrentClientLanguage()))
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
  }

  return (
    <div className="space-y-8 rounded-3xl bg-[#020617] p-8 text-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold text-white">{t("checkout_title", "Thanh toán gói")}</h1>
          <p className="text-sm text-slate-400">{t("checkout_subtitle", "Chọn phương thức thanh toán và hoàn tất nâng cấp")}</p>
        </div>
        <Link
          href="/teacher/wallet-membership"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          <ArrowLeft size={16} /> {t("payment_back_to_checkout", "Quay lại thanh toán")}
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <div
            className={`rounded-2xl border p-7 transition-all duration-300 ${
              activeStep === 1
                ? "border-blue-500 bg-[rgba(59,130,246,0.08)]"
                : "border-[#1e293b] bg-[#0f172a] opacity-60"
            }`}
          >
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <span className={`h-2.5 w-2.5 rounded-full ${activeStep === 1 ? "bg-blue-400" : "bg-slate-500"}`} />
              1. {t("checkout_plan", "Chọn gói")}
            </p>
            <UniversalSelect
              className="h-11 w-full rounded-xl border border-slate-700 bg-[#111827] px-3 py-2 text-slate-100"
              contentClassName="border-blue-500/30 bg-slate-950/92 text-slate-100 backdrop-blur-2xl shadow-[0_20px_50px_rgba(2,6,23,0.75)]"
              portalled
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {formatVnd(Number(plan.price || 0))} / {plan.durationMonths} {t("common_month", "month")}
                </option>
              ))}
            </UniversalSelect>
          </div>

          {methods.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0f172a] p-6">
              <p className="text-sm text-slate-400">
                {t("checkout_no_methods", "Bạn chưa có phương thức thanh toán đã lưu. Bạn vẫn có thể thanh toán bằng ví hoặc SePay QR bên dưới.")}
              </p>
            </div>
          ) : (
            <div
              className={`space-y-4 rounded-2xl border p-7 transition-all duration-300 ${
                activeStep === 2
                  ? "border-blue-500 bg-[rgba(59,130,246,0.08)]"
                  : "border-[#1e293b] bg-[#0f172a] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <span className={`h-2.5 w-2.5 rounded-full ${activeStep === 2 ? "bg-blue-400" : "bg-slate-500"}`} />
                  2. {t("checkout_choose_method", "Chọn phương thức")}
                </h2>
              </div>

              <div className="space-y-3">
                {methods.map((method) => {
                  const checked = selectedMethodId === method.id
                  return (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border bg-[#111827] p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/60 ${
                        checked
                          ? "border-blue-500 bg-[rgba(59,130,246,0.05)]"
                          : "border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="saved-method"
                          checked={checked}
                          onChange={() => setSelectedMethodId(method.id)}
                        />
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-pink-300">
                          {method.type === "e_wallet" ? "M" : <CreditCard size={15} />}
                        </div>
                        <div>
                          <p className="font-semibold uppercase tracking-wide text-slate-100">{method.label}</p>
                          <p className="text-xs text-slate-400">
                            {method.type === "bank_card"
                              ? t("payment_method_bank_card", "Thẻ ngân hàng")
                              : t("payment_method_ewallet", "Ví điện tử")}
                          </p>
                        </div>
                      </div>
                      {method.isDefault ? (
                        <span className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200">
                          {t("common_default", "Default")}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDefaultMethod(method.id)}
                          className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300"
                        >
                          {t("payment_set_default", "Đặt làm mặc định")}
                        </button>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div
            className={`space-y-4 rounded-2xl border p-7 transition-all duration-300 ${
              activeStep === 3
                ? "border-blue-500 bg-[rgba(59,130,246,0.08)]"
                : "border-[#1e293b] bg-[#0f172a] opacity-60"
            }`}
          >
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <span className={`h-2.5 w-2.5 rounded-full ${activeStep === 3 ? "bg-blue-400" : "bg-slate-500"}`} />
              3. {t("checkout_or_qr", "Thanh toán bằng ví hoặc SePay QR")}
            </h2>
            <p className="text-sm text-slate-400">{t("checkout_qr_hint", "Quét QR SePay hoặc trả trực tiếp bằng số dư ví")}</p>

            <div className="flex items-center gap-3">
              <button
                onClick={createWalletCheckout}
                disabled={processing || !selectedPlanId}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm text-slate-100 transition hover:border-emerald-500"
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                {t("checkout_wallet_pay", "Thanh toán bằng ví")}
              </button>

              <button
                onClick={createQrCheckout}
                disabled={processing || !selectedPlanId}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm text-slate-100 transition hover:border-blue-500"
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                {t("payment_method_qr", "Tạo mã SePay QR")}
              </button>
            </div>

            <div className="rounded-xl border border-slate-700 bg-[#111827] p-5">
              {methodTab === "qr" && qrPreviewUrl ? (
                <div className="space-y-3">
                  {!isSepayExpired ? (
                    <img src={qrPreviewUrl} alt="qr-payment" className="h-56 w-56 rounded-lg border border-slate-700 bg-white p-2" />
                  ) : (
                    <div className="flex h-56 w-56 items-center justify-center rounded-lg border border-dashed border-red-500/60 bg-red-500/10 text-sm text-red-300">
                      {t("checkout_qr_expired", "Mã thanh toán đã hết hạn sau 15 phút chờ, vui lòng tạo giao dịch mới")}
                    </div>
                  )}
                  <p className="text-sm text-slate-300">{t("checkout_qr_hint", "Quét QR SePay hoặc chuyển khoản theo đúng nội dung")}</p>
                  {checkout?.transactionId && (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-300">
                      <p>{t("checkout_transfer_content", "Nội dung")}: {checkout.transactionId}</p>
                      {checkout.bankName && checkout.accountNumber && (
                        <p>{t("checkout_bank", "Ngân hàng")}: {checkout.bankName} - {checkout.accountNumber}</p>
                      )}
                      <p>{t("checkout_reference_code", "Mã tham chiếu")}: {checkout.referenceCode || "-"}</p>
                      <p>{t("checkout_created_at", "Thời gian tạo")}: {formatDateTime(checkout.createdAt)}</p>
                      <p>{t("checkout_paid_at", "Thời gian thanh toán")}: {formatDateTime(checkout.paidAt)}</p>
                      {isSepayPending && (
                        <p className={`font-semibold ${isSepayExpired ? "text-red-300" : "text-amber-300"}`}>
                          {t("checkout_time_left", "Thời gian còn lại")}: {isSepayExpired ? "00:00" : formatCountdown(remainingSeconds)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex h-56 w-56 items-center justify-center rounded-lg border border-dashed border-slate-600 text-sm text-slate-400">
                    {t("checkout_qr_preview", "QR CODE")}
                  </div>
                  <p className="text-sm text-slate-300">{t("checkout_qr_hint", "Quét bằng MoMo / ZaloPay")}</p>
                </div>
              )}
            </div>
          </div>

          {checkout ? (
            <div className="space-y-4 rounded-2xl border border-blue-500/40 bg-blue-500/10 p-6">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 size={16} />
                {t("checkout_pending", "Đang chờ xác nhận")}: {checkout.transactionId}
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-xs text-slate-300">
                <p>{t("checkout_reference_code", "Mã tham chiếu")}: {checkout.referenceCode || "-"}</p>
                <p>{t("checkout_created_at", "Thời gian tạo")}: {formatDateTime(checkout.createdAt)}</p>
                <p>{t("checkout_paid_at", "Thời gian thanh toán")}: {formatDateTime(checkout.paidAt)}</p>
                {isSepayPending && (
                  <p className={`font-semibold ${isSepayExpired ? "text-red-300" : "text-amber-300"}`}>
                    {t("checkout_time_left", "Thời gian còn lại")}: {isSepayExpired ? "00:00" : formatCountdown(remainingSeconds)}
                  </p>
                )}
              </div>

              <button
                onClick={confirmPaid}
                disabled={confirming || checkout.status === "expired"}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 text-base font-semibold text-white transition hover:-translate-y-px hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
              >
                {confirming ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {confirming ? t("checkout_confirming", "Confirming...") : t("checkout_confirm_paid", "Tôi đã thanh toán thành công")}
              </button>
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border border-[#334155] bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-7 xl:sticky xl:top-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">3. Review</p>
          <h3 className="mt-3 text-2xl font-bold text-white">{summaryPlanName} Plan</h3>
          <p className="mt-1 text-slate-300">{formatVnd(totalAmount)} / {t("common_month", "tháng")}</p>

          <div className="my-5 border-t border-slate-700" />

          <div className="space-y-3 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <span>{t("checkout_subtotal", "Subtotal")}</span>
              <span>{formatVnd(totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("checkout_tax", "Tax")}</span>
              <span>{formatVnd(0)}</span>
            </div>
            <div className="border-t border-slate-600 pt-3" />
            <div className="flex items-center justify-between">
              <span className="text-slate-100">{t("checkout_amount", "Total")}</span>
              <span className="text-3xl font-bold text-white">{formatVnd(totalAmount)}</span>
            </div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <ShieldCheck size={16} /> {t("checkout_secure_badge", "Thanh toán an toàn")}
          </div>

          <button
            onClick={createCheckoutByMethod}
            disabled={processing || !selectedMethodId || methods.length === 0}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 text-base font-semibold text-white transition hover:-translate-y-px hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {processing ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
            {processing ? t("common_processing", "Processing...") : `${t("checkout_pay_now", "Thanh toán")} ${formatVnd(totalAmount)}`}
          </button>
        </aside>
      </div>

      {checkout ? (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {t("checkout_pending", "Đang chờ xác nhận")}: {checkout.transactionId}
        </div>
      ) : null}
    </div>
  )
}

export default function TeacherPlanCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      }
    >
      <TeacherPlanCheckoutPageContent />
    </Suspense>
  )
}
