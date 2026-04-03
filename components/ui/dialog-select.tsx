'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

type OptionNode = {
  value: string
  label: string
  disabled?: boolean
}

type DialogSelectProps = {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  placeholder?: string
  className?: string
}

const parseOptionNodes = (children: React.ReactNode): OptionNode[] => {
  const nodes: OptionNode[] = []
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const elementType = typeof child.type === 'string' ? child.type.toLowerCase() : ''
    if (elementType === 'option') {
      const rawValue = child.props.value ?? ''
      const label =
        typeof child.props.children === 'string'
          ? child.props.children
          : String(child.props.children ?? rawValue)
      nodes.push({
        value: String(rawValue),
        label,
        disabled: Boolean(child.props.disabled),
      })
    }
  })
  return nodes
}

export function DialogSelect({ value, onChange, children, placeholder = 'Chọn tùy chọn', className }: DialogSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [scrollOffset, setScrollOffset] = React.useState(0)
  const options = React.useMemo(() => parseOptionNodes(children), [children])
  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setScrollOffset(window.scrollY)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'w-full rounded-lg border px-4 py-2 text-sm outline-none transition focus:ring-2',
            value && value !== ''
              ? 'border-emerald-400/50 dark:border-emerald-400/50 bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:border-emerald-400/70 dark:focus:border-emerald-400/70 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20',
            className
          )}
        >
          <span>{selectedLabel}</span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg outline-none p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95" style={{ top: `calc(50vh + ${scrollOffset}px)` }}>
          <div className="p-4">
            <DialogPrimitive.Title className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Chọn tùy chọn
            </DialogPrimitive.Title>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full rounded-lg px-3 py-2.5 text-left text-sm transition',
                    option.value === value
                      ? 'bg-emerald-500/20 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-100 border border-emerald-400/50 dark:border-emerald-400/50'
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
