"use client"

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
import { BookOpen, DollarSign, TrendingUp, Users } from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"
import { formatNumber, formatCurrency, formatCurrencyByLanguage } from "@/lib/format"
import { useLanguage } from "@/lib/i18n/language-context"
import { apiClient } from "@/lib/api/client"
import { format } from "date-fns/format"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { useMetricChangeHighlight } from "@/hooks/use-metric-change-highlight"
import { MetricTrendBadge } from "@/components/ui/metric-trend-badge"

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
const chartTooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: "10px",
  color: "#e2e8f0",
}
const chartTooltipLabelStyle = { color: "#e2e8f0", fontWeight: 600 }
const chartTooltipItemStyle = { color: "#e2e8f0" }
const DASHBOARD_REALTIME_MS = 45000

const LIVE_CLOCK_ANIMATION_STYLE: "light" | "clear" = "clear"
const LIVE_CLOCK_ANIMATION_PRESETS = {
  light: {
    durationMs: 260,
    fromY: 3,
    fromBlur: 0,
    fromOpacity: 0.55,
  },
  clear: {
    durationMs: 480,
    fromY: 5,
    fromBlur: 1.5,
    fromOpacity: 0.35,
  },
} as const

const isSameData = <T,>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b)

const fallbackOverviewMetrics = {
  totalRevenue: 1897000,
  totalTeachers: 3,
  totalStudents: 4,
  totalCourses: 9,
  platformRevenue: 569100,
  teacherRevenue: 1327900,
  totalUsers: 10,
  teacherGrowthPeople: 0,
  studentGrowthPeople: 1,
}

const toNumber = (value: unknown): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const safeMonthKey = (month: string) => {
  if (/^\d{4}-\d{2}$/.test(month)) return month
  if (/^\d{2}\/\d{4}$/.test(month)) {
    const [mm, yyyy] = month.split("/")
    return `${yyyy}-${mm}`
  }
  return month
}

const mergeGrowthSeries = (growthStats: any): GrowthPoint[] => {
  const teacherSeries = Array.isArray(growthStats?.teachersByMonth) ? growthStats.teachersByMonth : []
  const studentSeries = Array.isArray(growthStats?.studentsByMonth) ? growthStats.studentsByMonth : []

  const monthSet = new Set<string>([
    ...teacherSeries.map((m: any) => String(m?.month ?? "")),
    ...studentSeries.map((s: any) => String(s?.month ?? "")),
  ])

  return Array.from(monthSet)
    .filter(Boolean)
    .sort((a, b) => safeMonthKey(a).localeCompare(safeMonthKey(b)))
    .map((month) => ({
      month,
      teachers: toNumber(teacherSeries.find((m: any) => String(m?.month) === month)?.count),
      students: toNumber(studentSeries.find((s: any) => String(s?.month) === month)?.count),
    }))
}

const normalizeDashboardGrowth = (growthChart: any): GrowthPoint[] => {
  if (!Array.isArray(growthChart)) return []

  return growthChart
    .map((item: any) => ({
      month: String(item?.month ?? ""),
      teachers: toNumber(item?.teachers),
      students: toNumber(item?.students),
    }))
    .filter((item) => item.month)
    .sort((a, b) => safeMonthKey(a.month).localeCompare(safeMonthKey(b.month)))
}

