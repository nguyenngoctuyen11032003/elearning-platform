"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Clock,
  BookOpen,
  Video,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  Trash2,
  X,
  Save,
  ClipboardList,
  MoreVertical,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { scheduleApi } from '@/lib/api/schedule.api'
import { DialogSelect } from "@/components/ui/dialog-select"
import { TimeSelect } from "@/components/ui/time-select"
import { DateSelect } from "@/components/ui/date-select"

interface ScheduleItem {
  id: string
  title: string
  course: string
  type: 'lesson' | 'exam' | 'live'
  status: 'todo' | 'in-progress' | 'completed'
  time: string
  duration: string
  dueDate?: string
  completed: boolean
  important?: boolean
  description?: string
  tags?: string[]
}

export default function SchedulePage() {
  const { t, language } = useLanguage()
  const currentLocale = language === 'en' ? 'en-US' : 'vi-VN'
  const defaultDuration = t('sched_default_duration', '30 minutes')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    // {
    //   id: "1",
    //   title: "Server Components & Data Fetching",
    //   course: "Next.js nâng cao",
    //   type: "lesson",
    //   status: "todo",
    //   time: "09:00",
    //   duration: "45 phút",
    //   completed: false,
    //   dueDate: "2026-02-04",
    //   description: "Học về Server Components trong Next.js 13+"
    // },
    // {
    //   id: "2",
    //   title: "useReducer và Context API",
    //   course: "React Hooks",
    //   type: "lesson",
    //   status: "in-progress",
    //   time: "14:00",
    //   duration: "30 phút",
    //   completed: false,
    //   dueDate: "2026-02-04",
    //   description: "State management với useReducer"
    // },
    // {
    //   id: "3",
    //   title: "Bài thi thử React",
    //   course: "React Hooks",
    //   type: "exam",
    //   status: "todo",
    //   time: "10:00",
    //   duration: "60 phút",
    //   completed: false,
    //   dueDate: "2026-02-05"
    // },
    // {
    //   id: "4",
    //   title: "Live Session: Q&A Next.js",
    //   course: "Next.js nâng cao",
    //   type: "live",
    //   status: "completed",
    //   time: "20:00",
    //   duration: "90 phút",
    //   completed: true,
    //   important: true,
    //   dueDate: "2026-02-03"
    // },
  ])
  
  const [isCreating, setIsCreating] = useState(false)
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<Partial<ScheduleItem>>({
    title: "",
    course: "",
    type: "lesson",
    status: "todo",
    time: "09:00",
    duration: defaultDuration,
    completed: false,
    description: ""
  })

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // 🔔 Helper Functions for Deadline Notifications
  const getTodayDateString = () => {
    const today = new Date()
    return formatDateToString(today.getFullYear(), today.getMonth(), today.getDate())
  }

  const isDateNotToday = (dateString?: string) => {
    if (!dateString) return false
    return dateString !== getTodayDateString()
  }

  const getDaysUntilDeadline = (dateString?: string) => {
    if (!dateString) return 0
    const today = new Date(getTodayDateString())
    const deadline = new Date(dateString)
    const diffTime = deadline.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getDeadlineStatus = (dateString?: string) => {
    const days = getDaysUntilDeadline(dateString)
    if (days < 0) return { status: 'overdue', label: t('sched_overdue', 'Quá hạn'), color: 'bg-red-500/20 text-red-600 dark:text-red-400' }
    if (days === 0) return { status: 'today', label: t('sched_today', 'Hôm nay'), color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' }
    if (days === 1) return { status: 'tomorrow', label: t('sched_tomorrow', 'Ngày mai'), color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' }
    if (days <= 3) return { status: 'soon', label: `${days} ${t('sched_days', 'ngày')}`, color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' }
    return { status: 'future', label: `${days} ${t('sched_days', 'ngày')}`, color: 'bg-slate-500/20 text-slate-600 dark:text-slate-400' }
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

const handleCreateItem = async () => {
  if (!newItem.title?.trim() || !newItem.course?.trim()) {
    toast.error(t("sched_fill_all", "Vui lòng nhập đầy đủ thông tin"))
    return
  }

  const dueDate = newItem.dueDate || selectedDate || formatDateToString(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  )

  // Check if not today and warn user
  if (isDateNotToday(dueDate)) {
    const days = getDaysUntilDeadline(dueDate)
    if (days > 0) {
      toast.warning(`${t('sched_not_time', 'Chưa đến giờ làm')} (${days} ${t('sched_days', 'ngày')})`, {
        description: `${t('sched_come_back', 'Hãy quay lại vào ngày')} ${dueDate}. ${t('sched_future_badge', '✓ Chưa đến ngày làm')}`,
        duration: 5000
      })
    } else if (days < 0) {
      toast.error(`${t("sched_overdue_warn", "Deadline đã quá hạn")} ${Math.abs(days)} ${t("sched_days", "ngày")}!`, {
        description: t('sched_finish_now', 'Bạn cần hoàn thành ngay lập tức!'),
        duration: 5000
      })
    }
  }

  try {
    const payload = {
      title: newItem.title,
      course: newItem.course,
      type: newItem.type ?? 'lesson',
      status: newItem.status ?? 'todo',
      time: newItem.time ?? '09:00',
      duration: newItem.duration ?? defaultDuration,
      dueDate,
      completed: newItem.status === 'completed',
      description: newItem.description ?? '',
    }
    const created = await scheduleApi.create(payload)

    setScheduleItems(prev => [...prev, created])
    setNewItem({
      title: "",
      course: "",
      type: "lesson",
      status: "todo",
      time: "09:00",
      duration: defaultDuration,
      completed: false,
      description: "",
      dueDate: undefined,
    })

    setIsCreating(false)
    toast.success(t("sched_saved", "Đã lưu lịch học vào hệ thống"))
  } catch (e) {
    console.error('Create schedule error:', e)
    if (e && typeof e === 'object' && 'message' in e) {
      toast.error(t("sched_save_failed", "Lưu lịch học thất bại") + ": " + (e.message || ''))
    } else {
      toast.error(t("sched_save_failed", "Lưu lịch học thất bại"))
    }
  }
}

const handleUpdateItem = async () => {
  if (!editingItem) return

  // Check if not today and warn user
  if (isDateNotToday(editingItem.dueDate)) {
    const days = getDaysUntilDeadline(editingItem.dueDate)
    if (days > 0) {
      toast.warning(`${t('sched_not_time', 'Chưa đến giờ làm')} (${days} ${t('sched_days', 'ngày')})`, {
        description: `${t('sched_come_back', 'Hãy quay lại vào ngày')} ${editingItem.dueDate}. ${t('sched_future_badge', '✓ Chưa đến ngày làm')}`,
        duration: 5000
      })
    } else if (days < 0) {
      toast.error(`${t('sched_overdue_warn', 'Deadline đã quá hạn')} ${Math.abs(days)} ${t('sched_days', 'ngày')}!`, {
        description: t('sched_finish_now', 'Bạn cần hoàn thành ngay lập tức!'),
        duration: 5000
      })
    }
  }

  const payload = {
    title: editingItem.title,
    course: editingItem.course,
    type: editingItem.type,
    status: editingItem.status,
    time: editingItem.time,
    duration: editingItem.duration,
    dueDate: editingItem.dueDate,
    completed: editingItem.status === 'completed',
    description: editingItem.description ?? '',
    important: editingItem.important ?? false,
    tags: editingItem.tags ?? [],
  }

  try {
    await scheduleApi.update(editingItem.id, payload)

    setScheduleItems(prev =>
      prev.map(item =>
        item.id === editingItem.id ? { ...item, ...payload } : item
      )
    )

    setEditingItem(null)
    toast.success(t("sched_updated", "Đã cập nhật thành công"))
  } catch (e) {
    console.error('Update schedule error:', e)
    if (e && typeof e === 'object' && 'message' in e) {
      toast.error(t("sched_update_failed", "Cập nhật thất bại") + ": " + (e.message || ''))
    } else {
      toast.error(t("sched_update_failed", "Cập nhật thất bại"))
    }
  }
}

const handleDeleteItem = async (id: string) => {
  try {
    await scheduleApi.remove(id)

    setScheduleItems(prev => prev.filter(item => item.id !== id))
    toast.success(t("sched_deleted", "Đã xoá thành công"))
  } catch (e) {
    console.error('Delete schedule error:', e)
    if (e && typeof e === 'object' && 'message' in e) {
      toast.error(t('sched_delete_failed', 'Xoá thất bại') + ': ' + (e.message || ''))
    } else {
      toast.error(t('sched_delete_failed', 'Xoá thất bại'))
    }
  }
}
const handleQuickStatusChange = async (
  item: ScheduleItem,
  nextStatus: 'todo' | 'in-progress' | 'completed'
) => {
  const payload = {
    status: nextStatus,
    completed: nextStatus === 'completed',
  }

  try {
    // 🔥 PATCH DB
    await scheduleApi.update(item.id, payload)

    // 🔥 UPDATE UI
    setScheduleItems(prev =>
      prev.map(i =>
        i.id === item.id
          ? { ...i, ...payload }
          : i
      )
    )

    toast.success(
      nextStatus === 'in-progress'
        ? t('sched_started', 'Đã bắt đầu công việc')
        : t('sched_done', 'Đã hoàn thành 🎉')
    )
  } catch (e) {
    console.error('Update status error:', e)
    if (e && typeof e === 'object' && 'message' in e) {
      toast.error(t('sched_status_update_failed', 'Cập nhật trạng thái thất bại') + ': ' + (e.message || ''))
    } else {
      toast.error(t('sched_status_update_failed', 'Cập nhật trạng thái thất bại'))
    }
  }
}

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen size={16} />
      case 'exam': return <ClipboardList size={16} />
      case 'live': return <Video size={16} />
      default: return <BookOpen size={16} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'exam': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'live': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'from-red-500/10 to-red-600/10 border-red-500/20'
      case 'in-progress': return 'from-yellow-500/10 to-yellow-600/10 border-yellow-500/20'
      case 'completed': return 'from-green-500/10 to-green-600/10 border-green-500/20'
      default: return 'from-gray-500/10 to-gray-600/10 border-gray-500/20'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return t('sched_todo', 'Chưa làm')
      case 'in-progress': return t('sched_in_progress', 'Đang làm')
      case 'completed': return t('sched_completed', 'Hoàn thành')
      default: return status
    }
  }

  const getItemsByStatus = (status: 'todo' | 'in-progress' | 'completed') => {
    return scheduleItems.filter(item => item.status === status)
  }

  const formatDateToString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const handleDateClick = (day: number) => {
    const dateString = formatDateToString(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(dateString === selectedDate ? null : dateString)
  }

  const getItemsForSelectedDate = () => {
    if (!selectedDate) return scheduleItems
    return scheduleItems.filter(item => item.dueDate === selectedDate)
  }

  const getFilteredItems = (status: 'todo' | 'in-progress' | 'completed') => {
    const itemsForDate = getItemsForSelectedDate()
    return itemsForDate.filter(item => item.status === status)
  }
useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await scheduleApi.getAll()
      const items = Array.isArray(res) ? res : res?.data || []
      setScheduleItems(items)

      // Check for approaching deadlines and notify user
      items.forEach((item: { status: string; dueDate: string | undefined; title: any; time: any; course: any }) => {
        if (item.status !== 'completed' && item.dueDate) {
          const days = getDaysUntilDeadline(item.dueDate)
          
          // Deadline is today
          if (days === 0) {
            toast.error(`${t('sched_today', 'Hôm nay')}: ${item.title}!`, {
              description: `${t('sched_form_time', 'Thời gian')}: ${item.time}, ${t('sched_form_course', 'Khóa học')}: ${item.course}`,
              duration: 4000
            })
          }
          // Deadline is tomorrow
          else if (days === 1) {
            toast.warning(`${t('sched_tomorrow', 'Ngày mai')}: ${item.title}`, {
              description: `${t('sched_form_time', 'Thời gian')}: ${item.time}`,
              duration: 4000
            })
          }
          // Deadline in 2-3 days
          else if (days > 0 && days <= 3) {
            toast.info(`${item.title} - ${days} ${t('sched_days', 'ngày')}`, {
              description: `${t('sched_come_back', 'Hãy quay lại vào ngày')} ${item.dueDate}. ${t('sched_soon_badge', '🟡 Sắp đến -')}`,
              duration: 4000
            })
          }
          // Overdue
          else if (days < 0) {
            toast.error(`${t('sched_overdue', 'Quá hạn')} ${Math.abs(days)} ${t('sched_days', 'ngày')}: ${item.title}!`, {
              description: t('sched_finish_now', 'Bạn cần hoàn thành ngay lập tức!'),
              duration: 5000
            })
          }
        }
      })
    } catch (error) {
      console.error('Fetch schedule error:', error)
      if (error && typeof error === 'object' && 'message' in error) {
        toast.error(t('sched_load_failed', 'Không tải được lịch học') + ': ' + (error.message || ''))
      } else {
        toast.error(t('sched_load_failed', 'Không tải được lịch học'))
      }
    }
  }

  fetchData() // load lần đầu

  const interval = setInterval(fetchData, 30000) // ⏱ 30 giây check deadline 1 lần

  return () => clearInterval(interval)
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
  return (
    <div className="relative flex min-h-screen flex-col gap-4 bg-gradient-to-br from-slate-50 via-cyan-50/45 to-emerald-50/45 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 sm:gap-5 sm:p-5 lg:gap-5 lg:p-6 xl:flex-row xl:gap-4 xl:p-6">
      <motion.div
        aria-hidden
        animate={{ opacity: [0.2, 0.34, 0.2], y: [0, -14, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-14 top-8 h-72 w-72 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-900/20"
      />
      <motion.div
        aria-hidden
        animate={{ opacity: [0.2, 0.3, 0.2], y: [0, 18, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-900/20"
      />

      {/* Main Content - Kanban Board */}
      <div className="relative min-w-0 w-full flex-1 xl:flex-[3]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 overflow-hidden rounded-[2rem] border border-cyan-100/70 bg-white/85 p-5 shadow-[0_24px_60px_rgba(8,47,73,0.12)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 sm:p-6"
          style={{ backgroundImage: "url('/image/bg_tcher.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(130%_120%_at_0%_0%,rgba(34,211,238,0.2),transparent_45%),radial-gradient(120%_120%_at_100%_0%,rgba(16,185,129,0.18),transparent_45%)]" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-cyan-50/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-900/25 dark:text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                {t('sched_title_badge', 'Study Planner')}
              </span>
              <h1 className="bg-gradient-to-r from-cyan-600 via-sky-600 to-emerald-500 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl lg:text-4xl">
                {t('sched_title', 'Lịch học hàng ngày')}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground dark:text-slate-400 mt-1 truncate">
                {selectedDate ? (
                  <>{t('sched_tasks_on', 'Các công việc ngày')} {new Date(selectedDate + 'T00:00:00').toLocaleDateString(currentLocale)} 
                    <button 
                      onClick={() => setSelectedDate(null)}
                      className="ml-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors inline-block"
                    >
                      {t('sched_clear_filter', 'Xóa lọc')}
                    </button>
                  </>
                ) : (
                  t('sched_subtitle', 'Quản lý các công việc học tập của bạn')
                )}
              </p>
            </div>
            <button 
              onClick={() => setIsCreating(true)}
              className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 sm:px-6 sm:py-3 sm:text-base"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">{t('sched_add_task', 'Thêm công việc')}</span>
              <span className="sm:hidden">{t('common_add', 'Thêm')}</span>
            </button>
          </div>
        </motion.div>

        {/* Items List - Horizontal Cards */}
        <div className="space-y-3 sm:space-y-4">
          {scheduleItems.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground dark:text-slate-500">
              <p className="text-base">{t("sched_no_tasks", "Chưa có công việc nào")}</p>
            </div>
          ) : (
            scheduleItems.map((item, idx) => (
              <motion.div
                key={item.id ?? `schedule-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group cursor-pointer rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-4 ${getStatusColor(item.status)} border-border bg-white/85 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/75`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  {/* Type Badge */}
                  <div className={`px-3 py-1.5 rounded-full text-xs sm:text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                    {item.type === 'lesson' ? t('sched_lesson', 'Bài học') : item.type === 'exam' ? t('sched_exam', 'Bài thi') : t('sched_live_session', 'Live session')}
                  </div>

                  {/* Title & Course */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground dark:text-white text-sm sm:text-base line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 line-clamp-1">
                      {item.course}
                    </p>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground dark:text-slate-400 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span className="whitespace-nowrap">{item.dueDate ? new Date(item.dueDate + 'T00:00:00').toLocaleDateString(currentLocale) : t('sched_no_date', 'Chưa đặt')}</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                      <Clock size={14} />
                      <span className="whitespace-nowrap">{item.time}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    item.status === 'todo' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                    item.status === 'in-progress' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  }`}>
                    {item.status === 'todo' ? t('sched_todo', 'Chưa làm') : item.status === 'in-progress' ? t('sched_in_progress', 'Đang làm') : t('sched_completed', 'Hoàn thành')}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status !== 'completed' && (
                      <button
                        onClick={() => {
                          const daysUntil = getDaysUntilDeadline(item.dueDate)
                          if (item.status === 'todo' && daysUntil > 0) {
                            toast.warning(t('sched_not_time', 'Chưa đến giờ làm'), {
                              description: `${t('sched_come_back', 'Hãy quay lại vào ngày')} ${item.dueDate || t('sched_assigned', 'đã quy định')}`,
                              duration: 3000
                            })
                            return
                          }
                          handleQuickStatusChange(
                            item,
                            item.status === 'todo' ? 'in-progress' : 'completed'
                          )
                        }}
                        disabled={item.status === 'todo' && getDaysUntilDeadline(item.dueDate) > 0}
                        className="p-1.5 text-primary dark:text-accent hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                        title={t("sched_change_status", "Chuyển trạng thái")}
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1.5 text-muted-foreground hover:bg-secondary dark:hover:bg-slate-800 rounded transition-colors"
                      title={t("sched_edit", "Chỉnh sửa")}
                    >
                      <MoreVertical size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      title={t("sched_delete", "Xóa")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Deadline Warning - if needed */}
                {isDateNotToday(item.dueDate) && item.status !== 'completed' && (
                  <div className={`mt-3 px-3 py-1.5 rounded text-xs font-medium w-fit ${getDeadlineStatus(item.dueDate).color}`}>
                    {getDeadlineStatus(item.dueDate).status === 'overdue' && t('sched_overdue_badge', '🔴 Quá hạn')}
                    {getDeadlineStatus(item.dueDate).status === 'tomorrow' && t('sched_tomorrow_badge', '⚠️ Ngày mai')}
                    {getDeadlineStatus(item.dueDate).status === 'soon' && t('sched_soon_badge', '🟡 Sắp đến - ') + getDeadlineStatus(item.dueDate).label}
                    {getDeadlineStatus(item.dueDate).status === 'future' && t('sched_future_badge', '✓ Chưa đến ngày làm')}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar - Calendar & Activity */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="relative w-full space-y-4 sm:space-y-5 lg:w-64 lg:space-y-5 xl:w-80"
      >
        {/* Calendar */}
        <div className="max-h-[280px] overflow-y-auto rounded-2xl border border-slate-200/75 bg-white/85 p-4 shadow-lg backdrop-blur-xl dark:border-slate-800/75 dark:bg-slate-900/70 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6 gap-2">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
            >
              <ChevronLeft size={20} className="text-foreground dark:text-white" />
            </button>
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-foreground dark:text-white truncate">
              {new Intl.DateTimeFormat(currentLocale, { month: 'long', year: 'numeric' }).format(currentDate)}
            </h2>
            <button 
              onClick={nextMonth}
              className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
            >
              <ChevronRight size={20} className="text-foreground dark:text-white" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {[t('sched_mon','T2'), t('sched_tue','T3'), t('sched_wed','T4'), t('sched_thu','T5'), t('sched_fri','T6'), t('sched_sat','T7'), t('sched_sun','CN')].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground dark:text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: getDaysInMonth(currentDate) }).map((_, i) => {
              const day = i + 1
              const isToday = 
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear()
              
              const dateString = formatDateToString(currentDate.getFullYear(), currentDate.getMonth(), day)
              const isSelected = selectedDate === dateString
              const itemsOnDay = scheduleItems.filter(item => item.dueDate === dateString).length
              
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`p-1 sm:p-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors relative ${
                    isSelected
                      ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300'
                      : 'text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800'
                  }`}
                  title={`${itemsOnDay} ${t('sched_tasks_unit', 'công việc')}`}
                >
                  {day}
                  {itemsOnDay > 0 && (
                    <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-amber-400 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Your Task */}
        <div className="rounded-2xl border border-slate-200/75 bg-white/85 p-3 shadow-lg backdrop-blur-xl dark:border-slate-800/75 dark:bg-slate-900/70 sm:p-4 lg:p-5">
          <h3 className="text-xs sm:text-sm lg:text-base font-bold text-foreground dark:text-white mb-2 sm:mb-2 lg:mb-3">{t("sched_your_tasks", "Công việc của bạn")}</h3>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
              {t('sched_tag_upcoming', '🎯 Sắp tới')}
            </span>
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
              {t('sched_tag_productivity', '🚀 Sản phẩm')}
            </span>
          </div>
        </div>

        {/* Upcoming Activity */}
        <div className="flex max-h-[220px] flex-col overflow-hidden rounded-2xl border border-slate-200/75 bg-white/85 p-3 shadow-lg backdrop-blur-xl dark:border-slate-800/75 dark:bg-slate-900/70 sm:p-4 lg:p-5">
          <h3 className="text-xs sm:text-sm lg:text-base font-bold text-foreground dark:text-white mb-2 sm:mb-2 lg:mb-3 flex-shrink-0">{t("sched_upcoming_activity", "Hoạt động sắp tới")}</h3>
          <div className="space-y-1.5 sm:space-y-2 overflow-y-auto flex-1">
            {scheduleItems
              .filter(item => item.status !== 'completed')
              .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
              .slice(0, 5)
              .map((item, idx) => (
                <div key={item.id ?? `upcoming-${idx}`} className="flex items-start gap-2 pb-1.5 border-b border-border/50 dark:border-slate-700/50 last:border-b-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${
                    item.status === 'todo' ? 'bg-red-500' :
                    item.status === 'in-progress' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground dark:text-slate-400 leading-none">
                      {item.time}
                    </p>
                    <p className="text-xs text-foreground dark:text-white truncate">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 lg:p-6"
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-800 rounded-2xl p-5 sm:p-6 lg:p-8 max-w-lg lg:max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5 sm:mb-6 lg:mb-8 gap-2">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground dark:text-white flex-1">{t("sched_add_task_title", "Thêm công việc mới")}</h2>
                <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg flex-shrink-0">
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_title", "Tiêu đề")}</label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent text-sm"
                    placeholder={t("sched_form_title_ph", "Nhập tiêu đề công việc...")}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_course", "Khóa học")}</label>
                  <input
                    type="text"
                    value={newItem.course}
                    onChange={(e) => setNewItem({ ...newItem, course: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent text-sm"
                    placeholder={t("sched_form_course_ph", "Tên khóa học...")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_type", "Loại")}</label>
                    <DialogSelect
                      value={newItem.type || "lesson"}
                      onChange={(value) => setNewItem({ ...newItem, type: value as 'lesson' | 'exam' | 'live' })}
                      className="h-11 w-full"
                    >
                      <option value="lesson">{t("sched_lesson", "Bài học")}</option>
                      <option value="exam">{t("sched_exam", "Bài thi")}</option>
                      <option value="live">{t('sched_live_session', 'Live session')}</option>
                    </DialogSelect>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_status", "Trạng thái")}</label>
                    <DialogSelect
                      value={newItem.status || "todo"}
                      onChange={(value) => setNewItem({ ...newItem, status: value as 'todo' | 'in-progress' | 'completed' })}
                      className="h-11 w-full"
                    >
                      <option value="todo">{t("sched_todo", "Chưa làm")}</option>
                      <option value="in-progress">{t("sched_in_progress", "Đang làm")}</option>
                      <option value="completed">{t("sched_completed", "Hoàn thành")}</option>
                    </DialogSelect>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_time", "Thời gian")}</label>
                    <TimeSelect
                      value={newItem.time || "09:00"}
                      onChange={(value) => setNewItem({ ...newItem, time: value })}
                      placeholder="09:00"
                      format="24h"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_date", "Ngày")}</label>
                    <DateSelect
                      value={newItem.dueDate || ''}
                      onChange={(value) => setNewItem({ ...newItem, dueDate: value })}
                      placeholder="mm/dd/yyyy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_duration", "Thời lượng")}</label>
                  <input
                    type="text"
                    value={newItem.duration}
                    onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent text-sm"
                    placeholder={t("sched_form_duration_ph", "VD: 45 phút")}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_desc_opt", "Mô tả (tùy chọn)")}</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent h-20 resize-none text-sm"
                    placeholder={t("sched_form_desc_ph", "Nhập mô tả...")}
                  />
                </div>

                <div className="flex gap-2 sm:gap-3 lg:gap-4 pt-2">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-border dark:border-slate-700 text-foreground dark:text-white rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors text-sm"
                  >
                    {t('common_cancel', 'Hủy')}
                  </button>
                  <button
                    onClick={handleCreateItem}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-3 py-2 text-sm font-medium text-white transition-all hover:shadow-lg sm:px-4 sm:py-3"
                  >
                    <Save size={16} />
                    {t('common_save', 'Lưu')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setEditingItem(null)}
            />
            {/* Modal */}
            <motion.div
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed z-50 w-full md:w-full md:max-w-lg md:left-1/2 md:-translate-x-1/2 md:top-0 top-0 left-1/2 -translate-x-1/2 sm:top-0 lg:top-1/2 lg:-translate-y-1/2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-800 rounded-t-3xl lg:rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground dark:text-white flex-1">{t("sched_edit_title", "Chỉnh sửa công việc")}</h2>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg flex-shrink-0">
                  <X size={20} className="text-muted-foreground" />
                </button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_title", "Tiêu đề")}</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_course", "Khóa học")}</label>
                  <input
                    type="text"
                    value={editingItem.course}
                    onChange={(e) => setEditingItem({ ...editingItem, course: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_type", "Loại")}</label>
                    <DialogSelect
                      value={editingItem.type}
                      onChange={(value) => setEditingItem({ ...editingItem, type: value as 'lesson' | 'exam' | 'live' })}
                      className="h-11 w-full"
                    >
                      <option value="lesson">{t("sched_lesson", "Bài học")}</option>
                      <option value="exam">{t("sched_exam", "Bài thi")}</option>
                      <option value="live">{t('sched_live_session', 'Live session')}</option>
                    </DialogSelect>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_status", "Trạng thái")}</label>
                    <DialogSelect
                      value={editingItem.status}
                      onChange={(value) => setEditingItem({ ...editingItem, status: value as 'todo' | 'in-progress' | 'completed' })}
                      className="h-11 w-full"
                    >
                      <option value="todo">{t("sched_todo", "Chưa làm")}</option>
                      <option value="in-progress">{t("sched_in_progress", "Đang làm")}</option>
                      <option value="completed">{t("sched_completed", "Hoàn thành")}</option>
                    </DialogSelect>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_time", "Thời gian")}</label>
                    <TimeSelect
                      value={editingItem.time || "09:00"}
                      onChange={(value) => setEditingItem({ ...editingItem, time: value })}
                      placeholder="09:00"
                      format="24h"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_date", "Ngày")}</label>
                    <DateSelect
                      value={editingItem.dueDate || ''}
                      onChange={(value) => setEditingItem({ ...editingItem, dueDate: value })}
                      placeholder="mm/dd/yyyy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_duration", "Thời lượng")}</label>
                  <input
                    type="text"
                    value={editingItem.duration}
                    onChange={(e) => setEditingItem({ ...editingItem, duration: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground dark:text-white mb-1 sm:mb-2">{t("sched_form_desc_opt", "Mô tả (tùy chọn)")}</label>
                  <textarea
                    value={editingItem.description || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent h-20 resize-none text-sm"
                  />
                </div>

                <div className="flex gap-2 sm:gap-3 lg:gap-4 pt-2">
                  <button
                    onClick={() => setEditingItem(null)}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-border dark:border-slate-700 text-foreground dark:text-white rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors text-sm"
                  >
                    {t('common_cancel', 'Hủy')}
                  </button>
                  <button
                    onClick={handleUpdateItem}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-3 py-2 text-sm font-medium text-white transition-all hover:shadow-lg sm:px-4 sm:py-3"
                  >
                    <Save size={16} />
                    {t('common_update', 'Cập nhật')}
                  </button>
                </div>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
