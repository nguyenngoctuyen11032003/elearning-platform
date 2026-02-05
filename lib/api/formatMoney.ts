export function formatMoneyShort(value: number | string): string {
  const amount = Number(value)

  if (isNaN(amount)) return "0 ₫"

  if (amount >= 1_000_000_000) {
    return (amount / 1_000_000_000)
      .toFixed(2)
      .replace(/\.00$/, "") + " tỷ ₫"
  }

  if (amount >= 1_000_000) {
    return (amount / 1_000_000)
      .toFixed(2)
      .replace(/\.00$/, "") + " triệu ₫"
  }

  if (amount >= 1_000) {
    return amount.toLocaleString("vi-VN") + " ₫"
  }

  return amount + " ₫"
}
