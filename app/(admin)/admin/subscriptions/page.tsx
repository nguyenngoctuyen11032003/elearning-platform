"use client"

import { useEffect, useMemo, useState } from "react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { BarChart3, CreditCard, Plus, Save, ShieldCheck, Trash2 } from "lucide-react"

const emptyPlan = {
  name: "",
  price: 9,
  durationMonths: 1,
  courseLimit: 20,
  storageLimitGb: 10,
  studentsLimit: 120,
  features: "",
}

export default function AdminTeacherSubscriptionPage() {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [dashboard, setDashboard] = useState<any>(null)
  const [creating, setCreating] = useState(false)
  const [newPlan, setNewPlan] = useState<any>(emptyPlan)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [planRes, subRes, payRes, dashRes] = await Promise.all([
        apiClient.getAdminInstructorPlans(),
        apiClient.getAdminInstructorSubscriptions(),
        apiClient.getAdminInstructorPayments(),
        apiClient.getAdminRevenueDashboard(),
      ])

      setPlans(Array.isArray(planRes) ? planRes : [])
      setSubscriptions(Array.isArray(subRes) ? subRes : [])
      setPayments(Array.isArray(payRes) ? payRes : [])
      setDashboard(dashRes || null)
    } catch (error) {
      toast.error("Không thể tải dữ liệu quản lý gói")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const createPlan = async () => {
    setCreating(true)
    try {
      await apiClient.createAdminInstructorPlan({
        ...newPlan,
        features: String(newPlan.features || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      })
      toast.success("Đã tạo gói mới")
      setNewPlan(emptyPlan)
      await loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Không thể tạo gói")
    } finally {
      setCreating(false)
    }
  }

  const updatePlan = async (id: string, patch: Record<string, any>) => {
    try {
      await apiClient.updateAdminInstructorPlan(id, patch)
      toast.success("Đã cập nhật gói")
      await loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật gói")
    }
  }

  const deletePlan = async (id: string) => {
    try {
      await apiClient.deleteAdminInstructorPlan(id)
      toast.success("Đã xử lý xóa gói")
      await loadAll()
    } catch (error: any) {
      toast.error(error?.message || "Không thể xóa gói")
    }
  }

  const confirmPayment = async (id: string) => {
    try {
      await apiClient.confirmAdminInstructorPayment(id)
      toast.success("Đã xác nhận thanh toán")
      await loadAll()
    } catch {
      toast.error("Không thể xác nhận thanh toán")
    }
  }

  const refundPayment = async (id: string) => {
    try {
      await apiClient.refundAdminInstructorPayment(id)
      toast.success("Đã refund giao dịch")
      await loadAll()
    } catch {
      toast.error("Không thể refund")
    }
  }

  const exportPayments = () => {
    const aoa = [
      ["Transaction ID", "User", "Plan", "Amount", "Status", "Date"],
      ...payments.map((p) => [
        p.transactionId,
        p.teacher?.email || p.teacher?.name || "",
        p.plan?.name || "",
        Number(p.amount || 0),
        p.status,
        p.createdAt,
      ]),
    ]

    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Payments")
    XLSX.writeFile(wb, `admin_subscription_payments_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const paidPayments = useMemo(() => payments.filter((p) => p.status === "paid"), [payments])

  if (loading) {
    return <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Quản lý gói & truy cập giảng viên</h1>
        <p className="text-muted-foreground">Plan Management, Payment Management, Revenue Dashboard</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">${Number(dashboard?.totalRevenue || 0).toLocaleString("en-US")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Monthly Revenue</p>
          <p className="text-2xl font-bold">${Number(dashboard?.monthlyRevenue || 0).toLocaleString("en-US")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Users</p>
          <p className="text-2xl font-bold">{dashboard?.activeUsers || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Paid Users</p>
          <p className="text-2xl font-bold">{dashboard?.paidUsers || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Conversion</p>
          <p className="text-2xl font-bold">{dashboard?.conversionRate || 0}%</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Plus size={18} /> Tạo gói mới</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên gói</label>
            <input className="w-full rounded-lg border border-border px-3 py-2 bg-background" placeholder="Ví dụ: Basic, Pro..." value={newPlan.name} onChange={(e) => setNewPlan((p: any) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Giá (VND)</label>
            <input type="text" className="w-full rounded-lg border border-border px-3 py-2 bg-background" placeholder="0" value={newPlan.price} onChange={(e) => setNewPlan((p: any) => ({ ...p, price: Number(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Thời hạn (tháng)</label>
            <input type="text" className="w-full rounded-lg border border-border px-3 py-2 bg-background" placeholder="1" value={newPlan.durationMonths} onChange={(e) => setNewPlan((p: any) => ({ ...p, durationMonths: Number(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Giới hạn khóa học</label>
            <input type="text" className="w-full rounded-lg border border-border px-3 py-2 bg-background" placeholder="20" value={newPlan.courseLimit} onChange={(e) => setNewPlan((p: any) => ({ ...p, courseLimit: Number(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dung lượng lưu trữ (GB)</label>
            <input type="text" className="w-full rounded-lg border border-border px-3 py-2 bg-background" placeholder="10" value={newPlan.storageLimitGb} onChange={(e) => setNewPlan((p: any) => ({ ...p, storageLimitGb: Number(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Giới hạn học viên</label>
            <input type="text" className="w-full rounded-lg border border-border px-3 py-2 bg-background" placeholder="120" value={newPlan.studentsLimit} onChange={(e) => setNewPlan((p: any) => ({ ...p, studentsLimit: Number(e.target.value) || 0 }))} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tính năng (mỗi dòng một tính năng)</label>
          <textarea className="w-full rounded-lg border border-border px-3 py-2 bg-background min-h-20" placeholder="Ví dụ:&#10;Hỗ trợ email 24/7&#10;Thống kê chi tiết&#10;Certificate custom" value={newPlan.features} onChange={(e) => setNewPlan((p: any) => ({ ...p, features: e.target.value }))} />
        </div>
        <button onClick={createPlan} disabled={creating} className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50">{creating ? "Đang tạo..." : "Tạo gói"}</button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-xl font-semibold">Plan Management</h2>
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Tên gói</label>
                  <input className="w-full rounded border border-border px-2 py-1 bg-background" value={plan.name} onChange={(e) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, name: e.target.value } : p)))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Giá (VND)</label>
                  <input type="text" className="w-full rounded border border-border px-2 py-1 bg-background" value={plan.price} onChange={(e) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, price: Number(e.target.value) || 0 } : p)))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Thời hạn (tháng)</label>
                  <input type="text" className="w-full rounded border border-border px-2 py-1 bg-background" value={plan.durationMonths} onChange={(e) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, durationMonths: Number(e.target.value) || 0 } : p)))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Giới hạn khóa học</label>
                  <input type="text" className="w-full rounded border border-border px-2 py-1 bg-background" value={plan.courseLimit} onChange={(e) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, courseLimit: Number(e.target.value) || 0 } : p)))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Dung lượng (GB)</label>
                  <input type="text" className="w-full rounded border border-border px-2 py-1 bg-background" value={plan.storageLimitGb ?? 0} onChange={(e) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, storageLimitGb: Number(e.target.value) || 0 } : p)))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Giới hạn học viên</label>
                  <input type="text" className="w-full rounded border border-border px-2 py-1 bg-background" value={plan.studentsLimit ?? 0} onChange={(e) => setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, studentsLimit: Number(e.target.value) || 0 } : p)))} />
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <button className="px-3 py-1 rounded bg-emerald-600 text-white flex items-center justify-center gap-1" onClick={() => updatePlan(plan.id, plan)}><Save size={14} /> Lưu</button>
                <button className="px-3 py-1 rounded bg-red-500 text-white flex items-center justify-center gap-1" onClick={() => deletePlan(plan.id)}><Trash2 size={14} /> Xóa</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2"><CreditCard size={18} /> Payment Management</h2>
          <button onClick={exportPayments} className="px-3 py-2 rounded-lg bg-primary text-white">Xuất báo cáo</button>
        </div>
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="rounded-lg border border-border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="font-semibold">{p.transactionId}</p>
                <p className="text-sm text-muted-foreground">{p.teacher?.email} • {p.plan?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">${Number(p.amount || 0)}</span>
                <span className={`text-xs px-2 py-1 rounded ${p.status === "paid" ? "bg-emerald-100 text-emerald-700" : p.status === "refunded" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-700"}`}>{p.status}</span>
                <button className="px-2 py-1 rounded bg-emerald-600 text-white text-xs" onClick={() => confirmPayment(p.id)}>Xác nhận</button>
                <button className="px-2 py-1 rounded bg-red-500 text-white text-xs" onClick={() => refundPayment(p.id)}>Refund</button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Đã thanh toán: {paidPayments.length} giao dịch.</p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldCheck size={18} /> Instructor Access</h2>
        <div className="space-y-2">
          {subscriptions.map((s) => (
            <div key={s.id} className="rounded-lg border border-border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="font-semibold">{s.teacher?.name || s.teacher?.email}</p>
                <p className="text-sm text-muted-foreground">Plan: {s.plan?.name} • Courses: {s.usage?.coursesCreated || 0}/{s.usage?.courseLimit || 0}</p>
              </div>
              <div className="text-sm">
                <p>Status: {s.status}</p>
                <p>End date: {s.endDate}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2"><BarChart3 size={18} /> Các module quản trị khác</h2>
        <p className="text-sm text-muted-foreground">Các mục theo yêu cầu hệ thống đã có sẵn trong Admin:</p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Quản lý khóa học: /admin/courses</li>
          <li>Quản lý nội dung (categories): /admin/categories</li>
          <li>Quản lý báo cáo: /admin/reports</li>
          <li>Cấu hình hệ thống: /admin/settings</li>
          <li>Thanh toán tổng hợp: /admin/payments (đã nối thêm giao dịch subscription)</li>
        </ul>
      </section>
    </div>
  )
}
