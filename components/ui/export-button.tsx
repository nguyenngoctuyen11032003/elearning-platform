"use client"

import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { useState } from "react"

interface ExportButtonProps {
  data: any[]
  filename: string
  columns: { key: string; header: string }[]
  onExport?: (format: "csv" | "excel") => Promise<void>
}

export function ExportButton({ data, filename, columns, onExport }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const convertToCSV = (data: any[], columns: { key: string; header: string }[]) => {
    const headers = columns.map(col => col.header).join(",")
    const rows = data.map(item =>
      columns.map(col => {
        const value = item[col.key]
        // Handle values that contain commas or quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ""
      }).join(",")
    )
    return [headers, ...rows].join("\n")
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob(["\ufeff" + content], { type: `${type};charset=utf-8;` })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  const handleExport = async (format: "csv" | "excel") => {
    setIsExporting(true)
    setShowDropdown(false)

    try {
      if (onExport) {
        await onExport(format)
      } else {
        const csvContent = convertToCSV(data, columns)
        const timestamp = new Date().toISOString().slice(0, 10)

        if (format === "csv") {
          downloadFile(csvContent, `${filename}_${timestamp}.csv`, "text/csv")
        } else {
          // For Excel, we'll use a simple CSV format that Excel can open
          // For a more sophisticated Excel export, you'd need xlsx library
          downloadFile(csvContent, `${filename}_${timestamp}.csv`, "application/vnd.ms-excel")
        }
      }
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting || data.length === 0}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border dark:border-slate-700 hover:bg-secondary dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground dark:text-white"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">Xuất dữ liệu</span>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-44 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
            <button
              onClick={() => handleExport("csv")}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-secondary dark:hover:bg-slate-800 transition-colors text-foreground dark:text-white"
            >
              <FileText className="w-4 h-4 text-green-600" />
              Xuất CSV
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-secondary dark:hover:bg-slate-800 transition-colors text-foreground dark:text-white"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Xuất Excel
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Advanced export modal for filtered data
interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (options: ExportOptions) => Promise<void>
  title?: string
}

interface ExportOptions {
  format: "csv" | "excel" | "pdf"
  dateRange?: { from: Date; to: Date }
  columns: string[]
  includeHeaders: boolean
}

export function ExportModal({ isOpen, onClose, onExport, title = "Xuất dữ liệu" }: ExportModalProps) {
  const [format, setFormat] = useState<"csv" | "excel" | "pdf">("csv")
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport({
        format,
        columns: [],
        includeHeaders,
      })
      onClose()
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-xl font-semibold text-foreground dark:text-white mb-4">
          {title}
        </h3>

        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-slate-400 mb-2">
              Định dạng
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "csv", label: "CSV", icon: FileText },
                { value: "excel", label: "Excel", icon: FileSpreadsheet },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormat(option.value as "csv" | "excel")}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                    format === option.value
                      ? "border-primary dark:border-accent bg-primary/10 dark:bg-accent/10"
                      : "border-border dark:border-slate-700 hover:bg-secondary dark:hover:bg-slate-800"
                  }`}
                >
                  <option.icon className={`w-5 h-5 ${format === option.value ? "text-primary dark:text-accent" : "text-muted-foreground"}`} />
                  <span className={`text-sm ${format === option.value ? "text-primary dark:text-accent font-medium" : "text-foreground dark:text-white"}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeHeaders"
              checked={includeHeaders}
              onChange={(e) => setIncludeHeaders(e.target.checked)}
              className="w-4 h-4 rounded border-border dark:border-slate-600 text-primary focus:ring-primary"
            />
            <label
              htmlFor="includeHeaders"
              className="text-sm text-foreground dark:text-white"
            >
              Bao gồm tiêu đề cột
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border dark:border-slate-700 hover:bg-secondary dark:hover:bg-slate-800 transition-colors text-foreground dark:text-white"
          >
            Hủy
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Xuất
          </button>
        </div>
      </div>
    </div>
  )
}
