"use client"
import { useState, useEffect, useCallback } from "react"
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
import { useLanguage } from "@/lib/i18n/language-context"
import { getApiBaseUrl } from "@/lib/api/config"
import { UniversalSelect } from "@/components/ui/universal-select"

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

const noteTypesMeta = [
  { value: 'general', labelKey: 'notes_type_general', labelFallback: 'Ghi chú thường', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300', icon: '📝' },
  { value: 'deadline', labelKey: 'notes_type_deadline', labelFallback: 'Theo dõi deadline', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300', icon: '⏰' },
  { value: 'checklist', labelKey: 'notes_type_checklist', labelFallback: 'Danh sách kiểm tra', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300', icon: '☑' },
  { value: 'plan', labelKey: 'notes_type_plan', labelFallback: 'Kế hoạch học tập', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300', icon: '📅' },
]

export default function NotesPage() {
  const apiUrl = getApiBaseUrl()
  const { user } = useAuth()
  const { t } = useLanguage()
  const noteTypes = noteTypesMeta.map(nt => ({ ...nt, label: t(nt.labelKey, nt.labelFallback) }))
  const token =
  typeof window !== 'undefined'
    ? localStorage.getItem('auth_token')
    : null
  const [notes, setNotes] = useState<Note[]>([
    // {
    //   id: "1",
    //   title: "Next.js App Router",
    //   content: "App Router là cách mới để định tuyến trong Next.js 13+. Sử dụng thư mục app/ thay vì pages/. Hỗ trợ Server Components mặc định, layouts, loading states và error handling tốt hơn.\n\nƯu điểm:\n- Tối ưu hiệu suất với Server Components\n- Nested layouts linh hoạt\n- Streaming và Suspense\n- Data fetching tích hợp",
    //   course: "Lập trình Next.js",
    //   courseId: "1",
    //   lessonTitle: "Bài 5: App Router Architecture",
    //   createdAt: "2025-01-20",
    //   updatedAt: "2025-01-22",
    //   tags: ["routing", "nextjs", "architecture"],
    //   isFavorite: true,
    //   type: "general"
    // },
    // {
    //   id: "2",
    //   title: "Server Components vs Client Components",
    //   content: "Server Components render trên server, giảm bundle size. Client Components cần 'use client' directive.\n\nKhi nào dùng Server Components:\n- Fetch data\n- Access backend trực tiếp\n- Không cần interactivity\n\nKhi nào dùng Client Components:\n- Event handlers\n- useState, useEffect\n- Browser APIs",
    //   course: "Lập trình Next.js",
    //   courseId: "1",
    //   lessonTitle: "Bài 8: Server Components",
    //   createdAt: "2025-01-18",
    //   updatedAt: "2025-01-18",
    //   tags: ["server", "client", "components"],
    //   isFavorite: false,
    //   type: "general"
    // },
    // {
    //   id: "3",
    //   title: "useReducer Pattern",
    //   content: "useReducer phù hợp khi state logic phức tạp. Syntax: const [state, dispatch] = useReducer(reducer, initialState).\n\nReducer là pure function nhận state và action, trả về state mới.",
    //   course: "React Hooks",
    //   courseId: "2",
    //   lessonTitle: "Bài 12: useReducer Hook",
    //   createdAt: "2025-01-15",
    //   updatedAt: "2025-01-16",
    //   tags: ["react", "hooks", "state"],
    //   isFavorite: true,
    //   type: "general"
    // },
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [newNote, setNewNote] = useState({ 
    title: "", 
    content: "", 
    tags: [] as string[], 
    type: 'general' as Note['type'],
    items: [] as { id: string; title: string; deadline: string; priority: 'high' | 'medium' | 'low'; completed: boolean }[],
    schedule: [] as { date: string; time: string; content: string }[]
  })
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [tagToDelete, setTagToDelete] = useState<string | null>(null)
  const [showingFavoritesModal, setShowingFavoritesModal] = useState(false)
  const [favoriteNotes, setFavoriteNotes] = useState<Note[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  const ITEMS_PER_PAGE = 6

  const courses = [...new Set(notes.map(n => n.course))]
  const allTags = [...new Set(notes.flatMap(n => n.tags))].sort()

  const filteredNotes = notes.filter((note) => {
  const title = note.title ?? ""
  const content = note.content ?? ""

  const matchesSearch =
    title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.toLowerCase().includes(searchTerm.toLowerCase())

  const matchesCourse =
    selectedCourse === "all" || note.course === selectedCourse

  const matchesTags =
    selectedTags.length === 0 ||
    selectedTags.some(tag => note.tags?.includes(tag))

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

  const fetchNotes = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)

      const res = await fetch(
        `${apiUrl}/notes/my-notes`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error?.message || t("notes_fetch_error", "Không lấy được ghi chú"))
      }

      setNotes(
        (json.data ?? json).map((n: any) => ({
          id: n.id,
          title: n.title ?? n.content?.split('\n')[0] ?? t('notes_default_title', 'Ghi chú'),
          content: n.content || '',
          course: n.course?.title ?? t('notes_uncategorized', 'Chưa phân loại'),
          courseId: n.course?.id ?? '',
          lessonTitle: n.lesson?.title ?? t('notes_default_title', 'Ghi chú'),
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          tags: [],
          isFavorite: n.isFavorite || false,
          type: n.type || 'general',
          items: n.items || [],
          schedule: n.schedule || [],
        }))
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  const handleCreateNote = async () => {
  try {
    // Validate based on note type
    if (newNote.type === 'general' && !newNote.content?.trim()) {
      console.error(t('notes_general_content_required', 'Ghi chú thường cần có nội dung'));
      return;
    }
    
    if ((newNote.type === 'deadline' || newNote.type === 'checklist') && (!newNote.items || newNote.items.length === 0)) {
      console.error(t('notes_items_required', 'Loại này cần có ít nhất một mục'));
      return;
    }
    
    if (newNote.type === 'plan' && (!newNote.schedule || newNote.schedule.length === 0)) {
      console.error(t('notes_schedule_required', 'Lịch học cần có ít nhất một lịch'));
      return;
    }

    const payload: any = {
      type: newNote.type,
      timestamp: 0,
    };

    // Add content only for general notes
    if (newNote.type === 'general') {
      payload.content = newNote.content;
    }

    // Add items for deadline/checklist
    if ((newNote.type === 'deadline' || newNote.type === 'checklist') && newNote.items?.length > 0) {
      payload.items = newNote.items;
    }

    // Add schedule for plan notes
    if (newNote.type === 'plan' && newNote.schedule?.length > 0) {
      payload.schedule = newNote.schedule;
    }

    const res = await fetch(`${apiUrl}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(t('notes_create_failed', 'Tạo note thất bại'));

    // Fetch lại danh sách để cập nhật
    await fetchNotes();

    setIsCreating(false);
    setNewNote({
      title: '',
      content: '',
      tags: [],
      type: 'general',
      items: [],
      schedule: [],
    });
  } catch (err) {
    console.error(err);
  }
};

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    // Validate based on note type
    if (editingNote.type === 'general' && !editingNote.content?.trim()) {
      console.error(t('notes_general_content_required', 'Ghi chú thường cần có nội dung'));
      return;
    }
    
    if ((editingNote.type === 'deadline' || editingNote.type === 'checklist') && (!editingNote.items || editingNote.items.length === 0)) {
      console.error(t('notes_items_required', 'Loại này cần có ít nhất một mục'));
      return;
    }
    
    if (editingNote.type === 'plan' && (!editingNote.schedule || editingNote.schedule.length === 0)) {
      console.error(t('notes_schedule_required', 'Lịch học cần có ít nhất một lịch'));
      return;
    }

    try {
      const payload: any = {
        type: editingNote.type,
      };

      // Add content only for general notes
      if (editingNote.type === 'general') {
        payload.content = editingNote.content;
      }

      // Add items for deadline/checklist
      if ((editingNote.type === 'deadline' || editingNote.type === 'checklist') && (editingNote.items ?? []).length > 0) {
        payload.items = editingNote.items;
      }

      // Add schedule for plan notes
      if (editingNote.type === 'plan' && (editingNote.schedule ?? []).length > 0) {
        payload.schedule = editingNote.schedule;
      }

      const res = await fetch(
        `${apiUrl}/notes/${editingNote.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error(t('notes_update_failed', 'Cập nhật note thất bại'));

      // Fetch lại danh sách để cập nhật
      await fetchNotes();
      setEditingNote(null)
    } catch (err) {
      console.error(err);
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(
        `${apiUrl}/notes/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error(t('notes_delete_failed', 'Xóa note thất bại'));

      setNotes(notes.filter(n => n.id !== id))
      if (viewingNote?.id === id) setViewingNote(null)
      if (editingNote?.id === id) setEditingNote(null)
    } catch (err) {
      console.error(err);
    }
  }

  const toggleFavorite = (id: string) => {
    setNotes(notes.map(n => 
      n.id === id ? { ...n, isFavorite: !n.isFavorite } : n
    ))
  }

 const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—'

  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'

  return d.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
  const handleExportNotes = () => {
    const notesToExport = filteredNotes.length > 0 ? filteredNotes : notes
    const dataStr = JSON.stringify(notesToExport, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `notes-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportToExcel = async () => {
    try {
      const res = await fetch(
        `${apiUrl}/notes/export/excel`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) {
        throw new Error(t('notes_export_failed', 'Xuất Excel thất bại'))
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `notes-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Export error:', err)
    }
  }

  const handleExportSingleNoteToExcel = async (noteId: string) => {
    try {
      const res = await fetch(
        `${apiUrl}/notes/${noteId}/export/excel`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) {
        throw new Error(t('notes_export_failed', 'Xuất Excel thất bại'))
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `notes-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Export error:', err)
    }
  }

  const fetchFavorites = useCallback(async () => {
    if (!token) return
    try {
      setLoadingFavorites(true)
      const res = await fetch(
        `${apiUrl}/notes/favorites`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error?.message || t("notes_fetch_fav_error", "Không lấy được ghi chú yêu thích"))
      }

      setFavoriteNotes(
        (json.data ?? json).map((n: any) => ({
          id: n.id,
          title: n.title ?? n.content?.split('\n')[0] ?? t('notes_default_title', 'Ghi chú'),
          content: n.content || '',
          course: n.course?.title ?? t('notes_uncategorized', 'Chưa phân loại'),
          courseId: n.course?.id ?? '',
          lessonTitle: n.lesson?.title ?? t('notes_default_title', 'Ghi chú'),
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          tags: [],
          isFavorite: n.isFavorite || true,
          type: n.type || 'general',
          items: n.items || [],
          schedule: n.schedule || [],
        }))
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingFavorites(false)
    }
  }, [token])

  const handleToggleFavorite = async (noteId: string) => {
    try {
      const res = await fetch(
        `${apiUrl}/notes/${noteId}/toggle-favorite`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) throw new Error(t('notes_toggle_fav_failed', 'Thay đổi yêu thích thất bại'))

      // Update local state
      setNotes(notes.map(n => 
        n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
      ))

      // Refresh favorites if modal is open
      if (showingFavoritesModal) {
        await fetchFavorites()
      }
    } catch (err: any) {
      console.error('Toggle favorite error:', err)
    }
  }

  const handleShowFavorites = async () => {
    setShowingFavoritesModal(true)
    await fetchFavorites()
  }

useEffect(() => {
  fetchNotes()
}, [fetchNotes])

  return (
    <div className="relative space-y-6">
      <motion.div
        aria-hidden
        animate={{ opacity: [0.2, 0.33, 0.2], y: [0, -14, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-12 top-8 h-64 w-64 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-900/20"
      />
      <motion.div
        aria-hidden
        animate={{ opacity: [0.2, 0.3, 0.2], y: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-900/20"
      />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="bg-gradient-to-r from-cyan-600 via-sky-600 to-emerald-500 bg-clip-text text-3xl font-bold text-transparent">
              {t("notes_title", "Ghi chú của tôi")}
            </h1>
            <p className="text-muted-foreground dark:text-slate-400 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <StickyNote size={16} />
                {notes.length} {t("notes_count_label", "ghi chú")}
              </span>
              <span className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500" />
                {notes.filter(n => n.isFavorite).length} {t("notes_favorites", "yêu thích")}
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleShowFavorites}
              title={t("notes_view_fav", "Xem ghi chú yêu thích")}
              className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
            >
              <Star size={20} />
              <span className="hidden sm:inline">{t("notes_fav_btn", "Yêu thích")}</span>
            </button>
            <button 
              onClick={handleExportToExcel}
              title={t("notes_export_excel", "Xuất ra file Excel")}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
            >
              <Download size={20} />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-emerald-600 px-6 py-3 font-medium text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30"
            >
              <Plus size={20} />
              {t("notes_new", "Ghi chú mới")}
            </button>
          </div>
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
            placeholder={t("notes_search", "Tìm kiếm ghi chú...")}
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
          <span className="text-sm font-medium text-muted-foreground pt-2">{t("notes_tags", "Tags:")}</span>
          <div className="flex flex-wrap gap-2 flex-1">
            {allTags.map((tag, index) => (
  <div key={`${tag}-${index}`} className="relative group">
                <button
                  onClick={() => handleTagSelect(tag)}
                  className={`px-3.5 py-1.5 rounded-full font-medium text-sm transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-lg'
                      : 'bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 text-foreground dark:text-white hover:border-primary dark:hover:border-accent'
                  }`}
                >
                  #{tag}
                </button>
                <button
                  onClick={() => setTagToDelete(tag)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                  title={t("notes_delete_tag", "Xóa tag")}
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
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30'
                : 'bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 text-muted-foreground cursor-not-allowed opacity-50'
            }`}
            title={t("notes_clear_all_filters", "Xóa tất cả bộ lọc")}
          >
            <X size={20} />
            {t("notes_clear_all", "Xóa tất cả")}
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
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/10">
            <StickyNote size={40} className="text-primary dark:text-accent" />
          </div>
          <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">
            {searchTerm || selectedCourse !== "all" ? t("notes_not_found", "Không tìm thấy ghi chú") : t("notes_empty", "Chưa có ghi chú nào")}
          </h3>
          <p className="text-muted-foreground dark:text-slate-400 mb-6">
            {searchTerm || selectedCourse !== "all" 
              ? t("notes_try_different", "Thử thay đổi từ khóa hoặc bộ lọc") 
              : t("notes_create_hint", "Tạo ghi chú để lưu lại những điều quan trọng trong quá trình học")}
          </p>
          {!searchTerm && selectedCourse === "all" && (
            <button 
              onClick={() => setIsCreating(true)}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-6 py-3 font-medium text-white transition-all hover:shadow-lg"
            >
              {t("notes_create_first", "Tạo ghi chú đầu tiên")}
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
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(note.id)
                    }}
                    className="p-2 hover:bg-yellow-500/20 rounded-lg transition-all"
                    title={t("notes_add_fav", "Thêm vào yêu thích")}
                  >
                    <Star 
                      size={20} 
                      className={note.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground hover:text-yellow-500"} 
                    />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingNote(note)
                    }}
                    className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-500 dark:text-blue-400 transition-all"
                    title={t("notes_edit", "Chỉnh sửa")}
                  >
                    <Edit3 size={20} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteNote(note.id)
                    }}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 dark:text-red-400 transition-all hover:scale-110"
                    title={t("notes_delete", "Xóa")}
                  >
                    <Trash2 size={22} className="font-bold" />
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
                    <span className="font-medium">{note.items?.length || 0} {note.type === 'deadline' ? t('notes_deadline_items', 'deadline') : t('notes_items', 'mục')}</span>
                    {note.items && note.items.length > 0 && (
                      <span className="text-xs">({note.items.filter(i => i.completed).length} {t('notes_done', 'hoàn thành')})</span>
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
                      <div className="text-xs text-muted-foreground">+{note.items.length - 2} {t('notes_more', 'thêm')}</div>
                    )}
                  </div>
                </div>
              )}
              {note.type === 'plan' && (
                <div className="mb-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-2">
                    <span className="font-medium">{note.schedule?.length || 0} {t('notes_schedules', 'lịch')}</span>
                  </div>
                  <div className="space-y-1">
                    {note.schedule?.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="text-xs line-clamp-1 text-foreground dark:text-white">
                        <span className="font-medium">{item.date ? formatDate(item.date) : t('notes_no_date', 'Chưa có ngày')}</span>
                        {item.time && <span className="text-muted-foreground"> • {item.time}</span>}
                      </div>
                    ))}
                    {note.schedule && note.schedule.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{note.schedule.length - 2} {t('notes_more', 'thêm')}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {(note.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {note.tags.slice(0, 3).map((tag, i) => (
                    <span 
                      key={i}
                      className="rounded-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 px-2.5 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300"
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
                  <h2 className="text-2xl font-bold text-foreground dark:text-white">{t("notes_create_title", "Tạo ghi chú mới")}</h2>
                  <p className="text-sm text-muted-foreground">{t("notes_create_desc", "Lưu lại những điều quan trọng")}</p>
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
                  placeholder={t("notes_title_placeholder", "Tiêu đề ghi chú...")}
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors text-lg font-semibold"
                />
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">{t("notes_type_label", "Loại ghi chú")}</label>
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
                    placeholder={t("notes_content_placeholder", "Viết nội dung ghi chú của bạn...")}
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors h-48 resize-none"
                  />
                )}
                {(newNote.type === 'deadline' || newNote.type === 'checklist') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">
                      {newNote.type === 'deadline' ? t('notes_deadlines', 'Các deadline') : t('notes_checklist_items', 'Các mục kiểm tra')}
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
                                  placeholder={t("notes_task_name", "Tên công việc")}
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
                                <UniversalSelect
                                  value={item.priority}
                                  onChange={(e) => {
                                    const updated = [...newNote.items!]
                                    updated[idx].priority = e.target.value as 'high' | 'medium' | 'low'
                                    setNewNote({ ...newNote, items: updated })
                                  }}
                                  className="bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-2 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary text-sm"
                                >
                                  <option value="low">{t("notes_priority_low", "Thấp")}</option>
                                  <option value="medium">{t("notes_priority_medium", "Bình thường")}</option>
                                  <option value="high">{t("notes_priority_high", "Cao")}</option>
                                </UniversalSelect>
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
                      {newNote.type === 'deadline' ? t('notes_add_deadline', '+ Thêm deadline') : t('notes_add_item', '+ Thêm mục')}
                    </button>
                  </div>
                )}
                {newNote.type === 'plan' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">{t("notes_schedule_label", "Lịch học")}</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {newNote.schedule?.map((item, idx) => (
                        <div key={`schedule-${idx}-${item.date}-${item.time}`} className="flex gap-2 items-end">
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
                            placeholder={t("notes_content_label", "Nội dung")}
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
                      {t('notes_add_schedule', '+ Thêm lịch')}
                    </button>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('notes_tags_plain', 'Tags')}</label>
                  {newNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {newNote.tags.map((tag, i) => (
                        <div
                          key={`new-tag-${i}-${tag}`}
                          className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 px-3 py-1.5 text-sm font-medium text-cyan-700 dark:text-cyan-300"
                        >
                          #{tag}
                          <button
                            onClick={() => setNewNote({
                              ...newNote,
                              tags: newNote.tags.filter((_, index) => index !== i)
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
                    placeholder={t("notes_add_tag", "Thêm tag mới (nhấn Enter hoặc Dấu phẩy để thêm)")}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        const tagValue = input.value.replace(',', '').trim()
                        if (tagValue) {
                          if (!newNote.tags.includes(tagValue)) {
                            setNewNote({ 
                              ...newNote, 
                              tags: [...newNote.tags, tagValue]
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
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-4 py-3 border-2 border-border dark:border-slate-700 text-foreground dark:text-white rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-all hover:shadow-md"
                  >
                    {t('notes_cancel', 'Hủy')}
                  </button>
                  <button 
                    onClick={handleCreateNote}
                    disabled={!newNote.title.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold hover:shadow-xl shadow-lg shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save size={22} />
                    {t('notes_save', 'Lưu ghi chú')}
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
                  <h2 className="text-2xl font-bold text-foreground dark:text-white">{t("notes_edit_title", "Chỉnh sửa ghi chú")}</h2>
                  <p className="text-sm text-muted-foreground">{t("notes_edit_desc", "Cập nhật nội dung của bạn")}</p>
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
                  placeholder={t("notes_title_placeholder", "Tiêu đề ghi chú...")}
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors text-lg font-semibold"
                />
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">{t("notes_type_label", "Loại ghi chú")}</label>
                  <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{
                    backgroundColor: noteTypes.find(nt => nt.value === editingNote.type)?.color?.split(' ')[0],
                  }}>
                    {noteTypes.find(nt => nt.value === editingNote.type)?.icon} {noteTypes.find(nt => nt.value === editingNote.type)?.label}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{t("notes_type_locked", "Không thể thay đổi loại ghi chú khi chỉnh sửa")}</p>
                </div>
                {editingNote.type === 'general' && (
                  <textarea
                    placeholder={t("notes_content_placeholder", "Viết nội dung ghi chú của bạn...")}
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border-2 border-border dark:border-slate-800 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors h-48 resize-none"
                  />
                )}
                {(editingNote.type === 'deadline' || editingNote.type === 'checklist') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">
                      {editingNote.type === 'deadline' ? t('notes_deadlines', 'Các deadline') : t('notes_checklist_items', 'Các mục kiểm tra')}
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
                                  placeholder={t("notes_task_name", "Tên công việc")}
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
                                <UniversalSelect
                                  value={item.priority}
                                  onChange={(e) => {
                                    const updated = [...editingNote.items!]
                                    updated[idx].priority = e.target.value as 'high' | 'medium' | 'low'
                                    setEditingNote({ ...editingNote, items: updated })
                                  }}
                                  className="bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-2 py-1.5 border border-border dark:border-slate-800 focus:outline-none focus:border-primary text-sm"
                                >
                                  <option value="low">{t("notes_priority_low", "Thấp")}</option>
                                  <option value="medium">{t("notes_priority_medium", "Bình thường")}</option>
                                  <option value="high">{t("notes_priority_high", "Cao")}</option>
                                </UniversalSelect>
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
                      {editingNote.type === 'deadline' ? t('notes_add_deadline', '+ Thêm deadline') : t('notes_add_item', '+ Thêm mục')}
                    </button>
                  </div>
                )}
                {editingNote.type === 'plan' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">{t("notes_schedule_label", "Lịch học")}</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {editingNote.schedule?.map((item, idx) => (
                        <div key={`edit-schedule-${idx}-${item.date}-${item.time}`} className="flex gap-2 items-end">
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
                            placeholder={t("notes_content_label", "Nội dung")}
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
                      {t('notes_add_schedule', '+ Thêm lịch')}
                    </button>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('notes_tags_plain', 'Tags')}</label>
                  {(editingNote.tags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editingNote.tags?.map((tag, i) => (
                        <div
                          key={`edit-tag-${i}-${tag}`}
                          className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 px-3 py-1.5 text-sm font-medium text-cyan-700 dark:text-cyan-300"
                        >
                          #{tag}
                          <button
                            onClick={() => setEditingNote({
                              ...editingNote,
                              tags: (editingNote.tags ?? []).filter((_, index) => index !== i)
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
                    placeholder={t("notes_add_tag", "Thêm tag mới (nhấn Enter hoặc Dấu phẩy để thêm)")}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        const tagValue = input.value.replace(',', '').trim()
                        if (tagValue) {
                          const newTag = tagValue
                          if (!(editingNote.tags ?? []).includes(newTag)) {
                            setEditingNote({ 
                              ...editingNote, 
                              tags: [...(editingNote.tags ?? []), newTag]
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
                    className="flex-1 px-4 py-3 border-2 border-border dark:border-slate-700 text-foreground dark:text-white rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-all hover:shadow-md"
                  >
                    {t('notes_cancel', 'Hủy')}
                  </button>
                  <button 
                    onClick={handleUpdateNote}
                    disabled={!editingNote.title.trim() || (editingNote.type === 'general' ? !editingNote.content.trim() : false)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-bold hover:shadow-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Edit3 size={22} />
                    {t('notes_update', 'Cập nhật')}
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
                    onClick={() => handleExportSingleNoteToExcel(viewingNote.id)}
                    className="p-2 hover:bg-green-500/20 rounded-lg text-green-500 dark:text-green-400 transition-all hover:scale-110"
                    title={t("notes_export_note_excel", "Xuất ghi chú này ra file Excel")}
                  >
                    <Download size={22} />
                  </button>
                  <button 
                    onClick={() => {
                      toggleFavorite(viewingNote.id)
                      setViewingNote({...viewingNote, isFavorite: !viewingNote.isFavorite})
                    }}
                    className="p-2 hover:bg-yellow-500/20 rounded-lg transition-all"
                    title={t("notes_add_fav", "Thêm vào yêu thích")}
                  >
                    <Star 
                      size={22} 
                      className={viewingNote.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground hover:text-yellow-500"} 
                    />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingNote(viewingNote)
                      setViewingNote(null)
                    }}
                    className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-500 dark:text-blue-400 transition-all hover:scale-110"
                    title={t("notes_edit", "Chỉnh sửa")}
                  >
                    <Edit3 size={22} />
                  </button>
                  <button 
                    onClick={() => setViewingNote(null)}
                    className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-all"
                    title={t("notes_close", "Đóng")}
                  >
                    <X size={22} className="text-muted-foreground" />
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
                    {viewingNote.type === 'deadline' ? `⏰ ${t('notes_deadlines', 'Các deadline')}` : `☑ ${t('notes_type_checklist', 'Danh sách kiểm tra')}`}
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
                                {item.priority === 'high' ? t('notes_priority_high', 'Cao') : item.priority === 'medium' ? t('notes_priority_medium', 'Bình thường') : t('notes_priority_low', 'Thấp')}
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
                  <h3 className="font-semibold text-foreground dark:text-white mb-3">📅 {t('notes_schedule_label', 'Lịch học')}</h3>
                  <div className="space-y-2">
                    {viewingNote.schedule?.map((item, idx) => (
                      <div key={`view-schedule-${idx}-${item.date}-${item.time}`} className="p-4 bg-background dark:bg-slate-950/50 rounded-lg border-l-4 border-primary">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-primary" />
                            <span className="font-semibold text-foreground dark:text-white">
                              {item.date ? formatDate(item.date) : t('notes_no_date', 'Chưa có ngày')}
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

              {(viewingNote.tags?.length ?? 0) > 0 && (
                <div className="mb-6 pt-6 border-t border-border dark:border-slate-800">
                  <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Tag size={14} />
                    {t('notes_tags_plain', 'Tags')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {viewingNote.tags?.map((tag, i) => (
                      <span 
                        key={`view-tag-${i}-${tag}`}
                        className="rounded-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 px-3 py-1.5 text-sm font-medium text-cyan-700 dark:text-cyan-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-border dark:border-slate-800 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>{t("notes_created_at", "Tạo lúc")}: {formatDate(viewingNote.createdAt)}</span>
                  <span>{t("notes_updated_at", "Cập nhật")}: {formatDate(viewingNote.updatedAt)}</span>
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
                {t('notes_delete_tag_title', 'Xóa tag?')}
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {t('notes_delete_tag_confirm', 'Bạn có chắc chắn muốn xóa tag')} <span className="font-semibold text-foreground">#{tagToDelete}</span>? {t('notes_delete_tag_keep_notes', 'Các ghi chú sử dụng tag này sẽ vẫn được giữ lại.')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTagToDelete(null)}
                  className="flex-1 px-4 py-3 border-2 border-border dark:border-slate-700 text-foreground dark:text-white rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                >
                  {t('notes_cancel', 'Hủy')}
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
                  {t('notes_delete', 'Xóa')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Favorites Modal */}
      <AnimatePresence>
        {showingFavoritesModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowingFavoritesModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 border-b border-border dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star size={28} className="text-yellow-500" />
                  <div>
                    <h3 className="text-xl font-bold text-foreground dark:text-white">
                      {t('notes_favorites_title', 'Ghi chú yêu thích')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {loadingFavorites ? t('notes_loading_short', 'Đang tải...') : `${favoriteNotes.length} ${t('notes_count_label', 'ghi chú')}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowingFavoritesModal(false)}
                  className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={24} className="text-muted-foreground" />
                </button>
              </div>

              <div className="p-6">
                {loadingFavorites ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                    <p className="mt-4 text-muted-foreground">{t("notes_loading_fav", "Đang tải ghi chú yêu thích...")}</p>
                  </div>
                ) : favoriteNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <Star size={48} className="mx-auto text-yellow-500/30 mb-4" />
                    <p className="text-lg text-muted-foreground">
                      {t('notes_no_favorites', 'Bạn chưa có ghi chú yêu thích nào')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t('notes_no_favorites_hint', 'Nhấp vào biểu tượng sao để thêm ghi chú vào yêu thích')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {favoriteNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-secondary/50 dark:bg-slate-800/50 hover:bg-secondary dark:hover:bg-slate-800 rounded-xl border border-border dark:border-slate-700 cursor-pointer transition-all group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">
                                {note.type === 'general' ? '📝' : note.type === 'deadline' ? '⏰' : note.type === 'checklist' ? '☑' : '📅'}
                              </span>
                              <h4 className="font-semibold text-foreground dark:text-white truncate">
                                {note.title}
                              </h4>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {note.content || `${note.items?.length || 0} ${t('notes_items', 'mục')}` || `${note.schedule?.length || 0} ${t('notes_schedules', 'lịch')}`}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {note.course && (
                                <span className="px-2 py-1 bg-primary/10 rounded-md">
                                  📚 {note.course}
                                </span>
                              )}
                              {note.lessonTitle && (
                                <span className="px-2 py-1 bg-secondary/50 rounded-md">
                                  🎯 {note.lessonTitle}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setViewingNote(note)}
                              className="p-2 hover:bg-background dark:hover:bg-slate-900 rounded-lg transition-colors"
                              title={t("notes_view_detail", "Xem chi tiết")}
                            >
                              <BookOpen size={18} className="text-primary" />
                            </button>
                            <button
                              onClick={() => handleToggleFavorite(note.id)}
                              className="p-2 hover:bg-background dark:hover:bg-slate-900 rounded-lg transition-colors"
                              title={t("notes_remove_fav", "Bỏ khỏi yêu thích")}
                            >
                              <Star size={18} className="text-yellow-500 fill-yellow-500" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}