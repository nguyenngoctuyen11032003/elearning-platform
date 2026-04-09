"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Boxes, CircleHelp, CreditCard, Database, GraduationCap, Landmark, Loader2, RotateCcw, ShieldCheck, Users, Wallet, Zap } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { formatCurrency } from "@/lib/format"
import { useLanguage } from "@/lib/i18n/language-context"
import { getCurrentClientLanguage, localizeMessage } from "@/lib/i18n/message-localizer"

type PlanItem = {
  id: string
  name: string
  price: number
  durationMonths: number
  courseLimit: number
  storageLimitGb?: number | null
  studentsLimit?: number | null
}

type ViewMode = "executive" | "fintech" | "academy"

const VIEW_MODE_CONFIG: Record<
  ViewMode,
  {
    label: string
    heroBg: string
    heroGlowA: string
    heroGlowB: string
    accentText: string
    usageBar: string
    popularBadge: string
    currentPlanCard: string
    ctaButton: string
    modeIcon: "landmark" | "zap" | "academy"
  }
> = {
  executive: {
    label: "Executive",
    heroBg: "bg-[radial-gradient(circle_at_top_left,_#1f2937_0%,_#0f172a_55%,_#020617_100%)]",
    heroGlowA: "bg-amber-300/20",
    heroGlowB: "bg-sky-300/15",
    accentText: "text-amber-300",
    usageBar: "bg-amber-300",
    popularBadge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    currentPlanCard: "border-amber-500 bg-amber-50/40 dark:border-amber-500/70 dark:bg-amber-900/20",
    ctaButton: "dark:bg-amber-600 dark:hover:bg-amber-500",
    modeIcon: "landmark",
  },
  fintech: {
    label: "Fintech",
    heroBg: "bg-[radial-gradient(circle_at_top_left,_#0f766e_0%,_#0f172a_55%,_#020617_100%)]",
    heroGlowA: "bg-teal-300/20",
    heroGlowB: "bg-cyan-300/15",
    accentText: "text-cyan-300",
    usageBar: "bg-emerald-300",
    popularBadge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    currentPlanCard: "border-cyan-500 bg-cyan-50/40 dark:border-cyan-500/70 dark:bg-cyan-900/20",
    ctaButton: "dark:bg-cyan-600 dark:hover:bg-cyan-500",
    modeIcon: "zap",
  },
  academy: {
    label: "Academy Premium",
    heroBg: "bg-[radial-gradient(circle_at_top_left,_#1e3a8a_0%,_#312e81_45%,_#111827_100%)]",
    heroGlowA: "bg-indigo-300/20",
    heroGlowB: "bg-violet-300/15",
    accentText: "text-indigo-300",
    usageBar: "bg-indigo-300",
    popularBadge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    currentPlanCard: "border-indigo-500 bg-indigo-50/40 dark:border-indigo-500/70 dark:bg-indigo-900/20",
    ctaButton: "dark:bg-indigo-600 dark:hover:bg-indigo-500",
    modeIcon: "academy",
  },
}

const PLAN_ORDER: Record<string, number> = {
  "free": 1,
  "pro": 2,
  "pro plus": 3,
  "enterprise": 4,
  "pro premium": 5,
}

const THEME_STORAGE_KEY = "teacher_wallet_membership_view_mode"

