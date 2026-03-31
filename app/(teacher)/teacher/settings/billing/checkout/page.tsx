"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, CreditCard, QrCode, Wallet } from "lucide-react"
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
  paymentChannel: "bank_card" | "e_wallet" | "qr"
  amount: number
  qrImageUrl?: string
  qrPayload?: string
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
      const targetPlan = selectedPlanId || searchParams.get("planId") || ""
      router.replace(`/teacher/settings/billing/methods/new?planId=${encodeURIComponent(targetPlan)}`)
    }
  }, [loading, methods.length, selectedPlanId, router, searchParams])

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId), [plans, selectedPlanId])
  const selectedMethod = useMemo(() => methods.find((m) => m.id === selectedMethodId), [methods, selectedMethodId])

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
        paymentChannel: "qr",
      })
      setCheckout(data)
      toast.success(t("checkout_qr_created", "QR code has been generated"))
    } catch (error: any) {
      toast.error(localizeMessage(error?.message || t("checkout_qr_failed", "Unable to generate QR code"), getCurrentClientLanguage()))
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
      router.push("/teacher/settings?tab=billing")
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("checkout_title", "Thanh toán gói giảng viên")}</h1>
          <p className="text-sm text-muted-foreground">{t("checkout_subtitle", "Chọn phương thức thanh toán và hoàn tất nâng cấp")}</p>
        </div>
        <Link href="/teacher/settings?tab=billing" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm">
          <ArrowLeft size={16} /> {t("payment_back_to_checkout", "Quay lại thanh toán")}
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-sm text-muted-foreground">{t("checkout_plan", "Gói")}</p>
          <UniversalSelect
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - ${Number(plan.price || 0)} / {plan.durationMonths} {t("common_month", "month")}
              </option>
            ))}
          </UniversalSelect>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-sm text-muted-foreground">{t("checkout_amount", "Số tiền")}</p>
          <p className="text-2xl font-bold">${Number(selectedPlan?.price || 0)}</p>
        </div>
      </div>

      {methods.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6">
          <p className="mb-4 text-sm text-muted-foreground">{t("checkout_no_methods", "Bạn chưa có phương thức thanh toán nào. Vui lòng thêm mới để tiếp tục.")}</p>
          <button
            onClick={() => router.push(`/teacher/settings/billing/methods/new?planId=${encodeURIComponent(selectedPlanId)}`)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            <CreditCard size={16} /> {t("payment_add_method", "Thêm phương thức thanh toán")}
          </button>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("checkout_choose_method", "Chọn phương thức đã cài đặt")}</h2>
            <button
              onClick={() => router.push(`/teacher/settings/billing/methods/new?planId=${encodeURIComponent(selectedPlanId)}`)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              {t("payment_add_method", "Thêm phương thức thanh toán")}
            </button>
          </div>

          <div className="space-y-3">
            {methods.map((method) => (
              <label key={method.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border p-3">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="saved-method"
                    checked={selectedMethodId === method.id}
                    onChange={() => setSelectedMethodId(method.id)}
                  />
                  <div>
                    <p className="font-medium">{method.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {method.type === "bank_card"
                        ? t("payment_method_bank_card", "Thẻ ngân hàng")
                        : t("payment_method_ewallet", "Ví điện tử")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDefaultMethod(method.id)}
                  className="rounded-md border border-border px-2 py-1 text-xs"
                >
                  {method.isDefault ? t("common_default", "Default") : t("payment_set_default", "Đặt làm mặc định")}
                </button>
              </label>
            ))}
          </div>

          <button
            onClick={createCheckoutByMethod}
            disabled={processing || !selectedMethodId}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {selectedMethod?.type === "e_wallet" ? <Wallet size={16} /> : <CreditCard size={16} />}
            {processing ? t("common_processing", "Processing...") : t("checkout_pay_now", "Thanh toán ngay")}
          </button>
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">{t("checkout_or_qr", "Hoặc quét mã QR để thanh toán")}</h2>
        <button
          onClick={createQrCheckout}
          disabled={processing || !selectedPlanId}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm"
        >
          <QrCode size={16} /> {t("payment_method_qr", "Quét mã QR")}
        </button>
      </div>

      {checkout ? (
        <div className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 size={16} />
            {t("checkout_pending", "Đang chờ xác nhận")}: {checkout.transactionId}
          </div>

          {checkout.paymentChannel === "qr" && checkout.qrImageUrl ? (
            <div className="space-y-2">
              <img src={checkout.qrImageUrl} alt="qr-payment" className="h-56 w-56 rounded-lg border border-border bg-white p-2" />
              <p className="max-w-full break-all text-xs text-muted-foreground">{checkout.qrPayload}</p>
            </div>
          ) : null}

          <button
            onClick={confirmPaid}
            disabled={confirming}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            <CheckCircle2 size={16} />
            {confirming ? t("checkout_confirming", "Confirming...") : t("checkout_confirm_paid", "Tôi đã thanh toán thành công")}
          </button>
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
