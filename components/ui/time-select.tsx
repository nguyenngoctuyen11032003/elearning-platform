'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

type TimeSelectProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  format?: '12h' | '24h'
}

const generateTimeSlots = (format: '12h' | '24h'): Array<{ value: string; label: string }> => {
  const slots: Array<{ value: string; label: string }> = []
  
  if (format === '24h') {
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
        slots.push({
          value: timeStr,
          label: timeStr
        })
      }
    }
  } else {
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        const period = hour >= 12 ? 'PM' : 'AM'
        const label = `${String(displayHour).padStart(2, '0')}:${String(min).padStart(2, '0')} ${period}`
        slots.push({
          value: timeStr,
          label: label
        })
      }
    }
  }
  
  return slots
}

const formatTimeForDisplay = (value: string, format: '12h' | '24h'): string => {
  if (!value) return 'Chọn giờ'
  
  const [hours, minutes] = value.split(':')
  
  if (format === '24h') {
    return `${hours}:${minutes}`
  }
  
  const hour = parseInt(hours, 10)
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const period = hour >= 12 ? 'PM' : 'AM'
  
  return `${String(displayHour).padStart(2, '0')}:${minutes} ${period}`
}

export function TimeSelect({ 
  value, 
  onChange, 
  placeholder = 'Chọn giờ',
  className,
  format = '24h'
}: TimeSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [scrollOffset, setScrollOffset] = React.useState(0)
  const timeSlots = React.useMemo(() => generateTimeSlots(format), [format])
  const selectedLabel = formatTimeForDisplay(value, format)

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
            'w-full rounded-lg border px-4 py-2 text-sm outline-none transition focus:ring-2 flex items-center gap-2',
            value && value !== ''
              ? 'border-cyan-400/50 dark:border-cyan-400/50 bg-cyan-500/10 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-100'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:border-cyan-400/70 dark:focus:border-cyan-400/70 focus:ring-cyan-500/20 dark:focus:ring-cyan-500/20',
            className
          )}
        >
          <Clock size={16} className="flex-shrink-0" />
          <span className="flex-1 text-left">{selectedLabel}</span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg outline-none p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95" style={{ top: `calc(50vh + ${scrollOffset}px)` }}>
          <div className="p-4">
            <DialogPrimitive.Title className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-cyan-600 dark:text-cyan-400" />
              Chọn giờ
            </DialogPrimitive.Title>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {timeSlots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => {
                    onChange(slot.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full rounded-lg px-3 py-2.5 text-left text-sm transition',
                    slot.value === value
                      ? 'bg-cyan-500/20 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-100 border border-cyan-400/50 dark:border-cyan-400/50'
                      : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                  )}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
