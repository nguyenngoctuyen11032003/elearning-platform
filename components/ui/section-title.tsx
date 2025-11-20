interface SectionTitleProps {
  title: string
  subtitle?: string
}

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-foreground dark:text-white mb-2">{title}</h2>
      {subtitle && <p className="text-muted-foreground dark:text-slate-400">{subtitle}</p>}
    </div>
  )
}
