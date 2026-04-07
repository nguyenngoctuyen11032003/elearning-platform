"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, Clock, CreditCard, Globe, Moon, Palette, Shield, Sparkles, Sun } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"
import { getCurrentClientLanguage, localizeMessage } from "@/lib/i18n/message-localizer"
import { UniversalSelect } from "@/components/ui/universal-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PlanItem {
  id: string
  name: string
  price: number
  durationMonths: number
  courseLimit: number
  storageLimitGb?: number | null
  studentsLimit?: number | null
  features?: string[]
}

export default function TeacherSettingsPage() {
  const router = useRouter()
  const { t, setLanguage } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load dark mode preference from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      if (saved !== null) {
        return saved === 'true'
      }
      // Default to true if no preference saved
      return true
    }
    return true
  })
  const [selectedLanguage, setSelectedLanguage] = useState<"vi" | "en">("vi")
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    courseNotifications: true,
    studentNotifications: true,
    billingNotifications: true,
  })

  const [plans, setPlans] = useState<PlanItem[]>([])
  const [subscriptionData, setSubscriptionData] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [publicPlans, mySub] = await Promise.all([
        apiClient.getInstructorPlans(),
        apiClient.getTeacherSubscription(),
      ])

      setPlans(Array.isArray(publicPlans) ? publicPlans : [])
      setSubscriptionData(mySub)
    } catch (error) {
      toast.error(t("teacher_settings_load_failed", "Không thể tải cài đặt tài khoản"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setIsDarkMode(isDark)
    setSelectedLanguage(document.documentElement.lang === "en" ? "en" : "vi")
  }, [])

  // Initialize and sync dark mode with document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const currentPlanId = subscriptionData?.subscription?.plan?.id
  const currentPlanName = String(subscriptionData?.subscription?.plan?.name || "Free")
  const isFreePlan = currentPlanName.toLowerCase() === "free" || Number(subscriptionData?.subscription?.plan?.price || 0) === 0
  const usage = subscriptionData?.usage || { coursesCreated: 0, courseLimit: 2, remainingCourses: 2 }
  const billingHistory = Array.isArray(subscriptionData?.billingHistory) ? subscriptionData.billingHistory : []

  const usagePercent = useMemo(() => {
    const limit = Number(usage.courseLimit || 0)
    if (!limit) return 0
    return Math.min(100, Math.round((Number(usage.coursesCreated || 0) / limit) * 100))
  }, [usage])

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0)

  const recommendedPlanId = useMemo(() => {
    if (!plans.length) return ""
    const basicPlan = plans.find((plan) => String(plan.name || "").toLowerCase().includes("basic"))
    if (basicPlan) return basicPlan.id
    const paidPlans = plans
      .filter((plan) => Number(plan.price || 0) > 0)
      .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    if (paidPlans.length > 0) return paidPlans[0].id
    return plans[0].id
  }, [plans])

  const upgradePlan = async (planId: string) => {
    router.push(`/teacher/wallet-membership/checkout?planId=${encodeURIComponent(planId)}`)
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
      toast.error(localizeMessage(error?.message || t("teacher_settings_cancel_failed", "Cannot cancel plan"), getCurrentClientLanguage()))
    } finally {
      setCancelling(false)
    }
  }

  const handleLanguageChange = (lang: string) => {
    const nextLang = lang === "en" ? "en" : "vi"
    setSelectedLanguage(nextLang)
    setLanguage(nextLang)
  }

  if (loading) {
    return <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8 pb-28">
        <section
          className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/80"
          style={{ backgroundImage: "url('/image/bg_dashboard.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/45 via-primary/25 to-accent/40 dark:from-slate-950/85 dark:via-slate-950/70 dark:to-slate-900/85" />
          <div className="relative z-10 space-y-4 p-6 md:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary">
              <Shield size={14} />
              {t("teacher_billing_title", "Thanh toán & Gói giảng viên")}
            </div>
            <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr] lg:items-end">
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg lg:text-4xl">{t("teacher_billing_title", "Thanh toán & Gói giảng viên")}</h1>
                <p className="mt-2 leading-6 text-white/85">{t("teacher_billing_subtitle", "Quản lý tài khoản, gói và phương thức thanh toán của bạn")}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("teacher_settings_current_plan_label", "Gói hiện tại")}</p>
                  <p className="mt-1 text-xl font-black leading-none text-slate-900 dark:text-white">{subscriptionData?.subscription?.plan?.name || t("common_free", "Free")}</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("teacher_settings_course_limit", "Hạn mức khóa học")}</p>
                  <p className="mt-1 text-xl font-black leading-none text-slate-900 dark:text-white">{usage.coursesCreated}/{usage.courseLimit}</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("teacher_settings_upgrade_plan", "Upgrade Plan")}</p>
                  <p className="mt-1 text-xl font-black leading-none text-slate-900 dark:text-white">{plans.length}</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/75 p-3 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">{t("teacher_settings_billing_history", "Billing History")}</p>
                  <p className="mt-1 text-xl font-black leading-none text-slate-900 dark:text-white">{billingHistory.length}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Tabs defaultValue="notifications" className="w-full">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
            <div className="border-b border-slate-200 p-3 md:p-4 dark:border-slate-800">
              <TabsList className="grid grid-cols-1 gap-1 rounded-xl bg-slate-50 p-1 sm:grid-cols-2 dark:bg-slate-800/60">
                <TabsTrigger
                  value="notifications"
                  className="h-10 rounded-lg text-xs font-semibold text-slate-600 transition-all hover:text-primary data-[state=active]:bg-primary/90 data-[state=active]:text-white md:text-sm dark:text-slate-300 dark:hover:text-accent dark:data-[state=active]:bg-accent"
                >
                  {t("teacher_settings_notifications_title", "Notifications")}
                </TabsTrigger>
                <TabsTrigger
                  value="appearance"
                  className="h-10 rounded-lg text-xs font-semibold text-slate-600 transition-all hover:text-primary data-[state=active]:bg-primary/90 data-[state=active]:text-white md:text-sm dark:text-slate-300 dark:hover:text-accent dark:data-[state=active]:bg-accent"
                >
                  {t("teacher_settings_appearance_title", "Appearance")}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="billing" className="m-0 space-y-6 p-5 md:p-6">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground dark:text-white">
                  <CreditCard size={22} className="text-primary dark:text-accent" />
                  {t("teacher_settings_tab_billing", "Billing & Subscription")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                  {t("teacher_billing_subtitle", "Quản lý tài khoản, gói và phương thức thanh toán của bạn")}
                </p>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="space-y-5 rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("teacher_settings_current_plan_label", "Gói hiện tại")}
                  </h3>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">{subscriptionData?.subscription?.plan?.name || t("common_free", "Free")}</h4>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isFreePlan ? "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"}`}>
                        {isFreePlan ? t("common_free", "Free") : t("teacher_settings_current_plan", "Current Plan")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {t("teacher_settings_course_limit", "Hạn mức khóa học")}: <strong>{usage.coursesCreated}</strong> / <strong>{usage.courseLimit}</strong>
                    </p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/70">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${usagePercent}%` }} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {t("teacher_settings_usage_remaining", "Usage: còn {n} khóa học có thể tạo.").replace("{n}", String(usage.remainingCourses))}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {plans.map((plan, _, arr) => {
                      const isCurrent = currentPlanId === plan.id
                      const isRecommended = recommendedPlanId === plan.id
                      let displayName = plan.name
                      let ctaText = `${t("teacher_settings_upgrade_to", "Upgrade to")} ${plan.name}`

                      if (Number(plan.price) === 9) {
                        displayName = "Pro"
                        ctaText = t("teacher_settings_start_pro", "Start Pro Plan")
                      } else if (Number(plan.price) === 19) {
                        displayName = "Pro Plus"
                        ctaText = t("teacher_settings_start_pro_plus", "Start Pro Plus Plan")
                      } else if (String(plan.name || "").toLowerCase().includes("basic")) {
                        displayName = "Basic"
                        ctaText = t("teacher_settings_upgrade_basic", "Upgrade to Basic")
                      }

                      if (!isRecommended && arr.some((p) => p.id !== plan.id && Number(p.price) === Number(plan.price) && recommendedPlanId === p.id)) {
                        return null
                      }

                      return (
                        <article
                          key={plan.id}
                          className={`rounded-2xl border bg-white/90 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-0.5 dark:bg-slate-900/70 ${
                            isRecommended
                              ? "border-emerald-400/70 shadow-[0_14px_36px_rgba(16,185,129,0.2)]"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <div className="mb-4 flex items-start justify-between gap-2">
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
                            {isRecommended ? (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                {t("teacher_settings_popular", "Popular")}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            {formatVnd(Number(plan.price || 0))}
                            <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-400">/ {plan.durationMonths} {t("teacher_settings_month", "month")}</span>
                          </p>
                          <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            <p>{t("teacher_settings_courses_limit", "Course limit")}: {plan.courseLimit}</p>
                            <p>{t("teacher_settings_storage", "Storage")}: {plan.storageLimitGb ?? t("teacher_settings_unlimited", "Unlimited")}GB</p>
                            <p>{t("teacher_settings_students", "Students")}: {plan.studentsLimit ?? t("teacher_settings_unlimited", "Unlimited")}</p>
                          </div>
                          <button
                            disabled={isCurrent}
                            onClick={() => upgradePlan(plan.id)}
                            className={`mt-5 h-10 w-full rounded-xl px-4 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 ${
                              isCurrent
                                ? "bg-slate-400 dark:bg-slate-700"
                                : isRecommended
                                ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:brightness-110"
                                : "bg-blue-600 hover:bg-blue-500"
                            }`}
                          >
                            {isCurrent ? t("teacher_settings_currently_using", "Đang sử dụng") : ctaText}
                          </button>
                        </article>
                      )
                    })}
                  </div>
                </section>

                <section className="space-y-5 rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t("teacher_settings_payment_method", "Payment Method")}
                  </h3>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{t("teacher_settings_payment_hint", "Bạn có thể thêm thẻ, ví điện tử hoặc thanh toán bằng QR tại trang thanh toán gói.")}</p>
                    <button
                      onClick={() => router.push("/teacher/wallet-membership/checkout")}
                      className="mt-4 h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98]"
                    >
                      {t("checkout_title", "Thanh toán gói")}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{t("teacher_settings_billing_history", "Billing History")}</h4>
                    {billingHistory.length === 0 ? (
                      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t("teacher_settings_no_billing", "Chưa có giao dịch nâng cấp.")}</p>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {billingHistory.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950/70">
                            <div>
                              <p className="font-medium leading-5 text-slate-800 dark:text-slate-100">{item.transactionId}</p>
                              <p className="leading-5 text-slate-600 dark:text-slate-400">{item.plan?.name || t("teacher_settings_unknown_plan", "Unknown plan")}</p>
                            </div>
                            <div className="text-right">
                              <p className="leading-5 text-slate-800 dark:text-slate-100">{formatVnd(Number(item.amount || 0))}</p>
                              <p className="leading-5 text-slate-600 dark:text-slate-400">{item.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-red-300 bg-red-50 p-5 dark:border-red-500/40 dark:bg-red-500/5">
                    <h4 className="text-base font-bold text-red-700 dark:text-red-300">{t("teacher_settings_cancel_subscription", "Cancel Subscription")}</h4>
                    <p className="mt-2 text-sm leading-6 text-red-600/80 dark:text-red-200/80">{t("teacher_settings_cancel_warning", "Hành động này sẽ hủy gói trả phí hiện tại và chuyển về Free plan.")}</p>
                    <button
                      onClick={cancelSubscription}
                      disabled={cancelling || isFreePlan}
                      className="mt-4 h-10 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-400 active:scale-[0.98] disabled:opacity-50"
                    >
                      {cancelling
                        ? t("teacher_settings_cancelling", "Đang hủy...")
                        : isFreePlan
                        ? t("teacher_settings_already_free", "Bạn đang ở gói Free")
                        : t("teacher_settings_cancel_subscription", "Cancel Subscription")}
                    </button>
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="m-0 space-y-6 p-5 md:p-6">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground dark:text-white">
                  <Bell size={22} className="text-primary dark:text-accent" />
                  {t("teacher_settings_notifications_title", "Notifications")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                  {t("teacher_settings_notif_desc", "Tùy chỉnh thông báo cho hoạt động giảng dạy, học viên và thanh toán")}
                </p>
              </div>

              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t("teacher_settings_notifications_title", "Notifications")}</h3>
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="space-y-3">
                    {[
                      { key: "emailNotifications", label: t("teacher_settings_notif_email", "Thông báo email") },
                      { key: "courseNotifications", label: t("teacher_settings_notif_course", "Thông báo khóa học") },
                      { key: "studentNotifications", label: t("teacher_settings_notif_student", "Thông báo học viên") },
                      { key: "billingNotifications", label: t("teacher_settings_notif_billing", "Thông báo thanh toán") },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 dark:border-slate-700/70">
                        <p className="inline-flex items-center gap-2.5 text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
                          <Bell size={14} className="text-slate-400 dark:text-slate-500" />
                          {item.label}
                        </p>
                        <button
                          onClick={() =>
                            setNotifications((prev: any) => ({
                              ...prev,
                              [item.key]: !prev[item.key],
                            }))
                          }
                          className={`h-6 w-12 rounded-full transition-all duration-300 ${(notifications as any)[item.key] ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                        >
                          <div className={`h-5 w-5 rounded-full bg-white transition-transform duration-300 ${(notifications as any)[item.key] ? "translate-x-6" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="appearance" className="m-0 space-y-6 p-5 md:p-6">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground dark:text-white">
                  <Palette size={22} className="text-primary dark:text-accent" />
                  {t("teacher_settings_appearance_title", "Appearance")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                  {t("teacher_settings_appearance_desc", "Thiết lập chủ đề và ngôn ngữ hiển thị phù hợp môi trường giảng dạy")}
                </p>
              </div>

              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t("teacher_settings_appearance_title", "Appearance")}</h3>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
                    <label className="mb-2 block text-sm font-semibold text-foreground dark:text-white">{t("teacher_settings_dark_mode", "Dark mode")}</label>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2.5 text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
                        {isDarkMode ? <Moon size={16} className="text-cyan-500" /> : <Sun size={16} className="text-amber-500" />}
                        <span>{t("teacher_settings_dark_mode", "Dark mode")}</span>
                      </div>
                      <button
                        onClick={() => {
                          const newDarkMode = !isDarkMode
                          setIsDarkMode(newDarkMode)
                          localStorage.setItem("darkMode", String(newDarkMode))
                        }}
                        className={`h-6 w-12 rounded-full transition-all duration-300 ${isDarkMode ? "bg-primary dark:bg-accent" : "bg-slate-400"}`}
                      >
                        <div className={`h-5 w-5 rounded-full bg-white transition-transform duration-300 ${isDarkMode ? "translate-x-6" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900/70">
                    <label className="mb-2 block text-sm font-semibold text-foreground dark:text-white">{t("teacher_settings_language", "Language")}</label>
                    <UniversalSelect
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      contentClassName="border-blue-500/30 bg-slate-950/92 text-slate-100 shadow-[0_20px_50px_rgba(2,6,23,0.75)] backdrop-blur-2xl"
                      portalled={true}
                    >
                      <option value="vi">{t("teacher_settings_lang_vi", "Tiếng Việt")}</option>
                      <option value="en">{t("teacher_settings_lang_en", "English")}</option>
                    </UniversalSelect>
                    <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{t("teacher_settings_language_desc", "Chọn ngôn ngữ hiển thị cho toàn bộ giao diện giảng viên")}</p>
                  </div>
                </div>
              </section>
            </TabsContent>
          </div>
        </Tabs>

        <div className="sticky bottom-4 z-30">
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_18px_42px_rgba(15,23,42,0.16)] backdrop-blur-xl md:p-4 dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-medium">
                <Clock size={16} className={cancelling ? "text-amber-500" : "text-emerald-500"} />
                <span className={cancelling ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}>
                  {cancelling ? t("teacher_settings_cancelling", "Đang hủy...") : t("teacher_settings_status_ready", "Hệ thống thanh toán đã sẵn sàng")}
                </span>
              </div>

              <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center md:gap-3">
                <button
                  type="button"
                  onClick={cancelSubscription}
                  disabled={cancelling || isFreePlan}
                  className="h-10 w-full rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 transition-all hover:bg-red-50 disabled:opacity-50 sm:w-auto dark:border-red-500/50 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  {t("teacher_settings_cancel_subscription", "Cancel Subscription")}
                </button>
                <button
                  onClick={() => router.push("/teacher/wallet-membership/checkout")}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all hover:shadow-[0_14px_34px_rgba(15,23,42,0.18)] sm:w-auto"
                >
                  <Sparkles size={16} />
                  {t("checkout_title", "Thanh toán gói")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
