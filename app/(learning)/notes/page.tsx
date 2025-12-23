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
  Clock
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
}

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
      isFavorite: true
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
      isFavorite: false
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
      isFavorite: true
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" })
  const [viewingNote, setViewingNote] = useState<Note | null>(null)

  const courses = [...new Set(notes.map(n => n.course))]

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCourse = selectedCourse === "all" || note.course === selectedCourse
    return matchesSearch && matchesCourse
  })

  const handleCreateNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        title: newNote.title,
        content: newNote.content,
        course: "Lập trình Next.js",
        courseId: "1",
        lessonTitle: "Ghi chú tự do",
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        tags: newNote.tags.split(",").map(t => t.trim()).filter(t => t),
        isFavorite: false
      }
      setNotes([note, ...notes])
      setNewNote({ title: "", content: "", tags: "" })
      setIsCreating(false)
    }
  }

  const handleUpdateNote = () => {
    if (editingNote && editingNote.title.trim() && editingNote.content.trim()) {
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
            placeholder="Tìm kiếm ghi chú, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card dark:bg-slate-900/60 border-2 border-border dark:border-slate-800 text-foreground dark:text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-muted-foreground" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-card dark:bg-slate-900/60 border-2 border-border dark:border-slate-800 text-foreground dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors min-w-[200px]"
          >
            <option value="all">Tất cả khóa học</option>
            {courses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>
      </motion.div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note, idx) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl hover:shadow-primary/10 dark:hover:shadow-accent/10 transition-all group cursor-pointer"
              onClick={() => setViewingNote(note)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-foreground dark:text-white line-clamp-1 flex-1 group-hover:text-primary dark:group-hover:text-accent transition-colors">
                  {note.title}
                </h3>
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

              <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                {note.content}
              </p>

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
                <textarea
                  placeholder="Viết nội dung ghi chú của bạn..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors h-48 resize-none"
                />
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
                    disabled={!newNote.title.trim() || !newNote.content.trim()}
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
              className="bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl"
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
                <textarea
                  placeholder="Viết nội dung ghi chú của bạn..."
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors h-48 resize-none"
                />
                <input
                  type="text"
                  placeholder="Tags (phân cách bằng dấu phẩy)"
                  value={editingNote.tags.join(", ")}
                  onChange={(e) => setEditingNote({ 
                    ...editingNote, 
                    tags: e.target.value.split(",").map(t => t.trim()).filter(t => t)
                  })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors"
                />
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditingNote(null)}
                    className="flex-1 px-4 py-3 border-2 border-border dark:border-slate-700 text-foreground dark:text-white rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleUpdateNote}
                    disabled={!editingNote.title.trim() || !editingNote.content.trim()}
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
                  <h2 className="text-3xl font-bold text-foreground dark:text-white mb-2">{viewingNote.title}</h2>
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

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-foreground dark:text-white whitespace-pre-wrap leading-relaxed">
                  {viewingNote.content}
                </p>
              </div>

              {viewingNote.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border dark:border-slate-800">
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

              <div className="mt-6 pt-6 border-t border-border dark:border-slate-800 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Tạo lúc: {formatDate(viewingNote.createdAt)}</span>
                  <span>Cập nhật: {formatDate(viewingNote.updatedAt)}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
