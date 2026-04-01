"use client"

import { StatCard } from "@/components/ui/stat-card"
import { BookOpen, CreditCard, UserCheck, Users } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { useState, useEffect } from "react"
import { formatPrice, formatNumber, formatCurrency, formatCurrencyByLanguage } from "@/lib/format"
import { useLanguage } from "@/lib/i18n/language-context"
import { apiClient } from "@/lib/api/client"
import { format } from "date-fns/format"

// const revenueData = [
//   { month: "1", revenue: 24000, teachers: 45, students: 400 },
//   { month: "2", revenue: 13980, teachers: 52, students: 300 },
//   { month: "3", revenue: 98000, teachers: 58, students: 200 },
//   { month: "4", revenue: 39080, teachers: 65, students: 278 },
//   { month: "5", revenue: 48000, teachers: 72, students: 189 },
//   { month: "6", revenue: 38000, teachers: 78, students: 239 },
//   { month: "7", revenue: 42000, teachers: 85, students: 280 },
//   { month: "8", revenue: 51000, teachers: 92, students: 320 },
//   { month: "9", revenue: 48000, teachers: 98, students: 300 },
//   { month: "10", revenue: 55000, teachers: 105, students: 350 },
//   { month: "11", revenue: 62000, teachers: 112, students: 380 },
//   { month: "12", revenue: 71000, teachers: 120, students: 420 },
// ]

type RevenuePoint = { month: string; revenue: number }
type WeeklyPoint = { day: string; activeUsers: number; newSignups: number }
type GrowthPoint = { month: string; teachers: number; students: number }
type CategoryItem = { name: string; value: number; color: string; percentage?: number }
type Transaction = { id: string; user: string; course: string; amount: number; status: string; date: string }
type TeacherPlanSummary = { paid: number; free: number; unsubscribed: number; total: number; payingRate: number }
type CertificateSummary = { withCertificate: number; withoutCertificate: number; totalCertificates: number }
type TeacherRanking = { teacherId: string; teacherName: string; courseCount: number; studentCount: number }
type StudentCompletion = { studentId: string; studentName: string; completedCourses: number; certificates: number }
type StudentCertificate = { studentId: string; studentName: string; certificateCount: number; completedCourses: number }
type RadarMetric = { metric: string; value: number }
type CoursePerformance = { courseId: string; courseTitle: string; teacherName: string; enrollments: number; revenue: number; averageRating: number; completionRate: number }

const pieColors = ["#2563eb", "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]

function formatSafeLocalDate(...values: unknown[]): string {
  const parseCandidateDate = (value: unknown): Date | null => {
    if (value == null || value === '') return null

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value
    }

    if (typeof value === 'number') {
      const ms = value < 1e12 ? value * 1000 : value
      const byNumber = new Date(ms)
      return Number.isNaN(byNumber.getTime()) ? null : byNumber
    }

    if (typeof value === 'string') {
      const trimmed = value.trim().replace(/^"|"$/g, '')
      if (!trimmed) return null

      // Handle PostgreSQL timestamp format explicitly:
      // YYYY-MM-DD HH:mm:ss(.SSS)
      const pgMatch = trimmed.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/,
      )
      if (pgMatch) {
        const [, y, m, d, hh = '0', mm = '0', ss = '0', sss = '0'] = pgMatch
        const ms = sss.padEnd(3, '0').slice(0, 3)
        const byParts = new Date(
          Number(y),
          Number(m) - 1,
          Number(d),
          Number(hh),
          Number(mm),
          Number(ss),
          Number(ms),
        )
        if (!Number.isNaN(byParts.getTime())) return byParts
      }

      const direct = new Date(trimmed)
      if (!Number.isNaN(direct.getTime())) return direct

      // PostgreSQL often returns "YYYY-MM-DD HH:mm:ss(.SSS)" without timezone.
      const normalized = trimmed.replace(' ', 'T')
      const isoLike = /[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized)
        ? normalized
        : `${normalized}Z`
      const fromNormalized = new Date(isoLike)
      if (!Number.isNaN(fromNormalized.getTime())) return fromNormalized
    }

    return null
  }

  for (const value of values) {
    const parsed = parseCandidateDate(value)
    if (parsed) {
      return parsed.toLocaleDateString("vi-VN")
    }
  }

  return "--/--/----"
}

