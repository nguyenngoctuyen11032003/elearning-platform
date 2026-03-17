"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"

interface CouponItem {
  id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  usageLimit?: number
  usedCount?: number
  status?: string
  validFrom?: string
  validUntil?: string
  course?: { id: string; title: string }
}

export default function AdminPaymentCodesPage() {
  const [codes, setCodes] = useState<CouponItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    code: "",
    type: "fixed" as "fixed" | "percentage",
    value: 0,
    usageLimit: 1,
    validFrom: "",
    validUntil: "",
  })

  const loadCodes = async () => {
    setLoading(true)
    try {
      const list = await apiClient.getCoupons()
      setCodes(Array.isArray(list) ? list : [])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải mã thanh toán"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCodes()
  }, [])

  const handleCreate = async () => {
    if (!form.code.trim()) {
      toast.error("Vui lòng nhập mã")
      return
    }
    if (Number(form.value) <= 0) {
      toast.error("Giá trị mã phải lớn hơn 0")
      return
    }

    setSaving(true)
    try {
      await apiClient.createCoupon({
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        usageLimit: Number(form.usageLimit || 0) || undefined,
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
      })
      toast.success("Đã tạo mã thanh toán")
      setForm({
        code: "",
        type: "fixed",
        value: 0,
        usageLimit: 1,
        validFrom: "",
        validUntil: "",
      })
      await loadCodes()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tạo mã thất bại"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mã thanh toán</h1>
          <p className="text-sm text-muted-foreground">Admin tạo mã để học sinh sử dụng khi thanh toán khóa học.</p>
        </div>
        <Link href="/admin/payments" className="rounded-lg border px-4 py-2 text-sm hover:bg-secondary">
          Quay lại giao dịch
        </Link>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Tạo mã mới</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="Ví dụ: THANHTOAN100"
            className="rounded-lg border bg-background px-3 py-2"
          />

          <select
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as "fixed" | "percentage" }))}
            className="rounded-lg border bg-background px-3 py-2"
          >
            <option value="fixed">Giảm cố định (VND)</option>
            <option value="percentage">Giảm theo %</option>
          </select>

          <input
            type="number"
            min={1}
            value={form.value}
            onChange={(e) => setForm((prev) => ({ ...prev, value: Number(e.target.value) }))}
            placeholder={form.type === "fixed" ? "Giá trị giảm (VND)" : "Giá trị giảm (%)"}
            className="rounded-lg border bg-background px-3 py-2"
          />

          <input
            type="number"
            min={1}
            value={form.usageLimit}
            onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: Number(e.target.value) }))}
            placeholder="Giới hạn lượt dùng"
            className="rounded-lg border bg-background px-3 py-2"
          />

          <input
            type="datetime-local"
            value={form.validFrom}
            onChange={(e) => setForm((prev) => ({ ...prev, validFrom: e.target.value }))}
            className="rounded-lg border bg-background px-3 py-2"
          />

          <input
            type="datetime-local"
            value={form.validUntil}
            onChange={(e) => setForm((prev) => ({ ...prev, validUntil: e.target.value }))}
            className="rounded-lg border bg-background px-3 py-2"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={saving}
          className="mt-4 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Đang tạo..." : "Tạo mã"}
        </button>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Danh sách mã</h2>

        {loading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : codes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có mã thanh toán nào.</p>
        ) : (
          <div className="space-y-3">
            {codes.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{item.code}</span>
                  <span className="rounded bg-secondary px-2 py-1 text-xs">{item.type === "fixed" ? "Cố định" : "Phần trăm"}</span>
                  <span className="rounded bg-secondary px-2 py-1 text-xs">Giá trị: {item.value}</span>
                  <span className="rounded bg-secondary px-2 py-1 text-xs">Đã dùng: {item.usedCount || 0}/{item.usageLimit || "∞"}</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {item.validFrom && <span>Từ: {new Date(item.validFrom).toLocaleString("vi-VN")} </span>}
                  {item.validUntil && <span>Đến: {new Date(item.validUntil).toLocaleString("vi-VN")}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
