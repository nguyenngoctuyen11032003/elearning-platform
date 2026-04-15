"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CreditCard, CircleHelp, Wallet } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"
import { UniversalSelect } from "@/components/ui/universal-select"

type MethodType = "bank_card" | "e_wallet"

const onlyDigits = (value: string) => value.replace(/\D/g, "")

const formatCardNumber = (value: string) => {
  const digits = onlyDigits(value).slice(0, 19)
  const groups = digits.match(/.{1,4}/g)
  return groups ? groups.join(" ") : ""
}

const formatExpiry = (value: string) => {
  const digits = onlyDigits(value).slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

const detectCardBrand = (value: string): "visa" | "mastercard" | "unknown" => {
  const digits = onlyDigits(value)
  if (/^4/.test(digits)) return "visa"
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard"
  return "unknown"
}

function NewPaymentMethodPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const planId = searchParams.get("planId") || ""
  const initialType = (searchParams.get("type") as MethodType) || "bank_card"

  const [type, setType] = useState<MethodType>(initialType)
  const [submitting, setSubmitting] = useState(false)

  const [cardHolderName, setCardHolderName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cvv, setCvv] = useState("")

  const [provider, setProvider] = useState<"momo" | "zalopay">("momo")
  const [walletPhone, setWalletPhone] = useState("")

  const cardBrand = useMemo(() => detectCardBrand(cardNumber), [cardNumber])
  const activeStep = type ? 2 : 1

  const backToCheckoutLink = useMemo(() => {
    if (planId) return `/teacher/wallet-membership/checkout?planId=${encodeURIComponent(planId)}`
    return "/teacher/wallet-membership/checkout"
  }, [planId])

  const billingSettingsLink = "/teacher/wallet-membership"

  const saveMethod = async () => {
    setSubmitting(true)
    try {
      if (type === "bank_card") {
        await apiClient.createTeacherPaymentMethod({
          type,
          cardHolderName,
          cardNumber: onlyDigits(cardNumber),
          cardExpiry,
          cvv: onlyDigits(cvv),
          isDefault: true,
        })
      } else {
        await apiClient.createTeacherPaymentMethod({
          type,
          provider,
          walletPhone,
          isDefault: true,
        })
      }

      toast.success(t("payment_add_success", "Đã thêm phương thức thanh toán thành công."))
      router.push(backToCheckoutLink)
    } catch (error: any) {
      toast.error(error?.message || t("payment_save_failed", "Không thể lưu phương thức thanh toán"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 rounded-3xl bg-[#020617] p-8 text-slate-200">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-white">{t("payment_add_method", "Thêm phương thức thanh toán")}</h1>
        <Link
          href={backToCheckoutLink}
          className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          {t("payment_back_to_checkout", "Quay lại thanh toán")}
        </Link>
      </div>

      <div
        className={`rounded-2xl border p-7 transition-all duration-300 ${
          activeStep === 1
            ? "border-blue-500 bg-[rgba(59,130,246,0.08)]"
            : "border-[#1e293b] bg-[#0f172a] opacity-60"
        }`}
      >
        <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
          <span className={`h-2.5 w-2.5 rounded-full ${activeStep === 1 ? "bg-blue-400" : "bg-slate-500"}`} />
          1. {t("payment_choose_type", "Chọn phương thức")}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setType("bank_card")}
            className={`group rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/70 hover:shadow-[0_8px_24px_rgba(59,130,246,0.16)] ${
              type === "bank_card"
                ? "border-blue-500 bg-[rgba(59,130,246,0.08)]"
                : "border-transparent bg-[#111827]"
            }`}
          >
            <div className="mb-3 inline-flex rounded-xl bg-slate-800 p-3 text-blue-300 transition group-hover:bg-slate-700">
              <CreditCard size={24} />
            </div>
            <p className="text-2xl font-semibold text-slate-100">{t("payment_method_bank_card", "Thẻ ngân hàng")}</p>
            <p className="mt-1 text-sm text-slate-400">{t("payment_card_hint_short", "Thanh toán bằng Visa / MasterCard")}</p>
          </button>

          <button
            type="button"
            onClick={() => setType("e_wallet")}
            className={`group rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/70 hover:shadow-[0_8px_24px_rgba(59,130,246,0.16)] ${
              type === "e_wallet"
                ? "border-blue-500 bg-[rgba(59,130,246,0.08)]"
                : "border-transparent bg-[#111827]"
            }`}
          >
            <div className="mb-3 inline-flex rounded-xl bg-slate-800 p-3 text-violet-300 transition group-hover:bg-slate-700">
              <Wallet size={24} />
            </div>
            <p className="text-2xl font-semibold text-slate-100">{t("payment_method_ewallet", "Ví điện tử")}</p>
            <p className="mt-1 text-sm text-slate-400">{t("payment_wallet_hint_short", "MoMo, ZaloPay")}</p>
          </button>
        </div>
      </div>

      {type ? (
        <div
          className={`rounded-2xl border p-7 transition-all duration-300 ${
            activeStep === 2
              ? "border-blue-500 bg-[rgba(59,130,246,0.08)]"
              : "border-[#1e293b] bg-[#0f172a] opacity-60"
          }`}
        >
          <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            <span className={`h-2.5 w-2.5 rounded-full ${activeStep === 2 ? "bg-blue-400" : "bg-slate-500"}`} />
            2. {t("payment_enter_details", "Nhập thông tin")}
          </p>

          <div className="mx-auto w-full max-w-[600px] space-y-4 rounded-2xl border border-[#1e293b] bg-[#111827] p-6">
            {type === "bank_card" ? (
              <>
                <div>
                  <label className="mb-1 block text-sm text-slate-400">{t("card_holder_name", "Tên chủ thẻ")}</label>
                  <input
                    className="h-11 w-full rounded-[10px] border border-white/10 bg-[#0f172a] px-[14px] py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="block text-sm text-slate-400">{t("card_number", "Số thẻ")}</label>
                    <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                      {cardBrand === "visa" ? "Visa" : cardBrand === "mastercard" ? "MasterCard" : t("card_brand_unknown", "Card")}
                    </span>
                  </div>
                  <input
                    className="h-11 w-full rounded-[10px] border border-white/10 bg-[#0f172a] px-[14px] py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4111 1111 1111 1111"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-slate-400">{t("card_expiry", "Ngày hết hạn (MM/YY)")}</label>
                    <input
                      className="h-11 w-full rounded-[10px] border border-white/10 bg-[#0f172a] px-[14px] py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="12/30"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-1 text-slate-400">
                      <label className="block text-sm">{t("card_cvv", "CVV")}</label>
                      <span className="group relative inline-flex items-center">
                        <CircleHelp size={14} className="text-slate-500" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-100 opacity-0 shadow transition group-hover:opacity-100">
                          {t("card_cvv_tooltip", "3 số sau thẻ")}
                        </span>
                      </span>
                    </div>
                    <input
                      className="h-11 w-full rounded-[10px] border border-white/10 bg-[#0f172a] px-[14px] py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                      value={cvv}
                      onChange={(e) => setCvv(onlyDigits(e.target.value).slice(0, 4))}
                      placeholder="123"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-sm text-slate-400">{t("payment_choose_provider", "Chọn ví")}</label>
                  <UniversalSelect
                    className="h-11 w-full rounded-[10px] border border-white/10 bg-[#0f172a] px-[14px] py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as "momo" | "zalopay")}
                    contentClassName="border-blue-500/30 bg-slate-950/92 text-slate-100 backdrop-blur-2xl shadow-[0_20px_50px_rgba(2,6,23,0.75)]"
                    portalled={true}
                  >
                    <option value="momo">{t("payment_provider_momo", "MoMo")}</option>
                    <option value="zalopay">{t("payment_provider_zalopay", "ZaloPay")}</option>
                  </UniversalSelect>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-slate-400">{t("payment_wallet_phone", "Số điện thoại ví")}</label>
                  <input
                    className="h-11 w-full rounded-[10px] border border-white/10 bg-[#0f172a] px-[14px] py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                    placeholder={t("payment_wallet_phone_placeholder", "090xxxxxxx")}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {type ? (
        <div className="flex items-center gap-3">
          <button
            onClick={saveMethod}
            disabled={submitting}
            className="h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 text-base font-semibold text-white transition hover:-translate-y-px hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? t("common_saving", "Đang lưu...") : t("payment_add_method_cta", "Thêm phương thức thanh toán")}
          </button>
          <Link
            href={billingSettingsLink}
            className="inline-flex h-12 min-w-[96px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 px-6 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            {t("common_cancel", "Hủy")}
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export default function NewPaymentMethodPage() {
  const { t } = useLanguage()

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">{t("payment_method_loading", "Đang tải biểu mẫu phương thức thanh toán...")}</div>
        </div>
      }
    >
      <NewPaymentMethodPageContent />
    </Suspense>
  )
}
