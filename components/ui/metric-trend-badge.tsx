"use client"

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { MetricTrendInfo } from "@/hooks/use-metric-change-highlight"
import { AnimatedNumber } from "@/components/ui/rolling-number"

type MetricTrendBadgeProps = {
  trend: MetricTrendInfo
  className?: string
  durationMs?: number
}

export function MetricTrendBadge({ trend, className = "", durationMs = 560 }: MetricTrendBadgeProps) {
  const strongIncreaseDurationMs = Math.min(1200, Math.max(durationMs + 160, Math.round(durationMs * 1.35)))
  const trendDurationMs = trend.direction === "up" && trend.percent >= 60 ? strongIncreaseDurationMs : durationMs

  if (trend.direction === "up") {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 ${className}`}>
        <ArrowUpRight size={12} />
        +
        <AnimatedNumber value={trend.percent} formatter={(value: number) => Math.abs(value).toFixed(1)} suffix="%" durationMs={trendDurationMs} />
      </span>
    )
  }

  if (trend.direction === "down") {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 ${className}`}>
        <ArrowDownRight size={12} />
        -
        <AnimatedNumber value={trend.percent} formatter={(value: number) => Math.abs(value).toFixed(1)} suffix="%" durationMs={trendDurationMs} />
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 ${className}`}>
      <Minus size={12} />
      <AnimatedNumber value={0} formatter={(value: number) => value.toFixed(1)} suffix="%" durationMs={trendDurationMs} />
    </span>
  )
}
