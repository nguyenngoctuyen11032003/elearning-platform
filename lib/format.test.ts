import { describe, it, expect } from "vitest"
import { formatCurrencyByLanguage } from "./format"

describe("formatCurrencyByLanguage", () => {
  it("should format Vietnamese currency", () => {
    expect(formatCurrencyByLanguage(100000, "vi")).toBe("₫100.000")
  })

  it("should format USD currency for English", () => {
    expect(formatCurrencyByLanguage(100000, "en")).toBe("$4.35")
  })
})
