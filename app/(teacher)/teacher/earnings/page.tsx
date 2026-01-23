"use client"

import { useState } from "react"
import { Download, TrendingUp, DollarSign, Users, X, Eye, CreditCard, Calendar, BookOpen } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatPrice } from "@/lib/format"

interface Payment {
  id: string
  student: string
  studentEmail: string
  course: string
  amount: number
  method: string
  status: "success" | "pending" | "failed"
  date: string
  transactionId: string
}

const payments: Payment[] = [
  {
    id: "PAY001",
    student: "Trần Văn A",
    studentEmail: "tran.van.a@example.com",
    course: "Next.js Advanced",
    amount: 499000,
    method: "VNPay",
    status: "success",
    date: "2025-01-15",
    transactionId: "VNP12345678"
  },
  {
    id: "PAY002",
    student: "Lê Minh C",
    studentEmail: "le.minh.c@example.com",
    course: "Next.js Advanced",
    amount: 499000,
    method: "MoMo",
    status: "success",
    date: "2025-01-14",
    transactionId: "MOMO87654321"
  },
  {
    id: "PAY003",
    student: "Phạm Quốc D",
    studentEmail: "pham.quoc.d@example.com",
    course: "React Hooks Mastery",
    amount: 399000,
    method: "VNPay",
    status: "pending",
    date: "2025-01-13",
    transactionId: "VNP23456789"
  },
  {
    id: "PAY004",
    student: "Hoàng Thị F",
    studentEmail: "hoang.thi.f@example.com",
    course: "Next.js Advanced",
    amount: 499000,
    method: "Stripe",
    status: "success",
    date: "2025-01-12",
    transactionId: "STRIPE34567890"
  },
  {
    id: "PAY005",
    student: "Nguyễn Văn H",
    studentEmail: "nguyen.van.h@example.com",
    course: "React Hooks Mastery",
    amount: 399000,
    method: "MoMo",
    status: "failed",
    date: "2025-01-11",
    transactionId: "MOMO45678901"
  },
]

const courses = [
  { id: "1", title: "Next.js Advanced" },
  { id: "2", title: "React Hooks Mastery" },
]

const students = [...new Set(payments.map(p => p.student))]

