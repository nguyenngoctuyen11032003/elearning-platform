"use client"

import React, { useEffect, useMemo, useState } from "react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { ConfirmDialog } from "@/components/ui/admin-modals"
import { DialogSelect } from "@/components/ui/dialog-select"
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  Plus,
  SquarePen,
  Search,
  Save,
  ShieldCheck,
  Trash2,
  Wallet,
  X,
} from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { formatNumber, formatCurrency } from "@/lib/format"
import { useMetricChangeHighlight } from "@/hooks/use-metric-change-highlight"
import { MetricTrendBadge } from "@/components/ui/metric-trend-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const emptyPlan = {
  name: "",
  price: 9,
  durationMonths: 1,
  courseLimit: 20,
  storageLimitGb: 10,
  studentsLimit: 120,
}

const SUBSCRIPTIONS_REALTIME_MS = 45000

export default function AdminTeacherSubscriptionPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<any[]>([])
  const [planSavedSignatures, setPlanSavedSignatures] = useState<Record<string, string>>({})
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [dashboard, setDashboard] = useState<any>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [creating, setCreating] = useState(false)
  const [newPlan, setNewPlan] = useState<any>(emptyPlan)
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [paymentSortBy, setPaymentSortBy] = useState<"newest" | "oldest" | "amount_desc" | "amount_asc">("newest")
  const [accessOnlyActive, setAccessOnlyActive] = useState(false)
  const [accessOnlyPaidPlan, setAccessOnlyPaidPlan] = useState(false)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false)
  const [showEditAccessModal, setShowEditAccessModal] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<any | null>(null)
  const [updatingSubscriptionId, setUpdatingSubscriptionId] = useState<string | null>(null)
  const [removingSubscriptionId, setRemovingSubscriptionId] = useState<string | null>(null)
  const [accessEditForm, setAccessEditForm] = useState<{
    status: "active" | "pending" | "cancelled" | "expired"
    endDate: string
  }>({
    status: "active",
    endDate: "",
  })
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null)
  const [deletePlanDialog, setDeletePlanDialog] = useState<{ isOpen: boolean; planId?: string; planName?: string }>({
    isOpen: false,
  })
  const [removeAccessDialog, setRemoveAccessDialog] = useState<{
    isOpen: boolean
    subscriptionId?: string
    teacherName?: string
  }>({
    isOpen: false,
  })

  const getPlanSignature = (plan: any) =>
    JSON.stringify({
      name: String(plan?.name || "").trim(),
      price: Number(plan?.price || 0),
      durationMonths: Number(plan?.durationMonths || 0),
      courseLimit: Number(plan?.courseLimit || 0),
      storageLimitGb: Number(plan?.storageLimitGb || 0),
      studentsLimit: Number(plan?.studentsLimit || 0),
    })

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [planRes, subRes, payRes, dashRes] = await Promise.all([
        apiClient.getAdminInstructorPlans(),
        apiClient.getAdminInstructorSubscriptions(),
        apiClient.getAdminInstructorPayments(),
        apiClient.getAdminRevenueDashboard(),
      ])

      const normalizedPlans = Array.isArray(planRes)
        ? planRes.map((plan) => ({
            ...plan,
            features: Array.isArray(plan?.features)
              ? plan.features.map((item: any) => String(item)).join("\n")
              : String(plan?.features || ""),
          }))
        : []

      setPlans(normalizedPlans)
      setPlanSavedSignatures(
        Object.fromEntries(normalizedPlans.map((plan: any) => [String(plan.id), getPlanSignature(plan)])),
      )
      setSubscriptions(Array.isArray(subRes) ? subRes : [])
      setPayments(Array.isArray(payRes) ? payRes : [])
      setDashboard(dashRes || null)
      setLastSyncedAt(new Date())
    } catch (error) {
      toast.error(t("adm_sub_load_fail", "Không thể tải dữ liệu quản lý gói"))
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    const timer = setInterval(() => {
      void loadAll(true)
    }, SUBSCRIPTIONS_REALTIME_MS)
    return () => clearInterval(timer)
  }, [])

  const createPlan = async () => {
    // Validation
    if (!newPlan.name || !newPlan.name.trim()) {
      toast.error(t("adm_sub_plan_name_required", "Vui lòng nhập tên gói"))
      return
    }
    if (!newPlan.price || Number(newPlan.price) <= 0) {
      toast.error(t("adm_sub_price_required", "Vui lòng nhập giá gói hợp lệ"))
      return
    }
    if (!newPlan.durationMonths || Number(newPlan.durationMonths) <= 0) {
      toast.error(t("adm_sub_duration_required", "Vui lòng nhập thời hạn hợp lệ"))
      return
    }
    if (!newPlan.courseLimit || Number(newPlan.courseLimit) <= 0) {
      toast.error(t("adm_sub_course_limit_required", "Vui lòng nhập giới hạn khóa học hợp lệ"))
      return
    }
    if (!newPlan.storageLimitGb || Number(newPlan.storageLimitGb) <= 0) {
      toast.error(t("adm_sub_storage_required", "Vui lòng nhập dung lượng lưu trữ hợp lệ"))
      return
    }
    if (!newPlan.studentsLimit || Number(newPlan.studentsLimit) <= 0) {
      toast.error(t("adm_sub_student_limit_required", "Vui lòng nhập giới hạn học viên hợp lệ"))
      return
    }

    setCreating(true)
    try {
      await apiClient.createAdminInstructorPlan({
        ...newPlan,
        features: String(newPlan.features || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      })
      toast.success(t("adm_sub_create_ok", "Đã tạo gói mới"))
      setNewPlan(emptyPlan)
      setShowCreatePlanModal(false)
      await loadAll()
    } catch (error: any) {
      toast.error(error?.message || t("adm_sub_create_fail", "Không thể tạo gói"))
    } finally {
      setCreating(false)
    }
  }

  const updatePlan = async (id: string, patch: Record<string, any>) => {
    try {
      await apiClient.updateAdminInstructorPlan(id, patch)
      toast.success(t("adm_sub_update_ok", "Đã cập nhật gói"))
      await loadAll()
    } catch (error: any) {
      toast.error(error?.message || t("adm_sub_update_fail", "Không thể cập nhật gói"))
    }
  }

  const deletePlan = async (id: string) => {
    setDeletingPlanId(id)
    try {
      const result = await apiClient.deleteAdminInstructorPlan(id)
      const message = result?.message || t("adm_sub_delete_ok", "Đã xử lý xóa gói")
      toast.success(message)
      setPlans((prev) => prev.filter((plan) => String(plan.id) !== String(id)))
      await loadAll()
    } catch (error: any) {
      toast.error(error?.message || t("adm_sub_delete_fail", "Không thể xóa gói"))
    } finally {
      setDeletingPlanId(null)
    }
  }

  const requestDeletePlan = (plan: any) => {
    setDeletePlanDialog({
      isOpen: true,
      planId: String(plan?.id || ""),
      planName: String(plan?.name || ""),
    })
  }

  const confirmPayment = async (id: string) => {
    try {
      await apiClient.confirmAdminInstructorPayment(id)
      toast.success(t("adm_sub_confirm_ok", "Đã xác nhận thanh toán"))
      await loadAll()
    } catch {
      toast.error(t("adm_sub_confirm_fail", "Không thể xác nhận thanh toán"))
    }
  }

  const refundPayment = async (id: string) => {
    try {
      await apiClient.refundAdminInstructorPayment(id)
      toast.success(t("adm_sub_refund_ok", "Đã refund giao dịch"))
      await loadAll()
    } catch {
      toast.error(t("adm_sub_refund_fail", "Không thể refund"))
    }
  }

  const exportPayments = () => {
    const aoa = [
      [
        t("adm_sub_export_header_id", "ID giao dịch"),
        t("adm_sub_export_header_user", "Người dùng"),
        t("adm_sub_export_header_plan", "Gói"),
        t("adm_sub_export_header_amount", "Số tiền"),
        t("adm_sub_export_header_status", "Trạng thái"),
        t("adm_sub_export_header_date", "Ngày"),
      ],
      ...payments.map((p) => [
        p.transactionId,
        p.teacher?.email || p.teacher?.name || "",
        p.plan?.name || "",
        Number(p.amount || 0),
        p.status,
        p.createdAt,
      ]),
    ]

    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, t("pay_export_sheet_name", "Thanh toán"))
    XLSX.writeFile(wb, `admin_subscription_payments_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const defaultShowcaseMetrics = {
    totalRevenue: 58,
    monthlyRevenue: 58,
    paidUsers: 1,
    conversionRate: 33.3,
  }

  const paidPayments = useMemo(() => payments.filter((p) => p.status === "paid"), [payments])
  const pendingPayments = useMemo(() => payments.filter((p) => p.status === "pending"), [payments])

  const displayTotalRevenue = dashboard?.totalRevenue ?? defaultShowcaseMetrics.totalRevenue
  const displayMonthlyRevenue = dashboard?.monthlyRevenue ?? defaultShowcaseMetrics.monthlyRevenue
  const displayPaidUsers = dashboard?.paidUsers ?? defaultShowcaseMetrics.paidUsers
  const displayConversionRate = dashboard?.conversionRate ?? defaultShowcaseMetrics.conversionRate

  const metrics = useMemo(() => {
    const totalRevenue = displayTotalRevenue || 0
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const successCount = paidPayments.length
    const totalTransactions = payments.length
    const latestTransactionId = payments[0]?.transactionId || "---"

    return {
      totalRevenue,
      pendingAmount,
      successCount,
      totalTransactions,
      latestTransactionId,
    }
  }, [dashboard?.totalRevenue, paidPayments, payments, pendingPayments])

  const activeSubscriptionUsageByPlanId = useMemo(() => {
    return subscriptions.reduce<Record<string, number>>((acc, sub) => {
      const planId = String(sub?.plan?.id || sub?.planId || "")
      const status = String(sub?.status || "").toLowerCase()
      if (!planId || status !== "active") return acc
      acc[planId] = (acc[planId] || 0) + 1
      return acc
    }, {})
  }, [subscriptions])

  const subscriptionOverviewMetrics = {
    totalRevenue: Number(displayTotalRevenue || 0),
    monthlyRevenue: Number(displayMonthlyRevenue || 0),
    paidUsers: Number(displayPaidUsers || 0),
    conversionRate: Number(displayConversionRate || 0),
    pendingAmount: Number(metrics.pendingAmount || 0),
    successCount: Number(metrics.successCount || 0),
  }

  const { isChanged: isOverviewChanged, getTrend: getOverviewTrend } = useMetricChangeHighlight(subscriptionOverviewMetrics, {
    flashDurationMs: 1300,
  })

  const hasPlanDraftChanges = (plan: any) =>
    (planSavedSignatures[String(plan?.id)] || "") !== getPlanSignature(plan)

  const dirtyPlanCount = useMemo(
    () => plans.filter((plan) => hasPlanDraftChanges(plan)).length,
    [plans, planSavedSignatures],
  )

  const filteredPayments = useMemo(() => {
    const query = paymentSearchQuery.trim().toLowerCase()

    const list = payments.filter((payment) => {
      const statusKey = String(payment?.status || "").toLowerCase()
      if (paymentStatusFilter !== "all" && statusKey !== paymentStatusFilter) return false

      if (!query) return true
      const teacherText = `${payment?.teacher?.email || ""} ${payment?.teacher?.name || ""}`.toLowerCase()
      const planName = String(payment?.plan?.name || "").toLowerCase()
      const txId = String(payment?.transactionId || "").toLowerCase()

      return txId.includes(query) || teacherText.includes(query) || planName.includes(query)
    })

    list.sort((a, b) => {
      const aAmount = Number(a?.amount || 0)
      const bAmount = Number(b?.amount || 0)
      const aTime = new Date(a?.createdAt || 0).getTime()
      const bTime = new Date(b?.createdAt || 0).getTime()

      switch (paymentSortBy) {
        case "oldest":
          return aTime - bTime
        case "amount_desc":
          return bAmount - aAmount
        case "amount_asc":
          return aAmount - bAmount
        case "newest":
        default:
          return bTime - aTime
      }
    })

    return list
  }, [payments, paymentSearchQuery, paymentStatusFilter, paymentSortBy])

  const filteredAccessSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => {
      const status = String(subscription?.status || "").toLowerCase()
      const planPrice = Number(subscription?.plan?.price || 0)

      if (accessOnlyActive && status !== "active") return false
      if (accessOnlyPaidPlan && planPrice <= 0) return false
      return true
    })
  }, [subscriptions, accessOnlyActive, accessOnlyPaidPlan])

  const getPaymentStatusMeta = (status: string) => {
    const key = String(status || "").toLowerCase()
    if (key === "paid") {
      return {
        label: t("adm_sub_paid", "Đã thanh toán"),
        className: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/60",
      }
    }
    if (key === "pending") {
      return {
        label: t("adm_sub_pending", "Đang chờ xử lý"),
        className: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/60",
      }
    }
    if (key === "refunded") {
      return {
        label: t("adm_sub_refunded", "Đã hoàn tiền"),
        className: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700/60",
      }
    }

    return {
      label: status,
      className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/70 dark:text-slate-200 dark:border-slate-700",
    }
  }

  const handleConfirmPaymentAction = async (id: string) => {
    const ok = window.confirm(t("adm_sub_confirm_dialog", "Xác nhận đánh dấu giao dịch này là đã thanh toán?"))
    if (!ok) return
    await confirmPayment(id)
  }

  const handleRefundPaymentAction = async (id: string) => {
    const ok = window.confirm(t("adm_sub_refund_dialog", "Bạn có chắc muốn hoàn tiền cho giao dịch này?"))
    if (!ok) return
    await refundPayment(id)
  }

  const toDateInputValue = (value: unknown) => {
    const date = new Date(String(value || ""))
    if (Number.isNaN(date.getTime())) return ""
    return date.toISOString().split("T")[0]
  }

  const openAccessEditor = (subscription: any) => {
    setEditingSubscription(subscription)
    setAccessEditForm({
      status: (String(subscription?.status || "active").toLowerCase() as "active" | "pending" | "cancelled" | "expired"),
      endDate: toDateInputValue(subscription?.endDate),
    })
    setShowEditAccessModal(true)
  }

  const closeAccessEditor = () => {
    setShowEditAccessModal(false)
    setEditingSubscription(null)
    setAccessEditForm({
      status: "active",
      endDate: "",
    })
  }

  const updateAccess = async () => {
    if (!editingSubscription?.id) return
    if (!accessEditForm.endDate) {
      toast.error(t("adm_sub_end_date_required", "Vui lòng chọn ngày hết hạn"))
      return
    }

    setUpdatingSubscriptionId(String(editingSubscription.id))
    try {
      await apiClient.updateAdminInstructorSubscription(String(editingSubscription.id), {
        status: accessEditForm.status,
        endDate: accessEditForm.endDate,
      })
      toast.success(t("adm_sub_access_update_ok", "Đã cập nhật quyền truy cập giảng viên"))
      closeAccessEditor()
      await loadAll(true)
    } catch (error: any) {
      toast.error(error?.message || t("adm_sub_access_update_fail", "Không thể cập nhật quyền truy cập"))
    } finally {
      setUpdatingSubscriptionId(null)
    }
  }

  const removeInstructorAccess = async (subscriptionId: string) => {
    const subId = String(subscriptionId || "")
    if (!subId) return

    setRemovingSubscriptionId(subId)
    try {
      await apiClient.deleteAdminInstructorSubscription(subId)
      toast.success(t("adm_sub_remove_access_ok", "Đã xóa gói đang dùng và chuyển giảng viên về Free"))
      await loadAll(true)
    } catch (error: any) {
      toast.error(error?.message || t("adm_sub_remove_access_fail", "Không thể xóa gói giảng viên"))
    } finally {
      setRemovingSubscriptionId(null)
    }
  }

  const requestRemoveInstructorAccess = (subscription: any) => {
    const subscriptionId = String(subscription?.id || "")
    if (!subscriptionId) return

    const teacherName = String(subscription?.teacher?.name || subscription?.teacher?.email || "giảng viên")
    setRemoveAccessDialog({
      isOpen: true,
      subscriptionId,
      teacherName,
    })
  }

  const getQuotaMeta = (usedRaw: unknown, limitRaw: unknown) => {
    const used = Number(usedRaw || 0)
    const limit = Number(limitRaw || 0)

    if (limit <= 0) {
      return {
        used,
        limit,
        percent: 0,
        toneClass: "text-slate-600 dark:text-slate-300",
        barClass: "bg-slate-400",
        stateLabel: t("adm_sub_quota_unset", "Chưa đặt giới hạn"),
        warningLevel: "none" as const,
      }
    }

    const percent = Math.max(0, Math.min(100, (used / limit) * 100))

    if (percent >= 100) {
      return {
        used,
        limit,
        percent,
        toneClass: "text-red-600 dark:text-red-300",
        barClass: "bg-red-500",
        stateLabel: t("adm_sub_quota_reached", "Đã chạm giới hạn"),
        warningLevel: "danger" as const,
      }
    }

    if (percent >= 80) {
      return {
        used,
        limit,
        percent,
        toneClass: "text-amber-600 dark:text-amber-300",
        barClass: "bg-amber-500",
        stateLabel: t("adm_sub_quota_near", "Sắp chạm giới hạn"),
        warningLevel: "warning" as const,
      }
    }

    return {
      used,
      limit,
      percent,
      toneClass: "text-emerald-600 dark:text-emerald-300",
      barClass: "bg-emerald-500",
      stateLabel: t("adm_sub_quota_safe", "Trong ngưỡng an toàn"),
      warningLevel: "ok" as const,
    }
  }

  const getExpiryMeta = (endDateRaw: unknown) => {
    const date = new Date(String(endDateRaw || ""))
    if (Number.isNaN(date.getTime())) {
      return {
        label: t("adm_sub_expiry_unknown", "Chưa có ngày hết hạn"),
        className: "bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200",
        displayDate: "--",
      }
    }

    const now = new Date()
    const daysLeft = Math.ceil((date.getTime() - now.getTime()) / 86400000)

    if (daysLeft < 0) {
      return {
        label: t("adm_sub_expired", "Đã hết hạn"),
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200",
        displayDate: date.toLocaleDateString("vi-VN"),
      }
    }

    if (daysLeft <= 7) {
      return {
        label: `${t("adm_sub_expiry_soon", "Sắp hết hạn")} (${daysLeft}d)`,
        className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200",
        displayDate: date.toLocaleDateString("vi-VN"),
      }
    }

    if (daysLeft <= 30) {
      return {
        label: `${t("adm_sub_expiry_month", "Hết hạn trong tháng")} (${daysLeft}d)`,
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
        displayDate: date.toLocaleDateString("vi-VN"),
      }
    }

    return {
      label: t("adm_sub_active", "Còn hiệu lực"),
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
      displayDate: date.toLocaleDateString("vi-VN"),
    }
  }

  const getAccessStatusMeta = (statusRaw: unknown) => {
    const status = String(statusRaw || "").toLowerCase()

    if (status === "active") {
      return {
        label: t("adm_sub_active", "Đang hoạt động"),
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
      }
    }

    if (status === "expired") {
      return {
        label: t("adm_sub_expired", "Đã hết hạn"),
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200",
      }
    }

    if (status === "cancelled" || status === "canceled") {
      return {
        label: t("adm_sub_cancelled", "Đã hủy"),
        className: "bg-slate-200 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200",
      }
    }

    return {
      label: String(statusRaw || t("adm_sub_unknown", "Không xác định")),
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200",
    }
  }

  if (loading) {
    return <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <section
        className="relative overflow-hidden rounded-3xl p-8 lg:p-10 animate-fadeIn border border-white/40 dark:border-slate-800/70 shadow-[0_20px_60px_rgba(15,23,42,0.18)] bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl"
        style={{
          backgroundImage: "url('/image/bg_qli_gv%20(2).png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/45 via-primary/25 to-accent/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/80" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3 animate-slideDown" style={{ animationDelay: "0.1s" }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full bg-white/80 text-primary shadow-sm backdrop-blur">
                {t("adm_sub_plan_management", "Quản lý gói")}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">{t("adm_sub_title", "Quản lý gói & truy cập giảng viên")}</h1>
                <p className="text-base text-white/85 max-w-2xl drop-shadow">{t("adm_sub_desc", "Theo dõi giao dịch, doanh thu và quyền truy cập giảng viên trong một bảng điều khiển duy nhất.")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-white/90 text-primary text-sm font-semibold shadow-sm backdrop-blur">
                  {t("adm_sub_total_tx", "Tổng giao dịch")}: <AnimatedNumber value={metrics.totalTransactions} formatter={formatNumber} />
                </span>
                <span className="px-3 py-1 rounded-full bg-black/15 text-white text-sm font-medium backdrop-blur">
                  {t("adm_sub_live_sync", "Đồng bộ gần nhất")}
                  {lastSyncedAt ? ` • ${lastSyncedAt.toLocaleTimeString("vi-VN")}` : ""}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center gap-3 animate-slideDown" style={{ animationDelay: "0.2s" }}>
              <button
                onClick={exportPayments}
                className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-white/90 text-primary text-sm font-semibold shadow-lg hover:shadow-xl transition-smooth backdrop-blur"
              >
                <FileText size={16} /> {t("adm_sub_export", "Xuất báo cáo")}
              </button>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200 text-xs font-semibold">
                  {t("adm_sub_tx_success", "Giao dịch thành công")}: <AnimatedNumber value={metrics.successCount} formatter={formatNumber} />
                </span>
                <span className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs font-semibold">
                  {t("adm_sub_pending", "Đang chờ xử lý")}: <AnimatedNumber value={metrics.pendingAmount} formatter={formatCurrency} />
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 text-xs font-semibold">
                  {t("adm_sub_paid_users", "Người dùng trả phí")}: <AnimatedNumber value={displayPaidUsers} formatter={formatNumber} />
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/35 dark:border-slate-800/60 bg-white/20 dark:bg-white/5 backdrop-blur-xl p-4 md:p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  key: "totalRevenue",
                  label: t("adm_sub_total_revenue", "Tổng doanh thu"),
                  value: displayTotalRevenue,
                  formatter: (val: number) => `₫${formatNumber(val)}`,
                  tone: "from-green-200/40 to-emerald-100/30",
                  icon: Wallet,
                },
                {
                  key: "monthlyRevenue",
                  label: t("adm_sub_monthly_revenue", "Doanh thu tháng"),
                  value: displayMonthlyRevenue,
                  formatter: (val: number) => `₫${formatNumber(val)}`,
                  tone: "from-blue-200/45 to-indigo-100/35",
                  icon: BarChart3,
                },
                {
                  key: "paidUsers",
                  label: t("adm_sub_paid_users", "Người dùng trả phí"),
                  value: displayPaidUsers,
                  formatter: formatNumber,
                  tone: "from-purple-200/40 to-pink-100/35",
                  icon: CheckCircle2,
                },
                {
                  key: "conversionRate",
                  label: t("adm_sub_conversion", "Tỉ lệ chuyển đổi"),
                  value: displayConversionRate,
                  formatter: (val: number) => `${Number(val).toFixed(1)}%`,
                  tone: "from-amber-200/45 to-yellow-100/35",
                  icon: ArrowRight,
                },
              ].map(({ key, label, value, formatter, tone, icon: Icon }) => (
                <div
                  key={label}
                  className={`group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border p-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-700 ${isOverviewChanged(key) ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/60 dark:border-slate-800"}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tone} opacity-70 group-hover:opacity-90 transition-opacity duration-300`} />
                  <div className="relative flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        <AnimatedNumber value={value} formatter={formatter} disableAnimation={!isOverviewChanged(key)} />
                      </p>
                      <MetricTrendBadge trend={getOverviewTrend(key)} />
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700 flex items-center justify-center shadow-inner">
                      <Icon size={20} className="text-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Tabs defaultValue="plans" className="w-full">
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
          <div className="border-b border-slate-200 dark:border-slate-800 p-3 md:p-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-1">
              <TabsTrigger value="plans" className="h-10 text-xs md:text-sm rounded-lg font-semibold data-[state=active]:bg-primary/90 data-[state=active]:text-white dark:data-[state=active]:bg-accent transition-all">
                {t("adm_sub_plan_management", "Quản lý gói")}
              </TabsTrigger>
              <TabsTrigger value="access" className="h-10 text-xs md:text-sm rounded-lg font-semibold data-[state=active]:bg-primary/90 data-[state=active]:text-white dark:data-[state=active]:bg-accent transition-all">
                {t("adm_sub_instructor_access", "Quyền truy cập")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="plans" className="m-0 p-4 sm:p-5 md:p-6 space-y-5 md:space-y-6">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-medium">
                <Clock3 size={16} className={dirtyPlanCount > 0 ? "text-amber-500" : "text-emerald-500"} />
                <span className={dirtyPlanCount > 0 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}>
                  {dirtyPlanCount > 0
                    ? <><AnimatedNumber value={dirtyPlanCount} durationMs={320} /> gói đang có thay đổi cục bộ chưa lưu</>
                    : "Tất cả gói đã đồng bộ"}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Chỉnh sửa trực tiếp trong card, sau đó bấm Lưu theo từng gói.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-5 md:gap-6">
              <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur p-4 sm:p-5 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Plus size={18} /></div>
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold">{t("adm_sub_create_plan", "Tạo gói mới")}</h2>
                      <p className="text-sm text-muted-foreground">{t("adm_sub_create_hint", "Định giá, giới hạn và tính năng cho giảng viên.")}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreatePlanModal(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(15,23,42,0.12)] hover:shadow-[0_14px_34px_rgba(15,23,42,0.18)]">
                    <Plus size={16} /> {t("adm_sub_create_btn", "Tạo gói")}
                  </button>
                </div>
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
                  <p className="text-sm text-muted-foreground">{t("adm_sub_create_hint_modal", "Bấm nút \"Tạo gói\" ở trên để mở form tạo gói mới")}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur p-4 sm:p-5 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2"><ShieldCheck size={18} /> {t("adm_sub_plan_management", "Quản lý gói")}</h2>
                <div className="space-y-4 max-h-[390px] overflow-y-auto pr-1 md:pr-2">
                  {plans.map((plan) => {
                    const hasDraft = hasPlanDraftChanges(plan)
                    const isFreePlan = String(plan?.name || "").trim().toLowerCase() === "free"
                    const activeUsersUsingPlan = activeSubscriptionUsageByPlanId[String(plan.id)] || 0
                    return (
                      <div key={plan.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-primary/5 p-4 space-y-3 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.14)] dark:from-slate-900 dark:via-slate-900 dark:to-primary/5">
                        <button type="button" onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)} className="w-full text-left">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold">{plan.name || t("adm_sub_plan_name", "Tên gói")}</p>
                              <p className="text-xs text-muted-foreground">{t("adm_sub_duration", "Thời hạn (tháng)")}: <AnimatedNumber value={plan.durationMonths} durationMs={320} /></p>
                              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Hiện đang sử dụng: <AnimatedNumber value={activeUsersUsingPlan} durationMs={320} /> giảng viên</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold"><AnimatedNumber value={Number(plan.price || 0)} formatter={formatCurrency} durationMs={420} /></span>
                              {isFreePlan ? <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-[11px] font-semibold dark:bg-slate-800 dark:text-slate-200">Gói mặc định</span> : null}
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${hasDraft ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                {hasDraft ? "Chưa lưu" : "Đã đồng bộ"}
                              </span>
                            </div>
                          </div>
                        </button>

                        {expandedPlanId === plan.id && (
                          <>
                            <div className="grid sm:grid-cols-3 gap-3 text-sm">
                              <LabeledInput compact label={t("adm_sub_plan_name", "Tên gói")} value={plan.name} onChange={(v) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, name: v } : p)))} />
                              <LabeledInput compact label={t("adm_sub_price", "Giá (VND)")} value={plan.price} onChange={(v) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, price: Number(v) || 0 } : p)))} type="number" />
                              <LabeledInput compact label={t("adm_sub_duration", "Thời hạn (tháng)")} value={plan.durationMonths} onChange={(v) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, durationMonths: Number(v) || 0 } : p)))} type="number" />
                              <LabeledInput compact label={t("adm_sub_course_limit", "Giới hạn khóa học")} value={plan.courseLimit} onChange={(v) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, courseLimit: Number(v) || 0 } : p)))} type="number" />
                              <LabeledInput compact label={t("adm_sub_storage_short", "Dung lượng (GB)")} value={plan.storageLimitGb ?? 0} onChange={(v) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, storageLimitGb: Number(v) || 0 } : p)))} type="number" />
                              <LabeledInput compact label={t("adm_sub_student_limit", "Giới hạn học viên")}
                                value={plan.studentsLimit ?? 0}
                                onChange={(v) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, studentsLimit: Number(v) || 0 } : p)))}
                                type="number"
                              />
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2 border-t border-border dark:border-slate-700">
                              <button
                                className="h-9 px-3.5 rounded-xl bg-emerald-600 text-white inline-flex items-center justify-center gap-1 text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-60"
                                onClick={() => updatePlan(plan.id, plan)}
                                disabled={!hasDraft}
                              >
                                <Save size={14} /> {t("adm_sub_save", "Lưu")}
                              </button>
                              <button 
                                className="h-9 px-3.5 rounded-xl bg-slate-600 text-white inline-flex items-center justify-center gap-1 text-sm font-semibold shadow-sm hover:shadow-md"
                                onClick={() => setExpandedPlanId(null)}
                              >
                                {t("common_close", "Đóng")}
                              </button>
                              <button
                                className="h-9 px-3.5 rounded-xl bg-rose-600 text-white inline-flex items-center justify-center gap-1 text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-60"
                                onClick={() => requestDeletePlan(plan)}
                                disabled={deletingPlanId === plan.id || isFreePlan}
                                title={isFreePlan ? "Gói Free là gói mặc định, không thể xóa" : undefined}
                              >
                                <Trash2 size={14} /> {deletingPlanId === plan.id ? t("adm_sub_deleting", "Đang xóa") : t("adm_sub_delete_btn", "Xóa")}
                              </button>
                            </div>
                          </>
                        )}

                        {expandedPlanId !== plan.id && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border dark:border-slate-700">
                            <button 
                              className="h-9 px-3.5 rounded-xl bg-blue-600 text-white inline-flex items-center justify-center gap-1 text-sm font-semibold shadow-sm hover:shadow-md"
                              onClick={() => setExpandedPlanId(plan.id)}
                            >
                              <SquarePen size={14} /> {t("common_edit", "Chỉnh sửa")}
                            </button>
                            <button
                              className="h-9 px-3.5 rounded-xl bg-rose-600 text-white inline-flex items-center justify-center gap-1 text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-60"
                              onClick={() => requestDeletePlan(plan)}
                              disabled={deletingPlanId === plan.id || isFreePlan}
                              title={isFreePlan ? "Gói Free là gói mặc định, không thể xóa" : undefined}
                            >
                              <Trash2 size={14} /> {deletingPlanId === plan.id ? t("adm_sub_deleting", "Đang xóa") : t("adm_sub_delete_btn", "Xóa")}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="m-0 p-4 sm:p-5 md:p-6 space-y-5 md:space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur p-4 sm:p-5 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><CreditCard size={18} /></div>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold">{t("adm_sub_payment_management", "Quản lý thanh toán")}</h2>
                    <p className="text-sm text-muted-foreground">{t("adm_sub_payment_hint", "Giám sát giao dịch, xác nhận và hoàn tiền")}</p>
                  </div>
                </div>
                <button onClick={exportPayments} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(15,23,42,0.12)] hover:shadow-[0_14px_34px_rgba(15,23,42,0.18)]">
                  <FileText size={16} /> {t("adm_sub_export", "Xuất báo cáo")}
                </button>
              </div>

              <div className="relative z-50 bg-white/85 dark:bg-slate-900/55 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/70 rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400" size={20} />
                  <input
                    type="text"
                    value={paymentSearchQuery}
                    onChange={(e) => setPaymentSearchQuery(e.target.value)}
                    placeholder={t("adm_sub_payment_search", "Tìm theo mã giao dịch, email/giảng viên, tên gói...")}
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary dark:focus:border-accent transition-all duration-300 text-foreground dark:text-white placeholder:text-muted-foreground/60 shadow-sm"
                  />
                </div>
                <div className="filter-row gap-y-3 sm:gap-y-4">
                  <span className="text-sm font-semibold text-foreground dark:text-white">{t("common_filter_by", "Lọc theo")}:</span>
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="filter-select h-[46px] w-full sm:w-auto min-w-[220px] md:min-w-[240px] lg:min-w-[260px] rounded-xl px-4 text-sm"
                  >
                    <option value="all">{t("common_all", "Tất cả")}</option>
                    <option value="pending">{t("adm_sub_pending", "Đang chờ xử lý")}</option>
                    <option value="paid">{t("adm_sub_paid", "Đã thanh toán")}</option>
                    <option value="refunded">{t("adm_sub_refunded", "Đã hoàn tiền")}</option>
                  </select>
                  <select
                    value={paymentSortBy}
                    onChange={(e) => setPaymentSortBy(e.target.value as "newest" | "oldest" | "amount_desc" | "amount_asc")}
                    className="filter-select h-[46px] w-full sm:w-auto min-w-[240px] md:min-w-[260px] lg:min-w-[300px] rounded-xl px-4 text-sm"
                  >
                    <option value="newest">{t("adm_sub_sort_newest", "Mới nhất")}</option>
                    <option value="oldest">{t("adm_sub_sort_oldest", "Cũ nhất")}</option>
                    <option value="amount_desc">{t("adm_sub_sort_amount_desc", "Số tiền giảm dần")}</option>
                    <option value="amount_asc">{t("adm_sub_sort_amount_asc", "Số tiền tăng dần")}</option>
                  </select>
                  {(paymentSearchQuery.trim() || paymentStatusFilter !== "all" || paymentSortBy !== "newest") ? (
                    <button
                      onClick={() => {
                        setPaymentSearchQuery("")
                        setPaymentStatusFilter("all")
                        setPaymentSortBy("newest")
                      }}
                      className="h-[46px] w-full sm:w-auto md:min-w-[132px] lg:min-w-[148px] inline-flex items-center justify-center px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      {t("common_reset", "Đặt lại")}
                    </button>
                  ) : null}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {t("adm_sub_showing", "Hiển thị")}: <span className="font-semibold"><AnimatedNumber value={filteredPayments.length} durationMs={320} /></span> / <AnimatedNumber value={payments.length} durationMs={320} /> {t("adm_sub_transactions", "giao dịch.")}
                </div>
              </div>

              <div className="space-y-3">
                {filteredPayments.map((p) => {
                  const statusMeta = getPaymentStatusMeta(p.status)
                  const statusKey = String(p.status || "").toLowerCase()
                  const canConfirm = statusKey === "pending"
                  const canRefund = statusKey === "pending" || statusKey === "paid"

                  return (
                    <div key={p.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3 bg-gradient-to-br from-white via-white to-slate-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/30 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="space-y-1">
                          <p className="font-semibold text-base tracking-tight leading-tight">{p.transactionId}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{p.teacher?.email || p.teacher?.name} • {p.plan?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-foreground dark:text-white"><AnimatedNumber value={Number(p.amount || 0)} formatter={formatCurrency} durationMs={440} /></span>
                          <span className={`text-xs px-2 py-1 rounded-full border ${statusMeta.className}`}>{statusMeta.label}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-between md:justify-start">
                        <button
                          className="h-9 px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50"
                          onClick={() => handleConfirmPaymentAction(p.id)}
                          disabled={!canConfirm}
                          title={canConfirm ? t("adm_sub_confirm_btn", "Xác nhận") : t("adm_sub_confirm_disabled", "Chỉ xác nhận khi giao dịch đang chờ")}
                        >
                          <CheckCircle2 size={14} /> {t("adm_sub_confirm_btn", "Xác nhận")}
                        </button>
                        <button
                          className="h-9 px-3.5 rounded-xl bg-red-500 text-white text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50"
                          onClick={() => handleRefundPaymentAction(p.id)}
                          disabled={!canRefund}
                          title={canRefund ? t("adm_sub_refund", "Hoàn tiền") : t("adm_sub_refund_disabled", "Giao dịch này không thể hoàn tiền")}
                        >
                          <Trash2 size={14} /> {t("adm_sub_refund", "Hoàn tiền")}
                        </button>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock3 size={12} /> {new Date(p.createdAt).toLocaleString("vi-VN")}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {filteredPayments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-sm text-muted-foreground">
                  {t("adm_sub_no_payment_match", "Không có giao dịch phù hợp với bộ lọc hiện tại.")}
                </div>
              ) : null}
              <p className="text-sm text-muted-foreground">{t("adm_sub_paid_count", "Đã thanh toán:")} <AnimatedNumber value={paidPayments.length} durationMs={420} /> {t("adm_sub_transactions", "giao dịch.")}</p>
            </section>
          </TabsContent>

          <TabsContent value="access" className="m-0 p-4 sm:p-5 md:p-6 space-y-5 md:space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur p-4 sm:p-5 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2"><ShieldCheck size={18} /> {t("adm_sub_instructor_access", "Quyền truy cập giảng viên")}</h2>
                  <p className="text-sm text-muted-foreground">{t("adm_sub_access_desc", "Theo dõi hạn mức sử dụng và vòng đời gói theo từng giảng viên.")}</p>
                </div>
                <span className="w-fit rounded-full border border-emerald-200/80 dark:border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <AnimatedNumber value={filteredAccessSubscriptions.length} durationMs={320} /> / <AnimatedNumber value={subscriptions.length} durationMs={320} /> {t("adm_sub_teachers", "giảng viên")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAccessOnlyActive((prev) => !prev)}
                  className={`h-9 rounded-full border px-3 text-xs font-semibold transition ${
                    accessOnlyActive
                      ? "border-emerald-400 bg-emerald-100 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {t("adm_sub_filter_only_active", "Chỉ active")}
                </button>
                <button
                  type="button"
                  onClick={() => setAccessOnlyPaidPlan((prev) => !prev)}
                  className={`h-9 rounded-full border px-3 text-xs font-semibold transition ${
                    accessOnlyPaidPlan
                      ? "border-primary/70 bg-primary/15 text-primary dark:border-accent/60 dark:bg-accent/20 dark:text-accent"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {t("adm_sub_filter_only_paid_plan", "Chỉ paid plan")}
                </button>
                {(accessOnlyActive || accessOnlyPaidPlan) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAccessOnlyActive(false)
                      setAccessOnlyPaidPlan(false)
                    }}
                    className="h-9 rounded-full border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {t("common_reset", "Đặt lại")}
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {filteredAccessSubscriptions.map((s) => {
                  const courseQuota = getQuotaMeta(s?.usage?.coursesCreated || 0, s?.usage?.courseLimit || s?.plan?.courseLimit || 0)
                  const studentQuota = getQuotaMeta(s?.usage?.studentsUsed || 0, s?.usage?.studentsLimit || s?.plan?.studentsLimit || 0)
                  const storageQuota = getQuotaMeta(s?.usage?.storageUsedGb || 0, s?.usage?.storageLimitGb || s?.plan?.storageLimitGb || 0)
                  const expiryMeta = getExpiryMeta(s?.endDate)
                  const accessStatus = getAccessStatusMeta(s?.status)

                  return (
                    <div key={s.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-gradient-to-br from-white via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-900/20 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.14)] space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 inline-flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200">
                            {(s.teacher?.name || s.teacher?.email || "?").slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-base">{s.teacher?.name || s.teacher?.email}</p>
                            <p className="text-xs text-muted-foreground">{s.teacher?.email || "--"}</p>
                            <p className="text-sm text-muted-foreground">{t("adm_sub_plan_label", "Gói")}: {s.plan?.name}</p>
                            <p className="text-xs text-muted-foreground">{t("adm_sub_history_count", "Số bản ghi lịch sử")}: <span className="font-semibold text-foreground dark:text-white"><AnimatedNumber value={Number(s?.historyCount || 1)} durationMs={320} /></span></p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${accessStatus.className}`}>
                            {t("adm_sub_status_label", "Trạng thái")}: {accessStatus.label}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${expiryMeta.className}`}>
                            {expiryMeta.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openAccessEditor(s)}
                              className="h-8 px-3 rounded-lg bg-blue-600 text-white inline-flex items-center gap-1 text-xs font-semibold shadow-sm hover:shadow-md"
                            >
                              <SquarePen size={13} /> {t("common_edit", "Chỉnh sửa")}
                            </button>
                            <button
                              onClick={() => requestRemoveInstructorAccess(s)}
                              disabled={removingSubscriptionId === String(s?.id || "")}
                              className="h-8 px-3 rounded-lg bg-rose-600 text-white inline-flex items-center gap-1 text-xs font-semibold shadow-sm hover:shadow-md disabled:opacity-60"
                              title={t("adm_sub_remove_access", "Xóa gói đang dùng")}
                            >
                              {removingSubscriptionId === String(s?.id || "") ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} {t("adm_sub_remove_access", "Xóa gói")}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 text-sm">
                        {[
                          { label: t("adm_sub_courses_label", "Khóa học"), meta: courseQuota, suffix: "" },
                          { label: t("adm_sub_student_limit", "Học viên"), meta: studentQuota, suffix: "" },
                          { label: t("adm_sub_storage_short", "Dung lượng (GB)"), meta: storageQuota, suffix: " GB" },
                        ].map((item) => (
                          <div key={item.label} className="rounded-lg border border-border/60 p-2.5 bg-white/40 dark:bg-slate-900/30 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground">{item.label}</p>
                              <p className={`text-xs font-semibold ${item.meta.toneClass}`}>
                                <AnimatedNumber value={item.meta.used} formatter={formatNumber} durationMs={420} /> / <AnimatedNumber value={item.meta.limit} formatter={formatNumber} durationMs={420} />{item.suffix}
                              </p>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div className={`h-full ${item.meta.barClass} transition-all`} style={{ width: `${item.meta.percent}%` }} />
                            </div>
                            <p className={`text-[11px] ${item.meta.toneClass}`}>{item.meta.stateLabel}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground pt-1 border-t border-border/70 dark:border-slate-700 leading-relaxed">
                        <span>{t("adm_sub_end_date", "Ngày hết hạn")}: <span className="font-semibold text-foreground dark:text-white">{expiryMeta.displayDate}</span></span>
                        <span>{t("adm_sub_live_sync", "Đồng bộ gần nhất")}: {lastSyncedAt ? lastSyncedAt.toLocaleTimeString("vi-VN") : "--:--:--"}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {filteredAccessSubscriptions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-sm text-muted-foreground">
                  {t("adm_sub_no_access_data", "Chưa có dữ liệu quyền truy cập giảng viên.")}
                </div>
              ) : null}
            </section>
          </TabsContent>

          <TabsContent value="modules" className="m-0 p-4 sm:p-5 md:p-6 space-y-5 md:space-y-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur p-4 sm:p-5 space-y-3 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
              <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2"><BarChart3 size={18} /> {t("adm_sub_other_modules", "Các module quản trị khác")}</h2>
              <p className="text-sm text-muted-foreground">{t("adm_sub_other_desc", "Các mục theo yêu cầu hệ thống đã có sẵn trong Admin:")}</p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <ModulePill label={t("adm_sub_mod_courses", "Quản lý khóa học")} path="/admin/courses" />
                <ModulePill label={t("adm_sub_mod_categories", "Quản lý nội dung (categories)")} path="/admin/categories" />
                <ModulePill label={t("adm_sub_mod_reports", "Quản lý báo cáo")} path="/admin/reports" />
                <ModulePill label={t("adm_sub_mod_settings", "Cấu hình hệ thống")} path="/admin/settings" />
                <ModulePill label={t("adm_sub_mod_payments", "Thanh toán tổng hợp")} path="/admin/payments" />
              </div>
            </section>
          </TabsContent>

          {/* Create Plan Modal Dialog */}
          {showCreatePlanModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-[0_20px_48px_rgba(15,23,42,0.2)] max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                      <Plus size={18} className="text-primary" /> {t("adm_sub_create_plan", "Tạo gói mới")}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{t("adm_sub_create_hint", "Định giá, giới hạn và tính năng cho giảng viên.")}</p>
                  </div>
                  <button onClick={() => {
                    setShowCreatePlanModal(false)
                    setNewPlan(emptyPlan)
                  }} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition">
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LabeledInput label={t("adm_sub_plan_name", "Tên gói")} value={newPlan.name} onChange={(v) => setNewPlan((p: any) => ({ ...p, name: v }))} placeholder={t("adm_sub_plan_name_placeholder", "Ví dụ: Basic, Pro...")} />
                    <LabeledInput label={t("adm_sub_price", "Giá (VND)")} value={newPlan.price} onChange={(v) => setNewPlan((p: any) => ({ ...p, price: Number(v) || 0 }))} placeholder={t("adm_sub_price_placeholder", "Ví dụ: 0")} type="number" />
                    <LabeledInput label={t("adm_sub_duration", "Thời hạn (tháng)")} value={newPlan.durationMonths} onChange={(v) => setNewPlan((p: any) => ({ ...p, durationMonths: Number(v) || 0 }))} placeholder={t("adm_sub_duration_placeholder", "Ví dụ: 1")} type="number" />
                    <LabeledInput label={t("adm_sub_course_limit", "Giới hạn khóa học")}
                      value={newPlan.courseLimit}
                      onChange={(v) => setNewPlan((p: any) => ({ ...p, courseLimit: Number(v) || 0 }))}
                      placeholder={t("adm_sub_course_limit_placeholder", "Ví dụ: 20")}
                      type="number"
                    />
                    <LabeledInput label={t("adm_sub_storage", "Dung lượng lưu trữ (GB)")} value={newPlan.storageLimitGb} onChange={(v) => setNewPlan((p: any) => ({ ...p, storageLimitGb: Number(v) || 0 }))} placeholder={t("adm_sub_storage_placeholder", "Ví dụ: 10")} type="number" />
                    <LabeledInput label={t("adm_sub_student_limit", "Giới hạn học viên")}
                      value={newPlan.studentsLimit}
                      onChange={(v) => setNewPlan((p: any) => ({ ...p, studentsLimit: Number(v) || 0 }))}
                      placeholder={t("adm_sub_student_limit_placeholder", "Ví dụ: 120")}
                      type="number"
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex items-center justify-end gap-3 flex-wrap">
                  <button onClick={() => {
                    setShowCreatePlanModal(false)
                    setNewPlan(emptyPlan)
                  }} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 text-sm font-semibold transition">
                    {t("common_cancel", "Hủy")}
                  </button>
                  <button onClick={createPlan} disabled={creating} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(15,23,42,0.12)] hover:shadow-[0_14px_34px_rgba(15,23,42,0.18)] disabled:opacity-60">
                    {creating ? <><Loader2 size={16} className="animate-spin" /> {t("adm_sub_creating", "Đang tạo...")}</> : <><Check size={16} /> {t("adm_sub_create_btn", "Tạo gói")}</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showEditAccessModal && editingSubscription && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full shadow-[0_20px_48px_rgba(15,23,42,0.2)] max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                      <CalendarClock size={18} className="text-primary" /> {t("adm_sub_edit_access", "Chỉnh quyền truy cập")}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {editingSubscription?.teacher?.name || editingSubscription?.teacher?.email || "--"}
                    </p>
                  </div>
                  <button onClick={closeAccessEditor} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 p-4 text-sm">
                    <p className="text-muted-foreground">{t("adm_sub_plan_label", "Gói")}: <span className="font-semibold text-foreground dark:text-white">{editingSubscription?.plan?.name || "--"}</span></p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium">{t("adm_sub_status_label", "Trạng thái")}</span>
                      <DialogSelect
                        value={accessEditForm.status}
                        onChange={(e) => setAccessEditForm((prev) => ({ ...prev, status: e.target.value as any }))}
                        className="h-11 w-full"
                      >
                        <option value="active">{t("adm_sub_active", "Đang hoạt động")}</option>
                        <option value="pending">{t("adm_sub_pending", "Đang chờ xử lý")}</option>
                        <option value="expired">{t("adm_sub_expired", "Đã hết hạn")}</option>
                        <option value="cancelled">{t("adm_sub_cancelled", "Đã hủy")}</option>
                      </DialogSelect>
                    </label>

                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium">{t("adm_sub_end_date", "Ngày hết hạn")}</span>
                      <input
                        type="date"
                        value={accessEditForm.endDate}
                        onChange={(e) => setAccessEditForm((prev) => ({ ...prev, endDate: e.target.value }))}
                        className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3"
                      />
                    </label>
                  </div>

                </div>

                <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex items-center justify-end gap-3">
                  <button onClick={closeAccessEditor} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 text-sm font-semibold transition">
                    {t("common_cancel", "Hủy")}
                  </button>
                  <button
                    onClick={updateAccess}
                    disabled={updatingSubscriptionId === String(editingSubscription?.id || "")}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(15,23,42,0.12)] hover:shadow-[0_14px_34px_rgba(15,23,42,0.18)] disabled:opacity-60"
                  >
                    {updatingSubscriptionId === String(editingSubscription?.id || "") ? (
                      <><Loader2 size={16} className="animate-spin" /> {t("adm_sub_updating", "Đang cập nhật...")}</>
                    ) : (
                      <><Save size={16} /> {t("adm_sub_save_access", "Lưu thay đổi")}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <ConfirmDialog
            isOpen={deletePlanDialog.isOpen}
            onClose={() => setDeletePlanDialog({ isOpen: false })}
            onConfirm={() => {
              if (deletePlanDialog.planId) {
                void deletePlan(deletePlanDialog.planId)
              }
            }}
            title={t("adm_sub_delete_title", "Xóa gói")}
            message={
              deletePlanDialog.planName
                ? t("adm_sub_delete_desc", "Bạn chắc chắn muốn xóa gói này?") + ` (${deletePlanDialog.planName})`
                : t("adm_sub_delete_desc", "Bạn chắc chắn muốn xóa gói này?")
            }
            confirmText={t("adm_sub_delete_btn", "Xóa")}
            cancelText={t("common_cancel", "Hủy")}
            isDangerous
          />

          <ConfirmDialog
            isOpen={removeAccessDialog.isOpen}
            onClose={() => setRemoveAccessDialog({ isOpen: false })}
            onConfirm={() => {
              if (removeAccessDialog.subscriptionId) {
                void removeInstructorAccess(removeAccessDialog.subscriptionId)
              }
            }}
            title={t("adm_sub_remove_access", "Xóa gói")}
            message={`${t("adm_sub_remove_access_confirm", "Bạn chắc chắn muốn xóa gói đang dùng của giảng viên này và chuyển về Free?")}\n\n${removeAccessDialog.teacherName || t("adm_sub_teacher", "Giảng viên")}`}
            confirmText={t("adm_sub_delete_btn", "Xóa")}
            cancelText={t("common_cancel", "Hủy")}
            isDangerous
          />
        </div>
      </Tabs>
    </div>
  )
}

type LabeledInputProps = {
  label: string
  value: any
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  compact?: boolean
}

function LabeledInput({ label, value, onChange, placeholder, type = "text", compact }: LabeledInputProps) {
  const shape = compact ? "rounded-lg py-2" : "rounded-xl py-2.5"
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        className={`w-full ${shape} border border-border px-3 bg-background focus:ring-2 focus:ring-primary/30`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

type ModulePillProps = {
  label: string
  path: string
}

function ModulePill({ label, path }: ModulePillProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2 bg-background">
      <span>{label}</span>
      <span className="text-xs text-muted-foreground">{path}</span>
    </div>
  )
}


