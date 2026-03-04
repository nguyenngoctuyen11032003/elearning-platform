"use client"

import type React from "react"
import { Navbar } from "@/components/ui/navbar"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="stagger-items">{children}</div>
    </>
  )
}
