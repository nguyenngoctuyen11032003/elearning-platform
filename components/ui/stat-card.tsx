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
    <div className="group flex items-start gap-4 p-6 bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-900/40 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
      <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg group-hover:bg-primary/20 dark:group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
        <Icon className="w-6 h-6 text-primary dark:text-accent group-hover:text-primary-600 transition-colors duration-300" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground dark:text-slate-400 mb-1">{displayTitle}</p>
        <p className="text-2xl font-bold text-foreground dark:text-white">{value}</p>
        {change && <p className="text-xs text-green-600 dark:text-green-400 mt-1">{change}</p>}
      </div>
    </div>
  )
}
