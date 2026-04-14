'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type DateSelectProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  min?: string
  max?: string
}

const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
}

const formatDateForDisplay = (value: string): string => {
  if (!value) return 'mm/dd/yyyy'
  
  const [year, month, day] = value.split('-')
  return `${month}/${day}/${year}`
}

const formatDateForInput = (year: number, month: number, day: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const parseInputDate = (dateStr: string): { year: number; month: number; day: number } | null => {
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return null
  return {
    year: parseInt(year, 10),
    month: parseInt(month, 10) - 1,
    day: parseInt(day, 10)
  }
}

export function DateSelect({ 
  value, 
  onChange, 
  placeholder = 'mm/dd/yyyy',
  className,
  min,
  max
}: DateSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [scrollOffset, setScrollOffset] = React.useState(0)
  
  const today = new Date()
  const initialDate = value ? parseInputDate(value) : null
  const [currentDate, setCurrentDate] = React.useState<Date>(
    initialDate 
      ? new Date(initialDate.year, initialDate.month, 1)
      : new Date(today.getFullYear(), today.getMonth(), 1)
  )

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const selectedLabel = value ? formatDateForDisplay(value) : placeholder

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

  const isDateDisabled = (year: number, month: number, day: number): boolean => {
    const dateStr = formatDateForInput(year, month, day)
    if (min && dateStr < min) return true
    if (max && dateStr > max) return true
    return false
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDateClick = (day: number) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    if (!isDateDisabled(year, month, day)) {
      const dateStr = formatDateForInput(year, month, day)
      onChange(dateStr)
      setOpen(false)
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'w-full rounded-lg border px-4 py-2 text-sm outline-none transition focus:ring-2 flex items-center gap-2',
            value && value !== ''
              ? 'border-emerald-400/50 dark:border-emerald-400/50 bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:border-emerald-400/70 dark:focus:border-emerald-400/70 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20',
            className
          )}
        >
          <Calendar size={16} className="flex-shrink-0" />
          <span className="flex-1 text-left">{selectedLabel}</span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg outline-none p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95" style={{ top: `calc(50vh + ${scrollOffset}px)` }}>
          <div className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <DialogPrimitive.Title className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-emerald-600 dark:text-emerald-400" />
                Chọn ngày
              </DialogPrimitive.Title>

              <div className="flex items-center justify-between gap-2 mb-4">
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  type="button"
                >
                  <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white min-w-max">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button 
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  type="button"
                >
                  <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: getDaysInMonth(currentDate) }).map((_, i) => {
                  const day = i + 1
                  const year = currentDate.getFullYear()
                  const month = currentDate.getMonth()
                  const disabled = isDateDisabled(year, month, day)
                  
                  const isToday = 
                    day === today.getDate() &&
                    month === today.getMonth() &&
                    year === today.getFullYear()
                  
                  const dateStr = formatDateForInput(year, month, day)
                  const isSelected = value === dateStr

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDateClick(day)}
                      disabled={disabled}
                      className={cn(
                        'p-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center',
                        isSelected
                          ? 'bg-emerald-500 text-white shadow-md'
                          : isToday
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700'
                          : disabled
                          ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                          : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Select Buttons */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Nhanh</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date()
                    const dateStr = formatDateForInput(today.getFullYear(), today.getMonth(), today.getDate())
                    onChange(dateStr)
                    setOpen(false)
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 transition-colors"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    const dateStr = formatDateForInput(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
                    onChange(dateStr)
                    setOpen(false)
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 transition-colors"
                >
                  Ngày mai
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
