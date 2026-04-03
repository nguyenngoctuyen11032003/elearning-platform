"use client"

import { UserAvatar } from "@/components/ui/user-avatar"
import { TrendingUp, Users, BookOpen, Star, ArrowUpRight, Search } from "lucide-react"
import {
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { useEffect, useMemo, useState, type ComponentType } from "react"
import { formatPrice, formatNumber } from "@/lib/format"
import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import { useLanguage } from "@/lib/i18n/language-context"

type ChartPoint = { label: string; value: number }
type PieItem = { name: string; value: number; color?: string }
type WeeklyPoint = { day: string; revenue: number; target: number }
type EnrollmentRow = {
  id: string
  studentName: string
  courseName: string
  createdAt: string
  createdAtRaw: number
  status?: string
}

type KpiCardProps = {
  title: string
  value: string
  icon: ComponentType<{ className?: string }>
  trend: string
  trendData: number[]
  colorClass: string
  iconBgClass: string
}

const PIE_COLORS = ["#22c55e", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6"]

function KpiCard({ title, value, icon: Icon, trend, trendData, colorClass, iconBgClass }: KpiCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_12px_30px_rgba(2,6,23,0.55)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${iconBgClass}`}>
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className={`text-xs font-semibold ${colorClass}`}>{trend}</p>
        <div className="h-10 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData.map((point, idx) => ({ idx, point }))}>
              <Line
                type="monotone"
                dataKey="point"
                strokeWidth={2}
                stroke="currentColor"
                className={colorClass}
                dot={false}
                isAnimationActive
                animationDuration={900}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </article>
  )
}

function ChartSkeleton({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] animate-pulse">
      <div className="h-5 w-44 rounded bg-slate-200 dark:bg-slate-700" aria-label={title} />
      <div className="mt-4 h-[250px] rounded-xl bg-slate-100 dark:bg-slate-800" />
    </div>
  )
}

function TableBadge({ status, t }: { status?: string; t: (key: string, fallback?: string) => string }) {
  const normalized = String(status || "").toLowerCase()

  if (normalized === "completed") {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        {t("teacher_dashboard_completed", "Completed")}
      </span>
    )
  }

  if (normalized === "pending") {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        {t("teacher_dashboard_pending", "Pending")}
      </span>
    )
  }

  return (
    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
      {t("teacher_dashboard_learning", "�ang h?c")}
    </span>
  )
}

function computeGrowth(series: number[], windowSize: number) {
  if (!series.length || !windowSize) return 0
  const current = series.slice(-windowSize).reduce((sum, n) => sum + Number(n || 0), 0)
  const previous = series.slice(-(windowSize * 2), -windowSize).reduce((sum, n) => sum + Number(n || 0), 0)
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { language, t } = useLanguage()

  const [filterPeriod, setFilterPeriod] = useState("month")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [revenueChart, setRevenueChart] = useState<ChartPoint[]>([])
  const [studentChart, setStudentChart] = useState<ChartPoint[]>([])
  const [pieData, setPieData] = useState<PieItem[]>([])
  const [weeklyPerformance, setWeeklyPerformance] = useState<WeeklyPoint[]>([])
  const [recentEnrollments, setRecentEnrollments] = useState<EnrollmentRow[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [tablePage, setTablePage] = useState(1)

  const localeByLanguage: Record<string, string> = {
    vi: "vi-VN",
    en: "en-US",
  }

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      try {
        const res = await apiClient.getTeacherDashboardStats()
        const dashboard = res?.data ?? res ?? {}

        setStats(dashboard)

        setRevenueChart(
          (dashboard.revenueChart?.labels ?? []).map((label: string, idx: number) => ({
            label,
            value: Number(dashboard.revenueChart?.data?.[idx] ?? 0),
          }))
        )

        setStudentChart(
          (dashboard.studentChart?.labels ?? []).map((label: string, idx: number) => ({
            label,
            value: Number(dashboard.studentChart?.data?.[idx] ?? 0),
          }))
        )

        setPieData(
          (dashboard.courseDistribution ?? []).map((item: any, idx: number) => ({
            name: item.name,
            value: Number(item.value ?? 0),
            color: PIE_COLORS[idx % PIE_COLORS.length],
          }))
        )

        setWeeklyPerformance(Array.isArray(dashboard.weeklyPerformance) ? dashboard.weeklyPerformance : [])

        setRecentEnrollments(
          (dashboard.recentEnrollments ?? []).map((item: any) => {
            const createdAtDate = new Date(item.createdAt)
            return {
              id: item.id,
              studentName: item.studentName,
              courseName: item.courseName,
              createdAt: createdAtDate.toLocaleDateString(localeByLanguage[language] || "vi-VN"),
              createdAtRaw: createdAtDate.getTime(),
              status: item.status,
            }
          })
        )
      } catch (error) {
        console.error("Teacher dashboard loading error:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [language])

  const chartWindow = useMemo(() => {
    const total = Math.max(revenueChart.length, studentChart.length, weeklyPerformance.length)
    if (!total) return 0

    if (filterPeriod === "day") return 1
    if (filterPeriod === "week") return Math.min(7, total)
    if (filterPeriod === "month") {
      if (total >= 12) return 6
      return Math.min(total, Math.max(3, Math.floor(total / 2)))
    }
    return total
  }, [filterPeriod, revenueChart.length, studentChart.length, weeklyPerformance.length])

  const filteredRevenueChart = useMemo(() => revenueChart.slice(-chartWindow), [revenueChart, chartWindow])
  const filteredStudentChart = useMemo(() => studentChart.slice(-chartWindow), [studentChart, chartWindow])
  const filteredWeeklyPerformance = useMemo(() => weeklyPerformance.slice(-chartWindow), [weeklyPerformance, chartWindow])

  const periodStart = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    if (filterPeriod === "day") start.setDate(now.getDate() - 1)
    if (filterPeriod === "week") start.setDate(now.getDate() - 7)
    if (filterPeriod === "month") start.setMonth(now.getMonth() - 1)
    if (filterPeriod === "year") start.setFullYear(now.getFullYear() - 1)
    return start.getTime()
  }, [filterPeriod])

  const enrollmentsByPeriod = useMemo(
    () => recentEnrollments.filter((row) => row.createdAtRaw >= periodStart),
    [recentEnrollments, periodStart]
  )

  const pieDataByPeriod = useMemo(() => {
    // If no enrollments in period, use overall pie data
    if (!enrollmentsByPeriod.length) return pieData

    const counts = new Map<string, number>()
    for (const row of enrollmentsByPeriod) {
      const key = row.courseName || "Unknown"
      counts.set(key, (counts.get(key) || 0) + 1)
    }

    const periodCourses = Array.from(counts.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }))

    // If period data is significantly less than overall data and we're not in "day" mode,
    // prefer overall pie data (backend has comprehensive data)
    if (filterPeriod !== "day" && pieData.length > periodCourses.length * 1.5) {
      return pieData
    }

    return periodCourses
  }, [enrollmentsByPeriod, pieData, filterPeriod])

  const revenueSeries = useMemo(
    () => filteredRevenueChart.map((item) => ({ month: item.label, revenue: item.value })),
    [filteredRevenueChart]
  )

  const studentSeries = useMemo(
    () => filteredStudentChart.map((item) => ({ month: item.label, students: item.value })),
    [filteredStudentChart]
  )

  const revenueGrowthByPeriod = useMemo(
    () => computeGrowth(revenueChart.map((i) => i.value), Math.max(1, chartWindow)),
    [revenueChart, chartWindow]
  )

  const studentGrowthByPeriod = useMemo(
    () => computeGrowth(studentChart.map((i) => i.value), Math.max(1, chartWindow)),
    [studentChart, chartWindow]
  )

  const revenueInPeriod = useMemo(
    () => filteredRevenueChart.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [filteredRevenueChart]
  )

  const studentsInPeriod = useMemo(
    () => filteredStudentChart.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [filteredStudentChart]
  )

  const peakRevenue = useMemo(() => {
    if (!filteredRevenueChart.length) return null
    return filteredRevenueChart.reduce((max, item) => (item.value > max.value ? item : max), filteredRevenueChart[0])
  }, [filteredRevenueChart])

  const totalPie = useMemo(() => pieDataByPeriod.reduce((sum, item) => sum + Number(item.value || 0), 0), [pieDataByPeriod])

  const bestCourse = useMemo(() => {
    if (!pieDataByPeriod.length) return "-"
    return [...pieDataByPeriod].sort((a, b) => b.value - a.value)[0]?.name || "-"
  }, [pieDataByPeriod])

  const mostActiveDay = useMemo(() => {
    if (!filteredWeeklyPerformance.length) return "-"
    return [...filteredWeeklyPerformance].sort((a, b) => b.revenue - a.revenue)[0]?.day || "-"
  }, [filteredWeeklyPerformance])

  const filteredEnrollments = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) return enrollmentsByPeriod
    return enrollmentsByPeriod.filter(
      (row) =>
        row.studentName?.toLowerCase().includes(keyword) ||
        row.courseName?.toLowerCase().includes(keyword)
    )
  }, [enrollmentsByPeriod, searchKeyword])

  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / pageSize))

  useEffect(() => {
    setTablePage(1)
  }, [searchKeyword, filterPeriod])

  useEffect(() => {
    if (tablePage > totalPages) setTablePage(totalPages)
  }, [tablePage, totalPages])

  const pagedEnrollments = useMemo(() => {
    const start = (tablePage - 1) * pageSize
    return filteredEnrollments.slice(start, start + pageSize)
  }, [filteredEnrollments, tablePage])

  const kpiCards: KpiCardProps[] = [
    {
      title: t("teacher_dashboard_total_revenue", "T?ng doanh thu"),
      value: `VND ${formatPrice(Number(revenueInPeriod ?? 0))}`,
      icon: TrendingUp,
      trend: `${revenueGrowthByPeriod >= 0 ? "+" : ""}${revenueGrowthByPeriod}% ${t("teacher_dashboard_vs_previous", "vs k? tru?c")}`,
      trendData: filteredRevenueChart.map((item) => item.value),
      colorClass: "text-emerald-500",
      iconBgClass: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: t("teacher_dashboard_students", "H?c vi�n"),
      value: formatNumber(Number(studentsInPeriod ?? 0)),
      icon: Users,
      trend: `${studentGrowthByPeriod >= 0 ? "+" : ""}${studentGrowthByPeriod}% ${t("teacher_dashboard_vs_previous", "vs k? tru?c")}`,
      trendData: filteredStudentChart.map((item) => item.value),
      colorClass: "text-sky-500",
      iconBgClass: "bg-sky-100 dark:bg-sky-900/30",
    },
    {
      title: t("teacher_dashboard_courses", "Kh�a h?c"),
      value: formatNumber(Number(pieDataByPeriod.length || 0)),
      icon: BookOpen,
      trend: `${enrollmentsByPeriod.length} ${t("teacher_dashboard_enrollments", "enrollments")}`,
      trendData: [8, 9, 10, 12, 11, 12, 14],
      colorClass: "text-violet-500",
      iconBgClass: "bg-violet-100 dark:bg-violet-900/30",
    },
    {
      title: t("teacher_dashboard_average_rating", "��nh gi�"),
      value: `${Number(stats?.averageRating ?? 0).toFixed(1)}*`,
      icon: Star,
      trend: `${t("teacher_dashboard_from", "T?")} ${formatNumber(Number(stats?.totalStudents ?? 0))} ${t("teacher_dashboard_students", "h?c vi�n")}`,
      trendData: [4.2, 4.3, 4.4, 4.4, 4.6, 4.7, 4.8],
      colorClass: "text-amber-500",
      iconBgClass: "bg-amber-100 dark:bg-amber-900/30",
    },
  ]

  return (
    <div className="min-h-screen w-full">
      <div className="space-y-8">
        <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-sky-500/20 via-cyan-500/10 to-indigo-500/15 dark:from-sky-900/25 dark:via-cyan-900/15 dark:to-indigo-900/20 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-8 left-10 h-32 w-32 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-10 lg:items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3">
                <UserAvatar src={user?.avatar} name={user?.name || t("role_teacher", "Teacher")} size="md" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Teacher</p>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("teacher_dashboard_welcome", "Ch�o m?ng")}, {user?.name || t("role_teacher", "Gi�o vi�n")}</h1>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{t("teacher_dashboard_overview", "T?ng quan ho?t d?ng gi?ng d?y, doanh thu v� tuong t�c h?c vi�n c?a b?n")}</p>
            </div>
            <div className="lg:col-span-3">
              <div className="flex w-full rounded-xl bg-white/60 p-1 shadow-inner backdrop-blur-md dark:bg-slate-900/55">
                {[
                  { value: "day", label: t("period_day", "Ng�y") },
                  { value: "week", label: t("period_week", "Tu?n") },
                  { value: "month", label: t("period_month", "Th�ng") },
                  { value: "year", label: t("period_year", "Nam") },
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setFilterPeriod(period.value)}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-[0.98] ${
                      filterPeriod === period.value
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_8px_18px_rgba(59,130,246,0.35)]"
                        : "text-slate-700 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => (
            <KpiCard key={card.title} {...card} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {loading ? (
            <>
              <div className="lg:col-span-6"><ChartSkeleton title="Revenue chart" /></div>
              <div className="lg:col-span-6"><ChartSkeleton title="Student chart" /></div>
            </>
          ) : (
            <>
              <article className="lg:col-span-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{t("teacher_dashboard_revenue", "Doanh thu")}</h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {peakRevenue ? `${t("teacher_dashboard_peak_month", "Peak")}: ${peakRevenue.label}` : "-"}
                  </span>
                </div>
                {revenueSeries.length === 0 ? (
                  <p className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">{t("teacher_dashboard_no_revenue", "Chua c� d? li?u doanh thu")}</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={270}>
                      <ComposedChart data={revenueSeries}>
                        <defs>
                          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid rgba(148,163,184,0.25)",
                            backgroundColor: "rgba(15,23,42,0.92)",
                            color: "#fff",
                          }}
                          formatter={(value) => [`?${formatPrice(Number(value || 0))}`, t("teacher_dashboard_revenue", "Doanh thu")]}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="none" fill="url(#revenueFill)" />
                        <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} isAnimationActive animationDuration={900} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight className="h-4 w-4" />
                      {revenueGrowthByPeriod >= 0 ? "+" : ""}{revenueGrowthByPeriod}% {t("teacher_dashboard_vs_previous", "vs last month")}
                    </p>
                  </>
                )}
              </article>

              <article className="lg:col-span-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">{t("teacher_dashboard_new_students", "H?c vi�n m?i")}</h3>
                {studentSeries.length === 0 ? (
                  <p className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">{t("teacher_dashboard_no_students", "Chua c� d? li?u h?c vi�n")}</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={270}>
                      <BarChart data={studentSeries}>
                        <defs>
                          <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid rgba(148,163,184,0.25)",
                            backgroundColor: "rgba(15,23,42,0.92)",
                            color: "#fff",
                          }}
                        />
                        <Bar dataKey="students" fill="url(#studentGradient)" radius={[10, 10, 0, 0]} isAnimationActive animationDuration={900} />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-sky-600 dark:text-sky-400">
                      <ArrowUpRight className="h-4 w-4" />
                      {studentGrowthByPeriod >= 0 ? "+" : ""}{studentGrowthByPeriod}% {t("teacher_dashboard_vs_previous", "vs last month")}
                    </p>
                  </>
                )}
              </article>
            </>
          )}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <article className="lg:col-span-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">{t("teacher_dashboard_course_distribution", "Ph�n b? kh�a h?c")}</h3>
            {pieDataByPeriod.length === 0 ? (
              <p className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">{t("teacher_dashboard_no_courses", "Chua c� d? li?u kh�a h?c")}</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieDataByPeriod}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={55}
                      label={(entry) => {
                        const percentage = totalPie ? Math.round((Number(entry.value || 0) / totalPie) * 100) : 0
                        return `${percentage}%`
                      }}
                      labelLine={false}
                      isAnimationActive
                      animationDuration={900}
                    >
                      {pieDataByPeriod.map((entry, idx) => (
                        <Cell key={`${entry.name}-${idx}`} fill={entry.color || PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${Number(value || 0)}`, String(name || "")]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(148,163,184,0.25)",
                        backgroundColor: "rgba(15,23,42,0.92)",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {pieDataByPeriod.map((item, idx) => {
                    const percentage = totalPie ? Math.round((Number(item.value || 0) / totalPie) * 100) : 0
                    return (
                      <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-100/80 dark:bg-slate-800/70 px-3 py-2 text-xs">
                        <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color || PIE_COLORS[idx % PIE_COLORS.length] }} />
                          {item.name}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{percentage}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </article>

          <article className="lg:col-span-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">{t("teacher_dashboard_weekly_performance", "Hi?u su?t tu?n n�y")}</h3>
            {filteredWeeklyPerformance.length === 0 ? (
              <p className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">{t("teacher_dashboard_no_weekly", "Chua c� d? li?u tu?n n�y")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={filteredWeeklyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    formatter={(value) => [`?${formatPrice(Number(value || 0))}`, ""]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,0.25)",
                      backgroundColor: "rgba(15,23,42,0.92)",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name={t("teacher_dashboard_actual", "Actual")} stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} isAnimationActive animationDuration={900} />
                  <Line type="monotone" dataKey="target" name={t("teacher_dashboard_target", "Target")} stroke="#f97316" strokeWidth={2.5} strokeDasharray="7 6" dot={false} isAnimationActive animationDuration={900} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("teacher_dashboard_insights", "Insights")}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">{revenueGrowthByPeriod >= 0 ? "+" : ""}{revenueGrowthByPeriod}% {t("teacher_dashboard_vs_previous", "vs last month")}</div>
            <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 p-3 text-sm font-medium text-violet-700 dark:text-violet-300">{t("teacher_dashboard_best_course", "Best performing course")}: {bestCourse}</div>
            <div className="rounded-xl bg-sky-50 dark:bg-sky-900/20 p-3 text-sm font-medium text-sky-700 dark:text-sky-300">{t("teacher_dashboard_most_active_day", "Most active day")}: {mostActiveDay}</div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t("teacher_dashboard_recent_enrollments", "Recent enrollments")}</h3>
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={t("teacher_dashboard_search_students", "Search student or course")}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 outline-none transition focus:border-primary/60"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t("teacher_dashboard_students", "H?c vi�n")}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t("teacher_dashboard_courses", "Kh�a h?c")}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t("teacher_dashboard_enrolled_date", "Ng�y dang k�")}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t("teacher_dashboard_status", "Tr?ng th�i")}</th>
                </tr>
              </thead>
              <tbody>
                {pagedEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">{t("teacher_dashboard_no_enrollments", "Chua c� dang k� n�o")}</td>
                  </tr>
                ) : (
                  pagedEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="border-b border-slate-200/70 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar src={undefined} name={enrollment.studentName} size="sm" />
                          <span className="font-medium text-slate-800 dark:text-slate-100">{enrollment.studentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{enrollment.courseName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{enrollment.createdAt}</td>
                      <td className="px-4 py-3"><TableBadge status={enrollment.status} t={t} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredEnrollments.length} {t("teacher_dashboard_results", "results")}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTablePage((prev) => Math.max(1, prev - 1))}
                disabled={tablePage <= 1}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                {t("common_prev", "Prev")}
              </button>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{tablePage}/{totalPages}</span>
              <button
                onClick={() => setTablePage((prev) => Math.min(totalPages, prev + 1))}
                disabled={tablePage >= totalPages}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                {t("common_next", "Next")}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
