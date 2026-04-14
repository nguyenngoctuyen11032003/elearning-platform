'use client'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'

export type DropdownOption = { value: string; label: string }

interface DropdownFilterProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  width?: number
}

export function AdminDropdownFilter({ 
  options, 
  value, 
  onChange, 
  className = '', 
  width = 180 
}: DropdownFilterProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close dropdown when click outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !(ref.current as HTMLElement).contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`} style={{ minWidth: width }}>
      <button
        type="button"
        className={`w-full flex items-center justify-between px-4 py-2 rounded-xl font-medium text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-all duration-200 shadow-sm ${
          open
            ? 'ring-2 ring-primary/40 border-primary/50'
            : 'hover:border-slate-300 dark:hover:border-slate-600'
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected?.label || t('common_select', 'Chọn')}</span>
        <svg
          className={`ml-2 w-4 h-4 transition-transform duration-200 ${
            open ? 'rotate-180' : 'rotate-0'
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className={`absolute left-0 mt-2 w-full z-[9999] rounded-xl shadow-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 ${
          open
            ? 'max-h-60 opacity-100 scale-100'
            : 'max-h-0 opacity-0 scale-95 pointer-events-none'
        }`}
        style={{
          boxShadow: open
            ? '0 8px_32px_0_rgba(0,0,0,0.12)'
            : undefined,
        }}
      >
        <ul className="py-1 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-100 ${
                  value === option.value
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
