"use client"

import { Users, BookOpen, DollarSign, Download, X } from "lucide-react"
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
import { formatStudentCount } from "@/lib/format"

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

// Weekly data
const weeklyData = [
  { day: "T2", revenue: 800, students: 45 },
  { day: "T3", revenue: 920, students: 52 },
  { day: "T4", revenue: 750, students: 38 },
  { day: "T5", revenue: 1100, students: 61 },
  { day: "T6", revenue: 980, students: 55 },
  { day: "T7", revenue: 1250, students: 72 },
  { day: "CN", revenue: 600, students: 35 },
]

// Daily data (last 7 days)
const dailyData = [
  { date: "13/01", revenue: 180, students: 12 },
  { date: "14/01", revenue: 220, students: 15 },
  { date: "15/01", revenue: 195, students: 11 },
  { date: "16/01", revenue: 280, students: 18 },
  { date: "17/01", revenue: 310, students: 22 },
  { date: "18/01", revenue: 245, students: 16 },
  { date: "19/01", revenue: 290, students: 19 },
]

const categoryData = [
  { name: "Lập trình", value: 35, fill: "#2563eb" },
  { name: "Thiết kế", value: 25, fill: "#06b6d4" },
  { name: "AI & Data", value: 20, fill: "#8b5cf6" },
  { name: "Marketing", value: 20, fill: "#ec4899" },
]

const coursePerformance = [
  { id: 1, title: "Next.js Advanced", students: 1250, rating: 4.8, revenue: 624500000, teacher: "Nguyễn Thị B", category: "Lập trình" },
  { id: 2, title: "React Hooks Mastery", students: 890, rating: 4.7, revenue: 445000000, teacher: "Nguyễn Thị B", category: "Lập trình" },
  { id: 3, title: "UI/UX Design Pro", students: 1567, rating: 4.9, revenue: 783500000, teacher: "Lê Văn G", category: "Thiết kế" },
  { id: 4, title: "Python Data Science", students: 450, rating: 4.6, revenue: 225000000, teacher: "Trần Minh E", category: "AI & Data" },
  { id: 5, title: "Digital Marketing", students: 680, rating: 4.5, revenue: 340000000, teacher: "Phạm Thị I", category: "Marketing" },
]

const teachers = [...new Set(coursePerformance.map(c => c.teacher))]
const categories = [...new Set(coursePerformance.map(c => c.category))]
const courses = coursePerformance.map(c => c.title)

