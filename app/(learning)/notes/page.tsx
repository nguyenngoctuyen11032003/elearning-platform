"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Trash2, 
  Search, 
  Edit3, 
  BookOpen, 
  Calendar,
  Tag,
  Star,
  Filter,
  StickyNote,
  X,
  Save,
  Clock,
  Download
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"

interface Note {
  id: string
  title: string
  content: string
  course: string
  courseId: string
  lessonTitle: string
  createdAt: string
  updatedAt: string
  tags: string[]
  isFavorite: boolean
  type: 'general' | 'deadline' | 'checklist' | 'plan'
  items?: { id: string; title: string; deadline: string; priority: 'high' | 'medium' | 'low'; completed: boolean }[]
  schedule?: { date: string; time: string; content: string }[]
}

const noteTypes = [
  { value: 'general', label: 'Ghi chú thường', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300', icon: '📝' },
  { value: 'deadline', label: 'Deadline Tracker', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300', icon: '⏰' },
  { value: 'checklist', label: 'Checklist', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300', icon: '☑' },
  { value: 'plan', label: 'Lịch học / Plan', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300', icon: '📅' },
]

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "Next.js App Router",
      content: "App Router là cách mới để định tuyến trong Next.js 13+. Sử dụng thư mục app/ thay vì pages/. Hỗ trợ Server Components mặc định, layouts, loading states và error handling tốt hơn.\n\nƯu điểm:\n- Tối ưu hiệu suất với Server Components\n- Nested layouts linh hoạt\n- Streaming và Suspense\n- Data fetching tích hợp",
      course: "Lập trình Next.js",
      courseId: "1",
      lessonTitle: "Bài 5: App Router Architecture",
      createdAt: "2025-01-20",
      updatedAt: "2025-01-22",
      tags: ["routing", "nextjs", "architecture"],
      isFavorite: true,
      type: "general"
    },
    {
      id: "2",
      title: "Server Components vs Client Components",
      content: "Server Components render trên server, giảm bundle size. Client Components cần 'use client' directive.\n\nKhi nào dùng Server Components:\n- Fetch data\n- Access backend trực tiếp\n- Không cần interactivity\n\nKhi nào dùng Client Components:\n- Event handlers\n- useState, useEffect\n- Browser APIs",
      course: "Lập trình Next.js",
      courseId: "1",
      lessonTitle: "Bài 8: Server Components",
      createdAt: "2025-01-18",
      updatedAt: "2025-01-18",
      tags: ["server", "client", "components"],
      isFavorite: false,
      type: "general"
    },
    {
      id: "3",
      title: "useReducer Pattern",
      content: "useReducer phù hợp khi state logic phức tạp. Syntax: const [state, dispatch] = useReducer(reducer, initialState).\n\nReducer là pure function nhận state và action, trả về state mới.",
      course: "React Hooks",
      courseId: "2",
      lessonTitle: "Bài 12: useReducer Hook",
      createdAt: "2025-01-15",
      updatedAt: "2025-01-16",
      tags: ["react", "hooks", "state"],
      isFavorite: true,
      type: "general"
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [newNote, setNewNote] = useState({ 
    title: "", 
    content: "", 
    tags: "", 
    type: 'general' as Note['type'],
    items: [] as { id: string; title: string; deadline: string; priority: 'high' | 'medium' | 'low'; completed: boolean }[],
    schedule: [] as { date: string; time: string; content: string }[]
  })
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [tagToDelete, setTagToDelete] = useState<string | null>(null)

  const ITEMS_PER_PAGE = 6

  const courses = [...new Set(notes.map(n => n.course))]
  const allTags = [...new Set(notes.flatMap(n => n.tags))].sort()

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCourse = selectedCourse === "all" || note.course === selectedCourse
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => note.tags.includes(tag))
    return matchesSearch && matchesCourse && matchesTags
  })

  const totalPages = Math.ceil(filteredNotes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedNotes = filteredNotes.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset to page 1 when filters change
  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleCourseChange = (course: string) => {
    setSelectedCourse(course)
    setCurrentPage(1)
  }

  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
    setCurrentPage(1)
  }

  const handleCreateNote = () => {
    if (newNote.title.trim() && (newNote.type === 'general' ? newNote.content.trim() : true)) {
      const baseNote = {
        id: Date.now().toString(),
        title: newNote.title,
        content: newNote.content,
        course: "Lập trình Next.js",
        courseId: "1",
        lessonTitle: "Ghi chú tự do",
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        tags: newNote.tags.split(",").map(t => t.trim()).filter(t => t),
        isFavorite: false,
      }
      
      let note: Note
      if (newNote.type === 'deadline') {
        note = { ...baseNote, type: 'deadline', items: newNote.items }
      } else if (newNote.type === 'checklist') {
        note = { ...baseNote, type: 'checklist', items: newNote.items }
      } else if (newNote.type === 'plan') {
        note = { ...baseNote, type: 'plan', schedule: newNote.schedule }
      } else {
        note = { ...baseNote, type: 'general', content: newNote.content }
      }
      setNotes([note, ...notes])
      setNewNote({ 
        title: "", 
        content: "", 
        tags: "", 
        type: 'general',
        items: [],
        schedule: []
      })
      setIsCreating(false)
    }
  }

  const handleUpdateNote = () => {
    if (editingNote && editingNote.title.trim() && (editingNote.type === 'general' ? editingNote.content.trim() : true)) {
      setNotes(notes.map(n => 
        n.id === editingNote.id 
          ? { ...editingNote, updatedAt: new Date().toISOString().split("T")[0] }
          : n
      ))
      setEditingNote(null)
    }
  }

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id))
    if (viewingNote?.id === id) setViewingNote(null)
    if (editingNote?.id === id) setEditingNote(null)
  }

  const toggleFavorite = (id: string) => {
    setNotes(notes.map(n => 
      n.id === id ? { ...n, isFavorite: !n.isFavorite } : n
    ))
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleExportNotes = () => {
    const notesToExport = filteredNotes.length > 0 ? filteredNotes : notes
    const dataStr = JSON.stringify(notesToExport, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ghi-chú-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Ghi chú của tôi
            </h1>
            <p className="text-muted-foreground dark:text-slate-400 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <StickyNote size={16} />
                {notes.length} ghi chú
              </span>
              <span className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500" />
                {notes.filter(n => n.isFavorite).length} yêu thích
              </span>
            </p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
          >
            <Plus size={20} />
            Ghi chú mới
          </button>
        </div>
      </motion.div>

      {/* Search & Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm ghi chú..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-card dark:bg-slate-900/60 border-2 border-border dark:border-slate-800 text-foreground dark:text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors"
          />
        </div>
      </motion.div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 items-start"
        >
          <span className="text-sm font-medium text-muted-foreground pt-2">Tags:</span>
          <div className="flex flex-wrap gap-2 flex-1">
            {allTags.map(tag => (
              <div key={tag} className="relative group">
                <button
                  onClick={() => handleTagSelect(tag)}
                  className={`px-3.5 py-1.5 rounded-full font-medium text-sm transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg'
                      : 'bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 text-foreground dark:text-white hover:border-primary dark:hover:border-accent'
                  }`}
                >
                  #{tag}
                </button>
                <button
                  onClick={() => setTagToDelete(tag)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                  title="Xóa tag"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setSelectedTags([])}
            disabled={selectedTags.length === 0}
            className={`px-3.5 py-1.5 rounded-full mr-5 font-medium text-sm transition-all flex items-center gap-1.5 ${
              selectedTags.length > 0
                ? 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30'
                : 'bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 text-muted-foreground cursor-not-allowed opacity-50'
            }`}
            title="Xóa tất cả bộ lọc"
          >
            <X size={20} />
            Xóa tất cả
          </button>
        </motion.div>
      )}

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-card to-card/50 dark:from-slate-900/60 dark:to-slate-900/30 border-2 border-dashed border-border dark:border-slate-800 rounded-2xl p-12 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <StickyNote size={40} className="text-primary dark:text-accent" />
          </div>
          <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">
            {searchTerm || selectedCourse !== "all" ? "Không tìm thấy ghi chú" : "Chưa có ghi chú nào"}
          </h3>
          <p className="text-muted-foreground dark:text-slate-400 mb-6">
            {searchTerm || selectedCourse !== "all" 
              ? "Thử thay đổi từ khóa hoặc bộ lọc" 
              : "Tạo ghi chú để lưu lại những điều quan trọng trong quá trình học"}
          </p>
          {!searchTerm && selectedCourse === "all" && (
            <button 
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Tạo ghi chú đầu tiên
            </button>
          )}
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedNotes.map((note, idx) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl hover:shadow-primary/10 dark:hover:shadow-accent/10 transition-all group cursor-pointer"
                onClick={() => setViewingNote(note)}
              >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-foreground dark:text-white line-clamp-1 flex-1 group-hover:text-primary dark:group-hover:text-accent transition-colors" title={note.title}>
                      {note.title}
                    </h3>
                    <span className="text-sm px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0" style={{
                      backgroundColor: noteTypes.find(nt => nt.value === note.type)?.color?.split(' ')[0],
                      color: noteTypes.find(nt => nt.value === note.type)?.color?.includes('text-') ? 'inherit' : 'currentColor'
                    }}>
                      {noteTypes.find(nt => nt.value === note.type)?.icon} {noteTypes.find(nt => nt.value === note.type)?.label.split(' ')[0]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(note.id)
                    }}
                    className="p-1.5 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Star 
                      size={16} 
                      className={note.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"} 
                    />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingNote(note)
                    }}
                    className="p-1.5 hover:bg-primary/10 rounded-lg text-primary dark:text-accent"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteNote(note.id)
                    }}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {note.type === 'general' && (
                <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                  {note.content}
                </p>
              )}
              {(note.type === 'deadline' || note.type === 'checklist') && (
                <div className="mb-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-2">
                    <span className="font-medium">{note.items?.length || 0} {note.type === 'deadline' ? 'deadline' : 'mục'}</span>
                    {note.items && note.items.length > 0 && (
                      <span className="text-xs">({note.items.filter(i => i.completed).length} hoàn thành)</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {note.items?.slice(0, 2).map((item) => (
                      <div key={item.id} className="text-xs">
                        {note.type === 'deadline' ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className={`line-clamp-1 ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground dark:text-white'}`}>
                              {item.title}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${
                              item.priority === 'high' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                              item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                              'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            }`}>
                              {item.priority === 'high' ? '⚠' : item.priority === 'medium' ? '○' : '○'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs">
                            <span className={`line-clamp-1 ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground dark:text-white'}`}>
                              {item.title}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    {note.items && note.items.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{note.items.length - 2} {note.type === 'deadline' ? 'deadline' : 'mục'} khác</div>
                    )}
                  </div>
                </div>
              )}
              {note.type === 'plan' && (
                <div className="mb-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-2">
                    <span className="font-medium">{note.schedule?.length || 0} lịch</span>
                  </div>
                  <div className="space-y-1">
                    {note.schedule?.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="text-xs line-clamp-1 text-foreground dark:text-white">
                        <span className="font-medium">{item.date ? formatDate(item.date) : 'Chưa có ngày'}</span>
                        {item.time && <span className="text-muted-foreground"> • {item.time}</span>}
                      </div>
                    ))}
                    {note.schedule && note.schedule.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{note.schedule.length - 2} lịch khác</div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {note.tags.slice(0, 3).map((tag, i) => (
                    <span 
                      key={i}
                      className="px-2.5 py-1 bg-gradient-to-r from-primary/10 to-purple-600/10 text-primary dark:text-accent text-xs rounded-full font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="px-2.5 py-1 bg-secondary dark:bg-slate-800 text-xs rounded-full font-medium text-muted-foreground">
                      +{note.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 border-t border-border dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-400">
                  <BookOpen size={14} />
                  <span className="truncate max-w-[120px]">{note.course}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-500">
                  <Clock size={14} />
                  {formatDate(note.updatedAt)}
                </div>
              </div>
            </motion.div>
          ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-1 mt-8"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    currentPage === page
                      ? "bg-primary dark:bg-accent text-white shadow-lg"
                      : "bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                  }`}
                >
                  {page}
                </motion.button>
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* Create Note Modal */}
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground dark:text-white">Tạo ghi chú mới</h2>
                  <p className="text-sm text-muted-foreground">Lưu lại những điều quan trọng</p>
                </div>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Tiêu đề ghi chú..."
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors text-lg font-semibold"
                />
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Loại ghi chú</label>
                  <div className="grid grid-cols-2 gap-2">
                    {noteTypes.map((nt) => (
                      <button
                        key={nt.value}
                        onClick={() => setNewNote({ ...newNote, type: nt.value as any })}
                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                          newNote.type === nt.value
                            ? nt.color + ' ring-2 ring-primary shadow-lg'
                            : nt.color + ' opacity-60'
                        }`}
                      >
                        {nt.icon} {nt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {newNote.type === 'general' && (
                  <textarea
                    placeholder="Viết nội dung ghi chú của bạn..."
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors h-48 resize-none"
                  />
                )}
                {(newNote.type === 'deadline' || newNote.type === 'checklist') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">
                      {newNote.type === 'deadline' ? 'Các deadline' : 'Các mục kiểm tra'}
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {newNote.items?.map((item, idx) => (
                        <div key={item.id} className="space-y-1.5">
                          {newNote.type === 'deadline' ? (
                            <>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={(e) => {
                                    const updated = [...newNote.items!]
                                    updated[idx].completed = e.target.checked
                                    setNewNote({ ...newNote, items: updated })
                                  }}
                                  className="w-4 h-4 rounded cursor-pointer flex-shrink-0"
                                />
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => {
                                    const updated = [...newNote.items!]
                                    updated[idx].title = e.target.value
                                    setNewNote({ ...newNote, items: updated })
                                  }}
                                  placeholder="Tên công việc"
                                  className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="date"
                                  value={item.deadline}
                                  onChange={(e) => {
                                    const updated = [...newNote.items!]
                                    updated[idx].deadline = e.target.value
                                    setNewNote({ ...newNote, items: updated })
                                  }}
                                  className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary text-sm"
                                />
                                <select
                                  value={item.priority}
                                  onChange={(e) => {
                                    const updated = [...newNote.items!]
                                    updated[idx].priority = e.target.value as 'high' | 'medium' | 'low'
                                    setNewNote({ ...newNote, items: updated })
                                  }}
                                  className="bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-2 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary text-sm"
                                >
                                  <option value="low">Thấp</option>
                                  <option value="medium">Bình thường</option>
                                  <option value="high">Cao</option>
                                </select>
                                <button
                                  onClick={() => {
                                    const updated = newNote.items!.filter((_, i) => i !== idx)
                                    setNewNote({ ...newNote, items: updated })
                                  }}
                                  className="p-1 hover:bg-red-500/10 rounded text-red-500"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex gap-2 items-center">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={(e) => {
                                  const updated = [...newNote.items!]
                                  updated[idx].completed = e.target.checked
                                  setNewNote({ ...newNote, items: updated })
                                }}
                                className="w-4 h-4 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const updated = [...newNote.items!]
                                  updated[idx].title = e.target.value
                                  setNewNote({ ...newNote, items: updated })
                                }}
                                className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary"
                              />
                              <button
                                onClick={() => {
                                  const updated = newNote.items!.filter((_, i) => i !== idx)
                                  setNewNote({ ...newNote, items: updated })
                                }}
                                className="p-1 hover:bg-red-500/10 rounded text-red-500"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const newItem = { id: Date.now().toString(), title: '', deadline: '', priority: 'medium' as const, completed: false }
                        setNewNote({ ...newNote, items: [...(newNote.items || []), newItem] })
                      }}
                      className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                    >
                      {newNote.type === 'deadline' ? '+ Thêm deadline' : '+ Thêm mục'}
                    </button>
                  </div>
                )}
                {newNote.type === 'plan' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Lịch học</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {newNote.schedule?.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => {
                              const updated = [...newNote.schedule!]
                              updated[idx].date = e.target.value
                              setNewNote({ ...newNote, schedule: updated })
                            }}
                            className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary"
                          />
                          <input
                            type="time"
                            value={item.time}
                            onChange={(e) => {
                              const updated = [...newNote.schedule!]
                              updated[idx].time = e.target.value
                              setNewNote({ ...newNote, schedule: updated })
                            }}
                            className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary"
                          />
                          <input
                            type="text"
                            value={item.content}
                            onChange={(e) => {
                              const updated = [...newNote.schedule!]
                              updated[idx].content = e.target.value
                              setNewNote({ ...newNote, schedule: updated })
                            }}
                            placeholder="Nội dung"
                            className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary"
                          />
                          <button
                            onClick={() => {
                              const updated = newNote.schedule!.filter((_, i) => i !== idx)
                              setNewNote({ ...newNote, schedule: updated })
                            }}
                            className="p-1 hover:bg-red-500/10 rounded text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const newItem = { date: '', time: '', content: '' }
                        setNewNote({ ...newNote, schedule: [...(newNote.schedule || []), newItem] })
                      }}
                      className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                    >
                      + Thêm lịch
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Tags (phân cách bằng dấu phẩy: react, nextjs, hooks)"
                  value={newNote.tags}
                  onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors"
                />
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-4 py-3 border-2 border-border dark:border-slate-700 text-foreground dark:text-white rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleCreateNote}
                    disabled={!newNote.title.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Lưu ghi chú
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Note Modal */}
      <AnimatePresence>
        {editingNote && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingNote(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground dark:text-white">Chỉnh sửa ghi chú</h2>
                  <p className="text-sm text-muted-foreground">Cập nhật nội dung của bạn</p>
                </div>
                <button 
                  onClick={() => setEditingNote(null)}
                  className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Tiêu đề ghi chú..."
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors text-lg font-semibold"
                />
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Loại ghi chú</label>
                  <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{
                    backgroundColor: noteTypes.find(nt => nt.value === editingNote.type)?.color?.split(' ')[0],
                  }}>
                    {noteTypes.find(nt => nt.value === editingNote.type)?.icon} {noteTypes.find(nt => nt.value === editingNote.type)?.label}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Không thể thay đổi loại ghi chú khi chỉnh sửa</p>
                </div>
                {editingNote.type === 'general' && (
                  <textarea
                    placeholder="Viết nội dung ghi chú của bạn..."
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors h-48 resize-none"
                  />
                )}
                {(editingNote.type === 'deadline' || editingNote.type === 'checklist') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">
                      {editingNote.type === 'deadline' ? 'Các deadline' : 'Các mục kiểm tra'}
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {editingNote.items?.map((item, idx) => (
                        <div key={item.id} className="space-y-1.5">
                          {editingNote.type === 'deadline' ? (
                            <>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => {
                                    const updated = [...editingNote.items!]
                                    updated[idx].title = e.target.value
                                    setEditingNote({ ...editingNote, items: updated })
                                  }}
                                  placeholder="Tên công việc"
                                  className={`flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                                />
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="date"
                                  value={item.deadline}
                                  onChange={(e) => {
                                    const updated = [...editingNote.items!]
                                    updated[idx].deadline = e.target.value
                                    setEditingNote({ ...editingNote, items: updated })
                                  }}
                                  className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary text-sm"
                                />
                                <select
                                  value={item.priority}
                                  onChange={(e) => {
                                    const updated = [...editingNote.items!]
                                    updated[idx].priority = e.target.value as 'high' | 'medium' | 'low'
                                    setEditingNote({ ...editingNote, items: updated })
                                  }}
                                  className="bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-2 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary text-sm"
                                >
                                  <option value="low">Thấp</option>
                                  <option value="medium">Bình thường</option>
                                  <option value="high">Cao</option>
                                </select>
                                <button
                                  onClick={() => {
                                    const updated = editingNote.items!.filter((_, i) => i !== idx)
                                    setEditingNote({ ...editingNote, items: updated })
                                  }}
                                  className="p-1 hover:bg-red-500/10 rounded text-red-500"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const updated = [...editingNote.items!]
                                  updated[idx].title = e.target.value
                                  setEditingNote({ ...editingNote, items: updated })
                                }}
                                className={`flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                              />
                              <button
                                onClick={() => {
                                  const updated = editingNote.items!.filter((_, i) => i !== idx)
                                  setEditingNote({ ...editingNote, items: updated })
                                }}
                                className="p-1 hover:bg-red-500/10 rounded text-red-500"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const newItem = { id: Date.now().toString(), title: '', deadline: '', priority: 'medium' as const, completed: false }
                        setEditingNote({ ...editingNote, items: [...(editingNote.items || []), newItem] })
                      }}
                      className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                    >
                      {editingNote.type === 'deadline' ? '+ Thêm deadline' : '+ Thêm mục'}
                    </button>
                  </div>
                )}
                {editingNote.type === 'plan' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Lịch học</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {editingNote.schedule?.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => {
                              const updated = [...editingNote.schedule!]
                              updated[idx].date = e.target.value
                              setEditingNote({ ...editingNote, schedule: updated })
                            }}
                            className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary"
                          />
                          <input
                            type="time"
                            value={item.time}
                            onChange={(e) => {
                              const updated = [...editingNote.schedule!]
                              updated[idx].time = e.target.value
                              setEditingNote({ ...editingNote, schedule: updated })
                            }}
                            className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary"
                          />
                          <input
                            type="text"
                            value={item.content}
                            onChange={(e) => {
                              const updated = [...editingNote.schedule!]
                              updated[idx].content = e.target.value
                              setEditingNote({ ...editingNote, schedule: updated })
                            }}
                            placeholder="Nội dung"
                            className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary"
                          />
                          <button
                            onClick={() => {
                              const updated = editingNote.schedule!.filter((_, i) => i !== idx)
                              setEditingNote({ ...editingNote, schedule: updated })
                            }}
                            className="p-1 hover:bg-red-500/10 rounded text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const newItem = { date: '', time: '', content: '' }
                        setEditingNote({ ...editingNote, schedule: [...(editingNote.schedule || []), newItem] })
                      }}
                      className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                    >
                      + Thêm lịch
                    </button>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Tags</label>
                  {editingNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editingNote.tags.map((tag, i) => (
                        <div
                          key={i}
                          className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-purple-600/10 text-primary dark:text-accent text-sm rounded-full font-medium flex items-center gap-2 group"
                        >
                          #{tag}
                          <button
                            onClick={() => setEditingNote({
                              ...editingNote,
                              tags: editingNote.tags.filter((_, index) => index !== i)
                            })}
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Thêm tag mới (nhấn Enter hoặc Dấu phẩy để thêm)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        const tagValue = input.value.replace(',', '').trim()
                        if (tagValue) {
                          const newTag = tagValue
                          if (!editingNote.tags.includes(newTag)) {
                            setEditingNote({ 
                              ...editingNote, 
                              tags: [...editingNote.tags, newTag]
                            })
                          }
                          input.value = ""
                        }
                      }
                    }}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditingNote(null)}
                    className="flex-1 px-4 py-3 border-2 border-border dark:border-slate-700 text-foreground dark:text-white rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleUpdateNote}
                    disabled={!editingNote.title.trim() || (editingNote.type === 'general' ? !editingNote.content.trim() : false)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* View Note Modal */}
      <AnimatePresence>
        {viewingNote && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setViewingNote(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-800 rounded-2xl p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-3xl font-bold text-foreground dark:text-white">{viewingNote.title}</h2>
                    <span className="text-xl">
                      {noteTypes.find(nt => nt.value === viewingNote.type)?.icon}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {viewingNote.course}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(viewingNote.updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const dataStr = JSON.stringify(viewingNote, null, 2)
                      const dataBlob = new Blob([dataStr], { type: 'application/json' })
                      const url = URL.createObjectURL(dataBlob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = `${viewingNote.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      URL.revokeObjectURL(url)
                    }}
                    className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-500 dark:text-blue-400 transition-colors"
                    title="Xuất ghi chú này"
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      toggleFavorite(viewingNote.id)
                      setViewingNote({...viewingNote, isFavorite: !viewingNote.isFavorite})
                    }}
                    className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Star 
                      size={20} 
                      className={viewingNote.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"} 
                    />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingNote(viewingNote)
                      setViewingNote(null)
                    }}
                    className="p-2 hover:bg-primary/10 rounded-lg text-primary dark:text-accent transition-colors"
                  >
                    <Edit3 size={20} />
                  </button>
                  <button 
                    onClick={() => setViewingNote(null)}
                    className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Content based on type */}
              {viewingNote.type === 'general' && (
                <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
                  <p className="text-foreground dark:text-white whitespace-pre-wrap leading-relaxed">
                    {viewingNote.content}
                  </p>
                </div>
              )}

              {(viewingNote.type === 'deadline' || viewingNote.type === 'checklist') && (
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground dark:text-white mb-3">
                    {viewingNote.type === 'deadline' ? '⏰ Các Deadline' : '☑ Các mục kiểm tra'}
                  </h3>
                  <div className="space-y-2">
                    {viewingNote.items?.map((item) => (
                      <div key={item.id} className="p-3 bg-background dark:bg-slate-950/50 rounded-lg">
                        {viewingNote.type === 'deadline' ? (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={(e) => {
                                    const updatedItems = viewingNote.items!.map(i => 
                                      i.id === item.id ? { ...i, completed: e.target.checked } : i
                                    )
                                    const updatedNote = { ...viewingNote, items: updatedItems }
                                    const idx = notes.findIndex(n => n.id === viewingNote.id)
                                    const newNotes = [...notes]
                                    newNotes[idx] = updatedNote
                                    setNotes(newNotes)
                                    setViewingNote(updatedNote)
                                  }}
                                  className="w-5 h-5 rounded cursor-pointer mt-0.5 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground dark:text-white'}`}>
                                    {item.title}
                                  </h4>
                                </div>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0 ${
                                item.priority === 'high' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                                item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              }`}>
                                {item.priority === 'high' ? 'Cao' : item.priority === 'medium' ? 'Bình thường' : 'Thấp'}
                              </span>
                            </div>
                            {item.deadline && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground ml-8">
                                <Calendar size={14} />
                                {formatDate(item.deadline)}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={(e) => {
                                const updatedItems = viewingNote.items!.map(i => 
                                  i.id === item.id ? { ...i, completed: e.target.checked } : i
                                )
                                const updatedNote = { ...viewingNote, items: updatedItems }
                                const idx = notes.findIndex(n => n.id === viewingNote.id)
                                const newNotes = [...notes]
                                newNotes[idx] = updatedNote
                                setNotes(newNotes)
                                setViewingNote(updatedNote)
                              }}
                              className="w-5 h-5 rounded cursor-pointer"
                            />
                            <span className={`flex-1 ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground dark:text-white'}`}>
                              {item.title}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingNote.type === 'plan' && (
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground dark:text-white mb-3">📅 Lịch học</h3>
                  <div className="space-y-2">
                    {viewingNote.schedule?.map((item, idx) => (
                      <div key={idx} className="p-4 bg-background dark:bg-slate-950/50 rounded-lg border-l-4 border-primary">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-primary" />
                            <span className="font-semibold text-foreground dark:text-white">
                              {item.date ? formatDate(item.date) : 'Chưa có ngày'}
                            </span>
                          </div>
                          {item.time && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock size={14} />
                              {item.time}
                            </div>
                          )}
                        </div>
                        {item.content && (
                          <p className="text-foreground dark:text-white ml-6">
                            {item.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingNote.tags.length > 0 && (
                <div className="mb-6 pt-6 border-t border-border dark:border-slate-800">
                  <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Tag size={14} />
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {viewingNote.tags.map((tag, i) => (
                      <span 
                        key={i}
                        className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-purple-600/10 text-primary dark:text-accent text-sm rounded-full font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-border dark:border-slate-800 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Tạo lúc: {formatDate(viewingNote.createdAt)}</span>
                  <span>Cập nhật: {formatDate(viewingNote.updatedAt)}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Tag Confirmation Modal */}
      <AnimatePresence>
        {tagToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setTagToDelete(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-500/10 rounded-full">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground dark:text-white mb-2 text-center">
                Xóa tag?
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Bạn có chắc chắn muốn xóa tag <span className="font-semibold text-foreground">#{tagToDelete}</span>? Các ghi chú sử dụng tag này sẽ vẫn được giữ lại.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTagToDelete(null)}
                  className="flex-1 px-4 py-3 border-2 border-border dark:border-slate-700 text-foreground dark:text-white rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    setNotes(notes.map(note => ({
                      ...note,
                      tags: note.tags.filter(t => t !== tagToDelete)
                    })))
                    setSelectedTags(selectedTags.filter(t => t !== tagToDelete))
                    setTagToDelete(null)
                  }}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}