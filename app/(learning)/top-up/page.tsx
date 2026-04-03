"use client"

import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Building2,
  Check,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Sparkles,
  Smartphone,
  Wallet2,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-context"
import { toast } from "sonner"

interface TopUpMethodMeta {
  id: string
  nameKey: string
  nameFallback: string
  descKey: string
  descFallback: string
  icon: LucideIcon
  fee: number
}

interface TopUpHistory {
  id: string
  amount: number
  methodId: string
  status: "completed" | "pending" | "failed"
  date: string
  transactionId: string
}

interface TopUpMethod {
  id: string
  name: string
  description: string
  icon: LucideIcon
  fee: number
}

const topUpMethodsMeta: TopUpMethodMeta[] = [
  {
    id: "credit-card",
    nameKey: "topup_credit_card",
    nameFallback: "Credit card",
    icon: CreditCard,
    descKey: "topup_credit_desc",
    descFallback: "Visa, Mastercard",
    fee: 0,
  },
  {
    id: "debit-card",
    nameKey: "topup_debit_card",
    nameFallback: "Debit card",
    icon: CreditCard,
    descKey: "topup_debit_desc",
    descFallback: "Domestic debit card",
    fee: 0,
  },
  {
    id: "bank-transfer",
    nameKey: "topup_bank_transfer",
    nameFallback: "Bank transfer",
    icon: Building2,
    descKey: "topup_bank_desc",
    descFallback: "Transfer from your bank account",
    fee: 0,
  },
  {
    id: "momo",
    nameKey: "topup_momo",
    nameFallback: "Momo",
    icon: Smartphone,
    descKey: "topup_momo_desc",
    descFallback: "Momo e-wallet",
    fee: 0,
  },
  {
    id: "zalo-pay",
    nameKey: "topup_zalopay",
    nameFallback: "ZaloPay",
    icon: Smartphone,
    descKey: "topup_zalopay_desc",
    descFallback: "ZaloPay e-wallet",
    fee: 0,
  },
  {
    id: "bank-app",
    nameKey: "topup_bank_app",
    nameFallback: "Banking app",
    icon: Smartphone,
    descKey: "topup_bankapp_desc",
    descFallback: "Pay via QR code",
    fee: 0,
  },
]

const topUpPrices = [100000, 200000, 500000, 1000000, 2000000, 5000000]

