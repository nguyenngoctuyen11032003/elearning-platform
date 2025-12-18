/**
 * Format number with Vietnamese locale (vi-VN)
 * Ensures consistent formatting on both server and client
 */
export function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN");
}

/**
 * Format large numbers (e.g., 1000000 -> 1.000.000)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("vi-VN");
}

/**
 * Format student count (e.g., 1500 -> 1.500)
 */
export function formatStudentCount(count: number): string {
  return count.toLocaleString("vi-VN");
}

/**
 * Format currency for display (₫)
 */
export function formatCurrency(amount: number): string {
  return `₫${formatNumber(amount)}`;
}

/**
 * Format currency in thousands (e.g., 50000 -> 50K)
 */
export function formatPriceInK(price: number): string {
  return (price / 1000).toLocaleString("vi-VN");
}
