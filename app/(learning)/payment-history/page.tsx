"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { motion } from "framer-motion"
import {
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Eye,
  Filter,
  Search,
  BookOpen,
  TrendingUp,
  Package
} from "lucide-react"
import Link from "next/link"
import { PageHero } from "@/components/ui/page-hero"

interface PaymentHistory {
  id: string
  courseTitle: string
  courseSlug: string
  courseThumbnail: string
  amount: number
  discountAmount?: number
  finalAmount: number
  status: "completed" | "pending" | "failed"
  paymentMethod: string
  transactionId: string
  enrolledAt: string
  expiresAt?: string
}

export default function PaymentHistoryPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentHistory[]>([])
  const [filteredPayments, setFilteredPayments] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed">("all")
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null)
  const [viewingDetails, setViewingDetails] = useState(false)

  // Statistics
  const totalSpent = payments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.finalAmount, 0)
  const totalCourses = payments.filter(p => p.status === "completed").length
  const pendingPayments = payments.filter(p => p.status === "pending").length

  useEffect(() => {
    fetchPaymentHistory()
  }, [user])

  useEffect(() => {
    let filtered = payments

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    setFilteredPayments(filtered)
  }, [searchTerm, statusFilter, payments])

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true)
      if (!user?.id) {
        setPayments([])
        return
      }

      const enrollments = await apiClient.getMyEnrollments()
      
      if (!Array.isArray(enrollments)) {
        setPayments([])
        return
      }

      // Transform enrollments to payment history
      const paymentHistory: PaymentHistory[] = enrollments.map((enrollment: any) => ({
        id: enrollment.id,
        courseTitle: enrollment.course?.title || "Unknown Course",
        courseSlug: enrollment.course?.slug || "",
        courseThumbnail: enrollment.course?.thumbnail || "/placeholder.jpg",
        amount: enrollment.course?.price || 0,
        discountAmount: enrollment.course?.price && enrollment.course?.discountPrice 
          ? enrollment.course.price - enrollment.course.discountPrice 
          : 0,
        finalAmount: enrollment.course?.discountPrice || enrollment.course?.price || 0,
        status: enrollment.status === "active" ? "completed" : enrollment.status || "pending",
        paymentMethod: "Credit Card", // Mock data
        transactionId: `TXN-${enrollment.id.substring(0, 8).toUpperCase()}`,
        enrolledAt: enrollment.createdAt || new Date().toISOString(),
        expiresAt: enrollment.expiresAt,
      }))

      setPayments(paymentHistory)
      setFilteredPayments(paymentHistory)
    } catch (error) {
      console.error("Error fetching payment history:", error)
      toast.error("Không thể tải lịch sử thanh toán")
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-500" size={20} />
      case "pending":
        return <Clock className="text-yellow-500" size={20} />
      case "failed":
        return <XCircle className="text-red-500" size={20} />
      default:
        return <Clock className="text-gray-500" size={20} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Thành công"
      case "pending":
        return "Đang xử lý"
      case "failed":
        return "Thất bại"
      default:
        return "Không xác định"
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const handleDownloadInvoice = async (payment: PaymentHistory) => {
    try {
      // Dynamic import jsPDF to avoid SSR issues
      const jsPDF = (await import('jspdf')).default
      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(24)
      doc.setTextColor(59, 130, 246) // Blue color
      doc.text('ICS E-LEARNING', 105, 20, { align: 'center' })
      
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      doc.text('HOA DON THANH TOAN', 105, 35, { align: 'center' })
      
      // Invoice details
      doc.setFontSize(11)
      doc.setTextColor(100, 100, 100)
      doc.text(`Ma giao dich: ${payment.transactionId}`, 20, 55)
      doc.text(`Ngay: ${formatDate(payment.enrolledAt)}`, 20, 65)
      
      // Divider
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 75, 190, 75)
      
      // Customer info
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('THONG TIN KHACH HANG', 20, 90)
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.text(`Ho ten: ${user?.name || 'N/A'}`, 20, 100)
      doc.text(`Email: ${user?.email || 'N/A'}`, 20, 110)
      
      // Course info
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('THONG TIN KHOA HOC', 20, 130)
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      const splitTitle = doc.splitTextToSize(payment.courseTitle, 170)
      doc.text(splitTitle, 20, 140)
      
      // Payment details
      const yPos = 140 + (splitTitle.length * 7) + 20
      doc.line(20, yPos - 10, 190, yPos - 10)
      
      doc.text(`So tien goc:`, 20, yPos)
      doc.text(`${formatCurrency(payment.amount)}`, 190, yPos, { align: 'right' })
      
      if (payment.discountAmount && payment.discountAmount > 0) {
        doc.text(`Giam gia:`, 20, yPos + 10)
        doc.text(`-${formatCurrency(payment.discountAmount)}`, 190, yPos + 10, { align: 'right' })
      }
      
      doc.line(20, yPos + 20, 190, yPos + 20)
      
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(`TONG CONG:`, 20, yPos + 35)
      doc.text(`${formatCurrency(payment.finalAmount)}`, 190, yPos + 35, { align: 'right' })
      
      // Payment method
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.text(`Phuong thuc thanh toan: ${payment.paymentMethod}`, 20, yPos + 50)
      doc.text(`Trang thai: ${payment.status === 'completed' ? 'Thanh cong' : 'Dang xu ly'}`, 20, yPos + 60)
      
      // Footer
      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      doc.text('Cam on ban da tin tuong va su dung dich vu cua ICS E-Learning!', 105, 280, { align: 'center' })
      doc.text('Hotline: 1900 6868 | Email: support@icslearning.vn', 105, 287, { align: 'center' })
      
      // Save PDF
      doc.save(`invoice-${payment.transactionId}.pdf`)
      toast.success('Đã tải hóa đơn thành công!')
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error('Có lỗi khi tải hóa đơn. Vui lòng thử lại!')
    }
  }

  const handleViewDetails = (payment: PaymentHistory) => {
    setSelectedPayment(payment)
    setViewingDetails(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="w-full">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Đang tải lịch sử thanh toán...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full space-y-6">
        <PageHero
          title="Lịch sử thanh toán"
          subtitle="Quản lý các giao dịch mua khóa học của bạn"
          bgImage="/image/bg_payment.jpg"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
              <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-slate-300">Tổng chi tiêu</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{formatCurrency(totalSpent)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <DollarSign size={20} className="text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
              <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-slate-300">Khóa học đã mua</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalCourses}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Package size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
              <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-slate-300">Đang chờ xử lý</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{pendingPayments}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
          </div>
        </PageHero>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên khóa học hoặc mã giao dịch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2.5 rounded-lg transition-all ${
                  statusFilter === "all"
                    ? "bg-primary text-white shadow-lg"
                    : "bg-slate-100 dark:bg-slate-800 text-foreground dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-4 py-2.5 rounded-lg transition-all ${
                  statusFilter === "completed"
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-slate-100 dark:bg-slate-800 text-foreground dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Thành công
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-4 py-2.5 rounded-lg transition-all ${
                  statusFilter === "pending"
                    ? "bg-yellow-500 text-white shadow-lg"
                    : "bg-slate-100 dark:bg-slate-800 text-foreground dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Chờ xử lý
              </button>
              <button
                onClick={() => setStatusFilter("failed")}
                className={`px-4 py-2.5 rounded-lg transition-all ${
                  statusFilter === "failed"
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-slate-100 dark:bg-slate-800 text-foreground dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Thất bại
              </button>
            </div>
          </div>
        </motion.div>

        {/* Payment List */}
        {filteredPayments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-12 shadow-lg border border-slate-200 dark:border-slate-800 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="text-muted-foreground" size={40} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground dark:text-white">
                Không có giao dịch nào
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== "all"
                  ? "Không tìm thấy giao dịch phù hợp với bộ lọc của bạn"
                  : "Bạn chưa có giao dịch mua khóa học nào"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <BookOpen size={20} />
                  Khám phá khóa học
                </Link>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Course Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={payment.courseThumbnail}
                      alt={payment.courseTitle}
                      className="w-full md:w-48 h-32 object-cover rounded-lg"
                    />
                  </div>

                  {/* Payment Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-1">
                          {payment.courseTitle}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Mã giao dịch: {payment.transactionId}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusBadgeClass(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {getStatusText(payment.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar size={16} />
                        <span>{formatDate(payment.enrolledAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard size={16} />
                        <span>{payment.paymentMethod}</span>
                      </div>
                      <div className="flex items-center gap-2 font-semibold text-foreground dark:text-white">
                        <DollarSign size={16} />
                        <span>{formatCurrency(payment.finalAmount)}</span>
                      </div>
                    </div>

                    {payment.discountAmount && payment.discountAmount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <TrendingUp size={16} />
                        <span>Tiết kiệm: {formatCurrency(payment.discountAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2">
                    <button
                      onClick={() => handleViewDetails(payment)}
                      className="flex-1 md:flex-initial px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      <span className="hidden md:inline">Chi tiết</span>
                    </button>
                    {payment.status === "completed" && (
                      <button
                        onClick={() => handleDownloadInvoice(payment)}
                        className="flex-1 md:flex-initial px-4 py-2 bg-slate-100 dark:bg-slate-800 text-foreground dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={16} />
                        <span className="hidden md:inline">Hóa đơn</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {viewingDetails && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Chi tiết giao dịch</h2>
                <button
                  onClick={() => setViewingDetails(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Course Info */}
              <div>
                <img
                  src={selectedPayment.courseThumbnail}
                  alt={selectedPayment.courseTitle}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
                  {selectedPayment.courseTitle}
                </h3>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusBadgeClass(selectedPayment.status)}`}>
                  {getStatusIcon(selectedPayment.status)}
                  {getStatusText(selectedPayment.status)}
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-4">
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <h4 className="font-semibold text-foreground dark:text-white mb-3">Thông tin thanh toán</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mã giao dịch:</span>
                      <span className="font-medium text-foreground dark:text-white">{selectedPayment.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngày giao dịch:</span>
                      <span className="font-medium text-foreground dark:text-white">{formatDate(selectedPayment.enrolledAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phương thức:</span>
                      <span className="font-medium text-foreground dark:text-white">{selectedPayment.paymentMethod}</span>
                    </div>
                    {selectedPayment.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ngày hết hạn:</span>
                        <span className="font-medium text-foreground dark:text-white">{formatDate(selectedPayment.expiresAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <h4 className="font-semibold text-foreground dark:text-white mb-3">Chi tiết giá</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Giá gốc:</span>
                      <span className="font-medium text-foreground dark:text-white">{formatCurrency(selectedPayment.amount)}</span>
                    </div>
                    {selectedPayment.discountAmount && selectedPayment.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Giảm giá:</span>
                        <span className="font-medium">-{formatCurrency(selectedPayment.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-foreground dark:text-white border-t border-slate-200 dark:border-slate-800 pt-2">
                      <span>Tổng thanh toán:</span>
                      <span>{formatCurrency(selectedPayment.finalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {selectedPayment.courseSlug && (
                  <Link
                    href={`/course/${selectedPayment.courseSlug}`}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-center"
                  >
                    Xem khóa học
                  </Link>
                )}
                {selectedPayment.status === "completed" && (
                  <button
                    onClick={() => handleDownloadInvoice(selectedPayment)}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-foreground dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Tải hóa đơn
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
