"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, CreditCard, Lock, Save, Shield, UserCircle } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api/client"

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
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingSecurity, setSavingSecurity] = useState(false)
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)
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
      toast.error("Không thể tải cài đặt tài khoản")
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
      toast.success("Đã lưu thông tin hồ sơ")
    } catch {
      toast.error("Không thể lưu hồ sơ")
    } finally {
      setSavingProfile(false)
    }
  }

  const saveSecurity = async () => {
    if (!security.currentPassword || !security.newPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới")
      return
    }

    setSavingSecurity(true)
    try {
      await apiClient.changePassword(security)
      setSecurity({ currentPassword: "", newPassword: "" })
      toast.success("Đổi mật khẩu thành công")
    } catch (error: any) {
      toast.error(error?.message || "Không thể đổi mật khẩu")
    } finally {
      setSavingSecurity(false)
    }
  }

  const upgradePlan = async (planId: string) => {
    setUpgradingPlan(planId)
    try {
      await apiClient.upgradeTeacherPlan({ planId, paymentMethod: "manual" })
      toast.success("Nâng cấp gói thành công")
      await loadData()
    } catch (error: any) {
      toast.error(error?.message || "Không thể nâng cấp gói")
    } finally {
      setUpgradingPlan(null)
    }
  }

  const cancelSubscription = async () => {
    setCancelling(true)
    try {
      await apiClient.cancelTeacherSubscription("Cancelled by teacher")
      toast.success("Đã hủy gói trả phí và chuyển về gói Free")
      await loadData()
    } catch (error: any) {
      toast.error(error?.message || "Không thể hủy gói")
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
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Account Settings</h1>
        <p className="text-muted-foreground">Quản lý tài khoản và gói subscription giảng viên</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing & Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><UserCircle size={20} /> Profile</h2>
            <input
              className="w-full rounded-lg border border-border bg-background px-4 py-2"
              placeholder="Họ tên"
              value={profile.name}
              onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input className="w-full rounded-lg border border-border bg-muted px-4 py-2" value={profile.email} disabled />
            <input
              className="w-full rounded-lg border border-border bg-background px-4 py-2"
              placeholder="Số điện thoại"
              value={profile.phone}
              onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <textarea
              className="w-full rounded-lg border border-border bg-background px-4 py-2 min-h-24"
              placeholder="Giới thiệu"
              value={profile.bio}
              onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
            />
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="px-5 py-2 rounded-lg bg-primary text-white flex items-center gap-2 disabled:opacity-60"
            >
              <Save size={16} /> {savingProfile ? "Đang lưu..." : "Lưu hồ sơ"}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Shield size={20} /> Security</h2>
            <input
              type="password"
              className="w-full rounded-lg border border-border bg-background px-4 py-2"
              placeholder="Mật khẩu hiện tại"
              value={security.currentPassword}
              onChange={(e) => setSecurity((prev) => ({ ...prev, currentPassword: e.target.value }))}
            />
            <input
              type="password"
              className="w-full rounded-lg border border-border bg-background px-4 py-2"
              placeholder="Mật khẩu mới"
              value={security.newPassword}
              onChange={(e) => setSecurity((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
            <button
              onClick={saveSecurity}
              disabled={savingSecurity}
              className="px-5 py-2 rounded-lg bg-primary text-white flex items-center gap-2 disabled:opacity-60"
            >
              <Lock size={16} /> {savingSecurity ? "Đang cập nhật..." : "Đổi mật khẩu"}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Bell size={20} /> Notifications</h2>
            {[
              { key: "emailNotifications", label: "Thông báo email" },
              { key: "courseNotifications", label: "Thông báo khóa học" },
              { key: "studentNotifications", label: "Thông báo học viên" },
              { key: "billingNotifications", label: "Thông báo thanh toán" },
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
            <p className="text-sm text-muted-foreground">Thiết lập này lưu trên giao diện giảng viên hiện tại.</p>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-4 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <h2 className="text-xl font-semibold flex items-center gap-2"><CreditCard size={20} /> Current Plan</h2>
            <p>
              Gói hiện tại: <strong>{subscriptionData?.subscription?.plan?.name || "Free"}</strong>
            </p>
            <p>
              Hạn mức khóa học: <strong>{usage.coursesCreated}</strong> / <strong>{usage.courseLimit}</strong>
            </p>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${usagePercent}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">Usage: còn {usage.remainingCourses} khóa học có thể tạo.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Upgrade Plan</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const isCurrent = currentPlanId === plan.id
                return (
                  <div key={plan.id} className="rounded-xl border border-border p-4 space-y-2">
                    <p className="font-semibold text-lg">{plan.name}</p>
                    <p>${Number(plan.price || 0)} / {plan.durationMonths} month</p>
                    <p>Courses limit: {plan.courseLimit}</p>
                    <p>Storage: {plan.storageLimitGb ?? "Unlimited"}GB</p>
                    <p>Students: {plan.studentsLimit ?? "Unlimited"}</p>
                    <button
                      disabled={isCurrent || upgradingPlan === plan.id}
                      onClick={() => upgradePlan(plan.id)}
                      className="mt-2 px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
                    >
                      {isCurrent ? "Đang sử dụng" : upgradingPlan === plan.id ? "Đang xử lý..." : "Upgrade Plan"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Payment Method</h3>
            <p>Phương thức hiện tại: Manual (demo). Có thể nối VNPay/Momo trong bước tiếp theo.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <h3 className="text-lg font-semibold">Billing History</h3>
            {billingHistory.length === 0 ? (
              <p className="text-muted-foreground">Chưa có giao dịch nâng cấp.</p>
            ) : (
              <div className="space-y-2">
                {billingHistory.map((item: any) => (
                  <div key={item.id} className="rounded-lg border border-border p-3 text-sm flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.transactionId}</p>
                      <p className="text-muted-foreground">{item.plan?.name || "Unknown plan"}</p>
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
            <h3 className="text-lg font-semibold">Cancel Subscription</h3>
            <button
              onClick={cancelSubscription}
              disabled={cancelling}
              className="px-4 py-2 rounded-lg bg-red-500 text-white disabled:opacity-60"
            >
              {cancelling ? "Đang hủy..." : "Cancel Subscription"}
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