const hasAnyOverviewData = (stats: any) => {
  if (!stats || typeof stats !== "object") return false
  const keys = ["totalRevenue", "totalTeachers", "totalStudents", "totalCourses", "totalUsers", "platformRevenue", "teacherRevenue"]
  return keys.some((key) => stats[key] !== undefined && stats[key] !== null)
}

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
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [liveClock, setLiveClock] = useState(() => new Date())
  const [chartMotionCycle, setChartMotionCycle] = useState(0)
  const [chartAnimationFlags, setChartAnimationFlags] = useState({
    revenue: true,
    category: true,
    radar: true,
  })
  const chartSignaturesRef = useRef<{ revenue: string; category: string; radar: string } | null>(null)
  const liveClockTextRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const el = liveClockTextRef.current
    if (!el || typeof el.animate !== "function") return

    const preset = LIVE_CLOCK_ANIMATION_PRESETS[LIVE_CLOCK_ANIMATION_STYLE]

    el.animate(
      [
        {
          opacity: preset.fromOpacity,
          transform: `translateY(${preset.fromY}px)`,
          filter: `blur(${preset.fromBlur}px)`,
        },
        { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" },
      ],
      {
        duration: preset.durationMs,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    )
  }, [liveClock])

  const revenueSignature = useMemo(() => JSON.stringify(revenueData), [revenueData])
  const categorySignature = useMemo(() => JSON.stringify(categoryData), [categoryData])
  const radarSignature = useMemo(() => JSON.stringify(radarMetrics), [radarMetrics])

  useEffect(() => {
    const prev = chartSignaturesRef.current
    const next = {
      revenue: revenueSignature,
      category: categorySignature,
      radar: radarSignature,
    }

    chartSignaturesRef.current = next
    if (!prev) return

    const changed = {
      revenue: prev.revenue !== next.revenue,
      category: prev.category !== next.category,
      radar: prev.radar !== next.radar,
    }

    if (!changed.revenue && !changed.category && !changed.radar) return

    setChartMotionCycle((value) => value + 1)
    setChartAnimationFlags((current) => ({
      revenue: changed.revenue ? true : current.revenue,
      category: changed.category ? true : current.category,
      radar: changed.radar ? true : current.radar,
    }))

    const timer = setTimeout(() => {
      setChartAnimationFlags((current) => ({
        revenue: changed.revenue ? false : current.revenue,
        category: changed.category ? false : current.category,
        radar: changed.radar ? false : current.radar,
      }))
    }, 1700)

    return () => clearTimeout(timer)
  }, [revenueSignature, categorySignature, radarSignature])

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
  const loadDashboard = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [dashboardRes, growthRes, revenueRes, userRes] = await Promise.allSettled([
        apiClient.getAdminDashboardStats(),
        apiClient.getAdminGrowthStats(),
        apiClient.getAdminRevenueReport(),
        apiClient.getAdminUserReport(),
      ])

      const dashboard = dashboardRes.status === "fulfilled" ? (dashboardRes.value?.data ?? dashboardRes.value ?? {}) : {}
      const growthStats = growthRes.status === "fulfilled" ? (growthRes.value?.data ?? growthRes.value ?? null) : null
      const revenueReport = revenueRes.status === "fulfilled" ? (revenueRes.value?.data ?? revenueRes.value ?? null) : null
      const userReport = userRes.status === "fulfilled" ? (userRes.value?.data ?? userRes.value ?? null) : null

      const mergedGrowth = mergeGrowthSeries(growthStats)
      const dashboardGrowth = normalizeDashboardGrowth(dashboard?.growthChart)
      const growthSource = mergedGrowth.length ? mergedGrowth : dashboardGrowth

      /* ================== STATS ================== */
      const normalizedStats = {
        ...dashboard,
        totalRevenue: toNumber(dashboard?.totalRevenue ?? revenueReport?.totalRevenue),
        totalTeachers: toNumber(dashboard?.totalTeachers),
        totalStudents: toNumber(dashboard?.totalStudents),
        totalCourses: toNumber(dashboard?.totalCourses),
        totalUsers: toNumber(dashboard?.totalUsers ?? userReport?.totalUsers),
        platformRevenue: toNumber(revenueReport?.platformRevenue),
        teacherRevenue: toNumber(revenueReport?.teacherRevenue),
        revenueGrowth: toNumber(dashboard?.revenueGrowth),
        teacherGrowth: toNumber(dashboard?.teacherGrowth),
        studentGrowth: toNumber(dashboard?.studentGrowth),
        courseGrowth: toNumber(dashboard?.courseGrowth),
      }
      setStats(normalizedStats)

      /* ================== REVENUE CHART ================== */
      if (
        dashboard.revenueChart?.labels?.length &&
        dashboard.revenueChart?.data?.length
      ) {
        const chart = dashboard.revenueChart
        const nextRevenue = chart.labels.map((label: string, i: number) => ({
          month: label,
          revenue: Number(chart.data?.[i] ?? 0),
        }))
        setRevenueData((prev) => (isSameData(prev, nextRevenue) ? prev : nextRevenue))
      } else if (dashboard.recentTransactions?.length) {
        const revenueChart = buildRevenueChart(
          dashboard.recentTransactions.map((t: any) => ({
            createdAt: t.createdAt,
            amount: Number(t.amount ?? 0),
          }))
        )

        const nextRevenue = revenueChart.labels.map((label: string, i: number) => ({
          month: label,
          revenue: revenueChart.data?.[i] ?? 0,
        }))
        setRevenueData((prev) => (isSameData(prev, nextRevenue) ? prev : nextRevenue))
      } else {
        setRevenueData((prev) => (prev.length ? [] : prev))
      }

      /* ================== WEEKLY STATS ================== */
      const nextWeeklyStats = Array.isArray(dashboard.weeklyStats)
        ? dashboard.weeklyStats.map((item: any) => ({
            day: item.day,
            activeUsers: Number(item.activeUsers ?? 0),
            newSignups: Number(item.newSignups ?? 0),
          }))
        : []
      setWeeklyStats((prev) => (isSameData(prev, nextWeeklyStats) ? prev : nextWeeklyStats))

      /* ================== GROWTH CHART ================== */
      setGrowthData((prev) => (isSameData(prev, growthSource) ? prev : growthSource))

      /* ================== CATEGORY DISTRIBUTION ================== */
      const nextCategoryData = Array.isArray(dashboard.categoryDistribution)
        ? dashboard.categoryDistribution.map((item: any, idx: number) => ({
            name: item.categoryName,
            value: Number(item.courseCount ?? 0),
            percentage: Number(item.percentage ?? 0),
            color: pieColors[idx % pieColors.length],
          }))
        : []
      setCategoryData((prev) => (isSameData(prev, nextCategoryData) ? prev : nextCategoryData))

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

      const topCompletion = Array.isArray(dashboard.topStudentsByCompletion) && dashboard.topStudentsByCompletion.length
        ? dashboard.topStudentsByCompletion[0]
        : null

      const radarSource: RadarMetric[] = [
        { metric: t("adm_dash_paid_teachers", "GV trả phí"), value: planSummary.paid },
        { metric: t("adm_dash_free_or_unsub", "GV chưa trả phí"), value: planSummary.free + planSummary.unsubscribed },
        { metric: t("adm_dash_students_with_cert", "HV có chứng chỉ"), value: certSummary.withCertificate },
        { metric: t("adm_dash_students_no_cert", "HV chưa có chứng chỉ"), value: certSummary.withoutCertificate },
        { metric: t("adm_dash_top_completion", "HV hoàn thành nhiều khóa"), value: toNumber(topCompletion?.completedCourses) },
      ].filter((item) => item.value > 0)
      setRadarMetrics((prev) => (isSameData(prev, radarSource) ? prev : radarSource))

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
      setLastSyncedAt(new Date())
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
      if (!silent) setLoading(false)
    }
  }

  loadDashboard()
  const refreshTimer = setInterval(() => {
    void loadDashboard(true)
  }, DASHBOARD_REALTIME_MS)

  return () => clearInterval(refreshTimer)
}, [])

