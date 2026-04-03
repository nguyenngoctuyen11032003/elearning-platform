"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type MetricValue = number | string | null | undefined
type MetricsMap = Record<string, MetricValue>

export type MetricTrendInfo = {
  direction: "up" | "down" | "flat"
  percent: number
}

type Options = {
  flashDurationMs?: number
  flashOnInitialLoad?: boolean
}

const areTrendMapsEqual = (
  a: Record<string, MetricTrendInfo>,
  b: Record<string, MetricTrendInfo>,
) => {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    const trendA = a[key]
    const trendB = b[key]
    if (!trendB) return false
    if (trendA.direction !== trendB.direction) return false
    if (Math.abs(trendA.percent - trendB.percent) > 0.0001) return false
  }

  return true
}

export function useMetricChangeHighlight(metrics: MetricsMap, options?: Options) {
  const flashDurationMs = options?.flashDurationMs ?? 1200
  const flashOnInitialLoad = options?.flashOnInitialLoad ?? false
  const previousRef = useRef<MetricsMap | null>(null)
  const [changedKeys, setChangedKeys] = useState<Record<string, boolean>>({})
  const [trendMap, setTrendMap] = useState<Record<string, MetricTrendInfo>>({})

  const metricsSignature = useMemo(() => {
    const keys = Object.keys(metrics).sort()
    return keys
      .map((key) => `${key}:${String(metrics[key] ?? "")}`)
      .join("|")
  }, [metrics])

  const metricsSnapshot = useMemo(() => metrics, [metricsSignature])

  const metricKeys = useMemo(() => Object.keys(metricsSnapshot).sort(), [metricsSnapshot])

  useEffect(() => {
    const prev = previousRef.current
    previousRef.current = metricsSnapshot

    if (!prev) {
      const initialTrend: Record<string, MetricTrendInfo> = {}
      metricKeys.forEach((key) => {
        initialTrend[key] = { direction: "flat", percent: 0 }
      })
      setTrendMap((current) => (areTrendMapsEqual(current, initialTrend) ? current : initialTrend))

      if (!flashOnInitialLoad) return
      const initialChanged: Record<string, boolean> = {}
      metricKeys.forEach((key) => {
        initialChanged[key] = true
      })
      setChangedKeys(initialChanged)
      const timer = setTimeout(() => setChangedKeys({}), flashDurationMs)
      return () => clearTimeout(timer)
    }

    const changedNow = metricKeys.filter((key) => {
      const before = prev[key]
      const after = metricsSnapshot[key]
      return String(before ?? "") !== String(after ?? "")
    })

    const nextTrend: Record<string, MetricTrendInfo> = {}
    metricKeys.forEach((key) => {
      const beforeRaw = Number(prev[key])
      const afterRaw = Number(metricsSnapshot[key])

      if (!Number.isFinite(beforeRaw) || !Number.isFinite(afterRaw)) {
        nextTrend[key] = { direction: "flat", percent: 0 }
        return
      }

      const diff = afterRaw - beforeRaw
      const direction: MetricTrendInfo["direction"] = diff > 0 ? "up" : diff < 0 ? "down" : "flat"

      let percent = 0
      if (diff !== 0) {
        if (beforeRaw === 0) {
          percent = 100
        } else {
          percent = (Math.abs(diff) / Math.abs(beforeRaw)) * 100
        }
      }

      nextTrend[key] = {
        direction,
        percent,
      }
    })
    setTrendMap((current) => (areTrendMapsEqual(current, nextTrend) ? current : nextTrend))

    if (!changedNow.length) return

    setChangedKeys((current) => {
      const next = { ...current }
      changedNow.forEach((key) => {
        next[key] = true
      })
      return next
    })

    const timer = setTimeout(() => {
      setChangedKeys((current) => {
        const next = { ...current }
        changedNow.forEach((key) => {
          delete next[key]
        })
        return next
      })
    }, flashDurationMs)

    return () => clearTimeout(timer)
  }, [flashDurationMs, flashOnInitialLoad, metricKeys, metricsSignature, metricsSnapshot])

  const isChanged = (key: string) => Boolean(changedKeys[key])
  const getTrend = (key: string): MetricTrendInfo => trendMap[key] ?? { direction: "flat", percent: 0 }

  return { isChanged, changedKeys, getTrend, trendMap }
}
