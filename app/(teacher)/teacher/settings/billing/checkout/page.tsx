"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, CreditCard, GraduationCap, Landmark, Loader2, QrCode, ShieldCheck, Wallet, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { getPaymentStatusInfo } from "@/lib/payment-status-utils"
import { useLanguage } from "@/lib/i18n/language-context"
import { getCurrentClientLanguage, localizeMessage } from "@/lib/i18n/message-localizer"
import { UniversalSelect } from "@/components/ui/universal-select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Plan = {
  id: string
  name: string
  price: number
  durationMonths: number
  courseLimit?: number
  storageLimitGb?: number | null
  studentsLimit?: number | null
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

type ViewMode = "executive" | "fintech" | "academy"

const THEME_STORAGE_KEY = "teacher_wallet_membership_view_mode"

const CHECKOUT_THEME_CONFIG: Record<
  ViewMode,
  {
    label: string
    pageGlowA: string
    pageGlowB: string
    activeBorder: string
    activeBg: string
    activeShadow: string
    primaryButton: string
    walletAccent: string
    modeIcon: "landmark" | "zap" | "academy"
  }
> = {
  executive: {
    label: "Executive",
    pageGlowA: "bg-amber-200/55 dark:bg-amber-900/20",
    pageGlowB: "bg-sky-200/55 dark:bg-sky-900/20",
    activeBorder: "border-amber-400/80",
    activeBg: "bg-amber-50/70 dark:bg-amber-900/20",
    activeShadow: "shadow-[0_15px_35px_rgba(245,158,11,0.16)]",
    primaryButton: "from-amber-500 to-orange-500",
    walletAccent: "text-amber-700 dark:text-amber-300",
    modeIcon: "landmark",
  },
  fintech: {
    label: "Fintech",
    pageGlowA: "bg-cyan-200/55 dark:bg-cyan-900/20",
    pageGlowB: "bg-emerald-200/55 dark:bg-emerald-900/20",
    activeBorder: "border-cyan-400/80",
    activeBg: "bg-cyan-50/70 dark:bg-cyan-900/20",
    activeShadow: "shadow-[0_15px_35px_rgba(14,165,233,0.16)]",
    primaryButton: "from-cyan-500 to-blue-500",
    walletAccent: "text-cyan-700 dark:text-cyan-300",
    modeIcon: "zap",
  },
  academy: {
    label: "Academy Premium",
    pageGlowA: "bg-indigo-200/55 dark:bg-indigo-900/20",
    pageGlowB: "bg-violet-200/55 dark:bg-violet-900/20",
    activeBorder: "border-indigo-400/80",
    activeBg: "bg-indigo-50/70 dark:bg-indigo-900/20",
    activeShadow: "shadow-[0_15px_35px_rgba(99,102,241,0.18)]",
    primaryButton: "from-indigo-500 to-violet-500",
    walletAccent: "text-indigo-700 dark:text-indigo-300",
    modeIcon: "academy",
  },
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
  const [methodTab, setMethodTab] = useState<"saved" | "qr" | "wallet">("saved")
  const [walletConfirmOpen, setWalletConfirmOpen] = useState(false)
  const [quickPaymentMode, setQuickPaymentMode] = useState<"wallet" | "qr" | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>("executive")

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedMode === "executive" || savedMode === "fintech" || savedMode === "academy") {
        setViewMode(savedMode)
      }
    } catch {
      // Ignore localStorage access issues.
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, viewMode)
    } catch {
      // Ignore localStorage write failures.
    }
  }, [viewMode])

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
      const [planRes, methodRes, walletRes] = await Promise.all([
        apiClient.getInstructorPlans(),
        apiClient.getTeacherPaymentMethods(),
        apiClient.getMyWalletBalance(),
      ])
      const activePlans = Array.isArray(planRes) ? planRes.filter((p) => Number(p.price || 0) >= 0) : []
      const savedMethods = Array.isArray(methodRes) ? methodRes : []

      setPlans(activePlans)
      setMethods(savedMethods)
      setWalletBalance(Number(walletRes?.balance || 0))

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

  // Reset checkout when plan changes to avoid displaying QR with old plan
  useEffect(() => {
    if (!checkout) return
    
    const cancelPreviousCheckout = async () => {
      if (checkout?.transactionId && checkout?.paymentChannel === "sepay_qr" && checkout?.status === "pending") {
        try {
          await apiClient.cancelTeacherCheckout(checkout.transactionId)
        } catch (error: any) {
          console.error("Cancel checkout error:", error)
        }
      }
    }
    
    cancelPreviousCheckout()
    setCheckout(null)
  }, [selectedPlanId])

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

  // Cleanup: cancel QR checkout if not completed
  useEffect(() => {
    return () => {
      if (checkout?.transactionId && checkout?.paymentChannel === "sepay_qr" && checkout?.status === "pending") {
        apiClient.cancelTeacherCheckout(checkout.transactionId).catch(() => {
          // Silently fail on cleanup
        })
      }
    }
  }, [checkout?.transactionId, checkout?.paymentChannel, checkout?.status])

  const cancelCurrentCheckout = async () => {
    if (checkout?.transactionId && checkout?.paymentChannel === "sepay_qr" && checkout?.status === "pending") {
      try {
        await apiClient.cancelTeacherCheckout(checkout.transactionId)
      } catch (error: any) {
        console.error("Cancel checkout error:", error)
      }
    }
    setCheckout(null)
  }

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
  const theme = CHECKOUT_THEME_CONFIG[viewMode]

  const checkoutStatusBadgeClass = useMemo(() => {
    return getPaymentStatusInfo(checkout?.status, t).badgeClass
  }, [checkout?.status, t])

  const checkoutStatusText = useMemo(() => {
    return getPaymentStatusInfo(checkout?.status, t).text
  }, [checkout?.status, t])

  const renderModeIcon = (mode: ViewMode) => {
    const icon = CHECKOUT_THEME_CONFIG[mode].modeIcon
    if (icon === "landmark") return <Landmark size={14} />
    if (icon === "academy") return <GraduationCap size={14} />
    return <Zap size={14} />
  }

  const getModeLabel = (mode: ViewMode) => {
    if (mode === "executive") {
      return t("teacher_view_mode_executive", "Sang trọng tối giản")
    }
    if (mode === "academy") {
      return t("teacher_view_mode_academy", "Học thuật cao cấp")
    }
    return t("teacher_view_mode_fintech", "Công nghệ mạnh")
  }

  const formatLimit = (value: number | null | undefined, suffix = "") => {
    if (value === null || value === undefined) {
      return t("teacher_settings_unlimited", "Không giới hạn")
    }
    const safeValue = Number(value)
    if (!Number.isFinite(safeValue) || safeValue <= 0) {
      return t("teacher_settings_unlimited", "Không giới hạn")
    }
    return `${safeValue}${suffix}`
  }

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
      // Cancel previous QR checkout if exists
      if (checkout?.transactionId && checkout?.paymentChannel === "sepay_qr" && checkout?.status === "pending") {
        try {
          await apiClient.cancelTeacherCheckout(checkout.transactionId)
        } catch {
          // Ignore cancel error
        }
      }

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
      // Cancel previous QR checkout if exists
      if (checkout?.transactionId && checkout?.paymentChannel === "sepay_qr" && checkout?.status === "pending") {
        try {
          await apiClient.cancelTeacherCheckout(checkout.transactionId)
        } catch {
          // Ignore cancel error
        }
      }

      const data = await apiClient.createTeacherCheckout({
        planId: selectedPlanId,
        paymentChannel: "wallet",
      })
      setCheckout(data)
      setMethodTab("wallet")
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

  const handlePrimaryCheckout = async () => {
    if (quickPaymentMode === "wallet") {
      setWalletConfirmOpen(true)
      return
    }

    if (quickPaymentMode === "qr") {
      await createQrCheckout()
      return
    }

    await createCheckoutByMethod()
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
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200/90 dark:bg-slate-800" />
        <div className="grid gap-6 xl:grid-cols-[1fr_370px]">
          <div className="space-y-6">
            <div className="h-44 animate-pulse rounded-2xl bg-slate-200/90 dark:bg-slate-800" />
            <div className="h-44 animate-pulse rounded-2xl bg-slate-200/90 dark:bg-slate-800" />
            <div className="h-64 animate-pulse rounded-2xl bg-slate-200/90 dark:bg-slate-800" />
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200/90 dark:bg-slate-800" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/85 md:p-8">
      <div className="relative z-10 mb-4 flex flex-wrap items-center gap-2">
        <p className="mr-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-200">{t("teacher_view_mode_label", "Chế độ giao diện")}</p>
        {(Object.keys(CHECKOUT_THEME_CONFIG) as ViewMode[]).map((mode) => {
          const active = mode === viewMode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {renderModeIcon(mode)} {getModeLabel(mode)}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setViewMode("executive")}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t("teacher_view_mode_reset", "Đặt lại mặc định")}
        </button>
      </div>

      <motion.div
        aria-hidden
        className={`pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-full blur-3xl ${theme.pageGlowA}`}
        animate={{ opacity: [0.28, 0.5, 0.28], scale: [1, 1.07, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute right-[-70px] bottom-[-90px] h-72 w-72 rounded-full blur-3xl ${theme.pageGlowB}`}
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [1.02, 0.96, 1.02] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />

      <div className="relative z-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-wrap items-start justify-between gap-3"
        >
          <div>
            <p className="mb-2 inline-flex items-center rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-700 dark:border-cyan-900/70 dark:bg-cyan-900/30 dark:text-cyan-200">
              Teacher Membership Checkout
            </p>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white md:text-4xl">{t("checkout_title", "Thanh toán gói")}</h1>
            <p className="text-sm text-slate-700 dark:text-slate-200">{t("checkout_subtitle", "Chọn phương thức thanh toán và hoàn tất nâng cấp")}</p>
            <p className={`mt-1 text-sm font-semibold ${theme.walletAccent}`}>{t("checkout_wallet", "Số dư ví")}: {formatVnd(walletBalance)}</p>
          </div>
          <Link
            href="/teacher/wallet-membership"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} /> {t("payment_back_to_checkout", "Quay lại gói thành viên")}
          </Link>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1fr_370px]">
          <div className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className={`rounded-2xl border p-6 transition-all duration-300 ${
                activeStep === 1
                  ? `${theme.activeBorder} ${theme.activeBg} ${theme.activeShadow}`
                  : "border-slate-200 bg-white/75 dark:border-slate-700 dark:bg-slate-900/70"
              }`}
            >
              <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-300">
                <span className={`h-2.5 w-2.5 rounded-full ${activeStep === 1 ? "bg-cyan-500" : "bg-slate-400"}`} />
                1. {t("checkout_plan", "Chọn gói")}
              </p>
              <UniversalSelect
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                contentClassName="border-slate-200 bg-white text-slate-800 shadow-[0_18px_40px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                portalled
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </UniversalSelect>

              {selectedPlan && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-bold text-slate-900 dark:text-white">{selectedPlan.name}</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white">{formatVnd(Number(selectedPlan.price || 0))}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {t("checkout_duration", "Thời hạn")}: {selectedPlan.durationMonths} {t("teacher_settings_month", "tháng")}
                  </p>
                  <div className="mt-3 grid gap-2 text-xs text-slate-700 dark:text-slate-200 sm:grid-cols-3">
                    <p>{t("teacher_settings_courses_limit", "Khóa học")}: <span className="font-semibold">{selectedPlan.courseLimit ?? "-"}</span></p>
                    <p>{t("teacher_settings_storage", "Dung lượng")}: <span className="font-semibold">{formatLimit(selectedPlan.storageLimitGb, "GB")}</span></p>
                    <p>{t("teacher_settings_students", "Học viên")}: <span className="font-semibold">{formatLimit(selectedPlan.studentsLimit)}</span></p>
                  </div>
                </div>
              )}
            </motion.section>

            {methods.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/70"
              >
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {t("checkout_no_methods", "Bạn chưa có phương thức thanh toán đã lưu. Bạn vẫn có thể thanh toán bằng ví hoặc SePay QR bên dưới.")}
                </p>
              </motion.div>
            ) : (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className={`space-y-4 rounded-2xl border p-6 transition-all duration-300 ${
                  activeStep === 2
                    ? `${theme.activeBorder} ${theme.activeBg} ${theme.activeShadow}`
                    : "border-slate-200 bg-white/75 dark:border-slate-700 dark:bg-slate-900/70"
                }`}
              >
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                  <span className={`h-2.5 w-2.5 rounded-full ${activeStep === 2 ? "bg-cyan-500" : "bg-slate-400"}`} />
                  2. {t("checkout_choose_method", "Chọn phương thức")}
                </h2>

                <div className="space-y-3">
                  {methods.map((method) => {
                    const checked = selectedMethodId === method.id
                    return (
                      <label
                        key={method.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
                          checked
                            ? "border-cyan-400 bg-cyan-50/70 shadow-[0_10px_24px_rgba(14,165,233,0.16)] dark:bg-cyan-900/20"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="saved-method"
                            checked={checked}
                            onChange={() => setSelectedMethodId(method.id)}
                          />
                          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-cyan-700 dark:bg-slate-800 dark:text-cyan-300">
                            {method.type === "e_wallet" ? "M" : <CreditCard size={15} />}
                          </div>
                          <div>
                            <p className="font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">{method.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {method.type === "bank_card"
                                ? t("payment_method_bank_card", "Thẻ ngân hàng")
                                : t("payment_method_ewallet", "Ví điện tử")}
                            </p>
                          </div>
                        </div>
                        {method.isDefault ? (
                          <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {t("common_default", "Default")}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDefaultMethod(method.id)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            {t("payment_set_default", "Đặt làm mặc định")}
                          </button>
                        )}
                      </label>
                    )
                  })}
                </div>
              </motion.section>
            )}

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className={`space-y-4 rounded-2xl border p-6 transition-all duration-300 ${
                activeStep === 3
                  ? `${theme.activeBorder} ${theme.activeBg} ${theme.activeShadow}`
                  : "border-slate-200 bg-white/75 dark:border-slate-700 dark:bg-slate-900/70"
              }`}
            >
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                <span className={`h-2.5 w-2.5 rounded-full ${activeStep === 3 ? "bg-cyan-500" : "bg-slate-400"}`} />
                3. {t("checkout_or_qr", "Thanh toán bằng ví hoặc SePay QR")}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t("checkout_qr_hint", "Quét QR SePay hoặc trả trực tiếp bằng số dư ví")}</p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={async () => {
                    await cancelCurrentCheckout()
                    setQuickPaymentMode("wallet")
                    setMethodTab("wallet")
                  }}
                  disabled={processing || !selectedPlanId}
                  className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition hover:translate-y-[-1px] hover:shadow-sm disabled:opacity-60 ${
                    quickPaymentMode === "wallet"
                      ? "border-emerald-500 bg-emerald-100 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-900/35 dark:text-emerald-200"
                      : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300"
                  }`}
                >
                  <Wallet size={16} />
                  {t("checkout_wallet_option", "Chọn thanh toán bằng ví")}
                </button>

                <button
                  onClick={() => {
                    setQuickPaymentMode("qr")
                    setMethodTab("qr")
                  }}
                  disabled={processing || !selectedPlanId}
                  className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition hover:translate-y-[-1px] hover:shadow-sm disabled:opacity-60 ${
                    quickPaymentMode === "qr"
                      ? "border-cyan-500 bg-cyan-100 text-cyan-900 dark:border-cyan-500 dark:bg-cyan-900/35 dark:text-cyan-200"
                      : "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-800/60 dark:bg-cyan-900/20 dark:text-cyan-300"
                  }`}
                >
                  <QrCode size={16} />
                  {t("checkout_qr_option", "Chọn quét mã QR")}
                </button>
              </div>

              {methodTab === "wallet" && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-800/70 dark:bg-emerald-900/20">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200">{t("checkout_wallet", "Số dư ví")}: {formatVnd(walletBalance)}</p>
                  <p className="mt-1 text-emerald-700 dark:text-emerald-300">{t("checkout_wallet_confirm_note", "Bạn cần bấm xác nhận để thực hiện thanh toán ví. Việc chọn ví không tự trừ tiền.")}</p>
                </div>
              )}

              {quickPaymentMode === "qr" && (!checkout || methodTab !== "qr") && (
                <div className="rounded-xl border border-cyan-300 bg-cyan-50 p-4 text-sm text-cyan-800 dark:border-cyan-800/70 dark:bg-cyan-900/20 dark:text-cyan-200">
                  {t("checkout_qr_click_primary_note", "Bấm Thanh toán ngay để tạo mã QR, sau đó mới quét để thanh toán.")}
                </div>
              )}

              {checkout && quickPaymentMode === "qr" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 shadow-[0_8px_20px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-950/65">
                  {qrPreviewUrl ? (
                  <div className="space-y-3">
                    {!isSepayExpired ? (
                      <img src={qrPreviewUrl} alt="qr-payment" className="mx-auto h-44 w-44 rounded-lg border border-slate-200 bg-white p-2 sm:h-56 sm:w-56" />
                    ) : (
                      <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-lg border border-dashed border-red-400 bg-red-50 text-center text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300 sm:h-56 sm:w-56">
                        {t("checkout_qr_expired", "Mã thanh toán đã hết hạn sau 15 phút chờ, vui lòng tạo giao dịch mới")}
                      </div>
                    )}
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t("checkout_qr_hint", "Quét QR SePay hoặc chuyển khoản theo đúng nội dung")}</p>
                    {checkout?.transactionId && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        <p className="mb-2 flex items-center gap-2">
                          <span>{t("checkout_sepay_status", "Trạng thái")}:</span>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${checkoutStatusBadgeClass}`}>
                            {checkoutStatusText}
                          </span>
                        </p>
                        <p>{t("checkout_transfer_content", "Nội dung")}: {checkout.transactionId}</p>
                        {checkout.bankName && checkout.accountNumber && (
                          <p>{t("checkout_bank", "Ngân hàng")}: {checkout.bankName} - {checkout.accountNumber}</p>
                        )}
                        <p>{t("checkout_reference_code", "Mã tham chiếu")}: {checkout.referenceCode || "-"}</p>
                        <p>{t("checkout_created_at", "Thời gian tạo")}: {formatDateTime(checkout.createdAt)}</p>
                        <p>{t("checkout_paid_at", "Thời gian thanh toán")}: {formatDateTime(checkout.paidAt)}</p>
                        {isSepayPending && (
                          <p className={`font-semibold ${isSepayExpired ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
                            {t("checkout_time_left", "Thời gian còn lại")}: {isSepayExpired ? "00:00" : formatCountdown(remainingSeconds)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  ) : null}
                  {checkout && (
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          await cancelCurrentCheckout()
                          setQuickPaymentMode(null)
                          setMethodTab("saved")
                        }}
                        className="flex-1 inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {t("common_back", "Quay lại")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.section>


          </div>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="h-fit rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.14)] sm:p-7 xl:sticky xl:top-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-950"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">3. Review</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white sm:mt-3 sm:text-2xl">{summaryPlanName} Plan</h3>
            <p className="mt-1 text-slate-600 dark:text-slate-300">{formatVnd(totalAmount)} / {t("common_month", "tháng")}</p>

            <div className="my-5 border-t border-slate-200 dark:border-slate-700" />

            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>{t("checkout_subtotal", "Subtotal")}</span>
                <span>{formatVnd(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("checkout_tax", "Tax")}</span>
                <span>{formatVnd(0)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 dark:border-slate-700" />
              <div className="flex items-center justify-between">
                <span className="text-slate-900 dark:text-white">{t("checkout_amount", "Total")}</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{formatVnd(totalAmount)}</span>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300">
              <ShieldCheck size={16} /> {t("checkout_secure_badge", "Thanh toán an toàn")}
            </div>

            <button
              onClick={handlePrimaryCheckout}
              disabled={
                processing ||
                !selectedPlanId ||
                (!quickPaymentMode && (!selectedMethodId || methods.length === 0))
              }
              className={`mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${theme.primaryButton} px-4 text-sm font-semibold text-white transition hover:-translate-y-px hover:brightness-110 active:scale-[0.99] disabled:opacity-60 sm:h-12 sm:px-6 sm:text-base`}
            >
              {processing ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
              {processing ? t("common_processing", "Processing...") : `${t("checkout_pay_now", "Thanh toán")} ${formatVnd(totalAmount)}`}
            </button>
            {!quickPaymentMode && methods.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t("checkout_select_method_required", "Please select a payment method")}
              </p>
            ) : null}
          </motion.aside>
        </div>


      </div>

      <Dialog open={walletConfirmOpen} onOpenChange={setWalletConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("checkout_wallet_confirm_title", "Xác nhận thanh toán bằng ví")}</DialogTitle>
            <DialogDescription>
              {t("checkout_wallet_confirm_desc", "Bạn có chắc muốn dùng số dư ví để thanh toán gói này?")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setWalletConfirmOpen(false)}
              className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("common_cancel", "Hủy bỏ")}
            </button>
            <button
              type="button"
              onClick={async () => {
                setWalletConfirmOpen(false)
                await createWalletCheckout()
              }}
              className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              {t("checkout_wallet_confirm_btn", "Xác nhận thanh toán bằng ví")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
