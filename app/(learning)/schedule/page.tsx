"use client"

import { useState } from "react"
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
  ClipboardList
} from "lucide-react"
import { toast } from "sonner"

interface ScheduleItem {
  id: string
  title: string
  course: string
  type: 'lesson' | 'exam' | 'live'
  dayIndex: number
  time: string
  duration: string
  completed: boolean
  important?: boolean
  description?: string
}

export default function SchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(0)
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    {
      id: "1",
      title: "Server Components & Data Fetching",
      course: "Next.js nâng cao",
      type: "lesson",
      dayIndex: 0,
      time: "09:00",
      duration: "45 phút",
      completed: false,
      description: "Học về Server Components trong Next.js 13+"
    },
    {
      id: "2",
      title: "useReducer và Context API",
      course: "React Hooks",
      type: "lesson",
      dayIndex: 0,
      time: "14:00",
      duration: "30 phút",
      completed: true,
      description: "State management với useReducer"
    },
    {
      id: "3",
      title: "Bài thi thử React",
      course: "React Hooks",
      type: "exam",
      dayIndex: 1,
      time: "10:00",
      duration: "60 phút",
      completed: false
    },
    {
      id: "4",
      title: "Live Session: Q&A Next.js",
      course: "Next.js nâng cao",
      type: "live",
      dayIndex: 3,
      time: "20:00",
      duration: "90 phút",
      completed: false,
      important: true
    },
  ])
  
  const [isCreating, setIsCreating] = useState(false)
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null)
  const [newItem, setNewItem] = useState<Partial<ScheduleItem>>({
    title: "",
    course: "",
    type: "lesson",
    dayIndex: 0,
    time: "09:00",
    duration: "30 phút",
    completed: false,
    description: ""
  })
  
  const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"]
  
  const getDateForDay = (dayIndex: number) => {
    const today = new Date()
    const startOfWeek = new Date(today)
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    startOfWeek.setDate(today.getDate() + diff + currentWeek * 7)
    
    const targetDate = new Date(startOfWeek)
    targetDate.setDate(startOfWeek.getDate() + dayIndex)
    return targetDate
  }

  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  const handleCreateItem = () => {
    if (!newItem.title?.trim() || !newItem.course?.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }

    const item: ScheduleItem = {
      id: Date.now().toString(),
      title: newItem.title!,
      course: newItem.course!,
      type: newItem.type || "lesson",
      dayIndex: newItem.dayIndex || 0,
      time: newItem.time || "09:00",
      duration: newItem.duration || "30 phút",
      completed: false,
      description: newItem.description
    }

    setScheduleItems([...scheduleItems, item])
    setNewItem({
      title: "",
      course: "",
      type: "lesson",
      dayIndex: 0,
      time: "09:00",
      duration: "30 phút",
      completed: false,
      description: ""
    })
    setIsCreating(false)
    toast.success("Đã thêm lịch học mới")
  }

  const handleUpdateItem = () => {
    if (!editingItem || !editingItem.title?.trim() || !editingItem.course?.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }

    setScheduleItems(scheduleItems.map(item => 
      item.id === editingItem.id ? editingItem : item
    ))
    setEditingItem(null)
    toast.success("Đã cập nhật lịch học")
  }

  const handleDeleteItem = (id: string) => {
    setScheduleItems(scheduleItems.filter(item => item.id !== id))
    toast.success("Đã xóa lịch học")
  }

  const toggleComplete = (id: string) => {
    setScheduleItems(scheduleItems.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen size={14} />
      case 'exam': return <ClipboardList size={14} />
      case 'live': return <Video size={14} />
      default: return <BookOpen size={14} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'from-blue-500/10 to-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
      case 'exam': return 'from-red-500/10 to-red-600/10 border-red-500/20 text-red-600 dark:text-red-400'
      case 'live': return 'from-purple-500/10 to-purple-600/10 border-purple-500/20 text-purple-600 dark:text-purple-400'
      default: return 'from-primary/10 to-accent/10 border-primary/20 text-primary dark:text-accent'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Lịch học của tôi
            </h1>
            <p className="text-muted-foreground dark:text-slate-400 mt-1">
              Quản lý lịch trình học tập hiệu quả
            </p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg"
          >
            <Plus size={20} />
            Thêm lịch học
          </button>
        </div>
      </motion.div>

      {/* Week Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setCurrentWeek(currentWeek - 1)}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-foreground dark:text-white" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground dark:text-white">
              {currentWeek === 0 ? "Tuần này" : currentWeek > 0 ? `${currentWeek} tuần tới` : `${Math.abs(currentWeek)} tuần trước`}
            </h2>
            <p className="text-sm text-muted-foreground dark:text-slate-400">
              {getDateForDay(0).toLocaleDateString('vi-VN')} - {getDateForDay(6).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <button 
            onClick={() => setCurrentWeek(currentWeek + 1)}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronRight size={24} className="text-foreground dark:text-white" />
          </button>
        </div>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden"
      >
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-border dark:border-slate-800">
          {days.map((day, idx) => {
            const date = getDateForDay(idx)
            const isToday = currentWeek === 0 && idx === todayIndex
            return (
              <div 
                key={idx} 
                className={`p-4 text-center border-r last:border-r-0 border-border dark:border-slate-800 ${
                  isToday ? 'bg-gradient-to-b from-primary/10 to-transparent dark:from-accent/10' : ''
                }`}
              >
                <p className="text-sm font-medium text-muted-foreground dark:text-slate-400">{day}</p>
                <p className={`text-lg font-bold ${
                  isToday ? 'text-primary dark:text-accent' : 'text-foreground dark:text-white'
                }`}>
                  {date.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-7 min-h-[500px]">
          {days.map((_, dayIdx) => {
            const dayItems = scheduleItems.filter(item => item.dayIndex === dayIdx)
            const isToday = currentWeek === 0 && dayIdx === todayIndex
            return (
              <div 
                key={dayIdx} 
                className={`p-2 border-r last:border-r-0 border-border dark:border-slate-800 ${
                  isToday ? 'bg-primary/5 dark:bg-accent/5' : ''
                }`}
              >
                <div className="space-y-2">
                  {dayItems.length === 0 ? (
                    <div className="h-32 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground dark:text-slate-500">Trống</p>
                    </div>
                  ) : (
                    dayItems.map(item => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-2 rounded-lg border bg-gradient-to-br ${getTypeColor(item.type)} cursor-pointer group hover:shadow-md transition-all ${
                          item.completed ? 'opacity-60' : ''
                        } ${item.important ? 'ring-2 ring-amber-500' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(item.type)}
                            {item.completed && <CheckCircle size={12} className="text-green-500" />}
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleComplete(item.id)}
                              className="p-0.5 hover:bg-white/20 rounded"
                              title="Đánh dấu hoàn thành"
                            >
                              <CheckCircle size={12} />
                            </button>
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-0.5 hover:bg-white/20 rounded"
                              title="Chỉnh sửa"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-0.5 hover:bg-red-500/20 rounded"
                              title="Xóa"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs font-semibold line-clamp-2 mb-1" title={item.title}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1 text-xs opacity-75">
                          <Clock size={10} />
                          <span>{item.time}</span>
                        </div>
                        <p className="text-xs opacity-75 mt-0.5">{item.duration}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Tổng lịch học</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{scheduleItems.length}</p>
            </div>
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Calendar size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">Đã hoàn thành</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {scheduleItems.filter(item => item.completed).length}
              </p>
            </div>
            <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle size={28} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Chưa hoàn thành</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                {scheduleItems.filter(item => !item.completed).length}
              </p>
            </div>
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Clock size={28} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

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
                <h2 className="text-2xl font-bold text-foreground dark:text-white">Thêm lịch học mới</h2>
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
                    placeholder="Nhập tiêu đề bài học..."
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
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Ngày</label>
                    <select
                      value={newItem.dayIndex}
                      onChange={(e) => setNewItem({ ...newItem, dayIndex: parseInt(e.target.value) })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    >
                      {days.map((day, idx) => (
                        <option key={idx} value={idx}>{day}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Giờ học</label>
                    <input
                      type="time"
                      value={newItem.time}
                      onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    />
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Mô tả (tùy chọn)</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent h-20 resize-none"
                    placeholder="Nhập mô tả chi tiết..."
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
                    Lưu lịch học
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
                <h2 className="text-2xl font-bold text-foreground dark:text-white">Chỉnh sửa lịch học</h2>
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
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Ngày</label>
                    <select
                      value={editingItem.dayIndex}
                      onChange={(e) => setEditingItem({ ...editingItem, dayIndex: parseInt(e.target.value) })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    >
                      {days.map((day, idx) => (
                        <option key={idx} value={idx}>{day}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Giờ học</label>
                    <input
                      type="time"
                      value={editingItem.time}
                      onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent"
                    />
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
