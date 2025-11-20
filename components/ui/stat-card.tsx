import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  label?: string
  title?: string
  value: string | number
  change?: string
  color?: string
}

export function StatCard({ icon: Icon, label, title, value, change, color }: StatCardProps) {
  const displayTitle = label || title

  return (
    <div className="flex items-start gap-4 p-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl hover:shadow-lg transition-smooth">
      <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
        <Icon className="w-6 h-6 text-primary dark:text-accent" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground dark:text-slate-400 mb-1">{displayTitle}</p>
        <p className="text-2xl font-bold text-foreground dark:text-white">{value}</p>
        {change && <p className="text-xs text-green-600 dark:text-green-400 mt-1">{change}</p>}
      </div>
    </div>
  )
}
