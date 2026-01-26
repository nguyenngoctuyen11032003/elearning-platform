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
import { useState } from "react"

// Pie chart data - Phân bố khóa học theo danh mục
const courseDistribution = [
  { name: "Web Development", value: 35, color: "#2563eb" },
  { name: "Data Science", value: 25, color: "#06b6d4" },
  { name: "Mobile App", value: 20, color: "#8b5cf6" },
  { name: "UI/UX Design", value: 12, color: "#ec4899" },
  { name: "Khác", value: 8, color: "#f59e0b" },
]

// Area chart data - Doanh thu theo tuần
const weeklyPerformance = [
  { day: "T2", revenue: 1200, target: 1000 },
  { day: "T3", revenue: 1800, target: 1500 },
  { day: "T4", revenue: 1400, target: 1200 },
  { day: "T5", revenue: 2200, target: 1800 },
  { day: "T6", revenue: 2800, target: 2000 },
  { day: "T7", revenue: 3200, target: 2500 },
  { day: "CN", revenue: 1600, target: 1000 },
]

const revenueData = [
  { month: "1", revenue: 2400, students: 400 },
  { month: "2", revenue: 1398, students: 300 },
  { month: "3", revenue: 9800, students: 200 },
  { month: "4", revenue: 3908, students: 278 },
  { month: "5", revenue: 4800, students: 189 },
  { month: "6", revenue: 3800, students: 239 },
  { month: "7", revenue: 4200, students: 280 },
  { month: "8", revenue: 5100, students: 320 },
  { month: "9", revenue: 4800, students: 300 },
  { month: "10", revenue: 5500, students: 350 },
  { month: "11", revenue: 6200, students: 380 },
  { month: "12", revenue: 7100, students: 420 },
]

const recentEnrollments = [
  { id: 1, name: "Trần Văn A", course: "Next.js Advanced", date: "2025-01-15", status: "active" },
  { id: 2, name: "Nguyễn Thị B", course: "React Hooks", date: "2025-01-14", status: "active" },
  { id: 3, name: "Lê Minh C", course: "Next.js Advanced", date: "2025-01-13", status: "completed" },
  { id: 4, name: "Phạm Quốc D", course: "Python Data Science", date: "2025-01-12", status: "active" },
  { id: 5, name: "Hoàng Thị E", course: "UI/UX Design", date: "2025-01-11", status: "active" },
]

export default function TeacherDashboard() {
  const [filterPeriod, setFilterPeriod] = useState("month")

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Stats with Header */}
        <div className="relative overflow-hidden rounded-3xl p-8 animate-fadeIn" style={{ backgroundImage: "url('/image/bg_dashboard.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/10 dark:bg-black/10 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2 drop-shadow-lg">Chào mừng, Nguyễn Ngọc Tuyền</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Đây là tổng quan về hoạt động của bạn</p>
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
                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium backdrop-blur-sm ${
                      filterPeriod === period.value
                        ? "bg-white text-primary shadow-lg"
                        : "bg-black/10 text-black dark:bg-white/20 dark:text-white hover:bg-black/30 dark:hover:bg-white/40"
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
                <StatCard icon={TrendingUp} title="Tổng doanh thu" value="₫45,230,000" change="+12% so với tháng trước" />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <StatCard icon={Users} title="Học viên" value="1,250" change="+45 học viên mới" />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <StatCard icon={BookOpen} title="Khóa học" value="8" change="2 khóa học đang hoạt động" />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <StatCard icon={Star} title="Đánh giá trung bình" value="4.8★" change="Từ 1,250 đánh giá" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Doanh thu</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
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
          </div>

          {/* Student Growth Chart */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Học viên mới</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis stroke="#94a3b8" />
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
          </div>
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Course Distribution */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 animate-fadeIn">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Phân bố khóa học</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={courseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                >
                  {courseDistribution.map((entry, index) => (
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
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {courseDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground dark:text-slate-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Area Chart - Weekly Performance */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 animate-fadeIn">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Hiệu suất tuần này</h3>
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
                  formatter={(value: number) => [`₫${value.toLocaleString()}k`, ""]}
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
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-foreground dark:text-white mb-4">Đăng ký gần đây</h3>
          <div className="overflow-x-auto">
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
                {recentEnrollments.map((enrollment) => (
                  <tr
                    key={enrollment.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    <td className="py-3 px-4 text-foreground dark:text-white">{enrollment.name}</td>
                    <td className="py-3 px-4 text-foreground dark:text-white">{enrollment.course}</td>
                    <td className="py-3 px-4 text-muted-foreground dark:text-slate-400">{enrollment.date}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          enrollment.status === "active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        }`}
                      >
                        {enrollment.status === "active" ? "Đang học" : "Hoàn thành"}
                      </span>
                    </td>
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
