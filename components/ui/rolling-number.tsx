"use client"

import { useEffect, useMemo, useState } from "react"
import { animate, useMotionValue, useReducedMotion } from "framer-motion"

type AnimatedNumberProps = {
  value: number | string
  formatter?: (value: number) => string
  durationMs?: number
  delayMs?: number
  decimals?: number
  prefix?: string
  suffix?: string
  disableAnimation?: boolean
}

function parseNumeric(value: number | string): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  const numeric = Number(String(value).replace(/[^0-9.-]+/g, ""))
  return Number.isFinite(numeric) ? numeric : null
}

const defaultFormatter = (value: number, decimals: number) =>
  Number(value.toFixed(Math.max(decimals, 0))).toLocaleString()

export function AnimatedNumber({
  value,
  formatter,
  durationMs = 900,
  delayMs = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  disableAnimation = false,
}: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion()
  const motionValue = useMotionValue(0)
  const target = useMemo(() => parseNumeric(value), [value])
  const [display, setDisplay] = useState<string>(() => {
    if (target === null) return String(value)
    const formatFn = formatter || ((val: number) => defaultFormatter(val, decimals))
    return `${prefix}${formatFn(target)}${suffix}`
  })

  useEffect(() => {
    if (target === null) {
      setDisplay(String(value))
      return
    }

    const formatFn = formatter || ((val: number) => defaultFormatter(val, decimals))
    const shouldAnimate = !disableAnimation && !prefersReducedMotion

    if (!shouldAnimate) {
      setDisplay(`${prefix}${formatFn(target)}${suffix}`)
      return
    }

    const controls = animate(motionValue, target, {
      duration: Math.max(durationMs, 0) / 1000,
      delay: Math.max(delayMs, 0) / 1000,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(`${prefix}${formatFn(latest)}${suffix}`),
    })

    return () => controls.stop()
  }, [target, formatter, durationMs, delayMs, decimals, prefix, suffix, motionValue, prefersReducedMotion, disableAnimation, value])

  return <span className="tabular-nums">{display}</span>
}

// Backward-compatible alias
export function RollingNumber(props: AnimatedNumberProps) {
  return <AnimatedNumber {...props} />
}

export function useRollingNumber(value: number | string, options?: Omit<AnimatedNumberProps, "value">) {
  const [formatted, setFormatted] = useState<string>("")
  const prefersReducedMotion = useReducedMotion()
  const motionValue = useMotionValue(0)
  const target = useMemo(() => parseNumeric(value), [value])

  useEffect(() => {
    if (target === null) {
      setFormatted(String(value))
      return
    }

    const formatFn = options?.formatter || ((val: number) => defaultFormatter(val, options?.decimals ?? 0))
    const shouldAnimate = !options?.disableAnimation && !prefersReducedMotion

    if (!shouldAnimate) {
      setFormatted(`${options?.prefix ?? ""}${formatFn(target)}${options?.suffix ?? ""}`)
      return
    }

    const controls = animate(motionValue, target, {
      duration: Math.max(options?.durationMs ?? 900, 0) / 1000,
      delay: Math.max(options?.delayMs ?? 0, 0) / 1000,
      ease: "easeOut",
      onUpdate: (latest) => setFormatted(`${options?.prefix ?? ""}${formatFn(latest)}${options?.suffix ?? ""}`),
    })

    return () => controls.stop()
  }, [target, options?.formatter, options?.decimals, options?.disableAnimation, options?.durationMs, options?.delayMs, options?.prefix, options?.suffix, prefersReducedMotion, motionValue, value])

  return formatted
}
