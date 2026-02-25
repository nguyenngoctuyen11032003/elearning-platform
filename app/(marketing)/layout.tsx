"use client"

import type React from "react"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-enter stagger-scope stagger-marketing">{children}</div>
}
