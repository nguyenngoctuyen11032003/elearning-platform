import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { formatCurrencyByLanguage } from "@/lib/format"

type PageProps = {
  searchParams?: {
    amount?: string
    transactionCode?: string
    paymentId?: string
  }
}

export default function TopUpSuccessPage({ searchParams }: PageProps) {
  const amount = Number(searchParams?.amount || 0)
  const transactionCode = searchParams?.transactionCode || "-"
  const paymentId = searchParams?.paymentId || "-"

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center dark:border-emerald-900/70 dark:bg-emerald-950/20">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <CheckCircle2 size={24} />
        </div>
        <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">Nạp tiền thành công</h1>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
          Bạn đã nạp thành công <span className="font-bold">{formatCurrencyByLanguage(amount, "vi")}</span> vào tài khoản.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border bg-card p-5 text-sm">
        <p><span className="font-semibold">Mã giao dịch:</span> {paymentId}</p>
        <p className="mt-1"><span className="font-semibold">Mã tham chiếu:</span> {transactionCode}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/top-up" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">
          Quay lại nạp ví
        </Link>
        <Link href="/payment-history" className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-semibold hover:bg-secondary">
          Xem lịch sử thanh toán
        </Link>
      </div>
    </div>
  )
}
