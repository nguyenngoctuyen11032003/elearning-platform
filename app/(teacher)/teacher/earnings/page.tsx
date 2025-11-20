"use client"

import { useState } from "react"
import { Download, TrendingUp, DollarSign, Users } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { ExportModal } from "@/components/ui/export-modal"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function TeacherEarningsPage() {
  const [filterPeriod, setFilterPeriod] = useState("month")
  const [isExportOpen, setIsExportOpen] = useState(false)

  const earningsData = [
    { month: "1", revenue: 2400, students: 240 },
    { month: "2", revenue: 3210, students: 321 },
    { month: "3", revenue: 2290, students: 229 },
    { month: "4", revenue: 2000, students: 200 },
    { month: "5", revenue: 2181, students: 218 },
    { month: "6", revenue: 2500, students: 250 },
    { month: "7", revenue: 2800, students: 280 },
    { month: "8", revenue: 3100, students: 310 },
    { month: "9", revenue: 2900, students: 290 },
    { month: "10", revenue: 3400, students: 340 },
    { month: "11", revenue: 3800, students: 380 },
    { month: "12", revenue: 4200, students: 420 },
  ]

  const exportData = earningsData.map((item) => ({
    Tháng: item.month,
    "Doanh thu (VND)": item.revenue,
    "Học viên mới": item.students,
  }))

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Filter */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Doanh thu</h1>
            <p className="text-muted-foreground dark:text-slate-400">Theo dõi thu nhập từ các khóa học của bạn</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={TrendingUp} title="Tổng doanh thu" value="₫14.581.000" change="+12.5% so với tháng trước" />
          <StatCard icon={DollarSign} title="Doanh thu tháng này" value="₫2.500.000" change="+8.2%" />
          <StatCard icon={Users} title="Số học viên mới" value="45" change="+5.1%" />
        </div>

        {/* Chart */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white">Doanh thu theo tháng</h2>
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth"
            >
              <Download size={18} />
              Xuất báo cáo
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                strokeWidth={2}
                dot={{ fill: "#2563EB" }}
                name="Doanh thu"
              />
              <Line
                type="monotone"
                dataKey="students"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={{ fill: "#06B6D4" }}
                name="Học viên mới"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Báo cáo doanh thu"
        data={exportData}
      />
    </main>
  )
}
