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
  Edit2,
  Trash2,
  X,
  Save,
  ClipboardList,
  MoreVertical,
  Tag
} from "lucide-react"
import { toast } from "sonner"
import { scheduleApi } from '@/lib/api/schedule.api'

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
    duration: "30 phút",
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

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

const handleCreateItem = async () => {
  if (!newItem.title?.trim() || !newItem.course?.trim()) {
    toast.error("Vui lòng nhập đầy đủ thông tin")
    return
  }

  try {
    const payload = {
  title: newItem.title,
  course: newItem.course,
  type: newItem.type ?? 'lesson',
  status: newItem.status ?? 'todo',
  time: newItem.time ?? '09:00',
  duration: newItem.duration ?? '30 phút',
  dueDate:
    newItem.dueDate ||
    selectedDate ||
    formatDateToString(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    ),

  // 🔥 ÉP BOOLEAN RÕ RÀNG
  completed: newItem.status === 'completed',

  description: newItem.description ?? '',
}
    const created = await scheduleApi.create(payload)

    // backend trả về object vừa lưu trong DB
    setScheduleItems(prev => [...prev, created])
    setNewItem({
      title: "",
      course: "",
      type: "lesson",
      status: "todo",
      time: "09:00",
      duration: "30 phút",
      completed: false,
      description: "",
      dueDate: undefined,
    })

    setIsCreating(false)
    toast.success("Đã lưu lịch học vào hệ thống")
  } catch (e) {
    toast.error("Lưu lịch học thất bại")
  }
}

const handleUpdateItem = async () => {
  if (!editingItem) return

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
    toast.success("Đã cập nhật thành công")
  } catch (e) {
    toast.error("Cập nhật thất bại")
  }
}

