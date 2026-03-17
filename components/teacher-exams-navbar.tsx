"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Plus, ClipboardList, Users } from "lucide-react"
import { authFetch } from "@/lib/authfetch"

type ExamLike = {
  attemptCount?: number
}

const normalizeList = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data
  return []
}

export function TeacherExamsNavbar() {
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

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900/60 px-4 py-3">
      <Link href="/teacher/exams" className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
          <ClipboardList size={18} className="text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground dark:text-white">Ngân hàng đề thi</div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-slate-400">
            <span>Đã có: {totalText}</span>
            <span className="inline-flex items-center gap-1">
              <Users size={12} /> Đã sử dụng: {usedText}
            </span>
          </div>
        </div>
      </Link>

      <Link
        href="/teacher/exams/create"
        className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium transition-colors hover:bg-primary/90"
      >
        <Plus size={16} />
        Tạo đề thi
      </Link>
    </div>
  )
}
