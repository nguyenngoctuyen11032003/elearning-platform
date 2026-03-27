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

const sampleCoursePerformance: CoursePerformance[] = [
  {
    courseId: "sample-1",
    courseTitle: "Pentest căn bản",
    teacherName: "Nguyễn Minh",
    enrollments: 120,
    revenue: 18000000,
    averageRating: 4.7,
    completionRate: 86,
  },
  {
    courseId: "sample-2",
    courseTitle: "React + NestJS",
    teacherName: "Lê Anh",
    enrollments: 140,
    revenue: 21000000,
    averageRating: 4.5,
    completionRate: 78,
  },
]

const sampleCompletionRates: CategoryRate[] = [
  { categoryName: "An ninh mạng", totalEnrollments: 200, completedEnrollments: 164, completionRate: 82 },
  { categoryName: "Lập trình", totalEnrollments: 180, completedEnrollments: 130, completionRate: 72 },
]

const sampleGrowth: GrowthPoint[] = [
  { month: "2025-01", teachers: 12, students: 220 },
  { month: "2025-02", teachers: 15, students: 260 },
  { month: "2025-03", teachers: 18, students: 300 },
  { month: "2025-04", teachers: 20, students: 340 },
  { month: "2025-05", teachers: 22, students: 380 },
  { month: "2025-06", teachers: 24, students: 420 },
]

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
    const load = async () => {
      setLoading(true)
      try {
        // Don't translate report data
        const localizedRevenueByCategory = sampleRevenueByCategory
        const localizedCoursePerformance = sampleCoursePerformance
        const localizedCompletionRates = sampleCompletionRates

        const [revenueReport, userReport, performanceReport, dashboardStats, growthStats] = await Promise.all([
          apiClient.getAdminRevenueReport(),
          apiClient.getAdminUserReport(),
          apiClient.getAdminPerformanceReport(),
          apiClient.getAdminDashboardStats(),
          apiClient.getAdminGrowthStats(),
        ])

        // Determine if we have real data from database
        const hasPayments = Boolean(revenueReport?.revenueByMonth?.length)
        const hasCourses = Boolean(performanceReport?.topPerformingCourses?.length)
        const hasCompletion = Boolean(performanceReport?.completionRates?.length)

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
        setRevenueByMonth(hasPayments ? revenueReport.revenueByMonth : sampleRevenueByMonth)
        setRevenueByCategory(hasPayments ? revenueReport.revenueByCategory : localizedRevenueByCategory)
        setCoursePerformance(hasCourses ? performanceReport.topPerformingCourses : localizedCoursePerformance)
        setCompletionRates(hasCompletion ? performanceReport.completionRates : localizedCompletionRates)
        setGrowthChart(hasGrowth ? mergedGrowth : sampleGrowth)

        // Helper function to safely convert to number
        const toNumber = (val: any): number => {
          const num = Number(val)
          return isNaN(num) ? 0 : Math.round(num)
        }

        // Set totals - prefer real DB data, ensure proper number conversion
        setTotals({
          totalRevenue: hasPayments ? toNumber(revenueReport.totalRevenue) : sampleRevenueByMonth.reduce((s, i) => s + i.revenue, 0),
          platformRevenue: hasPayments ? toNumber(revenueReport.platformRevenue) : sampleRevenueByMonth.reduce((s, i) => s + i.revenue, 0) * 0.3,
          teacherRevenue: hasPayments ? toNumber(revenueReport.teacherRevenue) : sampleRevenueByMonth.reduce((s, i) => s + i.revenue, 0) * 0.7,
          totalTeachers: toNumber(dashboardStats?.totalTeachers || sampleGrowth[sampleGrowth.length - 1].teachers),
          totalStudents: toNumber(dashboardStats?.totalStudents || sampleGrowth[sampleGrowth.length - 1].students),
          totalCourses: toNumber(dashboardStats?.totalCourses || sampleCoursePerformance.length),
          totalUsers: toNumber(userReport?.totalUsers || sampleGrowth[sampleGrowth.length - 1].students + sampleGrowth[sampleGrowth.length - 1].teachers),
        })
      } catch (error) {
        console.error("Error loading reports", error)
        toast.error(t("adm_rpt_load_fail", "Không thể tải báo cáo. Vui lòng thử lại."))
      } finally {
        setLoading(false)
      }
    }

    load()
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

  const teacherGrowth = growthChart.map((g) => ({ month: g.month, teachers: g.teachers }))
  const studentGrowth = growthChart.map((g) => ({ month: g.month, students: g.students }))

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
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        <div
          className="relative overflow-hidden rounded-3xl p-8 animate-fadeIn"
          style={{ backgroundImage: "url('/image/bg_report.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl" />

          <div className="relative z-10 space-y-8">
            <div
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown"
              style={{ animationDelay: "0.15s" }}
            >
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("adm_rpt_title", "Báo cáo & Phân tích")}</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">{t("adm_rpt_subtitle", "Xem chi tiết hiệu suất nền tảng")}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "day", label: t("adm_rpt_day", "Ngày") },
                  { value: "week", label: t("adm_rpt_week", "Tuần") },
                  { value: "month", label: t("adm_rpt_month", "Tháng") },
                  { value: "year", label: t("adm_rpt_year", "Năm") },
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setFilterPeriod(period.value)}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium backdrop-blur-sm ${
                      filterPeriod === period.value
                        ? "bg-white text-primary shadow-lg"
                        : "bg-white/30 dark:bg-white/20 text-slate-900 dark:text-white hover:bg-white/45"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <StatCard icon={DollarSign} title={t("adm_rpt_total_revenue", "Tổng doanh thu")} value={totals.totalRevenue} formatter={(val) => formatCurrency(Math.round(val))} change={t("adm_rpt_period_update", "Cập nhật theo kỳ")} />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <StatCard icon={Users} title={t("adm_rpt_total_teachers", "Tổng giáo viên")} value={totals.totalTeachers} formatter={formatNumber} change={t("adm_rpt_period_update", "Cập nhật theo kỳ")} />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <StatCard icon={TrendingUp} title={t("adm_rpt_total_students", "Tổng học viên")} value={totals.totalStudents} formatter={formatNumber} change={t("adm_rpt_period_update", "Cập nhật theo kỳ")} />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <StatCard icon={BookOpen} title={t("adm_rpt_courses", "Khóa học")} value={totals.totalCourses} formatter={formatNumber} change={t("adm_rpt_period_update", "Cập nhật theo kỳ")} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground dark:text-white">{t("adm_rpt_revenue_chart", "Biểu đồ doanh thu")}</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  {filterPeriod === "day" ? t("adm_rpt_last_7_days", "7 ngày gần nhất") : filterPeriod === "week" ? t("adm_rpt_this_week", "Tuần này") : filterPeriod === "month" ? t("adm_rpt_12_months", "12 tháng") : t("adm_rpt_full_year", "Cả năm")}
                </p>
              </div>
              <button
                onClick={(event) => handleExport("revenue", event.currentTarget)}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <Download size={18} className="text-muted-foreground dark:text-slate-400" />
              </button>
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

          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground dark:text-white">{t("adm_rpt_category_dist", "Phân bố theo danh mục")}</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_rpt_category_revenue", "Tỷ lệ doanh thu theo danh mục")}</p>
              </div>
              <button
                onClick={(event) => handleExport("category", event.currentTarget)}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
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
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground dark:text-white">{t("adm_rpt_teacher_growth", "Tăng trưởng giáo viên")}</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_rpt_teacher_growth_desc", "Số lượng giáo viên theo thời gian")}</p>
              </div>
              <button
                onClick={(event) => handleExport("teachers", event.currentTarget)}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
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

          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground dark:text-white">{t("adm_rpt_student_growth", "Tăng trưởng học viên")}</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_rpt_student_growth_desc", "Số lượng học viên theo thời gian")}</p>
              </div>
              <button
                onClick={(event) => handleExport("students", event.currentTarget)}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
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

        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-foreground dark:text-white">{t("adm_rpt_course_perf", "Hiệu suất khóa học")}</h2>
              <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_rpt_course_perf_desc", "Thống kê chi tiết theo khóa học")}</p>
            </div>
            <button
              onClick={(event) => handleExport("courses", event.currentTarget)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg transition-smooth hover:shadow-lg"
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
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {coursePerformance.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground">{t("adm_rpt_no_data", "Chưa có dữ liệu")}</div>
            ) : (
              coursePerformance.map((course) => (
                <div
                  key={course.courseId}
                  className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow"
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

        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-foreground dark:text-white">{t("adm_rpt_completion_rate", "Tỷ lệ hoàn thành theo danh mục")}</h2>
              <p className="text-sm text-muted-foreground dark:text-slate-400">{t("adm_rpt_completion_desc", "Theo dõi mức độ hoàn thành của học viên")}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {completionRates.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground">{t("adm_rpt_no_data", "Chưa có dữ liệu")}</div>
            ) : (
              completionRates.map((item) => (
                <div
                  key={item.categoryName}
                  className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow"
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
              <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
                <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground dark:text-white">
                    {t("adm_rpt_export", "Xuất báo cáo")}: {selectedReport === "revenue" ? t("adm_rpt_name_revenue", "Báo cáo doanh thu") : selectedReport === "category" ? t("adm_rpt_name_category", "Báo cáo danh mục") : selectedReport === "teachers" ? t("adm_rpt_name_teachers", "Báo cáo giáo viên") : selectedReport === "students" ? t("adm_rpt_name_students", "Báo cáo học viên") : t("adm_rpt_name_courses", "Báo cáo khóa học")}
                  </h2>
                  <button onClick={() => setIsExportOpen(false)} className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth">
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">{t("adm_rpt_export_desc", "File Excel sẽ chứa toàn bộ dữ liệu đang hiển thị.")}</p>
                  <button
                    onClick={executeExport}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium hover:shadow-lg transition-smooth flex items-center justify-center gap-2"
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

