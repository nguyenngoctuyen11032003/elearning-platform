"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CreditCard, Wallet } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"
import { UniversalSelect } from "@/components/ui/universal-select"

type MethodType = "bank_card" | "e_wallet"

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

  const backToCheckoutLink = useMemo(() => {
    if (planId) return `/teacher/settings/billing/checkout?planId=${encodeURIComponent(planId)}`
    return "/teacher/settings/billing/checkout"
  }, [planId])

  const billingSettingsLink = "/teacher/settings?tab=billing"

  const saveMethod = async () => {
    setSubmitting(true)
    try {
      if (type === "bank_card") {
        await apiClient.createTeacherPaymentMethod({
          type,
          cardHolderName,
          cardNumber,
          cardExpiry,
          cvv,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("payment_add_method", "Thêm phương thức thanh toán")}</h1>
        <Link href={backToCheckoutLink} className="rounded-lg border border-border px-4 py-2 text-sm">
          {t("payment_back_to_checkout", "Quay lại thanh toán")}
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setType("bank_card")}
          className={`rounded-xl border p-4 text-left ${type === "bank_card" ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <div className="mb-2 inline-flex rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
            <CreditCard size={18} />
          </div>
          <p className="font-semibold">{t("payment_method_bank_card", "Thẻ ngân hàng")}</p>
          <p className="text-sm text-muted-foreground">{t("payment_card_hint", "Nhập thông tin thẻ và CVV để lưu phương thức thanh toán.")}</p>
        </button>

        <button
          type="button"
          onClick={() => setType("e_wallet")}
          className={`rounded-xl border p-4 text-left ${type === "e_wallet" ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <div className="mb-2 inline-flex rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
            <Wallet size={18} />
          </div>
          <p className="font-semibold">{t("payment_method_ewallet", "Ví điện tử")}</p>
          <p className="text-sm text-muted-foreground">{t("payment_wallet_hint", "Liên kết ví MoMo hoặc ZaloPay để thanh toán nhanh.")}</p>
        </button>
      </div>

      {type === "bank_card" ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">{t("card_holder_name", "Tên chủ thẻ")}</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">{t("card_number", "Số thẻ")}</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4111 1111 1111 1111"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t("card_expiry", "Ngày hết hạn (MM/YY)")}</label>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                placeholder="12/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t("card_cvv", "CVV")}</label>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">{t("payment_choose_provider", "Chọn ví")}</label>
            <UniversalSelect
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={provider}
              onChange={(e) => setProvider(e.target.value as "momo" | "zalopay")}
            >
              <option value="momo">{t("payment_provider_momo", "MoMo")}</option>
              <option value="zalopay">{t("payment_provider_zalopay", "ZaloPay")}</option>
            </UniversalSelect>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">{t("payment_wallet_phone", "Số điện thoại ví")}</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={walletPhone}
              onChange={(e) => setWalletPhone(e.target.value)}
              placeholder={t("payment_wallet_phone_placeholder", "090xxxxxxx")}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={saveMethod}
          disabled={submitting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? t("common_saving", "Đang lưu...") : t("common_save", "Lưu")}
        </button>
        <Link href={billingSettingsLink} className="rounded-lg border border-border px-4 py-2 text-sm">
          {t("common_cancel", "Hủy")}
        </Link>
      </div>
    </div>
  )
}

export default function NewPaymentMethodPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">Đang tải biểu mẫu phương thức thanh toán...</div>
        </div>
      }
    >
      <NewPaymentMethodPageContent />
    </Suspense>
  )
}