export default function TeacherEarningsPage() {
  const [filterPeriod, setFilterPeriod] = useState("month")
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // Export filters
  const [exportCourse, setExportCourse] = useState<string>("all")
  const [exportStudent, setExportStudent] = useState<string>("all")
  const [exportDateFrom, setExportDateFrom] = useState<string>("")
  const [exportDateTo, setExportDateTo] = useState<string>("")

  const earningsData = [
    { month: "1", revenue: 2400, students: 24 },
    { month: "2", revenue: 3210, students: 32 },
    { month: "3", revenue: 2290, students: 23 },
    { month: "4", revenue: 2000, students: 20 },
    { month: "5", revenue: 2181, students: 22 },
    { month: "6", revenue: 2500, students: 25 },
    { month: "7", revenue: 2800, students: 28 },
    { month: "8", revenue: 3100, students: 31 },
    { month: "9", revenue: 2900, students: 29 },
    { month: "10", revenue: 3400, students: 34 },
    { month: "11", revenue: 3800, students: 38 },
    { month: "12", revenue: 4200, students: 42 },
  ]

  // Calculate totals
  const totalRevenue = payments.filter(p => p.status === "success").reduce((sum, p) => sum + p.amount, 0)
  const thisMonthRevenue = payments.filter(p => p.status === "success" && p.date.startsWith("2025-01")).reduce((sum, p) => sum + p.amount, 0)
  const newStudentsCount = payments.filter(p => p.status === "success" && p.date.startsWith("2025-01")).length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleExport = () => {
    // Filter data based on export options
    let exportData = payments.filter(p => {
      if (exportCourse !== "all" && p.course !== exportCourse) return false
      if (exportStudent !== "all" && p.student !== exportStudent) return false
      if (exportDateFrom && new Date(p.date) < new Date(exportDateFrom)) return false
      if (exportDateTo && new Date(p.date) > new Date(exportDateTo)) return false
      return true
    })

    // Create CSV content
    const headers = ["ID", "Học viên", "Email", "Khóa học", "Số tiền", "Phương thức", "Trạng thái", "Ngày"]
    const rows = exportData.map(p => [
      p.id,
      p.student,
      p.studentEmail,
      p.course,
      p.amount.toString(),
      p.method,
      p.status === "success" ? "Thành công" : p.status === "pending" ? "Chờ xử lý" : "Thất bại",
      p.date
    ])

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `earnings_report_${new Date().toISOString().split("T")[0]}.csv`
    link.click()

    setIsExportOpen(false)
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header with Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Doanh thu</h1>
            <p className="text-muted-foreground dark:text-slate-400">Theo dõi thu nhập từ các khóa học của bạn</p>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={TrendingUp} title="Tổng doanh thu" value={`₫${formatPrice(totalRevenue)}`} change="+12.5% so với tháng trước" />
          <StatCard icon={DollarSign} title="Doanh thu tháng này" value={`₫${formatPrice(thisMonthRevenue)}`} change="+8.2%" />
          <StatCard icon={Users} title="Học viên mới tháng này" value={newStudentsCount.toString()} change="+5.1%" />
        </div>

        {/* Chart */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white">Biểu đồ doanh thu</h2>
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium transition-smooth hover:shadow-lg w-fit"
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
                name="Doanh thu (nghìn)"
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

        {/* Payment History Table */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border dark:border-slate-800">
            <h2 className="text-xl font-bold text-foreground dark:text-white">Lịch sử thanh toán</h2>
            <p className="text-muted-foreground dark:text-slate-400 text-sm">Các giao dịch từ học viên mua khóa học của bạn</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Học viên</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Khóa học</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Số tiền</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Phương thức</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Trạng thái</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Ngày</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth"
                  >
                    <td className="py-4 px-6 text-foreground dark:text-white font-medium">{payment.id}</td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-foreground dark:text-white font-medium">{payment.student}</p>
                        <p className="text-muted-foreground dark:text-slate-400 text-xs">{payment.studentEmail}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white">{payment.course}</td>
                    <td className="py-4 px-6 text-foreground dark:text-white font-medium">
                      ₫{formatPrice(payment.amount)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-secondary dark:bg-slate-800 rounded text-foreground dark:text-white text-xs font-medium">
                        {payment.method}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === "success"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : payment.status === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {payment.status === "success"
                          ? "Thành công"
                          : payment.status === "pending"
                            ? "Chờ xử lý"
                            : "Thất bại"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{formatDate(payment.date)}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                      >
                        <Eye size={18} className="text-primary dark:text-accent" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments.length === 0 && (
            <div className="py-12 text-center">
              <CreditCard size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">Chưa có giao dịch nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Chi tiết giao dịch</h2>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Transaction ID */}
              <div className="text-center pb-4 border-b border-border dark:border-slate-800">
                <p className="text-muted-foreground dark:text-slate-400 text-sm">Mã giao dịch</p>
                <p className="text-2xl font-bold text-foreground dark:text-white">{selectedPayment.id}</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                    selectedPayment.status === "success"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : selectedPayment.status === "pending"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  }`}
                >
                  {selectedPayment.status === "success"
                    ? "Thành công"
                    : selectedPayment.status === "pending"
                      ? "Chờ xử lý"
                      : "Thất bại"}
                </span>
              </div>

              {/* Amount */}
              <div className="bg-primary/10 dark:bg-accent/10 rounded-xl p-4 text-center">
                <p className="text-muted-foreground dark:text-slate-400 text-sm">Số tiền</p>
                <p className="text-3xl font-bold text-primary dark:text-accent">₫{formatPrice(selectedPayment.amount)}</p>
              </div>

              {/* Student Info */}
              <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-primary dark:text-accent" />
                  <span className="font-semibold text-foreground dark:text-white">Thông tin học viên</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground dark:text-white font-medium">{selectedPayment.student}</p>
                  <p className="text-muted-foreground dark:text-slate-400">{selectedPayment.studentEmail}</p>
                </div>
              </div>

              {/* Course Info */}
              <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-primary dark:text-accent" />
                  <span className="font-semibold text-foreground dark:text-white">Khóa học</span>
                </div>
                <p className="text-foreground dark:text-white font-medium">{selectedPayment.course}</p>
              </div>

              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">Phương thức</p>
                  <p className="text-foreground dark:text-white font-medium">{selectedPayment.method}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">Ngày thanh toán</p>
                  <p className="text-foreground dark:text-white font-medium">{formatDate(selectedPayment.date)}</p>
                </div>
              </div>

              {/* Transaction Reference */}
              <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">Mã tham chiếu</p>
                <p className="text-foreground dark:text-white font-mono text-sm">{selectedPayment.transactionId}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Xuất báo cáo doanh thu</h2>
              <button
                onClick={() => setIsExportOpen(false)}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Course Filter */}
              <div>
                <label className="text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                  <BookOpen size={16} /> Khóa học
                </label>
                <select
                  value={exportCourse}
                  onChange={(e) => setExportCourse(e.target.value)}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Tất cả khóa học</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.title}>{course.title}</option>
                  ))}
                </select>
              </div>

              {/* Student Filter */}
              <div>
                <label className="text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                  <Users size={16} /> Học viên
                </label>
                <select
                  value={exportStudent}
                  onChange={(e) => setExportStudent(e.target.value)}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Tất cả học viên</option>
                  {students.map((student) => (
                    <option key={student} value={student}>{student}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <Calendar size={16} /> Từ ngày
                  </label>
                  <input
                    type="date"
                    value={exportDateFrom}
                    onChange={(e) => setExportDateFrom(e.target.value)}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <Calendar size={16} /> Đến ngày
                  </label>
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
                onClick={handleExport}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium hover:shadow-lg transition-smooth flex items-center justify-center gap-2"
              >
                <Download size={20} /> Xuất báo cáo CSV
              </button>
            </div>
          </div>
        </div>
      )}  </div>
  )
}

