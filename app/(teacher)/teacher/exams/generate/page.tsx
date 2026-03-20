"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authFetch } from "@/lib/authfetch"
import { CheckCircle, Clock, FileText, Loader2, MoreVertical, Pencil, Plus, Search, ShieldCheck, Trash2, XCircle } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

type Exam = {
  id: string
  title: string
  courseId: string
  courseName?: string
  type: "practice" | "official"
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt?: string
  questions?: any
  questionsCount?: number
  attemptCount?: number
  timeLimit?: number
}

const normalizeList = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data
  return []
}

const parseQuestionsCount = (value: any): number => {
  let data = value
  while (typeof data === "string") {
    try {
      data = JSON.parse(data)
    } catch {
      break
    }
  }
  if (Array.isArray(data)) return data.length
  return Number(data?.length) || 0
}

export default function TeacherExamsListPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true)
        // Use extracted exams only (đề thi đã cắt từ ngân hàng)
        const res = await authFetch("/extracted-exams/my")
        if (!res.ok) {
          setExams([])
          return
        }
        const payload = await res.json().catch(() => [])
        const list = normalizeList<Exam>(payload).map((item: any) => ({
          ...item,
          courseName: item.course?.title || item.courseName,
          type: String(item.type || "practice").toLowerCase() as Exam["type"],
          status: String(item.status || "draft").toLowerCase() as Exam["status"],
          questionsCount: item.questionsCount || parseQuestionsCount(item.questions),
          attemptCount: item.attemptCount || 0,
        }))
        setExams(list)
      } catch {
        setExams([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchExams()
  }, [])

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest("[data-exam-menu]")) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    return () => document.removeEventListener("mousedown", closeOnOutsideClick)
  }, [])

  const handleEdit = (examId: string) => {
    setOpenMenuId(null)
    router.push(`/teacher/exams/generate/create?editId=${examId}`)
  }

  const handleMenuToggle = (examId: string, buttonElement: HTMLButtonElement) => {
    if (openMenuId === examId) {
      setOpenMenuId(null)
    } else {
      const rect = buttonElement.getBoundingClientRect()
      setMenuPos({
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right,
      })
      setOpenMenuId(examId)
    }
  }

  const handleDelete = async (examId: string, examTitle: string) => {
    setOpenMenuId(null)
    const ok = window.confirm(t("tch_exg_confirm_del", `Bạn có chắc muốn xóa đề thi "${examTitle}"?`))
    if (!ok) return

    try {
      const response = await authFetch(`/extracted-exams/${examId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(t("tch_exg_del_fail", "Xóa đề thi thất bại"))
      }

      setExams((prev) => prev.filter((item) => item.id !== examId))
    } catch {
      window.alert(t("tch_exg_del_error", "Không thể xóa đề thi"))
    }
  }

  const filtered = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch = exam.title.toLowerCase().includes(search.toLowerCase()) ||
        (exam.courseName || "").toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || exam.status === statusFilter
      const matchesType = typeFilter === "all" || exam.type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [exams, search, statusFilter, typeFilter])

  const stats = useMemo(() => {
    const total = exams.length
    const practice = exams.filter((e) => e.type === "practice").length
    const official = exams.filter((e) => e.type === "official").length
    const draft = exams.filter((e) => e.status === "draft").length
    const pending = exams.filter((e) => e.status === "pending").length
    const approved = exams.filter((e) => e.status === "approved").length
    const rejected = exams.filter((e) => e.status === "rejected").length
    return { total, practice, official, draft, pending, approved, rejected }
  }, [exams])

  const StatusBadge = ({ status }: { status: Exam["status"] }) => {
    const map = {
      draft: { label: t("tch_exg_draft", "Nháp"), className: "bg-gray-500/10 text-gray-500" },
      pending: { label: t("tch_exg_pending", "Chờ duyệt"), className: "bg-amber-500/10 text-amber-600" },
      approved: { label: t("tch_exg_approved", "Đã duyệt"), className: "bg-green-500/10 text-green-600" },
      rejected: { label: t("tch_exg_rejected", "Từ chối"), className: "bg-red-500/10 text-red-600" },
    } as const
    const item = map[status]
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.className}`}>{item.label}</span>
  }

  const TypeBadge = ({ type }: { type: Exam["type"] }) => {
    const map = {
      practice: { label: t("tch_exg_practice", "Thi thử"), className: "bg-blue-500/10 text-blue-600" },
      official: { label: t("tch_exg_official", "Thi thật"), className: "bg-purple-500/10 text-purple-600" },
    } as const
    const item = map[type]
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.className}`}>{item.label}</span>
  }

  const cards = [
    { title: t("tch_exg_total", "Tổng đề thi"), value: stats.total, icon: FileText, accent: "text-primary" },
    { title: t("tch_exg_practice", "Thi thử"), value: stats.practice, icon: Clock, accent: "text-blue-500" },
    { title: t("tch_exg_official", "Thi thật"), value: stats.official, icon: ShieldCheck, accent: "text-purple-500" },
    { title: t("tch_exg_approved", "Đã duyệt"), value: stats.approved, icon: CheckCircle, accent: "text-green-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("tch_exg_title", "Đề thi")}</h1>
          <p className="text-sm text-muted-foreground">{t("tch_exg_subtitle", "Quản lý đề thi đã tạo và sinh đề mới từ ngân hàng")}</p>
        </div>
        <button
          onClick={() => router.push("/teacher/exams/generate/create")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
        >
          <Plus size={16} /> {t("tch_exg_create", "Tạo đề thi")}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl border bg-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <card.icon size={18} className={card.accent} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-semibold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg w-full md:w-80 bg-background">
            <Search size={16} className="text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("tch_exg_search", "Tìm đề thi theo tiêu đề hoặc khóa học")}
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-1/2 md:w-auto"
            >
              <option value="all">{t("tch_exg_all_status", "Tất cả trạng thái")}</option>
              <option value="approved">{t("tch_exg_approved", "Đã duyệt")}</option>
              <option value="pending">{t("tch_exg_pending", "Chờ duyệt")}</option>
              <option value="draft">{t("tch_exg_draft", "Nháp")}</option>
              <option value="rejected">{t("tch_exg_rejected", "Từ chối")}</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-1/2 md:w-auto"
            >
              <option value="all">{t("tch_exg_all_type", "Tất cả loại")}</option>
              <option value="practice">{t("tch_exg_practice", "Thi thử")}</option>
              <option value="official">{t("tch_exg_official", "Thi thật")}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-3">{t("tch_exg_th_title", "Tiêu đề")}</th>
                <th className="py-2 pr-3">{t("tch_exg_th_course", "Khóa học")}</th>
                <th className="py-2 pr-3">{t("tch_exg_th_type", "Loại")}</th>
                <th className="py-2 pr-3">{t("tch_exg_th_status", "Trạng thái")}</th>
                <th className="py-2 pr-3">{t("tch_exg_th_questions", "Câu hỏi")}</th>
                <th className="py-2 pr-3">{t("tch_exg_th_attempts", "Lượt thi")}</th>
                <th className="py-2 pr-3">{t("tch_exg_th_action", "Thao tác")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground"><Loader2 className="animate-spin inline-block mr-2" size={16} /> {t("tch_exg_loading", "Đang tải...")}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">{t("tch_exg_empty", "Chưa có đề thi nào")}</td></tr>
              ) : (
                filtered.map((exam) => (
                  <tr key={exam.id} className="border-t">
                    <td className="py-3 pr-3 font-medium text-foreground">{exam.title}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{exam.courseName || "—"}</td>
                    <td className="py-3 pr-3"><TypeBadge type={exam.type} /></td>
                    <td className="py-3 pr-3"><StatusBadge status={exam.status} /></td>
                    <td className="py-3 pr-3">{exam.questionsCount ?? "—"}</td>
                    <td className="py-3 pr-3">{exam.attemptCount ?? 0}</td>
                    <td className="py-3 pr-3">
                      <div data-exam-menu>
                        <button
                          ref={menuButtonRef}
                          onClick={(e) => handleMenuToggle(exam.id, e.currentTarget)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border hover:bg-secondary"
                          title={t("tch_exg_th_action", "Thao tác")}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openMenuId && (
        <div
          className="fixed z-[9999] min-w-44 rounded-lg border bg-card shadow-lg"
          style={{
            top: `${menuPos.top}px`,
            right: `${menuPos.right}px`,
          }}
          data-exam-menu
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              const exam = exams.find((e) => e.id === openMenuId)
              if (exam) handleEdit(exam.id)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary rounded-t-lg"
          >
            <Pencil size={14} />
            {t("tch_exg_edit", "Sửa cấu hình đề thi")}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const exam = exams.find((e) => e.id === openMenuId)
              if (exam) handleDelete(exam.id, exam.title)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary text-red-500 rounded-b-lg"
          >
            <Trash2 size={14} />
            {t("tch_exg_delete", "Xóa đề thi")}
          </button>
        </div>
      )}
    </div>
  )
}
