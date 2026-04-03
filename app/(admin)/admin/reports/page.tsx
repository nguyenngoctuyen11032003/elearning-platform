"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Users, BookOpen, DollarSign, Download, X, TrendingUp } from "lucide-react"
import * as XLSX from "xlsx"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency, formatNumber, formatStudentCount } from "@/lib/format"
import { StatCard } from "@/components/ui/stat-card"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { autoTranslateData } from "@/lib/i18n/dynamic-translate"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { useMetricChangeHighlight } from "@/hooks/use-metric-change-highlight"
import { MetricTrendBadge } from "@/components/ui/metric-trend-badge"

// Types mirror backend admin report DTOs
type RevenueByMonth = { month: string; revenue: number; orders: number; growth: number }
type RevenueByCategory = { categoryName: string; revenue: number; orderCount: number; percentage: number }
type CoursePerformance = { courseId: string; courseTitle: string; teacherName: string; enrollments: number; revenue: number; averageRating: number; completionRate: number }
type CategoryRate = { categoryName: string; totalEnrollments: number; completedEnrollments: number; completionRate: number }
type GrowthPoint = { month: string; teachers: number; students: number }

// Color palette for charts
const pieColors = ["#2563eb", "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#14b8a6", "#6366f1"]

const sampleRevenueByMonth: RevenueByMonth[] = [
  { month: "2025-01", revenue: 32000000, orders: 120, growth: 5 },
  { month: "2025-02", revenue: 38000000, orders: 136, growth: 18 },
  { month: "2025-03", revenue: 42000000, orders: 150, growth: 11 },
  { month: "2025-04", revenue: 47000000, orders: 165, growth: 12 },
  { month: "2025-05", revenue: 52000000, orders: 178, growth: 11 },
  { month: "2025-06", revenue: 56000000, orders: 190, growth: 8 },
]

const sampleRevenueByCategory: RevenueByCategory[] = [
  { categoryName: "An ninh mạng", revenue: 32000000, orderCount: 110, percentage: 35 },
  { categoryName: "Lập trình", revenue: 28000000, orderCount: 95, percentage: 30 },
  { categoryName: "Cloud", revenue: 20000000, orderCount: 70, percentage: 22 },
  { categoryName: "Khác", revenue: 8000000, orderCount: 30, percentage: 13 },
]

const sampleGrowth: GrowthPoint[] = [
  { month: "2025-01", teachers: 12, students: 220 },
  { month: "2025-02", teachers: 15, students: 260 },
  { month: "2025-03", teachers: 18, students: 300 },
  { month: "2025-04", teachers: 20, students: 340 },
  { month: "2025-05", teachers: 22, students: 380 },
  { month: "2025-06", teachers: 24, students: 420 },
]

const REPORTS_REALTIME_MS = 30000

const isSameData = <T,>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b)

