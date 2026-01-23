"use client"

import { RollingNumber } from "@/components/ui/rolling-number"
import { Users, BookOpen, CreditCard } from "lucide-react"
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
import { useState } from "react"
import { formatPrice } from "@/lib/format"

const revenueData = [
  { month: "Jan", revenue: 24000, teachers: 45, students: 400 },
  { month: "Feb", revenue: 13980, teachers: 52, students: 300 },
  { month: "Mar", revenue: 98000, teachers: 58, students: 200 },
  { month: "Apr", revenue: 39080, teachers: 65, students: 278 },
  { month: "May", revenue: 48000, teachers: 72, students: 189 },
  { month: "Jun", revenue: 38000, teachers: 78, students: 239 },
]

const categoryData = [
  { name: "Lập trình", value: 35 },
  { name: "Thiết kế", value: 25 },
  { name: "Kinh doanh", value: 20 },
  { name: "AI & Data", value: 20 },
]

const COLORS = ["#2563eb", "#06b6d4", "#8b5cf6", "#ec4899"]

const recentTransactions = [
  { id: 1, user: "Trần Văn A", course: "Next.js Advanced", amount: 499000, status: "success", date: "2025-01-15" },
  { id: 2, user: "Nguyễn Thị B", course: "React Hooks", amount: 399000, status: "success", date: "2025-01-14" },
  { id: 3, user: "Lê Minh C", course: "Python Data Science", amount: 549000, status: "pending", date: "2025-01-13" },
  { id: 4, user: "Phạm Quốc D", course: "UI/UX Design", amount: 349000, status: "success", date: "2025-01-12" },
  { id: 5, user: "Hoàng Thị E", course: "Branding", amount: 349000, status: "failed", date: "2025-01-11" },
]

export default function AdminDashboard() {
  const [filterPeriod, setFilterPeriod] = useState("month")

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">Bảng điều khiển quản trị</h1>
            <p className="text-muted-foreground dark:text-slate-400">Tổng quan hệ thống ICS Learning</p>
          </div>
          <div className="flex gap-2">
            {["day", "week", "month", "year"].map((period) => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={`px-4 py-2 rounded-lg transition-smooth font-medium ${
                  filterPeriod === period
                    ? "bg-primary text-white"
                    : "bg-secondary dark:bg-slate-800 text-foreground dark:text-white hover:bg-secondary/80"
                }`}
              >
                {period === "day" ? "Ngày" : period === "week" ? "Tuần" : period === "month" ? "Tháng" : "Năm"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats - Changed to show Teachers and Students separately, removed completion rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng doanh thu</p>
                <p className="text-3xl font-bold text-foreground dark:text-white mt-2">
                  ₫<RollingNumber value={245230000} prefix="" suffix="" decimals={0} />
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">+18% so với tháng trước</p>
              </div>
              <CreditCard size={32} className="text-primary dark:text-accent opacity-20" />
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng giáo viên</p>
                <p className="text-3xl font-bold text-foreground dark:text-white mt-2">
                  <RollingNumber value={450} />
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">+45 giáo viên mới</p>
              </div>
              <Users size={32} className="text-primary dark:text-accent opacity-20" />
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng học viên</p>
                <p className="text-3xl font-bold text-foreground dark:text-white mt-2">
                  <RollingNumber value={12000} />
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">+405 học viên mới</p>
              </div>
              <Users size={32} className="text-primary dark:text-accent opacity-20" />
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng khóa học</p>
                <p className="text-3xl font-bold text-foreground dark:text-white mt-2">
                  <RollingNumber value={245} />
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">+12 khóa học mới</p>
              </div>
              <BookOpen size={32} className="text-primary dark:text-accent opacity-20" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Doanh thu</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
          </div>

          {/* Category Distribution */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Phân bố danh mục</h3>
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
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teacher Growth */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Tăng trưởng giáo viên</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="teachers" stroke="#8b5cf6" strokeWidth={2} name="Giáo viên" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Student Growth */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Tăng trưởng học viên</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#06b6d4" name="Học viên" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
