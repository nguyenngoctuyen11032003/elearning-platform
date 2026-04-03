"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, CreditCard, Globe, Moon, Palette, Sun } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"
import { getCurrentClientLanguage, localizeMessage } from "@/lib/i18n/message-localizer"
import { UniversalSelect } from "@/components/ui/universal-select"

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
    router.push(`/teacher/settings/billing/checkout?planId=${encodeURIComponent(planId)}`)
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
    <div className="space-y-10 bg-white dark:bg-slate-950 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">{t("teacher_billing_title", "Thanh toán & Gói giảng viên")}</h1>
        <p className="text-muted-foreground dark:text-slate-400">{t("teacher_billing_subtitle", "Quản lý tài khoản, gói và phương thức thanh toán của bạn")}</p>
      </div>

      <section className="space-y-6">
        {/* Gói hiện tại */}
        <div 
          className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-7 shadow-md dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] mb-6"
          style={{
            backgroundImage: isDarkMode ? "url('/image/bgr_setting_teacher.jpg')" : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          {isDarkMode && <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/75 to-slate-800/80 rounded-2xl" />}
          <div className={`absolute right-4 top-4 rounded-full ${isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'} px-2.5 py-1 text-xs font-semibold`}>
            {t("teacher_settings_current_plan", "Current Plan")}
          </div>
          <h2 className={`relative z-10 flex items-center gap-2 text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
            <CreditCard size={18} className="text-emerald-300" />
            {t("teacher_settings_current_plan_label", "Gói hiện tại")}
          </h2>
          <p className={`relative z-10 mt-3 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{subscriptionData?.subscription?.plan?.name || t("common_free", "Free")}</p>
          <p className={`relative z-10 mt-4 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {t("teacher_settings_course_limit", "Hạn mức khóa học")}: <strong>{usage.coursesCreated}</strong> / <strong>{usage.courseLimit}</strong>
          </p>
          <div className="relative z-10 mt-3 h-4 overflow-hidden rounded-full bg-slate-700/80">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="relative z-10 mt-3 text-sm text-slate-300">
            {t("teacher_settings_usage_remaining", "Usage: còn {n} khóa học có thể tạo.").replace("{n}", String(usage.remainingCourses))}
          </p>
        </div>

        {/* Nâng cấp gói */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-7 shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("teacher_settings_upgrade_plan", "Upgrade Plan")}</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t("teacher_settings_tab_billing", "Billing & Subscription")}</span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan, idx, arr) => {
              const isCurrent = currentPlanId === plan.id;
              const isRecommended = recommendedPlanId === plan.id;
              const loweredName = String(plan.name || "").toLowerCase();
              // Custom plan name logic: $9 is Pro, $19 is Pro Plus
              let displayName = plan.name;
              let ctaText = `${t("teacher_settings_upgrade_to", "Upgrade to")} ${plan.name}`;
              if (Number(plan.price) === 9) {
                displayName = "Pro";
                ctaText = t("teacher_settings_start_pro", "Start Pro Plan");
              } else if (Number(plan.price) === 19) {
                displayName = "Pro Plus";
                ctaText = t("teacher_settings_start_pro_plus", "Start Pro Plus Plan");
              } else if (String(plan.name || "").toLowerCase().includes("basic")) {
                displayName = "Basic";
                ctaText = t("teacher_settings_upgrade_basic", "Upgrade to Basic");
              }

              // If this plan is not recommended, and there is another plan with the same price that IS recommended, skip rendering this one
              if (!isRecommended && arr.some((p) => p.id !== plan.id && Number(p.price) === Number(plan.price) && recommendedPlanId === p.id)) {
                return null;
              }

              return (
                <div
                  key={plan.id}
                  className={`group rounded-2xl ${isDarkMode ? 'bg-slate-800/85' : 'bg-slate-50'} p-7 transition-all duration-300 hover:-translate-y-0.5 ${isDarkMode ? 'hover:shadow-[0_12px_28px_rgba(0,0,0,0.35)]' : 'hover:shadow-lg'} ${
                    isRecommended
                      ? `scale-[1.03] ${isDarkMode ? 'border border-emerald-300/60 shadow-[0_14px_36px_rgba(16,185,129,0.22)]' : 'border-2 border-emerald-400 shadow-lg'}`
                      : `border ${isDarkMode ? 'border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]' : 'border-slate-200 shadow-md'}`
                  }`}
                >
                  <div className="mb-5 flex items-start justify-between gap-2">
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{displayName}</p>
                    {isRecommended && (
                      <span className={`rounded-full ${isDarkMode ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'} px-2.5 py-1 text-xs font-semibold`}>
                        {t("teacher_settings_popular", "Popular")}
                      </span>
                    )}
                  </div>
                  <p className={`text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    ${Number(plan.price || 0)}
                    <span className={`ml-1 text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>/ {plan.durationMonths} {t("teacher_settings_month", "month")}</span>
                  </p>
                  <div className={`mt-5 space-y-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <p>{t("teacher_settings_courses_limit", "Course limit")}: {plan.courseLimit}</p>
                    <p>{t("teacher_settings_storage", "Storage")}: {plan.storageLimitGb ?? t("teacher_settings_unlimited", "Unlimited")}GB</p>
                    <p>{t("teacher_settings_students", "Students")}: {plan.studentsLimit ?? t("teacher_settings_unlimited", "Unlimited")}</p>
                  </div>
                  <button
                    disabled={isCurrent}
                    onClick={() => upgradePlan(plan.id)}
                    className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 ${
                      isCurrent
                        ? `${isDarkMode ? 'bg-slate-600' : 'bg-slate-400'}`
                        : isRecommended
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:brightness-110"
                        : "bg-blue-600 hover:bg-blue-500"
                    }`}
                  >
                    {isCurrent ? t("teacher_settings_currently_using", "Đang sử dụng") : ctaText}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 p-7 shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t("teacher_settings_notifications_title", "Settings")}</h2>

        <div className={`rounded-xl ${isDarkMode ? 'bg-slate-800/55' : 'bg-slate-100'} px-5 py-4`}>
          <div className={`mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <Bell size={16} />
            {t("teacher_settings_notifications_title", "Notifications")}
          </div>
          <div className="space-y-3">
            {[
              { key: "emailNotifications", label: t("teacher_settings_notif_email", "Thông báo email") },
              { key: "courseNotifications", label: t("teacher_settings_notif_course", "Thông báo khóa học") },
              { key: "studentNotifications", label: t("teacher_settings_notif_student", "Thông báo học viên") },
              { key: "billingNotifications", label: t("teacher_settings_notif_billing", "Thông báo thanh toán") },
            ].map((item) => (
              <div key={item.key} className={`flex items-center justify-between border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'} pb-3 last:border-b-0 last:pb-0`}>
                <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.label}</p>
                <button
                  onClick={() =>
                    setNotifications((prev: any) => ({
                      ...prev,
                      [item.key]: !prev[item.key],
                    }))
                  }
                  className={`h-6 w-12 rounded-full transition-all duration-300 ${
                    (notifications as any)[item.key] ? "bg-emerald-500" : isDarkMode ? "bg-slate-500" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition-transform duration-300 ${
                      (notifications as any)[item.key] ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-xl ${isDarkMode ? 'bg-slate-800/55' : 'bg-slate-100'} px-5 py-4`}>
          <div className={`mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <Palette size={16} />
            {t("teacher_settings_appearance_title", "Appearance")}
          </div>
          <div className="space-y-3">
            <div className={`flex items-center justify-between border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'} pb-3`}>
              <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {isDarkMode ? <Moon size={16} className={isDarkMode ? "text-slate-300" : "text-slate-600"} /> : <Sun size={16} className="text-amber-300" />}
                <span>{t("teacher_settings_dark_mode", "Dark mode")}</span>
              </div>
              <button
                onClick={() => {
                  const newDarkMode = !isDarkMode
                  setIsDarkMode(newDarkMode)
                  // Save preference to localStorage
                  localStorage.setItem('darkMode', String(newDarkMode))
                }}
                className={`h-6 w-12 rounded-full transition-all duration-300 ${isDarkMode ? "bg-emerald-500" : "bg-slate-500"}`}
              >
                <div className={`h-5 w-5 rounded-full bg-white transition-transform duration-300 ${isDarkMode ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>

            <div className={`flex items-center justify-between pt-1`}>
              <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                <Globe size={16} className={isDarkMode ? "text-slate-300" : "text-slate-600"} />
                <span>{t("teacher_settings_language", "Language")}</span>
              </div>
              <UniversalSelect
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className={`rounded-lg border ${isDarkMode ? 'border-white/15 bg-slate-900 text-slate-100' : 'border-slate-300 bg-white text-slate-900'} px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50`}
              >
                <option value="vi">{t("teacher_settings_lang_vi", "Tiếng Việt")}</option>
                <option value="en">{t("teacher_settings_lang_en", "English")}</option>
              </UniversalSelect>
            </div>
          </div>
        </div>
      </section>

      <section className={`space-y-4 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'} p-7 shadow-md ${isDarkMode ? 'dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]' : ''}`}>
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t("teacher_settings_tab_billing", "Billing & Subscription")}</h2>

        <div className={`rounded-xl ${isDarkMode ? 'bg-slate-800/55' : 'bg-slate-100'} p-5`}>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t("teacher_settings_payment_method", "Payment Method")}</h3>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t("teacher_settings_payment_hint", "Bạn có thể thêm thẻ, ví điện tử hoặc thanh toán bằng QR tại trang thanh toán gói.")}</p>
          <button
            onClick={() => router.push('/teacher/settings/billing/checkout')}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98]"
          >
            {t("checkout_title", "Thanh toán gói")}
          </button>
        </div>

        <div className={`rounded-xl ${isDarkMode ? 'bg-slate-800/55' : 'bg-slate-100'} p-5`}>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t("teacher_settings_billing_history", "Billing History")}</h3>
          {billingHistory.length === 0 ? (
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t("teacher_settings_no_billing", "Chưa có giao dịch nâng cấp.")}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {billingHistory.map((item: any) => (
                <div key={item.id} className={`flex items-center justify-between rounded-lg border ${isDarkMode ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-slate-50'} p-3 text-sm`}>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{item.transactionId}</p>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{item.plan?.name || t("teacher_settings_unknown_plan", "Unknown plan")}</p>
                  </div>
                  <div className="text-right">
                    <p className={isDarkMode ? 'text-slate-100' : 'text-slate-800'}>${Number(item.amount || 0)}</p>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`rounded-xl border p-5 ${isDarkMode ? 'border-red-500/40 bg-red-500/5' : 'border-red-300 bg-red-50'}`}>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{t("teacher_settings_cancel_subscription", "Cancel Subscription")}</h3>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-200/80' : 'text-red-600/80'}`}>{t("teacher_settings_cancel_warning", "Hành động này sẽ hủy gói trả phí hiện tại và chuyển về Free plan.")}</p>
          <button
            onClick={cancelSubscription}
            disabled={cancelling || isFreePlan}
            className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 active:scale-[0.98] disabled:opacity-50"
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
  )
}
