"use client"

import { useState, use, useRef, useEffect } from "react"
import { Save, Plus, Trash2, Eye, FileText, Video, X, ChevronDown } from "lucide-react"
import { FileUploadZone } from "@/components/ui/file-upload-zone"
import { useRouter } from "next/navigation"

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
  documentFile?: File
  quizzes: Quiz[]
}

interface Quiz {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [course, setCourse] = useState({
    title: "Lập trình Next.js từ cơ bản đến nâng cao",
    description: "Khóa học toàn diện về Next.js từ cơ bản đến nâng cao, bao gồm các tính năng mới nhất và best practices trong phát triển ứng dụng web hiện đại.",
    category: "Lập trình",
    price: 499000,
    thumbnail: "/placeholder.jpg",
  })

  const [sections, setSections] = useState<Section[]>([
    {
      id: "1",
      title: "Giới thiệu và Cài đặt",
      lessons: [
        { id: "1", title: "Giới thiệu Next.js", description: "Tổng quan về Next.js và ưu điểm", quizzes: [] },
        { id: "2", title: "Setup Project", description: "Cài đặt dự án mới với Next.js", quizzes: [] }
      ]
    },
    {
      id: "2", 
      title: "Routing và Pages",
      lessons: [
        { id: "3", title: "Routing & Pages", description: "Hệ thống routing trong Next.js", quizzes: [] },
        { id: "4", title: "Dynamic Routes", description: "Tạo dynamic routes", quizzes: [] }
      ]
    }
  ])
  
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
  const videoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const addLessonVideoInputRef = useRef<HTMLInputElement>(null)
  const addLessonDocumentInputRef = useRef<HTMLInputElement>(null)
  const [draggedAddVideoZone, setDraggedAddVideoZone] = useState(false)
  const [draggedAddDocumentZone, setDraggedAddDocumentZone] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedCourseData = localStorage.getItem(`course-${resolvedParams.id}`)
    if (savedCourseData) {
      try {
        const data = JSON.parse(savedCourseData)
        setCourse(data.course || course)
        setSections(data.sections || sections)
        // Note: Files cannot be stored in localStorage (they are File objects)
        // So we initialize uploadedFiles as empty
      } catch (error) {
        console.error('Error loading course data:', error)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id])

