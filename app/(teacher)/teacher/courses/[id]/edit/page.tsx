"use client"

import { useState, use, useRef, useEffect } from "react"
import { Save, Plus, Trash2, Eye, FileText, Video, X, ChevronDown, Loader2, Send } from "lucide-react"
import { FileUploadZone } from "@/components/ui/file-upload-zone"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Section {
  id: string
  title: string
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  description: string
  videoFile?: File
  videoUrl?: string
  documentFile?: File
  documentUrl?: string
  documentName?: string
  quizzes: Quiz[]
}

interface Quiz {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

interface Category {
  id: string
  name: string
}

// Safely extract the first valid resource object from varied shapes (stringified JSON, object, array)
function parseFirstResource(resources: unknown): { url: string; name?: string } | null {
  let normalized: unknown = resources

  if (typeof normalized === "string") {
    try {
      normalized = JSON.parse(normalized)
    } catch {
      return null
    }
  }

  const list = Array.isArray(normalized)
    ? normalized
    : normalized && typeof normalized === "object"
    ? [normalized]
    : []

  for (const item of list) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const url = (item as Record<string, unknown>).url
      if (typeof url === "string" && url) {
        return item as { url: string; name?: string }
      }
    }
    if (Array.isArray(item)) {
      for (const nested of item) {
        if (nested && typeof nested === "object" && !Array.isArray(nested)) {
          const url = (nested as Record<string, unknown>).url
          if (typeof url === "string" && url) {
            return nested as { url: string; name?: string }
          }
        }
      }
    }
  }

  return null
}

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [courseStatus, setCourseStatus] = useState("draft")
  const [course, setCourse] = useState({
    title: "",
    description: "",
    categoryId: "",
    category: "",
    price: 0,
    thumbnail: "/placeholder.jpg",
  })

  const [sections, setSections] = useState<Section[]>([])
  
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)
  const [showAddLessonModal, setShowAddLessonModal] = useState(false)
  const [addLessonSectionId, setAddLessonSectionId] = useState<string | null>(null)
  const [newLessonData, setNewLessonData] = useState({ title: "", description: "" })
  const [newLessonFiles, setNewLessonFiles] = useState<File[]>([])
  const [newLessonQuizzes, setNewLessonQuizzes] = useState<Quiz[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({})
  const [draggedVideoZone, setDraggedVideoZone] = useState(false)
  const [draggedDocumentZone, setDraggedDocumentZone] = useState(false)
  const [uploadingVideoIds, setUploadingVideoIds] = useState<Set<string>>(new Set())
  const [uploadingDocIds, setUploadingDocIds] = useState<Set<string>>(new Set())
  const videoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const addLessonVideoInputRef = useRef<HTMLInputElement>(null)
  const addLessonDocumentInputRef = useRef<HTMLInputElement>(null)
  const [draggedAddVideoZone, setDraggedAddVideoZone] = useState(false)
  const [draggedAddDocumentZone, setDraggedAddDocumentZone] = useState(false)

  // Load course data from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        const headers: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {}

        const [courseRes, lessonsRes, catsRes] = await Promise.all([
          fetch(`/api/courses/${resolvedParams.id}`, { headers }),
          fetch(`/api/lessons/course/${resolvedParams.id}`, { headers }),
          fetch("/api/categories"),
        ])

        if (courseRes.ok) {
          const json = await courseRes.json()
          const data = json?.data ?? json
          setCourse({
            title: data.title || "",
            description: data.description || "",
            categoryId: data.categoryId || "",
            category: data.category?.name || "",
            price: data.price || 0,
            thumbnail: data.thumbnail || "/placeholder.jpg",
          })
          setCourseStatus(data.status || "draft")
        }

        if (lessonsRes.ok) {
          const lessonsJson = await lessonsRes.json()
          const lessonsUnwrapped = lessonsJson?.data ?? lessonsJson
          const lessonList = Array.isArray(lessonsUnwrapped)
            ? lessonsUnwrapped
            : Array.isArray(lessonsUnwrapped?.data)
            ? lessonsUnwrapped.data
            : []
          if (lessonList.length > 0) {
          // Group lessons by sectionTitle
          const sectionMap = new Map<string, typeof lessonList>()
          for (const l of lessonList) {
            const key = (l as { sectionTitle?: string }).sectionTitle || "Nội dung khóa học"
            if (!sectionMap.has(key)) sectionMap.set(key, [])
            sectionMap.get(key)!.push(l)
          }
          const reconstructedSections = Array.from(sectionMap.entries()).map(([title, lsns], idx) => ({
            id: `section-${idx}-${Date.now()}`,
            title,
            lessons: lsns
              .sort((a: { order?: number }, b: { order?: number }) => (a.order || 0) - (b.order || 0))
              .map((l: { id: string; title: string; description: string; videoUrl?: string; resources?: unknown[] }) => {
                const firstRes = parseFirstResource(l.resources)
                return {
                  id: l.id,
                  title: l.title,
                  description: l.description || "",
                  quizzes: [],
                  videoUrl: l.videoUrl,
                  documentUrl: firstRes?.url,
                  documentName: firstRes?.name,
                }
              }),
          }))
          setSections(reconstructedSections.length > 0 ? reconstructedSections : [])
          }
        }

        if (catsRes.ok) {
          const catsJson = await catsRes.json()
          const catsUnwrapped = catsJson?.data ?? catsJson
          setCategories(Array.isArray(catsUnwrapped) ? catsUnwrapped : catsUnwrapped?.data || [])
        }
      } catch (error) {
        console.error("Error loading course:", error)
        toast.error("Không thể tải thông tin khóa học")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id])

  // Auto-save state: keep for reference but noop
  useEffect(() => {
    // No-op: replaced by handleSaveCourse
  }, [])

  // Get all lessons from all sections for display
  const lessons = sections.flatMap(section => 
    section.lessons.map(lesson => ({
      ...lesson,
      sectionTitle: section.title
    }))
  )

  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      title: `Phần ${sections.length + 1}`,
      lessons: [],
    }
    setSections([...sections, newSection])
    setCurrentSectionId(newSection.id)
  }

  const updateSection = (id: string, title: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, title } : s)))
  }

  const deleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id))
    if (currentSectionId === id) setCurrentSectionId(null)
  }

  const addLesson = (sectionId: string) => {
    // Open modal instead of directly adding
    setAddLessonSectionId(sectionId)
    setNewLessonData({ title: "", description: "" })
    setNewLessonFiles([])
    setNewLessonQuizzes([])
    setShowAddLessonModal(true)
  }

  const handleAddLessonSubmit = () => {
    if (!newLessonData.title.trim()) {
      alert("Vui lòng nhập tên bài giảng")
      return
    }

    if (addLessonSectionId) {
      const newLessonId = Date.now().toString()
      setSections(
        sections.map((s) => {
          if (s.id === addLessonSectionId) {
            const newLesson: Lesson = {
              id: newLessonId,
              title: newLessonData.title,
              description: newLessonData.description,
              quizzes: newLessonQuizzes,
            }
            return { ...s, lessons: [...s.lessons, newLesson] }
          }
          return s
        }),
      )

      // Store files for the new lesson
      if (newLessonFiles.length > 0) {
        setUploadedFiles(prev => ({
          ...prev,
          [newLessonId]: newLessonFiles
        }))
      }

      // Reset and close modal
      setShowAddLessonModal(false)
      setNewLessonData({ title: "", description: "" })
      setNewLessonFiles([])
      setNewLessonQuizzes([])
    }
  }

  const addNewLessonQuiz = () => {
    const newQuiz: Quiz = {
      id: Date.now().toString(),
      question: "Câu hỏi mới",
      options: ["Tùy chọn 1", "Tùy chọn 2", "Tùy chọn 3", "Tùy chọn 4"],
      correctAnswer: 0,
    }
    setNewLessonQuizzes([...newLessonQuizzes, newQuiz])
  }

  const updateNewLessonQuiz = (quizId: string, updates: Partial<Quiz>) => {
    setNewLessonQuizzes(
      newLessonQuizzes.map((q) => (q.id === quizId ? { ...q, ...updates } : q))
    )
  }

  const deleteNewLessonQuiz = (quizId: string) => {
    setNewLessonQuizzes(newLessonQuizzes.filter((q) => q.id !== quizId))
  }

  // Helper functions for file type checking
  const isDocumentOrImage = (file: File): boolean => {
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
    const isImage = file.type.startsWith('image/')
    return isPdf || isImage
  }

  const getDocumentIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️'
    }
    return '📄'
  }

  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
          }
        }
        return s
      }),
    )
  }

  const deleteLesson = (sectionId: string, lessonId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
        }
        return s
      }),
    )
    if (currentLessonId === lessonId) setCurrentLessonId(null)
    if (expandedLessonId === lessonId) setExpandedLessonId(null)
  }

  const addQuiz = (lessonId: string) => {
    setSections(
      sections.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) => {
          if (l.id === lessonId) {
            const newQuiz: Quiz = {
              id: Date.now().toString(),
              question: "Câu hỏi mới",
              options: ["Tùy chọn 1", "Tùy chọn 2", "Tùy chọn 3", "Tùy chọn 4"],
              correctAnswer: 0,
            }
            return { ...l, quizzes: [...l.quizzes, newQuiz] }
          }
          return l
        }),
      }))
    )
  }

  const updateQuiz = (lessonId: string, quizId: string, updates: Partial<Quiz>) => {
    setSections(
      sections.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) => {
          if (l.id === lessonId) {
            return {
              ...l,
              quizzes: l.quizzes.map((q) => (q.id === quizId ? { ...q, ...updates } : q)),
            }
          }
          return l
        }),
      }))
    )
  }

  const deleteQuiz = (lessonId: string, quizId: string) => {
    setSections(
      sections.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) => {
          if (l.id === lessonId) {
            return { ...l, quizzes: l.quizzes.filter((q) => q.id !== quizId) }
          }
          return l
        }),
      }))
    )
  }

  const currentSection = sections.find((s) => s.id === currentSectionId)
  const currentLesson = sections.flatMap(s => s.lessons).find((l) => l.id === currentLessonId)
  const currentLessonFiles = uploadedFiles[currentLessonId || ''] || []

  const handleSaveCourse = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("auth_token")
      const authHeaders: Record<string, string> = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" }

      const res = await fetch(`/api/courses/${resolvedParams.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          title: course.title,
          description: course.description,
          price: course.price,
          ...(course.categoryId ? { categoryId: course.categoryId } : {}),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Lưu thất bại")
      }

      // Save lessons (new and existing) with sectionTitle and order
      for (const [, section] of sections.entries()) {
        for (const [lIdx, lesson] of section.lessons.entries()) {
          const isNewLesson = !/^[0-9a-f-]{36}$/.test(lesson.id)
          if (isNewLesson) {
            await fetch("/api/lessons", {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({
                title: lesson.title,
                description: lesson.description,
                courseId: resolvedParams.id,
                type: "video",
                isFree: false,
                isPublished: false,
                sectionTitle: section.title,
                order: lIdx,
              }),
            })
          } else {
            const patchRes = await fetch(`/api/lessons/${lesson.id}`, {
              method: "PATCH",
              headers: authHeaders,
              body: JSON.stringify({
                title: lesson.title,
                description: lesson.description,
                sectionTitle: section.title,
                order: lIdx,
                ...(lesson.videoUrl ? { videoUrl: lesson.videoUrl } : {}),
                // Always send resources to overwrite stale/malformed data in DB
                resources: lesson.documentUrl
                  ? [{ name: lesson.documentName || lesson.documentFile?.name || "Tài liệu", url: lesson.documentUrl }]
                  : [],
              }),
            })
            if (!patchRes.ok) {
              const err = await patchRes.json().catch(() => ({}))
              console.error(`[SaveCourse] PATCH lesson ${lesson.id} thất bại:`, err)
              throw new Error(`Lưu bài học "${lesson.title}" thất bại: ${err?.error?.message || err?.message || patchRes.status}`)
            }
          }
        }
      }

      // Re-fetch lessons từ API để đồng bộ state với DB
      const token2 = localStorage.getItem("auth_token")
      const headers2: Record<string, string> = token2 ? { Authorization: `Bearer ${token2}` } : {}
      const freshLessonsRes = await fetch(`/api/lessons/course/${resolvedParams.id}`, { headers: headers2 })
      if (freshLessonsRes.ok) {
        const lessonsJson = await freshLessonsRes.json()
        const lessonsUnwrapped = lessonsJson?.data ?? lessonsJson
        const lessonList = Array.isArray(lessonsUnwrapped) ? lessonsUnwrapped : Array.isArray(lessonsUnwrapped?.data) ? lessonsUnwrapped.data : []
        if (lessonList.length > 0) {
          const sectionMap = new Map<string, typeof lessonList>()
          for (const l of lessonList) {
            const key = (l as { sectionTitle?: string }).sectionTitle || "Nội dung khóa học"
            if (!sectionMap.has(key)) sectionMap.set(key, [])
            sectionMap.get(key)!.push(l)
          }
          const reconstructed = Array.from(sectionMap.entries()).map(([title, lsns], idx) => ({
            id: `section-${idx}-${Date.now()}`,
            title,
            lessons: (lsns as { id: string; title: string; description: string; videoUrl?: string; resources?: unknown[]; order?: number }[])
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(l => {
                const firstRes = parseFirstResource(l.resources)
                return {
                  id: l.id,
                  title: l.title,
                  description: l.description || "",
                  quizzes: [] as { id: string; question: string; options: string[]; correctAnswer: number }[],
                  videoUrl: l.videoUrl,
                  documentUrl: firstRes?.url,
                  documentName: firstRes?.name,
                }
              }),
          }))
          setSections(reconstructed)
        }
      }

      toast.success("Đã lưu khóa học thành công!")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitForReview = async () => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("auth_token")
      const res = await fetch(`/api/courses/${resolvedParams.id}/submit`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Đã xảy ra lỗi")
      setCourseStatus("pending")
      toast.success("Đã gửi khóa học để xét duyệt!")
    } catch {
      toast.error("Gửi duyệt thất bại")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVideoUpload = async (lessonId: string, file: File) => {
    setUploadingVideoIds(prev => new Set(prev).add(lessonId))
    setSections(prev => prev.map(s => ({
      ...s,
      lessons: s.lessons.map(l => l.id === lessonId ? { ...l, videoFile: file } : l)
    })))
    try {
      const token = localStorage.getItem("auth_token")
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/video", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (res.ok) {
        const result = await res.json()
        const url = result?.data?.url ?? result?.url ?? null
        if (url) {
          setSections(prev => prev.map(s => ({
            ...s,
            lessons: s.lessons.map(l => l.id === lessonId ? { ...l, videoUrl: url } : l)
          })))
          // Auto-save to DB immediately for existing lessons (UUID)
          const isExistingLesson = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId)
          if (isExistingLesson && token) {
            const patchRes = await fetch(`/api/lessons/${lessonId}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ videoUrl: url }),
            })
            if (!patchRes.ok) {
              console.error("[VideoUpload] auto-save thất bại:", await patchRes.json().catch(() => ({})))
              toast.warning("Video đã upload nhưng lưu vào DB thất bại, hãy nhấn Lưu khóa học")
            } else {
              toast.success("Upload video thành công!")
            }
          } else {
            toast.success("Upload video thành công!")
          }
        } else {
          console.error("[VideoUpload] res.ok nhưng không tìm thấy url trong response:", result)
          toast.error("Upload thành công nhưng không nhận được URL video")
        }
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(`Upload video thất bại: ${err?.error?.message || err?.message || res.status}`)
      }
    } catch (e) {
      console.error("[VideoUpload] exception:", e)
      toast.error("Không thể upload video")
    } finally {
      setUploadingVideoIds(prev => { const s = new Set(prev); s.delete(lessonId); return s })
    }
  }

  const handleDocumentUpload = async (lessonId: string, file: File) => {
    setUploadingDocIds(prev => new Set(prev).add(lessonId))
    setSections(prev => prev.map(s => ({
      ...s,
      lessons: s.lessons.map(l => l.id === lessonId ? { ...l, documentFile: file } : l)
    })))
    try {
      const token = localStorage.getItem("auth_token")
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/document", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (res.ok) {
        const result = await res.json()
        const url = result?.data?.url ?? result?.url ?? null
        if (url) {
          setSections(prev => prev.map(s => ({
            ...s,
            lessons: s.lessons.map(l => l.id === lessonId ? { ...l, documentUrl: url, documentName: file.name } : l)
          })))
          // Auto-save to DB immediately for existing lessons (UUID)
          const isExistingLesson = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId)
          if (isExistingLesson && token) {
            const patchRes = await fetch(`/api/lessons/${lessonId}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ resources: [{ name: file.name, url }] }),
            })
            if (!patchRes.ok) {
              console.error("[DocumentUpload] auto-save thất bại:", await patchRes.json().catch(() => ({})))
              toast.warning(`Tài liệu đã upload nhưng lưu vào DB thất bại, hãy nhấn Lưu khóa học`)
            } else {
              toast.success(`Tài liệu "${file.name}" đã được lưu!`)
            }
          } else {
            toast.success(`Tài liệu "${file.name}" đã tải lên!`)
          }
        } else {
          console.error("[DocumentUpload] res.ok nhưng không tìm thấy url trong response:", result)
          toast.error("Upload thành công nhưng không nhận được URL tài liệu")
        }
      } else {
        const err = await res.json().catch(() => ({}))
        console.error("[DocumentUpload] upload thất bại:", err)
        toast.error(`Upload tài liệu thất bại: ${err?.error?.message || err?.message || res.status}`)
      }
    } catch (e) {
      console.error("[DocumentUpload] exception:", e)
      toast.error("Không thể upload tài liệu")
    } finally {
      setUploadingDocIds(prev => { const s = new Set(prev); s.delete(lessonId); return s })
    }
  }
  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggedVideoZone(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('video/')) {
      handleVideoUpload(file)
    }
  }

  const handleDocumentDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggedDocumentZone(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      handleDocumentUpload(file)
    }
  }

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="w-full space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground dark:text-white">Chỉnh sửa khóa học</h1>
              <p className="text-muted-foreground dark:text-slate-400">Cập nhật thông tin và nội dung khóa học</p>
            </div>
            {courseStatus === "draft" && (
              <button
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-smooth disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Gửi duyệt
              </button>
            )}
            {courseStatus === "pending" && (
              <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium">Chờ duyệt</span>
            )}
            {courseStatus === "published" && (
              <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">Đã xuất bản</span>
            )}
          </div>

          {/* Course Info */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white">Thông tin khóa học</h2>

            <div>
              <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Tiêu đề</label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Mô tả</label>
              <textarea
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Danh mục</label>
                <select
                  value={course.categoryId}
                  onChange={(e) => setCourse({ ...course, categoryId: e.target.value })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-3">Giá khóa học</label>
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-primary dark:text-accent">
                    {course.price.toLocaleString("vi-VN")}
                  </span>
                  <span className="text-2xl font-semibold text-foreground dark:text-white ml-2">
                    VNĐ
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    placeholder="0"
                    value={course.price}
                    onChange={(e) => setCourse({ ...course, price: Number(e.target.value) })}
                    className="flex-1 px-4 py-3 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                  <div className="text-lg font-semibold text-foreground dark:text-white">
                    VNĐ
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Content - Removed, now integrated in lesson items */}

          {/* Lessons */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Bài giảng</h2>
              <button
                onClick={addSection}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-smooth flex items-center gap-2">
                <Plus size={18} /> Thêm phần mới
              </button>
            </div>

            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="border border-border dark:border-slate-800 rounded-xl overflow-hidden">
                  {/* Section header */}
                  <div className="flex items-center gap-3 bg-secondary dark:bg-slate-800 px-4 py-3">
                    <input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, e.target.value)}
                      className="flex-1 bg-transparent font-semibold text-foreground dark:text-white focus:outline-none"
                      placeholder="Tên phần..."
                    />
                    <button
                      onClick={() => addLesson(section.id)}
                      className="px-3 py-1.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent rounded-lg text-sm font-medium hover:bg-primary/20 transition-smooth flex items-center gap-1">
                      <Plus size={14} /> Thêm bài học
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg transition-smooth">
                      <Trash2 size={16} className="text-destructive" />
                    </button>
                  </div>
                  <div className="space-y-3 p-4">
                  {section.lessons.map((lesson) => {
                    const isExpanded = expandedLessonId === lesson.id
                
                return (
                  <div
                    key={lesson.id}
                    className={`bg-background dark:bg-slate-950 border-2 rounded-lg overflow-hidden transition-all duration-300 ${
                      isExpanded 
                        ? 'border-primary dark:border-accent shadow-lg shadow-primary/20' 
                        : 'border-border dark:border-slate-800'
                    }`}
                  >
                    {/* Header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary dark:hover:bg-slate-900 transition-smooth"
                      onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                    >
                      <div className="flex-1 flex items-center gap-3">
                        <ChevronDown 
                          size={20} 
                          className={`text-muted-foreground dark:text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-foreground dark:text-white">{lesson.title}</p>
                          <p className="text-sm text-muted-foreground dark:text-slate-400">
                            {lesson.description}
                          </p>
                          {/* Content Preview Badges */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {lesson.videoUrl && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
                                <Video size={12} /> Video
                              </span>
                            )}
                            {lesson.documentUrl && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded text-xs font-medium">
                                📄 {lesson.documentName || 'Tài liệu'}
                              </span>
                            )}
                            {lesson.quizzes.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded text-xs font-medium">
                                ❓ {lesson.quizzes.length} câu
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth">
                          
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteLesson(section.id, lesson.id)
                          }}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-smooth">
                          <Trash2 size={18} className="text-destructive" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="border-t border-border dark:border-slate-800 bg-card dark:bg-slate-900/60 p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300"
                        style={{
                          animation: 'slideDown 0.3s ease-out'
                        }}
                      >
                        {/* Video Upload */}
                        <div>
                          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                            Video bài học
                          </label>
                          {lesson.videoUrl && (
                            <div className="mb-3 rounded-lg overflow-hidden bg-black aspect-video">
                              <video src={lesson.videoUrl} controls className="w-full h-full" />
                            </div>
                          )}
                          <div
                            onDragOver={(e) => { e.preventDefault(); setDraggedVideoZone(true) }}
                            onDragLeave={() => setDraggedVideoZone(false)}
                            onDrop={(e) => {
                              e.preventDefault(); setDraggedVideoZone(false)
                              const file = e.dataTransfer.files?.[0]
                              if (file && file.type.startsWith('video/')) handleVideoUpload(lesson.id, file)
                            }}
                            onClick={() => { const inp = document.getElementById(`vid-inp-${lesson.id}`) as HTMLInputElement; inp?.click() }}
                            className={`border-2 border-dashed rounded-lg p-5 text-center transition-smooth cursor-pointer ${draggedVideoZone ? 'border-primary bg-primary/5' : 'border-border dark:border-slate-700 hover:border-primary'}`}
                          >
                            {uploadingVideoIds.has(lesson.id) ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 size={24} className="animate-spin text-primary dark:text-accent" />
                                <p className="text-sm text-muted-foreground">Đang tải lên...</p>
                              </div>
                            ) : lesson.videoUrl ? (
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Video đã tải lên — nhấn để thay thế</p>
                            ) : (
                              <>
                                <Video size={28} className="mx-auto text-muted-foreground mb-1" />
                                <p className="text-sm text-foreground dark:text-white">{lesson.videoFile ? lesson.videoFile.name : 'Kéo thả hoặc nhấn để chọn video'}</p>
                              </>
                            )}
                          </div>
                          <input id={`vid-inp-${lesson.id}`} type="file" accept="video/*" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(lesson.id, f); e.target.value = '' }}
                          />
                          {lesson.videoUrl && (
                            <button onClick={() => updateLesson(section.id, lesson.id, { videoUrl: undefined, videoFile: undefined })}
                              className="mt-2 text-xs text-destructive hover:underline">Xóa video</button>
                          )}
                        </div>

                        {/* Document Upload */}
                        <div>
                          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                            Tài liệu bổ sung
                          </label>
                          {lesson.documentUrl && (
                            <div className="mb-3 flex items-center gap-3 p-3 bg-secondary dark:bg-slate-800 rounded-lg border border-border dark:border-slate-700">
                              <FileText size={20} className="text-primary dark:text-accent flex-shrink-0" />
                              <a href={lesson.documentUrl} target="_blank" rel="noreferrer"
                                className="text-sm text-primary dark:text-accent hover:underline truncate flex-1"
                                onClick={(e) => e.stopPropagation()}>
                                {lesson.documentName || 'Xem tài liệu'}
                              </a>
                            </div>
                          )}
                          <div
                            onDragOver={(e) => { e.preventDefault(); setDraggedDocumentZone(true) }}
                            onDragLeave={() => setDraggedDocumentZone(false)}
                            onDrop={(e) => {
                              e.preventDefault(); setDraggedDocumentZone(false)
                              const file = e.dataTransfer.files?.[0]
                              if (file) handleDocumentUpload(lesson.id, file)
                            }}
                            onClick={() => { const inp = document.getElementById(`doc-inp-${lesson.id}`) as HTMLInputElement; inp?.click() }}
                            className={`border-2 border-dashed rounded-lg p-5 text-center transition-smooth cursor-pointer ${draggedDocumentZone ? 'border-primary bg-primary/5' : 'border-border dark:border-slate-700 hover:border-primary'}`}
                          >
                            {uploadingDocIds.has(lesson.id) ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 size={24} className="animate-spin text-primary dark:text-accent" />
                                <p className="text-sm text-muted-foreground">Đang tải lên...</p>
                              </div>
                            ) : lesson.documentUrl ? (
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Tài liệu đã tải lên — nhấn để thay thế</p>
                            ) : (
                              <>
                                <FileText size={28} className="mx-auto text-muted-foreground mb-1" />
                                <p className="text-sm text-foreground dark:text-white">{lesson.documentFile ? lesson.documentFile.name : 'Kéo thả hoặc nhấn để chọn tài liệu (PDF, Word...)'}</p>
                              </>
                            )}
                          </div>
                          <input id={`doc-inp-${lesson.id}`} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocumentUpload(lesson.id, f); e.target.value = '' }}
                          />
                          {lesson.documentUrl && (
                            <button onClick={() => updateLesson(section.id, lesson.id, { documentUrl: undefined, documentFile: undefined, documentName: undefined })}
                              className="mt-2 text-xs text-destructive hover:underline">Xóa tài liệu</button>
                          )}
                        </div>

                        {/* Quiz Section */}
                        <div className="border-t border-border dark:border-slate-800 pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-semibold text-foreground dark:text-white">Câu hỏi cho bài học này</h5>
                            <button
                              onClick={() => addQuiz(lesson.id)}
                              className="flex items-center gap-2 px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent rounded-lg text-sm font-medium hover:bg-primary/20 dark:hover:bg-primary/30 transition-smooth"
                            >
                              <Plus size={16} />
                              Thêm câu hỏi
                            </button>
                          </div>

                          {lesson.quizzes.length === 0 ? (
                            <p className="text-sm text-muted-foreground dark:text-slate-400">Chưa có câu hỏi nào</p>
                          ) : (
                            <div className="space-y-3">
                              {lesson.quizzes.map((quiz) => (
                                <div key={quiz.id} className="p-3 bg-background dark:bg-slate-950 rounded-lg border border-border dark:border-slate-800">
                                  <div className="flex items-start justify-between mb-2">
                                    <input
                                      type="text"
                                      value={quiz.question}
                                      onChange={(e) => updateQuiz(lesson.id, quiz.id, { question: e.target.value })}
                                      className="flex-1 px-2 py-1 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-foreground dark:text-white text-sm"
                                    />
                                    <button
                                      onClick={() => deleteQuiz(lesson.id, quiz.id)}
                                      className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded transition-smooth"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                  <div className="space-y-1">
                                    {quiz.options.map((option, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          name={`correct-${quiz.id}`}
                                          checked={quiz.correctAnswer === idx}
                                          onChange={() => updateQuiz(lesson.id, quiz.id, { correctAnswer: idx })}
                                          className="w-4 h-4"
                                        />
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => {
                                            const newOptions = [...quiz.options]
                                            newOptions[idx] = e.target.value
                                            updateQuiz(lesson.id, quiz.id, { options: newOptions })
                                          }}
                                          className="flex-1 px-2 py-1 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-foreground dark:text-white text-sm"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
                  })}
                  {section.lessons.length === 0 && (
                    <p className="text-sm text-muted-foreground dark:text-slate-400 text-center py-4">
                      Chưa có bài học nào trong phần này
                    </p>
                  )}
                  </div>
                </div>
              ))}
              {sections.length === 0 && (
                <p className="text-sm text-muted-foreground dark:text-slate-400 text-center py-8">
                  Chưa có phần nào. Nhấn &quot;Thêm phần mới&quot; để bắt đầu.
                </p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSaveCourse}
            disabled={isSaving}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-60">
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>

          {/* Add Lesson Modal */}
          {showAddLessonModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border dark:border-slate-700 sticky top-0 bg-card dark:bg-slate-900">
                  <h4 className="text-lg font-semibold text-foreground dark:text-white">Thêm bài giảng mới</h4>
                  <button
                    onClick={() => setShowAddLessonModal(false)}
                    className="p-1 text-muted-foreground dark:text-slate-400 hover:bg-secondary dark:hover:bg-slate-800 rounded transition-smooth"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Lesson Title */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Tên bài giảng <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLessonData.title}
                      onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })}
                      placeholder="Nhập tên bài giảng"
                      className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    />
                  </div>

                  {/* Lesson Description */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Mô tả bài giảng
                    </label>
                    <textarea
                      value={newLessonData.description}
                      onChange={(e) => setNewLessonData({ ...newLessonData, description: e.target.value })}
                      placeholder="Nhập mô tả chi tiết về bài giảng"
                      rows={3}
                      className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    />
                  </div>

                  {/* Video Upload */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Tải video
                    </label>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDraggedAddVideoZone(true)
                      }}
                      onDragLeave={() => setDraggedAddVideoZone(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDraggedAddVideoZone(false)
                        const file = e.dataTransfer.files?.[0]
                        if (file && file.type.startsWith('video/')) {
                          setNewLessonFiles([...newLessonFiles, file])
                        }
                      }}
                      onClick={() => addLessonVideoInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-smooth cursor-pointer ${
                        draggedAddVideoZone
                          ? 'border-primary dark:border-accent bg-primary/5 dark:bg-primary/10'
                          : 'border-border dark:border-slate-700 hover:border-primary dark:hover:border-accent'
                      }`}
                    >
                      <Video size={32} className="mx-auto text-muted-foreground dark:text-slate-400 mb-2" />
                      <p className="text-foreground dark:text-white font-medium">Kéo thả video vào đây</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400">Hoặc nhấn để chọn tệp</p>
                    </div>
                    <input
                      ref={addLessonVideoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setNewLessonFiles([...newLessonFiles, file])
                        }
                      }}
                      className="hidden"
                    />

                    {/* Video Files List */}
                    {newLessonFiles.filter(f => f.type.startsWith('video/')).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-foreground dark:text-white">Video đã tải lên:</p>
                        {newLessonFiles.filter(f => f.type.startsWith('video/')).map((file, i) => (
                          <div key={`video-${i}`} className="flex items-center justify-between p-2 bg-background dark:bg-slate-950 rounded border border-border dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-1">
                              <Video size={14} className="text-primary dark:text-accent flex-shrink-0" />
                              <span className="text-xs text-foreground dark:text-white truncate">{file.name}</span>
                            </div>
                            <button onClick={() => setNewLessonFiles(newLessonFiles.filter(f => f !== file))} className="text-destructive hover:text-destructive/80 flex-shrink-0 ml-2">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Document Upload */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Tài liệu bổ sung
                    </label>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDraggedAddDocumentZone(true)
                      }}
                      onDragLeave={() => setDraggedAddDocumentZone(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDraggedAddDocumentZone(false)
                        const file = e.dataTransfer.files?.[0]
                        if (file && isDocumentOrImage(file)) {
                          setNewLessonFiles([...newLessonFiles, file])
                        }
                      }}
                      onClick={() => addLessonDocumentInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-smooth cursor-pointer ${
                        draggedAddDocumentZone
                          ? 'border-primary dark:border-accent bg-primary/5 dark:bg-primary/10'
                          : 'border-border dark:border-slate-700 hover:border-primary dark:hover:border-accent'
                      }`}
                    >
                      <FileText size={32} className="mx-auto text-muted-foreground dark:text-slate-400 mb-2" />
                      <p className="text-foreground dark:text-white font-medium">Kéo thả tài liệu/hình ảnh vào đây</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400">PDF, JPG, PNG, v.v...</p>
                    </div>
                    <input
                      ref={addLessonDocumentInputRef}
                      type="file"
                      accept=".pdf,application/pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && isDocumentOrImage(file)) {
                          setNewLessonFiles([...newLessonFiles, file])
                        }
                      }}
                      className="hidden"
                    />

                    {/* Document Files List */}
                    {newLessonFiles.filter(f => isDocumentOrImage(f)).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-foreground dark:text-white">Tài liệu đã tải lên:</p>
                        {newLessonFiles.filter(f => isDocumentOrImage(f)).map((file, i) => (
                          <div key={`doc-${i}`} className="flex items-center justify-between p-2 bg-background dark:bg-slate-950 rounded border border-border dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-1">
                              {file.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(file)} alt={file.name} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                              ) : (
                                <FileText size={14} className="text-primary dark:text-accent flex-shrink-0" />
                              )}
                              <span className="text-xs text-foreground dark:text-white truncate">{file.name}</span>
                            </div>
                            <button onClick={() => setNewLessonFiles(newLessonFiles.filter(f => f !== file))} className="text-destructive hover:text-destructive/80 flex-shrink-0 ml-2">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quiz Section */}
                  <div className="border-t border-border dark:border-slate-800 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-foreground dark:text-white">Câu hỏi cho bài học này</h5>
                      <button
                        onClick={addNewLessonQuiz}
                        className="flex items-center gap-2 px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent rounded-lg text-sm font-medium hover:bg-primary/20 dark:hover:bg-primary/30 transition-smooth"
                      >
                        <Plus size={16} />
                        Thêm câu hỏi
                      </button>
                    </div>

                    {newLessonQuizzes.length === 0 ? (
                      <p className="text-sm text-muted-foreground dark:text-slate-400">Chưa có câu hỏi nào</p>
                    ) : (
                      <div className="space-y-3">
                        {newLessonQuizzes.map((quiz) => (
                          <div key={quiz.id} className="p-3 bg-background dark:bg-slate-950 rounded-lg border border-border dark:border-slate-800">
                            <div className="flex items-start justify-between mb-2">
                              <input
                                type="text"
                                value={quiz.question}
                                onChange={(e) => updateNewLessonQuiz(quiz.id, { question: e.target.value })}
                                className="flex-1 px-2 py-1 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-foreground dark:text-white text-sm"
                              />
                              <button
                                onClick={() => deleteNewLessonQuiz(quiz.id)}
                                className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded transition-smooth"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="space-y-1">
                              {quiz.options.map((option, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-new-${quiz.id}`}
                                    checked={quiz.correctAnswer === idx}
                                    onChange={() => updateNewLessonQuiz(quiz.id, { correctAnswer: idx })}
                                    className="w-4 h-4"
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...quiz.options]
                                      newOptions[idx] = e.target.value
                                      updateNewLessonQuiz(quiz.id, { options: newOptions })
                                    }}
                                    className="flex-1 px-2 py-1 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-foreground dark:text-white text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-border dark:border-slate-700 sticky bottom-0 bg-card dark:bg-slate-900">
                  <button
                    onClick={() => setShowAddLessonModal(false)}
                    className="px-6 py-2 border border-border dark:border-slate-800 rounded-lg font-medium text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAddLessonSubmit}
                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth"
                  >
                    Thêm bài giảng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