export default function TeacherWalletMembershipPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [autoRenewUpdating, setAutoRenewUpdating] = useState(false)
  const [plans, setPlans] = useState<PlanItem[]>([])
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>("executive")

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedMode === "executive" || savedMode === "fintech" || savedMode === "academy") {
        setViewMode(savedMode)
      }
    } catch {
      // Ignore localStorage access issues in restricted environments.
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, viewMode)
    } catch {
      // Ignore localStorage write failures.
    }
  }, [viewMode])

  const loadData = async () => {
    setLoading(true)
    try {
      const [publicPlans, mySub, wallet] = await Promise.all([
        apiClient.getInstructorPlans(),
        apiClient.getTeacherSubscription(),
        apiClient.getMyWalletBalance(),
      ])

      setPlans(Array.isArray(publicPlans) ? publicPlans : [])
      setSubscriptionData(mySub)
      setWalletBalance(Number(wallet?.balance || 0))
    } catch (error: any) {
      toast.error(
        localizeMessage(
          error?.message || t("teacher_settings_load_failed", "Không thể tải cài đặt tài khoản"),
          getCurrentClientLanguage(),
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const orderedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      const aName = String(a.name || "").toLowerCase()
      const bName = String(b.name || "").toLowerCase()
      const orderA = PLAN_ORDER[aName] ?? 999
      const orderB = PLAN_ORDER[bName] ?? 999
      if (orderA !== orderB) return orderA - orderB
      return Number(a.price || 0) - Number(b.price || 0)
    })
  }, [plans])

  const currentSubscription = subscriptionData?.subscription || null
  const currentPlan = subscriptionData?.subscription?.plan || null
  const currentPlanId = currentPlan?.id
  const currentPlanAutoRenew = currentSubscription?.autoRenew === true
  const currentPlanEndDate = currentSubscription?.endDate ? new Date(currentSubscription.endDate) : null
  const currentPlanDaysLeft = useMemo(() => {
    if (!currentPlanEndDate || Number.isNaN(currentPlanEndDate.getTime())) return 0
    const diff = currentPlanEndDate.getTime() - Date.now()
    if (diff <= 0) return 0
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }, [currentSubscription?.endDate])
  const usage = subscriptionData?.usage || {
    coursesCreated: 0,
    courseLimit: 2,
    remainingCourses: 2,
    studentsUsed: 0,
    studentsLimit: currentPlan?.studentsLimit ?? null,
    remainingStudents: null,
    storageLimitGb: currentPlan?.storageLimitGb ?? null,
    storageUsedGbEstimate: null,
    remainingStorageGbEstimate: null,
    storageUsageSource: "estimate_by_course_usage_ratio",
  }
  const billingHistory = Array.isArray(subscriptionData?.billingHistory) ? subscriptionData.billingHistory : []
  const isFreePlan = Number(currentPlan?.price || 0) === 0
  const currentPlanStorage = currentPlan?.storageLimitGb ?? null
  const currentPlanStudents = currentPlan?.studentsLimit ?? null
  const studentsUsed = Number(usage?.studentsUsed || 0)
  const studentsLimit = usage?.studentsLimit ?? currentPlanStudents ?? null
  const storageUsedGbEstimate =
    usage?.storageUsedGbEstimate === null || usage?.storageUsedGbEstimate === undefined
      ? null
      : Number(usage.storageUsedGbEstimate)
  const storageLimitGb = usage?.storageLimitGb ?? currentPlanStorage ?? null
  const usagePercent = usage.courseLimit > 0 ? Math.min(100, Math.round((usage.coursesCreated / usage.courseLimit) * 100)) : 0

  const paidHistory = billingHistory.filter((item: any) => String(item?.status || "").toLowerCase() === "paid")
  const totalSpent = paidHistory.reduce((sum: number, item: any) => sum + Number(item?.amount || 0), 0)
  const theme = VIEW_MODE_CONFIG[viewMode]

  const renderModeIcon = (mode: ViewMode) => {
    const icon = VIEW_MODE_CONFIG[mode].modeIcon
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

  const formatUsedLimit = (
    used: number | null | undefined,
    limit: number | null | undefined,
    unit = "",
  ) => {
    const safeUsed = Number.isFinite(Number(used)) ? Number(used) : 0
    if (limit === null || limit === undefined || Number(limit) <= 0) {
      return `${safeUsed}${unit} / ${t("teacher_settings_unlimited", "Không giới hạn")}`
    }
    return `${safeUsed}${unit} / ${Number(limit)}${unit}`
  }

  const cancelSubscription = async () => {
    if (isFreePlan) {
      toast.info(t("teacher_settings_already_free", "Bạn đang ở gói Free"))
      return
    }

    setCancelling(true)
    try {
      await apiClient.cancelTeacherSubscription("Cancelled by teacher")
      toast.success(t("teacher_settings_cancelled_plan", "Đã hủy gói trả phí và chuyển về gói Free"))
      await loadData()
    } catch (error: any) {
      toast.error(localizeMessage(error?.message || t("teacher_settings_cancel_failed", "Không thể hủy gói"), getCurrentClientLanguage()))
    } finally {
      setCancelling(false)
    }
  }

  const updateAutoRenew = async (nextValue: boolean) => {
    setAutoRenewUpdating(true)
    try {
      const result = await apiClient.updateTeacherAutoRenew(nextValue)
      if (result?.subscription) {
        setSubscriptionData((prev: any) => {
          if (!prev) return prev
          return {
            ...prev,
            subscription: {
              ...prev.subscription,
              ...result.subscription,
            },
          }
        })
      } else {
        await loadData()
      }

      toast.success(
        nextValue
          ? t("teacher_auto_renew_enabled", "Đã bật tự động gia hạn")
          : t("teacher_auto_renew_disabled", "Đã tắt tự động gia hạn"),
      )
    } catch (error: any) {
      toast.error(
        localizeMessage(
          error?.message || t("teacher_auto_renew_update_failed", "Không thể cập nhật tự động gia hạn"),
          getCurrentClientLanguage(),
        ),
      )
    } finally {
      setAutoRenewUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <section className="h-14 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <section className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <div className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </section>
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-4">
            <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("teacher_view_mode_label", "Chế độ giao diện")}</p>
          {(Object.keys(VIEW_MODE_CONFIG) as ViewMode[]).map((mode) => {
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
            <RotateCcw size={13} /> {t("teacher_view_mode_reset", "Đặt lại mặc định")}
          </button>
        </div>
      </section>

      <section className={`relative overflow-hidden rounded-3xl border border-slate-200 p-6 text-white shadow-[0_22px_60px_rgba(2,6,23,0.35)] md:p-8 ${theme.heroBg}`}>
        <div className={`pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl ${theme.heroGlowA}`} />
        <div className={`pointer-events-none absolute -left-20 -bottom-24 h-72 w-72 rounded-full blur-3xl ${theme.heroGlowB}`} />

        <div className="relative z-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]">
              {t("teacher_menu_wallet_membership", "Ví & gói hội viên")}
            </p>
            <h1 className="text-3xl font-black leading-tight md:text-4xl">
              {t("teacher_billing_subtitle", "Quản lý tài khoản, gói và phương thức thanh toán của bạn")}
            </h1>
            <p className="max-w-2xl text-sm text-slate-100/90 md:text-base">
              {t("teacher_settings_current_plan_label", "Gói hiện tại")}: <span className="font-semibold">{currentPlan?.name || "Free"}</span>
            </p>
            <p className="max-w-2xl text-sm text-slate-100/90 md:text-base">
              {t("teacher_plan_days_left", "Số ngày còn lại")}: <span className="font-semibold">{currentPlanDaysLeft > 0 ? `${currentPlanDaysLeft} ${t("teacher_settings_day", "ngày")}` : t("teacher_plan_expired", "Đã hết hạn")}</span>
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.08em] text-cyan-100/90">{t("checkout_wallet", "Số dư ví")}</p>
                <p className="mt-1 text-xl font-extrabold">{formatCurrency(walletBalance)}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.08em] text-cyan-100/90">{t("teacher_settings_course_limit", "Hạn mức khóa học")}</p>
                <p className="mt-1 text-xl font-extrabold">{usage.coursesCreated}/{usage.courseLimit}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.08em] text-cyan-100/90">{t("teacher_settings_storage", "Dung lượng")}</p>
                <p className="mt-1 text-xl font-extrabold">{formatUsedLimit(storageUsedGbEstimate, storageLimitGb, "GB")}</p>
                <p className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-100/85">
                  {t("teacher_settings_used", "Đã dùng")} / {t("teacher_settings_limit", "Giới hạn")} ({t("teacher_settings_estimated", "ước tính")})
                  <span
                    title={t("teacher_storage_estimate_tooltip", "Dung lượng đang hiển thị là ước tính theo mức sử dụng khóa học, chưa phải số đo byte chính xác của tệp tải lên.")}
                    className="inline-flex"
                  >
                    <CircleHelp size={12} />
                  </span>
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.08em] text-cyan-100/90">{t("teacher_settings_students", "Học viên")}</p>
                <p className="mt-1 text-xl font-extrabold">{formatUsedLimit(studentsUsed, studentsLimit)}</p>
                <p className="text-[11px] font-medium text-cyan-100/85">{t("teacher_settings_used", "Đã dùng")} / {t("teacher_settings_limit", "Giới hạn")}</p>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-100/90">{t("teacher_settings_usage", "Mức sử dụng")}</p>
            <p className="mt-1 text-lg font-bold">{usagePercent}%</p>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
              <div className={`h-full rounded-full transition-all ${theme.usageBar}`} style={{ width: `${usagePercent}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-100/90">
              {t("teacher_settings_remaining_courses", "Khóa học còn lại")}: <span className="font-semibold">{usage.remainingCourses}</span>
            </p>

            <div className="mt-4 grid gap-2 text-sm">
              <Link href="/teacher/wallet-membership/top-up" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 font-semibold text-slate-900 transition hover:brightness-95">
                <Wallet size={16} /> {t("topup_title", "Nạp tiền vào ví")}
              </Link>
              <Link href="/teacher/wallet-membership/payment-history" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-4 font-semibold text-white transition hover:bg-white/20">
                <CreditCard size={16} /> {t("pay_header_title", "Lịch sử thanh toán")}
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{t("teacher_settings_current_plan_label", "Gói hiện tại")}</p>
          <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{currentPlan?.name || "Free"}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatCurrency(Number(currentPlan?.price || 0))} / {currentPlan?.durationMonths || 1} {t("teacher_settings_month", "tháng")}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("teacher_plan_days_left", "Số ngày còn lại")}: <span className="font-semibold">{currentPlanDaysLeft > 0 ? `${currentPlanDaysLeft} ${t("teacher_settings_day", "ngày")}` : t("teacher_plan_expired", "Đã hết hạn")}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("teacher_auto_renew", "Tự động gia hạn")}: <span className="font-semibold">{currentPlanAutoRenew ? t("common_on", "Bật") : t("common_off", "Tắt")}</span>
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("teacher_settings_storage", "Dung lượng")}</p>
          <p className="mt-2 inline-flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
            <Database size={20} className="text-emerald-600" /> {formatUsedLimit(storageUsedGbEstimate, storageLimitGb, "GB")}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("teacher_settings_plan_resources", "Tài nguyên lưu trữ theo gói")} ({t("teacher_settings_estimated", "ước tính")})</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("teacher_settings_students", "Học viên")}</p>
          <p className="mt-2 inline-flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
            <Users size={20} className="text-cyan-600" /> {formatUsedLimit(studentsUsed, studentsLimit)}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("teacher_settings_student_capacity", "Sức chứa học viên tối đa")}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{t("teacher_settings_billing_history", "Lịch sử thanh toán")}</p>
          <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{billingHistory.length}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("teacher_settings_total_spent", "Tổng chi")}: {formatCurrency(totalSpent)}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <CreditCard size={18} /> {t("teacher_settings_billing_history", "Lịch sử thanh toán")}
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Hiển thị 3 mục / cuộn để xem tiếp
            </span>
          </div>
          {billingHistory.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("teacher_settings_no_billing", "Chưa có giao dịch nâng cấp.")}</p>
          ) : (
            <div className="max-h-[264px] space-y-2 overflow-y-auto pr-1">
              {billingHistory.map((item: any) => {
                const status = String(item?.status || "pending").toLowerCase()
                const isPaid = status === "paid"

                return (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{item.plan?.name || "-"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.transactionId}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDateTime(item?.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(Number(item.amount || 0))}</p>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${isPaid ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{t("checkout_wallet", "Số dư ví")}</p>
            <p className={`mt-2 text-3xl font-black ${theme.accentText}`}>{formatCurrency(walletBalance)}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Số dư hiện tại trong ví để thanh toán gói.</p>
            <div className="mt-3 flex gap-2">
              <Link href="/teacher/wallet-membership/top-up" className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                {t("topup_title", "Nạp tiền vào ví")}
              </Link>
            </div>
          </article>

          <div className="rounded-2xl border border-red-300 bg-red-50 p-5 shadow-sm dark:border-red-500/40 dark:bg-red-500/5">
            <h4 className="inline-flex items-center gap-2 font-semibold text-red-700 dark:text-red-300">
              <ShieldCheck size={16} /> {t("teacher_settings_cancel_subscription", "Hủy gói hiện tại")}
            </h4>
            <p className="mt-2 text-sm text-red-600 dark:text-red-200">{t("teacher_settings_cancel_warning", "Hành động này sẽ hủy gói trả phí hiện tại và chuyển về Free plan.")}</p>
            <button
              onClick={cancelSubscription}
              disabled={cancelling || isFreePlan}
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              {isFreePlan ? t("teacher_settings_already_free", "Bạn đang ở gói Free") : t("teacher_settings_cancel_subscription", "Hủy gói")}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {orderedPlans.map((plan) => {
          const isCurrent = currentPlanId === plan.id
          const isPopular = String(plan.name || "").toLowerCase() === "pro"
          const cta =
            String(plan.name || "").toLowerCase() === "pro"
              ? "Start Pro Plan"
              : String(plan.name || "").toLowerCase() === "pro plus"
              ? "Start Pro Plus Plan"
              : String(plan.name || "").toLowerCase() === "enterprise"
              ? "Upgrade to Enterprise"
              : `Start ${plan.name} Plan`

          return (
            <article
              key={plan.id}
              className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                isCurrent
                  ? theme.currentPlanCard
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</p>
                {isPopular ? <span className={`rounded-full px-2 py-1 text-xs font-semibold ${theme.popularBadge}`}>Popular</span> : null}
              </div>

              <p className="text-3xl font-extrabold text-cyan-700 dark:text-cyan-300">{formatCurrency(Number(plan.price || 0))}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">/ {plan.durationMonths} {t("teacher_settings_month", "tháng")}</p>

              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p className="inline-flex items-center gap-2"><Boxes size={15} className="text-cyan-600" /> {t("teacher_settings_courses_limit", "Giới hạn khóa học")}: <span className="font-semibold">{plan.courseLimit}</span></p>
                <p className="inline-flex items-center gap-2"><Database size={15} className="text-emerald-600" /> {t("teacher_settings_storage", "Dung lượng")}: <span className="font-semibold">{formatLimit(plan.storageLimitGb, "GB")}</span></p>
                <p className="inline-flex items-center gap-2"><Users size={15} className="text-indigo-600" /> {t("teacher_settings_students", "Học viên")}: <span className="font-semibold">{formatLimit(plan.studentsLimit)}</span></p>
              </div>

              {isCurrent ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {t("teacher_plan_days_left", "Số ngày còn lại")}: {currentPlanDaysLeft > 0 ? `${currentPlanDaysLeft} ${t("teacher_settings_day", "ngày")}` : t("teacher_plan_expired", "Đã hết hạn")}
                  </p>
                  <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={currentPlanAutoRenew}
                      disabled={autoRenewUpdating}
                      onChange={(e) => {
                        void updateAutoRenew(e.target.checked)
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>{t("teacher_auto_renew_toggle_label", "Tự động gia hạn bằng ví khi hết hạn")}</span>
                  </label>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  {t("teacher_auto_renew_available_after_activate", "Mua gói này để bật tự động gia hạn trên gói đang dùng")}
                </p>
              )}

              <button
                onClick={() => router.push(`/teacher/wallet-membership/checkout?planId=${encodeURIComponent(plan.id)}`)}
                disabled={isCurrent}
                className={`mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${theme.ctaButton}`}
              >
                {isCurrent ? t("teacher_settings_currently_using", "Đang sử dụng") : <><ArrowUpRight size={16} /> {cta}</>}
              </button>
            </article>
          )
        })}
      </section>
    </div>
  )
}
