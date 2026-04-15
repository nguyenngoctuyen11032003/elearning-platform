"use client"

import { useEffect, useMemo, useState, use } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/language-context"

export default function CertificateViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const autoPrint = searchParams.get("print") === "1"

  const viewUrl = useMemo(() => `/certificate-print/${id}`, [id])
  const printUrl = useMemo(() => `/certificate-print/${id}?print=1`, [id])
  const [iframeLoading, setIframeLoading] = useState(true)

  useEffect(() => {
    if (autoPrint) {
      window.location.replace(printUrl)
    }
  }, [autoPrint, printUrl])

  useEffect(() => {
    setIframeLoading(true)
  }, [viewUrl])

  if (autoPrint) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          <span>{t("cert_print_opening", "Đang mở chế độ in chứng chỉ...")}</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="print:hidden flex items-center justify-between p-4 bg-background border-b border-border">
        <Link href="/certificates" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
          <span>{t("cert_back_list", "Quay lại danh sách")}</span>
        </Link>
        <Link href={printUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
          <Printer size={18} />
          {t("cert_print_or_download", "In / Tải xuống PDF")}
        </Link>
      </div>

      <div className="relative bg-muted/20 p-3 md:p-6">
        {iframeLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <Loader2 size={16} className="animate-spin" />
              <span>{t("cert_loading_certificate", "Đang tải chứng chỉ...")}</span>
            </div>
          </div>
        )}

        <iframe
          src={viewUrl}
          title={t("cert_view_title", "Xem chứng chỉ")}
          className="h-[calc(100vh-120px)] w-full rounded-xl border border-border bg-white"
          onLoad={() => setIframeLoading(false)}
        />
      </div>
    </>
  )
}