export default function TopUpPage() {
  const { resolvedTheme } = useTheme()
  const { language, t } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [balance, setBalance] = useState(5000000)
  const [selectedMethod, setSelectedMethod] = useState<string>("credit-card")
  const [selectedAmount, setSelectedAmount] = useState<number>(500000)
  const [customAmountInput, setCustomAmountInput] = useState<string>("500000")
  const [topUpHistory, setTopUpHistory] = useState<TopUpHistory[]>([
    {
      id: "top-1",
      amount: 500000,
      methodId: "credit-card",
      status: "completed",
      date: "2024-12-20T14:30:00Z",
      transactionId: "TOP-001",
    },
    {
      id: "top-2",
      amount: 1000000,
      methodId: "momo",
      status: "completed",
      date: "2024-12-15T10:15:00Z",
      transactionId: "TOP-002",
    },
    {
      id: "top-3",
      amount: 200000,
      methodId: "zalo-pay",
      status: "completed",
      date: "2024-12-10T16:45:00Z",
      transactionId: "TOP-003",
    },
    {
      id: "top-4",
      amount: 2000000,
      methodId: "bank-transfer",
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
  const locale = language === "en" ? "en-US" : "vi-VN"

  const topUpMethods: TopUpMethod[] = useMemo(
    () =>
      topUpMethodsMeta.map((method) => ({
        id: method.id,
        name: t(method.nameKey, method.nameFallback),
        description: t(method.descKey, method.descFallback),
        icon: method.icon,
        fee: method.fee,
      })),
    [t],
  )

  const methodById = useMemo(
    () => new Map(topUpMethods.map((method) => [method.id, method])),
    [topUpMethods],
  )

  const completedTopUps = useMemo(
    () => topUpHistory.filter((item) => item.status === "completed"),
    [topUpHistory],
  )

  const totalCompletedAmount = useMemo(
    () => completedTopUps.reduce((sum, item) => sum + item.amount, 0),
    [completedTopUps],
  )

  const averageCompletedAmount = useMemo(
    () => (completedTopUps.length > 0 ? Math.round(totalCompletedAmount / completedTopUps.length) : 0),
    [completedTopUps, totalCompletedAmount],
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const projectedBalance = balance + Math.max(selectedAmount, 0)

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
        return t("topup_status_ok", "Success")
      case "pending":
        return t("topup_status_pending", "Processing")
      case "failed":
        return t("topup_status_failed", "Failed")
      default:
        return t("topup_status_unknown", "Unknown")
    }
  }

  const handleTopUp = async () => {
    if (selectedAmount <= 0 || Number.isNaN(selectedAmount)) {
      toast.error(t("topup_invalid_amount", "Please enter a valid amount"))
      return
    }

    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 1100))

    const newTransaction: TopUpHistory = {
      id: `top-${Date.now()}`,
      amount: selectedAmount,
      methodId: selectedMethod,
      status: "completed",
      date: new Date().toISOString(),
      transactionId: `TOP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    }

    setTopUpHistory((prev) => [newTransaction, ...prev])
    setBalance((prev) => prev + selectedAmount)
    setIsProcessing(false)

    toast.success(t("topup_success_title", "Top-up successful"), {
      description: t("topup_success_message", "You added {amount} to your wallet.").replace(
        "{amount}",
        formatCurrency(selectedAmount),
      ),
    })
  }

  const selectSuggestedAmount = (value: number) => {
    setSelectedAmount(value)
    setCustomAmountInput(String(value))
  }

  const onCustomAmountChange = (value: string) => {
    setCustomAmountInput(value)
    const parsed = Number(value)
    if (Number.isNaN(parsed)) {
      setSelectedAmount(0)
      return
    }
    setSelectedAmount(parsed)
  }

  if (!mounted) return null

  return (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDarkMode ? "bg-[#050d1f] text-slate-100" : "bg-[#f4f8ff] text-slate-900"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isDarkMode
            ? "[background:radial-gradient(circle_at_18%_14%,rgba(34,211,238,0.22),transparent_42%),radial-gradient(circle_at_86%_12%,rgba(59,130,246,0.18),transparent_36%),radial-gradient(circle_at_60%_86%,rgba(16,185,129,0.14),transparent_34%)]"
            : "[background:radial-gradient(circle_at_10%_16%,rgba(56,189,248,0.16),transparent_38%),radial-gradient(circle_at_86%_10%,rgba(16,185,129,0.14),transparent_34%),radial-gradient(circle_at_56%_86%,rgba(245,158,11,0.14),transparent_32%)]"
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-0 opacity-40 ${
          isDarkMode
            ? "[background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]"
            : "[background-image:linear-gradient(rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.14)_1px,transparent_1px)]"
        } [background-size:34px_34px]`}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-8 pt-7 sm:px-6 lg:px-8 lg:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className={`relative mb-6 overflow-hidden rounded-3xl border px-5 py-5 sm:px-7 ${
            isDarkMode ? "border-cyan-400/30 bg-slate-900/65" : "border-cyan-200 bg-white/90"
          } shadow-[0_18px_60px_-26px_rgba(8,145,178,0.45)] backdrop-blur-md`}
        >
          <motion.div
            aria-hidden
            className={`absolute -top-24 right-16 h-56 w-56 rounded-full blur-3xl ${
              isDarkMode ? "bg-cyan-400/20" : "bg-cyan-300/30"
            }`}
            animate={{ y: [0, -12, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className={`absolute -bottom-20 left-20 h-52 w-52 rounded-full blur-3xl ${
              isDarkMode ? "bg-emerald-400/20" : "bg-emerald-300/30"
            }`}
            animate={{ y: [0, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />

          <Link
            href="/payment-history"
            className={`relative z-[1] mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
              isDarkMode ? "text-cyan-300 hover:bg-cyan-500/10" : "text-cyan-700 hover:bg-cyan-100"
            }`}
          >
            <ArrowLeft size={18} />
            {t("topup_back", "Back")}
          </Link>

          <div className="relative z-[1] flex flex-wrap items-start justify-between gap-5">
            <div className="flex-1">
              <p
                className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                  isDarkMode ? "bg-cyan-500/10 text-cyan-300" : "bg-cyan-100 text-cyan-700"
                }`}
              >
                <Sparkles size={14} />
                {t("pay_header_label", "Wallet & transactions")}
              </p>
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{t("topup_title", "Top up account")}</h1>
              <p className={`mt-2 max-w-3xl text-sm sm:text-base ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                {t("topup_subtitle", "Choose your top-up method and amount")}
              </p>
            </div>

            <div className="grid min-w-[240px] gap-3 sm:min-w-[280px]">
              <div
                className={`rounded-2xl border p-4 text-right ${
                  isDarkMode ? "border-emerald-500/35 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <p className={`mb-1 text-xs uppercase tracking-[0.18em] ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}>
                  {t("topup_balance", "Current balance")}
                </p>
                <p className={`text-2xl font-extrabold ${isDarkMode ? "text-emerald-200" : "text-emerald-700"}`}>
                  {formatCurrency(balance)}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 text-right ${
                  isDarkMode ? "border-cyan-500/35 bg-cyan-500/10" : "border-cyan-200 bg-cyan-50"
                }`}
              >
                <p className={`mb-1 text-xs uppercase tracking-[0.18em] ${isDarkMode ? "text-cyan-300" : "text-cyan-700"}`}>
                  {t("topup_projected_balance", "Projected balance")}
                </p>
                <p className={`text-xl font-extrabold ${isDarkMode ? "text-cyan-100" : "text-cyan-700"}`}>
                  {formatCurrency(projectedBalance)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {[
            {
              key: "volume",
              icon: CircleDollarSign,
              title: t("topup_stats_volume", "Top-up volume"),
              value: formatCurrency(totalCompletedAmount),
              tone: isDarkMode ? "text-cyan-200" : "text-cyan-700",
            },
            {
              key: "count",
              icon: Wallet2,
              title: t("topup_stats_count", "Successful transactions"),
              value: `${completedTopUps.length}`,
              tone: isDarkMode ? "text-emerald-200" : "text-emerald-700",
            },
            {
              key: "average",
              icon: Clock3,
              title: t("topup_stats_average", "Average top-up"),
              value: formatCurrency(averageCompletedAmount),
              tone: isDarkMode ? "text-amber-200" : "text-amber-700",
            },
          ].map((stat, index) => {
            const StatIcon = stat.icon
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.05 }}
                className={`rounded-2xl border p-4 backdrop-blur-sm ${
                  isDarkMode ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white/90"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className={`text-xs uppercase tracking-[0.16em] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {stat.title}
                  </p>
                  <span className={`rounded-lg p-2 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                    <StatIcon size={16} className={stat.tone} />
                  </span>
                </div>
                <p className={`text-2xl font-extrabold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{stat.value}</p>
              </motion.div>
            )
          })}
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-3xl border p-6 shadow-[0_20px_56px_-28px_rgba(15,23,42,0.45)] ${
                isDarkMode ? "border-slate-700 bg-slate-900/72" : "border-slate-200 bg-white/95"
              }`}
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {t("topup_method_title", "Choose top-up method")}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isDarkMode ? "bg-cyan-500/10 text-cyan-300" : "bg-cyan-100 text-cyan-700"
                  }`}
                >
                  {t("topup_method_hint", "Pick your preferred payment channel")}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {topUpMethods.map((method, index) => (
                  <motion.button
                    key={method.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + index * 0.03 }}
                    whileHover={{ scale: 1.015, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                      selectedMethod === method.id
                        ? isDarkMode
                          ? "border-cyan-400 bg-cyan-500/15 shadow-[0_14px_34px_-22px_rgba(34,211,238,0.8)]"
                          : "border-cyan-500 bg-cyan-50 shadow-[0_14px_34px_-20px_rgba(14,165,233,0.45)]"
                        : isDarkMode
                          ? "border-slate-700 bg-slate-800/70 hover:border-slate-500"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ${
                        selectedMethod === method.id ? "opacity-100" : "group-hover:opacity-100"
                      } ${
                        isDarkMode
                          ? "bg-gradient-to-br from-cyan-400/8 via-transparent to-emerald-400/8"
                          : "bg-gradient-to-br from-cyan-100/80 via-transparent to-emerald-100/80"
                      }`}
                    />

                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div
                        className={`rounded-xl p-2.5 ${
                          selectedMethod === method.id
                            ? "bg-cyan-500 text-white"
                            : isDarkMode
                              ? "bg-slate-700 text-slate-300"
                              : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        <method.icon size={20} />
                      </div>

                      <span className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>
                        {t("topup_method_fee", "Fee")}: {method.fee > 0 ? `${method.fee}%` : t("topup_free_fee", "Free")}
                      </span>

                      {selectedMethod === method.id && (
                        <div className="rounded-full bg-emerald-500 p-1 text-white">
                          <Check size={14} />
                        </div>
                      )}
                    </div>

                    <h3 className={`relative z-[1] font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{method.name}</h3>
                    <p className={`relative z-[1] text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{method.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`rounded-3xl border p-6 shadow-[0_20px_56px_-28px_rgba(15,23,42,0.45)] ${
                isDarkMode ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white/95"
              }`}
            >
              <h2 className={`mb-5 text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {t("topup_amount_title", "Choose top-up amount")}
              </h2>

              <p className={`mb-3 text-xs uppercase tracking-[0.2em] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                {t("topup_quick_pick", "Quick picks")}
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {topUpPrices.map((price, index) => (
                  <motion.button
                    key={price}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.03 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectSuggestedAmount(price)}
                    className={`rounded-2xl border-2 p-3 text-sm font-semibold transition sm:text-base ${
                      selectedAmount === price
                        ? isDarkMode
                          ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                          : "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : isDarkMode
                          ? "border-slate-700 bg-slate-800/70 text-slate-100 hover:border-slate-500"
                          : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    {formatCurrency(price)}
                  </motion.button>
                ))}
              </div>

              <div
                className={`mt-5 rounded-2xl border p-4 ${
                  isDarkMode ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-slate-50"
                }`}
              >
                <label className={`mb-2 block text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                  {t("topup_custom_amount_label", "Or enter a custom amount (VND)")}
                </label>

                <input
                  type="number"
                  min={0}
                  value={customAmountInput}
                  onChange={(event) => onCustomAmountChange(event.target.value)}
                  placeholder={t("topup_example", "Example: 750000")}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 ${
                    isDarkMode
                      ? "border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                      : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"
                  }`}
                />

                {selectedAmount > 0 && (
                  <p className={`mt-2 text-sm font-semibold ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}>
                    {formatCurrency(selectedAmount)}
                  </p>
                )}

                <p className={`mt-2 text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  {t("topup_security_note", "Your transaction is encrypted and issued with an instant receipt.")}
                </p>
              </div>
            </motion.div>
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.16 }}
            className="space-y-6 xl:sticky xl:top-8"
          >
            <div
              className={`overflow-hidden rounded-3xl border p-5 sm:p-6 ${
                isDarkMode
                  ? "border-cyan-500/35 bg-gradient-to-br from-cyan-500/12 via-slate-900/78 to-emerald-500/10"
                  : "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-emerald-50"
              } shadow-[0_20px_56px_-28px_rgba(15,23,42,0.45)]`}
            >
              <h3 className={`mb-4 text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {t("topup_receipt_title", "Live receipt")}
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>{t("topup_method_label", "Method")}</span>
                  <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                    {methodById.get(selectedMethod)?.name ?? t("common_unknown", "Unknown")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>{t("topup_amount_label", "Amount")}</span>
                  <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{formatCurrency(selectedAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>{t("topup_method_fee", "Fee")}</span>
                  <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{t("topup_free_fee", "Free")}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>{t("topup_arrival_time", "Estimated arrival")}</span>
                  <span className={`font-semibold ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}>
                    {t("topup_arrival_instant", "Instant")}
                  </span>
                </div>

                <div className={`mt-3 flex items-center justify-between border-t pt-3 text-base font-bold ${isDarkMode ? "border-slate-700" : "border-slate-300"}`}>
                  <span>{t("topup_total", "Total")}</span>
                  <span className="text-emerald-500">{formatCurrency(selectedAmount)}</span>
                </div>
              </div>

              <button
                onClick={handleTopUp}
                disabled={isProcessing || selectedAmount <= 0}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-bold text-white transition ${
                  isProcessing || selectedAmount <= 0
                    ? "cursor-not-allowed bg-slate-400"
                    : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:shadow-[0_16px_38px_-22px_rgba(16,185,129,0.75)]"
                }`}
              >
                {isProcessing ? <Clock3 size={18} className="animate-pulse" /> : <CircleDollarSign size={18} />}
                {isProcessing ? t("topup_processing", "Processing...") : t("topup_submit", "Top up now")}
              </button>

              <p className={`mt-3 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                {t("topup_security_desc", "Encrypted checkout. Auto-generated invoice right after payment confirmation.")}
              </p>
            </div>

            <div
              className={`rounded-3xl border p-5 sm:p-6 ${
                isDarkMode ? "border-slate-700 bg-slate-900/75" : "border-slate-200 bg-white/95"
              } shadow-[0_20px_56px_-28px_rgba(15,23,42,0.45)]`}
            >
              <div className="mb-5 flex items-center gap-2">
                <Wallet2 size={18} className={isDarkMode ? "text-cyan-300" : "text-cyan-600"} />
                <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {t("topup_history_title", "Top-up history")}
                </h3>
              </div>

              <div className="relative">
                {topUpHistory.length > 0 && (
                  <div
                    className={`absolute bottom-2 left-[10px] top-2 w-px ${
                      isDarkMode ? "bg-slate-700" : "bg-slate-200"
                    }`}
                  />
                )}

                <div className="space-y-3">
                  {topUpHistory.length === 0 ? (
                    <p className={`rounded-xl py-8 text-center text-sm ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                      {t("topup_history_empty", "No top-up history yet")}
                    </p>
                  ) : (
                    topUpHistory.map((history, index) => {
                      const method = methodById.get(history.methodId)
                      return (
                        <motion.div
                          key={history.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.06 + index * 0.03 }}
                          className={`relative flex gap-3 rounded-2xl border p-3.5 ${
                            isDarkMode ? "border-slate-700 bg-slate-800/80" : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <span
                            className={`mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full ${
                              history.status === "completed"
                                ? "bg-emerald-500"
                                : history.status === "pending"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div>
                                <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                                  {formatCurrency(history.amount)}
                                </p>
                                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                                  {method?.name ?? t("common_unknown", "Unknown")}
                                </p>
                              </div>

                              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusColor(history.status)}`}>
                                {getStatusText(history.status)}
                              </span>
                            </div>

                            <p className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>{formatDate(history.date)}</p>
                            <p className={`mt-1 text-xs ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                              {t("topup_transaction_id", "Transaction ID")}: {history.transactionId}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  )
}
