import type { LucideIcon } from "lucide-react"
import { AnimatedNumber } from "./rolling-number"

interface StatCardProps {
  icon: LucideIcon
  label?: string
  title?: string
  value: string | number
  change?: string
  color?: string
  formatter?: (value: number) => string
  durationMs?: number
  decimals?: number
  prefix?: string
  suffix?: string
  disableAnimation?: boolean
}

export function StatCard({
  icon: Icon,
  label,
  title,
  value,
  change,
  color,
  formatter,
  durationMs,
  decimals,
  prefix,
  suffix,
  disableAnimation,
}: StatCardProps) {
  const displayTitle = label || title

  return (
    <div className="group stagger-kind-stats flex items-start gap-4 p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer animate-soft-rise interactive-smooth">
      <div className="p-2.5 bg-primary/15 dark:bg-primary/25 rounded-lg group-hover:bg-primary/30 dark:group-hover:bg-primary/40 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
        <Icon className="w-5 h-5 text-primary dark:text-accent group-hover:text-primary-600 transition-colors duration-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground dark:text-slate-300 mb-1 truncate">{displayTitle}</p>
        <p className="text-xl font-bold text-foreground dark:text-white truncate">
          <AnimatedNumber
            value={value}
            formatter={formatter}
            durationMs={durationMs}
            decimals={decimals}
            prefix={prefix}
            suffix={suffix}
            disableAnimation={disableAnimation}
          />
        </p>
        {change && <p className="text-xs text-green-600 dark:text-green-400 mt-1 truncate">{change}</p>}
      </div>
    </div>
  )
}
