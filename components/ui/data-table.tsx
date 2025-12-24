"use client"

import { useState, useMemo } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  Trash2,
  MoreHorizontal,
  Check,
} from "lucide-react"

interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (item: T, index: number) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  totalItems: number
  currentPage: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onSort?: (key: string, order: "asc" | "desc") => void
  sortKey?: string
  sortOrder?: "asc" | "desc"
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  searchValue?: string
  selectable?: boolean
  selectedItems?: string[]
  onSelectItem?: (id: string) => void
  onSelectAll?: () => void
  getItemId?: (item: T) => string
  bulkActions?: {
    label: string
    icon?: React.ReactNode
    action: (selectedIds: string[]) => void
    variant?: "default" | "danger"
  }[]
  exportable?: boolean
  onExport?: (format: "csv" | "excel") => void
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  data,
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
  onSort,
  sortKey,
  sortOrder = "desc",
  loading = false,
  searchable = false,
  searchPlaceholder = "Tìm kiếm...",
  onSearch,
  searchValue = "",
  selectable = false,
  selectedItems = [],
  onSelectItem,
  onSelectAll,
  getItemId = (item: any) => item.id,
  bulkActions = [],
  exportable = false,
  onExport,
  emptyMessage = "Không có dữ liệu",
}: DataTableProps<T>) {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue)

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const allSelected = data.length > 0 && selectedItems.length === data.length

  const handleSearch = (value: string) => {
    setLocalSearchValue(value)
    onSearch?.(value)
  }

  const handleSort = (key: string) => {
    if (!onSort) return
    const newOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc"
    onSort(key, newOrder)
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }

    return pages
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    )
  }

  return (
    <div className="space-y-4">
      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search */}
        {searchable && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={localSearchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border dark:border-slate-700 bg-background dark:bg-slate-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {/* Bulk Actions & Export */}
        <div className="flex items-center gap-2">
          {selectable && selectedItems.length > 0 && bulkActions.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 dark:bg-accent/10 rounded-lg">
              <span className="text-sm font-medium text-primary dark:text-accent">
                {selectedItems.length} đã chọn
              </span>
              {bulkActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => action.action(selectedItems)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    action.variant === "danger"
                      ? "hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "hover:bg-secondary dark:hover:bg-slate-800 text-foreground dark:text-white"
                  }`}
                  title={action.label}
                >
                  {action.icon || <MoreHorizontal className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}

          {exportable && onExport && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border dark:border-slate-700 hover:bg-secondary dark:hover:bg-slate-800 transition-colors">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Xuất</span>
              </button>
              <div className="absolute right-0 mt-1 w-36 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => onExport("csv")}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-secondary dark:hover:bg-slate-800 rounded-t-lg"
                >
                  Xuất CSV
                </button>
                <button
                  onClick={() => onExport("excel")}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-secondary dark:hover:bg-slate-800 rounded-b-lg"
                >
                  Xuất Excel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-slate-800 bg-secondary/30 dark:bg-slate-800/30">
                {selectable && (
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onSelectAll}
                      className="w-4 h-4 rounded border-border dark:border-slate-600 text-primary focus:ring-primary"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-sm font-medium text-muted-foreground dark:text-slate-400 ${column.className || ""}`}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-2 hover:text-foreground dark:hover:text-white transition-colors"
                      >
                        {column.header}
                        <SortIcon columnKey={column.key} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-4 py-8 text-center text-muted-foreground dark:text-slate-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => {
                  const itemId = getItemId(item)
                  const isSelected = selectedItems.includes(itemId)

                  return (
                    <tr
                      key={itemId}
                      className={`border-b border-border dark:border-slate-800 last:border-0 hover:bg-secondary/30 dark:hover:bg-slate-800/30 transition-colors ${
                        isSelected ? "bg-primary/5 dark:bg-accent/5" : ""
                      }`}
                    >
                      {selectable && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelectItem?.(itemId)}
                            className="w-4 h-4 rounded border-border dark:border-slate-600 text-primary focus:ring-primary"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-4 py-3 text-sm text-foreground dark:text-slate-200 ${column.className || ""}`}
                        >
                          {column.render
                            ? column.render(item, index)
                            : (item as any)[column.key]}
                        </td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border dark:border-slate-800">
            <div className="text-sm text-muted-foreground dark:text-slate-400">
              Hiển thị <span className="font-medium text-foreground dark:text-white">{startItem}</span> đến{" "}
              <span className="font-medium text-foreground dark:text-white">{endItem}</span> trong{" "}
              <span className="font-medium text-foreground dark:text-white">{totalItems}</span> kết quả
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === "number" && onPageChange(page)}
                  disabled={page === "..."}
                  className={`min-w-[36px] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-primary dark:bg-accent text-white"
                      : page === "..."
                      ? "cursor-default"
                      : "hover:bg-secondary dark:hover:bg-slate-800"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