export default function AdminReportsPage() {
  const { t, language } = useLanguage()
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState("revenue")
  const [filterPeriod, setFilterPeriod] = useState("month")
  const [exportAnchor, setExportAnchor] = useState<HTMLButtonElement | null>(null)
  const [exportMenuPos, setExportMenuPos] = useState<{ top: number; left: number } | null>(null)

  const [loading, setLoading] = useState(true)
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([])
  const [revenueByCategory, setRevenueByCategory] = useState<RevenueByCategory[]>([])
  const [coursePerformance, setCoursePerformance] = useState<CoursePerformance[]>([])
  const [completionRates, setCompletionRates] = useState<CategoryRate[]>([])
  const [growthChart, setGrowthChart] = useState<GrowthPoint[]>([])
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  const [totals, setTotals] = useState({
    totalRevenue: 0,
    platformRevenue: 0,
    teacherRevenue: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalUsers: 0,
  })

  useEffect(() => {
    const load = async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        // Don't translate report data
        const localizedRevenueByCategory = sampleRevenueByCategory

        const [revenueReport, userReport, performanceReport, dashboardStats, growthStats] = await Promise.all([
          apiClient.getAdminRevenueReport(),
          apiClient.getAdminUserReport(),
          apiClient.getAdminPerformanceReport(),
          apiClient.getAdminDashboardStats(),
          apiClient.getAdminGrowthStats(),
        ])

        // Determine if we have real data from database
        const hasPayments = Boolean(revenueReport?.revenueByMonth?.length)
        const hasCourses = Array.isArray(performanceReport?.topPerformingCourses)
        const hasCompletion = Array.isArray(performanceReport?.completionRates)

        const teacherSeries = Array.isArray(growthStats?.teachersByMonth) ? growthStats.teachersByMonth : []
        const studentSeries = Array.isArray(growthStats?.studentsByMonth) ? growthStats.studentsByMonth : []
        const monthSet = new Set<string>([...teacherSeries.map((m: any) => m.month), ...studentSeries.map((s: any) => s.month)])
        const mergedGrowth = Array.from(monthSet)
          .sort()
          .map((month) => {
            const t = teacherSeries.find((m: any) => m.month === month)
            const s = studentSeries.find((m: any) => m.month === month)
            return {
              month,
              teachers: Number(t?.count ?? 0),
              students: Number(s?.count ?? 0),
            }
          })
        const hasGrowth = mergedGrowth.some((item) => item.teachers > 0 || item.students > 0)

        // Set chart data - prefer real DB data
        const nextRevenueByMonth = hasPayments ? revenueReport.revenueByMonth : sampleRevenueByMonth
        const nextRevenueByCategory = hasPayments ? revenueReport.revenueByCategory : localizedRevenueByCategory
        const nextCoursePerformance = hasCourses ? performanceReport.topPerformingCourses : []
        const nextCompletionRates = hasCompletion ? performanceReport.completionRates : []
        const nextGrowthChart = hasGrowth ? mergedGrowth : sampleGrowth

        setRevenueByMonth((prev) => (isSameData(prev, nextRevenueByMonth) ? prev : nextRevenueByMonth))
        setRevenueByCategory((prev) => (isSameData(prev, nextRevenueByCategory) ? prev : nextRevenueByCategory))
        setCoursePerformance((prev) => (isSameData(prev, nextCoursePerformance) ? prev : nextCoursePerformance))
        setCompletionRates((prev) => (isSameData(prev, nextCompletionRates) ? prev : nextCompletionRates))
        setGrowthChart((prev) => (isSameData(prev, nextGrowthChart) ? prev : nextGrowthChart))

        // Helper function to safely convert to number
        const toNumber = (val: any): number => {
          const num = Number(val)
          return isNaN(num) ? 0 : Math.round(num)
        }

        // Set totals - prefer real DB data, ensure proper number conversion
        const nextTotals = {
          totalRevenue: hasPayments ? toNumber(revenueReport.totalRevenue) : sampleRevenueByMonth.reduce((s, i) => s + i.revenue, 0),
          platformRevenue: hasPayments ? toNumber(revenueReport.platformRevenue) : sampleRevenueByMonth.reduce((s, i) => s + i.revenue, 0) * 0.3,
          teacherRevenue: hasPayments ? toNumber(revenueReport.teacherRevenue) : sampleRevenueByMonth.reduce((s, i) => s + i.revenue, 0) * 0.7,
          totalTeachers: toNumber(dashboardStats?.totalTeachers || sampleGrowth[sampleGrowth.length - 1].teachers),
          totalStudents: toNumber(dashboardStats?.totalStudents || sampleGrowth[sampleGrowth.length - 1].students),
          totalCourses: toNumber(dashboardStats?.totalCourses || performanceReport?.topPerformingCourses?.length || 0),
          totalUsers: toNumber(userReport?.totalUsers || sampleGrowth[sampleGrowth.length - 1].students + sampleGrowth[sampleGrowth.length - 1].teachers),
        }
        setTotals((prev) => (isSameData(prev, nextTotals) ? prev : nextTotals))
        setLastSyncedAt(new Date())
      } catch (error) {
        console.error("Error loading reports", error)
        toast.error(t("adm_rpt_load_fail", "Không thể tải báo cáo. Vui lòng thử lại."))
      } finally {
        if (!silent) setLoading(false)
      }
    }

    load()
    const timer = setInterval(() => {
      void load(true)
    }, REPORTS_REALTIME_MS)

    return () => clearInterval(timer)
  }, [language])

  useEffect(() => {
    if (!isExportOpen || !exportAnchor) return
    const updatePosition = () => {
  const rect = exportAnchor.getBoundingClientRect()
  const menuWidth = 420
  const margin = 8

  let left = rect.left + rect.width / 2 - menuWidth / 2

  // Chặn tràn trái
  if (left < margin) left = margin

  // Chặn tràn phải
  if (left + menuWidth > window.innerWidth - margin) {
    left = window.innerWidth - menuWidth - margin
  }

  setExportMenuPos({
    top: rect.bottom + 8 + window.scrollY,
    left: left + window.scrollX,
  })
}

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [isExportOpen, exportAnchor])

  const categoryData = useMemo(
    () =>
      revenueByCategory.map((c, idx) => ({
        name: c.categoryName || "Khác",
        value: Number(c.percentage || 0),
        fill: pieColors[idx % pieColors.length],
      })),
    [revenueByCategory]
  )

  const chartData = useMemo(() => {
    if (filterPeriod === "month" || filterPeriod === "year") return revenueByMonth
    return revenueByMonth.slice(-6)
  }, [filterPeriod, revenueByMonth])

  const periodLabel = filterPeriod === "day"
    ? t("adm_rpt_day", "Ngày")
    : filterPeriod === "week"
      ? t("adm_rpt_week", "Tuần")
      : filterPeriod === "month"
        ? t("adm_rpt_month", "Tháng")
        : t("adm_rpt_year", "Năm")

  const teacherGrowth = growthChart.map((g) => ({ month: g.month, teachers: g.teachers }))
  const studentGrowth = growthChart.map((g) => ({ month: g.month, students: g.students }))

  const reportOverviewMetrics = {
    totalRevenue: totals.totalRevenue,
    totalTeachers: totals.totalTeachers,
    totalStudents: totals.totalStudents,
    totalCourses: totals.totalCourses,
    platformRevenue: totals.platformRevenue,
    teacherRevenue: totals.teacherRevenue,
    totalUsers: totals.totalUsers,
    teacherGrowth: teacherGrowth.at(-1)?.teachers || 0,
    studentGrowth: studentGrowth.at(-1)?.students || 0,
  }

  const { isChanged: isOverviewChanged, getTrend: getOverviewTrend } = useMetricChangeHighlight(reportOverviewMetrics, {
    flashDurationMs: 1300,
  })

  const handleExport = (reportType: string, anchor: HTMLButtonElement) => {
    setSelectedReport(reportType)
    setExportAnchor(anchor)
    setIsExportOpen(true)
  }

  const executeExport = () => {
    let data: any[] = []
    let headers: string[] = []

    if (selectedReport === "revenue") {
      headers = [t("adm_rpt_xl_period", "Kỳ"), t("adm_rpt_xl_revenue", "Doanh thu"), t("adm_rpt_xl_orders", "Đơn hàng"), t("adm_rpt_xl_growth", "Tăng trưởng (%)")]
      data = revenueByMonth.map((r) => [r.month, r.revenue, r.orders, r.growth])
    } else if (selectedReport === "courses") {
      headers = [t("adm_rpt_xl_course", "Khóa học"), t("adm_rpt_xl_instructor", "Giảng viên"), t("adm_rpt_xl_students", "Học viên"), t("adm_rpt_xl_revenue", "Doanh thu"), t("adm_rpt_xl_rating", "Đánh giá"), t("adm_rpt_xl_completion", "Hoàn thành (%)")]
      data = coursePerformance.map((c) => [c.courseTitle, c.teacherName, c.enrollments, c.revenue, c.averageRating, c.completionRate])
    } else if (selectedReport === "category") {
      headers = [t("adm_rpt_xl_category", "Danh mục"), t("adm_rpt_xl_revenue", "Doanh thu"), t("adm_rpt_xl_orders", "Đơn hàng"), t("adm_rpt_xl_ratio", "Tỷ lệ (%)")]
      data = revenueByCategory.map((c) => [c.categoryName, c.revenue, c.orderCount, c.percentage])
    } else if (selectedReport === "teachers" || selectedReport === "students") {
      headers = [t("adm_rpt_xl_time", "Thời gian"), selectedReport === "teachers" ? t("adm_rpt_xl_teachers", "Giáo viên") : t("adm_rpt_xl_students", "Học viên")]
      const src = selectedReport === "teachers" ? teacherGrowth : studentGrowth
      data = src.map((r) => [
        r.month,
        selectedReport === "teachers"
          ? (typeof (r as { teachers: number }).teachers === "number" ? (r as { teachers: number }).teachers : 0)
          : (typeof (r as { students: number }).students === "number" ? (r as { students: number }).students : 0)
      ])
    }

    const reportName =
      selectedReport === "revenue"
        ? t("adm_rpt_name_revenue", "Báo cáo doanh thu")
        : selectedReport === "category"
          ? t("adm_rpt_name_category", "Báo cáo danh mục")
          : selectedReport === "teachers"
            ? t("adm_rpt_name_teachers", "Báo cáo giáo viên")
            : selectedReport === "students"
              ? t("adm_rpt_name_students", "Báo cáo học viên")
              : t("adm_rpt_name_courses", "Báo cáo khóa học")
    const exportDate = new Date().toLocaleDateString("vi-VN")
    const bannerLines = [[`${t("adm_rpt_xl_report", "Báo cáo")}: ${reportName}`], [`${t("adm_rpt_xl_export_date", "Ngày xuất")}: ${exportDate}`]]
    const aoa = [...bannerLines, headers, ...data]

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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bao cao")
    XLSX.writeFile(workbook, `${selectedReport}_report_${new Date().toISOString().split("T")[0]}.xlsx`)

    setIsExportOpen(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="w-full space-y-8">
        <div
          className="relative overflow-hidden rounded-3xl p-8 lg:p-10 animate-fadeIn border border-white/40 dark:border-slate-800/70 shadow-[0_20px_60px_rgba(15,23,42,0.18)] bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl"
          style={{ backgroundImage: "url('/image/bg_login.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/45 via-primary/25 to-accent/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/80" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-3 animate-slideDown" style={{ animationDelay: "0.1s" }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full bg-white/80 text-primary shadow-sm backdrop-blur">
                  {t("adm_rpt_label", "Báo cáo")}
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">{t("adm_rpt_title", "Báo cáo & Phân tích")}</h1>
                  <p className="text-base text-white/85 max-w-2xl drop-shadow">{t("adm_rpt_subtitle", "Xem chi tiết hiệu suất nền tảng")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-white/90 text-primary text-sm font-semibold shadow-sm backdrop-blur">
                    {t("adm_rpt_period_chip", "Kỳ đang xem")}: {periodLabel}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-black/15 text-white text-sm font-medium backdrop-blur">
                    {t("adm_rpt_live", "Dữ liệu cập nhật tức thời")}
                    {lastSyncedAt ? ` • ${lastSyncedAt.toLocaleTimeString("vi-VN")}` : ""}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center gap-3 animate-slideDown" style={{ animationDelay: "0.2s" }}>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "day", label: t("adm_rpt_day", "Ngày") },
                    { value: "week", label: t("adm_rpt_week", "Tuần") },
                    { value: "month", label: t("adm_rpt_month", "Tháng") },
                    { value: "year", label: t("adm_rpt_year", "Năm") },
                  ].map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setFilterPeriod(period.value)}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 backdrop-blur-sm shadow-sm ${
                        filterPeriod === period.value
                          ? "bg-white text-primary border-white shadow-lg scale-[1.02]"
                          : "bg-white/20 text-white border-white/40 hover:bg-white/30"
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={(event) => handleExport("revenue", event.currentTarget)}
                  className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-white/90 text-primary text-sm font-semibold shadow-lg hover:shadow-xl transition-colors backdrop-blur"
                >
                  <Download size={16} /> {t("adm_rpt_export", "Xuất báo cáo")}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/35 dark:border-slate-800/60 bg-white/20 dark:bg-white/5 backdrop-blur-xl p-4 md:p-5 shadow-[0_10px_28px_rgba(15,23,42,0.12)] space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: "totalRevenue", label: t("adm_rpt_total_revenue", "Tổng doanh thu"), value: totals.totalRevenue, formatter: (val: number) => formatCurrency(Math.round(val)), tone: "from-primary/20 to-accent/25", icon: DollarSign },
                  { key: "totalTeachers", label: t("adm_rpt_total_teachers", "Tổng giáo viên"), value: totals.totalTeachers, formatter: formatNumber, tone: "from-purple-200/30 to-blue-200/30", icon: Users },
                  { key: "totalStudents", label: t("adm_rpt_total_students", "Tổng học viên"), value: totals.totalStudents, formatter: formatNumber, tone: "from-green-200/25 to-teal-200/30", icon: TrendingUp },
                  { key: "totalCourses", label: t("adm_rpt_courses", "Khóa học"), value: totals.totalCourses, formatter: formatNumber, tone: "from-orange-200/30 to-yellow-200/25", icon: BookOpen },
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
                          {t("adm_rpt_period_update", "Cập nhật theo kỳ")}
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

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { key: "platformRevenue", label: t("adm_rpt_platform_rev", "Doanh thu nền tảng"), value: totals.platformRevenue, formatter: (val: number) => formatCurrency(Math.round(val)), tone: "from-primary/15 to-primary/5" },
                  { key: "teacherRevenue", label: t("adm_rpt_teacher_rev", "Doanh thu giáo viên"), value: totals.teacherRevenue, formatter: (val: number) => formatCurrency(Math.round(val)), tone: "from-emerald-100/40 to-green-100/30" },
                  { key: "totalUsers", label: t("adm_rpt_total_users", "Tổng người dùng"), value: totals.totalUsers, formatter: formatNumber, tone: "from-indigo-100/40 to-indigo-50/50" },
                  { key: "teacherGrowth", label: t("adm_rpt_growth_teachers", "Tăng trưởng GV"), value: teacherGrowth.at(-1)?.teachers || 0, formatter: formatNumber, suffix: ` ${t("adm_rpt_person", "người")}`, tone: "from-purple-100/40 to-blue-100/30" },
                  { key: "studentGrowth", label: t("adm_rpt_growth_students", "Tăng trưởng HV"), value: studentGrowth.at(-1)?.students || 0, formatter: formatNumber, suffix: ` ${t("adm_rpt_person", "người")}`, tone: "from-cyan-100/35 to-teal-100/25" },
                ].map((item) => (
                  <div key={item.label} className={`relative overflow-hidden rounded-xl px-3 py-3 bg-white/75 dark:bg-slate-900/70 border shadow-sm backdrop-blur transition-all duration-700 ${isOverviewChanged(item.key) ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/35 dark:ring-emerald-500/25" : "border-white/60 dark:border-slate-800"}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.tone} opacity-70`} />
                    <div className="relative space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-slate-600 dark:text-slate-300 font-semibold">{item.label}</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        <AnimatedNumber value={item.value} formatter={item.formatter} suffix={item.suffix} disableAnimation={!isOverviewChanged(item.key)} />
                      </p>
                      <MetricTrendBadge trend={getOverviewTrend(item.key)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-border/70 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <div className="flex items-start justify-between mb-6 gap-3">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground dark:text-white">{t("adm_rpt_revenue_chart", "Biểu đồ doanh thu")}</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  {filterPeriod === "day" ? t("adm_rpt_last_7_days", "7 ngày gần nhất") : filterPeriod === "week" ? t("adm_rpt_this_week", "Tuần này") : filterPeriod === "month" ? t("adm_rpt_12_months", "12 tháng") : t("adm_rpt_full_year", "Cả năm")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{periodLabel}</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 text-xs font-semibold">
                    {t("adm_rpt_total_revenue", "Tổng doanh thu")}: {formatCurrency(Math.round(totals.totalRevenue))}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(event) => handleExport("revenue", event.currentTarget)}
                  className="h-10 w-10 inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-border/60 dark:border-slate-700"
                >
                  <Download size={18} className="text-muted-foreground dark:text-slate-400" />
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey={filterPeriod === "day" ? "date" : filterPeriod === "week" ? "day" : "month"} stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} name={t("adm_rpt_legend_revenue", "Doanh thu")} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                <Line type="monotone" dataKey="orders" stroke="#16a34a" strokeWidth={2} name={t("adm_rpt_legend_orders", "Đơn hàng")} isAnimationActive animationDuration={900} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-border/70 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <div className="flex items-start justify-between mb-6 gap-3">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground dark:text-white">{t("adm_rpt_category_dist", "Phân bố theo danh mục")}</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_rpt_category_revenue", "Tỷ lệ doanh thu theo danh mục")}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 text-xs font-semibold">
                    {t("adm_rpt_th_category", "Danh mục")}: {revenueByCategory.length}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/60 dark:bg-white/10 text-xs font-semibold text-foreground dark:text-white border border-border/60 dark:border-slate-700">
                    {t("adm_rpt_total_revenue", "Tổng doanh thu")}: {formatCurrency(revenueByCategory.reduce((s, c) => s + (c.revenue || 0), 0))}
                  </span>
                </div>
              </div>
              <button
                onClick={(event) => handleExport("category", event.currentTarget)}
                className="h-10 w-10 inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-border/60 dark:border-slate-700"
              >
                <Download size={18} className="text-muted-foreground dark:text-slate-400" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-border/70 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <div className="flex items-start justify-between mb-6 gap-3">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground dark:text-white">{t("adm_rpt_teacher_growth", "Tăng trưởng giáo viên")}</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_rpt_teacher_growth_desc", "Số lượng giáo viên theo thời gian")}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200 text-xs font-semibold">
                    {t("adm_rpt_total_teachers", "Tổng giáo viên")}: {formatNumber(totals.totalTeachers)}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/60 dark:bg-white/10 text-xs font-semibold text-foreground dark:text-white border border-border/60 dark:border-slate-700">
                    {t("adm_rpt_growth_teachers", "Tăng trưởng GV")}: {formatNumber(teacherGrowth.at(-1)?.teachers || 0)}
                  </span>
                </div>
              </div>
              <button
                onClick={(event) => handleExport("teachers", event.currentTarget)}
                className="h-10 w-10 inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-border/60 dark:border-slate-700"
              >
                <Download size={18} className="text-muted-foreground dark:text-slate-400" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={teacherGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="teachers" stroke="#8b5cf6" strokeWidth={2} name={t("adm_rpt_legend_teachers", "Giáo viên")} isAnimationActive animationDuration={900} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-border/70 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
            <div className="flex items-start justify-between mb-6 gap-3">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground dark:text-white">{t("adm_rpt_student_growth", "Tăng trưởng học viên")}</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_rpt_student_growth_desc", "Số lượng học viên theo thời gian")}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-200 text-xs font-semibold">
                    {t("adm_rpt_total_students", "Tổng học viên")}: {formatNumber(totals.totalStudents)}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/60 dark:bg-white/10 text-xs font-semibold text-foreground dark:text-white border border-border/60 dark:border-slate-700">
                    {t("adm_rpt_growth_students", "Tăng trưởng HV")}: {formatNumber(studentGrowth.at(-1)?.students || 0)}
                  </span>
                </div>
              </div>
              <button
                onClick={(event) => handleExport("students", event.currentTarget)}
                className="h-10 w-10 inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-border/60 dark:border-slate-700"
              >
                <Download size={18} className="text-muted-foreground dark:text-slate-400" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
                <Legend />
                <Bar dataKey="students" fill="#06b6d4" name={t("adm_rpt_legend_students", "Học viên")} radius={[8, 8, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-border/70 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
          <div className="flex items-start justify-between mb-6 gap-3">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground dark:text-white">{t("adm_rpt_course_perf", "Hiệu suất khóa học")}</h2>
              <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_rpt_course_perf_desc", "Thống kê chi tiết theo khóa học")}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{t("adm_rpt_courses", "Khóa học")}: {coursePerformance.length}</span>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 text-xs font-semibold">{t("adm_rpt_total_revenue", "Tổng doanh thu")}: {formatCurrency(coursePerformance.reduce((s, c) => s + (c.revenue || 0), 0))}</span>
              </div>
            </div>
            <button
              onClick={(event) => handleExport("courses", event.currentTarget)}
              className="inline-flex h-10 items-center gap-2 px-4 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-xl transition-colors hover:shadow-lg shadow-primary/30"
            >
              <Download size={16} /> {t("adm_rpt_export", "Xuất báo cáo")}
            </button>
          </div>
          
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800">
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">{t("adm_rpt_th_course", "Khóa học")}</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">{t("adm_rpt_th_instructor", "Giảng viên")}</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">{t("adm_rpt_th_students", "Học viên")}</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">{t("adm_rpt_th_rating", "Đánh giá")}</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">{t("adm_rpt_th_completion", "Hoàn thành")}</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">{t("adm_rpt_th_revenue", "Doanh thu")}</th>
                </tr>
              </thead>
              <tbody>
                {coursePerformance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-center text-muted-foreground">{t("adm_rpt_no_data", "Chưa có dữ liệu")}</td>
                  </tr>
                )}
                {coursePerformance.map((course) => (
                  <tr
                    key={course.courseId}
                    className="border-b border-border dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground dark:text-white font-medium">{course.courseTitle}</td>
                    <td className="py-3 px-4 text-muted-foreground dark:text-slate-400">{course.teacherName}</td>
                    <td className="py-3 px-4 text-foreground dark:text-white">{formatStudentCount(course.enrollments)}</td>
                    <td className="py-3 px-4 text-foreground dark:text-white">{course.averageRating?.toFixed(1) || "-"}</td>
                    <td className="py-3 px-4 text-foreground dark:text-white">{`${course.completionRate?.toFixed(1) || 0}%`}</td>
                    <td className="py-3 px-4 text-primary dark:text-accent font-semibold">{formatCurrency(course.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:hidden">
            {coursePerformance.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground">{t("adm_rpt_no_data", "Chưa có dữ liệu")}</div>
            ) : (
              coursePerformance.map((course) => (
                <div
                  key={course.courseId}
                  className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.14)]"
                >
                  <div>
                    <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 mb-1">{t("adm_rpt_th_course", "Khóa học")}</p>
                    <p className="text-sm font-semibold text-foreground dark:text-white line-clamp-2">{course.courseTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 mb-1">{t("adm_rpt_th_instructor", "Giảng viên")}</p>
                    <p className="text-sm text-foreground dark:text-white">{course.teacherName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">{t("adm_rpt_th_students", "Học viên")}</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatStudentCount(course.enrollments)}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">{t("adm_rpt_th_rating", "Đánh giá")}</p>
                      <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{course.averageRating?.toFixed(1) || "-"}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">{t("adm_rpt_th_completion", "Hoàn thành")}</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">{course.completionRate?.toFixed(1) || 0}%</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">{t("adm_rpt_th_revenue", "Doanh thu")}</p>
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatCurrency(course.revenue)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-border/70 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
          <div className="flex items-start justify-between mb-6 gap-3">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground dark:text-white">{t("adm_rpt_completion_rate", "Tỷ lệ hoàn thành theo danh mục")}</h2>
              <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_rpt_completion_desc", "Theo dõi mức độ hoàn thành của học viên")}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-100 text-xs font-semibold">
                  {t("adm_rpt_th_category", "Danh mục")}: {completionRates.length}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/60 dark:bg-white/10 text-xs font-semibold text-foreground dark:text-white border border-border/60 dark:border-slate-700">
                  {t("adm_rpt_total_students", "Tổng học viên")}: {formatNumber(totals.totalStudents)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800">
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">{t("adm_rpt_th_category", "Danh mục")}</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">{t("adm_rpt_th_enrollments", "Tổng ghi danh")}</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">{t("adm_rpt_th_completion", "Hoàn thành")}</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">{t("adm_rpt_th_ratio", "Tỷ lệ")}</th>
                </tr>
              </thead>
              <tbody>
                {completionRates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 px-4 text-center text-muted-foreground">{t("adm_rpt_no_data", "Chưa có dữ liệu")}</td>
                  </tr>
                )}
                {completionRates.map((item) => (
                  <tr key={item.categoryName} className="border-b border-border dark:border-slate-800">
                    <td className="py-3 px-4 text-foreground dark:text-white font-medium">{item.categoryName}</td>
                    <td className="py-3 px-4 text-foreground dark:text-white">{formatStudentCount(item.totalEnrollments)}</td>
                    <td className="py-3 px-4 text-foreground dark:text-white">{formatStudentCount(item.completedEnrollments)}</td>
                    <td className="py-3 px-4 text-foreground dark:text-white">{`${item.completionRate?.toFixed(1) || 0}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:hidden">
            {completionRates.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground">{t("adm_rpt_no_data", "Chưa có dữ liệu")}</div>
            ) : (
              completionRates.map((item) => (
                <div
                  key={item.categoryName}
                  className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.14)]"
                >
                  <div>
                    <p className="text-xs font-medium text-muted-foreground dark:text-slate-400 mb-1">{t("adm_rpt_th_category", "Danh mục")}</p>
                    <p className="text-sm font-semibold text-foreground dark:text-white">{item.categoryName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">{t("adm_rpt_th_enrollments", "Tổng ghi danh")}</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatStudentCount(item.totalEnrollments)}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">{t("adm_rpt_th_completion", "Hoàn thành")}</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatStudentCount(item.completedEnrollments)}</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3">
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">{t("adm_rpt_completion_progress", "Tỷ lệ hoàn thành")}</p>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{item.completionRate?.toFixed(1) || 0}%</p>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                          style={{ width: `${item.completionRate || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isExportOpen && exportMenuPos && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed z-[9999]"
              style={{ top: exportMenuPos.top, left: exportMenuPos.left, width: 420, maxWidth: "calc(100vw - 24px)" }}
            >
              <div className="bg-white/95 dark:bg-slate-900/95 border border-border/70 dark:border-slate-800 rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.25)] w-full max-h-[90vh] overflow-y-auto relative z-[10000] backdrop-blur-xl">
                <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 border-b border-border/70 dark:border-slate-800 p-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground dark:text-white">
                    {t("adm_rpt_export", "Xuất báo cáo")}: {selectedReport === "revenue" ? t("adm_rpt_name_revenue", "Báo cáo doanh thu") : selectedReport === "category" ? t("adm_rpt_name_category", "Báo cáo danh mục") : selectedReport === "teachers" ? t("adm_rpt_name_teachers", "Báo cáo giáo viên") : selectedReport === "students" ? t("adm_rpt_name_students", "Báo cáo học viên") : t("adm_rpt_name_courses", "Báo cáo khóa học")}
                  </h2>
                  <button onClick={() => setIsExportOpen(false)} className="h-10 w-10 inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-border/60 dark:border-slate-700">
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">{t("adm_rpt_export_desc", "File Excel sẽ chứa toàn bộ dữ liệu đang hiển thị.")}</p>
                  <button
                    onClick={executeExport}
                    className="w-full h-11 px-6 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={20} /> {t("adm_rpt_export_excel", "Xuất báo cáo Excel")}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}