const safeTotalRevenue = Number(stats?.totalRevenue ?? 0)
const safeTotalTeachers = Number(stats?.totalTeachers ?? 0)
const safeTotalStudents = Number(stats?.totalStudents ?? 0)
const safeTotalCourses = Number(stats?.totalCourses ?? 0)
const safePlatformRevenue = Number(stats?.platformRevenue ?? Math.round(safeTotalRevenue * 0.3))
const safeTeacherRevenue = Number(stats?.teacherRevenue ?? Math.max(safeTotalRevenue - safePlatformRevenue, 0))
const safeTotalUsers = Number(stats?.totalUsers ?? (safeTotalTeachers + safeTotalStudents))

const showFallbackMetrics = !hasAnyOverviewData(stats)

const finalTotalRevenue = showFallbackMetrics ? fallbackOverviewMetrics.totalRevenue : safeTotalRevenue
const finalTotalTeachers = showFallbackMetrics ? fallbackOverviewMetrics.totalTeachers : safeTotalTeachers
const finalTotalStudents = showFallbackMetrics ? fallbackOverviewMetrics.totalStudents : safeTotalStudents
const finalTotalCourses = showFallbackMetrics ? fallbackOverviewMetrics.totalCourses : safeTotalCourses
const finalPlatformRevenue = showFallbackMetrics
  ? fallbackOverviewMetrics.platformRevenue
  : (safePlatformRevenue > 0 ? safePlatformRevenue : Math.round(safeTotalRevenue * 0.3))
