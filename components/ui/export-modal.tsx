"use client"

import { Download, FileText, Sheet, BarChart3 } from "lucide-react"
import { useState } from "react"
import { Modal } from "./admin-modals"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  data: any[]
}

export function ExportModal({ isOpen, onClose, title, data }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">("excel")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (exportFormat === "csv") {
      exportToCSV()
    } else if (exportFormat === "excel") {
      exportToExcel()
    } else {
      exportToPDF()
    }

    setIsExporting(false)
    onClose()
  }

  const exportToCSV = () => {
    const headers = Object.keys(data[0] || {})
    const csv = [headers.join(","), ...data.map((row) => headers.map((h) => `"${row[h]}"`).join(","))].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const exportToExcel = () => {
    const headers = Object.keys(data[0] || {})
    let html = "<table><tr>"
    headers.forEach((h) => (html += `<th>${h}</th>`))
    html += "</tr>"
    data.forEach((row) => {
      html += "<tr>"
      headers.forEach((h) => (html += `<td>${row[h]}</td>`))
      html += "</tr>"
    })
    html += "</table>"

    const blob = new Blob([html], { type: "application/vnd.ms-excel" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title}-${new Date().toISOString().split("T")[0]}.xls`
    a.click()
  }

  const exportToPDF = () => {
    alert("Tính năng xuất PDF sẽ được cập nhật sớm")
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Xuất báo cáo: ${title}`} size="md">
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-foreground dark:text-white text-sm font-semibold mb-3">
            Chọn định dạng xuất
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "csv", label: "CSV", icon: FileText },
              { id: "excel", label: "Excel", icon: Sheet },
              { id: "pdf", label: "PDF", icon: BarChart3 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setExportFormat(id as any)}
                className={`p-4 rounded-lg border-2 transition-smooth flex flex-col items-center gap-2 ${
                  exportFormat === id
                    ? "border-primary bg-primary/10 dark:border-accent dark:bg-accent/10"
                    : "border-border dark:border-slate-800 hover:border-primary dark:hover:border-accent"
                }`}
              >
                <Icon size={24} className={exportFormat === id ? "text-primary dark:text-accent" : ""} />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-foreground dark:text-white text-sm font-semibold mb-3">
            Khoảng thời gian (tùy chọn)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              />
              <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">Từ ngày</p>
            </div>
            <div>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              />
              <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">Đến ngày</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-secondary dark:bg-slate-800/50 rounded-lg p-4">
          <p className="text-sm text-foreground dark:text-white">
            <span className="font-semibold">Tổng bản ghi:</span> {data.length}
          </p>
          <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
            Báo cáo sẽ được tải xuống dưới dạng {exportFormat.toUpperCase()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-secondary dark:bg-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary/80 dark:hover:bg-slate-700 transition-smooth font-medium"
          >
            Hủy
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download size={18} />
            {isExporting ? "Đang xuất..." : "Xuất báo cáo"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