const handleDeleteItem = async (id: string) => {
  try {
    await scheduleApi.remove(id)

    setScheduleItems(prev => prev.filter(item => item.id !== id))
    toast.success("Đã xoá khỏi DB")
  } catch {
    toast.error("Xoá thất bại")
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
        ? 'Đã bắt đầu công việc'
        : 'Đã hoàn thành 🎉'
    )
  } catch {
    toast.error('Cập nhật trạng thái thất bại')
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
      case 'live': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
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
      case 'todo': return 'Chưa làm'
      case 'in-progress': return 'Đang làm'
      case 'completed': return 'Hoàn thành'
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
      setScheduleItems(res.data || [])
    } catch {
      toast.error('Không tải được lịch học')
    }
  }

  fetchData() // load lần đầu

  const interval = setInterval(fetchData, 5000) // ⏱ 5 giây sync 1 lần

  return () => clearInterval(interval)
}, [])
  return (
    <div className="flex gap-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      {/* Main Content - Kanban Board */}
      <div className="flex-1">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Lịch học hàng ngày
              </h1>
              <p className="text-muted-foreground dark:text-slate-400 mt-1">
                {selectedDate ? (
                  <>Các công việc ngày {new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN')} 
                    <button 
                      onClick={() => setSelectedDate(null)}
                      className="ml-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Xóa lọc
                    </button>
                  </>
                ) : (
                  'Quản lý các công việc học tập của bạn'
                )}
              </p>
            </div>
            <button 
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg"
            >
              <Plus size={20} />
              Thêm công việc
            </button>
          </div>
        </motion.div>

        {/* Kanban Columns */}
        <div className="grid grid-cols-3 gap-6">
          {(['todo', 'in-progress', 'completed'] as const).map((status) => (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col"
            >
              {/* Column Header */}
              <div className="mb-4 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  status === 'todo' ? 'bg-red-500' :
                  status === 'in-progress' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <h2 className="text-lg font-bold text-foreground dark:text-white">
                  {getStatusLabel(status)}
                </h2>
                <span className="ml-auto text-sm font-semibold text-muted-foreground dark:text-slate-400">
                  {getFilteredItems(status).length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex flex-col gap-3 flex-1 min-h-[500px] bg-card/50 dark:bg-slate-800/30 rounded-2xl p-4 border border-border/50 dark:border-slate-700/50">
                {getFilteredItems(status).map((item, idx) => (
                  <motion.div
                    key={item.id ?? `schedule-${idx}`}  
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-700 rounded-xl cursor-pointer group hover:shadow-lg transition-all ${getStatusColor(status)}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                        {item.type === 'lesson' ? 'Bài học' : item.type === 'exam' ? 'Bài thi' : 'Live session'}
                      </div>
                      <button 
                        onClick={() => setEditingItem(item)}
                        className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical size={16} className="text-muted-foreground" />
                      </button>
                    </div>

                    <h3 className="font-semibold text-foreground dark:text-white mb-2 line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-sm text-muted-foreground dark:text-slate-400 mb-3">
                      {item.course}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-slate-500 mb-3">
                      <Calendar size={14} />
                      <span>{item.dueDate ? new Date(item.dueDate + 'T00:00:00').toLocaleDateString('vi-VN') : 'Chưa đặt'}</span>
                      <span>•</span>
                      <Clock size={14} />
                      <span>{item.time}</span>
                      <span>•</span>
                      <span>{item.duration}</span>
                    </div>

                    {item.important && (
                      <div className="mb-3 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs font-medium">
                        🔔 Quan trọng
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-border dark:border-slate-700">
                      {status !== 'completed' && (
                    <button
                      onClick={() =>
                        handleQuickStatusChange(
                          item,
                          status === 'todo' ? 'in-progress' : 'completed'
                        )
                      }
                      className="flex-1 px-2 py-1 text-xs bg-primary/10
                        dark:bg-primary/20 text-primary dark:text-accent
                        hover:bg-primary/20 dark:hover:bg-primary/30
                        rounded font-medium transition-colors"
                    >
                      {status === 'todo' ? 'Bắt đầu' : 'Hoàn thành'}
                    </button>
                  )}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {getFilteredItems(status).length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground dark:text-slate-500">
                    <p className="text-sm">Chưa có công việc nào</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Calendar & Activity */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="w-80 space-y-6"
      >
        {/* Calendar */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-foreground dark:text-white" />
            </button>
            <h2 className="text-lg font-bold text-foreground dark:text-white">
              Tháng {currentDate.getMonth() + 1} năm {currentDate.getFullYear()}
            </h2>
            <button 
              onClick={nextMonth}
              className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-foreground dark:text-white" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground dark:text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
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
                  className={`p-2 rounded-lg text-sm font-semibold transition-colors relative ${
                    isSelected
                      ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300'
                      : 'text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800'
                  }`}
                  title={`${itemsOnDay} công việc`}
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
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-foreground dark:text-white mb-4">Công việc của bạn</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
              🎯 Sắp tới
            </span>
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
              🚀 Sản phẩm
            </span>
          </div>
        </div>

        {/* Upcoming Activity */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-foreground dark:text-white mb-4">Hoạt động sắp tới</h3>
          <div className="space-y-3">
            {scheduleItems
              .filter(item => item.status !== 'completed')
              .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
              .slice(0, 5)
              .map((item, idx) => (
                <div key={item.id ?? `upcoming-${idx}`} className="flex items-center gap-3 pb-3 border-b border-border/50 dark:border-slate-700/50 last:border-b-0">
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'todo' ? 'bg-red-500' :
                    item.status === 'in-progress' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground dark:text-slate-400">
                      {item.time}
                    </p>
                    <p className="text-sm text-foreground dark:text-white truncate">
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground dark:text-white">Thêm công việc mới</h2>
                <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg">
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Tiêu đề</label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    placeholder="Nhập tiêu đề công việc..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Khóa học</label>
                  <input
                    type="text"
                    value={newItem.course}
                    onChange={(e) => setNewItem({ ...newItem, course: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    placeholder="Tên khóa học..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Loại</label>
                    <select
                      value={newItem.type}
                      onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    >
                      <option value="lesson">Bài học</option>
                      <option value="exam">Bài thi</option>
                      <option value="live">Live session</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Trạng thái</label>
                    <select
                      value={newItem.status}
                      onChange={(e) => setNewItem({ ...newItem, status: e.target.value as any })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    >
                      <option value="todo">Chưa làm</option>
                      <option value="in-progress">Đang làm</option>
                      <option value="completed">Hoàn thành</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Thời gian</label>
                    <input
                      type="time"
                      value={newItem.time}
                      onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Ngày</label>
                    <input
                      type="date"
                      value={newItem.dueDate || ''}
                      onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Thời lượng</label>
                  <input
                    type="text"
                    value={newItem.duration}
                    onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    placeholder="VD: 45 phút"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Mô tả (tùy chọn)</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent h-20 resize-none"
                    placeholder="Nhập mô tả..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-4 py-3 border-2 border-border dark:border-slate-700 text-foreground dark:text-white rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreateItem}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Lưu
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground dark:text-white">Chỉnh sửa công việc</h2>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg">
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Tiêu đề</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Khóa học</label>
                  <input
                    type="text"
                    value={editingItem.course}
                    onChange={(e) => setEditingItem({ ...editingItem, course: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Loại</label>
                    <select
                      value={editingItem.type}
                      onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as any })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    >
                      <option value="lesson">Bài học</option>
                      <option value="exam">Bài thi</option>
                      <option value="live">Live session</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Trạng thái</label>
                    <select
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    >
                      <option value="todo">Chưa làm</option>
                      <option value="in-progress">Đang làm</option>
                      <option value="completed">Hoàn thành</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Thời gian</label>
                    <input
                      type="time"
                      value={editingItem.time}
                      onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Ngày</label>
                    <input
                      type="date"
                      value={editingItem.dueDate || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, dueDate: e.target.value })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Thời lượng</label>
                  <input
                    type="text"
                    value={editingItem.duration}
                    onChange={(e) => setEditingItem({ ...editingItem, duration: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Mô tả (tùy chọn)</label>
                  <textarea
                    value={editingItem.description || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent h-20 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditingItem(null)}
                    className="flex-1 px-4 py-3 border-2 border-border dark:border-slate-700 text-foreground dark:text-white rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleUpdateItem}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Cập nhật
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
