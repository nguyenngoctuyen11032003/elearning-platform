"use client"

import { StatCard } from "@/components/ui/stat-card"
import { Users, BookOpen, CreditCard, TrendingUp, Star, UserCheck, Target } from "lucide-react"
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
import { formatPrice, formatCurrency } from "@/lib/format"
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
    const day = format(new Date(tx.createdAt), "d MMM") // ví dụ: 29 Jan
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
          ? dashboard.growthChart.map((item: any) => ({
              month: item.month?.length === 7
                ? format(new Date(`${item.month}-01`), "MM/yyyy")
                : item.month,
              teachers: Number(item.teachers ?? 0),
              students: Number(item.students ?? 0),
            }))
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
      <p>Đang tải dashboard...</p>
    </div>
  )
}
  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-6 md:space-y-8">
        {/* Header with Background */}
        <div className="relative overflow-hidden rounded-3xl p-4 sm:p-6 lg:p-8" style={{ backgroundImage: "url('/image/bg_dashboard.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/10 dark:bg-black/10"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-2 drop-shadow-lg">Bảng điều khiển quản trị</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Tổng quan hệ thống ICS Learning - Quản lý toàn diện</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "day", label: "Ngày" },
                  { value: "week", label: "Tuần" },
                  { value: "month", label: "Tháng" },
                  { value: "year", label: "Năm" },
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setFilterPeriod(period.value)}
                    className={`min-h-10 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-all duration-300 font-medium backdrop-blur-sm ${
                      filterPeriod === period.value
                        ? "bg-white text-primary shadow-lg"
                        : "bg-white/30 text-slate-900 dark:text-white hover:bg-white/45"
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
  title="Tổng giáo viên"
  value={stats?.totalTeachers || 0}
  change={`+${stats?.teacherGrowth || 0}% so với tháng trước`}
/>

<StatCard
  icon={Users}
  title="Tổng học viên"
  value={stats?.totalStudents || 0}
  change={`+${stats?.studentGrowth || 0}% so với tháng trước`}
/>

<StatCard
  icon={BookOpen}
  title="Tổng khóa học"
  value={stats?.totalCourses || 0}
  change={`+${stats?.courseGrowth || 0}% so với tháng trước`}
/>
<StatCard
  icon={CreditCard}
  title="Tổng doanh thu"
  value={formatCurrency(Math.round(Number(stats?.totalRevenue || 0)))}
  change={`${stats?.revenueGrowth || 0}% so với 30 ngày trước`}
/>

            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Doanh thu theo tháng</h3>
            {revenueData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                Chưa có dữ liệu doanh thu
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
                  formatter={(value: number) => [formatCurrency(Math.round(value)), "Doanh thu"]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Doanh thu"
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>

          {/* Category Distribution */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6 animate-fadeIn">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Phân bố khóa học</h3>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">Chưa có dữ liệu danh mục</p>
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
                      formatter={(value: number, name: string, props) => [
                        `${value} khóa (${categoryData[props?.payload?.index || 0]?.percentage ?? 0}%)`,
                        name,
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
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Hoạt động người dùng tuần này</h3>
            {weeklyStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              Chưa có dữ liệu tuần này
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
                  name="Người dùng hoạt động"
                />
                <Area
                  type="monotone"
                  dataKey="newSignups"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorSignups)"
                  name="Đăng ký mới"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          </div>

          {/* Teacher & Student Growth */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Tăng trưởng theo tháng</h3>
            {growthData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                Chưa có dữ liệu tăng trưởng
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
                  name="Giáo viên" 
                />
                <Line 
                  type="monotone" 
                  dataKey="students" 
                  stroke="#06b6d4" 
                  strokeWidth={2} 
                  dot={{ fill: "#06b6d4" }}
                  name="Học viên" 
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-foreground dark:text-white mb-4">Giao dịch gần đây</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">
                    Người dùng
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">
                    Khóa học
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">Số tiền</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">
                    Trạng thái
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    <td className="py-3 px-4 text-foreground dark:text-white">{transaction.user}</td>
                    <td className="py-3 px-4 text-foreground dark:text-white">{transaction.course}</td>
                    <td className="py-3 px-4 text-foreground dark:text-white">
                      ₫{formatPrice(transaction.amount)}
                    </td>
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
                          ? "Thành công"
                          : transaction.status === "pending"
                            ? "Chờ xử lý"
                            : "Thất bại"}
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