const finalTeacherRevenue = showFallbackMetrics
  ? fallbackOverviewMetrics.teacherRevenue
  : (safeTeacherRevenue > 0 ? safeTeacherRevenue : Math.max(safeTotalRevenue - finalPlatformRevenue, 0))
const finalTotalUsers = showFallbackMetrics
  ? fallbackOverviewMetrics.totalUsers
  : (safeTotalUsers > 0 ? safeTotalUsers : safeTotalTeachers + safeTotalStudents)

const teacherGrowthPeople = growthData.at(-1)?.teachers ?? Number(stats?.teacherGrowth ?? 0)

const studentGrowthPeople = growthData.at(-1)?.students ?? Number(stats?.studentGrowth ?? 0)

const finalTeacherGrowthPeople = showFallbackMetrics ? fallbackOverviewMetrics.teacherGrowthPeople : teacherGrowthPeople
const finalStudentGrowthPeople = showFallbackMetrics ? fallbackOverviewMetrics.studentGrowthPeople : studentGrowthPeople

const primaryOverviewCards = [
  {
    key: "totalRevenue",
    label: t("adm_dash_total_revenue", "Tổng doanh thu"),
    value: finalTotalRevenue,
    formatter: (value: number) => formatCurrency(Math.round(value)),
    tone: "from-primary/20 to-accent/25",
    icon: DollarSign,
  },
  {
    key: "totalTeachers",
    label: t("adm_dash_total_teachers", "Tổng giáo viên"),
    value: finalTotalTeachers,
    formatter: (value: number) => formatNumber(Math.round(value)),
    tone: "from-purple-200/30 to-blue-200/30",
    icon: Users,
  },
  {
    key: "totalStudents",
    label: t("adm_dash_total_students", "Tổng học viên"),
    value: finalTotalStudents,
    formatter: (value: number) => formatNumber(Math.round(value)),
    tone: "from-green-200/25 to-teal-200/30",
    icon: TrendingUp,
  },
  {
    key: "totalCourses",
    label: t("adm_dash_total_courses", "Tổng khóa học"),
    value: finalTotalCourses,
    formatter: (value: number) => formatNumber(Math.round(value)),
    tone: "from-orange-200/30 to-yellow-200/25",
    icon: BookOpen,
  },
]

