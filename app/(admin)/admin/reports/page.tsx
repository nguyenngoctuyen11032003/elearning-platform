"use client"

import { Users, BookOpen, DollarSign, Download } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useState } from "react"
import { ExportModal } from "@/components/ui/export-modal"

const revenueData = [
  { month: "Jan", revenue: 4000, teachers: 240, students: 400 },
  { month: "Feb", revenue: 3000, teachers: 221, students: 350 },
  { month: "Mar", revenue: 2000, teachers: 229, students: 300 },
  { month: "Apr", revenue: 2780, teachers: 200, students: 280 },
  { month: "May", revenue: 1890, teachers: 229, students: 250 },
  { month: "Jun", revenue: 2390, teachers: 200, students: 320 },
  { month: "Jul", revenue: 3490, teachers: 250, students: 380 },
  { month: "Aug", revenue: 4200, teachers: 280, students: 420 },
  { month: "Sep", revenue: 3800, teachers: 260, students: 400 },
  { month: "Oct", revenue: 4500, teachers: 300, students: 450 },
  { month: "Nov", revenue: 5100, teachers: 320, students: 480 },
  { month: "Dec", revenue: 5800, teachers: 350, students: 520 },
]

const categoryData = [
  { name: "Lập trình", value: 35, fill: "#2563eb" },
  { name: "Thiết kế", value: 25, fill: "#06b6d4" },
  { name: "AI & Data", value: 20, fill: "#8b5cf6" },
  { name: "Marketing", value: 20, fill: "#ec4899" },
]

const coursePerformance = [
  { id: 1, title: "Next.js Advanced", students: 1250, rating: 4.8, revenue: 624500000 },
  { id: 2, title: "React Hooks", students: 890, rating: 4.7, revenue: 445000000 },
  { id: 3, title: "UI/UX Design", students: 1567, rating: 4.9, revenue: 783500000 },
  { id: 4, title: "Python Data Science", students: 450, rating: 4.6, revenue: 225000000 },
]

export default function AdminReportsPage() {
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState("revenue")
  const [filterPeriod, setFilterPeriod] = useState("month")

  const handleExport = (reportType: string) => {
    setSelectedReport(reportType)
    setIsExportOpen(true)
  }

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Báo cáo & Phân tích</h1>
            <p className="text-muted-foreground dark:text-slate-400">Xem chi tiết hiệu suất nền tảng</p>
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

        {/* Key Metrics - Changed to show Teachers and Students separately */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: "Tổng doanh thu", value: "₫2.5B", change: "+12.5%" },
            { icon: Users, label: "Tổng giáo viên", value: "350", change: "+8.2%" },
            { icon: Users, label: "Tổng học viên", value: "5,234", change: "+15.3%" },
            { icon: BookOpen, label: "Khóa học", value: "156", change: "+4.3%" },
          ].map((metric, i) => (
            <div
              key={i}
              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white mt-2">{metric.value}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">{metric.change} so với tháng trước</p>
                </div>
                <metric.icon size={32} className="text-primary dark:text-accent opacity-20" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground dark:text-white">Doanh thu</h2>
              <button
                onClick={() => handleExport("revenue")}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <Download size={18} className="text-muted-foreground dark:text-slate-400" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} name="Doanh thu" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground dark:text-white">Phân bố theo danh mục</h2>
              <button
                onClick={() => handleExport("category")}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <Download size={18} className="text-muted-foreground dark:text-slate-400" />
              </button>
            </div>
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
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Charts - Separated Teachers and Students */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teacher Growth */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground dark:text-white">Tăng trưởng giáo viên</h2>
              <button
                onClick={() => handleExport("teachers")}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <Download size={18} className="text-muted-foreground dark:text-slate-400" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="teachers" stroke="#8b5cf6" strokeWidth={2} name="Giáo viên" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Student Growth */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground dark:text-white">Tăng trưởng học viên</h2>
              <button
                onClick={() => handleExport("students")}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <Download size={18} className="text-muted-foreground dark:text-slate-400" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#06b6d4" name="Học viên" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Performance */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground dark:text-white">Hiệu suất khóa học</h2>
            <button
              onClick={() => handleExport("courses")}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-smooth"
            >
              <Download size={16} /> Xuất
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800">
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Khóa học</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Học viên</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Đánh giá</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {coursePerformance.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth"
                  >
                    <td className="py-3 px-4 text-foreground dark:text-white font-medium">{course.title}</td>
                    <td className="py-3 px-4 text-foreground dark:text-white">{course.students.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-foreground dark:text-white font-medium">{course.rating}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-primary dark:text-accent font-semibold">
                      ₫{(course.revenue / 1000000).toFixed(1)}M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title={
          selectedReport === "revenue"
            ? "Báo cáo doanh thu"
            : selectedReport === "category"
              ? "Báo cáo danh mục"
              : selectedReport === "teachers"
                ? "Báo cáo giáo viên"
                : selectedReport === "students"
                  ? "Báo cáo học viên"
                  : selectedReport === "courses"
                    ? "Báo cáo khóa học"
                    : "Báo cáo"
        }
        data={
          selectedReport === "revenue"
            ? revenueData
            : selectedReport === "category"
              ? categoryData
              : selectedReport === "courses"
                ? coursePerformance
                : revenueData
        }
      />
    </div>
  )
}
