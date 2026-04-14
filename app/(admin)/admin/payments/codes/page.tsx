"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, CalendarDays, CircleDollarSign, Pencil, Plus, Power, RefreshCw, Search, TicketPercent, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"
import { UniversalSelect } from "@/components/ui/universal-select"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CouponItem {
  id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  usageLimit?: number
  usedCount?: number
  status?: "active" | "inactive" | "expired"
  minPurchase?: number
  maxDiscount?: number
  validFrom?: string
  validUntil?: string
  createdAt?: string
  course?: { id: string; title: string }
  courseId?: string
  applyScope?: "all" | "course" | "teacher" | "category"
  teacher?: { id: string; name: string }
  teacherId?: string
  category?: { id: string; name: string }
  categoryId?: string
}

interface CourseOption {
  id: string
  title: string
  teacherId?: string
  teacherName?: string
  categoryId?: string
  categoryName?: string
}

interface TeacherOption {
  id: string
  name: string
}

interface CategoryOption {
  id: string
  name: string
}

type CouponFormData = {
  code: string
  type: "fixed" | "percentage"
  value: string
  usageLimit: string
  minPurchase: string
  maxDiscount: string
  applyScope: "all" | "course" | "teacher" | "category"
  courseId: string
  teacherId: string
  categoryId: string
  validFrom: string
  validUntil: string
  status: "active" | "inactive" | "expired"
}

const initialForm: CouponFormData = {
  code: "",
  type: "fixed",
  value: "",
  usageLimit: "",
  minPurchase: "",
  maxDiscount: "",
  applyScope: "all",
  courseId: "",
  teacherId: "",
  categoryId: "",
  validFrom: "",
  validUntil: "",
  status: "active",
}

