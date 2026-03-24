"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Download, TrendingUp, DollarSign, Users, X, Eye, CreditCard, Calendar, BookOpen } from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { StatCard } from "@/components/ui/stat-card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatPrice, formatCurrencyByLanguage } from "@/lib/format"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"

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

const normalizeStatus = (status?: string): Payment["status"] => {
  const normalized = status?.toLowerCase?.()
  if (normalized === "completed" || normalized === "success") return "success"
  if (normalized === "pending") return "pending"
  return "failed"
}

const normalizeMethod = (method?: string) => {
  if (!method) return "OTHER"
  return method.toUpperCase()
}

export default function TeacherEarningsPage() {
  const { language, t } = useLanguage()
  const [payments, setPayments] = useState<Payment[]>([])
  const [byCourse, setByCourse] = useState<{ courseId: string; courseName: string; earnings: number; enrollments: number }[]>([])
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filterPeriod, setFilterPeriod] = useState("month")
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const exportButtonRef = useRef<HTMLButtonElement | null>(null)
  const [exportMenuPos, setExportMenuPos] = useState<{ top: number; left: number } | null>(null)

  // Export filters
  const [exportCourse, setExportCourse] = useState<string>("all")
  const [exportStudent, setExportStudent] = useState<string>("all")
  const [exportDateFrom, setExportDateFrom] = useState<string>("")
  const [exportDateTo, setExportDateTo] = useState<string>("")

  const localeByLanguage: Record<string, string> = {
    vi: "vi-VN",
    en: "en-US",
  }
  const activeLocale = localeByLanguage[language] || "vi-VN"

    const loadEarnings = async () => {
      setLoading(true)
      try {
        const res = await apiClient.getTeacherEarnings()
        const paymentsRaw = Array.isArray(res?.payments) ? res.payments : []
        const mappedPayments: Payment[] = paymentsRaw.map((p: any) => ({
          id: p.id || p.transactionId,
          student: p.studentName || t("teacher_students_unknown", "Không rõ"),
          studentEmail: p.studentEmail || "",
          course: p.courseName || t("teacher_students_unknown", "Không rõ"),
          amount: Number(p.amount ?? 0),
          method: normalizeMethod(p.method),
          status: normalizeStatus(p.status),
          date: new Date(p.date || new Date()).toISOString(),
          transactionId: p.transactionId || p.id || "",
        }))

        setPayments(mappedPayments)
        setByCourse(res?.byCourse || [])
        setStats({
          totalEarnings: Number(res?.totalEarnings ?? 0),
          pendingEarnings: Number(res?.pendingEarnings ?? 0),
          paidEarnings: Number(res?.paidEarnings ?? 0),
        })
      } catch (error) {
        console.error("Error loading teacher earnings", error)
        toast.error(t("teacher_earnings_load_failed", "Không thể tải dữ liệu doanh thu"))
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      loadEarnings()
    }, [])

    useEffect(() => {
      if (!isExportOpen) return
      const updatePosition = () => {
        const rect = exportButtonRef.current?.getBoundingClientRect()
        if (!rect) return
        const menuWidth = 420
        const left = Math.max(12, rect.right - menuWidth)
        setExportMenuPos({ top: rect.bottom + 8, left })
      }

      updatePosition()
      window.addEventListener("resize", updatePosition)
      window.addEventListener("scroll", updatePosition, true)

      return () => {
        window.removeEventListener("resize", updatePosition)
        window.removeEventListener("scroll", updatePosition, true)
      }
    }, [isExportOpen])

    const earningsData = useMemo(
      () =>
        byCourse.map((c) => ({
          name: c.courseName,
          revenue: c.earnings,
          students: c.enrollments,
        })),
      [byCourse]
    )

    const totalRevenue = stats.totalEarnings || payments.filter(p => p.status === "success").reduce((sum, p) => sum + p.amount, 0)

    const thisMonthRevenue = useMemo(() => {
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      return payments
        .filter(p => p.status === "success" && p.date.startsWith(monthKey))
        .reduce((sum, p) => sum + p.amount, 0)
    }, [payments])

    const newStudentsCount = useMemo(() => {
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      return payments.filter(p => p.status === "success" && p.date.startsWith(monthKey)).length
    }, [payments])

    const uniqueCourses = useMemo(() => Array.from(new Set(payments.map((p) => p.course).filter(Boolean))), [payments])
    const uniqueStudents = useMemo(() => Array.from(new Set(payments.map((p) => p.student).filter(Boolean))), [payments])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(activeLocale, {
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

    const headers = [
      "ID",
      t("teacher_dashboard_students", "Học viên"),
      t("footer_email", "Email"),
      t("teacher_dashboard_courses", "Khóa học"),
      t("checkout_amount", "Số tiền"),
      t("teacher_earnings_method", "Phương thức"),
      t("teacher_dashboard_status", "Trạng thái"),
      t("teacher_earnings_date", "Ngày"),
    ]
    const rows = exportData.map((p) => [
      p.id,
      p.student,
      p.studentEmail,
      p.course,
      p.amount.toString(),
      p.method,
      p.status === "success"
        ? t("teacher_earnings_status_success", "Thành công")
        : p.status === "pending"
          ? t("teacher_earnings_status_pending", "Chờ xử lý")
          : t("teacher_earnings_status_failed", "Thất bại"),
      formatDate(p.date),
    ])

    const exportDate = new Date().toLocaleDateString(activeLocale)
    const bannerLines = [
      [t("teacher_earnings_export_report_title", "Báo cáo: Doanh thu giáo viên")],
      [`${t("teacher_earnings_export_date", "Ngày xuất")}: ${exportDate}`],
    ]
    const aoa = [...bannerLines, headers, ...rows]

    const worksheet = XLSX.utils.aoa_to_sheet(aoa)
    const colCount = Math.max(...aoa.map((row) => row.length))
    worksheet["!cols"] = Array.from({ length: colCount }, (_, colIndex) => {
      const maxLen = Math.max(
        ...aoa.map((row) => {
          const value = row[colIndex]
          return value === undefined || value === null ? 0 : String(value).length
        })
      )
      return { wch: Math.min(60, Math.max(10, maxLen + 2)) }
    })

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, t("teacher_dashboard_revenue", "Doanh thu"))
    XLSX.writeFile(workbook, `earnings_report_${new Date().toISOString().split("T")[0]}.xlsx`)

    setIsExportOpen(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="h-[420px] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Hero Section with Background */}
        <div className="relative overflow-hidden rounded-3xl p-8 animate-fadeIn" style={{ backgroundImage: "url('/image/bg_payment.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("teacher_dashboard_revenue", "Doanh thu")}</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">{t("teacher_earnings_subtitle", "Theo dõi thu nhập từ các khóa học của bạn")}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "day", label: t("period_day", "Ngày") },
                  { value: "week", label: t("period_week", "Tuần") },
                  { value: "month", label: t("period_month", "Tháng") },
                  { value: "year", label: t("period_year", "Năm") },
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setFilterPeriod(period.value)}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium backdrop-blur-sm ${
                      filterPeriod === period.value
                        ? "bg-white text-primary shadow-lg"
                        : "bg-white/30 dark:bg-white/20 text-slate-900 dark:text-white hover:bg-white/45"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <StatCard 
                  icon={TrendingUp} 
                  title={t("teacher_dashboard_total_revenue", "Tổng doanh thu")}
                  value={formatCurrencyByLanguage(totalRevenue, language)} 
                  change={t("teacher_analytics_completion_trend", "Cao hơn 12% so với tháng trước")}
                />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <StatCard 
                  icon={DollarSign} 
                  title={t("teacher_earnings_month_revenue", "Doanh thu tháng này")}
                  value={formatCurrencyByLanguage(thisMonthRevenue, language)} 
                  change={t("teacher_earnings_month_compare", "+8.2% so với tháng trước")}
                />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <StatCard 
                  icon={Users} 
                  title={t("teacher_earnings_new_students_month", "Học viên mới tháng này")}
                  value={newStudentsCount.toString()} 
                  change={t("teacher_earnings_students_compare", "+5.1% so với tháng trước")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white">{t("teacher_earnings_chart_title", "Biểu đồ doanh thu")}</h2>
            <button
              ref={exportButtonRef}
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium transition-smooth hover:shadow-lg w-fit"
            >
              <Download size={18} />
              {t("teacher_earnings_export_report", "Xuất báo cáo")}
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
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
                name={t("teacher_earnings_revenue_line", "Doanh thu")}
              />
              <Line
                type="monotone"
                dataKey="students"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={{ fill: "#06B6D4" }}
                name={t("teacher_dashboard_new_students", "Học viên mới")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment History */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border dark:border-slate-800">
            <h2 className="text-xl font-bold text-foreground dark:text-white">{t("teacher_earnings_history", "Lịch sử thanh toán")}</h2>
            <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("teacher_earnings_history_subtitle", "Các giao dịch từ học viên mua khóa học của bạn")}</p>
          </div>

          {/* Mobile & Tablet: Cards */}
          <div className="block xl:hidden p-4 space-y-4">
            {payments.length === 0 ? (
              <div className="py-12 text-center">
                <CreditCard size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground dark:text-slate-400">{t("teacher_earnings_no_transactions", "Chưa có giao dịch nào")}</p>
              </div>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className={`bg-secondary dark:bg-slate-800/50 border border-border dark:border-slate-700 rounded-xl p-4 space-y-3 relative ${selectedPayment?.id === payment.id ? "z-50" : "z-0"}`}
                >
                  {/* Transaction ID + Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_earnings_transaction_id", "Mã giao dịch")}</p>
                      <p className="text-sm font-semibold text-foreground dark:text-white break-all">{payment.id}</p>
                    </div>
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
                        ? t("teacher_earnings_status_success", "Thành công")
                        : payment.status === "pending"
                          ? t("teacher_earnings_status_pending", "Chờ xử lý")
                          : t("teacher_earnings_status_failed", "Thất bại")}
                    </span>
                  </div>

                  {/* Student Info */}
                  <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_dashboard_students", "Học viên")}</p>
                    <p className="text-foreground dark:text-white font-medium">{payment.student}</p>
                    <p className="text-xs text-muted-foreground dark:text-slate-400">{payment.studentEmail}</p>
                  </div>

                  {/* Course */}
                  <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_dashboard_courses", "Khóa học")}</p>
                    <p className="text-foreground dark:text-white font-medium truncate">{payment.course}</p>
                  </div>

                  {/* Amount + Method */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{t("checkout_amount", "Số tiền")}</p>
                      <p className="text-primary dark:text-accent font-bold">{formatCurrencyByLanguage(payment.amount, language)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_earnings_method", "Phương thức")}</p>
                      <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-foreground dark:text-white text-xs font-medium">
                        {payment.method}
                      </span>
                    </div>
                  </div>

                  {/* Date + View Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-border dark:border-slate-700">
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_earnings_payment_date", "Ngày thanh toán")}</p>
                      <p className="text-foreground dark:text-white text-sm">{formatDate(payment.date)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPayment(selectedPayment?.id === payment.id ? null : payment)}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-smooth"
                    >
                      <Eye size={18} className="text-primary dark:text-accent" />
                    </button>
                  </div>

                  {/* Floating Detail Modal - anchored below card */}
                  {selectedPayment?.id === payment.id && (
                    <>
                      <div 
                        className="fixed inset-0 bg-black/40 z-[9998]" 
                        onClick={() => setSelectedPayment(null)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-2 z-[9999] bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl shadow-2xl p-4 animate-slideDown space-y-4 mx-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-foreground dark:text-white">{t("teacher_earnings_transaction_detail", "Chi tiết giao dịch")}</h4>
                          <button 
                            onClick={() => setSelectedPayment(null)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                          >
                            <X size={16} className="text-muted-foreground" />
                          </button>
                        </div>

                        {/* Transaction ID + Status */}
                        <div className="text-center pb-3 border-b border-border dark:border-slate-700">
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_earnings_transaction_id", "Mã giao dịch")}</p>
                          <p className="text-lg font-bold text-foreground dark:text-white break-all">{selectedPayment.id}</p>
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
                              ? t("teacher_earnings_status_success", "Thành công")
                              : selectedPayment.status === "pending"
                                ? t("teacher_earnings_status_pending", "Chờ xử lý")
                                : t("teacher_earnings_status_failed", "Thất bại")}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="bg-primary/10 dark:bg-accent/10 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{t("checkout_amount", "Số tiền")}</p>
                          <p className="text-2xl font-bold text-primary dark:text-accent">{formatCurrencyByLanguage(selectedPayment.amount, language)}</p>
                        </div>

                        {/* Student Info */}
                        <div className="bg-secondary dark:bg-slate-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Users size={14} className="text-primary dark:text-accent" />
                            <span className="text-xs font-semibold text-foreground dark:text-white">{t("teacher_dashboard_students", "Học viên")}</span>
                          </div>
                          <p className="text-foreground dark:text-white font-medium text-sm">{selectedPayment.student}</p>
                          <p className="text-muted-foreground dark:text-slate-400 text-xs">{selectedPayment.studentEmail}</p>
                        </div>

                        {/* Course Info */}
                        <div className="bg-secondary dark:bg-slate-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={14} className="text-primary dark:text-accent" />
                            <span className="text-xs font-semibold text-foreground dark:text-white">{t("teacher_dashboard_courses", "Khóa học")}</span>
                          </div>
                          <p className="text-foreground dark:text-white font-medium text-sm">{selectedPayment.course}</p>
                        </div>

                        {/* Method + Date */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-secondary dark:bg-slate-800/50 rounded-lg p-3">
                            <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("teacher_earnings_method", "Phương thức")}</p>
                            <p className="text-foreground dark:text-white font-medium text-sm">{selectedPayment.method}</p>
                          </div>
                          <div className="bg-secondary dark:bg-slate-800/50 rounded-lg p-3">
                            <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("teacher_earnings_payment_date", "Ngày thanh toán")}</p>
                            <p className="text-foreground dark:text-white font-medium text-sm">{formatDate(selectedPayment.date)}</p>
                          </div>
                        </div>

                        {/* Transaction Reference */}
                        <div className="bg-secondary dark:bg-slate-800/50 rounded-lg p-3">
                          <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("teacher_earnings_reference_code", "Mã tham chiếu")}</p>
                          <p className="text-foreground dark:text-white text-xs font-medium break-all">{selectedPayment.transactionId}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop: Table */}
          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_dashboard_students", "Học viên")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_dashboard_courses", "Khóa học")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("checkout_amount", "Số tiền")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_earnings_method", "Phương thức")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_dashboard_status", "Trạng thái")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_earnings_date", "Ngày")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_students_view_details", "Chi tiết")}</th>
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
                      {formatCurrencyByLanguage(payment.amount, language)}
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
                          ? t("teacher_earnings_status_success", "Thành công")
                          : payment.status === "pending"
                            ? t("teacher_earnings_status_pending", "Chờ xử lý")
                            : t("teacher_earnings_status_failed", "Thất bại")}
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
            {payments.length === 0 && (
              <div className="py-12 text-center">
                <CreditCard size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground dark:text-slate-400">{t("teacher_earnings_no_transactions", "Chưa có giao dịch nào")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Detail Modal - Desktop only */}
      {selectedPayment && (
        <div className="hidden xl:flex fixed inset-0 bg-black/60 z-[9999] items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">{t("teacher_earnings_transaction_detail", "Chi tiết giao dịch")}</h2>
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
                <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("teacher_earnings_transaction_id", "Mã giao dịch")}</p>
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
                    ? t("teacher_earnings_status_success", "Thành công")
                    : selectedPayment.status === "pending"
                      ? t("teacher_earnings_status_pending", "Chờ xử lý")
                      : t("teacher_earnings_status_failed", "Thất bại")}
                </span>
              </div>

              {/* Amount */}
              <div className="bg-primary/10 dark:bg-accent/10 rounded-xl p-4 text-center">
                <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("checkout_amount", "Số tiền")}</p>
                <p className="text-3xl font-bold text-primary dark:text-accent">{formatCurrencyByLanguage(selectedPayment.amount, language)}</p>
              </div>

              {/* Student Info */}
              <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-primary dark:text-accent" />
                  <span className="font-semibold text-foreground dark:text-white">{t("teacher_earnings_student_info", "Thông tin học viên")}</span>
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
                  <span className="font-semibold text-foreground dark:text-white">{t("teacher_dashboard_courses", "Khóa học")}</span>
                </div>
                <p className="text-foreground dark:text-white font-medium">{selectedPayment.course}</p>
              </div>

              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("teacher_earnings_method", "Phương thức")}</p>
                  <p className="text-foreground dark:text-white font-medium">{selectedPayment.method}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("teacher_earnings_payment_date", "Ngày thanh toán")}</p>
                  <p className="text-foreground dark:text-white font-medium">{formatDate(selectedPayment.date)}</p>
                </div>
              </div>

              {/* Transaction Reference */}
              <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">{t("teacher_earnings_reference_code", "Mã tham chiếu")}</p>
                <p className="text-foreground dark:text-white text-sm font-medium">{selectedPayment.transactionId}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportOpen && exportMenuPos && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed z-[9999]"
              style={{ top: exportMenuPos.top, left: exportMenuPos.left, width: 420, maxWidth: "calc(100vw - 24px)" }}
            >
              <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground dark:text-white">{t("teacher_earnings_export_modal_title", "Xuất báo cáo doanh thu")}</h2>
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
                      <BookOpen size={16} /> {t("teacher_dashboard_courses", "Khóa học")}
                    </label>
                    <select
                      value={exportCourse}
                      onChange={(e) => setExportCourse(e.target.value)}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">{t("teacher_earnings_all_courses", "Tất cả khóa học")}</option>
                      {uniqueCourses.map((course) => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>

                  {/* Student Filter */}
                  <div>
                    <label className="text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                      <Users size={16} /> {t("teacher_dashboard_students", "Học viên")}
                    </label>
                    <select
                      value={exportStudent}
                      onChange={(e) => setExportStudent(e.target.value)}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">{t("teacher_earnings_all_students", "Tất cả học viên")}</option>
                      {uniqueStudents.map((student) => (
                        <option key={student} value={student}>{student}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-foreground dark:text-white text-sm font-semibold mb-2 flex items-center gap-2">
                        <Calendar size={16} /> {t("teacher_earnings_from_date", "Từ ngày")}
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
                        <Calendar size={16} /> {t("teacher_earnings_to_date", "Đến ngày")}
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
                    <Download size={20} /> {t("teacher_earnings_export_excel", "Xuất báo cáo Excel")}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}

