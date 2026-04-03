"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Download, Search, CreditCard, Wallet, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"
import { autoTranslateData, getLocaleByLanguage } from "@/lib/i18n/dynamic-translate"
import { generateInvoicePdf } from "@/lib/utils/invoice-pdf"

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
}

export default function PaymentHistoryPage() {
  const { user } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [payments, setPayments] = useState<PaymentHistory[]>([])
  const [filteredPayments, setFilteredPayments] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusTab, setStatusTab] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null)
  const [viewingDetails, setViewingDetails] = useState(false)
  const [balance, setBalance] = useState(5000000)
  const { language, t } = useLanguage()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDarkMode = mounted && resolvedTheme === "dark"

  const totalSpent = payments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.finalAmount, 0)
  const dailySpend = payments
    .filter(p => {
      const date = new Date(p.enrolledAt)
      const today = new Date()
      return date.toDateString() === today.toDateString()
    })
    .reduce((sum, p) => sum + p.finalAmount, 0)
  const completedCount = payments.filter(p => p.status === "completed").length
  const pendingCount = payments.filter(p => p.status === "pending").length
  const failedCount = payments.filter(p => p.status === "failed").length

  const mockPaymentHistory: PaymentHistory[] = [
    {
      id: "pay-1",
      courseTitle: "React Advanced - Build High-Performance Apps",
      courseSlug: "react-advanced",
      courseThumbnail: "/image/logo-ics.jpg",
      amount: 299000,
      discountAmount: 49000,
      finalAmount: 250000,
      status: "completed",
      paymentMethod: "Visa",
      transactionId: "TXN-0A1B2C3D",
      enrolledAt: "2024-12-15T10:30:00Z",
    },
    {
      id: "pay-2",
      courseTitle: "Python for Data Science",
      courseSlug: "python-data-science",
      courseThumbnail: "/image/courses/python.jpg",
      amount: 199000,
      discountAmount: 0,
      finalAmount: 199000,
      status: "completed",
      paymentMethod: "MasterCard",
      transactionId: "TXN-4E5F6G7H",
      enrolledAt: "2024-12-10T14:45:00Z",
    },
    {
      id: "pay-3",
      courseTitle: "Web Design Fundamentals",
      courseSlug: "web-design",
      courseThumbnail: "/image/courses/design.jpg",
      amount: 149000,
      discountAmount: 29000,
      finalAmount: 120000,
      status: "completed",
      paymentMethod: "Visa",
      transactionId: "TXN-8I9J0K1L",
      enrolledAt: "2024-12-05T09:20:00Z",
    },
    {
      id: "pay-4",
      courseTitle: "JavaScript Mastery",
      courseSlug: "js-mastery",
      courseThumbnail: "/image/courses/javascript.jpg",
      amount: 279000,
      discountAmount: 39000,
      finalAmount: 240000,
      status: "pending",
      paymentMethod: "Bank Transfer",
      transactionId: "TXN-2M3N4O5P",
      enrolledAt: "2024-12-01T16:15:00Z",
    },
    {
      id: "pay-5",
      courseTitle: "Machine Learning Fundamentals",
      courseSlug: "ml-fundamentals",
      courseThumbnail: "/image/courses/ml.jpg",
      amount: 399000,
      discountAmount: 0,
      finalAmount: 399000,
      status: "completed",
      paymentMethod: "Visa",
      transactionId: "TXN-6Q7R8S9T",
      enrolledAt: "2024-11-25T11:00:00Z",
    },
  ]

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let active = true

    const localizePayments = async () => {
      // Don't translate payment data
      if (!active) return
      setPayments(mockPaymentHistory)
      setFilteredPayments(mockPaymentHistory)
      setLoading(false)
    }

    localizePayments()

    return () => {
      active = false
    }
  }, [language])

  useEffect(() => {
    let filtered = payments
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (statusTab !== "all") {
      filtered = filtered.filter(p => p.status === statusTab)
    }
    setFilteredPayments(filtered)
  }, [searchTerm, statusTab, payments])

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return t("pay_status_completed", "Thành công")
      case "pending":
        return t("pay_status_pending", "Đang xử lý")
      case "failed":
        return t("pay_status_failed", "Thất bại")
      default:
        return t("pay_status_unknown", "Không xác định")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(getLocaleByLanguage(language), {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    const locale = getLocaleByLanguage(language)
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const handleDownloadInvoice = async (payment: PaymentHistory) => {
    try {
      const issueDate = new Date(payment.enrolledAt).toLocaleDateString("vi-VN")
      const discount = Number(payment.discountAmount || 0)
      const subtotal = Number(payment.amount || payment.finalAmount || 0)
      const tax = Math.max(0, Number(payment.finalAmount || 0) - subtotal + discount)

      await generateInvoicePdf({
        invoiceNumber: payment.transactionId,
        issueDate,
        customerName: user?.name || "N/A",
        customerEmail: user?.email || "N/A",
        courseTitle: payment.courseTitle,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.status,
        subtotal,
        discount,
        tax,
        total: Number(payment.finalAmount || 0),
      })
    } catch (error) {
      console.error('Error generating invoice:', error)
    }
  }

  const handleViewDetails = (payment: PaymentHistory) => {
    setSelectedPayment(payment)
    setViewingDetails(true)
  }

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50'}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'} mx-auto mb-4`}></div>
          <p className={isDarkMode ? "text-blue-400" : "text-blue-600"}>{t("pay_loading", "Đang tải...")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 text-gray-900'}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full overflow-y-auto [&::-webkit-scrollbar]:hidden [&::-moz-scrollbar]:hidden [-ms-overflow-style:none]"
      >
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 text-white shadow-xl">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "url('/image/bg_payment_student.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/28 via-slate-900/14 to-slate-900/28" />
              <div className="relative p-6 sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
                  <div className="space-y-3 max-w-3xl">
                    <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/80">{t("pay_header_label", "Ví & giao dịch")}</p>
                    <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{t("pay_header_title", "Lịch sử thanh toán")}</h1>
                    <p className="text-white/90 text-sm sm:text-base">{t("pay_header_subtitle", "Theo dõi số dư, chi tiêu và hóa đơn của bạn trên một bảng điều khiển tinh gọn.")}</p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => router.push("/top-up")}
                        className="inline-flex items-center gap-2 rounded-full bg-white/22 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/30"
                      >
                        <Plus size={16} /> {t("pay_topup", "Nạp tiền")}
                      </button>
                      <button
                        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
                        className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                      >
                        <Download size={14} /> {t("pay_scroll_tx", "Xem giao dịch")}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[{
                        label: t("pay_completed", "Hoàn tất"),
                        value: completedCount,
                        tone: "from-emerald-500/20 to-emerald-600/20 border-emerald-500/40 text-emerald-100"
                      }, {
                        label: t("pay_pending", "Chờ xử lý"),
                        value: pendingCount,
                        tone: "from-amber-500/20 to-amber-600/20 border-amber-500/40 text-amber-100"
                      }, {
                        label: t("pay_failed", "Thất bại"),
                        value: failedCount,
                        tone: "from-rose-500/20 to-rose-600/20 border-rose-500/40 text-rose-100"
                      }].map(card => (
                        <div key={card.label} className={`rounded-2xl border bg-gradient-to-br ${card.tone} p-4 sm:p-5 shadow-sm backdrop-blur`}> 
                          <p className="text-xs uppercase tracking-[0.15em] opacity-80">{card.label}</p>
                          <p className="text-2xl sm:text-3xl font-bold mt-2">{card.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-2xl bg-white/95 text-gray-900 dark:bg-slate-900/80 dark:text-white border border-border/60 p-4 sm:p-5 shadow-lg backdrop-blur">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("pay_balance", "SỐ DƯ HIỆN TẠI")}</p>
                <p className="text-2xl sm:text-3xl font-bold whitespace-nowrap">{formatCurrency(balance)}</p>
              </div>
              <div className="rounded-2xl bg-white/95 text-gray-900 dark:bg-slate-900/80 dark:text-white border border-border/60 p-4 sm:p-5 shadow-lg backdrop-blur">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("pay_total_spent", "TỔNG ĐÃ CHI")}</p>
                <p className="text-2xl sm:text-3xl font-bold whitespace-nowrap">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="rounded-2xl bg-white/95 text-gray-900 dark:bg-slate-900/80 dark:text-white border border-border/60 p-4 sm:p-5 shadow-lg backdrop-blur">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t("pay_daily_spend", "CHI TIÊU HÀNG NGÀY")}</p>
                <p className="text-xl sm:text-2xl font-bold whitespace-nowrap">{formatCurrency(dailySpend)}</p>
              </div>
            </div>

            {/* Transactions Section */}
            <div className={`${isDarkMode ? 'bg-slate-900/80 border-gray-700/70' : 'bg-white/95 border-gray-200' } rounded-3xl p-4 sm:p-6 border shadow-lg backdrop-blur`}>
              <div className="flex flex-col gap-4 sm:gap-5 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/20 flex items-center justify-center">
                      <Download size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <h2 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t("pay_recent_tx", "Giao dịch gần đây")}</h2>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t("pay_recent_tx_hint", "Lọc theo trạng thái hoặc tìm theo mã giao dịch")}</p>
                    </div>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={16} />
                    <input
                      type="text"
                      placeholder={t("pay_search", "Tìm kiếm...")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 text-sm ${isDarkMode ? 'bg-slate-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400`}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[{key:"all", label:t("pay_all_status","Tất cả")}, {key:"completed", label:getStatusText("completed")}, {key:"pending", label:getStatusText("pending")}, {key:"failed", label:getStatusText("failed")}].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setStatusTab(tab.key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                        statusTab === tab.key
                          ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                          : isDarkMode
                            ? 'bg-slate-800 border-gray-700 text-gray-200 hover:border-blue-500/50'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-3`} />
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>{t("pay_no_tx", "Không có giao dịch nào")}</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-x-auto">
                  {/* Table Header */}
                  <div className={`hidden sm:grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-4 py-3 text-xs sm:text-sm ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-600 border-gray-200'} font-medium border-b`}>
                    <div className="col-span-4">{t("pay_col_tx", "Giao dịch")}</div>
                    <div className="col-span-2">{t("pay_col_date", "Ngày")}</div>
                    <div className="col-span-2">{t("pay_col_status", "Trạng thái")}</div>
                    <div className="col-span-2">{t("pay_col_amount", "Số tiền")}</div>
                    <div className="col-span-2 text-right">{t("pay_col_actions", "Thao tác")}</div>
                  </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[{
                label: t("pay_completed", "Hoàn tất"),
                value: completedCount,
                tone: isDarkMode ? "from-emerald-500/20 to-emerald-600/20 border-emerald-500/40 text-emerald-200" : "from-emerald-50 to-white border-emerald-100 text-emerald-700"
              }, {
                label: t("pay_pending", "Đang xử lý"),
                value: pendingCount,
                tone: isDarkMode ? "from-amber-500/20 to-amber-600/20 border-amber-500/40 text-amber-100" : "from-amber-50 to-white border-amber-100 text-amber-700"
              }, {
                label: t("pay_failed", "Thất bại"),
                value: failedCount,
                tone: isDarkMode ? "from-rose-500/20 to-rose-600/20 border-rose-500/40 text-rose-100" : "from-rose-50 to-white border-rose-100 text-rose-700"
              }].map(card => (
                <div key={card.label} className={`rounded-2xl border bg-gradient-to-br ${card.tone} p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all`}>
                  <p className="text-xs uppercase tracking-[0.15em] opacity-80">{card.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-2">{card.value}</p>
                </div>
              ))}
            </div>

                  {/* Table Rows */}
                  {filteredPayments.map((payment) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`hidden sm:grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-4 py-4 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-100 hover:bg-blue-50'} rounded-lg transition-all border hover:border-blue-200`}
                    >
                      <div className={`col-span-4 text-xs sm:text-sm line-clamp-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={payment.courseTitle}>{payment.courseTitle}</div>
                      <div className={`col-span-2 text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatDate(payment.enrolledAt)}</div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          payment.status === "completed" ? (isDarkMode ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-100 text-emerald-700") :
                          payment.status === "pending" ? (isDarkMode ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-100 text-yellow-700") :
                          (isDarkMode ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-700")
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            payment.status === "completed" ? "bg-emerald-400" :
                            payment.status === "pending" ? "bg-yellow-400" :
                            "bg-red-400"
                          }`}></span>
                          {getStatusText(payment.status)}
                        </span>
                      </div>
                      <div className={`col-span-2 font-semibold text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(payment.finalAmount)}</div>
                      <div className="col-span-2 flex justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className={`p-1.5 rounded transition-all text-sm ${isDarkMode ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                        >
                          →
                        </button>
                        {payment.status === "completed" && (
                          <button
                            onClick={() => handleDownloadInvoice(payment)}
                            className={`p-1.5 rounded transition-all ${isDarkMode ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                          >
                            <Download size={14} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Mobile View */}
                  {filteredPayments.map((payment) => (
                    <motion.div
                      key={`mobile-${payment.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`sm:hidden px-4 py-4 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-100 hover:bg-blue-50'} rounded-lg transition-all border hover:border-blue-200`}
                    >
                      <div className="space-y-2">
                        <h4 className={`font-semibold text-sm line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={payment.courseTitle}>{payment.courseTitle}</h4>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(payment.enrolledAt)}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === "completed" ? (isDarkMode ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-100 text-emerald-700") :
                              payment.status === "pending" ? (isDarkMode ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-100 text-yellow-700") :
                              (isDarkMode ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-700")
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${
                                payment.status === "completed" ? "bg-emerald-400" :
                                payment.status === "pending" ? "bg-yellow-400" :
                                "bg-red-400"
                              }`}></span>
                              {getStatusText(payment.status)}
                            </span>
                          </div>
                          <div className="text-right space-y-2">
                            <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(payment.finalAmount)}</p>
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleViewDetails(payment)}
                                className={`p-1.5 rounded transition-all ${isDarkMode ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                              >
                                →
                              </button>
                              {payment.status === "completed" && (
                                <button
                                  onClick={() => handleDownloadInvoice(payment)}
                                  className={`p-1.5 rounded transition-all ${isDarkMode ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                                >
                                  <Download size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Your Courses Section */}
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-4 sm:p-6 border shadow-sm`}>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t("pay_your_courses", "Khóa học của bạn")}</h2>
                <button className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                  <span>+</span>
                  {t("pay_add_course", "Thêm khóa học")}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {payments.slice(0, 6).map((payment, idx) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02, translateY: -4 }}
                    onClick={() => handleViewDetails(payment)}
                    className={`${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:from-gray-600 hover:to-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:from-blue-50 to-cyan-50'} rounded-xl border cursor-pointer transition-all overflow-hidden`}
                  >
                    {/* Header with Logo */}
                    <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-gradient-to-r from-orange-400 to-orange-500'} p-4 flex items-center gap-3`}>
                      <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white text-lg ${isDarkMode ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-orange-300 to-orange-400'}`}>
                        {payment.courseTitle.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-sm sm:text-base font-semibold line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{payment.courseTitle.substring(0, 30)}</h4>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>{formatCurrency(payment.finalAmount)}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3 sm:space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t("pay_progress", "Tiến độ")}</p>
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>75%</p>
                        </div>
                        <div className={`w-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '75%' }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full"
                          ></motion.div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-lg p-3 text-center`}>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t("pay_lessons", "Bài học")}</p>
                          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>12</p>
                        </div>
                        <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-lg p-3 text-center`}>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t("pay_completed", "Hoàn thành")}</p>
                          <p className={`text-lg font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>9</p>
                        </div>
                      </div>

                      {/* Button */}
                      <button className={`w-full py-2.5 rounded-lg font-medium transition-all text-sm ${isDarkMode ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                        {t("pay_continue", "Tiếp tục học")}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      {/* Payment Details Modal */}
      {viewingDetails && selectedPayment && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 border-b text-white p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-bold flex-1">{t("pay_detail_title", "Chi tiết giao dịch")}</h2>
                <button
                  onClick={() => setViewingDetails(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} title={selectedPayment.courseTitle}>{selectedPayment.courseTitle}</h3>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  selectedPayment.status === "completed" ? (isDarkMode ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-100 text-emerald-700") :
                  selectedPayment.status === "pending" ? (isDarkMode ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-100 text-yellow-700") :
                  (isDarkMode ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-700")
                }`}>
                  {getStatusText(selectedPayment.status)}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className={`font-semibold mb-2 sm:mb-3 text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t("pay_info_title", "Thông tin thanh toán")}</h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{t("pay_tx_id", "Mã giao dịch:")}</span>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPayment.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{t("pay_tx_date", "Ngày giao dịch:")}</span>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(selectedPayment.enrolledAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{t("pay_method", "Phương thức:")}</span>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPayment.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-3 sm:pt-4`}>
                  <h4 className={`font-semibold mb-2 sm:mb-3 text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t("pay_price_detail", "Chi tiết giá")}</h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{t("pay_original_price", "Giá gốc:")}</span>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(selectedPayment.amount)}</span>
                    </div>
                    {selectedPayment.discountAmount && selectedPayment.discountAmount > 0 && (
                      <div className={`flex justify-between ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        <span>{t("pay_discount", "Giảm giá:")}</span>
                        <span className="font-medium">-{formatCurrency(selectedPayment.discountAmount)}</span>
                      </div>
                    )}
                    <div className={`flex justify-between font-bold border-t ${isDarkMode ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-900'} pt-2 text-sm sm:text-base`}>
                      <span>{t("pay_total", "Tổng thanh toán:")}</span>
                      <span>{formatCurrency(selectedPayment.finalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                {selectedPayment.courseSlug && (
                  <Link
                    href={`/course/${selectedPayment.courseSlug}`}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg hover:shadow-lg transition-all text-center font-semibold text-sm sm:text-base"
                  >
                    {t("pay_view_course", "Xem khóa học")}
                  </Link>
                )}
                {selectedPayment.status === "completed" && (
                  <button
                    onClick={() => handleDownloadInvoice(selectedPayment)}
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-200'} rounded-lg transition-all flex items-center justify-center gap-2 font-semibold border text-sm sm:text-base`}
                  >
                    <Download size={16} />
                    {t("pay_download_invoice", "Tải hóa đơn")}
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
