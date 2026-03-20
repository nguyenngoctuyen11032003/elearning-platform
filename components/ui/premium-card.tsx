"use client"

import type React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PremiumCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd"> {
  children: React.ReactNode
  hover?: boolean
}

export function PremiumCard({ children, hover = true, className, ...props }: PremiumCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -8, boxShadow: "0 20px 40px rgba(37, 99, 235, 0.2)" } : {}}
      className={cn(
        "rounded-2xl bg-card dark:bg-slate-900/50 backdrop-blur-xl border border-border dark:border-slate-800/50",
        "p-6 transition-all duration-300",
        className,
      )}
      {...(props as any)}
    >
      {children}
    </motion.div>
  )
}
