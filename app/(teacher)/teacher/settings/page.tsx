"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, CreditCard, Globe, Moon, Palette, Sun } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"
import { getCurrentClientLanguage, localizeMessage } from "@/lib/i18n/message-localizer"

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
  const [isDarkMode, setIsDarkMode] = useState(true)
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

  const currentPlanId = subscriptionData?.subscription?.plan?.id
  const usage = subscriptionData?.usage || { coursesCreated: 0, courseLimit: 2, remainingCourses: 2 }
  const billingHistory = Array.isArray(subscriptionData?.billingHistory) ? subscriptionData.billingHistory : []

  const usagePercent = useMemo(() => {
    const limit = Number(usage.courseLimit || 0)
    if (!limit) return 0
    return Math.min(100, Math.round((Number(usage.coursesCreated || 0) / limit) * 100))
  }, [usage])

  const upgradePlan = async (planId: string) => {
    router.push(`/teacher/settings/billing/checkout?planId=${encodeURIComponent(planId)}`)
  }

  const cancelSubscription = async () => {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">{t("teacher_billing_title", "Thanh toán & Gói giảng viên")}</h1>
        <p className="text-muted-foreground">{t("teacher_billing_subtitle", "Quản lý tài khoản, gói và phương thức thanh toán của bạn")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2"><Bell size={20} /> {t("teacher_settings_notifications_title", "Notifications")}</h2>
          {[
            { key: "emailNotifications", label: t("teacher_settings_notif_email", "Thông báo email") },
            { key: "courseNotifications", label: t("teacher_settings_notif_course", "Thông báo khóa học") },
            { key: "studentNotifications", label: t("teacher_settings_notif_student", "Thông báo học viên") },
            { key: "billingNotifications", label: t("teacher_settings_notif_billing", "Thông báo thanh toán") },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-3">
              <p>{item.label}</p>
              <button
                onClick={() =>
                  setNotifications((prev: any) => ({
                    ...prev,
                    [item.key]: !prev[item.key],
                  }))
                }
                className={`w-12 h-6 rounded-full ${
                  (notifications as any)[item.key] ? "bg-primary" : "bg-slate-400"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    (notifications as any)[item.key] ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
          <p className="text-sm text-muted-foreground">{t("teacher_settings_notif_hint", "Thiết lập này lưu trên giao diện giảng viên hiện tại.")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2"><CreditCard size={20} /> {t("teacher_settings_current_plan", "Current Plan")}</h2>
          <p>
            {t("teacher_settings_current_plan_label", "Gói hiện tại")}: <strong>{subscriptionData?.subscription?.plan?.name || t("common_free", "Free")}</strong>
          </p>
          <p>
            {t("teacher_settings_course_limit", "Hạn mức khóa học")}: <strong>{usage.coursesCreated}</strong> / <strong>{usage.courseLimit}</strong>
          </p>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="text-sm text-muted-foreground">{t("teacher_settings_usage_remaining", "Usage: còn {n} khóa học có thể tạo.").replace("{n}", String(usage.remainingCourses))}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Palette size={20} /> {t("teacher_settings_appearance_title", "Appearance")}</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon size={20} className="text-primary dark:text-accent" />
              ) : (
                <Sun size={20} className="text-yellow-500" />
              )}
              <div>
                <p className="text-foreground dark:text-white font-semibold">{t("teacher_settings_dark_mode", "Dark mode")}</p>
                <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("teacher_settings_dark_mode_desc", "Bật/tắt chế độ tối cho giao diện giảng viên")}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsDarkMode(!isDarkMode)
                if (!isDarkMode) {
                  document.documentElement.classList.add("dark")
                } else {
                  document.documentElement.classList.remove("dark")
                }
              }}
              className={`w-12 h-6 rounded-full transition-all ${
                isDarkMode ? "bg-primary" : "bg-slate-400"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  isDarkMode ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-primary dark:text-accent" />
              <div>
                <p className="text-foreground dark:text-white font-semibold">{t("teacher_settings_language", "Language")}</p>
                <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("teacher_settings_language_desc", "Chọn ngôn ngữ hiển thị")}</p>
              </div>
            </div>
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="vi">{t("teacher_settings_lang_vi", "Tiếng Việt")}</option>
              <option value="en">{t("teacher_settings_lang_en", "English")}</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            {t("teacher_settings_appearance_hint", "Giao diện sẽ được áp dụng ngay cho toàn bộ trang giảng viên.")}
          </p>
        </div>
      </div>

      <div className="space-y-4">

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold">{t("teacher_settings_upgrade_plan", "Upgrade Plan")}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {plans.map((plan) => {
              const isCurrent = currentPlanId === plan.id
              return (
                <div key={plan.id} className="rounded-xl border border-border p-4 space-y-2">
                  <p className="font-semibold text-lg">{plan.name}</p>
                  <p>${Number(plan.price || 0)} / {plan.durationMonths} {t("teacher_settings_month", "month")}</p>
                  <p>{t("teacher_settings_courses_limit", "Courses limit")}: {plan.courseLimit}</p>
                  <p>{t("teacher_settings_storage", "Storage")}: {plan.storageLimitGb ?? t("teacher_settings_unlimited", "Unlimited")}GB</p>
                  <p>{t("teacher_settings_students", "Students")}: {plan.studentsLimit ?? t("teacher_settings_unlimited", "Unlimited")}</p>
                  <button
                    disabled={isCurrent}
                    onClick={() => upgradePlan(plan.id)}
                    className="mt-2 px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
                  >
                    {isCurrent ? t("teacher_settings_currently_using", "Đang sử dụng") : t("checkout_title", "Thanh toán gói")}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold">{t("teacher_settings_payment_method", "Payment Method")}</h3>
          <p>{t("teacher_settings_payment_hint", "Bạn có thể thêm thẻ, ví điện tử hoặc thanh toán bằng QR tại trang thanh toán gói.")}</p>
          <button
            onClick={() => router.push('/teacher/settings/billing/checkout')}
            className="px-4 py-2 rounded-lg bg-primary text-white"
          >
            {t("checkout_title", "Thanh toán gói")}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h3 className="text-lg font-semibold">{t("teacher_settings_billing_history", "Billing History")}</h3>
          {billingHistory.length === 0 ? (
            <p className="text-muted-foreground">{t("teacher_settings_no_billing", "Chưa có giao dịch nâng cấp.")}</p>
          ) : (
            <div className="space-y-2">
              {billingHistory.map((item: any) => (
                <div key={item.id} className="rounded-lg border border-border p-3 text-sm flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.transactionId}</p>
                    <p className="text-muted-foreground">{item.plan?.name || t("teacher_settings_unknown_plan", "Unknown plan")}</p>
                  </div>
                  <div className="text-right">
                    <p>${Number(item.amount || 0)}</p>
                    <p className="text-muted-foreground">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h3 className="text-lg font-semibold">{t("teacher_settings_cancel_subscription", "Cancel Subscription")}</h3>
          <button
            onClick={cancelSubscription}
            disabled={cancelling}
            className="px-4 py-2 rounded-lg bg-destructive text-white disabled:opacity-50"
          >
            {cancelling ? t("teacher_settings_cancelling", "Đang hủy...") : t("teacher_settings_cancel_subscription", "Cancel Subscription")}
          </button>
        </div>
      </div>
    </div>
  )
}
