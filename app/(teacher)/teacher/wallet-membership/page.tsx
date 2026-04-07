"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreditCard, Loader2, Wallet } from "lucide-react"
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

const PLAN_ORDER: Record<string, number> = {
  "free": 1,
  "pro": 2,
  "pro plus": 3,
  "enterprise": 4,
  "pro premium": 5,
}

export default function TeacherWalletMembershipPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [plans, setPlans] = useState<PlanItem[]>([])
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)

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

  const currentPlanId = subscriptionData?.subscription?.plan?.id
  const usage = subscriptionData?.usage || { coursesCreated: 0, courseLimit: 2, remainingCourses: 2 }
  const billingHistory = Array.isArray(subscriptionData?.billingHistory) ? subscriptionData.billingHistory : []
  const isFreePlan = Number(subscriptionData?.subscription?.plan?.price || 0) === 0

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

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-5">
        <h1 className="text-2xl font-bold">{t("teacher_menu_wallet_membership", "Ví & gói hội viên")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("teacher_billing_subtitle", "Quản lý tài khoản, gói và phương thức thanh toán của bạn")}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase text-muted-foreground">{t("teacher_settings_current_plan_label", "Gói hiện tại")}</p>
            <p className="mt-1 text-lg font-bold">{subscriptionData?.subscription?.plan?.name || "Free"}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase text-muted-foreground">{t("teacher_settings_course_limit", "Hạn mức khóa học")}</p>
            <p className="mt-1 text-lg font-bold">{usage.coursesCreated}/{usage.courseLimit}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase text-muted-foreground">{t("checkout_wallet", "Số dư ví")}</p>
            <p className="mt-1 text-lg font-bold text-primary">{formatCurrency(walletBalance)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="mb-2 inline-flex items-center gap-2 text-lg font-semibold">
            <Wallet size={18} /> {t("checkout_wallet", "Số dư ví")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("topup_wallet_balance", "Số dư hiện tại")}</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(walletBalance)}</p>
          <div className="mt-4 flex gap-2">
            <Link href="/teacher/wallet-membership/top-up" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white">
              {t("topup_title", "Nạp tiền vào ví")}
            </Link>
            <Link href="/teacher/wallet-membership/payment-history" className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-semibold">
              {t("pay_header_title", "Lịch sử thanh toán")}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h3 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold">
            <CreditCard size={18} /> {t("teacher_settings_billing_history", "Lịch sử thanh toán")}
          </h3>
          {billingHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("teacher_settings_no_billing", "Chưa có giao dịch nâng cấp.")}</p>
          ) : (
            <div className="space-y-2">
              {billingHistory.slice(0, 8).map((item: any) => (
                <div key={item.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{item.plan?.name || "-"}</p>
                    <p className="font-semibold text-primary">{formatCurrency(Number(item.amount || 0))}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.transactionId}</p>
                </div>
              ))}
            </div>
          )}
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
            <article key={plan.id} className={`rounded-2xl border bg-card p-5 ${isCurrent ? "border-primary" : ""}`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-lg font-semibold">{plan.name}</p>
                {isPopular ? <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">Popular</span> : null}
              </div>

              <p className="text-3xl font-extrabold text-primary">{formatCurrency(Number(plan.price || 0))}</p>
              <p className="text-sm text-muted-foreground">/ {plan.durationMonths} {t("teacher_settings_month", "tháng")}</p>

              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p>{t("teacher_settings_courses_limit", "Giới hạn khóa học")}: {plan.courseLimit}</p>
                <p>{t("teacher_settings_storage", "Dung lượng")}: {plan.storageLimitGb ?? t("teacher_settings_unlimited", "Không giới hạn")}GB</p>
                <p>{t("teacher_settings_students", "Học viên")}: {plan.studentsLimit ?? t("teacher_settings_unlimited", "Không giới hạn")}</p>
              </div>

              <button
                onClick={() => router.push(`/teacher/wallet-membership/checkout?planId=${encodeURIComponent(plan.id)}`)}
                disabled={isCurrent}
                className="mt-4 h-10 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCurrent ? t("teacher_settings_currently_using", "Đang sử dụng") : cta}
              </button>
            </article>
          )
        })}
      </section>

      <section className="rounded-2xl border border-red-300 bg-red-50 p-5 dark:border-red-500/40 dark:bg-red-500/5">
        <h4 className="font-semibold text-red-700 dark:text-red-300">{t("teacher_settings_cancel_subscription", "Hủy gói hiện tại")}</h4>
        <p className="mt-1 text-sm text-red-600 dark:text-red-200">{t("teacher_settings_cancel_warning", "Hành động này sẽ hủy gói trả phí hiện tại và chuyển về Free plan.")}</p>
        <button
          onClick={cancelSubscription}
          disabled={cancelling || isFreePlan}
          className="mt-3 inline-flex h-10 items-center rounded-xl bg-red-500 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancelling ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
          {isFreePlan ? t("teacher_settings_already_free", "Bạn đang ở gói Free") : t("teacher_settings_cancel_subscription", "Hủy gói")}
        </button>
      </section>
    </div>
  )
}
