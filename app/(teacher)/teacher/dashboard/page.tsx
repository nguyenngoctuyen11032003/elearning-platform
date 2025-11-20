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
} from "recharts"
import { useState } from "react"

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
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Filter */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">Chào mừng, Nguyễn Ngọc Tuyền</h1>
            <p className="text-muted-foreground dark:text-slate-400">Đây là tổng quan về hoạt động của bạn</p>
          </div>
          <div className="flex gap-2">
            {["month", "year"].map((period) => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={`px-4 py-2 rounded-lg transition-smooth font-medium ${
                  filterPeriod === period
                    ? "bg-primary text-white"
                    : "bg-secondary dark:bg-slate-800 text-foreground dark:text-white hover:bg-secondary/80"
                }`}
              >
                {period === "month" ? "Tháng" : "Năm"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={TrendingUp} title="Tổng doanh thu" value="₫45,230,000" change="+12% so với tháng trước" />
          <StatCard icon={Users} title="Học viên" value="1,250" change="+45 học viên mới" />
          <StatCard icon={BookOpen} title="Khóa học" value="8" change="2 khóa học đang hoạt động" />
          <StatCard icon={Star} title="Đánh giá trung bình" value="4.8★" change="Từ 1,250 đánh giá" />
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
