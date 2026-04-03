"use client"

import { Search, Download, Eye, DollarSign, TrendingUp, CreditCard, Clock, X, User, BookOpen } from "lucide-react"
import * as XLSX from "xlsx"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { formatPrice, formatNumber, formatCurrencyByLanguage } from "@/lib/format"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-context"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { useMetricChangeHighlight } from "@/hooks/use-metric-change-highlight"
import { MetricTrendBadge } from "@/components/ui/metric-trend-badge"

const PAYMENTS_REALTIME_MS = 15000

interface Payment {
  id: string
  user: string
  userEmail: string
  userPhone: string
  course: string
  courseId: string
  teacher: string
  teacherEmail: string
  amount: number
  method: string
  status: "success" | "pending" | "failed"
  date: string
  transactionId: string
  source?: "course" | "subscription"
}

interface PaymentStats {
  totalRevenue: number
  pendingTransactions: number
  completedTransactions: number
  failedTransactions: number
  totalTransactions: number
}

const normalizeStatus = (status?: string): Payment["status"] => {
  const normalized = status?.toLowerCase?.()
  if (normalized === "completed" || normalized === "success") return "success"
  if (normalized === "pending") return "pending"
  return "failed"
}

const normalizeMethod = (method?: string) => {
  if (!method) return "Other"
  return method.toUpperCase()
}

