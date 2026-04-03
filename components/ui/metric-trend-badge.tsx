"use client"

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { MetricTrendInfo } from "@/hooks/use-metric-change-highlight"

type MetricTrendBadgeProps = {
  trend: MetricTrendInfo
  className?: string
}

export function MetricTrendBadge({ trend, className = "" }: MetricTrendBadgeProps) {
  const percentText = `${trend.percent.toFixed(1)}%`

  if (trend.direction === "up") {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 ${className}`}>
        <ArrowUpRight size={12} /> +{percentText}
      </span>
    )
  }

  if (trend.direction === "down") {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 ${className}`}>
        <ArrowDownRight size={12} /> -{percentText}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 ${className}`}>
      <Minus size={12} /> 0.0%
    </span>
  )
}
