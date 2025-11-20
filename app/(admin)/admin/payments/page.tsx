"use client"

import { Search, Download, Filter } from "lucide-react"
import { useState } from "react"
import { ExportModal } from "@/components/ui/export-modal"

const payments = [
  {
    id: "PAY001",
    user: "Trần Văn A",
    course: "Next.js Advanced",
    amount: 499000,
    method: "VNPay",
    status: "success",
    date: "2025-01-15",
  },
  {
    id: "PAY002",
    user: "Nguyễn Thị B",
    course: "React Hooks",
    amount: 399000,
    method: "MoMo",
    status: "success",
    date: "2025-01-14",
  },
  {
    id: "PAY003",
    user: "Lê Minh C",
    course: "Python Data Science",
    amount: 549000,
    method: "VNPay",
    status: "pending",
    date: "2025-01-13",
  },
  {
    id: "PAY004",
    user: "Phạm Quốc D",
    course: "UI/UX Design",
    amount: 349000,
    method: "Stripe",
    status: "success",
    date: "2025-01-12",
  },
  {
    id: "PAY005",
    user: "Hoàng Thị E",
    course: "Branding",
    amount: 349000,
    method: "MoMo",
    status: "failed",
    date: "2025-01-11",
  },
]

export default function AdminPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isExportOpen, setIsExportOpen] = useState(false)

  const filteredPayments = payments.filter(
    (payment) =>
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalRevenue = payments.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0)

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Quản lý thanh toán</h1>
            <p className="text-muted-foreground dark:text-slate-400">
              Tổng doanh thu: ₫{totalRevenue.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth"
          >
            <Download size={20} /> Xuất báo cáo
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm giao dịch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-smooth">
            <Filter size={20} /> Bộ lọc
          </button>
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
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Số tiền</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Phương thức</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Trạng thái</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth"
                  >
                    <td className="py-4 px-6 text-foreground dark:text-white font-medium">{payment.id}</td>
                    <td className="py-4 px-6 text-foreground dark:text-white">{payment.user}</td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400 line-clamp-1">
                      {payment.course}
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white font-medium">
                      ₫{payment.amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{payment.method}</td>
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
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{payment.date}</td>
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
        title="Báo cáo thanh toán"
        data={filteredPayments}
      />
    </main>
  )
}