const normalizeDateISO = (value?: string) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }
  return date.toISOString()
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    totalTransactions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "pending" | "failed">("all")
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | HTMLButtonElement | null>>({})
  const exportButtonRef = useRef<HTMLButtonElement | null>(null)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [exportMenuPos, setExportMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  // Export filters
  const [exportStatus, setExportStatus] = useState<string>("all")
  const [exportUser, setExportUser] = useState<string>("all")
  const [exportCourse, setExportCourse] = useState<string>("all")
  const [exportTeacher, setExportTeacher] = useState<string>("all")
  const [exportDateFrom, setExportDateFrom] = useState<string>("")
  const [exportDateTo, setExportDateTo] = useState<string>("")
  const { t, language } = useLanguage()

  const loadPayments = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [listRes, statsRes, subscriptionPaymentRes] = await Promise.all([
        apiClient.getAdminPayments({ limit: 200 }),
        apiClient.getAdminPaymentStats(),
        apiClient.getAdminInstructorPayments(),
      ])

      const rawList = (listRes as any)?.data ?? listRes ?? []

      const coursePayments: Payment[] = Array.isArray(rawList)
        ? rawList.map((p: any) => {
            const student = p.student || {}
            const course = p.course || {}
            const teacher = course.teacher || {}
            const paidAt = p.paidAt || p.createdAt

            return {
              id: p.id || p.transactionId,
              transactionId: p.transactionId || p.id || "",
              user: student.name || t("common_unknown", "Không rõ"),
              userEmail: student.email || "",
              userPhone: student.phoneNumber || student.phone || "",
              course: course.title || t("common_unknown", "Không rõ"),
              courseId: course.id || "",
              teacher: teacher.name || "",
              teacherEmail: teacher.email || "",
              amount: Number(p.finalAmount ?? p.amount ?? 0),
              method: normalizeMethod(p.paymentMethod),
              status: normalizeStatus(p.status),
              date: normalizeDateISO(paidAt),
              source: "course",
            }
          })
        : []

      const subscriptionPayments: Payment[] = Array.isArray(subscriptionPaymentRes)
        ? subscriptionPaymentRes.map((p: any) => ({
            id: p.id || p.transactionId,
            transactionId: p.transactionId || p.id || "",
            user: p.teacher?.name || t("common_instructor", "Giảng viên"),
            userEmail: p.teacher?.email || "",
            userPhone: p.teacher?.phone || "",
            course: `${t("pay_package", "Gói")} ${p.plan?.name || "Subscription"}`,
            courseId: p.plan?.id || "",
            teacher: p.teacher?.name || "",
            teacherEmail: p.teacher?.email || "",
            amount: Number(p.amount ?? 0),
            method: normalizeMethod(p.paymentMethod),
            status: normalizeStatus(p.status),
            date: normalizeDateISO(p.paidAt || p.createdAt),
            source: "subscription",
          }))
        : []

      const mapped = [...coursePayments, ...subscriptionPayments].sort(
        (a, b) => +new Date(b.date) - +new Date(a.date),
      )

      setPayments(mapped)

      const derivedRevenue = mapped
        .filter((p) => p.status === "success")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)

      setStats({
        totalRevenue: Number(statsRes?.totalRevenue ?? derivedRevenue),
        pendingTransactions: Number(statsRes?.pendingTransactions ?? mapped.filter((p) => p.status === "pending").length),
        completedTransactions: Number(statsRes?.completedTransactions ?? mapped.filter((p) => p.status === "success").length),
        failedTransactions: Number(statsRes?.failedTransactions ?? mapped.filter((p) => p.status === "failed").length),
        totalTransactions: Number(statsRes?.totalTransactions ?? mapped.length),
      })
      setLastSyncedAt(new Date())
    } catch (error: any) {
      console.error("Error loading payments", error)
      const isTimeout = typeof error?.message === "string" && error.message.toLowerCase().includes("timeout")

      setPayments([])
      setStats({
        totalRevenue: 0,
        pendingTransactions: 0,
        completedTransactions: 0,
        failedTransactions: 0,
        totalTransactions: 0,
      })

      if (isTimeout) {
        toast.error(t("pay_load_timeout", "Kết nối quá thời gian, vui lòng thử lại."))
      } else {
        toast.error(t("pay_load_error", "Không thể tải dữ liệu thanh toán"))
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
    const timer = setInterval(() => {
      void loadPayments(true)
    }, PAYMENTS_REALTIME_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isExportOpen) return
    const updatePosition = () => {
      const rect = exportButtonRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuWidth = 420
      const left = Math.max(12, rect.right - menuWidth)
      setExportMenuPos({ top: rect.bottom + 8, left })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [isExportOpen])

  const uniqueCourses = useMemo(() => Array.from(new Set(payments.map((p) => p.course).filter(Boolean))), [payments])
  const uniqueUsers = useMemo(() => Array.from(new Set(payments.map((p) => p.user).filter(Boolean))), [payments])
  const uniqueTeachers = useMemo(() => Array.from(new Set(payments.map((p) => p.teacher).filter(Boolean))), [payments])

  const filteredPayments = useMemo(() => {
    const keyword = searchQuery.toLowerCase()
    return payments.filter(
      (payment) =>
        ((payment.id || "").toLowerCase().includes(keyword) ||
          (payment.user || "").toLowerCase().includes(keyword) ||
          (payment.course || "").toLowerCase().includes(keyword) ||
          (payment.teacher || "").toLowerCase().includes(keyword)) &&
        (statusFilter === "all" || payment.status === statusFilter),
    )
  }, [payments, searchQuery, statusFilter])

  const derivedRevenue = payments.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0)
  const totalRevenue = stats.totalRevenue || derivedRevenue
  const pendingAmount = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const successCount = stats.completedTransactions || payments.filter((p) => p.status === "success").length
  const totalTransactions = stats.totalTransactions || payments.length

  const paymentOverviewMetrics = {
    totalRevenue,
    pendingAmount,
    successCount,
    totalTransactions,
    pendingTransactions: stats.pendingTransactions,
    failedTransactions: stats.failedTransactions,
  }

  const { isChanged: isOverviewChanged, getTrend: getOverviewTrend } = useMetricChangeHighlight(paymentOverviewMetrics, {
    flashDurationMs: 1300,
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      return t("common_not_updated", "Chưa cập nhật")
    }

    return date.toLocaleDateString(language === "en" ? "en-US" : "vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleExport = () => {
    // Filter data based on export options
    let exportData = payments.filter(p => {
      if (exportStatus !== "all" && p.status !== exportStatus) return false
      if (exportUser !== "all" && p.user !== exportUser) return false
      if (exportCourse !== "all" && p.course !== exportCourse) return false
      if (exportTeacher !== "all" && p.teacher !== exportTeacher) return false
      if (exportDateFrom && new Date(p.date) < new Date(exportDateFrom)) return false
      if (exportDateTo && new Date(p.date) > new Date(exportDateTo)) return false
      return true
    })

    const headers = ["ID", t("pay_user", "Người dùng"), "Email", t("pay_course", "Khóa học"), t("pay_instructor", "Giảng viên"), t("pay_amount", "Số tiền"), t("pay_method", "Phương thức"), t("pay_status", "Trạng thái"), t("pay_date", "Ngày")]
    const rows = exportData.map((p) => [
      p.id,
      p.user,
      p.userEmail,
      p.course,
      p.teacher,
      p.amount.toString(),
      p.method,
      p.status === "success" ? t("pay_success", "Thành công") : p.status === "pending" ? t("pay_pending", "Chờ xử lý") : t("pay_failed", "Thất bại"),
      formatDate(p.date),
    ])

    const exportDate = new Date().toLocaleDateString("vi-VN")
    const bannerLines = [[t("pay_report_title", "Báo cáo: Thanh toán")], [`${t("pay_export_date", "Ngày xuất")}: ${exportDate}`]]
    const aoa = [...bannerLines, headers, ...rows]

    const worksheet = XLSX.utils.aoa_to_sheet(aoa)
    const colCount = Math.max(...aoa.map((row) => row.length))
    worksheet["!cols"] = Array.from({ length: colCount }, (_, colIndex) => {
      const maxLen = Math.max(
        ...aoa.map((row) => {
          const value = row[colIndex]
          return value === undefined || value === null ? 0 : String(value).length
        })
      )
      return { wch: Math.min(60, Math.max(10, maxLen + 2)) }
    })

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Thanh toán")
    XLSX.writeFile(workbook, `payments_report_${new Date().toISOString().split("T")[0]}.xlsx`)

    setIsExportOpen(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="h-[520px] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="w-full space-y-8">
        {/* Hero Section with Background */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 lg:p-10 animate-fadeIn border border-white/40 dark:border-slate-800/70 shadow-[0_20px_60px_rgba(15,23,42,0.18)] bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl"
          style={{ backgroundImage: "url('/image/bg_login.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/45 via-primary/25 to-accent/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/80" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-3 animate-slideDown" style={{ animationDelay: "0.1s" }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full bg-white/80 text-primary shadow-sm backdrop-blur">
                  {t("pay_label", "Thanh toán")}
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">{t("pay_manage_title", "Quản lý thanh toán")}</h1>
                  <p className="text-base text-white/85 max-w-2xl drop-shadow">{t("pay_manage_desc", "Theo dõi và quản lý các giao dịch thanh toán")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-white/90 text-primary text-sm font-semibold shadow-sm backdrop-blur">
                    {t("pay_total_transactions", "Tổng giao dịch")}: <AnimatedNumber value={totalTransactions} formatter={formatNumber} />
                  </span>
                  <span className="px-3 py-1 rounded-full bg-black/15 text-white text-sm font-medium backdrop-blur">
                    {t("pay_live_badge", "Cập nhật tức thời")}
                    {lastSyncedAt ? ` • ${lastSyncedAt.toLocaleTimeString("vi-VN")}` : ""}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center gap-3 animate-slideDown" style={{ animationDelay: "0.2s" }}>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/admin/payments/codes"
                    className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-white/90 text-primary text-sm font-semibold shadow-lg hover:shadow-xl transition-smooth backdrop-blur"
                  >
                    {t("pay_codes", "Mã thanh toán")}
                  </Link>
                  <button
                    ref={exportButtonRef}
                    onClick={() => setIsExportOpen(true)}
                    className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-white/90 text-primary text-sm font-semibold shadow-lg hover:shadow-xl transition-smooth backdrop-blur"
                  >
                    <Download size={16} /> {t("pay_export", "Xuất báo cáo")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200 text-xs font-semibold">
                    {t("pay_success_count", "Giao dịch thành công")}: <AnimatedNumber value={successCount} formatter={formatNumber} />
                  </span>
                  <span className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs font-semibold">
                    {t("pay_pending_total", "Đang chờ xử lý")}: <AnimatedNumber value={stats.pendingTransactions} formatter={formatNumber} />
                  </span>
                  <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200 text-xs font-semibold">
                    {t("pay_failed", "Thất bại")}: <AnimatedNumber value={stats.failedTransactions} formatter={formatNumber} />
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/35 dark:border-slate-800/60 bg-white/20 dark:bg-white/5 backdrop-blur-xl p-4 md:p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: "totalRevenue", label: t("pay_total_revenue", "Tổng doanh thu"), value: totalRevenue, formatter: (val: number) => formatCurrencyByLanguage(val, language), tone: "from-green-200/40 to-emerald-100/30", icon: DollarSign },
                  { key: "pendingAmount", label: t("pay_pending_total", "Đang chờ xử lý"), value: pendingAmount, formatter: (val: number) => formatCurrencyByLanguage(val, language), tone: "from-amber-200/45 to-yellow-100/35", icon: Clock },
                  { key: "successCount", label: t("pay_success_count", "Giao dịch thành công"), value: successCount, formatter: formatNumber, tone: "from-blue-200/45 to-indigo-100/35", icon: TrendingUp },
                  { key: "totalTransactions", label: t("pay_total_transactions", "Tổng giao dịch"), value: totalTransactions, formatter: formatNumber, tone: "from-purple-200/40 to-pink-100/35", icon: CreditCard },
                ].map(({ key, label, value, formatter, tone, icon: Icon }) => (
                  <div key={label} className={`group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border p-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-700 ${isOverviewChanged(key) ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/60 dark:border-slate-800"}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${tone} opacity-70 group-hover:opacity-90 transition-opacity duration-300`} />
                    <div className="relative flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          <AnimatedNumber value={value} formatter={formatter} disableAnimation={!isOverviewChanged(key)} />
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          {t("pay_live_badge", "Cập nhật tức thời")}
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
        </div>

        {/* Search & Filter */}
        <div className="relative z-50 bg-white/85 dark:bg-slate-900/55 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/70 rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400" size={20} />
            <input
              type="text"
              placeholder={t("pay_search_placeholder", "Tìm kiếm theo ID, người dùng, khóa học hoặc giảng viên...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary dark:focus:border-accent transition-all duration-300 text-foreground dark:text-white placeholder:text-muted-foreground/60 shadow-sm"
            />
          </div>
          <div className="filter-row gap-y-3 sm:gap-y-4">
            <span className="text-sm font-semibold text-foreground dark:text-white">{t("common_filter_by", "Lọc theo")}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="filter-select h-[46px] w-full sm:w-auto min-w-[220px] md:min-w-[240px] lg:min-w-[260px] rounded-xl px-4 text-sm"
            >
              <option value="all">{t("common_all", "Tất cả")}</option>
              <option value="success">{t("pay_success", "Thành công")}</option>
              <option value="pending">{t("pay_pending", "Chờ xử lý")}</option>
              <option value="failed">{t("pay_failed", "Thất bại")}</option>
            </select>

            <span className="rounded-full border border-emerald-200/80 dark:border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {filteredPayments.length}
            </span>

            {(searchQuery.trim() || statusFilter !== "all") ? (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                }}
                className="h-[46px] w-full sm:w-auto md:min-w-[132px] lg:min-w-[148px] inline-flex items-center justify-center px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {t("common_reset", "Đặt lại")}
              </button>
            ) : null}
          </div>
        </div>
{/* Payments Card â€“ Mobile & Small Tablet */}
<div className="block lg:hidden space-y-5 mb-6">
  {filteredPayments.map(payment => (
    <div
      key={payment.id}
      ref={(el) => { cardRefs.current[payment.id] = el; }}
      className="relative w-full rounded-2xl p-4 space-y-3 bg-white/90 dark:bg-slate-900/80 border border-border/70 dark:border-slate-800 shadow-[0_10px_28px_rgba(15,23,42,0.12)] backdrop-blur"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-semibold text-foreground dark:text-white leading-snug line-clamp-2">
            {payment.user}
          </p>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
            {payment.course}
          </p>
        </div>
        {/* STATUS BADGE */}
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
            payment.status === "success"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200/80 dark:border-green-800"
              : payment.status === "pending"
              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200 border-yellow-200/80 dark:border-yellow-800"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 border-red-200/80 dark:border-red-800"
          }`}
        >
          {payment.status === "success"
            ? t("pay_success", "Thành công")
            : payment.status === "pending"
            ? t("pay_pending", "Chờ xử lý")
            : t("pay_failed", "Thất bại")}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-slate-400">
        <User size={14} />
        <span className="truncate">{payment.teacher}</span>
      </div>

      <div className="text-xs text-muted-foreground dark:text-slate-500 truncate">
        {payment.userEmail || payment.userPhone}
      </div>

      {/* GRID INFO */}
      <div className="grid grid-cols-2 gap-3 text-sm pt-2">
        <div className="flex items-center gap-2">
          <span className="text-green-600 dark:text-green-300">{language === "vi" ? "â‚«" : "$"}</span>
          <span className="font-semibold text-foreground dark:text-white">{formatCurrencyByLanguage(payment.amount, language)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400">
          <CreditCard size={14} />
          <span>{payment.method}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400">
          <Clock size={14} />
          <span>{formatDate(payment.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400">
          <span className="text-purple-500">#</span>
          <span className="truncate">{payment.transactionId}</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between pt-3 border-t border-border/70 dark:border-slate-800">
        <span className="text-xs text-muted-foreground dark:text-slate-500">
          ID: {payment.id}
        </span>
        <button
          onClick={() => {
            const el = cardRefs.current[payment.id]
            if (!el) return
            const rect = el.getBoundingClientRect()
            setPopupPos({
              top: rect.bottom + window.scrollY + 8,
              left: rect.left + window.scrollX,
            })
            setExpandedPaymentId(payment.id)
          }}
          className="h-9 px-3.5 rounded-lg bg-primary/15 text-primary text-sm font-semibold hover:bg-primary/25 transition-smooth"
        >
          {t("pay_view_detail", "Xem chi tiết")}
        </button>
      </div>
    </div>
  ))}
</div>

      {/* Mobile popup detail â€“ anchored under card */}
      {expandedPaymentId && popupPos &&
        (() => {
          const payment = payments.find(p => p.id === expandedPaymentId)
          if (!payment) return null

          return createPortal(
            <div
              className="absolute z-[9999]"
              style={{
                top: popupPos.top,
                left: popupPos.left,
                width: "calc(100vw - 2rem)",
                maxWidth: 420,
              }}
            >
              <div className="bg-white/95 dark:bg-slate-900/95 border border-border/70 dark:border-slate-800 rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.25)] overflow-hidden backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/70 dark:border-slate-800">
                  <p className="text-foreground dark:text-white font-semibold text-base">{t("pay_transaction_detail", "Chi tiết giao dịch")}</p>
                  <button
                    onClick={() => setExpandedPaymentId(null)}
                    className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-border/60 dark:border-slate-700 hover:bg-secondary dark:hover:bg-slate-800"
                  >
                    <X size={18} className="text-muted-foreground" />
                  </button>
                </div>

                {/* Mã giao dịch + trạng thái */}
                <div className="p-4 pb-2 text-center border-b border-border/70 dark:border-slate-800">
                  <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("pay_transaction_id", "Mã giao dịch")}</p>
                  <p className="text-foreground dark:text-white font-bold text-base break-all">{payment.id}</p>
                  <div className="mt-2 flex justify-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      payment.status === "success"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200/80 dark:border-green-800"
                        : payment.status === "pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200 border border-yellow-200/80 dark:border-yellow-800"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 border border-red-200/80 dark:border-red-800"
                    }`}>
                      {payment.status === "success"
                        ? t("pay_success", "Thành công")
                        : payment.status === "pending"
                          ? t("pay_pending", "Chờ xử lý")
                          : t("pay_failed", "Thất bại")}
                    </span>
                  </div>
                </div>

                {/* Số tiền thanh toán */}
                <div className="p-4">
                  <div className="bg-primary/10 dark:bg-accent/10 rounded-xl p-4 text-center border border-primary/30 dark:border-accent/30">
                    <p className="text-muted-foreground dark:text-slate-400 text-xs">{t("pay_amount_label", "Số tiền thanh toán")}</p>
                    <p className="text-2xl font-extrabold text-primary dark:text-accent">{formatCurrencyByLanguage(payment.amount, language)}</p>
                  </div>
                </div>

                {/* Người mua */}
                <div className="px-4 pb-2">
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-border/60 dark:border-slate-700">
                    <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("pay_buyer", "Người mua")}</p>
                    <p className="text-foreground dark:text-white font-medium">{payment.user}</p>
                    {payment.userEmail && <p className="text-muted-foreground dark:text-slate-400 text-xs">{payment.userEmail}</p>}
                  </div>
                </div>

                {/* Khóa học + giảng viên */}
                <div className="px-4 pb-2">
                  <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-border/60 dark:border-slate-700">
                    <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("pay_course", "Khóa học")}</p>
                    <p className="text-foreground dark:text-white font-medium">{payment.course}</p>
                    {payment.teacher && <p className="text-muted-foreground dark:text-slate-400 text-xs">{t("pay_instructor", "Giảng viên")}: {payment.teacher}</p>}
                  </div>
                </div>

                {/* Phương thức + ngày thanh toán */}
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-border/60 dark:border-slate-700">
                      <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("pay_method", "Phương thức")}</p>
                      <p className="text-foreground dark:text-white text-xs font-medium break-all">{payment.method}</p>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-border/60 dark:border-slate-700">
                      <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("pay_date_label", "Ngày thanh toán")}</p>
                      <p className="text-foreground dark:text-white text-xs font-medium">{formatDate(payment.date)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        })()
      }
        {/* Payments Table */}
        <div className="hidden lg:block bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-border/70 dark:border-slate-800 rounded-2xl overflow-hidden shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-white/70 dark:bg-slate-800/60">
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wide text-xs">{t("pay_user", "Người dùng")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wide text-xs">{t("pay_course", "Khóa học")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wide text-xs">{t("pay_instructor", "Giảng viên")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wide text-xs">{t("pay_amount", "Số tiền")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wide text-xs">{t("pay_method", "Phương thức")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wide text-xs">{t("pay_status", "Trạng thái")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wide text-xs">{t("pay_date", "Ngày")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground dark:text-slate-300 uppercase tracking-wide text-xs">{t("pay_detail", "Chi tiết")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-foreground dark:text-white font-medium">{payment.user}</p>
                        <p className="text-muted-foreground dark:text-slate-400 text-xs">{payment.userEmail}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white max-w-[200px] truncate">
                      {payment.course}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">
                      {payment.teacher}
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white font-medium">
                      {formatCurrencyByLanguage(payment.amount, language)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-slate-800/60 border border-border/60 dark:border-slate-700 rounded-full text-foreground dark:text-white text-xs font-semibold">
                        <CreditCard size={14} className="text-primary" />
                        {payment.method}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === "success"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : payment.status === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {payment.status === "success"
                          ? t("pay_success", "Thành công")
                          : payment.status === "pending"
                            ? t("pay_pending", "Chờ xử lý")
                            : t("pay_failed", "Thất bại")}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{formatDate(payment.date)}</td>
                    <td className="py-4 px-6">
                      <button
                        ref={el => {
                          if (el) cardRefs.current[`${payment.id}-table-btn`] = el;
                        }}
                        onClick={() => {
                          const el = cardRefs.current[`${payment.id}-table-btn`]
                          if (!el) return
                          const rect = el.getBoundingClientRect()
                          const MODAL_WIDTH = 420
const GAP = 12

const viewportWidth = window.innerWidth

let left = rect.right + GAP

// Nếu tràn màn hình phải -> đẩy sang trái card
if (left + MODAL_WIDTH > viewportWidth) {
  left = rect.left - MODAL_WIDTH - GAP
}

// Nếu vẫn tràn bên trái -> clamp về trong viewport
if (left < GAP) {
  left = GAP
}

setPopupPos({
  top: rect.bottom + window.scrollY + GAP,
  left: left + window.scrollX,
})
                          setExpandedPaymentId(payment.id)
                        }}
                        className="h-10 w-10 inline-flex items-center justify-center hover:bg-secondary dark:hover:bg-slate-800 rounded-xl border border-border/60 dark:border-slate-700 transition-smooth"
                      >
                        <Eye size={18} className="text-primary dark:text-accent" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="py-12 text-center">
              <CreditCard size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">{t("pay_no_transactions", "Không tìm thấy giao dịch nào")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal for desktop/tablet - anchored under button */}
      {expandedPaymentId && popupPos &&
        (() => {
          const payment = payments.find(p => p.id === expandedPaymentId)
          if (!payment) return null
          return createPortal(
            <div
              className="absolute z-[9999]"
              style={{
                top: popupPos.top,
                left: popupPos.left,
                width: 420,
                maxWidth: "calc(100vw - 2rem)",
              }}
            >
              <div className="bg-white/95 dark:bg-slate-900/95 border border-border/70 dark:border-slate-800 rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.25)] max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-[10000] backdrop-blur-xl">
                <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 border-b border-border/70 dark:border-slate-800 p-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground dark:text-white">{t("pay_transaction_detail", "Chi tiết giao dịch")}</h2>
                  <button
                    onClick={() => setExpandedPaymentId(null)}
                    className="h-10 w-10 inline-flex items-center justify-center hover:bg-secondary dark:hover:bg-slate-800 rounded-xl border border-border/60 dark:border-slate-700 transition-smooth"
                  >
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Transaction ID */}
                  <div className="text-center pb-4 border-b border-border dark:border-slate-800">
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("pay_transaction_id", "Mã giao dịch")}</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white">{payment.id}</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                        payment.status === "success"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : payment.status === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {payment.status === "success"
                        ? t("pay_success", "Thành công")
                        : payment.status === "pending"
                          ? t("pay_pending", "Chờ xử lý")
                          : t("pay_failed", "Thất bại")}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="bg-primary/10 dark:bg-accent/10 rounded-xl p-4 text-center">
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("pay_amount_label", "Số tiền thanh toán")}</p>
                    <p className="text-3xl font-bold text-primary dark:text-accent">{formatCurrencyByLanguage(payment.amount, language)}</p>
                  </div>

                  {/* User Info */}
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={16} className="text-primary dark:text-accent" />
                      <span className="font-semibold text-foreground dark:text-white">{t("pay_buyer_info", "Thông tin người mua")}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-foreground dark:text-white font-medium">{payment.user}</p>
                      <p className="text-muted-foreground dark:text-slate-400">{payment.userEmail}</p>
                      <p className="text-muted-foreground dark:text-slate-400">{payment.userPhone}</p>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen size={16} className="text-primary dark:text-accent" />
                      <span className="font-semibold text-foreground dark:text-white">{t("pay_course_info", "Thông tin khóa học")}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-foreground dark:text-white font-medium">{payment.course}</p>
                      <p className="text-muted-foreground dark:text-slate-400">{t("pay_course_id", "Mã khóa học")}: {payment.courseId}</p>
                      <p className="text-muted-foreground dark:text-slate-400">{t("pay_instructor", "Giảng viên")}: {payment.teacher}</p>
                    </div>
                  </div>

                  {/* Transaction Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                      <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("pay_method", "Phương thức")}</p>
                      <p className="text-foreground dark:text-white font-medium">{payment.method}</p>
                    </div>
                    <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                      <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("pay_date_label", "Ngày thanh toán")}</p>
                      <p className="text-foreground dark:text-white font-medium">{formatDate(payment.date)}</p>
                    </div>
                  </div>

                  {/* Transaction Reference */}
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("pay_ref_id", "Mã tham chiếu giao dịch")}</p>
                    <p className="text-foreground dark:text-white text-sm font-medium">{payment.transactionId}</p>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        })()
      }

      {/* Export panel */}
      {isExportOpen && exportMenuPos && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed z-[9999]"
              style={{ top: exportMenuPos.top, left: exportMenuPos.left, width: 460, maxWidth: "calc(100vw - 24px)" }}
            >
              <div className="bg-white/95 dark:bg-slate-900/95 border border-border/70 dark:border-slate-800 rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.25)] w-full max-h-[90vh] overflow-y-auto relative z-[10000] backdrop-blur-xl">
                <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 border-b border-border/70 dark:border-slate-800 p-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground dark:text-white">{t("pay_export", "Xuất báo cáo")}</h2>
                  <button onClick={() => setIsExportOpen(false)} className="h-10 w-10 inline-flex items-center justify-center hover:bg-secondary dark:hover:bg-slate-800 rounded-xl border border-border/60 dark:border-slate-700 transition-smooth">
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">{t("pay_export_desc", "Lọc dữ liệu trước khi xuất Excel.")}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">{t("pay_status", "Trạng thái")}</label>
                      <select
                        value={exportStatus}
                        onChange={(e) => setExportStatus(e.target.value)}
                        className="w-full rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      >
                        <option value="all">{t("common_all", "Tất cả")}</option>
                        <option value="success">{t("pay_success", "Thành công")}</option>
                        <option value="pending">{t("pay_pending", "Chờ xử lý")}</option>
                        <option value="failed">{t("pay_failed", "Thất bại")}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">{t("pay_user", "Người dùng")}</label>
                      <select
                        value={exportUser}
                        onChange={(e) => setExportUser(e.target.value)}
                        className="w-full rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      >
                        <option value="all">{t("common_all", "Tất cả")}</option>
                        {uniqueUsers.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">{t("pay_course", "Khóa học")}</label>
                      <select
                        value={exportCourse}
                        onChange={(e) => setExportCourse(e.target.value)}
                        className="w-full rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      >
                        <option value="all">{t("common_all", "Tất cả")}</option>
                        {uniqueCourses.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">{t("pay_instructor", "Giảng viên")}</label>
                      <select
                        value={exportTeacher}
                        onChange={(e) => setExportTeacher(e.target.value)}
                        className="w-full rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      >
                        <option value="all">{t("common_all", "Tất cả")}</option>
                        {uniqueTeachers.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">{t("pay_date_from", "Từ ngày")}</label>
                      <input
                        type="date"
                        value={exportDateFrom}
                        onChange={(e) => setExportDateFrom(e.target.value)}
                        className="w-full rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">{t("pay_date_to", "Đến ngày")}</label>
                      <input
                        type="date"
                        value={exportDateTo}
                        onChange={(e) => setExportDateTo(e.target.value)}
                        className="w-full rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleExport}
                    className="w-full h-11 px-6 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-smooth flex items-center justify-center gap-2"
                  >
                    <Download size={20} /> {t("pay_export", "Xuất báo cáo")}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
 </div>  
  )}

