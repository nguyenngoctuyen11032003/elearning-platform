"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { ArrowLeft, CreditCard, Smartphone, DollarSign, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface TopUpMethod {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  fee: number // percentage
}

interface TopUpHistory {
  id: string
  amount: number
  method: string
  status: "completed" | "pending" | "failed"
  date: string
  transactionId: string
}

const topUpMethods: TopUpMethod[] = [
  {
    id: "credit-card",
    name: "Thẻ tín dụng",
    icon: <CreditCard size={24} />,
    description: "Visa, Mastercard",
    fee: 0,
  },
  {
    id: "debit-card",
    name: "Thẻ ghi nợ",
    icon: <CreditCard size={24} />,
    description: "Thẻ ghi nợ nội địa",
    fee: 0,
  },
  {
    id: "bank-transfer",
    name: "Chuyển khoản ngân hàng",
    icon: <DollarSign size={24} />,
    description: "Chuyển khoản từ tài khoản ngân hàng",
    fee: 0,
  },
  {
    id: "momo",
    name: "Momo",
    icon: <Smartphone size={24} />,
    description: "Ví điện tử Momo",
    fee: 0,
  },
  {
    id: "zalo-pay",
    name: "ZaloPay",
    icon: <Smartphone size={24} />,
    description: "Ví điện tử ZaloPay",
    fee: 0,
  },
  {
    id: "bank-app",
    name: "Ứng dụng ngân hàng",
    icon: <Smartphone size={24} />,
    description: "QR code thanh toán",
    fee: 0,
  },
]

const topUpPrices = [100000, 200000, 500000, 1000000, 2000000, 5000000]

