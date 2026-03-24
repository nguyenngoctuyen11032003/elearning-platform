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
} from "recharts"
import { useState, useEffect } from "react"
import { formatPrice, formatCurrency, formatCurrencyByLanguage, formatDateSafe } from "@/lib/format"
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

const pieColors = ["#2563eb", "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]

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
          date: new Date(item.createdAt).toLocaleDateString("vi-VN"),
        }))
      )
    } catch (err) {
      console.error("Dashboard error:", err)
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
  change={`+${stats?.teacherGrowth || 0}% ${t("adm_dash_vs_last_month", "so với tháng trước")}`}
/>

<StatCard
  icon={Users}
  title={t("adm_dash_total_students", "Tổng học viên")}
  value={stats?.totalStudents || 0}
  change={`+${stats?.studentGrowth || 0}% ${t("adm_dash_vs_last_month", "so với tháng trước")}`}
/>

<StatCard
  icon={BookOpen}
  title={t("adm_dash_total_courses", "Tổng khóa học")}
  value={stats?.totalCourses || 0}
  change={`+${stats?.courseGrowth || 0}% ${t("adm_dash_vs_last_month", "so với tháng trước")}`}
/>
<StatCard
  icon={CreditCard}
  title={t("adm_dash_total_revenue", "Tổng doanh thu")}
  value={formatCurrency(Math.round(Number(stats?.totalRevenue || 0)))}
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
