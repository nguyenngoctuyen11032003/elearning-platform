"use client"

import { StatCard } from "@/components/ui/stat-card"
import { TrendingUp, Users, BookOpen, Star } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { useEffect, useState } from "react"
import { formatPrice, formatNumber } from "@/lib/format"
import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"

type ChartPoint = { label: string; value: number }
type PieItem = { name: string; value: number; color?: string }
type WeeklyPoint = { day: string; revenue: number; target: number }
type EnrollmentRow = { id: string; studentName: string; courseName: string; createdAt: string; status?: string }

const PIE_COLORS = ["#2563eb", "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e"]

export default function TeacherDashboard() {
  const [filterPeriod, setFilterPeriod] = useState("month")
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [revenueChart, setRevenueChart] = useState<ChartPoint[]>([])
  const [studentChart, setStudentChart] = useState<ChartPoint[]>([])
  const [pieData, setPieData] = useState<PieItem[]>([])
  const [weeklyPerformance, setWeeklyPerformance] = useState<WeeklyPoint[]>([])
  const [recentEnrollments, setRecentEnrollments] = useState<EnrollmentRow[]>([])

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
            value: item.value,
            color: PIE_COLORS[idx % PIE_COLORS.length],
          }))
        )

        setWeeklyPerformance(Array.isArray(dashboard.weeklyPerformance) ? dashboard.weeklyPerformance : [])

        setRecentEnrollments(
          (dashboard.recentEnrollments ?? []).map((item: any) => ({
            id: item.id,
            studentName: item.studentName,
            courseName: item.courseName,
            createdAt: new Date(item.createdAt).toLocaleDateString("vi-VN"),
            status: item.status,
          }))
        )
      } catch (error) {
        console.error("Lỗi tải dashboard giáo viên:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Đang tải dữ liệu dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-6 md:space-y-8">
        {/* Stats with Header */}
        <div className="relative overflow-hidden rounded-3xl p-4 sm:p-6 lg:p-8 animate-fadeIn" style={{ backgroundImage: "url('/image/bg_dashboard.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">Chào mừng, {user?.name || "Giáo viên"}</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Tổng quan hoạt động của bạn</p>
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
                    className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-all duration-300 font-medium backdrop-blur-sm ${
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
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <StatCard
                  icon={TrendingUp}
                  title="Tổng doanh thu"
                  value={`₫${formatPrice(stats?.totalRevenue ?? 0)}`}
                  change={`+${stats?.revenueGrowth ?? 0}% so với kỳ trước`}
                />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <StatCard
                  icon={Users}
                  title="Học viên"
                  value={formatNumber(stats?.totalStudents ?? 0)}
                  change={`+${stats?.studentGrowth ?? 0}% so với kỳ trước`}
                />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <StatCard
                  icon={BookOpen}
                  title="Khóa học"
                  value={formatNumber(stats?.totalCourses ?? 0)}
                  change="Số khóa đang hoạt động"
                />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <StatCard
                  icon={Star}
                  title="Đánh giá trung bình"
                  value={`${(stats?.averageRating ?? 0).toFixed(1)}★`}
                  change={`Từ ${formatNumber(stats?.totalStudents ?? 0)} học viên`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Doanh thu</h3>
            {revenueChart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">Chưa có dữ liệu doanh thu</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChart.map(item => ({ month: item.label, revenue: item.value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number | undefined) => [`₫${formatPrice(value ?? 0)}`, ""]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: "#2563eb" }}
                    name="Doanh thu"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Student Growth Chart */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Học viên mới</h3>
            {studentChart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">Chưa có dữ liệu học viên</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studentChart.map(item => ({ month: item.label, students: item.value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="students" fill="#06b6d4" name="Học viên mới" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Course Distribution */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6 animate-fadeIn">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Phân bố khóa học</h3>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">Chưa có dữ liệu khóa học</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
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
                      formatter={(value: number | undefined, name?: string) => [`${value ?? 0}`, name ?? ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground dark:text-slate-400">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Area Chart - Weekly Performance */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 animate-fadeIn">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Hiệu suất tuần này</h3>
            {weeklyPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">Chưa có dữ liệu tuần này</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={weeklyPerformance}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                    formatter={(value: number | undefined) => [`₫${formatPrice(value ?? 0)}`, ""]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Thực tế"
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorTarget)"
                    name="Mục tiêu"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Enrollments - Mobile: Cards, Desktop: Table */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-foreground dark:text-white mb-4">Đăng ký gần đây</h3>
          {/* Mobile: Cards */}
          <div className="block md:hidden">
            {recentEnrollments.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">Chưa có đăng ký nào</div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {recentEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="border border-border dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-2 animate-fadeIn"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {enrollment.studentName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground dark:text-white text-base">{enrollment.studentName}</div>
                        <div className="text-xs text-muted-foreground dark:text-slate-400">{enrollment.courseName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground dark:text-slate-400">Ngày đăng ký:</span>
                      <span className="text-sm text-foreground dark:text-white">{enrollment.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground dark:text-slate-400">Trạng thái:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          enrollment.status === "completed"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        }`}
                      >
                        {enrollment.status === "completed" ? "Hoàn thành" : "Đang học"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">
                    Học viên
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">
                    Khóa học
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">
                    Ngày đăng ký
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground dark:text-slate-400">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      Chưa có đăng ký nào
                    </td>
                  </tr>
                ) : (
                  recentEnrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                    >
                      <td className="py-3 px-4 text-foreground dark:text-white">{enrollment.studentName}</td>
                      <td className="py-3 px-4 text-foreground dark:text-white">{enrollment.courseName}</td>
                      <td className="py-3 px-4 text-muted-foreground dark:text-slate-400">{enrollment.createdAt}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            enrollment.status === "completed"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          }`}
                        >
                          {enrollment.status === "completed" ? "Hoàn thành" : "Đang học"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
