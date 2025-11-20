"use client"

import { useEffect, useState } from "react"

interface RollingNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

export function RollingNumber({ value, duration = 2000, prefix = "", suffix = "", decimals = 0 }: RollingNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationId: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      setDisplayValue(Math.floor(value * progress))

      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [value, duration])

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}