const secondaryOverviewCards = [
  {
    key: "platformRevenue",
    label: t("adm_dash_platform_revenue", "Doanh thu nền tảng"),
    value: finalPlatformRevenue,
    formatter: (value: number) => formatCurrency(Math.round(value)),
    badgeClass: "from-primary/25 to-primary/10",
  },
  {
    key: "teacherRevenue",
    label: t("adm_dash_teacher_revenue", "Doanh thu giáo viên"),
    value: finalTeacherRevenue,
    formatter: (value: number) => formatCurrency(Math.round(value)),
    badgeClass: "from-emerald-300/30 to-lime-300/20",
  },
  {
    key: "totalUsers",
    label: t("adm_dash_total_users", "Tổng người dùng"),
    value: finalTotalUsers,
    formatter: (value: number) => formatNumber(Math.round(value)),
    badgeClass: "from-indigo-300/30 to-sky-300/20",
  },
  {
    key: "teacherGrowth",
    label: t("adm_dash_growth_teachers", "Tăng trưởng GV"),
    value: finalTeacherGrowthPeople,
    formatter: (value: number) => formatNumber(Math.round(value)),
    suffix: ` ${t("adm_dash_person_unit", "người")}`,
    badgeClass: "from-fuchsia-300/30 to-violet-300/20",
  },
  {
    key: "studentGrowth",
    label: t("adm_dash_growth_students", "Tăng trưởng HV"),
    value: finalStudentGrowthPeople,
    formatter: (value: number) => formatNumber(Math.round(value)),
    suffix: ` ${t("adm_dash_person_unit", "người")}`,
    badgeClass: "from-cyan-300/30 to-teal-300/20",
  },
]

const overviewMetrics = {
  totalRevenue: finalTotalRevenue,
  totalTeachers: finalTotalTeachers,
  totalStudents: finalTotalStudents,
  totalCourses: finalTotalCourses,
  platformRevenue: finalPlatformRevenue,
  teacherRevenue: finalTeacherRevenue,
  totalUsers: finalTotalUsers,
  teacherGrowth: finalTeacherGrowthPeople,
  studentGrowth: finalStudentGrowthPeople,
}

