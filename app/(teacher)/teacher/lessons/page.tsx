"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff, Loader2, Video, FileText, BookOpen, ChevronDown, X, Check } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { UniversalSelect } from "@/components/ui/universal-select"

interface Course {
  id: string
  title: string
  status: string
}

interface Lesson {
  id: string
  title: string
  description: string
  type: "video" | "article" | "quiz" | "assignment" | "resource"
  duration: number
  order: number
  isFree: boolean
  isPublished: boolean
  courseId: string
}

const LESSON_TYPES_BASE = [
  { value: "video", label: "Video", icon: Video },
  { value: "article", labelKey: "tch_lsn_article", label: "Bài viết", icon: FileText },
  { value: "resource", labelKey: "tch_lsn_resource", label: "Tài liệu", icon: BookOpen },
]

const getAuth = ( ): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function TeacherLessonsPage() {
  const { t } = useLanguage()
  const LESSON_TYPES = LESSON_TYPES_BASE.map((lt) => ({ ...lt, label: lt.labelKey ? t(lt.labelKey, lt.label) : lt.label }))
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    type: "video" as Lesson["type"],
    isFree: false,
  })

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/courses/teacher/my-courses", { headers: getAuth() })
        if (!res.ok) return
        const data = await res.json()
        const list: Course[] = Array.isArray(data) ? data : data.data || []
        setCourses(list)
        if (list.length > 0) setSelectedCourseId(list[0].id)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoadingCourses(false)
      }
    }
    fetchCourses()
  }, [])

  useEffect(() => {
    if (!selectedCourseId) return
    const fetchLessons = async () => {
      setIsLoadingLessons(true)
      try {
        const res = await fetch(`/lessons/course/${selectedCourseId}`, { headers: getAuth() })
        if (!res.ok) return
        const data = await res.json()
        const list: Lesson[] = Array.isArray(data) ? data : data.data || []
        setLessons(list.sort((a, b) => a.order - b.order))
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoadingLessons(false)
      }
    }
    fetchLessons()
  }, [selectedCourseId])

  const handleAddLesson = async () => {
    if (!newLesson.title.trim()) { toast.error(t("tch_lsn_enter_name", "Vui lòng nhập tên bài học")); return }
    setIsSaving(true)
    try {
      const res = await fetch("/lessons", {
        method: "POST",
        headers: { ...getAuth(), "Content-Type": "application/json" },
        body: JSON.stringify({ title: newLesson.title, description: newLesson.description, type: newLesson.type, courseId: selectedCourseId, isFree: newLesson.isFree, isPublished: false }),
      })
      if (!res.ok) throw new Error(t("tch_lsn_create_fail", "Tạo bài học thất bại"))
      const lesson: Lesson = await res.json()
      setLessons((prev) => [...prev, lesson])
      setNewLesson({ title: "", description: "", type: "video", isFree: false })
      setShowAddModal(false)
      toast.success(t("tch_lsn_added", "Đã thêm bài học thành công!"))
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("tch_lsn_error", "Đã xảy ra lỗi"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateLesson = async () => {
    if (!editingLesson) return
    setIsSaving(true)
    try {
      const res = await fetch(`/lessons/${editingLesson.id}`, {
        method: "PATCH",
        headers: { ...getAuth(), "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingLesson.title, description: editingLesson.description, type: editingLesson.type, isFree: editingLesson.isFree }),
      })
      if (!res.ok) throw new Error(t("tch_lsn_update_fail", "Cập nhật thất bại"))
      const updated: Lesson = await res.json()
      setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      setEditingLesson(null)
      toast.success(t("tch_lsn_updated", "Đã cập nhật bài học!"))
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("tch_lsn_error", "Đã xảy ra lỗi"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteLesson = async (id: string) => {
    if (!confirm(t("tch_lsn_confirm_del", "Bạn có chắc muốn xóa bài học này?"))) return
    try {
      const res = await fetch(`/lessons/${id}`, { method: "DELETE", headers: getAuth() })
      if (!res.ok) throw new Error()
      setLessons((prev) => prev.filter((l) => l.id !== id))
      toast.success(t("tch_lsn_deleted", "Đã xóa bài học!"))
    } catch { toast.error(t("tch_lsn_del_fail", "Xóa bài học thất bại")) }
  }

  const handleTogglePublish = async (lesson: Lesson) => {
    try {
      const res = await fetch(`/lessons/${lesson.id}/publish`, { method: "PATCH", headers: getAuth() })
      if (!res.ok) throw new Error()
      const updated: Lesson = await res.json()
      setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      toast.success(updated.isPublished ? t("tch_lsn_published", "Đã công bố bài học") : t("tch_lsn_hidden", "Đã ẩn bài học"))
    } catch { toast.error(t("tch_lsn_status_fail", "Cập nhật trạng thái thất bại")) }
  }

  const handleDragStart = (id: string) => setDraggedId(id)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) { setDraggedId(null); return }
    const newLessons = [...lessons]
    const fromIdx = newLessons.findIndex((l) => l.id === draggedId)
    const toIdx = newLessons.findIndex((l) => l.id === targetId)
    const [moved] = newLessons.splice(fromIdx, 1)
    newLessons.splice(toIdx, 0, moved)
    const reordered = newLessons.map((l, i) => ({ ...l, order: i + 1 }))
    setLessons(reordered)
    setDraggedId(null)
    try {
      await fetch(`/lessons/course/${selectedCourseId}/reorder`, {
        method: "POST",
        headers: { ...getAuth(), "Content-Type": "application/json" },
        body: JSON.stringify({ lessonIds: reordered.map((l) => l.id) }),
      })
    } catch { toast.error(t("tch_lsn_reorder_fail", "Lưu thứ tự thất bại")) }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return "—"
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const getTypeIcon = (type: string) => {
    if (type === "video") return <Video size={16} className="text-blue-500" />
    if (type === "article") return <FileText size={16} className="text-green-500" />
    return <BookOpen size={16} className="text-purple-500" />
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">{t("tch_lsn_title", "Quản lý bài học")}</h1>
          <p className="text-muted-foreground dark:text-slate-400 mt-1">{t("tch_lsn_subtitle", "Kéo và thả để sắp xếp thứ tự bài học")}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={!selectedCourseId}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth disabled:opacity-50"
        >
          <Plus size={20} /> {t("tch_lsn_add", "Thêm bài học")}
        </button>
      </div>

      {/* Course Selector */}
      <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4">
        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{t("tch_lsn_select_course", "Chọn khóa học")}</label>
        {isLoadingCourses ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 size={16} className="animate-spin" /> Đang tải...</div>
        ) : (
          <div className="relative">
            <UniversalSelect
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-10"
            >
              <option value="">{t("tch_lsn_select_course_ph", "-- Chọn khóa học --")}</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </UniversalSelect>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      {/* Lessons List */}
      {isLoadingLessons ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : lessons.length === 0 && selectedCourseId ? (
        <div className="text-center py-16 text-muted-foreground dark:text-slate-400">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">{t("tch_lsn_no_lessons", "Khóa học này chưa có bài học nào")}</p>
          <button onClick={() => setShowAddModal(true)} className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium">{t("tch_lsn_add_first", "Thêm bài học đầu tiên")}</button>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              draggable
              onDragStart={() => handleDragStart(lesson.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(lesson.id)}
              className={`bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl p-4 flex items-center gap-4 cursor-move transition-all ${draggedId === lesson.id ? "opacity-40 scale-95" : "hover:shadow-md"}`}
            >
              <GripVertical size={20} className="text-muted-foreground dark:text-slate-500 cursor-grab flex-shrink-0" />
              <div className="w-8 h-8 rounded-full bg-secondary dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-foreground dark:text-white flex-shrink-0">{lesson.order}</div>
              {getTypeIcon(lesson.type)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground dark:text-white truncate">{lesson.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground dark:text-slate-400 capitalize">{lesson.type}</span>
                  {lesson.duration > 0 && <span className="text-xs text-muted-foreground dark:text-slate-400">{formatDuration(lesson.duration)}</span>}
                  {lesson.isFree && <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">{t("tch_lsn_free", "Miễn phí")}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleTogglePublish(lesson)}
                  className={`p-2 rounded-lg transition-smooth ${lesson.isPublished ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200" : "bg-secondary dark:bg-slate-800 text-muted-foreground hover:bg-secondary/80"}`}
                  title={lesson.isPublished ? t("tch_lsn_hide", "Ẩn bài học") : t("tch_lsn_publish", "Công bố bài học")}
                >
                  {lesson.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => setEditingLesson(lesson)} className="p-2 rounded-lg bg-secondary dark:bg-slate-800 text-foreground dark:text-white hover:bg-secondary/80 transition-smooth"><Edit2 size={16} /></button>
                <button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-smooth"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border dark:border-slate-700">
              <h3 className="text-lg font-semibold text-foreground dark:text-white">{t("tch_lsn_add_new", "Thêm bài học mới")}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-1">{t("tch_lsn_lbl_name", "Tên bài học *")}</label>
                <input type="text" value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} placeholder={t("tch_lsn_ph_name", "Nhập tên bài học")} className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-1">{t("tch_lsn_lbl_desc", "Mô tả")}</label>
                <textarea value={newLesson.description} onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })} placeholder={t("tch_lsn_ph_desc", "Mô tả ngắn về bài học")} rows={3} className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-1">{t("tch_lsn_lbl_type", "Loại bài học")}</label>
                <div className="flex gap-2">
                  {LESSON_TYPES.map(({ value, label, icon: Icon }) => (
                    <button key={value} onClick={() => setNewLesson({ ...newLesson, type: value as Lesson["type"] })} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-smooth ${newLesson.type === value ? "border-primary bg-primary/10 text-primary" : "border-border dark:border-slate-700 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"}`}><Icon size={16} />{label}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isFree" checked={newLesson.isFree} onChange={(e) => setNewLesson({ ...newLesson, isFree: e.target.checked })} className="w-4 h-4 rounded" />
                <label htmlFor="isFree" className="text-sm text-foreground dark:text-white">{t("tch_lsn_free_preview", "Bài học miễn phí (xem trước)")}</label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border dark:border-slate-700">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800">{t("tch_lsn_cancel", "Hủy")}</button>
              <button onClick={handleAddLesson} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium disabled:opacity-60">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} {t("tch_lsn_add", "Thêm bài học")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border dark:border-slate-700">
              <h3 className="text-lg font-semibold text-foreground dark:text-white">{t("tch_lsn_edit", "Chỉnh sửa bài học")}</h3>
              <button onClick={() => setEditingLesson(null)} className="p-1 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-1">{t("tch_lsn_lbl_name", "Tên bài học *")}</label>
                <input type="text" value={editingLesson.title} onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })} className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-1">{t("tch_lsn_lbl_desc", "Mô tả")}</label>
                <textarea value={editingLesson.description || ""} onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })} rows={3} className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-1">{t("tch_lsn_lbl_type", "Loại bài học")}</label>
                <div className="flex gap-2">
                  {LESSON_TYPES.map(({ value, label, icon: Icon }) => (
                    <button key={value} onClick={() => setEditingLesson({ ...editingLesson, type: value as Lesson["type"] })} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-smooth ${editingLesson.type === value ? "border-primary bg-primary/10 text-primary" : "border-border dark:border-slate-700 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"}`}><Icon size={16} />{label}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="editIsFree" checked={editingLesson.isFree} onChange={(e) => setEditingLesson({ ...editingLesson, isFree: e.target.checked })} className="w-4 h-4 rounded" />
                <label htmlFor="editIsFree" className="text-sm text-foreground dark:text-white">{t("tch_lsn_free_preview", "Bài học miễn phí (xem trước)")}</label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border dark:border-slate-700">
              <button onClick={() => setEditingLesson(null)} className="px-4 py-2 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800">{t("tch_lsn_cancel", "Hủy")}</button>
              <button onClick={handleUpdateLesson} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium disabled:opacity-60">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {t("tch_lsn_save", "Lưu thay đổi")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



