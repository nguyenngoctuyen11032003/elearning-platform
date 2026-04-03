"use client"

import React, { useEffect, useMemo, useState } from "react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { formatNumber } from "@/lib/format"
import { useMetricChangeHighlight } from "@/hooks/use-metric-change-highlight"
import { MetricTrendBadge } from "@/components/ui/metric-trend-badge"

const emptyPlan = {
  name: "",
  price: 9,
  durationMonths: 1,
  courseLimit: 20,
  storageLimitGb: 10,
  studentsLimit: 120,
  features: "",
}

const SUBSCRIPTIONS_REALTIME_MS = 45000

export default function AdminTeacherSubscriptionPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [dashboard, setDashboard] = useState<any>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [creating, setCreating] = useState(false)
  const [newPlan, setNewPlan] = useState<any>(emptyPlan)

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [planRes, subRes, payRes, dashRes] = await Promise.all([
        apiClient.getAdminInstructorPlans(),
        apiClient.getAdminInstructorSubscriptions(),
        apiClient.getAdminInstructorPayments(),
        apiClient.getAdminRevenueDashboard(),
      ])

      setPlans(Array.isArray(planRes) ? planRes : [])
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
    try {
      await apiClient.deleteAdminInstructorPlan(id)
      toast.success(t("adm_sub_delete_ok", "Đã xử lý xóa gói"))
      await loadAll()
    } catch (error: any) {
      toast.error(error?.message || t("adm_sub_delete_fail", "Không thể xóa gói"))
    }
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
      ["Transaction ID", "User", "Plan", "Amount", "Status", "Date"],
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
    XLSX.utils.book_append_sheet(wb, ws, "Payments")
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

  if (loading) {
    return <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
  }

  return (
    <div className="space-y-8">
<<<<<<< HEAD
      <section className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-slate-800/70 shadow-[0_20px_60px_rgba(15,23,42,0.18)] bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/45 via-primary/25 to-accent/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/80" />
=======
      <section
        className="relative overflow-hidden rounded-3xl border border-border text-white shadow-xl"
        style={{
          backgroundImage: "url('/image/bgr_qligoi_gv.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/55 to-slate-900/70" />
>>>>>>> e1d808e13c48d480b16b3228d032f84bee0784cb
        <div className="relative grid gap-6 p-6 md:p-8 lg:grid-cols-[1.3fr_1fr] items-start">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-emerald-100 border border-white/10">
              <ShieldCheck size={14} /> {t("adm_sub_payment_center", "Quản lý thanh toán")}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">{t("adm_sub_title", "Quản lý gói & thanh toán giảng viên")}</h1>
              <p className="text-slate-200/90 text-sm md:text-base">{t("adm_sub_desc", "Theo dõi giao dịch, doanh thu và quyền truy cập giảng viên trong một bảng điều khiển duy nhất.")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportPayments}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/90 px-4 text-sm font-semibold text-primary shadow-lg backdrop-blur hover:shadow-xl"
              >
                <FileText size={16} /> {t("adm_sub_export", "Xuất báo cáo")}
              </button>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/15 px-4 py-2 text-sm text-white">
                <CreditCard size={16} /> {t("adm_sub_tx_code", "Mã thanh toán")}: <span className="font-semibold">{metrics.latestTransactionId}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[{
                key: "totalRevenue",
                title: t("adm_sub_total_revenue", "Tổng doanh thu"),
                value: <AnimatedNumber value={displayTotalRevenue} formatter={formatNumber} prefix="₫" />,
                icon: <Wallet size={16} />, tone: "from-emerald-500/25 to-emerald-400/20 border-emerald-300/60"
              }, {
                key: "monthlyRevenue",
                title: t("adm_sub_monthly_revenue", "Doanh thu tháng"),
                value: <AnimatedNumber value={displayMonthlyRevenue} formatter={formatNumber} prefix="₫" />,
                icon: <BarChart3 size={16} />, tone: "from-sky-500/25 to-sky-400/20 border-sky-300/60"
              }, {
                key: "paidUsers",
                title: t("adm_sub_paid_users", "Người dùng trả phí"),
                value: <AnimatedNumber value={displayPaidUsers} formatter={formatNumber} />,
                icon: <CheckCircle2 size={16} />, tone: "from-indigo-500/25 to-indigo-400/20 border-indigo-300/60"
              }, {
                key: "conversionRate",
                title: t("adm_sub_conversion", "Tỉ lệ chuyển đổi"),
                value: <AnimatedNumber value={displayConversionRate} decimals={1} suffix="%" />,
                icon: <ArrowRight size={16} />, tone: "from-violet-500/25 to-violet-400/20 border-violet-300/60"
              }].map((card) => (
                <div key={card.title} className={`rounded-2xl border bg-gradient-to-br ${card.tone} p-3 sm:p-4 shadow-sm backdrop-blur transition-all duration-700 ${isOverviewChanged(card.key) ? "ring-2 ring-emerald-300/40 border-emerald-300/80" : ""}`}> 
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-white/80 whitespace-nowrap">{card.title}</p>
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/80">{card.icon}</div>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold mt-2 whitespace-nowrap">{card.value}</p>
                  <MetricTrendBadge trend={getOverviewTrend(card.key)} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-slate-100/90">{t("adm_sub_payment_status", "Trạng thái thanh toán")}</p>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-100 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                <CreditCard size={12} />{t("adm_sub_tx_code", "Mã thanh toán")}: <span className="font-semibold">{metrics.latestTransactionId}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                <p className="text-xs text-amber-100/90">{t("adm_sub_pending", "Đang chờ xử lý")}</p>
                <p className="text-xl font-semibold whitespace-nowrap"><AnimatedNumber value={metrics.pendingAmount} formatter={formatNumber} prefix="₫" /></p>
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-100/90"><Clock3 size={12} />{t("adm_sub_total_tx", "Tổng giao dịch")}: {metrics.totalTransactions}</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                <p className="text-xs text-emerald-100/90">{t("adm_sub_tx_success", "Giao dịch thành công")}</p>
                <p className="text-xl font-semibold whitespace-nowrap">{metrics.successCount}</p>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-100/90"><ShieldCheck size={12} />{t("adm_sub_paid_users", "Người dùng trả phí")}: {displayPaidUsers}</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-100/80 flex items-center justify-between">
              <span className="inline-flex items-center gap-1"><BarChart3 size={12} /> {t("adm_sub_recent_tx", "Giao dịch mới nhất")}</span>
              <span className="font-semibold text-white whitespace-nowrap">{metrics.latestTransactionId}</span>
            </div>
            <div className="text-[11px] text-slate-200/80">{t("adm_sub_live_sync", "Đồng bộ gần nhất")}: {lastSyncedAt ? lastSyncedAt.toLocaleTimeString("vi-VN") : "--:--:--"}</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur p-5 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Plus size={18} /></div>
            <div>
              <h2 className="text-xl font-semibold">{t("adm_sub_create_plan", "Tạo gói mới")}</h2>
              <p className="text-sm text-muted-foreground">{t("adm_sub_create_hint", "Định giá, giới hạn và tính năng cho giảng viên.")}</p>
            </div>
          </div>
          <button onClick={createPlan} disabled={creating} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary/90 dark:bg-accent px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.14)] hover:shadow-[0_12px_26px_rgba(15,23,42,0.18)] disabled:opacity-60">
            {creating ? t("adm_sub_creating", "Đang tạo...") : t("adm_sub_create_btn", "Tạo gói")}
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <LabeledInput label={t("adm_sub_plan_name", "Tên gói")} value={newPlan.name} onChange={(v) => setNewPlan((p: any) => ({ ...p, name: v }))} placeholder={t("adm_sub_plan_name_placeholder", "Ví dụ: Basic, Pro...")} />
          <LabeledInput label={t("adm_sub_price", "Giá (VND)")} value={newPlan.price} onChange={(v) => setNewPlan((p: any) => ({ ...p, price: Number(v) || 0 }))} placeholder="0" type="number" />
          <LabeledInput label={t("adm_sub_duration", "Thời hạn (tháng)")} value={newPlan.durationMonths} onChange={(v) => setNewPlan((p: any) => ({ ...p, durationMonths: Number(v) || 0 }))} placeholder="1" type="number" />
          <LabeledInput label={t("adm_sub_course_limit", "Giới hạn khóa học")}
            value={newPlan.courseLimit}
            onChange={(v) => setNewPlan((p: any) => ({ ...p, courseLimit: Number(v) || 0 }))}
            placeholder="20"
            type="number"
          />
          <LabeledInput label={t("adm_sub_storage", "Dung lượng lưu trữ (GB)")} value={newPlan.storageLimitGb} onChange={(v) => setNewPlan((p: any) => ({ ...p, storageLimitGb: Number(v) || 0 }))} placeholder="10" type="number" />
          <LabeledInput label={t("adm_sub_student_limit", "Giới hạn học viên")}
            value={newPlan.studentsLimit}
            onChange={(v) => setNewPlan((p: any) => ({ ...p, studentsLimit: Number(v) || 0 }))}
            placeholder="120"
            type="number"
          />
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-2">{t("adm_sub_features", "Tính năng (mỗi dòng một tính năng)")}</label>
            <textarea
              className="w-full rounded-xl border border-border px-3 py-2 bg-background min-h-24 focus:ring-2 focus:ring-primary/40"
              placeholder={t("adm_sub_features_placeholder", "Ví dụ:\nHỗ trợ email 24/7\nThống kê chi tiết\nCertificate custom")}
              value={newPlan.features}
              onChange={(e) => setNewPlan((p: any) => ({ ...p, features: e.target.value }))}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur p-5 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
        <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldCheck size={18} /> {t("adm_sub_plan_management", "Quản lý gói")}</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-primary/5 p-4 space-y-3 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.14)] dark:from-slate-900 dark:via-slate-900 dark:to-primary/5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{plan.name || t("adm_sub_plan_name", "Tên gói")}</p>
                  <p className="text-xs text-muted-foreground">{t("adm_sub_duration", "Thời hạn (tháng)")}: {plan.durationMonths}</p>
                </div>
                <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">₫{formatNumber(Number(plan.price || 0))}</span>
              </div>

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

              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <button className="h-9 px-3.5 rounded-lg bg-emerald-600 text-white inline-flex items-center justify-center gap-1 text-sm font-semibold shadow-sm hover:shadow-md" onClick={() => updatePlan(plan.id, plan)}><Save size={14} /> {t("adm_sub_save", "Lưu")}</button>
                <button className="h-9 px-3.5 rounded-lg bg-rose-600 text-white inline-flex items-center justify-center gap-1 text-sm font-semibold shadow-sm hover:shadow-md" onClick={() => deletePlan(plan.id)}><Trash2 size={14} /> {t("adm_sub_delete_btn", "Xóa")}</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur p-5 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><CreditCard size={18} /></div>
            <div>
              <h2 className="text-xl font-semibold">{t("adm_sub_payment_management", "Quản lý thanh toán")}</h2>
              <p className="text-sm text-muted-foreground">{t("adm_sub_payment_hint", "Giám sát giao dịch, xác nhận và hoàn tiền")}</p>
            </div>
          </div>
          <button onClick={exportPayments} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary/90 dark:bg-accent px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.14)] hover:shadow-[0_12px_26px_rgba(15,23,42,0.18)]">
            <FileText size={16} /> {t("adm_sub_export", "Xuất báo cáo")}
          </button>
        </div>
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3 bg-gradient-to-br from-white via-white to-slate-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/30 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-semibold text-base tracking-tight">{p.transactionId}</p>
                  <p className="text-sm text-muted-foreground">{p.teacher?.email || p.teacher?.name} • {p.plan?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">₫{formatNumber(Number(p.amount || 0))}</span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${p.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : p.status === "refunded" ? "bg-orange-50 text-orange-700 border-orange-100" : "bg-slate-100 text-slate-700 border-slate-200"}`}>{p.status}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-between md:justify-start">
                <button className="h-9 px-3.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1" onClick={() => confirmPayment(p.id)}>
                  <CheckCircle2 size={14} /> {t("adm_sub_confirm_btn", "Xác nhận")}
                </button>
                <button className="h-9 px-3.5 rounded-lg bg-red-500 text-white text-xs font-semibold inline-flex items-center gap-1" onClick={() => refundPayment(p.id)}>
                  <Trash2 size={14} /> {t("adm_sub_refund", "Hoàn tiền")}
                </button>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock3 size={12} /> {new Date(p.createdAt).toLocaleString("vi-VN")}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{t("adm_sub_paid_count", "Đã thanh toán:")} {paidPayments.length} {t("adm_sub_transactions", "giao dịch.")}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur p-5 space-y-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
        <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldCheck size={18} /> {t("adm_sub_instructor_access", "Quyền truy cập giảng viên")}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {subscriptions.map((s) => (
            <div key={s.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-gradient-to-br from-white via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-900/20 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-base">{s.teacher?.name || s.teacher?.email}</p>
                  <p className="text-sm text-muted-foreground">{t("adm_sub_plan_label", "Gói")}: {s.plan?.name}</p>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">{t("adm_sub_status_label", "Trạng thái")}: {s.status}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border border-border/60 p-2 bg-white/40 dark:bg-slate-900/30">
                  <p className="text-xs text-muted-foreground">{t("adm_sub_courses_label", "Khóa học")}</p>
                  <p className="font-semibold">{s.usage?.coursesCreated || 0}/{s.usage?.courseLimit || 0}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-2 bg-white/40 dark:bg-slate-900/30">
                  <p className="text-xs text-muted-foreground">{t("adm_sub_end_date", "Ngày hết hạn")}</p>
                  <p className="font-semibold">{s.endDate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur p-5 space-y-3 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
        <h2 className="text-xl font-semibold flex items-center gap-2"><BarChart3 size={18} /> {t("adm_sub_other_modules", "Các module quản trị khác")}</h2>
        <p className="text-sm text-muted-foreground">{t("adm_sub_other_desc", "Các mục theo yêu cầu hệ thống đã có sẵn trong Admin:")}</p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <ModulePill label={t("adm_sub_mod_courses", "Quản lý khóa học")} path="/admin/courses" />
          <ModulePill label={t("adm_sub_mod_categories", "Quản lý nội dung (categories)")} path="/admin/categories" />
          <ModulePill label={t("adm_sub_mod_reports", "Quản lý báo cáo")} path="/admin/reports" />
          <ModulePill label={t("adm_sub_mod_settings", "Cấu hình hệ thống")} path="/admin/settings" />
          <ModulePill label={t("adm_sub_mod_payments", "Thanh toán tổng hợp")} path="/admin/payments" />
        </div>
      </section>
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