const { isChanged: isOverviewChanged, getTrend: getOverviewTrend } = useMetricChangeHighlight(overviewMetrics, {
  flashDurationMs: 1300,
})

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
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="w-full space-y-8">
        {/* Header with Background */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10 animate-fadeIn border border-white/40 dark:border-slate-800/70 shadow-[0_20px_60px_rgba(15,23,42,0.18)] bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl" style={{ backgroundImage: "url('/image/bg_login.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/45 via-primary/25 to-accent/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/80"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-3 animate-slideDown" style={{ animationDelay: "0.1s" }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full bg-white/80 text-primary shadow-sm backdrop-blur">
                  {t("adm_dash_label", "Dashboard")}
                </div>
                <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("adm_dash_title", "Bảng điều khiển quản trị")}</h1>
                <p className="text-black/80 dark:text-white/90 drop-shadow">{t("adm_dash_subtitle", "Tổng quan hệ thống ICS Learning - Quản lý toàn diện")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-white/90 text-primary text-sm font-semibold shadow-sm backdrop-blur">
                    {t("adm_dash_period_chip", "Kỳ đang xem")}: {filterPeriod === "day" ? t("adm_dash_day", "Ngày") : filterPeriod === "week" ? t("adm_dash_week", "Tuần") : filterPeriod === "month" ? t("adm_dash_month", "Tháng") : t("adm_dash_year", "Năm")}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-black/15 text-white text-sm font-medium backdrop-blur">
                    {t("adm_dash_live", "Dữ liệu cập nhật tức thời")}
                    <span ref={liveClockTextRef} className="inline-block will-change-transform">{` • ${liveClock.toLocaleTimeString("vi-VN")}`}</span>
                  </span>
                  {lastSyncedAt ? (
                    <span className="px-3 py-1 rounded-full bg-white/75 text-slate-700 text-xs font-semibold shadow-sm backdrop-blur">
                      {t("adm_dash_last_sync", "Lần đồng bộ gần nhất")}: {lastSyncedAt.toLocaleTimeString("vi-VN")}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 animate-slideDown" style={{ animationDelay: "0.2s" }}>
                {[
                  { value: "day", label: t("adm_dash_day", "Ngày") },
                  { value: "week", label: t("adm_dash_week", "Tuần") },
                  { value: "month", label: t("adm_dash_month", "Tháng") },
                  { value: "year", label: t("adm_dash_year", "Năm") },
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setFilterPeriod(period.value)}
                    className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-300 backdrop-blur-sm shadow-sm ${
                      filterPeriod === period.value
                        ? "bg-white text-primary border-white shadow-lg scale-[1.02]"
                        : "bg-white/20 text-white border-white/40 hover:bg-white/30"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Premium KPI Overview */}
            <div className="rounded-2xl border border-white/35 dark:border-slate-800/60 bg-white/20 dark:bg-white/5 backdrop-blur-xl p-4 md:p-5 shadow-[0_14px_40px_rgba(15,23,42,0.16)] space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {primaryOverviewCards.map((item, index) => {
                  const Icon = item.icon
                  return (
                  <div key={item.key} className={`group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border p-4 shadow-[0_10px_26px_rgba(15,23,42,0.16)] transition-all duration-700 ${isOverviewChanged(item.key) ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/50 dark:ring-emerald-500/30" : "border-white/60 dark:border-slate-800"}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.tone} opacity-70 group-hover:opacity-90 transition-opacity duration-300`} />
                    <div className="relative flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          <AnimatedNumber value={item.value} formatter={item.formatter} durationMs={950} delayMs={index * 70} disableAnimation={!isOverviewChanged(item.key)} />
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          {t("adm_dash_periodic_update", "Cập nhật theo kỳ")}
                        </p>
                        <MetricTrendBadge trend={getOverviewTrend(item.key)} />
                      </div>
                      <div className="w-11 h-11 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700 flex items-center justify-center shadow-inner">
                        <Icon size={20} className="text-primary" />
                      </div>
                    </div>
                  </div>
                )})}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {secondaryOverviewCards.map((item, index) => (
                  <div key={item.key} className={`relative overflow-hidden rounded-xl px-3 py-3 bg-white/75 dark:bg-slate-900/70 border shadow-sm backdrop-blur transition-all duration-700 ${isOverviewChanged(item.key) ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/60 dark:border-slate-800"}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.badgeClass} opacity-70`} />
                    <div className="relative space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-slate-600 dark:text-slate-300 font-semibold">{item.label}</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        <AnimatedNumber
                          value={item.value}
                          formatter={item.formatter}
                          suffix={item.suffix}
                          durationMs={950}
                          delayMs={index * 70}
                          disableAnimation={!isOverviewChanged(item.key)}
                        />
                      </p>
                      <MetricTrendBadge trend={getOverviewTrend(item.key)} />
                    </div>
                  </div>
                ))}
              </div>
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
                  contentStyle={chartTooltipStyle}
                  labelStyle={chartTooltipLabelStyle}
                  itemStyle={chartTooltipItemStyle}
                  formatter={(value) => [formatCurrency(Math.round(Number(value ?? 0))), t("adm_dash_revenue", "Doanh thu")]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  isAnimationActive={chartAnimationFlags.revenue}
                  animationBegin={90 + (chartMotionCycle % 2) * 10}
                  animationDuration={1250}
                  animationEasing="ease-out"
                  strokeWidth={2.6}
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
                      isAnimationActive={chartAnimationFlags.category}
                      animationBegin={240 + (chartMotionCycle % 2) * 15}
                      animationDuration={1150}
                      animationEasing="ease-out"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      labelStyle={chartTooltipLabelStyle}
                      itemStyle={chartTooltipItemStyle}
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
                  contentStyle={chartTooltipStyle}
                  labelStyle={chartTooltipLabelStyle}
                  itemStyle={chartTooltipItemStyle}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#colorActive)"
                  isAnimationActive
                  animationDuration={850}
                  animationEasing="ease-out"
                  name={t("adm_dash_active_users", "Người dùng hoạt động")}
                />
                <Area
                  type="monotone"
                  dataKey="newSignups"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorSignups)"
                  isAnimationActive
                  animationDuration={950}
                  animationEasing="ease-out"
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
                  contentStyle={chartTooltipStyle}
                  labelStyle={chartTooltipLabelStyle}
                  itemStyle={chartTooltipItemStyle}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="teachers" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                  dot={{ fill: "#8b5cf6" }}
                  activeDot={{ r: 6 }}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                  name={t("adm_dash_teachers", "Giáo viên")} 
                />
                <Line 
                  type="monotone" 
                  dataKey="students" 
                  stroke="#06b6d4" 
                  strokeWidth={2} 
                  dot={{ fill: "#06b6d4" }}
                  activeDot={{ r: 6 }}
                  isAnimationActive
                  animationDuration={980}
                  animationEasing="ease-out"
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
                    isAnimationActive={chartAnimationFlags.radar}
                    animationBegin={420 + (chartMotionCycle % 2) * 20}
                    animationDuration={1300}
                    animationEasing="ease-out"
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                    itemStyle={chartTooltipItemStyle}
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
                    <Pie data={teacherPlanData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} label isAnimationActive animationDuration={900} animationEasing="ease-out">
                      {teacherPlanData.map((entry, idx) => (
                        <Cell key={`plan-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [formatNumber(Number(value ?? 0)), String(name)]}
                      contentStyle={chartTooltipStyle}
                      labelStyle={chartTooltipLabelStyle}
                      itemStyle={chartTooltipItemStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">
                      {t("adm_dash_paid_teachers", "GV trả phí")}: <AnimatedNumber value={teacherPlanSummary?.paid || 0} formatter={formatNumber} />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3b82f6" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">
                      {t("adm_dash_free_teachers", "GV miễn phí")}: <AnimatedNumber value={teacherPlanSummary?.free || 0} formatter={formatNumber} />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f97316" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">
                      {t("adm_dash_unsub_teachers", "Chưa đăng ký")}: <AnimatedNumber value={teacherPlanSummary?.unsubscribed || 0} formatter={formatNumber} />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#94a3b8" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">
                      {t("adm_dash_total_teachers", "Tổng GV")}: <AnimatedNumber value={teacherPlanSummary?.total || 0} formatter={formatNumber} />
                    </span>
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
                    <Pie data={certificateData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} label isAnimationActive animationDuration={950} animationEasing="ease-out">
                      {certificateData.map((entry, idx) => (
                        <Cell key={`cert-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [formatNumber(Number(value ?? 0)), String(name)]}
                      contentStyle={chartTooltipStyle}
                      labelStyle={chartTooltipLabelStyle}
                      itemStyle={chartTooltipItemStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#a855f7" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">
                      {t("adm_dash_students_with_cert", "HV có chứng chỉ")}: <AnimatedNumber value={certificateSummary?.withCertificate || 0} formatter={formatNumber} />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">
                      {t("adm_dash_students_no_cert", "HV chưa có")}: <AnimatedNumber value={certificateSummary?.withoutCertificate || 0} formatter={formatNumber} />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#0ea5e9" }}></span>
                    <span className="text-muted-foreground dark:text-slate-300">
                      {t("adm_dash_cert_total", "Tổng chứng chỉ")}: <AnimatedNumber value={certificateSummary?.totalCertificates || 0} formatter={formatNumber} />
                    </span>
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
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                    itemStyle={chartTooltipItemStyle}
                  />
                  <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 6, 6]} isAnimationActive animationDuration={920} animationEasing="ease-out">
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
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                    itemStyle={chartTooltipItemStyle}
                  />
                  <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 6, 6]} isAnimationActive animationDuration={980} animationEasing="ease-out">
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
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                    itemStyle={chartTooltipItemStyle}
                  />
                  <Bar dataKey="value" fill="#f97316" radius={[6, 6, 6, 6]} isAnimationActive animationDuration={1030} animationEasing="ease-out">
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
