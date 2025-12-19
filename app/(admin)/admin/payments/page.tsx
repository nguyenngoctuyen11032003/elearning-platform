"use client"

import { Search, Download, Eye, DollarSign, TrendingUp, CreditCard, Clock, X, User, BookOpen } from "lucide-react"
import { useState } from "react"
import { formatPrice, formatNumber } from "@/lib/format"

interface Payment {
  id: string
  user: string
  userEmail: string
  userPhone: string
  course: string
  courseId: string
  teacher: string
  teacherEmail: string
  amount: number
  method: string
  status: "success" | "pending" | "failed"
  date: string
  transactionId: string
}

const payments: Payment[] = [
  {
    id: "PAY001",
    user: "Trần Văn A",
    userEmail: "tran.van.a@example.com",
    userPhone: "0912345678",
    course: "Next.js Advanced",
    courseId: "COURSE001",
    teacher: "Nguyễn Thị B",
    teacherEmail: "nguyen.thi.b@example.com",
    amount: 499000,
    method: "VNPay",
    status: "success",
    date: "2025-01-15",
    transactionId: "VNP12345678"
  },
  {
    id: "PAY002",
    user: "Lê Minh C",
    userEmail: "le.minh.c@example.com",
    userPhone: "0923456789",
    course: "React Hooks Mastery",
    courseId: "COURSE002",
    teacher: "Nguyễn Thị B",
    teacherEmail: "nguyen.thi.b@example.com",
    amount: 399000,
    method: "MoMo",
    status: "success",
    date: "2025-01-14",
    transactionId: "MOMO87654321"
  },
  {
    id: "PAY003",
    user: "Phạm Quốc D",
    userEmail: "pham.quoc.d@example.com",
    userPhone: "0934567890",
    course: "Python Data Science",
    courseId: "COURSE003",
    teacher: "Trần Minh E",
    teacherEmail: "tran.minh.e@example.com",
    amount: 549000,
    method: "VNPay",
    status: "pending",
    date: "2025-01-13",
    transactionId: "VNP23456789"
  },
  {
    id: "PAY004",
    user: "Hoàng Thị F",
    userEmail: "hoang.thi.f@example.com",
    userPhone: "0945678901",
    course: "UI/UX Design Fundamentals",
    courseId: "COURSE004",
    teacher: "Lê Văn G",
    teacherEmail: "le.van.g@example.com",
    amount: 349000,
    method: "Stripe",
    status: "success",
    date: "2025-01-12",
    transactionId: "STRIPE34567890"
  },
  {
    id: "PAY005",
    user: "Nguyễn Văn H",
    userEmail: "nguyen.van.h@example.com",
    userPhone: "0956789012",
    course: "Digital Marketing Pro",
    courseId: "COURSE005",
    teacher: "Phạm Thị I",
    teacherEmail: "pham.thi.i@example.com",
    amount: 349000,
    method: "MoMo",
    status: "failed",
    date: "2025-01-11",
    transactionId: "MOMO45678901"
  },
  {
    id: "PAY006",
    user: "Đặng Văn J",
    userEmail: "dang.van.j@example.com",
    userPhone: "0967890123",
    course: "Next.js Advanced",
    courseId: "COURSE001",
    teacher: "Nguyễn Thị B",
    teacherEmail: "nguyen.thi.b@example.com",
    amount: 499000,
    method: "VNPay",
    status: "success",
    date: "2025-01-10",
    transactionId: "VNP56789012"
  },
]

// Get unique values for filters
const uniqueCourses = [...new Set(payments.map(p => p.course))]
const uniqueUsers = [...new Set(payments.map(p => p.user))]
const uniqueTeachers = [...new Set(payments.map(p => p.teacher))]

