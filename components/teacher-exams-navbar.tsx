"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Plus, ClipboardList, Users } from "lucide-react"
import { authFetch } from "@/lib/authfetch"
import { useLanguage } from "@/lib/i18n/language-context"
import { cn } from "@/lib/utils"

type ExamLike = {
  attemptCount?: number
}

type TeacherExamsNavbarProps = {
  showCreateButton?: boolean
  variant?: "card" | "ghost"
  tone?: "default" | "light"
  className?: string
}

const normalizeList = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data
  return []
}

export function TeacherExamsNavbar({
  showCreateButton = true,
  variant = "card",
  tone = "default",
  className,
}: TeacherExamsNavbarProps) {
  const { t } = useLanguage()
  const [total, setTotal] = useState<number | null>(null)
  const [used, setUsed] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const response = await authFetch("/exams/my-exams")
        if (!response.ok) return
        const data = await response.json().catch(() => null)
        const list = normalizeList<ExamLike>(data)
        const usedCount = list.filter((e) => (e?.attemptCount ?? 0) > 0).length

        if (cancelled) return
        setTotal(list.length)
        setUsed(usedCount)
      } catch {
        // ignore
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const totalText = useMemo(() => (total === null ? "—" : String(total)), [total])
  const usedText = useMemo(() => (used === null ? "—" : String(used)), [used])

  const isLight = tone === "light"
  const titleClass = isLight ? "text-white" : "text-foreground dark:text-white"
  const metaClass = isLight ? "text-white/80" : "text-muted-foreground dark:text-slate-400"
  const iconClass = isLight ? "text-white" : "text-primary"

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        variant === "card"
          ? "rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900/60 px-4 py-3"
          : "",
        className,
      )}
    >
      <Link href="/teacher/exams" className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          isLight ? "bg-white/15" : "bg-primary/10 dark:bg-primary/20",
        )}>
          <ClipboardList size={18} className={iconClass} />
        </div>
        <div>
          <div className={cn("text-sm font-semibold", titleClass)}>{t("exam_bank", "Ngân hàng đề thi")}</div>
          <div className={cn("flex items-center gap-3 text-xs", metaClass)}>
            <span>{t("exam_total_count", "Đã có")}: {totalText}</span>
            <span className="inline-flex items-center gap-1">
              <Users size={12} /> {t("exam_used_count", "Đã sử dụng")}: {usedText}
            </span>
          </div>
        </div>
      </Link>

      {showCreateButton && (
        <Link
          href="/teacher/exams/create"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium transition-colors hover:bg-primary/90"
        >
          <Plus size={16} />
          {t("exam_create", "Tạo đề thi")}
        </Link>
      )}
    </div>
  )
}