const toInputDateTime = (iso?: string) => {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

const toIsoDateTime = (inputValue: string) => {
  if (!inputValue) return undefined
  const date = new Date(inputValue)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

const statusClasses: Record<"active" | "inactive" | "expired", string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-amber-100 text-amber-700",
  expired: "bg-slate-200 text-slate-700",
}

const scopeBadgeClasses: Record<"all" | "course" | "teacher" | "category", string> = {
  all: "bg-blue-100 text-blue-700",
  course: "bg-purple-100 text-purple-700",
  teacher: "bg-emerald-100 text-emerald-700",
  category: "bg-orange-100 text-orange-700",
}

export default function AdminPaymentCodesPage() {
  const { t } = useLanguage()
  const [codes, setCodes] = useState<CouponItem[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CouponItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "expired">("all")
  const [sortBy, setSortBy] = useState<"createdAt" | "usedCount" | "value">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [previewCourseId, setPreviewCourseId] = useState("")

  const [form, setForm] = useState<CouponFormData>(initialForm)

  const isEditing = Boolean(editingId)

  const scopeFilteredCourses = useMemo(() => {
    if (form.applyScope === "teacher") {
      if (!form.teacherId) return []
      return courses.filter((course) => course.teacherId === form.teacherId)
    }

    if (form.applyScope === "category") {
      if (!form.categoryId) return []
      return courses.filter((course) => course.categoryId === form.categoryId)
    }

    return courses
  }, [form.applyScope, form.teacherId, form.categoryId, courses])

  const filteredCodes = useMemo(() => {
    return codes.filter((item) => {
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter
      const query = searchQuery.trim().toLowerCase()
      const matchesQuery =
        query.length === 0
          ? true
          : item.code.toLowerCase().includes(query) ||
            String(item.course?.title || "").toLowerCase().includes(query) ||
            String(item.teacher?.name || "").toLowerCase().includes(query) ||
            String(item.category?.name || "").toLowerCase().includes(query)
      return matchesStatus && matchesQuery
    })
  }, [codes, searchQuery, statusFilter])

  const sortedCodes = useMemo(() => {
    const list = [...filteredCodes]
    list.sort((a, b) => {
      let aValue = 0
      let bValue = 0
      if (sortBy === "createdAt") {
        aValue = new Date(a.createdAt || "").getTime() || 0
        bValue = new Date(b.createdAt || "").getTime() || 0
      } else if (sortBy === "usedCount") {
        aValue = Number(a.usedCount || 0)
        bValue = Number(b.usedCount || 0)
      } else {
        aValue = Number(a.value || 0)
        bValue = Number(b.value || 0)
      }
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue
    })
    return list
  }, [filteredCodes, sortBy, sortOrder])

  const totalPages = Math.max(1, Math.ceil(sortedCodes.length / pageSize))
  const pagedCodes = useMemo(() => {
    const start = (Math.min(page, totalPages) - 1) * pageSize
    return sortedCodes.slice(start, start + pageSize)
  }, [page, totalPages, pageSize, sortedCodes])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, sortBy, sortOrder, pageSize])

  const inferScope = (item: CouponItem): CouponFormData["applyScope"] => {
    if (item.applyScope) return item.applyScope
    if (item.courseId) return "course"
    if (item.teacherId) return "teacher"
    if (item.categoryId) return "category"
    return "all"
  }

  const getScopeLabel = (item: CouponItem) => {
    const scope = inferScope(item)
    if (scope === "all") return t("adm_code_apply_all", "Ap dung toan he thong")
    if (scope === "course") return item.course?.title || t("adm_code_apply_course", "Theo khoa hoc")
    if (scope === "teacher") return `${t("adm_code_apply_teacher", "Theo giang vien")}: ${item.teacher?.name || "-"}`
    return `${t("adm_code_apply_category", "Theo danh muc")}: ${item.category?.name || "-"}`
  }

  const getScopeTagText = (scope: CouponFormData["applyScope"]) => {
    if (scope === "all") return t("adm_code_apply_all", "Ap dung toan he thong")
    if (scope === "course") return t("adm_code_apply_course", "Theo khoa hoc")
    if (scope === "teacher") return t("adm_code_apply_teacher", "Theo giang vien")
    return t("adm_code_apply_category", "Theo danh muc")
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
    setPreviewCourseId("")
  }

  const buildPayload = () => {
    const code = form.code.trim().toUpperCase()
    const value = Number(form.value)
    const usageLimit = form.usageLimit ? Number(form.usageLimit) : undefined
    const minPurchase = form.minPurchase ? Number(form.minPurchase) : undefined
    const maxDiscount = form.maxDiscount ? Number(form.maxDiscount) : undefined
    const validFrom = toIsoDateTime(form.validFrom)
    const validUntil = toIsoDateTime(form.validUntil)

    if (!code) throw new Error(t("adm_code_enter_code", "Vui long nhap ma"))
    if (!/^[A-Z0-9_-]{4,32}$/.test(code)) throw new Error(t("adm_code_invalid_format", "Ma 4-32 ky tu, chi gom A-Z 0-9 _ -"))
    if (!Number.isFinite(value) || value <= 0) throw new Error(t("adm_code_value_gt0", "Gia tri ma phai lon hon 0"))
    if (form.type === "percentage" && value > 100) throw new Error(t("adm_code_pct_max_100", "Ma giam phan tram khong duoc vuot 100"))
    if (validFrom && validUntil && new Date(validUntil).getTime() <= new Date(validFrom).getTime()) throw new Error(t("adm_code_date_invalid", "Thoi gian ket thuc phai sau thoi gian bat dau"))
    if (form.applyScope === "course" && !form.courseId) throw new Error(t("adm_code_need_course", "Vui long chon khoa hoc"))
    if (form.applyScope === "teacher" && !form.teacherId) throw new Error(t("adm_code_need_teacher", "Vui long chon giang vien"))
    if (form.applyScope === "category" && !form.categoryId) throw new Error(t("adm_code_need_category", "Vui long chon danh muc"))

    return {
      code,
      type: form.type,
      value,
      usageLimit,
      minPurchase,
      maxDiscount: form.type === "percentage" ? maxDiscount : undefined,
      applyScope: form.applyScope,
      courseId: form.applyScope === "course" ? form.courseId : undefined,
      teacherId: form.applyScope === "teacher" ? form.teacherId : undefined,
      categoryId: form.applyScope === "category" ? form.categoryId : undefined,
      validFrom,
      validUntil,
      status: form.status,
    }
  }

  const loadCodes = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const [list, scopeRes] = await Promise.all([
        apiClient.getCoupons(),
        apiClient.getCouponScopeOptions(),
      ])
      setCodes(Array.isArray(list) ? list : [])

      const mappedCourses = Array.isArray(scopeRes?.courses)
        ? scopeRes.courses.map((item: any) => ({
            id: String(item.id || ""),
            title: String(item.title || item.name || ""),
            teacherId: String(item.teacherId || item.teacher?.id || ""),
            teacherName: String(item.teacher?.name || ""),
            categoryId: String(item.categoryId || item.category?.id || ""),
            categoryName: String(item.categoryName || item.category?.name || ""),
          })).filter((item: CourseOption) => item.id && item.title)
        : []

      const mappedTeachers = Array.isArray(scopeRes?.teachers)
        ? scopeRes.teachers
            .map((item: any) => ({
              id: String(item.id || ""),
              name: String(item.name || ""),
            }))
            .filter((item: TeacherOption) => item.id && item.name)
        : []

      const mappedCategories = Array.isArray(scopeRes?.categories)
        ? scopeRes.categories
            .map((item: any) => ({
              id: String(item.id || ""),
              name: String(item.name || ""),
            }))
            .filter((item: CategoryOption) => item.id && item.name)
        : []

      setCourses(mappedCourses)
      setTeachers(mappedTeachers)
      setCategories(mappedCategories)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adm_code_load_fail", "Khong the tai du lieu ma"))
    } finally {
      if (silent) setRefreshing(false)
      else setLoading(false)
    }
  }

  useEffect(() => {
    loadCodes()
  }, [])

  const handleSave = async () => {
    let payload: ReturnType<typeof buildPayload>
    try {
      payload = buildPayload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adm_code_invalid_data", "Du lieu khong hop le"))
      return
    }

    setSaving(true)
    try {
      if (isEditing && editingId) {
        await apiClient.updateCoupon(editingId, payload)
        toast.success(t("adm_code_updated", "Da cap nhat ma"))
      } else {
        const { status, ...createPayload } = payload
        await apiClient.createCoupon(createPayload)
        toast.success(t("adm_code_created", "Da tao ma"))
      }
      resetForm()
      await loadCodes(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adm_code_save_fail", "Khong the luu ma"))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: CouponItem) => {
    setEditingId(item.id)
    setPreviewCourseId("")
    setForm({
      code: item.code || "",
      type: item.type || "fixed",
      value: String(item.value || ""),
      usageLimit: item.usageLimit ? String(item.usageLimit) : "",
      minPurchase: item.minPurchase ? String(item.minPurchase) : "",
      maxDiscount: item.maxDiscount ? String(item.maxDiscount) : "",
      applyScope: inferScope(item),
      courseId: item.courseId || item.course?.id || "",
      teacherId: item.teacherId || item.teacher?.id || "",
      categoryId: item.categoryId || item.category?.id || "",
      validFrom: toInputDateTime(item.validFrom),
      validUntil: toInputDateTime(item.validUntil),
      status: item.status || "active",
    })
  }

  const handleToggleStatus = async (item: CouponItem) => {
    const nextStatus = item.status === "active" ? "inactive" : "active"
    try {
      await apiClient.updateCoupon(item.id, { status: nextStatus })
      toast.success(nextStatus === "active" ? t("adm_code_enabled", "Da bat ma") : t("adm_code_disabled", "Da tat ma"))
      await loadCodes(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adm_code_status_fail", "Khong the doi trang thai"))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    try {
      await apiClient.deleteCoupon(deleteTarget.id)
      toast.success(t("adm_code_deleted", "Da xoa ma"))
      if (editingId === deleteTarget.id) resetForm()
      setDeleteTarget(null)
      await loadCodes(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adm_code_delete_fail", "Khong the xoa ma"))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("adm_code_delete_title", "Xac nhan xoa ma")}</AlertDialogTitle>
            <AlertDialogDescription>{t("adm_code_confirm_delete", "Ban co chac chan muon xoa ma nay? Hanh dong khong the hoan tac.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common_cancel", "Huy")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">{deletingId ? t("common_deleting", "Dang xoa...") : t("common_delete", "Xoa")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("adm_code_title", "Ma thanh toan")}</h1>
          <p className="text-sm text-muted-foreground">{t("adm_code_subtitle", "Quan ly thong minh ma giam gia theo chien dich")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadCodes(true)} disabled={refreshing || loading} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${(refreshing || loading) ? "animate-spin" : ""}`} />
            {t("common_refresh", "Lam moi")}
          </button>
          <Link href="/admin/payments" className="rounded-lg border px-4 py-2 text-sm hover:bg-secondary">{t("adm_code_back", "Quay lai giao dich")}</Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{isEditing ? t("adm_code_edit_title", "Chinh sua ma") : t("adm_code_create_new", "Tao ma moi")}</h2>
          {isEditing && <button onClick={resetForm} className="rounded-lg border px-3 py-2 text-sm hover:bg-secondary">{t("common_cancel", "Huy chinh sua")}</button>}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} placeholder={t("adm_code_ph_example", "VD: THANHTOAN100")} className="rounded-lg border bg-background px-3 py-2" />
          <UniversalSelect value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as "fixed" | "percentage" }))} className="rounded-lg border bg-background px-3 py-2">
            <option value="fixed">{t("adm_code_fixed_vnd", "Giam co dinh")}</option>
            <option value="percentage">{t("adm_code_pct", "Giam theo %")}</option>
          </UniversalSelect>
          <input type="number" min={1} value={form.value} onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))} placeholder={t("adm_code_value", "Gia tri giam")} className="rounded-lg border bg-background px-3 py-2" />

          <UniversalSelect value={form.applyScope} onChange={(e) => {
            setPreviewCourseId("")
            setForm((prev) => ({ ...prev, applyScope: e.target.value as CouponFormData["applyScope"], courseId: "", teacherId: "", categoryId: "" }))
          }} className="rounded-lg border bg-background px-3 py-2">
            <option value="all">{t("adm_code_apply_all", "Ap dung toan he thong")}</option>
            <option value="teacher">{t("adm_code_apply_teacher", "Theo giang vien")}</option>
            <option value="category">{t("adm_code_apply_category", "Theo danh muc")}</option>
            <option value="course">{t("adm_code_apply_course", "Theo khoa hoc")}</option>
          </UniversalSelect>

          {form.applyScope === "course" && <UniversalSelect value={form.courseId} onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value }))} className="rounded-lg border bg-background px-3 py-2"><option value="">{t("adm_code_choose_course", "Chon khoa hoc")}</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</UniversalSelect>}
          {form.applyScope === "teacher" && <UniversalSelect value={form.teacherId} onChange={(e) => {
            setPreviewCourseId("")
            setForm((prev) => ({ ...prev, teacherId: e.target.value }))
          }} className="rounded-lg border bg-background px-3 py-2"><option value="">{t("adm_code_choose_teacher", "Chon giang vien")}</option>{teachers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</UniversalSelect>}
          {form.applyScope === "category" && <UniversalSelect value={form.categoryId} onChange={(e) => {
            setPreviewCourseId("")
            setForm((prev) => ({ ...prev, categoryId: e.target.value }))
          }} className="rounded-lg border bg-background px-3 py-2"><option value="">{t("adm_code_choose_category", "Chon danh muc")}</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</UniversalSelect>}

          {(form.applyScope === "teacher" || form.applyScope === "category") && (
            <UniversalSelect
              value={previewCourseId}
              onChange={(e) => setPreviewCourseId(e.target.value)}
              className="rounded-lg border bg-background px-3 py-2"
              disabled={scopeFilteredCourses.length === 0}
            >
              <option value="">
                {form.applyScope === "teacher"
                  ? t("adm_code_course_filtered_teacher", "Danh sach khoa hoc theo giang vien")
                  : t("adm_code_course_filtered_category", "Danh sach khoa hoc theo danh muc")}
              </option>
              {scopeFilteredCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </UniversalSelect>
          )}

          <input type="number" min={1} value={form.usageLimit} onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value }))} placeholder={t("adm_code_ph_usage", "Gioi han luot dung") } className="rounded-lg border bg-background px-3 py-2" />
          <input type="number" min={0} value={form.minPurchase} onChange={(e) => setForm((prev) => ({ ...prev, minPurchase: e.target.value }))} placeholder={t("adm_code_min_purchase", "Don toi thieu") } className="rounded-lg border bg-background px-3 py-2" />
          <input type="number" min={1} value={form.maxDiscount} disabled={form.type !== "percentage"} onChange={(e) => setForm((prev) => ({ ...prev, maxDiscount: e.target.value }))} placeholder={t("adm_code_max_discount", "Giam toi da") } className="rounded-lg border bg-background px-3 py-2 disabled:opacity-50" />
          <input type="datetime-local" value={form.validFrom} onChange={(e) => setForm((prev) => ({ ...prev, validFrom: e.target.value }))} className="rounded-lg border bg-background px-3 py-2" />
          <input type="datetime-local" value={form.validUntil} onChange={(e) => setForm((prev) => ({ ...prev, validUntil: e.target.value }))} className="rounded-lg border bg-background px-3 py-2" />
          {isEditing && <UniversalSelect value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as CouponFormData["status"] }))} className="rounded-lg border bg-background px-3 py-2"><option value="active">{t("adm_code_status_active", "Dang hoat dong")}</option><option value="inactive">{t("adm_code_status_inactive", "Tam dung")}</option><option value="expired">{t("adm_code_status_expired", "Het han")}</option></UniversalSelect>}
        </div>

        <div className="mt-4">
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 disabled:opacity-60">
            {isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {saving ? t("common_saving", "Dang luu...") : isEditing ? t("adm_code_update", "Luu thay doi") : t("adm_code_create", "Tao ma")}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("adm_code_search", "Tim theo ma, gv, dm, khoa hoc") } className="w-full rounded-lg border bg-background py-2 pl-9 pr-3" />
          </div>
          <UniversalSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="h-10 rounded-lg border bg-background px-3"><option value="all">{t("common_all", "Tat ca")}</option><option value="active">{t("adm_code_status_active", "Dang hoat dong")}</option><option value="inactive">{t("adm_code_status_inactive", "Tam dung")}</option><option value="expired">{t("adm_code_status_expired", "Het han")}</option></UniversalSelect>
          <UniversalSelect value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="h-10 rounded-lg border bg-background px-3"><option value="createdAt">{t("adm_code_sort_created", "Sap xep ngay tao")}</option><option value="usedCount">{t("adm_code_sort_used", "Sap xep luot dung")}</option><option value="value">{t("adm_code_sort_value", "Sap xep muc giam")}</option></UniversalSelect>
          <button onClick={() => setSortOrder((p) => p === "asc" ? "desc" : "asc")} className="inline-flex h-10 items-center gap-1 rounded-lg border px-3 text-sm hover:bg-secondary">{sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}{sortOrder === "asc" ? t("common_asc", "Tang") : t("common_desc", "Giam")}</button>
          <UniversalSelect value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))} className="h-10 rounded-lg border bg-background px-3"><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></UniversalSelect>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">{t("adm_code_loading", "Dang tai...")}</p> : pagedCodes.length === 0 ? <p className="text-sm text-muted-foreground">{t("adm_code_empty", "Chua co ma nao")}</p> : (
          <div className="space-y-3">
            {pagedCodes.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-12 md:items-center">
                <div className="md:col-span-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold tracking-wide">{item.code}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClasses[item.status || "inactive"]}`}>{item.status === "active" ? t("adm_code_status_active", "Dang hoat dong") : item.status === "expired" ? t("adm_code_status_expired", "Het han") : t("adm_code_status_inactive", "Tam dung")}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${scopeBadgeClasses[inferScope(item)]}`}>{getScopeTagText(inferScope(item))}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{getScopeLabel(item)}</p>
                </div>
                <div className="md:col-span-3">
                  <div className="inline-flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1"><TicketPercent className="h-3.5 w-3.5" />{item.type === "fixed" ? t("adm_code_fixed_vnd", "Giam co dinh") : t("adm_code_pct", "Giam theo %")}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1"><CircleDollarSign className="h-3.5 w-3.5" /><AnimatedNumber value={Number(item.value || 0)} durationMs={320} /></span>
                  </div>
                </div>
                <div className="text-sm md:col-span-2"><span className="rounded-md bg-muted px-2 py-1"><AnimatedNumber value={item.usedCount || 0} durationMs={320} />/{item.usageLimit ? <AnimatedNumber value={item.usageLimit} durationMs={320} /> : "∞"}</span></div>
                <div className="text-xs text-muted-foreground md:col-span-2"><p className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{item.validFrom ? new Date(item.validFrom).toLocaleString("vi-VN") : t("adm_code_no_start", "Khong gioi han")}</p><p className="mt-1">{item.validUntil ? new Date(item.validUntil).toLocaleString("vi-VN") : t("adm_code_no_end", "Khong ngay het han")}</p></div>
                <div className="flex items-center justify-end gap-2 md:col-span-2">
                  <button onClick={() => handleToggleStatus(item)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-secondary"><Power className="h-4 w-4" />{item.status === "active" ? t("adm_code_quick_disable", "Tat") : t("adm_code_quick_enable", "Bat")}</button>
                  <button onClick={() => handleEdit(item)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm hover:bg-secondary"><Pencil className="h-4 w-4" />{t("common_edit", "Sua")}</button>
                  <button onClick={() => setDeleteTarget(item)} disabled={deletingId === item.id} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"><Trash2 className="h-4 w-4" />{deletingId === item.id ? t("common_deleting", "Dang xoa...") : t("common_delete", "Xoa")}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
          <p className="text-muted-foreground">{t("adm_code_paging_info", "Trang")} {Math.min(page, totalPages)}/{totalPages} • {sortedCodes.length} {t("adm_code_items", "ma")}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border px-3 py-1.5 disabled:opacity-50">{t("common_prev", "Truoc")}</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border px-3 py-1.5 disabled:opacity-50">{t("common_next", "Sau")}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
