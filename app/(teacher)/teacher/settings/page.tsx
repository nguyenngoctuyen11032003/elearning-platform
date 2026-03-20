"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, CreditCard, Lock, Save, Shield, UserCircle } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api/client"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"

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
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingSecurity, setSavingSecurity] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const [profile, setProfile] = useState({ name: "", email: "", phone: "", bio: "" })
  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "" })
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
      const [me, publicPlans, mySub] = await Promise.all([
        apiClient.getProfile(),
        apiClient.getInstructorPlans(),
        apiClient.getTeacherSubscription(),
      ])

      setProfile({
        name: me?.name || "",
        email: me?.email || "",
        phone: me?.phone || "",
        bio: me?.bio || "",
      })
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

  const currentPlanId = subscriptionData?.subscription?.plan?.id
  const usage = subscriptionData?.usage || { coursesCreated: 0, courseLimit: 2, remainingCourses: 2 }
  const billingHistory = Array.isArray(subscriptionData?.billingHistory) ? subscriptionData.billingHistory : []

  const usagePercent = useMemo(() => {
    const limit = Number(usage.courseLimit || 0)
    if (!limit) return 0
    return Math.min(100, Math.round((Number(usage.coursesCreated || 0) / limit) * 100))
  }, [usage])

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      await apiClient.updateProfile({
        name: profile.name,
        phone: profile.phone,
        bio: profile.bio,
      })
      toast.success(t("teacher_settings_saved_profile", "Đã lưu thông tin hồ sơ"))
    } catch {
      toast.error(t("teacher_settings_save_profile_failed", "Không thể lưu hồ sơ"))
    } finally {
      setSavingProfile(false)
    }
  }

  const saveSecurity = async () => {
    if (!security.currentPassword || !security.newPassword) {
      toast.error(t("teacher_settings_password_required", "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới"))
      return
    }

    setSavingSecurity(true)
    try {
      await apiClient.changePassword(security)
      setSecurity({ currentPassword: "", newPassword: "" })
      toast.success(t("teacher_settings_password_changed", "Đổi mật khẩu thành công"))
    } catch (error: any) {
      toast.error(error?.message || t("teacher_settings_password_change_failed", "Không thể đổi mật khẩu"))
    } finally {
      setSavingSecurity(false)
    }
  }

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
      toast.error(error?.message || t("teacher_settings_cancel_failed", "Không thể hủy gói"))
    } finally {
      setCancelling(false)
    }
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

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="profile">{t("teacher_settings_tab_profile", "Profile")}</TabsTrigger>
          <TabsTrigger value="security">{t("teacher_settings_tab_security", "Security")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("teacher_settings_tab_notifications", "Notifications")}</TabsTrigger>
          <TabsTrigger value="billing">{t("teacher_settings_tab_billing", "Billing & Subscription")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><UserCircle size={20} /> {t("teacher_settings_profile_title", "Profile")}</h2>
            <input
              className="w-full rounded-lg border border-border bg-background px-4 py-2"
              placeholder={t("teacher_settings_name_placeholder", "Họ tên")}
              value={profile.name}
              onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input className="w-full rounded-lg border border-border bg-muted px-4 py-2" value={profile.email} disabled />
            <input
              className="w-full rounded-lg border border-border bg-background px-4 py-2"
              placeholder={t("teacher_settings_phone_placeholder", "Số điện thoại")}
              value={profile.phone}
              onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <textarea
              className="w-full rounded-lg border border-border bg-background px-4 py-2 min-h-24"
              placeholder={t("teacher_settings_bio_placeholder", "Giới thiệu")}
              value={profile.bio}
              onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
            />
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="px-5 py-2 rounded-lg bg-primary text-white flex items-center gap-2 disabled:opacity-60"
            >
              <Save size={16} /> {savingProfile ? t("common_saving", "Đang lưu...") : t("teacher_settings_save_profile", "Lưu hồ sơ")}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Shield size={20} /> {t("teacher_settings_security_title", "Security")}</h2>
            <input
              type="password"
              className="w-full rounded-lg border border-border bg-background px-4 py-2"
              placeholder={t("teacher_settings_current_password", "Mật khẩu hiện tại")}
              value={security.currentPassword}
              onChange={(e) => setSecurity((prev) => ({ ...prev, currentPassword: e.target.value }))}
            />
            <input
              type="password"
              className="w-full rounded-lg border border-border bg-background px-4 py-2"
              placeholder={t("teacher_settings_new_password", "Mật khẩu mới")}
              value={security.newPassword}
              onChange={(e) => setSecurity((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
            <button
              onClick={saveSecurity}
              disabled={savingSecurity}
              className="px-5 py-2 rounded-lg bg-primary text-white flex items-center gap-2 disabled:opacity-60"
            >
              <Lock size={16} /> {savingSecurity ? t("teacher_settings_updating", "Đang cập nhật...") : t("teacher_settings_change_password", "Đổi mật khẩu")}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
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
        </TabsContent>

        <TabsContent value="billing" className="mt-4 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <h2 className="text-xl font-semibold flex items-center gap-2"><CreditCard size={20} /> {t("teacher_settings_current_plan", "Current Plan")}</h2>
            <p>
              {t("teacher_settings_current_plan_label", "Gói hiện tại")}: <strong>{subscriptionData?.subscription?.plan?.name || "Free"}</strong>
            </p>
            <p>
              {t("teacher_settings_course_limit", "Hạn mức khóa học")}: <strong>{usage.coursesCreated}</strong> / <strong>{usage.courseLimit}</strong>
            </p>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${usagePercent}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">{t("teacher_settings_usage_remaining", "Usage: còn {n} khóa học có thể tạo.").replace("{n}", String(usage.remainingCourses))}</p>
          </div>

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
              className="px-4 py-2 rounded-lg bg-red-500 text-white disabled:opacity-60"
            >
              {cancelling ? t("teacher_settings_cancelling", "Đang hủy...") : t("teacher_settings_cancel_subscription", "Cancel Subscription")}
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