export default function AdminPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "pending" | "failed">("all")
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // Export filters
  const [exportStatus, setExportStatus] = useState<string>("all")
  const [exportUser, setExportUser] = useState<string>("all")
  const [exportCourse, setExportCourse] = useState<string>("all")
  const [exportTeacher, setExportTeacher] = useState<string>("all")
  const [exportDateFrom, setExportDateFrom] = useState<string>("")
  const [exportDateTo, setExportDateTo] = useState<string>("")

  const filteredPayments = payments.filter(
    (payment) =>
      (payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.teacher.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (statusFilter === "all" || payment.status === statusFilter),
  )

  const totalRevenue = payments.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const successCount = payments.filter((p) => p.status === "success").length
  const totalTransactions = payments.length

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
      if (exportStatus !== "all" && p.status !== exportStatus) return false
      if (exportUser !== "all" && p.user !== exportUser) return false
      if (exportCourse !== "all" && p.course !== exportCourse) return false
      if (exportTeacher !== "all" && p.teacher !== exportTeacher) return false
      if (exportDateFrom && new Date(p.date) < new Date(exportDateFrom)) return false
      if (exportDateTo && new Date(p.date) > new Date(exportDateTo)) return false
      return true
    })

    // Create CSV content
    const headers = ["ID", "Người dùng", "Email", "Khóa học", "Giảng viên", "Số tiền", "Phương thức", "Trạng thái", "Ngày"]
    const rows = exportData.map(p => [
      p.id,
      p.user,
      p.userEmail,
      p.course,
      p.teacher,
      p.amount.toString(),
      p.method,
      p.status === "success" ? "Thành công" : p.status === "pending" ? "Chờ xử lý" : "Thất bại",
      p.date
    ])

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `payments_report_${new Date().toISOString().split("T")[0]}.csv`
    link.click()

    setIsExportOpen(false)
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Quản lý thanh toán</h1>
            <p className="text-muted-foreground dark:text-slate-400">Theo dõi và quản lý các giao dịch thanh toán</p>
          </div>
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium transition-smooth hover:shadow-lg w-fit"
          >
            <Download size={20} /> Xuất báo cáo
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng doanh thu</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">₫{formatNumber(totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Đang chờ xử lý</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">₫{formatNumber(pendingAmount)}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Giao dịch thành công</p>
                <p className="text-xl font-bold text-foreground dark:text-white mt-1">{successCount}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng giao dịch</p>
                <p className="text-xl font-bold text-foreground dark:text-white mt-1">{totalTransactions}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <CreditCard size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo ID, người dùng, khóa học hoặc giảng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "Tất cả" },
              { value: "success", label: "Thành công" },
              { value: "pending", label: "Chờ xử lý" },
              { value: "failed", label: "Thất bại" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value as any)}
                className={`px-4 py-3 rounded-lg transition-smooth font-medium ${
                  statusFilter === option.value
                    ? "bg-primary text-white"
                    : "bg-card dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">ID giao dịch</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Người dùng</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Khóa học</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Giảng viên</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Số tiền</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Phương thức</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Trạng thái</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Ngày</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth"
                  >
                    <td className="py-4 px-6 text-foreground dark:text-white font-medium">{payment.id}</td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-foreground dark:text-white font-medium">{payment.user}</p>
                        <p className="text-muted-foreground dark:text-slate-400 text-xs">{payment.userEmail}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white max-w-[200px] truncate">
                      {payment.course}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">
                      {payment.teacher}
                    </td>
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

          {filteredPayments.length === 0 && (
            <div className="py-12 text-center">
              <CreditCard size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy giao dịch nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
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
                <p className="text-muted-foreground dark:text-slate-400 text-sm">Số tiền thanh toán</p>
                <p className="text-3xl font-bold text-primary dark:text-accent">₫{formatPrice(selectedPayment.amount)}</p>
              </div>

              {/* User Info */}
              <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User size={16} className="text-primary dark:text-accent" />
                  <span className="font-semibold text-foreground dark:text-white">Thông tin người mua</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground dark:text-white font-medium">{selectedPayment.user}</p>
                  <p className="text-muted-foreground dark:text-slate-400">{selectedPayment.userEmail}</p>
                  <p className="text-muted-foreground dark:text-slate-400">{selectedPayment.userPhone}</p>
                </div>
              </div>

              {/* Course Info */}
              <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-primary dark:text-accent" />
                  <span className="font-semibold text-foreground dark:text-white">Thông tin khóa học</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground dark:text-white font-medium">{selectedPayment.course}</p>
                  <p className="text-muted-foreground dark:text-slate-400">Mã khóa học: {selectedPayment.courseId}</p>
                  <p className="text-muted-foreground dark:text-slate-400">Giảng viên: {selectedPayment.teacher}</p>
                </div>
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
                <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">Mã tham chiếu giao dịch</p>
                <p className="text-foreground dark:text-white font-mono text-sm">{selectedPayment.transactionId}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
            <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Xuất báo cáo thanh toán</h2>
              <button
                onClick={() => setIsExportOpen(false)}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Trạng thái</label>
                <select
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="success">Thành công</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="failed">Thất bại</option>
                </select>
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Người dùng</label>
                <select
                  value={exportUser}
                  onChange={(e) => setExportUser(e.target.value)}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Tất cả người dùng</option>
                  {uniqueUsers.map((user) => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>

              {/* Course Filter */}
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Khóa học</label>
                <select
                  value={exportCourse}
                  onChange={(e) => setExportCourse(e.target.value)}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Tất cả khóa học</option>
                  {uniqueCourses.map((course) => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              {/* Teacher Filter */}
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Giảng viên</label>
                <select
                  value={exportTeacher}
                  onChange={(e) => setExportTeacher(e.target.value)}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Tất cả giảng viên</option>
                  {uniqueTeachers.map((teacher) => (
                    <option key={teacher} value={teacher}>{teacher}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
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
                onClick={handleExport}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium hover:shadow-lg transition-smooth flex items-center justify-center gap-2"
              >
                <Download size={20} /> Xuất báo cáo CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

