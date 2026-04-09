/**
 * Payment Status Utilities
 * Provides semantic color mapping and Vietnamese text for payment statuses
 * Used across student checkout, teacher checkout, top-up, and admin payment pages
 */

export type PaymentStatus = "success" | "pending" | "failed" | "expired" | "completed" | "paid" | "idle"

export interface PaymentStatusInfo {
  /** Vietnamese text for status */
  text: string
  /** Semantic badge CSS class */
  badgeClass: string
  /** RAW status value (for i18n keys if needed) */
  statusKey: "success" | "pending" | "failed" | "expired"
}

/**
 * Normalize payment status to standard format
 */
export function normalizePaymentStatus(status?: string): PaymentStatus {
  const normalized = status?.toLowerCase?.().trim()
  if (normalized === "completed" || normalized === "success" || normalized === "paid") return "success"
  if (normalized === "pending") return "pending"
  if (normalized === "expired") return "expired"
  return "failed"
}

/**
 * Get semantic color class for payment status badge
 * Uses emerald (success), amber (pending), rose (failed/expired), slate (unknown)
 */
export function getPaymentStatusBadgeClass(status?: string): string {
  const normalized = normalizePaymentStatus(status)
  
  if (normalized === "success") {
    return "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300 dark:border dark:border-emerald-500/20"
  }
  if (normalized === "pending") {
    return "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300 dark:border dark:border-amber-500/20"
  }
  if (normalized === "expired" || normalized === "failed") {
    return "bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-300 dark:border dark:border-rose-500/20"
  }
  
  return "bg-slate-500/15 text-slate-700 ring-1 ring-slate-500/30 dark:text-slate-300 dark:border dark:border-slate-500/20"
}

/**
 * Get Vietnamese status text - requires i18n context (t function)
 * This is a pure mapping that returns i18n keys
 */
export function getPaymentStatusI18nKey(status?: string): {
  key: string
  fallback: string
} {
  const normalized = normalizePaymentStatus(status)
  
  if (normalized === "success") {
    return { key: "pay_success", fallback: "Đã thanh toán" }
  }
  if (normalized === "pending") {
    return { key: "pay_pending", fallback: "Chờ xử lý" }
  }
  if (normalized === "expired") {
    return { key: "pay_expired", fallback: "Hết hạn" }
  }
  
  return { key: "pay_failed", fallback: "Thất bại" }
}

/**
 * Get complete payment status info (requires i18n context)
 * Usage: const info = getPaymentStatusInfo(payment.status, t)
 */
export function getPaymentStatusInfo(
  status?: string,
  t?: (key: string, fallback?: string) => string
): PaymentStatusInfo {
  const { key, fallback } = getPaymentStatusI18nKey(status)
  const text = t ? t(key, fallback) : fallback
  const badgeClass = getPaymentStatusBadgeClass(status)
  const statusKey = normalizePaymentStatus(status) as "success" | "pending" | "failed" | "expired"
  
  return {
    text,
    badgeClass,
    statusKey,
  }
}