export default function TopUpPage() {
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [balance, setBalance] = useState(5000000)
  const [selectedMethod, setSelectedMethod] = useState<string>("credit-card")
  const [selectedAmount, setSelectedAmount] = useState<number>(500000)
  const [topUpHistory, setTopUpHistory] = useState<TopUpHistory[]>([
    {
      id: "top-1",
      amount: 500000,
      method: "Thẻ tín dụng",
      status: "completed",
      date: "2024-12-20T14:30:00Z",
      transactionId: "TOP-001",
    },
    {
      id: "top-2",
      amount: 1000000,
      method: "Momo",
      status: "completed",
      date: "2024-12-15T10:15:00Z",
      transactionId: "TOP-002",
    },
    {
      id: "top-3",
      amount: 200000,
      method: "ZaloPay",
      status: "completed",
      date: "2024-12-10T16:45:00Z",
      transactionId: "TOP-003",
    },
    {
      id: "top-4",
      amount: 2000000,
      method: "Chuyển khoản ngân hàng",
      status: "pending",
      date: "2024-12-05T09:20:00Z",
      transactionId: "TOP-004",
    },
  ])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDarkMode = mounted && resolvedTheme === "dark"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return isDarkMode ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-100 text-emerald-700"
      case "pending":
        return isDarkMode ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-100 text-yellow-700"
      case "failed":
        return isDarkMode ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-700"
      default:
        return ""
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

  const handleTopUp = async () => {
    setIsProcessing(true)
    // Simulate API call
    setTimeout(() => {
      const method = topUpMethods.find(m => m.id === selectedMethod)
      const newTransaction: TopUpHistory = {
        id: `top-${Date.now()}`,
        amount: selectedAmount,
        method: method?.name || "Unknown",
        status: "completed",
        date: new Date().toISOString(),
        transactionId: `TOP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      }
      setTopUpHistory([newTransaction, ...topUpHistory])
      setBalance(balance + selectedAmount)
      setIsProcessing(false)
      // Optional: Show success message and redirect
      alert(`Nạp tiền ${formatCurrency(selectedAmount)} thành công!`)
    }, 2000)
  }

  if (!mounted) return null

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 text-gray-900'}`}>
      {/* Sticky Header */}
      <div className={`sticky top-0 z-40 ${isDarkMode ? 'bg-gray-900/95 backdrop-blur-md border-gray-700' : 'bg-sky-50/95 backdrop-blur-md border-blue-100'} border-b`}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link
            href="/payment-history"
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all mb-4 ${isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-200 text-blue-600'}`}
          >
            <ArrowLeft size={18} />
            Quay lại
          </Link>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold">Nạp tiền vào tài khoản</h1>
              <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chọn hình thức nạp tiền và mức giá phù hợp</p>
            </div>
            <div className={`${isDarkMode ? 'bg-cyan-900/50 border-cyan-700' : 'bg-cyan-50 border-cyan-200'} rounded-xl p-4 border text-right flex-shrink-0`}>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>Số dư hiện tại</p>
              <p className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Select Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 border shadow-sm`}
            >
              <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Chọn hình thức nạp tiền
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topUpMethods.map((method) => (
                  <motion.button
                    key={method.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedMethod === method.id
                        ? isDarkMode
                          ? 'bg-blue-900/50 border-blue-500 shadow-lg shadow-blue-500/30'
                          : 'bg-blue-50 border-blue-500 shadow-lg shadow-blue-500/20'
                        : isDarkMode
                        ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${selectedMethod === method.id ? (isDarkMode ? 'bg-blue-600' : 'bg-blue-500') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-200')}`}>
                        <div className={selectedMethod === method.id ? 'text-white' : (isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
                          {method.icon}
                        </div>
                      </div>
                      {selectedMethod === method.id && (
                        <div className="bg-blue-500 text-white rounded-full p-1">
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{method.name}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{method.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Select Amount */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 border shadow-sm`}
            >
              <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Chọn mức nạp tiền
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {topUpPrices.map((price) => (
                    <motion.button
                      key={price}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedAmount(price)}
                      className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                        selectedAmount === price
                          ? isDarkMode
                            ? 'bg-emerald-900/50 border-emerald-500 shadow-lg shadow-emerald-500/30'
                            : 'bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/20'
                          : isDarkMode
                          ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {formatCurrency(price)}
                    </motion.button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className={`p-4 rounded-xl border-2 ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <label className={`text-sm font-medium block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Hoặc nhập số tiền khác (VND)
                  </label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 750000"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-2 ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                  />
                  {selectedAmount > 0 && (
                    <p className={`text-sm font-semibold mt-2 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {new Intl.NumberFormat("vi-VN").format(selectedAmount)} VND
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border-blue-700' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'} rounded-2xl p-6 border shadow-sm`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Tóm tắt giao dịch
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Hình thức:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {topUpMethods.find(m => m.id === selectedMethod)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Số tiền:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(selectedAmount)}
                  </span>
                </div>
                <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} pt-3 flex justify-between text-lg font-bold`}>
                  <span>Tổng cộng:</span>
                  <span className="text-emerald-500">{formatCurrency(selectedAmount)}</span>
                </div>
              </div>

              <button
                onClick={handleTopUp}
                disabled={isProcessing || selectedAmount <= 0}
                className={`w-full mt-6 py-3 rounded-lg font-semibold transition-all text-white text-lg ${
                  isProcessing || selectedAmount <= 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/30'
                }`}
              >
                {isProcessing ? 'Đang xử lý...' : 'Nạp tiền ngay'}
              </button>
            </motion.div>
          </div>

          {/* Right Sidebar - Top Up History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 border shadow-sm h-fit sticky top-6`}
          >
            <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Lịch sử nạp tiền
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:hidden [&::-moz-scrollbar]:hidden [-ms-overflow-style:none]">
              {topUpHistory.length === 0 ? (
                <p className={`text-center py-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Chưa có lịch sử nạp tiền
                </p>
              ) : (
                topUpHistory.map((history) => (
                  <motion.div
                    key={history.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(history.amount)}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {history.method}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(history.status)}`}>
                        {getStatusText(history.status)}
                      </span>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {formatDate(history.date)}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      ID: {history.transactionId}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