export default function AdminReportsPage() {
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState("revenue")
  const [filterPeriod, setFilterPeriod] = useState("month")

  // Export options
  const [exportCourse, setExportCourse] = useState("all")
  const [exportTeacher, setExportTeacher] = useState("all")
  const [exportCategory, setExportCategory] = useState("all")
  const [exportDateFrom, setExportDateFrom] = useState("")
  const [exportDateTo, setExportDateTo] = useState("")

  const handleExport = (reportType: string) => {
    setSelectedReport(reportType)
    setIsExportOpen(true)
  }

  const executeExport = () => {
    // Generate CSV based on report type and filters
    let data: any[] = []
    let headers: string[] = []

    if (selectedReport === "revenue") {
      headers = ["Tháng", "Doanh thu", "Giáo viên", "Học viên"]
      data = revenueData.map(r => [r.month, r.revenue.toString(), r.teachers.toString(), r.students.toString()])
    } else if (selectedReport === "courses") {
      let filteredCourses = coursePerformance
      if (exportCourse !== "all") {
        filteredCourses = filteredCourses.filter(c => c.title === exportCourse)
      }
      if (exportTeacher !== "all") {
        filteredCourses = filteredCourses.filter(c => c.teacher === exportTeacher)
      }
      if (exportCategory !== "all") {
        filteredCourses = filteredCourses.filter(c => c.category === exportCategory)
      }
      headers = ["Khóa học", "Giảng viên", "Danh mục", "Học viên", "Đánh giá", "Doanh thu"]
      data = filteredCourses.map(c => [c.title, c.teacher, c.category, c.students.toString(), c.rating.toString(), c.revenue.toString()])
    } else if (selectedReport === "category") {
      headers = ["Danh mục", "Tỷ lệ (%)"]
      data = categoryData.map(c => [c.name, c.value.toString()])
    } else if (selectedReport === "teachers" || selectedReport === "students") {
      headers = ["Tháng", selectedReport === "teachers" ? "Số giáo viên" : "Số học viên"]
      data = revenueData.map(r => [r.month, selectedReport === "teachers" ? r.teachers.toString() : r.students.toString()])
    }

    const csvContent = [headers, ...data].map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${selectedReport}_report_${new Date().toISOString().split("T")[0]}.csv`
    link.click()

    setIsExportOpen(false)
  }

  // Get data based on period
  const getChartData = () => {
    switch (filterPeriod) {
      case "day":
        return dailyData
      case "week":
        return weeklyData
      case "month":
      case "year":
      default:
        return revenueData
    }
  }

  const chartData = getChartData()

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Báo cáo & Phân tích</h1>
            <p className="text-muted-foreground dark:text-slate-400">Xem chi tiết hiệu suất nền tảng</p>
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
                className={`px-4 py-2 rounded-lg transition-smooth font-medium ${
                  filterPeriod === period.value
                    ? "bg-primary text-white"
                    : "bg-secondary dark:bg-slate-800 text-foreground dark:text-white hover:bg-secondary/80"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: "Tổng doanh thu", value: "₫2.5B", change: "+12.5%", color: "green" },
            { icon: Users, label: "Tổng giáo viên", value: "350", change: "+8.2%", color: "purple" },
            { icon: Users, label: "Tổng học viên", value: "5,234", change: "+15.3%", color: "blue" },
            { icon: BookOpen, label: "Khóa học", value: "156", change: "+4.3%", color: "orange" },
          ].map((metric, i) => (
            <div
              key={i}
              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white mt-2">{metric.value}</p>
                  <p className={`text-xs mt-1 ${
                    metric.color === "green" ? "text-green-600 dark:text-green-400" :
                    metric.color === "purple" ? "text-purple-600 dark:text-purple-400" :
                    metric.color === "blue" ? "text-blue-600 dark:text-blue-400" :
                    "text-orange-600 dark:text-orange-400"
                  }`}>
                    {metric.change} so với kỳ trước
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  metric.color === "green" ? "bg-green-100 dark:bg-green-900/30" :
                  metric.color === "purple" ? "bg-purple-100 dark:bg-purple-900/30" :
                  metric.color === "blue" ? "bg-blue-100 dark:bg-blue-900/30" :
                  "bg-orange-100 dark:bg-orange-900/30"
                }`}>
                  <metric.icon size={24} className={
                    metric.color === "green" ? "text-green-600 dark:text-green-400" :
                    metric.color === "purple" ? "text-purple-600 dark:text-purple-400" :
                    metric.color === "blue" ? "text-blue-600 dark:text-blue-400" :
                    "text-orange-600 dark:text-orange-400"
                  } />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground dark:text-white">Biểu đồ doanh thu</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  {filterPeriod === "day" ? "7 ngày gần nhất" :
                   filterPeriod === "week" ? "Tuần này" :
                   filterPeriod === "month" ? "12 tháng" : "Cả năm"}
                </p>
              </div>
              <button
                onClick={() => handleExport("revenue")}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <Download size={18} className="text-muted-foreground dark:text-slate-400" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey={filterPeriod === "day" ? "date" : filterPeriod === "week" ? "day" : "month"} stroke="#9ca3af" />
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
              <div>
                <h2 className="text-lg font-bold text-foreground dark:text-white">Phân bố theo danh mục</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Tỷ lệ khóa học theo danh mục</p>
              </div>
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

        {/* Growth Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teacher Growth */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground dark:text-white">Tăng trưởng giáo viên</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Số lượng giáo viên theo thời gian</p>
              </div>
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
                <XAxis dataKey="month" stroke="#9ca3af" />
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
              <div>
                <h2 className="text-lg font-bold text-foreground dark:text-white">Tăng trưởng học viên</h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Số lượng học viên theo thời gian</p>
              </div>
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
                <XAxis dataKey="month" stroke="#9ca3af" />
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
            <div>
              <h2 className="text-lg font-bold text-foreground dark:text-white">Hiệu suất khóa học</h2>
              <p className="text-sm text-muted-foreground dark:text-slate-400">Thống kê chi tiết theo khóa học</p>
            </div>
            <button
              onClick={() => handleExport("courses")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg transition-smooth hover:shadow-lg"
            >
              <Download size={16} /> Xuất báo cáo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800">
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Khóa học</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Giảng viên</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Danh mục</th>
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
                    <td className="py-3 px-4 text-muted-foreground dark:text-slate-400">{course.teacher}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-secondary dark:bg-slate-800 rounded text-foreground dark:text-white text-xs">
                        {course.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground dark:text-white">{formatStudentCount(course.students)}</td>
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

      {/* Export Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
            <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">
                Xuất báo cáo: {
                  selectedReport === "revenue" ? "Báo cáo doanh thu" :
                  selectedReport === "category" ? "Báo cáo danh mục" :
                  selectedReport === "teachers" ? "Báo cáo giáo viên" :
                  selectedReport === "students" ? "Báo cáo học viên" :
                  "Báo cáo khóa học"
                }
              </h2>
              <button
                onClick={() => setIsExportOpen(false)}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Revenue report options */}
              {selectedReport === "revenue" && (
                <>
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Khóa học</label>
                    <select
                      value={exportCourse}
                      onChange={(e) => setExportCourse(e.target.value)}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Tất cả khóa học</option>
                      {courses.map((course) => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Giảng viên</label>
                    <select
                      value={exportTeacher}
                      onChange={(e) => setExportTeacher(e.target.value)}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Tất cả giảng viên</option>
                      {teachers.map((teacher) => (
                        <option key={teacher} value={teacher}>{teacher}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Danh mục</label>
                    <select
                      value={exportCategory}
                      onChange={(e) => setExportCategory(e.target.value)}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Tất cả danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Course report options */}
              {selectedReport === "courses" && (
                <>
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Khóa học</label>
                    <select
                      value={exportCourse}
                      onChange={(e) => setExportCourse(e.target.value)}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Tất cả khóa học</option>
                      {courses.map((course) => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Giảng viên</label>
                    <select
                      value={exportTeacher}
                      onChange={(e) => setExportTeacher(e.target.value)}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Tất cả giảng viên</option>
                      {teachers.map((teacher) => (
                        <option key={teacher} value={teacher}>{teacher}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Danh mục</label>
                    <select
                      value={exportCategory}
                      onChange={(e) => setExportCategory(e.target.value)}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Tất cả danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Date Range for all reports */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Từ ngày</label>
                  <input
                    type="date"
                    value={exportDateFrom}
                    onChange={(e) => setExportDateFrom(e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Đến ngày</label>
                  <input
                    type="date"
                    value={exportDateTo}
                    onChange={(e) => setExportDateTo(e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={executeExport}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium hover:shadow-lg transition-smooth flex items-center justify-center gap-2"
              >
                <Download size={20} /> Xuất báo cáo CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