  // Auto-save to localStorage whenever course or sections change
  useEffect(() => {
    const autoSaveData = {
      course,
      sections,
    }
    localStorage.setItem(`course-${resolvedParams.id}`, JSON.stringify(autoSaveData))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, sections, resolvedParams.id])

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
    try {
      const courseData = {
        id: resolvedParams.id,
        ...course,
        sections: sections.map(section => ({
          ...section,
          lessons: section.lessons.map(lesson => ({
            ...lesson,
            // Files are stored separately in uploadedFiles state
          }))
        })),
        uploadedFiles: uploadedFiles
      }

      // Save to localStorage for now
      localStorage.setItem(`course-${resolvedParams.id}`, JSON.stringify(courseData))
      
      // Show success message
      alert('Khóa học đã được lưu thành công!')
      
      // Optional: Navigate back to courses list
      // router.push('/teacher/courses')
    } catch (error) {
      console.error('Error saving course:', error)
      alert('Có lỗi xảy ra khi lưu khóa học!')
    }
  }

  const handleVideoUpload = (file: File) => {
    if (currentLessonId) {
      setUploadedFiles(prev => ({
        ...prev,
        [currentLessonId]: [...(prev[currentLessonId] || []), file]
      }))
    }
  }

  const handleDocumentUpload = (file: File) => {
    if (currentLessonId) {
      setUploadedFiles(prev => ({
        ...prev,
        [currentLessonId]: [...(prev[currentLessonId] || []), file]
      }))
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
      <div className="w-full space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Chỉnh sửa khóa học</h1>
            <p className="text-muted-foreground dark:text-slate-400">Cập nhật thông tin và nội dung khóa học</p>
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
                <select className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent">
                  <option>Lập trình</option>
                  <option>Thiết kế</option>
                  <option>Kinh doanh</option>
                  <option>AI & Data</option>
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
                onClick={() => setShowAddLessonModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-smooth flex items-center gap-2">
                <Plus size={18} /> Thêm bài giảng
              </button>
            </div>

            <div className="space-y-3">
              {lessons.map((lesson) => {
                const sectionId = sections.find(s => s.title === lesson.sectionTitle)?.id || ''
                const isExpanded = expandedLessonId === lesson.id
                const lessonFiles = uploadedFiles[lesson.id] || []
                
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
                            {lessonFiles.some(f => f.type.startsWith('video/')) && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
                                <Video size={12} /> Video
                              </span>
                            )}
                            {lessonFiles.some(f => f.type.startsWith('image/')) && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded text-xs font-medium">
                                🖼️ Hình ảnh
                              </span>
                            )}
                            {lessonFiles.some(f => f.type === 'application/pdf' || f.name.endsWith('.pdf')) && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded text-xs font-medium">
                                📄 PDF
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
                            deleteLesson(sectionId, lesson.id)
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
                            Tải video
                          </label>
                          <div
                            onDragOver={(e) => {
                              e.preventDefault()
                              setDraggedVideoZone(true)
                            }}
                            onDragLeave={() => setDraggedVideoZone(false)}
                            onDrop={(e) => {
                              e.preventDefault()
                              setDraggedVideoZone(false)
                              const file = e.dataTransfer.files?.[0]
                              if (file && file.type.startsWith('video/')) {
                                setUploadedFiles(prev => ({
                                  ...prev,
                                  [lesson.id]: [...(prev[lesson.id] || []), file]
                                }))
                              }
                            }}
                            onClick={() => videoInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-smooth cursor-pointer ${
                              draggedVideoZone
                                ? 'border-primary dark:border-accent bg-primary/5 dark:bg-primary/10'
                                : 'border-border dark:border-slate-700 hover:border-primary dark:hover:border-accent'
                            }`}
                          >
                            <Video size={32} className="mx-auto text-muted-foreground dark:text-slate-400 mb-2" />
                            {lessonFiles.some(f => f.type.startsWith('video/')) ? (
                              <>
                                <p className="text-foreground dark:text-white font-medium text-green-600 dark:text-green-400">
                                  ✓ {lessonFiles.find(f => f.type.startsWith('video/'))?.name}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-slate-400 mt-2">
                                  {((lessonFiles.find(f => f.type.startsWith('video/'))?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setUploadedFiles(prev => ({
                                      ...prev,
                                      [lesson.id]: (prev[lesson.id] || []).filter(f => !f.type.startsWith('video/'))
                                    }))
                                  }}
                                  className="mt-2 text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-smooth"
                                >
                                  Xóa tệp
                                </button>
                              </>
                            ) : (
                              <>
                                <p className="text-foreground dark:text-white font-medium">Kéo thả video vào đây</p>
                                <p className="text-sm text-muted-foreground dark:text-slate-400">Hoặc nhấn để chọn tệp</p>
                              </>
                            )}
                          </div>
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setUploadedFiles(prev => ({
                                  ...prev,
                                  [lesson.id]: [...(prev[lesson.id] || []), file]
                                }))
                              }
                            }}
                            className="hidden"
                          />
                          
                          {/* Video Files List */}
                          {lessonFiles.filter(f => f.type.startsWith('video/')).length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-semibold text-foreground dark:text-white">Video đã tải lên:</p>
                              {lessonFiles.filter(f => f.type.startsWith('video/')).map((file, i) => (
                                <div key={`video-${lesson.id}-${i}`} className="flex items-center justify-between p-2 bg-background dark:bg-slate-950 rounded border border-border dark:border-slate-800">
                                  <div className="flex items-center gap-2 flex-1">
                                    <Video size={14} className="text-primary dark:text-accent flex-shrink-0" />
                                    <span className="text-xs text-foreground dark:text-white truncate">{file.name}</span>
                                  </div>
                                  <button onClick={() => setUploadedFiles(prev => ({
                                    ...prev,
                                    [lesson.id]: (prev[lesson.id] || []).filter(f => f !== file)
                                  }))} className="text-destructive hover:text-destructive/80 flex-shrink-0 ml-2">
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
                              setDraggedDocumentZone(true)
                            }}
                            onDragLeave={() => setDraggedDocumentZone(false)}
                            onDrop={(e) => {
                              e.preventDefault()
                              setDraggedDocumentZone(false)
                              const file = e.dataTransfer.files?.[0]
                              if (file && isDocumentOrImage(file)) {
                                setUploadedFiles(prev => ({
                                  ...prev,
                                  [lesson.id]: [...(prev[lesson.id] || []), file]
                                }))
                              }
                            }}
                            onClick={() => documentInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-smooth cursor-pointer ${
                              draggedDocumentZone
                                ? 'border-primary dark:border-accent bg-primary/5 dark:bg-primary/10'
                                : 'border-border dark:border-slate-700 hover:border-primary dark:hover:border-accent'
                            }`}
                          >
                            <FileText size={32} className="mx-auto text-muted-foreground dark:text-slate-400 mb-2" />
                            {lessonFiles.some(f => isDocumentOrImage(f)) ? (
                              <>
                                <p className="text-foreground dark:text-white font-medium text-green-600 dark:text-green-400">
                                  ✓ {lessonFiles.find(f => isDocumentOrImage(f))?.name}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-slate-400 mt-2">
                                  {((lessonFiles.find(f => isDocumentOrImage(f))?.size || 0) / 1024).toFixed(2)} KB
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setUploadedFiles(prev => ({
                                      ...prev,
                                      [lesson.id]: (prev[lesson.id] || []).filter(f => !isDocumentOrImage(f))
                                    }))
                                  }}
                                  className="mt-2 text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-smooth"
                                >
                                  Xóa tệp
                                </button>
                              </>
                            ) : (
                              <>
                                <p className="text-foreground dark:text-white font-medium">Kéo thả tài liệu vào đây</p>
                                <p className="text-sm text-muted-foreground dark:text-slate-400">Hoặc nhấn để chọn tệp</p>
                              </>
                            )}
                          </div>
                          <input
                            ref={documentInputRef}
                            type="file"
                            accept=".pdf,application/pdf,image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file && isDocumentOrImage(file)) {
                                setUploadedFiles(prev => ({
                                  ...prev,
                                  [lesson.id]: [...(prev[lesson.id] || []), file]
                                }))
                              }
                            }}
                            className="hidden"
                          />
                          
                          {/* Document Files List */}
                          {lessonFiles.filter(f => isDocumentOrImage(f)).length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-semibold text-foreground dark:text-white">Tài liệu đã tải lên:</p>
                              {lessonFiles.filter(f => isDocumentOrImage(f)).map((file, i) => (
                                <div key={`doc-${lesson.id}-${i}`} className="flex items-center justify-between p-2 bg-background dark:bg-slate-950 rounded border border-border dark:border-slate-800">
                                  <div className="flex items-center gap-2 flex-1">
                                    {file.type.startsWith('image/') ? (
                                      <img src={URL.createObjectURL(file)} alt={file.name} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                                    ) : (
                                      <FileText size={14} className="text-primary dark:text-accent flex-shrink-0" />
                                    )}
                                    <span className="text-xs text-foreground dark:text-white truncate">{file.name}</span>
                                  </div>
                                  <button onClick={() => setUploadedFiles(prev => ({
                                    ...prev,
                                    [lesson.id]: (prev[lesson.id] || []).filter(f => f !== file)
                                  }))} className="text-destructive hover:text-destructive/80 flex-shrink-0 ml-2">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
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
            </div>
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSaveCourse}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2">
            <Save size={20} /> Lưu thay đổi
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
      </div>
    )
}
