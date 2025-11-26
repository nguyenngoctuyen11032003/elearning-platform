"use client"

import { useState, use } from "react"
import { Save, Plus, Trash2, Eye, FileText, Video } from "lucide-react"
import { FileUploadZone } from "@/components/ui/file-upload-zone"

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
  const resolvedParams = use(params)
  const [course, setCourse] = useState({
    title: "Lập trình Next.js từ cơ bản đến nâng cao",
    description: "Khóa học toàn diện về Next.js từ cơ bản đến nâng cao, bao gồm các tính năng mới nhất và best practices trong phát triển ứng dụng web hiện đại.",
    category: "Lập trình",
    price: 499000,
    thumbnail: "/next-js-course.jpg",
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

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
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          const newLesson: Lesson = {
            id: Date.now().toString(),
            title: `Bài học ${s.lessons.length + 1}`,
            description: "",
            quizzes: [],
          }
          return { ...s, lessons: [...s.lessons, newLesson] }
        }
        return s
      }),
    )
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
  }

  const currentSection = sections.find((s) => s.id === currentSectionId)
  const currentLesson = currentSection?.lessons.find((l) => l.id === currentLessonId)

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
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
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Giá (VND)</label>
                <input
                  type="number"
                  value={course.price}
                  onChange={(e) => setCourse({ ...course, price: Number.parseInt(e.target.value) })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Upload Content */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white">Tải lên nội dung</h2>
            <FileUploadZone onFilesSelected={setUploadedFiles} />

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground dark:text-white">Tệp đã tải lên:</p>
                {uploadedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-background dark:bg-slate-950 rounded-lg"
                  >
                    <span className="text-sm text-foreground dark:text-white">{file.name}</span>
                    <button className="text-destructive hover:text-destructive/80">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lessons */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Bài giảng</h2>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-smooth flex items-center gap-2">
                <Plus size={18} /> Thêm bài giảng
              </button>
            </div>

            <div className="space-y-2">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 rounded-lg border border-border dark:border-slate-800"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground dark:text-white">{lesson.title}</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">
                      {lesson.sectionTitle} • {lesson.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth">
                      <Eye size={18} className="text-muted-foreground dark:text-slate-400" />
                    </button>
                    <button className="p-2 hover:bg-destructive/10 rounded-lg transition-smooth">
                      <Trash2 size={18} className="text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2">
            <Save size={20} /> Lưu thay đổi
          </button>
        </div>
      </div>
    )
}
