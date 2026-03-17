"use client"

import { Search, Download, Eye, DollarSign, TrendingUp, CreditCard, Clock, X, User, BookOpen } from "lucide-react"
import * as XLSX from "xlsx"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { formatPrice, formatNumber } from "@/lib/format"
import Link from "next/link"

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
  source?: "course" | "subscription"
}

interface PaymentStats {
  totalRevenue: number
  pendingTransactions: number
  completedTransactions: number
  failedTransactions: number
  totalTransactions: number
}

const normalizeStatus = (status?: string): Payment["status"] => {
  const normalized = status?.toLowerCase?.()
  if (normalized === "completed" || normalized === "success") return "success"
  if (normalized === "pending") return "pending"
  return "failed"
}

const normalizeMethod = (method?: string) => {
  if (!method) return "Khác"
  return method.toUpperCase()
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    totalTransactions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "pending" | "failed">("all")
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | HTMLButtonElement | null>>({})
  const exportButtonRef = useRef<HTMLButtonElement | null>(null)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [exportMenuPos, setExportMenuPos] = useState<{ top: number; left: number } | null>(null)

  // Export filters
  const [exportStatus, setExportStatus] = useState<string>("all")
  const [exportUser, setExportUser] = useState<string>("all")
  const [exportCourse, setExportCourse] = useState<string>("all")
  const [exportTeacher, setExportTeacher] = useState<string>("all")
  const [exportDateFrom, setExportDateFrom] = useState<string>("")
  const [exportDateTo, setExportDateTo] = useState<string>("")

  const loadPayments = async () => {
    setLoading(true)
    try {
      const [listRes, statsRes, subscriptionPaymentRes] = await Promise.all([
        apiClient.getAdminPayments({ limit: 200 }),
        apiClient.getAdminPaymentStats(),
        apiClient.getAdminInstructorPayments(),
      ])

      const rawList = (listRes as any)?.data ?? listRes ?? []

      const coursePayments: Payment[] = Array.isArray(rawList)
        ? rawList.map((p: any) => {
            const student = p.student || {}
            const course = p.course || {}
            const teacher = course.teacher || {}
            const paidAt = p.paidAt || p.createdAt || new Date()

            return {
              id: p.id || p.transactionId,
              transactionId: p.transactionId || p.id || "",
              user: student.name || "Không rõ",
              userEmail: student.email || "",
              userPhone: student.phoneNumber || student.phone || "",
              course: course.title || "Không rõ",
              courseId: course.id || "",
              teacher: teacher.name || "",
              teacherEmail: teacher.email || "",
              amount: Number(p.finalAmount ?? p.amount ?? 0),
              method: normalizeMethod(p.paymentMethod),
              status: normalizeStatus(p.status),
              date: new Date(paidAt).toISOString(),
              source: "course",
            }
          })
        : []

      const subscriptionPayments: Payment[] = Array.isArray(subscriptionPaymentRes)
        ? subscriptionPaymentRes.map((p: any) => ({
            id: p.id || p.transactionId,
            transactionId: p.transactionId || p.id || "",
            user: p.teacher?.name || "Giảng viên",
            userEmail: p.teacher?.email || "",
            userPhone: p.teacher?.phone || "",
            course: `Gói ${p.plan?.name || "Subscription"}`,
            courseId: p.plan?.id || "",
            teacher: p.teacher?.name || "",
            teacherEmail: p.teacher?.email || "",
            amount: Number(p.amount ?? 0),
            method: normalizeMethod(p.paymentMethod),
            status: normalizeStatus(p.status),
            date: new Date(p.paidAt || p.createdAt || new Date()).toISOString(),
            source: "subscription",
          }))
        : []

      const mapped = [...coursePayments, ...subscriptionPayments].sort(
        (a, b) => +new Date(b.date) - +new Date(a.date),
      )

      setPayments(mapped)

      const derivedRevenue = mapped
        .filter((p) => p.status === "success")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)

      setStats({
        totalRevenue: Number(statsRes?.totalRevenue ?? derivedRevenue),
        pendingTransactions: Number(statsRes?.pendingTransactions ?? mapped.filter((p) => p.status === "pending").length),
        completedTransactions: Number(statsRes?.completedTransactions ?? mapped.filter((p) => p.status === "success").length),
        failedTransactions: Number(statsRes?.failedTransactions ?? mapped.filter((p) => p.status === "failed").length),
        totalTransactions: Number(statsRes?.totalTransactions ?? mapped.length),
      })
    } catch (error) {
      console.error("Error loading payments", error)
      toast.error("Không thể tải dữ liệu thanh toán")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
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

  const uniqueCourses = useMemo(() => Array.from(new Set(payments.map((p) => p.course).filter(Boolean))), [payments])
  const uniqueUsers = useMemo(() => Array.from(new Set(payments.map((p) => p.user).filter(Boolean))), [payments])
  const uniqueTeachers = useMemo(() => Array.from(new Set(payments.map((p) => p.teacher).filter(Boolean))), [payments])

  const filteredPayments = useMemo(() => {
    const keyword = searchQuery.toLowerCase()
    return payments.filter(
      (payment) =>
        ((payment.id || "").toLowerCase().includes(keyword) ||
          (payment.user || "").toLowerCase().includes(keyword) ||
          (payment.course || "").toLowerCase().includes(keyword) ||
          (payment.teacher || "").toLowerCase().includes(keyword)) &&
        (statusFilter === "all" || payment.status === statusFilter),
    )
  }, [payments, searchQuery, statusFilter])

  const derivedRevenue = payments.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0)
  const totalRevenue = stats.totalRevenue || derivedRevenue
  const pendingAmount = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const successCount = stats.completedTransactions || payments.filter((p) => p.status === "success").length
  const totalTransactions = stats.totalTransactions || payments.length

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

    const headers = ["ID", "Người dùng", "Email", "Khóa học", "Giảng viên", "Số tiền", "Phương thức", "Trạng thái", "Ngày"]
    const rows = exportData.map((p) => [
      p.id,
      p.user,
      p.userEmail,
      p.course,
      p.teacher,
      p.amount.toString(),
      p.method,
      p.status === "success" ? "Thành công" : p.status === "pending" ? "Chờ xử lý" : "Thất bại",
      formatDate(p.date),
    ])

    const exportDate = new Date().toLocaleDateString("vi-VN")
    const bannerLines = [["Báo cáo: Thanh toán"], [`Ngày xuất: ${exportDate}`]]
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Thanh toan")
    XLSX.writeFile(workbook, `payments_report_${new Date().toISOString().split("T")[0]}.xlsx`)

    setIsExportOpen(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="h-[520px] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Hero Section with Background */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 animate-fadeIn"
          style={{ backgroundImage: "url('/image/bg_payment1.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          {/* Overlay for better readability */}

          <div className="relative z-10 space-y-8">
            <div
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown"
              style={{ animationDelay: "0.15s" }}
            >
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Quản lý thanh toán</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Theo dõi và quản lý các giao dịch thanh toán</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/admin/payments/codes"
                  className="flex items-center gap-2 px-4 py-3 bg-white text-primary rounded-lg font-medium transition-all duration-300 hover:shadow-lg"
                >
                  Mã thanh toán
                </Link>
                <button
                  ref={exportButtonRef}
                  onClick={() => setIsExportOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-lg font-medium transition-all duration-300 hover:shadow-lg w-fit backdrop-blur-sm"
                >
                  <Download size={20} /> Xuất báo cáo
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Stats Cards - Fixed height, centered content */}
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="bg-white/80 dark:bg-slate-900/80 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg flex items-center justify-between h-36">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      Tổng doanh thu
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-green-600 whitespace-nowrap">
                      ₫{formatNumber(totalRevenue)}
                    </p>
                  </div>

                  <div className="w-10 h-10 flex-shrink-0 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign size={20} className="text-green-600" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-800/50 rounded-2xl p-6 shadow-lg h-36 flex flex-col justify-between items-center">
                  <div className="flex flex-col items-center w-full">
                    <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Đang chờ xử lý</p>
                    <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">₫{formatNumber(pendingAmount)}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mt-2">
                    <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-800/50 rounded-2xl p-6 shadow-lg h-36 flex flex-col justify-between items-center">
                  <div className="flex flex-col items-center w-full">
                    <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Giao dịch thành công</p>
                    <p className="text-xl font-bold text-foreground dark:text-white mt-1">{successCount}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mt-2">
                    <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-800/50 rounded-2xl p-6 shadow-lg h-36 flex flex-col justify-between items-center">
                  <div className="flex flex-col items-center w-full">
                    <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng giao dịch</p>
                    <p className="text-xl font-bold text-foreground dark:text-white mt-1">{totalTransactions}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mt-2">
                    <CreditCard size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
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
{/* Payments Card – Mobile & Small Tablet */}
<div className="block lg:hidden space-y-4 mb-6">
  {filteredPayments.map(payment => (
    <div
  key={payment.id}
  ref={(el) => { cardRefs.current[payment.id] = el; }}
  className="relative w-full bg-slate-800/80 rounded-xl p-4 space-y-3"
>
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-semibold text-white leading-snug line-clamp-2">
            {payment.user}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {payment.course}
          </p>
        </div>
        {/* STATUS BADGE */}
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium border ${
            payment.status === "success"
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : payment.status === "pending"
              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {payment.status === "success"
            ? "Thành công"
            : payment.status === "pending"
            ? "Chờ xử lý"
            : "Thất bại"}
        </span>
      </div>
      {/* GIẢNG VIÊN */}
      <div className="text-sm text-slate-300">
        {payment.teacher}
      </div>
      {/* EMAIL / PHONE */}
      <div className="text-xs text-slate-400 truncate">
        {payment.userEmail || payment.userPhone}
      </div>
      {/* GRID INFO */}
      <div className="grid grid-cols-2 gap-3 text-sm pt-2">
        <div className="flex items-center gap-2">
          <span className="text-green-400">₫</span>
          <span>{formatPrice(payment.amount)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-400">💳</span>
          <span>{payment.method}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">🕒</span>
          <span>{formatDate(payment.date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-purple-400">#</span>
          <span className="truncate">{payment.transactionId}</span>
        </div>
      </div>
      {/* FOOTER */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <span className="text-xs text-slate-400">
          ID: {payment.id}
        </span>
        <button
          onClick={() => {
            const el = cardRefs.current[payment.id]
            if (!el) return
            const rect = el.getBoundingClientRect()
            setPopupPos({
              top: rect.bottom + window.scrollY + 8,
              left: rect.left + window.scrollX,
            })
            setExpandedPaymentId(payment.id)
          }}
          className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm"
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  ))}
</div>

      {/* Mobile popup detail – anchored under card */}
      {expandedPaymentId && popupPos &&
        (() => {
          const payment = payments.find(p => p.id === expandedPaymentId)
          if (!payment) return null

          return createPortal(
            <div
              className="absolute z-[9999]"
              style={{
                top: popupPos.top,
                left: popupPos.left,
                width: "calc(100vw - 2rem)",
                maxWidth: 420,
              }}
            >
              <div className="bg-gradient-to-b from-[#0B1220] to-[#070B14] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <p className="text-white font-semibold text-base">Chi tiết giao dịch</p>
                  <button
                    onClick={() => setExpandedPaymentId(null)}
                    className="p-1 rounded hover:bg-white/10"
                  >
                    <X size={18} className="text-slate-300" />
                  </button>
                </div>

                {/* Mã giao dịch + trạng thái */}
                <div className="p-4 pb-2 text-center border-b border-white/10">
                  <p className="text-slate-400 text-xs mb-1">Mã giao dịch</p>
                  <p className="text-white font-bold text-base break-all">{payment.id}</p>
                  <div className="mt-2 flex justify-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      payment.status === "success"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : payment.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {payment.status === "success"
                        ? "Thành công"
                        : payment.status === "pending"
                          ? "Chờ xử lý"
                          : "Thất bại"}
                    </span>
                  </div>
                </div>

                {/* Số tiền thanh toán */}
                <div className="p-4">
                  <div className="bg-[#0E2236] rounded-xl p-4 text-center border border-cyan-400/20">
                    <p className="text-slate-400 text-xs">Số tiền thanh toán</p>
                    <p className="text-2xl font-extrabold text-cyan-400">₫{formatPrice(payment.amount)}</p>
                  </div>
                </div>

                {/* Người mua */}
                <div className="px-4 pb-2">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-slate-400 text-xs mb-1">Người mua</p>
                    <p className="text-white font-medium">{payment.user}</p>
                    {payment.userEmail && <p className="text-slate-400 text-xs">{payment.userEmail}</p>}
                  </div>
                </div>

                {/* Khóa học + Giảng viên */}
                <div className="px-4 pb-2">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-slate-400 text-xs mb-1">Khóa học</p>
                    <p className="text-white font-medium">{payment.course}</p>
                    {payment.teacher && <p className="text-slate-400 text-xs">Giảng viên: {payment.teacher}</p>}
                  </div>
                </div>

                {/* Phương thức + Ngày thanh toán */}
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-slate-400 text-xs mb-1">Phương thức</p>
                      <p className="text-white text-xs font-medium break-all">{payment.method}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-slate-400 text-xs mb-1">Ngày thanh toán</p>
                      <p className="text-white text-xs font-medium">{formatDate(payment.date)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        })()
      }
        {/* Payments Table */}
        <div className="hidden lg:block bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
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
                        ref={el => {
                          if (el) cardRefs.current[`${payment.id}-table-btn`] = el;
                        }}
                        onClick={() => {
                          const el = cardRefs.current[`${payment.id}-table-btn`]
                          if (!el) return
                          const rect = el.getBoundingClientRect()
                          const MODAL_WIDTH = 420
const GAP = 12

const viewportWidth = window.innerWidth

let left = rect.right + GAP

// Nếu tràn màn hình phải → đẩy sang trái card
if (left + MODAL_WIDTH > viewportWidth) {
  left = rect.left - MODAL_WIDTH - GAP
}

// Nếu vẫn tràn bên trái → clamp về trong viewport
if (left < GAP) {
  left = GAP
}

setPopupPos({
  top: rect.bottom + window.scrollY + GAP,
  left: left + window.scrollX,
})
                          setExpandedPaymentId(payment.id)
                        }}
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

      {/* Payment Detail Modal for desktop/tablet - anchored under button */}
      {expandedPaymentId && popupPos &&
        (() => {
          const payment = payments.find(p => p.id === expandedPaymentId)
          if (!payment) return null
          return createPortal(
            <div
              className="absolute z-[9999]"
              style={{
                top: popupPos.top,
                left: popupPos.left,
                width: 420,
                maxWidth: "calc(100vw - 2rem)",
              }}
            >
              <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
                <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground dark:text-white">Chi tiết giao dịch</h2>
                  <button
                    onClick={() => setExpandedPaymentId(null)}
                    className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                  >
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Transaction ID */}
                  <div className="text-center pb-4 border-b border-border dark:border-slate-800">
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Mã giao dịch</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white">{payment.id}</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
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
                  </div>

                  {/* Amount */}
                  <div className="bg-primary/10 dark:bg-accent/10 rounded-xl p-4 text-center">
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Số tiền thanh toán</p>
                    <p className="text-3xl font-bold text-primary dark:text-accent">₫{formatPrice(payment.amount)}</p>
                  </div>

                  {/* User Info */}
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={16} className="text-primary dark:text-accent" />
                      <span className="font-semibold text-foreground dark:text-white">Thông tin người mua</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-foreground dark:text-white font-medium">{payment.user}</p>
                      <p className="text-muted-foreground dark:text-slate-400">{payment.userEmail}</p>
                      <p className="text-muted-foreground dark:text-slate-400">{payment.userPhone}</p>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen size={16} className="text-primary dark:text-accent" />
                      <span className="font-semibold text-foreground dark:text-white">Thông tin khóa học</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-foreground dark:text-white font-medium">{payment.course}</p>
                      <p className="text-muted-foreground dark:text-slate-400">Mã khóa học: {payment.courseId}</p>
                      <p className="text-muted-foreground dark:text-slate-400">Giảng viên: {payment.teacher}</p>
                    </div>
                  </div>

                  {/* Transaction Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                      <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">Phương thức</p>
                      <p className="text-foreground dark:text-white font-medium">{payment.method}</p>
                    </div>
                    <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                      <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">Ngày thanh toán</p>
                      <p className="text-foreground dark:text-white font-medium">{formatDate(payment.date)}</p>
                    </div>
                  </div>

                  {/* Transaction Reference */}
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-muted-foreground dark:text-slate-400 text-xs mb-1">Mã tham chiếu giao dịch</p>
                    <p className="text-foreground dark:text-white text-sm font-medium">{payment.transactionId}</p>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        })()
      }
 </div>  
  )}