export default function AdminDashboard() {
  const { t, language } = useLanguage()
  const [filterPeriod, setFilterPeriod] = useState("month")

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyPoint[]>([])
  const [growthData, setGrowthData] = useState<GrowthPoint[]>([])
  const [categoryData, setCategoryData] = useState<CategoryItem[]>([])
  const [teacherPlanSummary, setTeacherPlanSummary] = useState<TeacherPlanSummary | null>(null)
  const [certificateSummary, setCertificateSummary] = useState<CertificateSummary | null>(null)
  const [teacherPlanData, setTeacherPlanData] = useState<CategoryItem[]>([])
  const [certificateData, setCertificateData] = useState<CategoryItem[]>([])
  const [topTeachers, setTopTeachers] = useState<TeacherRanking[]>([])
  const [topStudentsCompletion, setTopStudentsCompletion] = useState<StudentCompletion[]>([])
  const [topStudentsCertificates, setTopStudentsCertificates] = useState<StudentCertificate[]>([])
  const [radarMetrics, setRadarMetrics] = useState<RadarMetric[]>([])
  const [coursePerformanceTop, setCoursePerformanceTop] = useState<CoursePerformance[]>([])

  const teacherRankingData = topTeachers.map((item) => ({
    name: item.teacherName,
    value: item.courseCount,
    subtitle: `${t("adm_dash_students", "Học viên")}: ${item.studentCount}`,
  }))

  const studentCompletionData = topStudentsCompletion.map((item) => ({
    name: item.studentName,
    value: item.completedCourses,
    subtitle: `${t("adm_dash_certificates", "Chứng chỉ")}: ${item.certificates}`,
  }))

  const studentCertificateData = topStudentsCertificates.map((item) => ({
    name: item.studentName,
    value: item.certificateCount,
    subtitle: `${t("adm_dash_completed_courses", "Khóa hoàn thành")}: ${item.completedCourses}`,
  }))

  const coursePerformanceData = coursePerformanceTop.map((item) => ({
    name: item.courseTitle,
    teacher: item.teacherName,
    enrollments: item.enrollments,
    revenue: item.revenue,
    rating: item.averageRating,
    completionRate: item.completionRate,
  }))

function buildRevenueChart(transactions: { createdAt: string; amount: number }[]) {
  const revenueMap = new Map<string, number>()

  transactions.forEach((tx) => {
    let day = 'Unknown'
    if (tx.createdAt) {
      try {
        const date = new Date(tx.createdAt);
        if (!isNaN(date.getTime())) {
          day = format(date, "d MMM"); // ví dụ: 29 Jan
        }
      } catch {
        day = 'Unknown';
      }
    }
    const amount = Number(tx.amount)

    revenueMap.set(day, (revenueMap.get(day) || 0) + amount)
  })

  return {
    labels: Array.from(revenueMap.keys()),
    data: Array.from(revenueMap.values()),
  }
}

useEffect(() => {
  const loadDashboard = async () => {
    setLoading(true)
    try {
      const res = await apiClient.getAdminDashboardStats()
      const dashboard = res.data ?? res

      /* ================== STATS ================== */
      const normalizedStats = {
        ...dashboard,
        totalRevenue: Number(dashboard.totalRevenue ?? 0),
        totalTeachers: Number(dashboard.totalTeachers ?? 0),
        totalStudents: Number(dashboard.totalStudents ?? 0),
        totalCourses: Number(dashboard.totalCourses ?? 0),
        revenueGrowth: Number(dashboard.revenueGrowth ?? 0),
        teacherGrowth: Number(dashboard.teacherGrowth ?? 0),
        studentGrowth: Number(dashboard.studentGrowth ?? 0),
        courseGrowth: Number(dashboard.courseGrowth ?? 0),
      }
      setStats(normalizedStats)

      /* ================== REVENUE CHART ================== */
      if (
        dashboard.revenueChart?.labels?.length &&
        dashboard.revenueChart?.data?.length
      ) {
        const chart = dashboard.revenueChart
        setRevenueData(
          chart.labels.map((label: string, i: number) => ({
            month: label,
            revenue: Number(chart.data?.[i] ?? 0),
          }))
        )
      } else if (dashboard.recentTransactions?.length) {
        const revenueChart = buildRevenueChart(
          dashboard.recentTransactions.map((t: any) => ({
            createdAt: t.createdAt,
            amount: Number(t.amount ?? 0),
          }))
        )

        setRevenueData(
          revenueChart.labels.map((label: string, i: number) => ({
            month: label,
            revenue: revenueChart.data?.[i] ?? 0,
          }))
        )
      } else {
        setRevenueData([])
      }

      /* ================== WEEKLY STATS ================== */
      setWeeklyStats(
        Array.isArray(dashboard.weeklyStats)
          ? dashboard.weeklyStats.map((item: any) => ({
              day: item.day,
              activeUsers: Number(item.activeUsers ?? 0),
              newSignups: Number(item.newSignups ?? 0),
            }))
          : []
      )

      /* ================== GROWTH CHART ================== */
      setGrowthData(
        Array.isArray(dashboard.growthChart)
          ? dashboard.growthChart.map((item: any) => {
              let month = item.month || '';
              if (item.month?.length === 7 && item.month) {
                try {
                  const date = new Date(`${item.month}-01`);
                  if (!isNaN(date.getTime())) {
                    month = format(date, "MM/yyyy");
                  }
                } catch {
                  month = item.month;
                }
              }
              return {
                month,
                teachers: Number(item.teachers ?? 0),
                students: Number(item.students ?? 0),
              };
            })
          : []
      )

      /* ================== CATEGORY DISTRIBUTION ================== */
      setCategoryData(
        Array.isArray(dashboard.categoryDistribution)
          ? dashboard.categoryDistribution.map((item: any, idx: number) => ({
              name: item.categoryName,
              value: Number(item.courseCount ?? 0),
              percentage: Number(item.percentage ?? 0),
              color: pieColors[idx % pieColors.length],
            }))
          : []
      )

      /* ================== PLAN & CERTIFICATE BREAKDOWN ================== */
      const planSummary: TeacherPlanSummary = {
        paid: Number(dashboard.teacherPlanSummary?.paid ?? 0),
        free: Number(dashboard.teacherPlanSummary?.free ?? 0),
        unsubscribed: Number(dashboard.teacherPlanSummary?.unsubscribed ?? 0),
        total: Number(dashboard.teacherPlanSummary?.total ?? 0),
        payingRate: Number(dashboard.teacherPlanSummary?.payingRate ?? 0),
      }
      setTeacherPlanSummary(planSummary)

      setTeacherPlanData([
        { name: t("adm_dash_paid_teachers", "GV trả phí"), value: planSummary.paid, color: "#22c55e" },
        { name: t("adm_dash_free_teachers", "GV miễn phí"), value: planSummary.free, color: "#3b82f6" },
        { name: t("adm_dash_unsub_teachers", "GV chưa đăng ký"), value: planSummary.unsubscribed, color: "#f97316" },
      ].filter((item) => item.value > 0))

      const certSummary: CertificateSummary = {
        withCertificate: Number(dashboard.certificateSummary?.withCertificate ?? 0),
        withoutCertificate: Number(dashboard.certificateSummary?.withoutCertificate ?? 0),
        totalCertificates: Number(dashboard.certificateSummary?.totalCertificates ?? 0),
      }
      setCertificateSummary(certSummary)
      setCertificateData([
        { name: t("adm_dash_students_with_cert", "HV có chứng chỉ"), value: certSummary.withCertificate, color: "#a855f7" },
        { name: t("adm_dash_students_no_cert", "HV chưa có"), value: certSummary.withoutCertificate, color: "#f59e0b" },
      ].filter((item) => item.value > 0))

      setTopTeachers(
        Array.isArray(dashboard.topTeachersByCourses)
          ? dashboard.topTeachersByCourses.map((item: any) => ({
              teacherId: item.teacherId,
              teacherName: item.teacherName,
              courseCount: Number(item.courseCount ?? 0),
              studentCount: Number(item.studentCount ?? 0),
            }))
          : []
      )

      setTopStudentsCompletion(
        Array.isArray(dashboard.topStudentsByCompletion)
          ? dashboard.topStudentsByCompletion.map((item: any) => ({
              studentId: item.studentId,
              studentName: item.studentName,
              completedCourses: Number(item.completedCourses ?? 0),
              certificates: Number(item.certificates ?? 0),
            }))
          : []
      )

      setTopStudentsCertificates(
        Array.isArray(dashboard.topStudentsByCertificates)
          ? dashboard.topStudentsByCertificates.map((item: any) => ({
              studentId: item.studentId,
              studentName: item.studentName,
              certificateCount: Number(item.certificateCount ?? 0),
              completedCourses: Number(item.completedCourses ?? 0),
            }))
          : []
      )

      setCoursePerformanceTop(
        Array.isArray(dashboard.coursePerformanceTop)
          ? dashboard.coursePerformanceTop.map((item: any) => ({
              courseId: item.courseId,
              courseTitle: item.courseTitle,
              teacherName: item.teacherName,
              enrollments: Number(item.enrollments ?? 0),
              revenue: Number(item.revenue ?? 0),
              averageRating: Number(item.averageRating ?? 0),
              completionRate: Number(item.completionRate ?? 0),
            }))
          : []
      )

      const radarSource: RadarMetric[] = [
        { metric: t("adm_dash_paid_teachers", "GV trả phí"), value: planSummary.paid },
        { metric: t("adm_dash_free_or_unsub", "GV chưa trả phí"), value: planSummary.free + planSummary.unsubscribed },
        { metric: t("adm_dash_students_with_cert", "HV có chứng chỉ"), value: certSummary.withCertificate },
        { metric: t("adm_dash_students_no_cert", "HV chưa có chứng chỉ"), value: certSummary.withoutCertificate },
        { metric: t("adm_dash_top_completion", "HV hoàn thành nhiều khóa"), value: topStudentsCompletion?.[0]?.completedCourses ?? 0 },
      ].filter((item) => item.value > 0)
      setRadarMetrics(radarSource)

      /* ================== RECENT TRANSACTIONS ================== */
      setRecentTransactions(
        (dashboard.recentTransactions ?? []).map((item: any) => ({
          id: item.id,
          user: item.studentName,
          course: item.courseName,
          amount: Number(item.amount ?? 0),
          status:
            item.status === "completed"
              ? "success"
              : item.status === "pending"
                ? "pending"
                : "failed",
          date:
            (typeof item.dateDisplay === "string" && item.dateDisplay.trim()) ||
            formatSafeLocalDate(
              item.paidAt,
              item.createdAt,
              item.updatedAt,
              item.date,
            ),
        }))
      )
    } catch (err) {
      console.warn("Dashboard temporarily unavailable:", err)
      setStats(null)
      setRevenueData([])
      setRecentTransactions([])
      setWeeklyStats([])
      setGrowthData([])
      setCategoryData([])
      setTeacherPlanSummary(null)
      setCertificateSummary(null)
      setTeacherPlanData([])
      setCertificateData([])
      setTopTeachers([])
      setTopStudentsCompletion([])
      setTopStudentsCertificates([])
      setRadarMetrics([])
      setCoursePerformanceTop([])
    } finally {
      setLoading(false)
    }
  }

  loadDashboard()
}, [])

if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>{t("adm_dash_loading", "Đang tải dashboard...")}</p>
    </div>
  )
}
  // TransactionInfoRow: reuse InfoRow for transaction cards
  type TransactionInfoRowProps = {
    label: string;
    value: string;
    highlight?: boolean;
  };

  function TransactionInfoRow({ label, value, highlight = false }: TransactionInfoRowProps) {
    return (
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span
          className={
            highlight
              ? "font-semibold text-primary"
              : "font-medium text-foreground"
          }
        >
          {value}
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-6 md:space-y-8">
        {/* Header with Background */}
        <div className="relative overflow-hidden rounded-3xl p-4 sm:p-6 lg:p-8" style={{ backgroundImage: "url('/image/bg_dashboard.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("adm_dash_title", "Bảng điều khiển quản trị")}</h1>
                <p className="text-black/80 dark:text-white/90 drop-shadow">{t("adm_dash_subtitle", "Tổng quan hệ thống ICS Learning - Quản lý toàn diện")}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "day", label: t("adm_dash_day", "Ngày") },
                  { value: "week", label: t("adm_dash_week", "Tuần") },
                  { value: "month", label: t("adm_dash_month", "Tháng") },
                  { value: "year", label: t("adm_dash_year", "Năm") },
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setFilterPeriod(period.value)}
                    className={`min-h-10 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-all duration-300 font-medium backdrop-blur-sm ${
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
  icon={UserCheck}
  title={t("adm_dash_total_teachers", "Tổng giáo viên")}
  value={stats?.totalTeachers || 0}
  formatter={formatNumber}
  change={`+${stats?.teacherGrowth || 0}% ${t("adm_dash_vs_last_month", "so với tháng trước")}`}
/>

<StatCard
  icon={Users}
  title={t("adm_dash_total_students", "Tổng học viên")}
  value={stats?.totalStudents || 0}
  formatter={formatNumber}
  change={`+${stats?.studentGrowth || 0}% ${t("adm_dash_vs_last_month", "so với tháng trước")}`}
/>

<StatCard
  icon={BookOpen}
  title={t("adm_dash_total_courses", "Tổng khóa học")}
  value={stats?.totalCourses || 0}
  formatter={formatNumber}
  change={`+${stats?.courseGrowth || 0}% ${t("adm_dash_vs_last_month", "so với tháng trước")}`}
/>
<StatCard
  icon={CreditCard}
  title={t("adm_dash_total_revenue", "Tổng doanh thu")}
  value={Number(stats?.totalRevenue || 0)}
  formatter={(val) => formatCurrency(Math.round(val))}
  change={`${stats?.revenueGrowth || 0}% ${t("adm_dash_vs_30_days", "so với 30 ngày trước")}`}
/>

            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">{t("adm_dash_revenue_monthly", "Doanh thu theo tháng")}</h3>
            {revenueData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                {t("adm_dash_no_revenue_data", "Chưa có dữ liệu doanh thu")}
              </p>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff"
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => [formatCurrency(Math.round(Number(value ?? 0))), t("adm_dash_revenue", "Doanh thu")]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                  name={t("adm_dash_revenue", "Doanh thu")}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>

          {/* Category Distribution */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6 animate-fadeIn">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">{t("adm_dash_course_dist", "Phân bố khóa học")}</h3>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">{t("adm_dash_no_cat_data", "Chưa có dữ liệu danh mục")}</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(value, name, _props, index) => [
                        `${Number(value ?? 0)} ${t("adm_dash_courses_unit", "khóa")} (${categoryData[index]?.percentage ?? 0}%)`,
                        String(name ?? ""),
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {categoryData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground dark:text-slate-400">{item.name} ({item.percentage ?? 0}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Activity Chart */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6 animate-fadeIn">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">{t("adm_dash_weekly_activity", "Hoạt động người dùng tuần này")}</h3>
            {weeklyStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              {t("adm_dash_no_weekly_data", "Chưa có dữ liệu tuần này")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weeklyStats}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff"
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#colorActive)"
                  name={t("adm_dash_active_users", "Người dùng hoạt động")}
                />
                <Area
                  type="monotone"
                  dataKey="newSignups"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorSignups)"
                  name={t("adm_dash_new_signups", "Đăng ký mới")}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          </div>

          {/* Teacher & Student Growth */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">{t("adm_dash_growth_monthly", "Tăng trưởng theo tháng")}</h3>
            {growthData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                {t("adm_dash_no_growth_data", "Chưa có dữ liệu tăng trưởng")}
              </p>
            ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff"
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="teachers" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                  dot={{ fill: "#8b5cf6" }}
                  name={t("adm_dash_teachers", "Giáo viên")} 
                />
                <Line 
                  type="monotone" 
                  dataKey="students" 
                  stroke="#06b6d4" 
                  strokeWidth={2} 
                  dot={{ fill: "#06b6d4" }}
                  name={t("adm_dash_students", "Học viên")} 
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Adoption & Certificates */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground dark:text-white">{t("adm_dash_radar_title", "Tổng quan sức khỏe")}</h3>
              {teacherPlanSummary?.payingRate ? (
                <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {teacherPlanSummary.payingRate}% {t("adm_dash_pay_rate", "GV trả phí")}
                </span>
              ) : null}
            </div>
            {radarMetrics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                {t("adm_dash_no_radar", "Chưa đủ dữ liệu để hiển thị")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarMetrics} outerRadius={120}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar
                    name={t("adm_dash_health_profile", "Chỉ số hệ thống")}
                    dataKey="value"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "10px",
                      color: "#e2e8f0",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">{t("adm_dash_plan_breakdown", "Tỷ lệ giáo viên theo gói")}</h3>
            {teacherPlanData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">{t("adm_dash_no_plan_data", "Chưa có dữ liệu gói")}</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={teacherPlanData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} label>
                      {teacherPlanData.map((entry, idx) => (
                        <Cell key={`plan-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [formatNumber(Number(value ?? 0)), String(name)]}
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", color: "#e2e8f0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">{t("adm_dash_paid_teachers", "GV trả phí")}: {formatNumber(teacherPlanSummary?.paid || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3b82f6" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">{t("adm_dash_free_teachers", "GV miễn phí")}: {formatNumber(teacherPlanSummary?.free || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f97316" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">{t("adm_dash_unsub_teachers", "Chưa đăng ký")}: {formatNumber(teacherPlanSummary?.unsubscribed || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#94a3b8" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">{t("adm_dash_total_teachers", "Tổng GV")}: {formatNumber(teacherPlanSummary?.total || 0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">{t("adm_dash_cert_breakdown", "Tỷ lệ chứng chỉ học viên")}</h3>
            {certificateData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">{t("adm_dash_no_cert_data", "Chưa có dữ liệu chứng chỉ")}</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={certificateData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} label>
                      {certificateData.map((entry, idx) => (
                        <Cell key={`cert-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [formatNumber(Number(value ?? 0)), String(name)]}
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", color: "#e2e8f0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#a855f7" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">{t("adm_dash_students_with_cert", "HV có chứng chỉ")}: {formatNumber(certificateSummary?.withCertificate || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">{t("adm_dash_students_no_cert", "HV chưa có")}: {formatNumber(certificateSummary?.withoutCertificate || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#0ea5e9" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">{t("adm_dash_cert_total", "Tổng chứng chỉ")}: {formatNumber(certificateSummary?.totalCertificates || 0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">{t("adm_dash_top_teachers_courses", "GV có nhiều khóa học nhất")}</h3>
            {teacherRankingData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">{t("adm_dash_no_teacher_rank", "Chưa có dữ liệu")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={teacherRankingData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" hide />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" width={120} />
                  <Tooltip
                    formatter={(value, name, props) => [formatNumber(Number(value ?? 0)), props?.payload?.subtitle]}
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", color: "#e2e8f0" }}
                  />
                  <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 6, 6]}>
                    {teacherRankingData.map((entry, index) => (
                      <Cell key={`teacher-${index}`} fill={index === 0 ? "#22c55e" : "#16a34a"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">{t("adm_dash_top_students_completion", "HV hoàn thành nhiều khóa nhất")}</h3>
            {studentCompletionData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">{t("adm_dash_no_student_rank", "Chưa có dữ liệu")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={studentCompletionData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" hide />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" width={120} />
                  <Tooltip
                    formatter={(value, name, props) => [formatNumber(Number(value ?? 0)), props?.payload?.subtitle]}
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", color: "#e2e8f0" }}
                  />
                  <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 6, 6]}>
                    {studentCompletionData.map((entry, index) => (
                      <Cell key={`student-comp-${index}`} fill={index === 0 ? "#06b6d4" : "#0ea5e9"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">{t("adm_dash_top_students_cert", "HV có nhiều chứng chỉ nhất")}</h3>
            {studentCertificateData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">{t("adm_dash_no_cert_rank", "Chưa có dữ liệu")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={studentCertificateData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" hide />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" width={120} />
                  <Tooltip
                    formatter={(value, name, props) => [formatNumber(Number(value ?? 0)), props?.payload?.subtitle]}
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", color: "#e2e8f0" }}
                  />
                  <Bar dataKey="value" fill="#f97316" radius={[6, 6, 6, 6]}>
                    {studentCertificateData.map((entry, index) => (
                      <Cell key={`student-cert-${index}`} fill={index === 0 ? "#f97316" : "#fb923c"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6 xl:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground dark:text-white">{t("adm_dash_course_perf", "Hiệu suất khóa học")}</h3>
              <span className="text-xs text-muted-foreground">{t("adm_dash_top5", "Top 5 theo doanh thu")}</span>
            </div>
            {coursePerformanceData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">{t("adm_dash_no_course_perf", "Chưa có dữ liệu hiệu suất")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border dark:border-slate-800">
                      <th className="text-left py-3 px-4">{t("adm_dash_course", "Khóa học")}</th>
                      <th className="text-left py-3 px-4">{t("adm_dash_teacher", "Giảng viên")}</th>
                      <th className="text-left py-3 px-4">{t("adm_dash_enrollments", "Học viên")}</th>
                      <th className="text-left py-3 px-4">{t("adm_dash_revenue", "Doanh thu")}</th>
                      <th className="text-left py-3 px-4">{t("adm_dash_rating", "Đánh giá")}</th>
                      <th className="text-left py-3 px-4">{t("adm_dash_completion_rate", "Tỉ lệ hoàn thành")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coursePerformanceData.map((row, idx) => (
                      <tr key={idx} className="border-b border-border dark:border-slate-800 hover:bg-secondary/40 dark:hover:bg-slate-800/50 transition-smooth">
                        <td className="py-3 px-4 font-medium text-foreground dark:text-white">{row.name}</td>
                        <td className="py-3 px-4 text-muted-foreground dark:text-slate-300">{row.teacher}</td>
                        <td className="py-3 px-4">{formatNumber(row.enrollments)}</td>
                        <td className="py-3 px-4">{formatCurrencyByLanguage(row.revenue, language)}</td>
                        <td className="py-3 px-4">{row.rating.toFixed(1)}</td>
                        <td className="py-3 px-4">{row.completionRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}

        {/* ===== MOBILE TRANSACTION CARDS ===== */}
        <div className="lg:hidden bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-foreground dark:text-white mb-4">
            {t("adm_dash_recent_tx", "Giao dịch gần đây")}
          </h3>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("adm_dash_no_tx", "Chưa có giao dịch nào")}
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white/80 dark:bg-slate-900/70 border border-border dark:border-slate-800 rounded-2xl p-4 shadow-sm"
                >
                  {/* Header */}
                  <div className="text-center mb-4">
                    <p className="font-semibold text-foreground dark:text-white">
                      {tx.user}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.course}
                    </p>
                  </div>
                  {/* Info rows */}
                  <div className="space-y-2 text-sm">
                    <TransactionInfoRow
                      label={t("adm_dash_amount", "Số tiền")}
                      value={formatCurrencyByLanguage(tx.amount, language)}
                      highlight
                    />
                    <TransactionInfoRow
                      label={t("adm_dash_status", "Trạng thái")}
                      value={
                        tx.status === "success"
                          ? t("adm_dash_success", "Thành công")
                          : tx.status === "pending"
                          ? t("adm_dash_pending", "Chờ xử lý")
                          : t("adm_dash_failed", "Thất bại")
                      }
                    />
                    <TransactionInfoRow
                      label={t("adm_dash_date", "Ngày")}
                      value={tx.date}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ===== DESKTOP TABLE ===== */}
        <div className="hidden lg:block bg-card dark:bg-slate-900/60 rounded-2xl p-6">
          <h3 className="font-semibold text-foreground dark:text-white mb-4">
            {t("adm_dash_recent_tx", "Giao dịch gần đây")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800">
                  <th className="whitespace-nowrap py-3 px-4">{t("adm_dash_user", "Người dùng")}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">{t("adm_dash_course", "Khóa học")}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">{t("adm_dash_amount", "Số tiền")}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">{t("adm_dash_status", "Trạng thái")}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">{t("adm_dash_date", "Ngày")}</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    <td className="whitespace-nowrap py-3 px-4">{transaction.user}</td>
                    <td className="py-3 px-4 text-foreground dark:text-white">{transaction.course}</td>
                    <td className="py-3 px-4 text-foreground dark:text-white">{formatCurrencyByLanguage(transaction.amount, language)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.status === "success"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : transaction.status === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {transaction.status === "success"
                          ? t("adm_dash_success", "Thành công")
                          : transaction.status === "pending"
                            ? t("adm_dash_pending", "Chờ xử lý")
                            : t("adm_dash_failed", "Thất bại")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground dark:text-slate-400">{transaction.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
