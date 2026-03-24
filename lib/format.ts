/**
 * Safe number conversion - ensures we get a valid number or 0
 */
function safeNumber(value: any): number {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Format number with Vietnamese locale (vi-VN)
 * Ensures consistent formatting on both server and client
 */
export function formatPrice(price: number | string): string {
  const num = Math.round(safeNumber(price));
  return num.toLocaleString("vi-VN");
}

/**
 * Format large numbers (e.g., 1000000 -> 1.000.000)
 */
export function formatNumber(num: number | string): string {
  const rounded = Math.round(safeNumber(num));
  return rounded.toLocaleString("vi-VN");
}

/**
 * Format student count (e.g., 1500 -> 1.500)
 */
export function formatStudentCount(count: number | string): string {
  const rounded = Math.round(safeNumber(count));
  return rounded.toLocaleString("vi-VN");
}

/**
 * Format currency for display (₫)
 * Handles number strings with decimals and converts to proper VND format
 */
export function formatCurrency(amount: number | string): string {
  const num = Math.round(safeNumber(amount));
  return `₫${num.toLocaleString("vi-VN")}`;
}

export type CurrencyCode = "VND" | "USD"

const DEFAULT_VND_TO_USD_RATE = 23000

export function formatCurrencyByLanguage(
  amount: number | string,
  language: "vi" | "en" = "vi",
  exchangeRate: number = DEFAULT_VND_TO_USD_RATE,
): string {
  const amountVnd = safeNumber(amount)

  if (language === "en") {
    const usd = amountVnd / exchangeRate
    return usd.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return `₫${Math.round(amountVnd).toLocaleString("vi-VN")}`
}

/**
 * Format currency in thousands (e.g., 50000 -> 50K)
 */
export function formatPriceInK(price: number): string {
  return (price / 1000).toLocaleString("vi-VN");
}

/**
 * Safe date formatting with optional support
 * Returns empty string if date is null/undefined or invalid
 */
export function formatDateSafe(
  date: string | Date | null | undefined,
  formatStr: string,
  options?: any
): string {
  if (!date) return '';
  
  try {
    const { format } = require('date-fns');
    return format(new Date(date), formatStr, options);
  } catch {
    return '';
  }
}
